"use client";

import { cn } from "@/lib/utils";
import { STAT_DEFS, formatMoney } from "./client-details-format";

export default function ClientStatsGrid({ client }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9 gap-2.5">
      {STAT_DEFS.map((def) => (
        <div
          key={def.key}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-white px-3 py-3",
            "border-[#E8EEEC] shadow-[0_1px_2px_rgba(11,83,69,0.03)]",
            "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
          )}
        >
          <span
            className="absolute inset-y-0 right-0 w-[3px] dark:hidden"
            style={{ backgroundColor: def.bar }}
            aria-hidden
          />
          <span
            className="absolute inset-y-0 right-0 w-[3px] hidden dark:block"
            style={{ backgroundColor: def.barDark }}
            aria-hidden
          />
          <p className="text-11 font-medium text-gray-400 dark:text-white/45 mb-1.5 pr-1">{def.label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-none pr-1">
            {def.money ? formatMoney(client[def.key]) : client[def.key] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
