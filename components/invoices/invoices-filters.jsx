"use client";

import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVOICE_KINDS, INVOICE_STATUSES, INVOICE_TYPES } from "./mock-data";

export default function InvoicesFilters({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  kindFilter = "all",
  onKindFilterChange,
  onExport,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#EEF1F0] dark:border-white/[0.08]">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-[18px] text-gray-400 dark:text-white/35 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="بحث برقم الفاتورة أو العقد أو الجوال.."
          className={cn(
            "w-full h-[42px] rounded-xl border pr-11 pl-4 text-13 transition-all",
            "bg-[#F8FAF9] border-[#E5E7EB] text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 focus:bg-white",
            "dark:bg-card dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/35",
            "dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/15"
          )}
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-[42px] w-[150px] rounded-xl border-[#E5E7EB] bg-white text-13 font-semibold dark:bg-card dark:border-white/10 dark:text-white">
          <SelectValue placeholder="كل الحالات" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {INVOICE_STATUSES.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="h-[42px] w-[150px] rounded-xl border-[#E5E7EB] bg-white text-13 font-semibold dark:bg-card dark:border-white/10 dark:text-white">
          <SelectValue placeholder="كل الأنواع" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {INVOICE_TYPES.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={kindFilter} onValueChange={onKindFilterChange}>
        <SelectTrigger aria-label="نوع العملية" className="h-[42px] w-[160px] rounded-xl border-[#E5E7EB] bg-white text-13 font-semibold dark:bg-card dark:border-white/10 dark:text-white">
          <SelectValue placeholder="كل العمليات" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {INVOICE_KINDS.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={onExport}
        className={cn(
          "h-[42px] px-4 rounded-xl border text-13 font-bold inline-flex items-center justify-center gap-2 transition-colors shrink-0",
          "bg-status-neutral-bg border-[#E5E7EB] text-gray-700 hover:bg-[#E5E7EB]",
          "dark:bg-card dark:border-white/[0.1] dark:text-white/80 dark:hover:bg-white/[0.06]"
        )}
      >
        <Download className="size-4" />
        <span>تصدير CSV</span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">
          قيد التطوير
        </span>
      </button>
    </div>
  );
}
