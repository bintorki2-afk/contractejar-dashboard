"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Check, Coins, Copy, ExternalLink, Link2, Loader2, MessageCircle, RotateCcw, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/shared/confirm-provider";
import { useCancelCharge, useChargePaymentLink } from "@/src/hooks/use-order-charges";
import { openStageWhatsApp } from "@/src/hooks/use-order-stage";
import { allCharges, chargeKindLabel, chargeStatusLabel, CHARGE_STATUS_TONES, pendingChargeBanner, pendingCharges } from "@/src/lib/charges";
import { normalizePaymentState, sar } from "@/src/lib/payment-state";
import { TONE_CLASSES } from "@/src/lib/order-status-keys";
import { copyText } from "./order-cells";

const btn = "inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[12.5px] font-bold transition-colors disabled:opacity-60";

function shortDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

/**
 * نافذة رابط دفع الرسوم (دفعة هـ — E5): الرابط + نسخ + فتح + إرسال واتساب برسالة القالب.
 */
export function ChargePaymentLinkDialog({ open, onOpenChange, result }) {
  const [copied, setCopied] = useState(false);
  const url = result?.payment_url ?? "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[520px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <Link2 className="size-5 text-brand-deep" />
            رابط دفع {result?.charge ? chargeKindLabel(result.charge) : "الرسوم"} {result?.charge ? `(${sar(result.charge.amount)})` : ""}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6B7570] dark:text-white/50">
            {result?.test_mode ? "وضع اختبار: سُدّدت الرسوم فوراً." : "الرابط بمبلغ الرسوم فقط. أرسله للعميل عبر واتساب أو انسخه."}
          </DialogDescription>
        </DialogHeader>
        {url ? (
          <p dir="ltr" className="break-all rounded-xl border border-[#E3E8E3] bg-[#FAFBF9] px-3 py-2.5 text-[12.5px] text-[#14231D] dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
            {url}
          </p>
        ) : null}
        {result?.message ? <pre className="whitespace-pre-wrap rounded-xl bg-[#F3F5F2] px-3 py-2 font-[inherit] text-[12.5px] leading-6 text-[#2F4A3B] dark:bg-white/[0.04] dark:text-white/70">{result.message}</pre> : null}
        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          {result?.whatsapp_url ? (
            <button type="button" onClick={() => openStageWhatsApp({ url: result.whatsapp_url, message: result.message })} className={cn(btn, "h-10 bg-[#128C7E] text-white hover:bg-[#0F7A6D]")}>
              <MessageCircle className="size-4" /> إرسال واتساب
            </button>
          ) : null}
          {url ? (
            <>
              <button
                type="button"
                onClick={async () => {
                  await copyText(url, "تم نسخ رابط الدفع");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className={cn(btn, "h-10 border border-brand-line bg-white text-brand-deep hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-emerald-300")}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} نسخ الرابط
              </button>
              <a href={url} target="_blank" rel="noreferrer" className={cn(btn, "h-10 text-[#6B7570] hover:text-brand-deep")}>
                <ExternalLink className="size-4" /> فتح
              </a>
            </>
          ) : null}
          <button type="button" onClick={() => onOpenChange?.(false)} className={cn(btn, "h-10 text-[#6B7570] hover:bg-[#F3F5F2]")}>
            إغلاق
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * لوحة الرسوم (دفعة هـ — E5) أسفل رأس الطلب:
 * - شريط لكل رسوم معلّقة: «الفرق +75 ر.س — السبب — طلب الدفع ▸ رابط Moyasar / حوالة / إلغاء»
 * - refund_due: «مستحق للعميل X — استرجاع الفرق» (يفتح حوار الاسترجاع معبّأً)
 * - قائمة الرسوم (مدفوعة / ملغاة) مطوية
 */
export default function ChargesPanel({ orderData, canEdit = true, canRecordTransfer = false, canRefund = false, onBankTransfer, onRefundDue, className }) {
  const confirm = useConfirm();
  const state = normalizePaymentState(orderData);
  const pending = pendingCharges(orderData);
  const all = allCharges(orderData);
  const settled = all.filter((c) => c.status !== "pending");
  const [linkResult, setLinkResult] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const link = useChargePaymentLink({
    onSuccess: (data) => {
      if (data?.test_mode) toast.success("وضع اختبار: سُدّدت الرسوم فوراً وتحدّثت الفاتورة.");
      setLinkResult(data);
    },
  });
  const cancel = useCancelCharge();

  const refundDue = Number(state.refund_due) || 0;
  if (!pending.length && refundDue <= 0 && !settled.length) return null;

  const onCancel = async (c) => {
    const ok = await confirm({
      title: "إلغاء الرسوم",
      description: `إلغاء «${chargeKindLabel(c)}» بمبلغ ${sar(c.amount)}؟ لن يظهر للعميل بعدها، ويُفتح التوثيق إن لم تبقَ رسوم أخرى.`,
      confirmLabel: "إلغاء الرسوم",
      destructive: true,
    });
    if (ok) cancel.mutate({ orderId: orderData.id, chargeId: c.id });
  };

  return (
    <section className={cn("flex flex-col gap-2", className)} dir="rtl" data-charges-panel>
      {pending.map((c) => {
        const busy = link.isPending && link.variables?.chargeId === c.id;
        return (
          <div
            key={c.id}
            role="alert"
            data-pending-charge={c.kind}
            className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#F1D59A] bg-[#FFF7E6] px-4 py-2.5 text-[13px] font-bold text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <Coins className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              {pendingChargeBanner(c)}
              <span className="ms-1 text-[11.5px] font-semibold text-[#9A6100]/80">
                · {chargeKindLabel(c)} · بانتظار الدفع{c.created_by_name ? ` · أضافها ${c.created_by_name}` : ""}
              </span>
            </span>
            {canEdit ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] font-semibold">طلب الدفع ▸</span>
                <button type="button" disabled={busy} onClick={() => link.mutate({ orderId: orderData.id, chargeId: c.id })} className={cn(btn, "bg-brand-deep text-white hover:bg-brand-deep/90 dark:bg-emerald-500 dark:text-[#0B1411]")} title="رابط Moyasar بمبلغ الرسوم فقط + رسالة واتساب">
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                  رابط Moyasar
                </button>
                {canRecordTransfer ? (
                  <button type="button" onClick={() => onBankTransfer?.(c)} className={cn(btn, "border border-[#F1D59A] bg-white text-[#7A4B00] hover:bg-[#FFF0D1] dark:bg-transparent")}>
                    <Banknote className="size-3.5" /> حوالة
                  </button>
                ) : null}
                <button type="button" disabled={cancel.isPending} onClick={() => onCancel(c)} className={cn(btn, "text-[#B42318] hover:bg-[#FDECEC] dark:text-red-300")}>
                  <XCircle className="size-3.5" /> إلغاء
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      {refundDue > 0 ? (
        <div role="alert" data-refund-due className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#BFE0CC] bg-[#E3F3EA] px-4 py-2.5 text-[13px] font-bold text-brand-deep dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <RotateCcw className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">بعد التعديل صار المستحق أقل مما دُفع — مستحق للعميل {sar(refundDue)}.</span>
          {canRefund ? (
            <button type="button" onClick={() => onRefundDue?.(refundDue)} className={cn(btn, "bg-brand-deep text-white hover:bg-brand-deep/90 dark:bg-emerald-500 dark:text-[#0B1411]")}>
              <RotateCcw className="size-3.5" /> استرجاع الفرق ({sar(refundDue)})
            </button>
          ) : null}
        </div>
      ) : null}

      {settled.length ? (
        <div className="rounded-[12px] border border-[#E3E8E3] bg-white px-4 py-2 text-[12.5px] dark:border-white/10 dark:bg-[#0F1C16]">
          <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="flex w-full items-center justify-between font-bold text-[#2F4A3B] dark:text-white/70">
            <span>
              سجل الرسوم ({settled.length}) — إضافي {sar(settled.filter((c) => c.status === "paid" && c.kind === "extra_fee").reduce((s, c) => s + Number(c.amount || 0), 0))} · فروقات{" "}
              {sar(settled.filter((c) => c.status === "paid" && c.kind === "price_difference").reduce((s, c) => s + Number(c.amount || 0), 0))}
            </span>
            <span className="text-[11.5px] text-[#8A958F]">{showAll ? "إخفاء" : "عرض"}</span>
          </button>
          {showAll ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {settled.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2 border-t border-[#F0F2F0] pt-1.5 dark:border-white/5">
                  <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold", TONE_CLASSES[CHARGE_STATUS_TONES[c.status]] ?? TONE_CLASSES.neutral)}>{chargeStatusLabel(c)}</span>
                  <span className="font-bold">{chargeKindLabel(c)}</span>
                  <span className="tabular-nums font-extrabold">{sar(c.amount)}</span>
                  {c.message ? <span className="text-[#6B7B71] dark:text-white/50">— {c.message}</span> : null}
                  <span className="ms-auto text-[11px] text-[#8A958F]" dir="ltr">
                    {shortDateTime(c.paid_at ?? c.cancelled_at ?? c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <ChargePaymentLinkDialog open={Boolean(linkResult)} onOpenChange={(o) => !o && setLinkResult(null)} result={linkResult} />
    </section>
  );
}
