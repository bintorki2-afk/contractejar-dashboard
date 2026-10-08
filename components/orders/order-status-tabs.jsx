"use client";

import { cn } from "@/lib/utils";
import { statusKeyLabel } from "@/src/lib/order-status-keys";

/**
 * تبويبات حالات الطلب مع العدّاد (من `status-counts`).
 * تمرير أفقي على الجوال، والتبويب النشط بالأخضر الأساسي.
 */
export default function OrderStatusTabs({ tabs = [], value = "all", onChange, isLoading = false }) {
  if (!tabs.length && isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-9 w-24 rounded-full bg-black/5 dark:bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="حالات الطلب"
      className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin"
      dir="rtl"
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        const label = statusKeyLabel(tab.key, tab.label);
        const empty = !tab.count;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            title={tab.label}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 h-9 ps-3.5 pe-2 rounded-full border text-[12.5px] font-bold transition-colors whitespace-nowrap",
              active
                ? "bg-brand-deep border-brand-deep text-white shadow-sm"
                : "bg-white border-brand-line text-[#33403B] hover:border-brand-green/40 hover:bg-brand-mint dark:bg-white/[0.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[0.08]",
              !active && empty && "text-[#8A958F] dark:text-white/40"
            )}
          >
            {label}
            <span
              className={cn(
                "min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center text-[11.5px] font-extrabold tabular-nums",
                active
                  ? "bg-white/20 text-white"
                  : "bg-[#F0F4F2] text-[#4B5753] dark:bg-white/10 dark:text-white/70"
              )}
            >
              {tab.count ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
