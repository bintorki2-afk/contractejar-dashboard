"use client";

import { AlertTriangle, Printer, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { RT } from "../../theme";
import { cn } from "@/lib/utils";
import { printApiInvoice } from "@/components/invoices/print-invoice";
import { AccentCard } from "./primitives";

function Line({ label, value, className }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-status-neutral dark:text-white/50 font-medium leading-snug">{label}</span>
      <span className={cn("font-black text-gray-900 dark:text-white tabular-nums whitespace-nowrap", className)}>
        {value}
      </span>
    </div>
  );
}

/**
 * فاتورة الطلب كما يصدرها الخادم (ف1): البنود + المجموع الفرعي + الخصم + الضريبة + الإجمالي.
 * لا يوجد أي حساب هنا — `invoice` ناتج normalizeApiInvoice().
 */
export default function InvoiceCard({ invoice }) {
  if (!invoice) return null;

  const handlePrint = () => {
    const opened = printApiInvoice(invoice);
    if (!opened) toast.error("تعذر فتح نافذة الطباعة");
  };

  return (
    <AccentCard
      accent={RT.brand}
      icon={ReceiptText}
      title="الفاتورة"
      badge={invoice.invoiceNumber}
      badgeClassName="bg-[#E8F5F1] text-brand-dark dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]"
    >
      <div className="space-y-1.5">
        {invoice.hasItems ? (
          invoice.items.map((item) => (
            <Line
              key={item.key}
              label={item.description}
              value={item.amountLabel}
              className={item.isDiscount ? "text-red-600 dark:text-[#FCA5A5]" : undefined}
            />
          ))
        ) : (
          <p className="text-xs text-ink-placeholder">لا توجد بنود في الفاتورة</p>
        )}
      </div>

      <div className="pt-2 border-t border-[#EEF1F0] dark:border-white/10 space-y-1.5">
        <Line label="المجموع الفرعي" value={invoice.subtotalLabel} />
        {invoice.discount ? (
          <Line
            label={invoice.couponCode ? `الخصم (${invoice.couponCode})` : "الخصم"}
            value={invoice.discountLabel}
            className="text-red-600 dark:text-[#FCA5A5]"
          />
        ) : null}
        <Line
          label="ضريبة القيمة المضافة"
          value={invoice.vatLabel}
          className={!invoice.vat ? "text-green-700 dark:text-[#6EE7B7]" : undefined}
        />
        <Line
          label={invoice.totalDueLabel}
          value={invoice.totalLabel}
          className="text-sm text-green-700 dark:text-[#6EE7B7]"
        />
      </div>

      {invoice.amountMismatch ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-[#FBF3E0] text-[#92400E] text-[11.5px] font-bold px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          الإجمالي المعروض هو المبلغ المدفوع فعلياً، ويختلف عن مجموع البنود — راجع التسعير.
        </p>
      ) : null}

      <button
        type="button"
        onClick={handlePrint}
        className="w-full h-9 rounded-xl border border-surface-border-soft dark:border-white/10 text-xs font-bold text-brand-dark dark:text-[#6EE7B7] inline-flex items-center justify-center gap-1.5 hover:bg-[#F3F9F6] dark:hover:bg-white/[0.06]"
      >
        <Printer className="size-3.5" />
        طباعة الفاتورة
      </button>
    </AccentCard>
  );
}
