"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import { useState } from "react";
import AddCouponDialog from "@/components/analysis/settings/coupons/add-coupon-dialog";
import DeleteCouponDialog from "@/components/analysis/settings/coupons/delete-coupon-dialog";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsPagination,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
  StatusBadge,
  SettingsPageShell,
} from "@/components/system-settings/shared";
import { Switch } from "@/components/ui/switch";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = [
  "الاسم",
  "الكود",
  { label: "النوع", className: "text-center" },
  { label: "القيمة", className: "text-center" },
  { label: "البداية", className: "text-center" },
  { label: "النهاية", className: "text-center" },
  { label: "الحالة", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function couponTypeLabel(type) {
  if (type === "ratio" || type === "percentage") return "نسبة مئوية";
  return "مبلغ ثابت";
}

export default function CouponsPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: serverCouponsData, isLoading } = useQuery({
    queryKey: ["coupons", currentPage],
    queryFn: () => axiosInstance.get(`/admin/coupons?page=${currentPage}`).then((res) => res?.data),
  });

  const displayCoupons = serverCouponsData?.data?.items || serverCouponsData?.items || [];
  const pagination = serverCouponsData?.data?.pagination || serverCouponsData?.pagination;

  const { mutate: toggleStatus, isPending: isToggling } = useMutation({
    mutationFn: ({ id, checked }) => {
      const actionPath = checked ? "activate" : "inactive";
      return axiosInstance.post(`/admin/coupons/${id}/${actionPath}`);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم تحديث حالة الخصم بنجاح");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء تغيير حالة الخصم");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="الخصومات (الكوبونات)"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.coupons} action="create">
            <AddCouponDialog />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="980px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={8} />
        ) : displayCoupons.length === 0 ? (
          <SettingsEmptyRow colSpan={8} />
        ) : (
          displayCoupons.map((coupon) => {
            const type = coupon.type_coupon || coupon.type || "value";
            const isActive =
              typeof coupon.is_active === "boolean"
                ? coupon.is_active
                : coupon.is_active === 1 || coupon.is_active === "1";
            const value = coupon.value_coupon || coupon.value || 0;
            const isPercentage = type === "ratio" || type === "percentage";

            return (
              <SettingsTableRow key={coupon.id}>
                <SettingsTd>{coupon.name}</SettingsTd>
                <SettingsTd className="font-mono" dir="ltr">
                  {coupon.code_coupon || coupon.code || "—"}
                </SettingsTd>
                <SettingsTd className="text-center">{couponTypeLabel(type)}</SettingsTd>
                <SettingsTd className="text-center tabular-nums">
                  {isPercentage ? `${value}%` : value}
                </SettingsTd>
                <SettingsTd className="text-center">
                  {formatDate(coupon.date_start || coupon.start_date)}
                </SettingsTd>
                <SettingsTd className="text-center">
                  {formatDate(coupon.date_end || coupon.end_date)}
                </SettingsTd>
                <SettingsTd className="text-center">
                  <div className="inline-flex items-center gap-2">
                    <StatusBadge active={isActive} />
                    <PermissionGate
                      section={PERMISSION_SECTIONS.coupons}
                      action="edit"
                      fallback={<Switch dir="ltr" checked={isActive} disabled />}
                    >
                      <Switch
                        dir="ltr"
                        checked={isActive}
                        disabled={isToggling}
                        onCheckedChange={async (checked) => {
                          const ok = await confirm({
                            title: checked ? "تفعيل الكوبون" : "إيقاف الكوبون",
                            description: `${checked ? "تفعيل" : "إيقاف"} الكوبون «${coupon.code ?? coupon.name ?? ""}»؟`,
                            confirmLabel: checked ? "تفعيل" : "إيقاف",
                            destructive: !checked,
                          });
                          if (ok) toggleStatus({ id: coupon.id, checked });
                        }}
                      />
                    </PermissionGate>
                  </div>
                </SettingsTd>
                <SettingsTd>
                  <div className="flex items-center justify-end gap-2">
                    <PermissionGate section={PERMISSION_SECTIONS.coupons} action="edit">
                      <AddCouponDialog isEdit coupon={coupon} />
                    </PermissionGate>
                    <PermissionGate section={PERMISSION_SECTIONS.coupons} action="delete">
                      <DeleteCouponDialog coupon={coupon} />
                    </PermissionGate>
                  </div>
                </SettingsTd>
              </SettingsTableRow>
            );
          })
        )}
      </SettingsTable>

      <SettingsPagination
        page={currentPage}
        lastPage={pagination?.last_page}
        onPageChange={setCurrentPage}
      />
    </SettingsPageShell>
  );
}
