"use client";

import { Printer, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Contextual action bar shown above a table when one or more rows are selected.
 * Exposes a "batch print" action and, optionally, a "batch delete" action.
 */
export default function TableBatchActionsBar({
  count = 0,
  onPrint,
  onClear,
  onDelete,
  isPrinting = false,
  isDeleting = false,
  dark = false,
  label = "عقد محدد",
  printLabel = "طباعة المحدد",
  deleteLabel = "حذف المحدد",
}) {
  if (!count) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5",
        dark ? "bg-[#13251E] border-[#26473A]" : "bg-white border-[#ECECEA]"
      )}
      dir="rtl"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[12.5px] font-extrabold",
          dark ? "text-[#E9F4EF]" : "text-[#22302C]"
        )}
      >
        <span className="inline-flex items-center justify-center min-w-6 h-[22px] px-2 rounded-full bg-[#E4F3EC] text-[#0B7A4C] text-xs font-extrabold tabular-nums dark:bg-emerald-500/15 dark:text-emerald-300">
          {count}
        </span>
        {label}
      </span>

      <button
        type="button"
        onClick={onPrint}
        disabled={isPrinting}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-colors",
          "bg-[#0E5F4E] text-white hover:bg-[#0B4E40] disabled:opacity-60"
        )}
      >
        <Printer className="size-4" strokeWidth={2.2} />
        {isPrinting ? "جاري التحضير…" : printLabel}
      </button>

      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-colors",
            "bg-red-600 text-white hover:bg-red-600/90 disabled:opacity-60"
          )}
        >
          <Trash2 className="size-4" strokeWidth={2.2} />
          {isDeleting ? "جاري الحذف…" : deleteLabel}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-bold transition-colors",
          dark
            ? "border-white/10 text-white/80 hover:bg-white/10"
            : "border-[#E3E8E6] text-[#33403B] hover:bg-[#F7FAF9]"
        )}
      >
        <X className="size-3.5" strokeWidth={2.2} />
        إلغاء التحديد
      </button>
    </div>
  );
}
