"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { refundErrorMessage, useRefundPayment } from "@/src/hooks/use-refunds";
import { isSuccessfulPayment, paymentKind, paymentKindLabel, paymentOptionLabel, pickRefundPayment, refundableAmount } from "@/src/lib/refund-payment";

function sar(n) {
  return `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;
}

function toAsciiNumber(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
}

/**
 * استرجاع عبر Moyasar (د9): كلي/جزئي + سبب ← POST /admin/payments/{payment}/refund.
 * يُعرض فقط لمن يملك payments.refund (مدير النظام ضمنياً).
 * دفعة هـ (D-2): prefill.purpose = "refund_due" ← الدفعة الافتراضية هي دفعة الفرق/الرسوم (لا الأصلية)،
 * وقائمة الدفعات تعرض نوع كل دفعة.
 */
export default function RefundDialog({ open, onOpenChange, orderData, prefill = null }) {
  const payments = (orderData?.payments ?? []).filter(isSuccessfulPayment);
  const defaultPayment = pickRefundPayment(payments, { purpose: prefill?.purpose ?? "manual", amount: prefill?.amount ?? null });
  const [paymentId, setPaymentId] = useState(defaultPayment?.id ?? null);
  const [mode, setMode] = useState("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setSeeded(true);
    setPaymentId(defaultPayment?.id ?? null);
    // دفعة هـ (E5): refund_due ← استرجاع جزئي معبّأ بالفرق وسببه.
    setMode(prefill?.amount ? "partial" : "full");
    setAmount(prefill?.amount ? String(prefill.amount) : "");
    setReason(prefill?.reason ?? "");
    setError(null);
  }
  if (!open && seeded) setSeeded(false);

  const payment = payments.find((p) => p.id === paymentId) ?? defaultPayment;
  const max = refundableAmount(payment);

  const refund = useRefundPayment({
    onSuccess: (data) => {
      toast.success(`تم استرجاع ${sar(data?.amount)} عبر Moyasar`, {
        description: "أُبلغ العميل وتحدّثت الفاتورة والتقارير.",
      });
      onOpenChange?.(false);
    },
    onError: (err) => setError(refundErrorMessage(err)),
  });

  const submit = () => {
    setError(null);
    if (!payment) {
      setError("لا توجد دفعة ناجحة قابلة للاسترجاع");
      return;
    }
    if (String(reason).trim().length < 3) {
      setError("اكتب سبب الاسترجاع (3 أحرف على الأقل)");
      return;
    }
    let value = null;
    if (mode === "partial") {
      value = Number(toAsciiNumber(amount));
      if (!Number.isFinite(value) || value <= 0) {
        setError("أدخل مبلغاً صحيحاً");
        return;
      }
      if (value > max) {
        setError(`المبلغ أكبر من المتبقي القابل للاسترجاع (${sar(max)})`);
        return;
      }
    }
    refund.mutate({ paymentId: payment.id, orderId: orderData?.id, amount: value, reason });
  };

  const refundValue = mode === "full" ? max : Number(toAsciiNumber(amount)) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="size-5 text-[#B42318]" />
            استرجاع المبلغ — الطلب #{orderData?.uuid}
          </DialogTitle>
          <DialogDescription>يُنفَّذ الاسترجاع فوراً عبر بوابة Moyasar ولا يمكن التراجع عنه.</DialogDescription>
        </DialogHeader>

        {!payment ? (
          <p className="rounded-xl bg-[#FFF4DE] px-3 py-2.5 text-[13px] font-semibold text-[#9A6100]">
            لا توجد دفعة ناجحة قابلة للاسترجاع في هذا الطلب.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {payments.length > 1 ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#33403B] dark:text-white/70">الدفعة</span>
                <select
                  value={payment.id}
                  onChange={(e) => setPaymentId(Number(e.target.value))}
                  data-refund-payment-select
                  className="h-10 rounded-lg border border-brand-line bg-white px-3 text-[13px] dark:bg-white/[0.04] dark:border-white/10"
                >
                  {payments.map((p) => (
                    <option key={p.id} value={p.id} disabled={refundableAmount(p) <= 0}>
                      {paymentOptionLabel(p, sar)}
                    </option>
                  ))}
                </select>
                {prefill?.purpose === "refund_due" && paymentKind(payment) !== "original" ? (
                  <span className="text-[11px] font-semibold text-[#0B7A4C] dark:text-emerald-300">
                    اختيرت دفعة «{paymentKindLabel(payment)}» لأن المستحق للعميل نتج عن فرق سعر مدفوع — يمكنك تغييرها.
                  </span>
                ) : null}
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-[#F5F7F6] px-3 py-2.5 text-[13px] dark:bg-white/[0.04]">
                <span className="text-[#6B7570] dark:text-white/50">
                  {paymentKindLabel(payment)} · {paymentKind(payment) === "bank_transfer" ? "حوالة" : payment.brand || payment.method || "Moyasar"}
                </span>
                <span className="font-extrabold tabular-nums">{sar(payment.amount)}</span>
              </div>
            )}

            <div role="radiogroup" aria-label="نوع الاسترجاع" className="grid grid-cols-2 gap-2">
              {[
                { id: "full", label: "استرجاع كامل", sub: sar(max) },
                { id: "partial", label: "استرجاع جزئي", sub: "مبلغ تحدده" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === opt.id}
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-start transition-colors",
                    mode === opt.id
                      ? "border-brand-deep bg-brand-mint text-brand-deep dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "border-brand-line hover:border-brand-green/40 dark:border-white/10"
                  )}
                >
                  <span className="block text-[13px] font-extrabold">{opt.label}</span>
                  <span className="block text-[11.5px] font-semibold opacity-75 tabular-nums">{opt.sub}</span>
                </button>
              ))}
            </div>

            {mode === "partial" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-[#33403B] dark:text-white/70">
                  المبلغ (ر.س) — الحد الأقصى {sar(max)}
                </span>
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={amount}
                  onChange={(e) => setAmount(toAsciiNumber(e.target.value))}
                  className="h-10 rounded-lg border border-brand-line bg-white px-3 text-right text-[14px] font-bold tabular-nums dark:bg-white/[0.04] dark:border-white/10"
                  placeholder="0"
                />
              </label>
            ) : null}

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#33403B] dark:text-white/70">
                سبب الاسترجاع <span className="text-[#B42318]">*</span>
              </span>
              <textarea
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-[13px] dark:bg-white/[0.04] dark:border-white/10"
                placeholder="مثال: طلب العميل إلغاء الطلب قبل التوثيق"
              />
            </label>

            {mode === "full" ? (
              <p className="flex items-start gap-2 rounded-xl bg-[#FDECEC] px-3 py-2 text-[12px] font-semibold text-[#B42318] dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                الاسترجاع الكامل يغيّر حالة الطلب إلى «مسترجع» ويُبلغ العميل.
              </p>
            ) : null}
          </div>
        )}

        {error ? (
          <p role="alert" className="rounded-lg bg-[#FDECEC] px-3 py-2 text-[12.5px] font-bold text-[#B42318] dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="h-10 px-4 rounded-xl border border-brand-line text-sm font-bold text-[#33403B] hover:bg-gray-50 dark:border-white/10 dark:text-white/70"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!payment || refund.isPending}
            className="h-10 px-5 rounded-xl bg-[#B42318] text-white text-sm font-bold hover:bg-[#B42318]/90 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {refund.isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            استرجاع {refundValue > 0 ? sar(refundValue) : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
