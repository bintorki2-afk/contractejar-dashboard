"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  buildPaymentMessagePayload,
  emptyPaymentMessageForm,
  isPaymentMessageFormValid,
  mapPaymentMessageToForm,
  PAYMENT_MESSAGES_API,
  PAYMENT_MESSAGES_QUERY_KEY,
  PAYMENT_MESSAGE_TYPE_META,
} from "@/src/lib/payment-messages";
import PaymentMessageFormFields from "./payment-message-form-fields";

export default function EditPaymentMessageDialog({
  item,
  type,
  triggerVariant = "edit",
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyPaymentMessageForm);
  const queryClient = useQueryClient();
  const meta = PAYMENT_MESSAGE_TYPE_META[type];
  const isEdit = Boolean(item?.id);

  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(item ? mapPaymentMessageToForm(item) : emptyPaymentMessageForm);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = buildPaymentMessagePayload(form, type);
      if (isEdit) {
        return axiosInstance.post(`${PAYMENT_MESSAGES_API}/${item.id}`, payload);
      }
      return axiosInstance.post(PAYMENT_MESSAGES_API, payload);
    },
    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          (isEdit ? "تم تحديث رسالة الدفع بنجاح" : "تم إضافة رسالة الدفع بنجاح")
      );
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [PAYMENT_MESSAGES_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حفظ رسالة الدفع"
      );
    },
  });

  const handleSubmit = () => {
    if (!isPaymentMessageFormValid(form)) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    mutate();
  };

  return (
    <Dialog dir="rtl" open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={
          triggerVariant === "add"
            ? "h-10 rounded-xl border border-dashed border-[#C4C4C4] bg-white px-4 text-[13px] font-bold text-[#616161] hover:border-[#0B5A3C] hover:text-[#0B5A3C]"
            : "h-9 rounded-xl border border-[#E6EBE9] bg-white px-3.5 text-[12px] font-bold text-[#0B5A3C] shadow-none hover:bg-[#E8F5F1]"
        }
      >
        {triggerVariant === "add" ? (
          <>
            <Plus className="ml-2 size-4" />
            إضافة الرسالة
          </>
        ) : (
          <>
            <Pencil className="ml-2 size-4" />
            تعديل
          </>
        )}
      </Button>

      <DialogContent
        closeButton={false}
        className="max-w-lg max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_12px_40px_rgba(11,83,69,0.12)] sm:max-w-lg"
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-5 py-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <DialogTitle className="text-base font-black text-[#111827]">
                {isEdit ? "تعديل" : "إضافة"} {meta?.label}
              </DialogTitle>
              {meta?.description ? (
                <p className="mt-1 text-[12px] font-medium text-[#6B7280]">
                  {meta.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="min-w-0 max-w-full overflow-hidden px-5 py-4">
          <PaymentMessageFormFields form={form} onChange={setForm} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#EEF1F0] px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-10 rounded-xl border-[#0B5A3C]/30 px-4 text-[13px] font-bold text-[#0B5A3C] hover:bg-[#E8F5F1]"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="h-10 min-w-[96px] rounded-xl bg-[#0B5A3C] px-5 text-[13px] font-bold text-white hover:bg-[#043F38]"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              "حفظ"
            ) : (
              "إضافة"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
