"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

function DetailRow({ label, value, dir }) {
  if (value == null || value === "") return null;

  return (
    <div className="space-y-1.5 text-right">
      <p className="text-xs font-bold text-[#007C13]/70">{label}</p>
      <p
        className="break-all rounded-xl bg-white/80 px-3 py-2.5 text-13 font-medium leading-relaxed text-[#007C13]"
        dir={dir}
      >
        {value}
      </p>
    </div>
  );
}

function formatPaymentAmount(amount) {
  if (amount == null || amount === "") return null;
  return `${amount} ر.س`;
}

export default function PaymentLinkDialog({
  open,
  onOpenChange,
  paymentUrl,
  cartAmount,
  notes,
  alreadyPaid = false,
  message,
  payment,
}) {
  const amountText =
    cartAmount != null && cartAmount !== "" ? String(cartAmount) : "";
  const notesText = notes?.trim() || "";
  const paidMessage = message?.trim() || "تم دفع هذا العقد بالفعل";
  const paymentAmount =
    payment?.amount != null && payment?.amount !== ""
      ? String(payment.amount)
      : amountText;
  const title = alreadyPaid ? paidMessage : "تم إنشاء رابط الدفع بنجاح";
  const description = alreadyPaid
    ? "هذا العقد مدفوع مسبقاً ولا يتوفر رابط دفع جديد"
    : "يمكنك نسخ الرابط والمبلغ والملاحظات بزر واحد، أو فتح صفحة الدفع";

  const buildCopyPayload = () => {
    if (alreadyPaid) {
      const lines = [paidMessage];
      if (paymentAmount) lines.push(`المبلغ: ${paymentAmount} ر.س`);
      if (payment?.payment_method) {
        lines.push(`طريقة الدفع: ${payment.payment_method}`);
      }
      if (payment?.payment_date) lines.push(`تاريخ الدفع: ${payment.payment_date}`);
      return lines.join("\n");
    }

    const lines = [];
    if (paymentUrl) lines.push(`رابط الدفع: ${paymentUrl}`);
    if (amountText) lines.push(`المبلغ: ${amountText} ر.س`);
    if (notesText) lines.push(`الملاحظات: ${notesText}`);
    return lines.join("\n");
  };

  const handleCopyAll = async () => {
    const payload = buildCopyPayload();
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    toast.success(
      alreadyPaid ? "تم نسخ تفاصيل الدفع" : "تم نسخ رابط الدفع والمبلغ والملاحظات"
    );
  };

  const handleOpen = () => {
    if (!paymentUrl) return;
    window.open(paymentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] rounded-[28px] border border-[#B8E6C1] bg-[#E6FFE6] p-6 sm:p-8"
        dir="rtl"
      >

        <div className="flex w-full flex-col items-center text-center">
          <div className="mb-4 flex size-[60px] items-center justify-center rounded-full bg-brand-accent text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
            <Check className="size-7 stroke-[3]" />
          </div>

          {/* QA DASH-10: العنوان والوصف مرة واحدة (كانا مكرّرين بنسخة sr-only) + زر إغلاق مرئي. */}
          <DialogTitle className="mb-2 text-lg font-bold leading-snug text-[#007C13]">
            {title}
          </DialogTitle>

          <DialogDescription className="mb-5 text-13 text-[#007C13]/80">{description}</DialogDescription>

          {alreadyPaid ? (
            <>
              <div className="mb-6 w-full space-y-3 rounded-2xl border border-[#B8E6C1] bg-white/50 p-4">
                <DetailRow
                  label="المبلغ"
                  value={formatPaymentAmount(paymentAmount)}
                />
                <DetailRow label="طريقة الدفع" value={payment?.payment_method} />
                <DetailRow
                  label="تاريخ الدفع"
                  value={payment?.payment_date}
                  dir="ltr"
                />
                <DetailRow label="حالة الدفع" value={payment?.status} />
              </div>

              <button
                type="button"
                onClick={handleCopyAll}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800"
              >
                <Copy className="size-4" />
                نسخ التفاصيل
              </button>
            </>
          ) : (
            <>
              <div className="mb-6 w-full space-y-3 rounded-2xl border border-[#B8E6C1] bg-white/50 p-4">
                <DetailRow label="رابط الدفع" value={paymentUrl} dir="ltr" />
                <DetailRow
                  label="المبلغ"
                  value={amountText ? `${amountText} ر.س` : null}
                />
                <DetailRow label="الملاحظات" value={notesText || null} />
              </div>

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-black text-sm font-bold text-white transition-colors hover:bg-neutral-800"
                >
                  <Copy className="size-4" />
                  نسخ الكل
                </button>
                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={!paymentUrl}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-brand-accent bg-white text-sm font-bold text-[#007C13] transition-colors hover:bg-brand-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink className="size-4" />
                  فتح
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
