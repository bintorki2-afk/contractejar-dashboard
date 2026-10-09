"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

export default function AllOrdersPagination({
  pagination,
  currentPage,
  onPageChange,
  perPage,
  onPerPageChange,
  dark,
  unitLabel = "طلب",
}) {
  const total = pagination?.total ?? 0;
  const lastPage = Math.max(1, pagination?.last_page ?? 1);
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const btnClass = (active) =>
    cn(
      "size-9 rounded-full flex items-center justify-center text-13 font-medium transition-all",
      active
        ? "bg-brand-dark text-white"
        : dark
          ? "border border-white/10 text-white/55 hover:bg-white/10"
          : "border border-neutral-200 text-ink-placeholder hover:bg-neutral-100"
    );

  return (
    <div
      className="flex items-center justify-between gap-3 flex-wrap mt-1"
      dir="rtl"
    >
      <p
        className={cn(
          "text-13 font-medium",
          dark ? "text-white/45" : "text-status-neutral"
        )}
      >
        عرض{" "}
        <span className="tabular-nums font-bold text-brand-dark dark:text-[#6EE7B7]">
          {from}-{to}
        </span>{" "}
        من{" "}
        <span className="tabular-nums font-bold">{total}</span> {unitLabel}
      </p>

      <div className="flex items-center gap-3">
        <label
          className={cn(
            "flex items-center gap-2 text-[12.5px] font-bold",
            dark ? "text-white/55" : "text-status-neutral"
          )}
        >
          صفوف/صفحة
          <Select
            value={String(perPage)}
            onValueChange={(value) => onPerPageChange(Number(value))}
          >
            <SelectTrigger
              className={cn(
                "h-9 w-auto min-w-[4.75rem] gap-1 rounded-full border ps-3 pe-2 text-13 font-bold shadow-none focus:ring-0 focus:ring-offset-0",
                "[&>span]:min-w-fit [&>span]:overflow-visible [&>span]:whitespace-nowrap",
                dark
                  ? "border-white/10 bg-transparent text-white"
                  : "border-neutral-200 bg-transparent text-gray-900"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              dir="rtl"
              className={cn(
                "min-w-[72px]",
                dark && "bg-[#0F1C16] border-white/10 text-white"
              )}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className={cn(
                    "text-13 font-bold",
                    dark && "focus:bg-white/[0.06] focus:text-white"
                  )}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={btnClass(false)}
            aria-label="السابق"
          >
            <ChevronRight className="size-4" />
          </button>
          <span
            className={cn(
              "min-w-13 text-center text-13 font-bold tabular-nums",
              dark ? "text-white/80" : "text-gray-900"
            )}
          >
            <span dir="ltr">{currentPage} / {lastPage}</span>
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
            disabled={currentPage >= lastPage}
            className={btnClass(false)}
            aria-label="التالي"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
