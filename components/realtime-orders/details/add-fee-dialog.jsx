"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAddCharge } from "@/src/hooks/use-order-charges";
import { ADD_FEE_WARNING } from "@/src/lib/charges";
import { sar } from "@/src/lib/payment-state";

function toAsciiNumber(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
}

/**
 * QA DASH-14: تحقّق مبلغ الرسوم — السالب لا يُحوَّل صامتاً إلى موجب.
 * يرجع { value } أو { error }.
 */
export function parseFeeAmount(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { error: "أدخل مبلغ الرسوم" };
  if (/^[\s]*[-−‐–—]/.test(text) || /[-−]/.test(text)) return { error: "المبلغ يجب أن يكون موجباً — لا تُقبل القيم السالبة" };
  const ascii = toAsciiNumber(text);
  if (!ascii || (ascii.match(/\./g) || []).length > 1) return { error: "أدخل مبلغاً صحيحاً بالأرقام" };
  const value = Number(ascii);
  if (!Number.isFinite(value) || value <= 0) return { error: "المبلغ يجب أن يكون أكبر من صفر" };
  return { value: Math.round(value * 100) / 100 };
}

const field = "w-full rounded-lg border border-brand-line bg-white px-3 text-[13.5px] font-semibold text-[#14231D] focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";
const label = "text-[12px] font-bold text-[#33403B] dark:text-white/70";

/**
 * «إضافة رسوم» (دفعة هـ — E5): مبلغ حر + رسالة حرة يقرأها العميل كما هي (تحذير فوق الحقل).
 * POST /admin/orders/{id}/charges (صلاحية payments.add_fee) ← رسوم extra_fee بانتظار الدفع؛ ثم رابط Moyasar / حوالة.
 */
export default function AddFeeDialog({ open, onOpenChange, orderData, onCreated }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [internalReason, setInternalReason] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setSeeded(true);
    setAmount("");
    setMessage("");
    setInternalReason("");
    setError(null);
    setFieldErrors({});
  }
  if (!open && seeded) setSeeded(false);

  const add = useAddCharge({
    onSuccess: (data) => {
      toast.success(`أُضيفت رسوم ${sar(data?.charge?.amount ?? amount)} — بانتظار الدفع`, { description: "أُبلغ العميل؛ أرسل له رابط الدفع أو سجّل حوالة." });
      onCreated?.(data?.charge ?? null, data);
      onOpenChange?.(false);
    },
    onError: (err) => {
      const data = err?.response?.data;
      const fe = data?.errors && typeof data.errors === "object" ? data.errors : null;
      if (fe) {
        const first = (v) => (Array.isArray(v) ? v[0] : v ? String(v) : undefined);
        setFieldErrors({ amount: first(fe.amount), message: first(fe.message) });
      }
      setError(data?.message || "تعذّرت إضافة الرسوم — حاول مرة أخرى");
    },
  });

  const submit = () => {
    setError(null);
    // QA DASH-15: الأخطاء تحت كل حقل + تمييزه + التركيز عليه (لا فشل صامت).
    const errs = {};
    const parsed = parseFeeAmount(amount);
    if (parsed.error) errs.amount = parsed.error;
    if (message.trim().length < 3) errs.message = "اكتب رسالة واضحة للعميل (سبب الرسوم) — 3 أحرف على الأقل";
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      const first = errs.amount ? "fee-amount" : "fee-message";
      if (typeof document !== "undefined") document.querySelector(`[data-testid="${first}"]`)?.focus();
      return;
    }
    add.mutate({ orderId: orderData?.id, amount: parsed.value, message: message.trim(), internal_reason: internalReason.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[540px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <Coins className="size-5 text-[#9A6100]" />
            إضافة رسوم على الطلب #{orderData?.uuid}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-6 text-[#6B7570] dark:text-white/50">
            مبلغ حر ورسالة حرة. تُنشأ رسوم «بانتظار الدفع» تظهر للعميل في الموقع والتطبيق مع زر «ادفع»، وتُضاف للفاتورة بعد السداد. «وثّقت» يبقى مقفولاً حتى تُدفع أو تُلغى.
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1.5">
          <span className={label}>
            المبلغ (ر.س) <span className="text-[#B42318]">*</span>
          </span>
          <input
            dir="ltr"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            aria-invalid={fieldErrors.amount ? true : undefined}
            aria-describedby={fieldErrors.amount ? "fee-amount-error" : undefined}
            className={cn(field, "h-11 text-right text-[16px] tabular-nums", fieldErrors.amount && "border-[#B42318] ring-1 ring-[#B42318]/30")}
            data-testid="fee-amount"
          />
          {fieldErrors.amount ? (
            <span id="fee-amount-error" role="alert" className="text-[11.5px] font-semibold text-[#B42318] dark:text-red-300">
              {fieldErrors.amount}
            </span>
          ) : null}
        </label>

        <div className="flex flex-col gap-1.5">
          <p role="note" className="rounded-xl border border-[#F1D59A] bg-[#FFF7E6] px-3 py-2 text-[12.5px] font-bold leading-6 text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {ADD_FEE_WARNING}
          </p>
          <label className="flex flex-col gap-1.5">
            <span className={label}>
              الرسالة للعميل <span className="text-[#B42318]">*</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
              }}
              rows={3}
              placeholder="مثال: رسوم إضافة وحدة ثانية في إيجار"
              aria-invalid={fieldErrors.message ? true : undefined}
              className={cn(field, "resize-y py-2", fieldErrors.message && "border-[#B42318] ring-1 ring-[#B42318]/30")}
              data-testid="fee-message"
            />
            {fieldErrors.message ? (
              <span role="alert" className="text-[11.5px] font-semibold text-[#B42318] dark:text-red-300">
                {fieldErrors.message}
              </span>
            ) : null}
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={label}>سبب داخلي (اختياري — لا يراه العميل)</span>
          <input value={internalReason} onChange={(e) => setInternalReason(e.target.value)} className={cn(field, "h-10")} />
        </label>

        {error ? <p role="alert" className="text-[12.5px] font-bold text-[#B42318]">{error}</p> : null}

        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          <button type="button" onClick={submit} disabled={add.isPending} data-testid="fee-submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 text-[14px] font-extrabold text-white hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]">
            {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Coins className="size-4" />}
            إضافة الرسوم
          </button>
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={add.isPending} className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-4 text-[14px] font-bold text-[#14231D] hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-white">
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
