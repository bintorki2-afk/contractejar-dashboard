"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import AddNewMessageForClientDialog from "@/components/analysis/settings/message-for-clients/add-message-for-client";
import DisplayMessageForClientDialog from "@/components/analysis/settings/message-for-clients/display-message-for-client";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SETTINGS_DELETE_TRIGGER_CLASS,
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsPageShell,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
} from "@/components/system-settings/shared";
import { useCustomerMessages } from "@/src/hooks/use-customer-messages";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = [
  "القسم",
  "البند",
  { label: "الإجراءات", className: "text-left" },
];

export default function CustomerAppMessagesPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { messages, isLoading } = useCustomerMessages("client");

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.post(`/admin/customer-messages/${id}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف الرسالة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["customer-messages"] });
      queryClient.invalidateQueries({ queryKey: ["message-alerts-client"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف الرسالة");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="الرسائل التطبيقية للعميل"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.app_content} action="create">
            <AddNewMessageForClientDialog />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="720px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={3} />
        ) : messages.length === 0 ? (
          <SettingsEmptyRow colSpan={3} />
        ) : (
          messages.map((item) => (
            <SettingsTableRow key={item.id}>
              <SettingsTd>
                {item.section?.name_ar || item.section?.name_en || "بدون قسم"}
              </SettingsTd>
              <SettingsTd>
                {item.section_item?.name_ar || item.section_item?.name_en || "بدون بند"}
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <DisplayMessageForClientDialog messageAlert={item} />
                  <PermissionGate section={PERMISSION_SECTIONS.app_content} action="edit">
                    <AddNewMessageForClientDialog isEdit messageAlert={item} />
                  </PermissionGate>
                  <PermissionGate section={PERMISSION_SECTIONS.app_content} action="delete">
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
