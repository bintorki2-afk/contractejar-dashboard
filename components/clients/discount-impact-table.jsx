"use client";

import { cn } from "@/lib/utils";

const HEADERS = ["المسار", "رسوم السنة الأولى", "يدفع بعد", "الخصم", "هامش المنصة", "الفحص"];

function formatAmount(value) {
  return value.toLocaleString("en-US");
}

export default function DiscountImpactTable({ rows }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-panel-head dark:bg-white/[0.03]">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-xs font-semibold text-gray-400 dark:text-white/45 text-right whitespace-nowrap border-b border-panel-divider dark:border-white/[0.08]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-gray-100 dark:border-white/5 last:border-0">
              <td className="px-3 py-3 text-13 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                {row.label}
              </td>
              <td className="px-3 py-3 text-13 font-medium text-gray-700 dark:text-white/70 tabular-nums whitespace-nowrap">
                {formatAmount(row.baseFee)}
              </td>
              <td className="px-3 py-3 text-13 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                {formatAmount(row.amountAfter)}
              </td>
              <td className="px-3 py-3 text-13 font-bold text-red-600 dark:text-rose-300 tabular-nums whitespace-nowrap">
                {row.discount > 0 ? `-${formatAmount(row.discount)}` : "0"}
              </td>
              <td className="px-3 py-3 text-13 font-medium text-gray-700 dark:text-white/70 tabular-nums whitespace-nowrap">
                {formatAmount(row.margin)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md text-11 font-bold",
                    row.isProfitable
                      ? "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-red-100 text-red-600 dark:bg-rose-500/20 dark:text-rose-300"
                  )}
                >
                  {row.isProfitable ? "ربح" : "خسارة"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
