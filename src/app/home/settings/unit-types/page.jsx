"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import AddNewTypeDialog from "@/components/analysis/settings/unit-types/add-new-type-dialog";
import EditTypeUnitDialog from "@/components/analysis/settings/unit-types/edit-type-unit-dialog";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SETTINGS_DELETE_TRIGGER_CLASS,
  SettingsActions,
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsPageShell,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
} from "@/components/system-settings/shared";
import {
  contractTypeLabel,
  extractItems,
  fetchBothContractTypes,
} from "@/components/system-settings/settings-list/fetch-contract-type-lists";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = ["الاسم", "تصنيف الوحدة", "الإجراءات"];

export default function UnitTypesPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["unit-types"],
    queryFn: () => fetchBothContractTypes("/admin/unit-types", extractItems),
  });

  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: (id) => axiosInstance.post(`/admin/unit-types/${id}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف نوع الوحدة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["unit-types"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف نوع الوحدة");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="أنواع الوحدات"
        subtitle="قائمة بقيم"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="create">
            <AddNewTypeDialog />
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
              <SettingsTd>{contractTypeLabel(item.contract_type)}</SettingsTd>
              <SettingsTd>
                <SettingsActions>
                  <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="edit">
                    <EditTypeUnitDialog unit={item} />
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
                </SettingsActions>
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>
    </SettingsPageShell>
  );
}
