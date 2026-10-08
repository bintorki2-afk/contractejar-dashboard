"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewSectionItemDialog from "@/components/analysis/settings/message-section-items/add-section-item-dialog";
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
  { label: "القسم", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

export default function MessageSectionItemsPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["message-alert-section-items"],
    queryFn: () =>
      fetchAudienceLists(
        (type) => `/admin/message-alert-section-items?type=${type}`,
        extractAlertList
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await axiosInstance.post(`/admin/message-alert-section-items/${id}/delete`);
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 405) {
          return await axiosInstance.delete(`/admin/message-alert-section-items/${id}`);
        }
        throw e;
      }
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف البند بنجاح");
      queryClient.invalidateQueries({ queryKey: ["message-alert-section-items"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف البند");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="بنود أقسام الرسائل"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="create">
            <AddNewSectionItemDialog isEdit={false} />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="720px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={4} />
        ) : data.length === 0 ? (
          <SettingsEmptyRow colSpan={4} />
        ) : (
          data.map((item) => (
            <SettingsTableRow key={`${item.type}-${item.id}`}>
              <SettingsTd>{item.name_ar}</SettingsTd>
              <SettingsTd className="text-center">{audienceLabel(item.type)}</SettingsTd>
              <SettingsTd className="text-center">
                {item.section?.name_ar || item.message_alert_section?.name_ar || "—"}
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate section={PERMISSION_SECTIONS.message_alerts} action="edit">
                    <AddNewSectionItemDialog isEdit item={item} defaultType={item.type} />
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
