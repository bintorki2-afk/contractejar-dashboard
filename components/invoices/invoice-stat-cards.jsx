"use client";

import { cn } from "@/lib/utils";
import RiyalIcon from "./riyal-icon";

const STAT_CARDS = [
  {
    key: "success",
    label: "مدفوعة",
    className:
      "bg-green-50 border-green-200 dark:bg-green-500/15 dark:border-green-400/35",
    valueClass: "text-green-600 dark:text-green-300",
    labelClass: "text-gray-500 dark:text-green-300/80",
    format: (stats) => stats.success,
  },
  {
    key: "failed",
    label: "مسترجعة",
    className:
      "bg-red-50 border-red-200 dark:bg-red-500/15 dark:border-red-400/35",
    valueClass: "text-red-700 dark:text-red-300",
    labelClass: "text-gray-500 dark:text-red-300/80",
    format: (stats) => stats.failed,
  },
  {
    key: "total",
    label: "إجمالي الفواتير",
    className:
      "bg-[#FFF8E1] border-[#FCD34D] dark:bg-amber-500/15 dark:border-amber-400/35",
    valueClass: "text-[#B45309] dark:text-amber-300",
    labelClass: "text-gray-500 dark:text-amber-300/80",
    format: (stats) => stats.total,
  },
  {
    key: "collected",
    label: "المحصل",
    className:
      "bg-white border-gray-200 dark:bg-emerald-500/15 dark:border-emerald-400/35",
    valueClass: "text-black dark:text-emerald-300",
    labelClass: "text-gray-500 dark:text-emerald-300/80",
    format: (stats) => stats.collected.toLocaleString("en-US"),
    showRiyal: true,
  },
  // دفعة هـ (E5): نفس أرقام الخادم — رسوم إضافية · فروقات السعر · حوالات بنكية (من العمليات الناجحة في القائمة).
  {
    key: "extra",
    label: "رسوم إضافية",
    className: "bg-[#FFF8E1] border-[#FCD34D] dark:bg-amber-500/15 dark:border-amber-400/35",
    valueClass: "text-[#B45309] dark:text-amber-300",
    labelClass: "text-gray-500 dark:text-amber-300/80",
    format: (stats) => (stats.extra ?? 0).toLocaleString("en-US"),
    showRiyal: true,
  },
  {
    key: "differences",
    label: "فروقات السعر",
    className: "bg-[#FFF8E1] border-[#FCD34D] dark:bg-amber-500/15 dark:border-amber-400/35",
    valueClass: "text-[#B45309] dark:text-amber-300",
    labelClass: "text-gray-500 dark:text-amber-300/80",
    format: (stats) => (stats.differences ?? 0).toLocaleString("en-US"),
    showRiyal: true,
  },
  {
    key: "transfers",
    label: "حوالات بنكية",
    className: "bg-[#EEF4FF] border-[#BFD3FF] dark:bg-blue-500/15 dark:border-blue-400/35",
    valueClass: "text-[#1D4ED8] dark:text-blue-300",
    labelClass: "text-gray-500 dark:text-blue-300/80",
    format: (stats) => (stats.transfers ?? 0).toLocaleString("en-US"),
    showRiyal: true,
  },
];

function StatCard({ label, value, className, valueClass, labelClass, showRiyal }) {
  return (
    <div
      className={cn(
        "min-w-[92px] rounded-2xl border p-4 text-center",
        className
      )}
    >
      <p
        className={cn(
          "text-lg font-bold tabular-nums leading-none tracking-tight",
          valueClass
        )}
      >
        {value} {showRiyal && <RiyalIcon />}
      </p>
      <p
        className={cn(
          "mt-2 text-xs font-semibold whitespace-nowrap ",
          labelClass
        )}
      >
        {label}
      </p>
    </div>
  );
}

export default function InvoiceStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
      {STAT_CARDS.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.format(stats)}
          className={card.className}
          valueClass={card.valueClass}
          labelClass={card.labelClass}
          showRiyal={card.showRiyal}
        />
      ))}
    </div>
  );
}
