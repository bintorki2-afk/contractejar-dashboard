"use client";

import { useState } from "react";
import { Pencil, Printer, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTRACT_TYPE, INVOICE_STATUS } from "./mock-data";
import { getInvoiceItemDescription, printInvoice } from "./print-invoice";
import RiyalIcon from "./riyal-icon";

export default function InvoicePreviewDialog({ open, onOpenChange, invoice }) {
  const [customerName, setCustomerName] = useState("");
  const [syncedInvoice, setSyncedInvoice] = useState(null);

  // Re-seed the editable name whenever the dialog opens on an invoice.
  const openInvoice = open ? invoice : null;
  if (openInvoice !== syncedInvoice) {
    setSyncedInvoice(openInvoice);
    if (openInvoice) setCustomerName(openInvoice.customerName || "");
  }

  if (!invoice) return null;

  const typeMeta = invoice.contractType ? CONTRACT_TYPE[invoice.contractType] : null;
  const statusMeta = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.unknown;
  const isPaid = invoice.status === "success";
  const displayName = customerName.trim();
  const customerLine = displayName
    ? `${displayName} (${invoice.mobile})`
    : invoice.mobile;

  const handlePrint = () => {
    const opened = printInvoice(invoice, displayName);
    if (!opened) toast.error("تعذر فتح نافذة الطباعة");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButton={false}
        dir="rtl"
        className="max-w-[640px] w-[calc(100%-1.5rem)] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-0 bg-white shadow-2xl dark:bg-[#0F1C16]"
      >
        <div className="relative px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="إغلاق"
            className="absolute left-5 top-5 inline-flex size-8 items-center justify-center rounded-lg bg-status-neutral-bg text-status-neutral hover:bg-[#E5E7EB] transition-colors dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-dark text-white">
              <ReceiptText className="size-4" />
            </span>
            <DialogTitle className="text-[20px] font-bold text-gray-900 dark:text-white">
              الفاتورة
            </DialogTitle>
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <div className="rounded-xl border border-dashed border-yellow-500 bg-yellow-50/80 px-4 py-3 dark:border-amber-500/40 dark:bg-amber-500/10 flex items-center gap-2.5">
            <label
              htmlFor="invoice-customer-name"
              className="flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap text-yellow-800"
            >
              <Pencil className="size-3.5" />
              اسم العميل (يظهر بالفاتورة عند الطباعة – اختياري):
            </label>
            <input
              id="invoice-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 flex-1 min-w-0 rounded-md border border-opacity-55 border-yellow-600 bg-white px-3 text-13 font-medium text-gray-900 focus:outline-none  dark:bg-card dark:border-white/20 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-[#E5E7EB] p-5 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-black leading-none text-brand-dark dark:text-emerald-400">
                  عقد إيجار
                </h2>
                <p className="mt-1.5 text-xs font-semibold text-status-neutral dark:text-white/50">
                  منصة توثيق عقود الإيجار
                </p>
              </div>
              <div className="text-xs font-medium text-[#4B5563] dark:text-white/60 leading-7 text-left">
                <div>
                  رقم الفاتورة{" "}
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                    {invoice.invoiceNo}
                  </span>
                </div>
                <div>
                  التاريخ{" "}
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                    {invoice.date}
                  </span>
                </div>
                <div>
                  الرقم المرجعي{" "}
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                    {invoice.referenceNo}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[2px] bg-brand-dark my-4 rounded-full" />

            <div className="grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-1">
              <div className="rounded-lg bg-status-neutral-bg px-3 py-2.5 dark:bg-white/[0.06]">
                <p className="text-11 font-medium text-status-neutral dark:text-white/45 mb-1">
                  العميل
                </p>
                <p className="text-13 font-bold text-gray-900 dark:text-white leading-snug">
                  {customerLine}
                </p>
              </div>
              <div className="rounded-lg bg-status-neutral-bg px-3 py-2.5 dark:bg-white/[0.06]">
                <p className="text-11 font-medium text-status-neutral dark:text-white/45 mb-1">
                  رقم الطلب
                </p>
                <p className="text-13 font-bold text-gray-900 dark:text-white tabular-nums">
                  #{invoice.orderNo}
                </p>
              </div>
              <div className="rounded-lg bg-status-neutral-bg px-3 py-2.5 dark:bg-white/[0.06]">
                <p className="text-11 font-medium text-status-neutral dark:text-white/45 mb-1">
                  نوع العقد
                </p>
                <p className="text-13 font-bold text-gray-900 dark:text-white">
                  {typeMeta?.label || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E7EB] dark:border-white/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-status-neutral-bg dark:bg-white/[0.06]">
                    <th className="w-12 px-3 py-2.5 text-right text-xs font-bold text-status-neutral dark:text-white/50">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-status-neutral dark:text-white/50">
                      الوصف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-3 text-13 font-bold text-gray-900 dark:text-white">
                      1
                    </td>
                    <td className="px-3 py-3 text-13 font-medium text-gray-900 dark:text-white leading-relaxed">
                      {getInvoiceItemDescription(invoice.contractType, invoice.kind, invoice.raw)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex items-center justify-between bg-[#E8F5F1] px-3.5 py-3 text-13 font-extrabold text-brand-dark dark:bg-emerald-500/15 dark:text-emerald-300">
                <span>الإجمالي المستحق</span>
                <span className="tabular-nums">
                  {Number(invoice.amount).toLocaleString("en-US")} <RiyalIcon />
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <span
                className={cn(
                  "inline-flex items-center gap-1 h-8 px-4 rounded-full border text-xs font-bold",
                  isPaid
                    ? "border-[#16A34A] text-green-700 bg-white dark:bg-transparent dark:border-emerald-400 dark:text-emerald-300"
                    : "border-red-600 text-[#C62828] bg-white dark:bg-transparent dark:border-rose-400 dark:text-rose-300"
                )}
              >
                {statusMeta.label}
                {isPaid ? " ✓" : ""}
              </span>
            </div>
          </div>

          <div className="flex  gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-xl bg-status-neutral-bg text-13 font-bold text-[#4B5563] hover:bg-[#E5E7EB] transition-colors dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-11 flex-1  rounded-xl bg-brand-dark text-white text-13 font-bold inline-flex items-center justify-center gap-2 hover:bg-[#09463a] transition-colors"
            >
              <Printer className="size-4" />
              طباعة الفاتورة
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
