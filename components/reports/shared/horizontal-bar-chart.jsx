"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDisplay(value, suffix) {
  const formatted = typeof value === "number" ? value.toLocaleString("en-US") : value;
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function formatDayLabel(value) {
  const match = typeof value === "string" && value.match(/^\d{4}-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[1]}` : value;
}

export default function HorizontalBarChart({ items, className, showValue = true, maxValue }) {
  const peak = maxValue ?? Math.max(...items.map((item) => Math.abs(Number(item.value)) || 0), 1);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {items.map((item) => {
        const val = Number(item.value) || 0;
        const magnitude = Math.abs(val);
        const width = peak > 0 ? Math.max((magnitude / peak) * 100, magnitude > 0 ? 4 : 0) : 0;

        return (
          <div key={item.label} className="flex flex-col gap-1.5 min-w-0">
            {showValue && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-13 text-gray-500 truncate dark:text-white/70">{item.label}</span>
                <span className="text-13 font-bold text-gray-900 tabular-nums shrink-0 dark:text-white">
                  {formatDisplay(item.value, item.suffix)}
                  {item.detail ? (
                    <span className="text-11 font-semibold text-gray-400 ms-1 dark:text-white/45">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </div>
            )}
            <div className="h-3 bg-status-neutral-bg rounded-full overflow-hidden dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: item.color ?? (val < 0 ? "#B91C1C" : "#0A4D33") }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VerticalBarChart({ items, className, height = 160, pageSize, showValues = false }) {
  const [page, setPage] = useState(0);
  const totalPages = pageSize ? Math.max(Math.ceil(items.length / pageSize), 1) : 1;

  const [pageSource, setPageSource] = useState({ items, pageSize });
  if (pageSource.items !== items || pageSource.pageSize !== pageSize) {
    setPageSource({ items, pageSize });
    setPage(0);
  }

  const safePage = Math.min(page, totalPages - 1);
  const visibleItems = pageSize ? items.slice(safePage * pageSize, safePage * pageSize + pageSize) : items;
  const peak = Math.max(...visibleItems.map((item) => Number(item.value) || 0), 1);
  const valueReserve = showValues ? 18 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex items-end justify-between gap-2", className)} style={{ height }}>
        {visibleItems.map((item) => {
          const val = Number(item.value) || 0;
          const barHeight =
            peak > 0
              ? Math.max((val / peak) * (height - 24 - valueReserve), val > 0 ? 8 : 0)
              : 0;

          return (
            <div key={item.date ?? item.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {showValues ? (
                <span className="text-10 font-bold text-gray-700 tabular-nums dark:text-white/70">
                  {val.toLocaleString("en-US")}
                </span>
              ) : null}
              <div
                className="w-full max-w-[40px] rounded-t-md bg-[#0D9488] transition-all duration-500"
                style={{ height: barHeight }}
                title={`${item.date ?? item.label}: ${val.toLocaleString("en-US")}`}
              />
              <span className="text-10 text-gray-400 truncate w-full text-center dark:text-white/50">
                {formatDayLabel(item.date ?? item.label)}
              </span>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3" dir="rtl">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-7 h-7 rounded-full border border-surface-border-soft flex items-center justify-center text-gray-500 hover:bg-status-neutral-bg transition-all disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/10 dark:text-white/60"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <span className="text-11 text-gray-500 tabular-nums dark:text-white/50">
            {safePage + 1} من {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="w-7 h-7 rounded-full border border-surface-border-soft flex items-center justify-center text-gray-500 hover:bg-status-neutral-bg transition-all disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/10 dark:text-white/60"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
