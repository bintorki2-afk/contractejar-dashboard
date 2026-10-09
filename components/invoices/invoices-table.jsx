"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CONTRACT_TYPE, INVOICE_STATUS, PAYMENT_KIND } from "./mock-data";
import RiyalIcon from "./riyal-icon";

const TH =
  "px-3 py-3.5 text-xs font-semibold text-status-neutral dark:text-white/45 border-b border-[#EEF1F0] dark:border-white/[0.08] whitespace-nowrap text-center";

function StatusBadge({ status }) {
  const meta = INVOICE_STATUS[status] || INVOICE_STATUS.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center py-1 px-4 rounded-full text-10 font-bold whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const meta = CONTRACT_TYPE[type];
  if (!meta) {
    return <span className="text-13 text-gray-400 dark:text-white/35">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center py-1 px-4 rounded-full text-10 font-bold whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function KindBadge({ kind, label }) {
  const meta = PAYMENT_KIND[kind] || PAYMENT_KIND.original;
  return (
    <span
      data-payment-kind={kind}
      className={cn("inline-flex items-center justify-center py-1 px-3 rounded-full text-10 font-bold whitespace-nowrap", meta.className)}
    >
      {label || meta.label}
    </span>
  );
}

function copyInvoiceNo(value) {
  navigator.clipboard.writeText(value);
  toast.success("تم نسخ رقم الفاتورة");
}

export default function InvoicesTable({ rows, isLoading, onSelectInvoice }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[1120px]">
        <thead>
          <tr className="bg-[#F8FAF9] dark:bg-card">
            <th className={cn(TH, "px-4")}>رقم الفاتورة</th>
            <th className={TH}>رقم العقد</th>
            <th className={TH}>جوال العميل</th>
            <th className={TH}>نوع العقد</th>
            <th className={TH}>المبلغ</th>
            <th className={TH}>نوع العملية</th>
            <th className={TH}>المصدر</th>
            <th className={TH}>الحالة</th>
            <th className={TH}>التاريخ</th>
            <th className={cn(TH, "text-center")}>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, rowIndex) => (
              <tr key={`invoice-skel-${rowIndex}`}>
                {Array.from({ length: 10 }).map((__, colIndex) => (
                  <td
                    key={`invoice-skel-${rowIndex}-${colIndex}`}
                    className="px-3 py-3.5 border-b border-[#EEF1F0] dark:border-white/[0.06]"
                  >
                    <div
                      className="h-3.5 rounded-md bg-[#EEF1F0] dark:bg-white/[0.06] animate-pulse mx-auto"
                      style={{
                        width: `${50 + ((rowIndex + colIndex) % 5) * 8}%`,
                        opacity: 1 - rowIndex * 0.07,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="text-center py-16 text-13 text-gray-400 dark:text-white/35 font-medium"
              >
                لا توجد فواتير مطابقة لبحثك
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-status-neutral-bg dark:border-white/[0.05] last:border-0 transition-colors",
                  "hover:bg-[#F8FAF9]/90 dark:hover:bg-white/[0.04]",
                  index % 2 === 1 && "bg-[#FAFBFA] dark:bg-white/[0.015]"
                )}
              >
                <td className="px-4 py-3.5 w-fit mx-auto text-center">
                  <div
                    className="inline-flex items-center gap-1.5 hover:bg-brand-accent/10 cursor-pointer dark:hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
                    onClick={() => copyInvoiceNo(row.invoiceNo)}
                  >
                    <span className="text-13 font-bold text-brand-dark dark:text-white tabular-nums ">
                      {row.invoiceNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyInvoiceNo(row.invoiceNo)}
                      className="text-gray-400 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
                      title="نسخ رقم الفاتورة"
                      aria-label="نسخ رقم الفاتورة"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td
                  className="px-3 py-3.5 text-xs font-bold dark:text-white/70 text-brand-dark dark:text-white tabular-nums text-center"
                  dir="ltr"
                >
                  #{row.orderNo}
                </td>
                <td
                  className="px-3 py-3.5 text-xs font-light text-gray-900 dark:text-white/70 tabular-nums text-center"
                  dir="ltr"
                >
                  {row.mobile}
                </td>
                <td className="px-3 py-3.5 text-center">
                  <TypeBadge type={row.contractType} />
                </td>
                <td className="px-3 py-3.5 text-13 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap text-center">
                  {row.amount.toLocaleString("en-US")} <RiyalIcon />
                </td>
                <td className="px-3 py-3.5 text-center">
                  <KindBadge kind={row.kind} label={row.kindLabel} />
                </td>
                <td className="px-3 py-3.5 text-13 font-medium dark:text-white/55 whitespace-nowrap text-center">
                  {row.source}
                </td>
                <td className="px-3 py-3.5 text-center">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-3 py-3.5 text-13 font-medium dark:text-white/55 tabular-nums whitespace-nowrap text-center">
                  {row.date}
                </td>
                <td className="px-3 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(row)}
                    className={cn(
                      "inline-flex items-center justify-center h-8 px-4 rounded-lg text-xs border font-bold transition-colors",
                      "bg-brand-accent/10 border-brand-accent-hover/30 text-brand-main hover:bg-[#E5E7EB]",
                      "dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
                    )}
                  >
                    عرض
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
