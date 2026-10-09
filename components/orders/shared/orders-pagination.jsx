"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrdersPagination({ pagination, currentPage, onPageChange }) {
  if (!pagination || pagination.last_page <= 1) return null;

  const pages = [];
  const { last_page } = pagination;
  const range = 1;
  const start = Math.max(1, currentPage - range);
  const end = Math.min(last_page, currentPage + range);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < last_page) {
    if (end < last_page - 1) pages.push("...");
    pages.push(last_page);
  }

  const navBtn = cn(
    "w-9 h-9 rounded-full border flex items-center justify-center transition-all disabled:opacity-50",
    "border-[#E3E8E6] text-[#98A39E] hover:bg-[#0B5A3C] hover:text-white hover:border-[#0B5A3C]",
    "dark:border-[#2C5648] dark:text-[#9FC0B4] dark:hover:bg-emerald-500 dark:hover:text-[#0B1411] dark:hover:border-emerald-500",
    "disabled:hover:bg-transparent disabled:hover:text-[#98A39E] dark:disabled:hover:text-[#9FC0B4]"
  );

  return (
    <div className="flex items-center justify-center gap-2.5 mt-2" dir="rtl">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={navBtn}
      >
        <ChevronRight className="size-4" />
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`dots-${idx}`}
            className="text-[#98A39E] dark:text-[#9FC0B4] px-1"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-13 font-medium transition-all",
              currentPage === page
                ? "bg-[#0B5A3C] text-white shadow-lg shadow-[#0B5A3C]/20 dark:bg-emerald-500 dark:text-[#0B1411] dark:shadow-none"
                : "border border-[#E3E8E6] text-[#98A39E] hover:bg-[#F3F4F6] dark:border-[#2C5648] dark:text-[#9FC0B4] dark:hover:bg-[#1B3A2E]"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(pagination.last_page, currentPage + 1))}
        disabled={currentPage === pagination.last_page}
        className={navBtn}
      >
        <ChevronLeft className="size-4" />
      </button>
    </div>
  );
}
