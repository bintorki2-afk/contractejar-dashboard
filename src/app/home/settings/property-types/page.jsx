"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewPropertyTypeDialog from "@/components/analysis/settings/property-types/add-new-property-type-dialog";
import EditTypePropertyDialog from "@/components/analysis/settings/property-types/edit-type-property-dialog";
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
  { label: "تصنيف العقار", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

export default function PropertyTypesPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["property-types"],
    queryFn: () =>
      fetchBothContractTypes("/admin/real-estate-types", extractItems),
  });

  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: (id) =>
      axiosInstance.post(`/admin/real-estate-types/${id}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف نوع العقار بنجاح");
      queryClient.invalidateQueries({ queryKey: ["property-types"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف نوع العقار");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="أنواع العقار"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.property_reference} action="create">
            <AddNewPropertyTypeDialog />
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
                    <EditTypePropertyDialog unit={item} />
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
