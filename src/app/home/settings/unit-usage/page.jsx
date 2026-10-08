"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewUsageDialog from "@/components/analysis/settings/unit-usage/add-new-usage-dialog";
import EditUsageUnitDialog from "@/components/analysis/settings/unit-usage/edit-usage-unit-dialog";
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
import {
  contractTypeLabel,
  extractItems,
  fetchBothContractTypes,
} from "@/components/system-settings/settings-list/fetch-contract-type-lists";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = [
  "الاسم",
  { label: "تصنيف الوحدة", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

export default function UnitUsagePage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["unit-usages"],
    queryFn: () => fetchBothContractTypes("/admin/unit-usages", extractItems),
  });

  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: (id) => axiosInstance.post(`/admin/unit-usages/${id}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف استخدام الوحدة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["unit-usages"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف استخدام الوحدة");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="استخدام الوحدة"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="create">
            <AddNewUsageDialog />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="640px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={3} />
        ) : data.length === 0 ? (
          <SettingsEmptyRow colSpan={3} />
        ) : (
          data.map((item) => (
            <SettingsTableRow key={item.id}>
              <SettingsTd>{item.name_ar}</SettingsTd>
              <SettingsTd className="text-center">
                {contractTypeLabel(item.contract_type)}
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="edit">
                    <EditUsageUnitDialog unit={item} />
                  </PermissionGate>
                  <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="delete">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={async () => { if (await confirm({ title: "تأكيد الحذف", description: "حذف هذا العنصر نهائياً؟ لا يمكن التراجع.", confirmLabel: "حذف", destructive: true })) deleteItem(item.id); }}
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
