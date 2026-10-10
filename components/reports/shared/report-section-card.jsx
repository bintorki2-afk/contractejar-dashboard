"use client";

import { cn } from "@/lib/utils";

export default function ReportSectionCard({ title, children, className, action }) {
  return (
    <div
      data-section-title={typeof title === "string" ? title : undefined}
      className={cn(
        "rounded-xl border border-surface-border-soft bg-white p-5 flex flex-col gap-4 min-w-0 dark:border-white/10 dark:bg-card",
        className
      )}
    >
      {(title || action) && (
        <div dir="rtl" className="flex items-center justify-between gap-3">
          {title ? (
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ReportLineList({ items }) {
  return (
    <div className="flex flex-col" data-export-table>
      {items.map((item, index) => (
        <div key={item.label}>
          {item.separator && index > 0 && <div className="border-t border-surface-border-soft my-2 dark:border-white/10" />}
          <div className="flex items-center justify-between gap-4 py-1.5" data-export-row>
            <span
              data-export-cell
              className={cn(
                "text-13",
                item.bold ? "font-bold" : "font-medium",
                item.tone === "green" && "text-green-700 dark:text-emerald-300",
                item.tone === "red" && "text-red-600 dark:text-red-300",
                item.tone === "gold" && "text-[#B45309] dark:text-amber-300",
                item.tone === "muted" && "text-[#557086] dark:text-slate-300",
                !item.tone && "text-gray-700 dark:text-white/70"
              )}
            >
              {item.label}
            </span>
            <span
              data-export-cell
              className={cn(
                "text-13 tabular-nums shrink-0",
                item.bold ? "font-bold" : "font-semibold",
                item.tone === "green" && "text-green-700 dark:text-emerald-300",
                item.tone === "red" && "text-red-600 dark:text-red-300",
                item.tone === "gold" && "text-[#B45309] dark:text-amber-300",
                item.tone === "muted" && "text-[#557086] dark:text-slate-300",
                !item.tone && "text-gray-900 dark:text-white"
              )}
            >
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
