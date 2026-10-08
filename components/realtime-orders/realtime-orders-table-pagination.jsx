"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { REALTIME_PAGE_SIZE_OPTIONS } from "@/src/hooks/use-realtime-orders-wrapper";

export default function RealtimeOrdersTablePagination({
  pagination,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  dark,
  pageSizeOptions = REALTIME_PAGE_SIZE_OPTIONS,
}) {
  if (!pagination || !pagination.total) return null;

  const lastPage = Math.max(1, pagination.last_page ?? 1);
  const total = pagination.total ?? 0;
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const btnClass = cn(
    "size-[30px] rounded-[9px] border flex items-center justify-center text-[15px] transition-colors disabled:opacity-35 disabled:cursor-default",
    dark
      ? "border-[#28453A] bg-[#132620] text-[#C4D8D0] hover:bg-[#1A332B]"
      : "border-[#DFE9E4] bg-white text-[#33403B] hover:bg-[#F7FAF9]"
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2.5 flex-wrap pt-1 text-[12.5px]",
        dark ? "text-[#84A093]" : "text-[#5A6B64]"
      )}
      dir="rtl"
    >
      <span>
        عرض{" "}
        <b className={dark ? "text-[#C4D8D0]" : "text-[#33403B]"}>
          {from}–{to}
        </b>{" "}
        من <b className={dark ? "text-[#C4D8D0]" : "text-[#33403B]"}>{total}</b> طلب
      </span>

      <span className="flex items-center gap-2">
        <span className="font-bold whitespace-nowrap">صفوف/صفحة</span>
        <Select
          value={String(perPage)}
          onValueChange={(value) => onPerPageChange?.(Number(value))}
        >
          <SelectTrigger
            className={cn(
              "h-[30px] w-[72px] rounded-[9px] border px-2 text-xs font-bold shadow-none focus:ring-0 focus:ring-offset-0",
              dark
                ? "border-[#28453A] bg-[#132620] text-[#C4D8D0]"
                : "border-[#DFE9E4] bg-white text-[#33403B]"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl" className="min-w-[72px]">
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs font-bold">
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          disabled={currentPage >= lastPage}
          className={btnClass}
          title="الصفحة التالية"
          aria-label="الصفحة التالية"
        >
          ‹
        </button>
        <span
          className={cn(
            "font-extrabold tabular-nums px-1.5",
            dark ? "text-[#5FD0A8]" : "text-[#0B5A3C]"
          )}
        >
          <span dir="ltr">{currentPage} / {lastPage}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={btnClass}
          title="الصفحة السابقة"
          aria-label="الصفحة السابقة"
        >
          ›
        </button>
      </span>
    </div>
  );
}
