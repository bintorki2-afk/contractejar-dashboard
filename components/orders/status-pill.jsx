"use client";

import { AlarmClock, Coins, Paperclip } from "lucide-react";
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

/** شارة «بانتظار العميل · …» في القوائم (دفعة هـ — E4) من `data_request_pending`. */
export function AwaitingCustomerBadge({ order, className, compact = false }) {
  const pending = order?.data_request_pending;
  if (!pending) return null;
  const items = (Array.isArray(pending.items) ? pending.items : []).map((i) => (typeof i === "string" ? i : i?.label)).filter(Boolean);
  const hours = Number(pending.hours ?? pending.hours_waiting ?? 0);
  const late = hours >= 24;
  const title = `${pending.label ?? "بانتظار العميل"}${items.length ? ` · ${items.join(" · ")}` : ""}${hours ? ` · منذ ${Math.floor(hours)} ساعة` : ""}`;
  return (
    <span
      title={title}
      data-awaiting-customer
      className={cn(
        "inline-flex max-w-[220px] items-center gap-1 rounded-full font-extrabold whitespace-nowrap",
        late ? "bg-[#FDECEC] text-[#B42318] dark:bg-red-500/15 dark:text-red-300" : "bg-[#FFF7E6] text-[#7A4B00] dark:bg-amber-500/15 dark:text-amber-300",
        compact ? "h-5 px-1.5 text-[10.5px]" : "h-6 px-2 text-[11px]",
        className
      )}
    >
      <Paperclip className={compact ? "size-3" : "size-3.5"} />
      <span className="truncate">{compact ? "بانتظار العميل" : `بانتظار العميل${items[0] ? ` · ${items[0]}` : ""}${items.length > 1 ? ` +${items.length - 1}` : ""}`}</span>
    </span>
  );
}

/** شارة «بانتظار دفع فرق · 75 ر.س» في القوائم (دفعة هـ — E5) من `awaiting_charge` / `payment_state`. */
export function AwaitingChargeBadge({ order, className, compact = false }) {
  const state = order?.payment_state ?? {};
  const awaiting = order?.awaiting_charge ?? state.awaiting_charge ?? (Number(state.pending_charges_count ?? 0) > 0);
  if (!awaiting) return null;
  const total = Number(order?.pending_charges_total ?? state.pending_charges_total ?? 0);
  const label = state.awaiting_charge_label ?? `بانتظار دفع فرق${total ? ` · ${total.toLocaleString("en-US")} ر.س` : ""}`;
  return (
    <span
      title={label}
      data-awaiting-charge
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#FFF3E0] font-extrabold whitespace-nowrap text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300",
        compact ? "h-5 px-1.5 text-[10.5px]" : "h-6 px-2 text-[11px]",
        className
      )}
    >
      <Coins className={compact ? "size-3" : "size-3.5"} />
      {compact ? "فرق بانتظار الدفع" : label}
    </span>
  );
}
