"use client";

import { ChevronDown, Download, ExternalLink, Printer, Receipt } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/src/lib/order-status-keys";
import { paymentBreakdown, sar, transactionMeta } from "@/src/lib/payment-state";
import { AppliedDiscountBadge } from "./applied-discount-badge";

const KIND_TONES = {
  original: "text-[#14231D] dark:text-white",
  price_difference: "text-[#9A6100] dark:text-amber-300",
  extra_fee: "text-[#9A6100] dark:text-amber-300",
  bank_transfer: "text-[#14231D] dark:text-white",
  refund: "text-[#B42318] dark:text-red-300",
};

/** يفتح الفاتورة القابلة للطباعة (invoice_url الموقّع) في تبويب جديد. */
export function openInvoice(url) {
  if (!url || typeof window === "undefined") return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/**
 * شارة الدفع (دفعة هـ — د6): «● مدفوع · Moyasar · 279 ر.س ▼» — الضغط يفتح تفصيل ما دفعه العميل
 * (بنود + إجمالي + العمليات: الأصلية / فرق سعر / رسوم إضافية / حوالة / استرجاع) و«طباعة / حفظ» = الفاتورة.
 */
export default function PaymentChip({ orderData, appliedDiscount = null, className }) {
  const b = paymentBreakdown(orderData);
  const { state } = b;
  const tone = TONE_CLASSES[state.tone] ?? TONE_CLASSES.neutral;

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-payment-chip={state.status}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-transparent px-3 text-[13px] font-bold transition-colors hover:brightness-95",
            tone,
            className
          )}
          title="تفاصيل ما دفعه العميل"
        >
          <span aria-hidden className="text-[9px]">●</span>
          {state.label}
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[360px] max-w-[92vw] rounded-2xl border border-[#DBE3DC] bg-white p-3.5 text-right shadow-[0_8px_24px_rgba(20,40,30,.12)] dark:border-white/10 dark:bg-card"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[14px] font-bold text-[#14231D] dark:text-white">تفاصيل ما دفعه العميل</div>
          <div className="flex items-center gap-3">
            {b.invoice_pdf_url ? (
              <a
                href={b.invoice_pdf_url}
                target="_blank"
                rel="noreferrer"
                aria-label="تنزيل الفاتورة PDF"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-deep hover:underline dark:text-emerald-300"
              >
                <Download className="size-4" />
                PDF
              </a>
            ) : null}
            {b.invoice_url ? (
              <a
                href={b.invoice_url}
                target="_blank"
                rel="noreferrer"
                aria-label="طباعة / حفظ الفاتورة"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-deep hover:underline dark:text-emerald-300"
              >
                <Printer className="size-4" />
                طباعة / حفظ
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-[13px]">
          {b.lines.length ? (
            b.lines.map((line) => (
              <div key={line.key} className="flex items-center justify-between gap-3">
                <span className={cn("min-w-0 truncate", line.kind === "refund" && "text-[#B42318]")} title={line.label}>
                  {line.label}
                </span>
                <b className={cn("shrink-0 tabular-nums", line.kind === "refund" && "text-[#B42318]")}>{sar(line.amount)}</b>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span>رسوم توثيق العقد</span>
              <b className="tabular-nums">{sar(b.totals.due)}</b>
            </div>
          )}
          {!b.lines.some((l) => l.kind === "vat") ? (
            <div className="flex items-center justify-between gap-3">
              <span>ضريبة القيمة المضافة</span>
              <b>مجانًا</b>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#E3E8E3] pt-1.5 text-[14px] dark:border-white/10">
            <span>{state.status === "unpaid" ? "المستحق" : "الإجمالي المدفوع"}</span>
            <b className={cn("tabular-nums", state.status === "unpaid" ? "text-[#B42318]" : "text-brand-deep dark:text-emerald-300")}>
              {sar(state.status === "unpaid" ? b.totals.due : state.paid_total)}
            </b>
          </div>
          {b.totals.extra > 0 || b.totals.refunded > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[12px] text-[#6B7B71] dark:text-white/50">
              <span>الأصلي {sar(b.totals.original)}</span>
              {b.totals.extra > 0 ? <span>+ إضافي {sar(b.totals.extra)}</span> : null}
              {b.totals.refunded > 0 ? <span className="text-[#B42318]">− مسترجع {sar(b.totals.refunded)}</span> : null}
              <span className="font-bold text-[#14231D] dark:text-white">= الصافي {sar(b.totals.net)}</span>
            </div>
          ) : null}
          {state.outstanding > 0 && state.status !== "unpaid" ? (
            <div className="flex items-center justify-between gap-3 text-[12.5px] font-bold text-[#9A6100] dark:text-amber-300">
              <span>بانتظار الدفع</span>
              <span className="tabular-nums">{sar(state.outstanding)}</span>
            </div>
          ) : null}
          {state.refund_due > 0 ? (
            <div className="flex items-center justify-between gap-3 text-[12.5px] font-bold text-[#B42318] dark:text-red-300">
              <span>مستحق الاسترجاع للعميل</span>
              <span className="tabular-nums">{sar(state.refund_due)}</span>
            </div>
          ) : null}
          {b.original ? (
            <div className="mt-1 text-[12px] text-[#6B7B71] dark:text-white/50">{transactionMeta(b.original, b.invoice_number)}</div>
          ) : null}
          <AppliedDiscountBadge discount={appliedDiscount} />
        </div>

        {b.transactions.length > 1 || (b.transactions.length === 1 && b.transactions[0].kind !== "original") ? (
          <div className="mt-2.5 border-t border-[#E3E8E3] pt-2 dark:border-white/10">
            <div className="mb-1 text-[12px] font-bold text-[#6B7B71] dark:text-white/50">سجل العمليات</div>
            <ul className="flex flex-col gap-1 text-[12.5px]">
              {b.transactions.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className={cn("font-bold", KIND_TONES[t.kind] ?? KIND_TONES.original)}>{t.kind_label ?? t.kind}</span>
                    {t.reason ? <span className="text-[#6B7B71]"> — {t.reason}</span> : null}
                    <span className="block text-[11px] text-[#8A958F] dark:text-white/40">{transactionMeta(t)}</span>
                    {t.receipt_url ? (
                      <a href={t.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-deep hover:underline dark:text-emerald-300">
                        <Receipt className="size-3" />
                        إيصال الحوالة
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                  </span>
                  <b className={cn("shrink-0 tabular-nums", KIND_TONES[t.kind] ?? KIND_TONES.original)}>{sar(t.amount)}</b>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
