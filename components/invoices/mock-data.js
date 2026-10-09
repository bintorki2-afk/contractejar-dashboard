export const INVOICE_STATUSES = [
  { id: "all", label: "كل الحالات" },
  { id: "success", label: "ناجحة" },
  { id: "failed", label: "فشلت" },
];

export const INVOICE_TYPES = [
  { id: "all", label: "كل الأنواع" },
  { id: "housing", label: "سكني" },
  { id: "commercial", label: "تجاري" },
];

/** `contract_type` as returned by `/admin/payments` — enum: "housing" | "commercial". */
export const CONTRACT_TYPE = {
  housing: {
    id: "housing",
    label: "سكني",
    className:
      "bg-[#E6F4EA] text-[#1E7E34] dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  commercial: {
    id: "commercial",
    label: "تجاري",
    className:
      "bg-[#F3E5F5] text-[#6A1B9A] dark:bg-purple-500/20 dark:text-purple-300",
  },
};

/** Statuses as returned by `/admin/payments` (status field: success/failed/…). */
export const INVOICE_STATUS = {
  success: {
    id: "success",
    label: "ناجحة",
    className:
      "bg-[#E6F4EA] text-[#1E7E34] dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  failed: {
    id: "failed",
    label: "فشلت",
    className:
      "bg-[#FDECEA] text-[#C62828] dark:bg-rose-500/20 dark:text-rose-300",
  },
  refunded: {
    id: "refunded",
    label: "مسترجعة",
    className:
      "bg-[#FFF3DC] text-[#B45309] dark:bg-amber-500/20 dark:text-amber-300",
  },
  unknown: {
    id: "unknown",
    label: "غير معروفة",
    className:
      "bg-status-neutral-bg text-status-neutral dark:bg-white/10 dark:text-white/60",
  },
};

/** نوع العملية (دفعة هـ): شارة ملوّنة في جدول الفواتير. */
export const PAYMENT_KIND = {
  original: { id: "original", label: "الدفعة الأصلية", className: "bg-[#EEF1F0] text-[#4B5753] dark:bg-white/10 dark:text-white/70" },
  price_difference: { id: "price_difference", label: "فرق سعر", className: "bg-[#FFF7E6] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300" },
  extra_fee: { id: "extra_fee", label: "رسوم إضافية", className: "bg-[#FFF7E6] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300" },
  bank_transfer: { id: "bank_transfer", label: "حوالة بنكية", className: "bg-[#E8F0FE] text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-300" },
  refund: { id: "refund", label: "استرجاع", className: "bg-[#FEE2E2] text-[#B42318] dark:bg-red-500/15 dark:text-red-300" },
};

export const INVOICE_KINDS = [
  { id: "all", label: "كل العمليات" },
  { id: "original", label: "الدفعة الأصلية" },
  { id: "extra_fee", label: "رسوم إضافية" },
  { id: "price_difference", label: "فرق سعر" },
  { id: "bank_transfer", label: "حوالة بنكية" },
];

export function getInvoiceStats(rows = []) {
  const success = rows.filter((row) => row.status === "success");
  const failed = rows.filter((row) => row.status === "failed");
  const collected = success.reduce((sum, row) => sum + row.amount, 0);
  const extra = success.filter((row) => row.kind === "extra_fee").reduce((sum, row) => sum + row.amount, 0);
  const differences = success.filter((row) => row.kind === "price_difference").reduce((sum, row) => sum + row.amount, 0);
  const transfers = success.filter((row) => row.kind === "bank_transfer").reduce((sum, row) => sum + row.amount, 0);

  return {
    success: success.length,
    failed: failed.length,
    total: rows.length,
    collected,
    extra,
    differences,
    transfers,
  };
}
