"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddPaperworkDialog from "@/components/analysis/settings/paperworks/add-paperwork-dialog";
import EditPaperworkDialog from "@/components/analysis/settings/paperworks/edit-paperwork-dialog";
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
  extractAlertList,
  fetchBothContractTypes,
} from "@/components/system-settings/settings-list/fetch-contract-type-lists";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const HEADERS = [
  "الاسم",
  { label: "نوع العقد", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

export default function PaperworksPage(props) {
  const confirm = useConfirm();
  useUnwrapPageProps(props?.params, props?.searchParams);

  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["paperworks"],
    queryFn: () => fetchBothContractTypes("/admin/paperworks", extractAlertList),
  });

  const { mutate: deletePaperwork, isPending: deletePending } = useMutation({
    mutationFn: (id) => axiosInstance.post(`/admin/paperworks/${id}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حذف ورقة العمل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["paperworks"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف ورقة العمل");
    },
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="أوراق العمل"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.paperworks} action="create">
            <AddPaperworkDialog />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="720px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={3} />
        ) : data.length === 0 ? (
          <SettingsEmptyRow colSpan={3} />
        ) : (
          data.map((item) => (
            <SettingsTableRow key={`${item.contract_type}-${item.id}`}>
              <SettingsTd>
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-surface-border-soft bg-white flex items-center justify-center">
                    {item.icon_url ? (
                      <Image
                        src={item.icon_url}
                        alt={item.name_ar || item.name || "أيقونة ورقة العمل"}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <FileText className="size-5 text-ink-placeholder" />
                    )}
                  </div>
                  <div>
                    <p>{item.name_ar || item.name}</p>
                    {item.name_en ? (
                      <p className="mt-0.5 text-xs text-gray-400" dir="ltr">
                        {item.name_en}
                      </p>
                    ) : null}
                  </div>
                </div>
              </SettingsTd>
              <SettingsTd className="text-center">
                {contractTypeLabel(item.contract_type)}
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-start gap-2">
                  <PermissionGate section={PERMISSION_SECTIONS.paperworks} action="edit">
                    <EditPaperworkDialog paperwork={item} />
                  </PermissionGate>
                  <PermissionGate section={PERMISSION_SECTIONS.paperworks} action="delete">
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={async () => { if (await confirm({ title: "تأكيد الحذف", description: "حذف هذا العنصر نهائياً؟ لا يمكن التراجع.", confirmLabel: "حذف", destructive: true })) deletePaperwork(item.id); }}
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
