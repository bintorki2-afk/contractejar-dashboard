"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewMessageSectionDialog from "@/components/analysis/settings/message-sections/add-message-section-dialog";
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
  audienceLabel,
  extractAlertList,
  fetchAudienceLists,
} from "@/components/system-settings/settings-list/fetch-contract-type-lists";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HEADERS = [
  "الاسم",
  { label: "النوع", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

export default function MessageSectionsPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["message-alert-sections"],
    queryFn: () =>
      fetchAudienceLists(
        (type) => `admin/message-alert-sections/${type}/options/list`,
        extractAlertList
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await axiosInstance.post(`/admin/message-alert-sections/${id}/delete`);
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 405) {
          return await axiosInstance.delete(`/admin/message-alert-sections/${id}`);
        }
        throw e;
      }
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف القسم بنجاح");
      queryClient.invalidateQueries({ queryKey: ["message-alert-sections"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف القسم");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="أقسام الرسائل"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="create">
            <AddNewMessageSectionDialog isEdit={false} />
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
            <SettingsTableRow key={`${item.type}-${item.id}`}>
              <SettingsTd>{item.name_ar}</SettingsTd>
              <SettingsTd className="text-center">{audienceLabel(item.type)}</SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="edit">
                    <AddNewMessageSectionDialog isEdit section={item} defaultType={item.type} />
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
