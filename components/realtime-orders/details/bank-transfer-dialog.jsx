"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, FileText, Loader2, MessageCircle, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { openBankTransferWhatsApp, apiErrorMessage, useBankTransferMessage, useRecordBankTransfer } from "@/src/hooks/use-bank-transfer";
import { normalizePaymentState, sar } from "@/src/lib/payment-state";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function toAsciiNumber(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
}

/** يتحقق من ملف الإيصال (صورة/PDF ≤ 4MB) ويرجع رسالة الخطأ أو null. */
export function validateReceiptFile(file) {
  if (!file) return "أرفق صورة الإيصال (أو PDF)";
  if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type || "")) return "الملف يجب أن يكون صورة (JPG/PNG/WebP) أو PDF";
  if (file.size > MAX_BYTES) return "حجم الإيصال يتجاوز 4MB";
  return null;
}

const field = "h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-[13.5px] font-semibold text-[#14231D] focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";
const label = "text-[12px] font-bold text-[#33403B] dark:text-white/70";

/**
 * «تسجيل حوالة بنكية + إيصال» (دفعة هـ — د2/2.2): المبلغ (المتبقي أو مبلغ الرسوم) + صورة الإيصال مع معاينة
 * + مرجع/تاريخ/ملاحظة اختيارية ← POST /admin/orders/{id}/payments/bank-transfer.
 * charge: عند التحصيل لرسوم/فرق معيّن (charge_id).
 */
export default function BankTransferDialog({ open, onOpenChange, orderData, charge = null, onDone }) {
  const orderId = orderData?.id;
  const state = normalizePaymentState(orderData);
  const defaultAmount = charge ? Number(charge.amount) : Number(state.outstanding || state.due_total || 0);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setSeeded(true);
    setAmount(defaultAmount > 0 ? String(defaultAmount) : "");
    setReceipt(null);
    setPreview(null);
    setReference("");
    setPaidAt("");
    setNote("");
    setError(null);
  }
  if (!open && seeded) setSeeded(false);

  useEffect(() => {
    if (!receipt || !receipt.type?.startsWith("image/")) {
      return undefined;
    }
    const url = URL.createObjectURL(receipt);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  const bankInfo = useBankTransferMessage(orderId, { enabled: open && orderId != null });
  const bank = bankInfo.data?.bank ?? null;

  const record = useRecordBankTransfer({
    onSuccess: (data) => {
      toast.success(`تم تسجيل الحوالة (${sar(data?.transaction?.amount ?? amount)})`, {
        description: data?.charge
          ? "سُدّدت الرسوم وتحدّثت الفاتورة وأُبلغ العميل."
          : "تحدّثت حالة الدفع والفاتورة وأُبلغ العميل — يمكنك التوثيق الآن.",
      });
      onDone?.(data);
      onOpenChange?.(false);
    },
    onError: (err) => setError(apiErrorMessage(err, "تعذّر تسجيل الحوالة")),
  });

  const submit = () => {
    setError(null);
    const value = Number(toAsciiNumber(amount));
    if (!Number.isFinite(value) || value <= 0) return setError("أدخل مبلغ الحوالة");
    const fileError = validateReceiptFile(receipt);
    if (fileError) return setError(fileError);
    record.mutate({ orderId, amount: value, receipt, reference: reference.trim() || undefined, paid_at: paidAt || undefined, note: note.trim() || undefined, charge_id: charge?.id ?? undefined });
  };

  const onFile = (file) => {
    setError(null);
    const fileError = validateReceiptFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    if (!file.type.startsWith("image/")) setPreview(null);
    setReceipt(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[560px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <Banknote className="size-5 text-brand-deep dark:text-emerald-300" />
            تسجيل حوالة بنكية + إيصال
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6B7570] dark:text-white/50">
            {charge
              ? `تحصيل «${charge.kind_label ?? "رسوم"}» ${sar(charge.amount)} بحوالة. بعد الحفظ تُسدَّد الرسوم وتتحدّث الفاتورة ويُبلَّغ العميل.`
              : "بعد الحفظ يصبح الطلب مدفوعاً، وتُصدر الفاتورة، ويُبلَّغ العميل، ويُفتح «وثّقت»."}
          </DialogDescription>
        </DialogHeader>

        {bank && !bank.is_configured ? (
          <p className="rounded-xl border border-[#F1D59A] bg-[#FFF7E6] px-3 py-2 text-[12.5px] font-bold text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            ⚠ بيانات الحوالة (البنك / الآيبان) غير مضبوطة في إعدادات النظام — يمكنك التسجيل، لكن رسالة الواتساب للعميل ستكون ناقصة.
          </p>
        ) : bank ? (
          <p className="text-[12px] text-[#6B7570] dark:text-white/50">
            حساب الاستلام: <b>{bank.bank}</b> · <bdi dir="ltr" className="tabular-nums">{bank.iban}</bdi>
            {bank.account_name ? <> · {bank.account_name}</> : null}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={label}>
              المبلغ (ر.س) <span className="text-[#B42318]">*</span>
            </span>
            <input dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(field, "tabular-nums text-right")} />
            {!charge && state.outstanding > 0 ? <span className="text-[11px] text-[#8A958F]">المتبقي على الطلب: {sar(state.outstanding)}</span> : null}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>رقم المرجع (اختياري)</span>
            <input dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} className={cn(field, "text-right")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>تاريخ الحوالة (اختياري)</span>
            <input type="date" dir="ltr" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={cn(field, "text-right")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>ملاحظة (اختياري)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={field} />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>
            صورة الإيصال <span className="text-[#B42318]">*</span> <span className="font-normal text-[#8A958F]">(JPG / PNG / WebP / PDF — حتى 4MB)</span>
          </span>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0];
              if (f) onFile(f);
            }}
            className={cn(
              "relative flex min-h-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-[#FAFBF9] text-center transition-colors hover:bg-[#EEF5F0] dark:bg-white/[0.03]",
              receipt ? "border-brand-green" : "border-brand-line dark:border-white/15"
            )}
          >
            <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} data-testid="receipt-input" />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="معاينة الإيصال" className="max-h-[260px] w-auto object-contain" />
            ) : receipt ? (
              <span className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-deep">
                <FileText className="size-5" />
                {receipt.name} <span className="font-normal text-[#8A958F]">({Math.round(receipt.size / 1024)} KB)</span>
              </span>
            ) : (
              <span className="flex flex-col items-center gap-1 p-4 text-[13px] text-[#6B7570]">
                <Upload className="size-6 text-brand-deep" />
                اضغط لاختيار الإيصال أو اسحبه هنا
              </span>
            )}
            {receipt ? (
              <button
                type="button"
                aria-label="إزالة الإيصال"
                onClick={(e) => {
                  e.preventDefault();
                  setReceipt(null);
                  setPreview(null);
                }}
                className="absolute end-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-[#B42318] shadow"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
        </div>

        {error ? <p role="alert" className="text-[12.5px] font-bold text-[#B42318]">{error}</p> : null}

        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          <button
            type="button"
            onClick={submit}
            disabled={record.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 text-[14px] font-extrabold text-white hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]"
          >
            {record.isPending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
            تسجيل الحوالة
          </button>
          <button
            type="button"
            onClick={() => openBankTransferWhatsApp(orderId, { amount: toAsciiNumber(amount) || undefined, chargeId: charge?.id }).catch((e) => toast.error(apiErrorMessage(e)))}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366]/10 px-4 text-[13.5px] font-bold text-[#128C7E] hover:bg-[#25D366]/20"
            title="يرسل للعميل اسم البنك والآيبان والمبلغ عبر واتساب"
          >
            <MessageCircle className="size-4" />
            إرسال بيانات الحوالة واتساب
          </button>
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={record.isPending} className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-4 text-[14px] font-bold text-[#14231D] hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-white">
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
