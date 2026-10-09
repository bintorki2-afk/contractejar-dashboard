"use client";

import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resolveOrderStatusKey,
  statusKeyLabel,
  statusToneClass,
} from "@/src/lib/order-status-keys";

/** شارة الحالة الموحّدة (القائمة + التفاصيل + الرئيسية). */
export function StatusPill({ order, statusKey, label, className, size = "sm" }) {
  const key = statusKey ?? resolveOrderStatusKey(order);
  const serverName = label ?? order?.status_name ?? order?.status?.name ?? order?.status_label;
  const text = key ? statusKeyLabel(key, serverName) : serverName || "—";
  return (
    <span
      title={serverName && serverName !== text ? serverName : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap",
        size === "lg" ? "h-8 px-3.5 text-[13px]" : "h-6 px-2.5 text-[11.5px]",
        statusToneClass(key),
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {text}
    </span>
  );
}

/** شارة التأخير الحمراء (من `delay_flags` / `delay_labels`). */
export function DelayBadge({ order, labels, className, compact = false }) {
  const list = labels ?? order?.delay_labels ?? [];
  const delayed = order?.is_delayed || (Array.isArray(order?.delay_flags) && order.delay_flags.length > 0) || list.length > 0;
  if (!delayed) return null;
  const title = list.length ? list.join(" · ") : "طلب متأخر";
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#FDECEC] text-[#B42318] dark:bg-red-500/15 dark:text-red-300 font-extrabold whitespace-nowrap",
        compact ? "h-5 px-1.5 text-[10.5px]" : "h-6 px-2 text-[11px]",
        className
      )}
    >
      <AlarmClock className={compact ? "size-3" : "size-3.5"} />
      {compact ? "متأخر" : list[0] || "متأخر"}
    </span>
  );
}
