"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateContractStatusCaches } from "@/src/lib/invalidate-orders-caches";
import {
  CONTRACT_STATUSES_ACTIVE_API,
  CONTRACT_STATUSES_API,
  CONTRACT_STATUSES_ACTIVE_QUERY_KEY,
  CONTRACT_STATUSES_QUERY_KEY,
  buildContractStatusWritePayload,
  emptyContractStatusForm,
  extractContractStatusItems,
  formFromContractStatus,
} from "@/src/lib/contract-statuses";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import ContractStatusFormFields from "./contract-status-form-fields";

export default function ManageContractStatusesDialog({
  open,
  onOpenChange,
  canCreate = false,
  canEdit = false,
}) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyContractStatusForm);

  const { data, isLoading } = useQuery({
    queryKey: [CONTRACT_STATUSES_QUERY_KEY],
    queryFn: () => axiosInstance(CONTRACT_STATUSES_API),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: activeData } = useQuery({
    queryKey: [CONTRACT_STATUSES_ACTIVE_QUERY_KEY],
    queryFn: () => axiosInstance(CONTRACT_STATUSES_ACTIVE_API),
    enabled: open,
    staleTime: 60_000,
  });

  const items = extractContractStatusItems(data);
  // QA DASH-11 (احتياط): المرحلة الملغاة «إرسال المسودة» (E3) لا تُعرض ولا تُعاد تفعيلها من هنا.
  const list = (items.length > 0 ? items : extractContractStatusItems(activeData)).filter(
    (status) => status?.status_key !== "whatsapp_draft"
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyContractStatusForm);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = buildContractStatusWritePayload(form);
      if (editing?.id) {
        return axiosInstance.post(`${CONTRACT_STATUSES_API}/${editing.id}`, payload);
      }
      return axiosInstance.post(CONTRACT_STATUSES_API, payload);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || (editing ? "تم تحديث الحالة" : "تم إضافة الحالة"));
      invalidateContractStatusCaches(queryClient);
      closeForm();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "تعذر حفظ الحالة");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyContractStatusForm);
    setFormOpen(true);
  };

  const openEdit = (status) => {
    setEditing(status);
    setForm(formFromContractStatus(status));
    setFormOpen(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        if (!next) closeForm();
      }}
    >
      <DialogContent
        className="sm:max-w-[720px] p-0 rounded-32 border-0 overflow-hidden dark:bg-card dark:text-white"
        dir="rtl"
      >
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-neutral-100 dark:border-white/10 pb-4">
              <DialogTitle className="text-22 font-black text-black dark:text-white">
                {formOpen ? (editing ? "تعديل حالة العقد" : "إضافة حالة العقد") : "حالات العقود"}
              </DialogTitle>
              {!formOpen && canCreate ? (
                <PermissionGate section={PERMISSION_SECTIONS.contract_statuses} action="create">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="h-10 px-4 rounded-full bg-brand-dark text-white text-13 font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-4" />
                    إضافة حالة
                  </button>
                </PermissionGate>
              ) : null}
            </div>
          </DialogHeader>

          {formOpen ? (
            <div className="flex flex-col gap-6">
              <ContractStatusFormFields values={form} onChange={setForm} />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => mutate()}
                  disabled={isPending || !form.name.trim() || (editing ? !canEdit : !canCreate)}
                  className="flex-1 h-13.5 bg-brand-dark text-white rounded-2xl font-bold text-base disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : editing ? (
                    "حفظ التغييرات"
                  ) : (
                    "إضـــافة الحالة"
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-13.5 px-5 rounded-2xl bg-status-neutral-bg text-[#4B5563] font-bold"
                >
                  رجوع
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-6 animate-spin text-brand-dark" />
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto space-y-2">
              {list.length === 0 ? (
                <p className="py-8 text-center text-13 text-gray-400">لا توجد حالات حالياً</p>
              ) : (
                list.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#F0F0F0] dark:border-white/10 px-4 py-3"
                  >
                    <span
                      className="size-4 rounded-full shrink-0"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{status.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {status.is_active === false ? "غير نشطة" : "نشطة"}
                        {status.client_explanation ? ` — ${status.client_explanation}` : ""}
                      </p>
                    </div>
                    {canEdit ? (
                      <PermissionGate section={PERMISSION_SECTIONS.contract_statuses} action="edit">
                        <button
                          type="button"
                          onClick={() => openEdit(status)}
                          aria-label="تعديل الحالة"
                          className="size-9 rounded-full bg-[#E6FFE6] text-brand-accent flex items-center justify-center hover:bg-brand-accent hover:text-white"
                        >
                          <Pencil className="size-4" />
                        </button>
                      </PermissionGate>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
