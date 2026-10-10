"use client";

import { useState } from "react";
import { AlertTriangle, Banknote, Link2, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { apiErrorMessage, openBankTransferWhatsApp } from "@/src/hooks/use-bank-transfer";
import { normalizePaymentState, sar } from "@/src/lib/payment-state";

const SESSION_PREFIX = "aqdi:unpaid-popup:";

/** هل عُرض بوب-أب «غير مدفوع» لهذا الطلب في هذه الجلسة؟ */
export function unpaidPopupSeen(orderId) {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + orderId) === "1";
  } catch {
    return false;
  }
}
export function markUnpaidPopupSeen(orderId) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + orderId, "1");
  } catch {
    // ignore
  }
}

const btn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[13.5px] font-bold transition-colors disabled:opacity-60";

/**
 * بوب-أب «هذا الطلب غير مدفوع…» (دفعة هـ — د2): يظهر مرة واحدة لكل طلب في الجلسة عند فتح طلب غير مدفوع.
 */
export function UnpaidDialog({ open, onOpenChange, orderData, onPayLink, onBankTransfer, canRecordTransfer }) {
  const state = normalizePaymentState(orderData);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[520px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#B42318] dark:text-red-300">
            <AlertTriangle className="size-5" />
            هذا الطلب غير مدفوع
          </DialogTitle>
          <DialogDescription className="text-[13.5px] leading-7 text-[#33403B] dark:text-white/70">
            {state.due_total > 0 ? <>المستحق <b className="tabular-nums">{sar(state.due_total)}</b>. </> : null}يمكنك استلامه والعمل عليه، لكن <b>لا يمكن توثيقه</b> في إيجار قبل تسجيل الدفع:
            إمّا رابط دفع Moyasar يُرسل للعميل، أو حوالة بنكية تسجّلها أنت مع صورة الإيصال.
            <br />
            <span className="text-[12.5px] text-[#6B7570]">الآيبان لا يظهر للعميل في الموقع أو التطبيق — أنت من يرسله له.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          <button type="button" onClick={() => { onOpenChange?.(false); onPayLink?.(); }} className={cn(btn, "bg-brand-deep text-white hover:bg-brand-deep/90 dark:bg-emerald-500 dark:text-[#0B1411]")}>
            <Link2 className="size-4" /> توليد رابط دفع
          </button>
          {canRecordTransfer ? (
            <button type="button" onClick={() => { onOpenChange?.(false); onBankTransfer?.(); }} className={cn(btn, "border border-brand-line bg-white text-brand-deep hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-emerald-300")}>
              <Banknote className="size-4" /> تسجيل حوالة + إيصال
            </button>
          ) : null}
          <button type="button" onClick={() => onOpenChange?.(false)} className={cn(btn, "text-[#6B7570] hover:bg-[#F3F5F2] dark:text-white/60")}>
            متابعة بدون دفع الآن
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * الشريط الأحمر الثابت أعلى صفحة الطلب حتى يُسجَّل الدفع.
 */
export function UnpaidBanner({ orderData, onPayLink, onBankTransfer, canRecordTransfer, className }) {
  const state = normalizePaymentState(orderData);
  const [sending, setSending] = useState(false);
  if (state.status !== "unpaid") return null;
  const sendBankDetails = async () => {
    setSending(true);
    try {
      await openBankTransferWhatsApp(orderData?.id);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };
  return (
    <div
      role="alert"
      data-unpaid-banner
      className={cn(
        "sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#F5C9C6] bg-[#FDECEC] px-4 py-2.5 text-[13px] font-bold text-[#B42318] shadow-sm dark:border-red-500/30 dark:bg-[#2A1212] dark:text-red-300",
        className
      )}
    >
      <Lock className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        الطلب غير مدفوع{state.due_total > 0 ? ` (${sar(state.due_total)})` : ""} — «وثّقت» مقفول حتى يُسجَّل الدفع.
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={onPayLink} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#B42318] px-3 text-[12.5px] font-bold text-white hover:bg-[#9A1D14]">
          <Link2 className="size-3.5" /> توليد رابط دفع
        </button>
        {canRecordTransfer ? (
          <button type="button" onClick={onBankTransfer} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#B42318]/40 bg-white px-3 text-[12.5px] font-bold text-[#B42318] hover:bg-[#FBDCDA] dark:bg-transparent">
            <Banknote className="size-3.5" /> تسجيل حوالة + إيصال
          </button>
        ) : null}
        <button type="button" onClick={sendBankDetails} disabled={sending} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#B42318]/40 bg-white px-3 text-[12.5px] font-bold text-[#B42318] hover:bg-[#FBDCDA] disabled:opacity-60 dark:bg-transparent" title="يرسل للعميل اسم البنك والآيبان والمبلغ عبر واتساب">
          <MessageCircle className="size-3.5" /> إرسال بيانات الحوالة واتساب
        </button>
      </div>
    </div>
  );
}
