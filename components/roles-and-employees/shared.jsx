"use client";

import { roleKeyToArabic } from "@/src/lib/role-labels";
import { useMemo, useState } from "react";
import AvatarImage from "@/components/shared/avatar-image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ROLE_BADGE_COLORS = [
  { bg: "bg-[#DBEAFE]", text: "text-[#1D4ED8]" },
  { bg: "bg-[#D1FAE5]", text: "text-[#047857]" },
  { bg: "bg-[#CFFAFE]", text: "text-[#0E7490]" },
  { bg: "bg-[#FEF3C7]", text: "text-[#B45309]" },
  { bg: "bg-[#EDE9FE]", text: "text-[#6D28D9]" },
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]" },
];

export function getRoleBadgeColor(index = 0) {
  return ROLE_BADGE_COLORS[index % ROLE_BADGE_COLORS.length];
}

export function getInitials(name) {
  if (!name) return "?";
  const trimmed = String(name).trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed[0].toUpperCase();
}

export const WORK_PERIOD_LABELS = {
  morning: "وردية الصباح",
  evening: "وردية المساء",
};

export function getWorkPeriodLabel(workPeriod) {
  return WORK_PERIOD_LABELS[workPeriod] || "غير محدد";
}

export function WorkPeriodBadge({ workPeriod, className }) {
  const isEvening = workPeriod === "evening";
  const colors = isEvening
    ? { bg: "bg-[#EDE9FE]", text: "text-[#6D28D9]" }
    : { bg: "bg-[#FEF3C7]", text: "text-[#B45309]" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        colors.bg,
        colors.text,
        className
      )}
    >
      {getWorkPeriodLabel(workPeriod)}
    </span>
  );
}

export function RoleBadge({ role, colorIndex = 0, className }) {
  const colors = getRoleBadgeColor(colorIndex);
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        colors.bg,
        colors.text,
        className
      )}
    >
      {roleKeyToArabic(role) || "غير محدد"}
    </span>
  );
}

export function EmployeeAvatar({ name, image, size = "sm" }) {
  const sizeClass = size === "sm" ? "size-8 text-xs" : "size-10 text-sm";

  const initials = (
    <div
      className={cn(
        "rounded-full bg-[#D1FAE5] text-[#047857] font-bold flex items-center justify-center shrink-0",
        sizeClass
      )}
    >
      {getInitials(name)}
    </div>
  );

  if (!image) return initials;

  const px = size === "sm" ? 32 : 40;
  return (
    <AvatarImage
      src={image}
      alt={name || ""}
      width={px}
      height={px}
      fallback={initials}
      className={cn("rounded-full border border-neutral-200 shrink-0 object-cover", sizeClass)}
    />
  );
}

export function OutlineActionButton({ children, variant = "default", className, ...props }) {
  const variants = {
    default:
      "border-[#D1D5DB] text-gray-700 hover:bg-[#F9FAFB] dark:border-white/15 dark:text-white/70 dark:hover:bg-white/[0.06]",
    view: "border-[#D1D5DB] text-brand-dark hover:bg-[#E8F5F1] dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10",
    edit: "border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF] dark:border-blue-400/40 dark:text-blue-300 dark:hover:bg-blue-500/10",
    delete: "border-[#FCA5A5] text-red-600 hover:bg-[#FEF2F2] dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center h-8 px-3 rounded-lg border bg-white text-xs font-semibold transition-colors whitespace-nowrap dark:bg-[#0F1C16]",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export const TABLE_TH =
  "text-right px-4 py-3.5 text-xs font-semibold text-status-neutral border-b border-[#E5E7EB] whitespace-nowrap bg-[#F0F7F4] dark:text-white/55 dark:border-white/[0.08] dark:bg-[#162820]";

export const TABLE_WRAPPER =
  "w-full overflow-x-auto bg-white rounded-2xl border border-[#E5E7EB] shadow-sm dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none";

export function formatSalary(value) {
  if (value == null || value === "") return null;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return "---";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-CA");
  } catch {
    return dateString;
  }
}

export function useClientPagination(items, pageSize = 8) {
  const [page, setPage] = useState(1);
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const lastPage = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageItems = useMemo(
    () => list.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [list, currentPage, pageSize]
  );

  return {
    pageItems,
    currentPage,
    setCurrentPage: setPage,
    total: list.length,
    pagination: { last_page: lastPage, total: list.length },
  };
}

export function TablePagination({ pagination, currentPage, setCurrentPage }) {
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

  return (
    <div className="flex items-center justify-center gap-2.5 mt-6" dir="rtl">
      <button
        type="button"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-ink-placeholder hover:bg-brand-main hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-transparent dark:border-white/15 dark:text-white/50 dark:hover:bg-emerald-500 dark:hover:text-[#0B1411]"
      >
        <ChevronRight className="size-4" />
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="text-ink-placeholder px-1 dark:text-white/40">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-13 font-medium transition-all",
              currentPage === page
                ? "bg-brand-main text-white shadow-lg shadow-brand-main/20 dark:bg-emerald-500 dark:text-[#0B1411]"
                : "border border-neutral-200 text-ink-placeholder hover:bg-neutral-100 dark:border-white/15 dark:text-white/50 dark:hover:bg-white/[0.06]"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => setCurrentPage((prev) => Math.min(last_page, prev + 1))}
        disabled={currentPage === last_page}
        className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-ink-placeholder hover:bg-brand-main hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-transparent dark:border-white/15 dark:text-white/50 dark:hover:bg-emerald-500 dark:hover:text-[#0B1411]"
      >
        <ChevronLeft className="size-4" />
      </button>
    </div>
  );
}
