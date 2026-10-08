"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewMessageForPropertyDialog from "@/components/analysis/settings/message-for-property/add-message-for-property";
import DisplayMessageForPropertyDialog from "@/components/analysis/settings/message-for-property/display-message-for-property";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SETTINGS_DELETE_TRIGGER_CLASS,
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
  SettingsPageShell,
} from "@/components/system-settings/shared";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = [
  "القسم",
  "البند",
  "الرسالة",
  { label: "الإجراءات", className: "text-left" },
];

export default function PropertyTermsPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data: alertsResponse, isLoading } = useQuery({
    queryKey: ["message-alerts-property"],
    queryFn: () => axiosInstance.get("/admin/message-alerts/property").then((res) => res.data),
  });

  const alerts = alertsResponse?.data?.items || alertsResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await axiosInstance.post(`/admin/message-alerts/property/${id}/delete`);
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 405) {
          return await axiosInstance.delete(`/admin/message-alerts/property/${id}`);
        }
        throw e;
      }
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف الرسالة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["message-alerts-property"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف الرسالة");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="رسائل توضيحية للعقار"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="create">
            <AddNewMessageForPropertyDialog isEdit={false} />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="860px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={4} />
        ) : alerts.length === 0 ? (
          <SettingsEmptyRow colSpan={4} />
        ) : (
          alerts.map((item) => (
            <SettingsTableRow key={item.id}>
              <SettingsTd>{item.section?.name_ar || "بدون قسم"}</SettingsTd>
              <SettingsTd>{item.section_item?.name_ar || item?.message || "بدون بند"}</SettingsTd>
              <SettingsTd className="max-w-[320px]">
                <p className="line-clamp-2">{item?.message || "—"}</p>
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <DisplayMessageForPropertyDialog messageAlert={item} />
                  <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="edit">
                    <AddNewMessageForPropertyDialog isEdit messageAlert={item} />
                  </PermissionGate>
                  <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="delete">
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={async () => { if (await confirm({ title: "تأكيد الحذف", description: "حذف هذا العنصر نهائياً؟ لا يمكن التراجع.", confirmLabel: "حذف", destructive: true })) deleteMutation.mutate(item.id); }}
                      className={SETTINGS_DELETE_TRIGGER_CLASS}
                    >
                      حذف
                    </button>
                  </PermissionGate>
                </div>
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>
    </SettingsPageShell>
  );
}
