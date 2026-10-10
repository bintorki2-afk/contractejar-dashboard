"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { sar } from "@/src/lib/payment-state";

/** «للعميل N طلبات سابقة» — عربي سليم للأعداد 1/2/3-10/11+. */
export function previousOrdersLabel(count) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  if (n === 1) return "للعميل طلب سابق";
  if (n === 2) return "للعميل طلبان سابقان";
  if (n <= 10) return `للعميل ${n} طلبات سابقة`;
  return `للعميل ${n} طلباً سابقاً`;
}

function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * شارة الطلبات السابقة (دفعة هـ — د7): من customer_orders_summary (نفس الجوال، المدفوع أولاً،
 * غير المدفوع ظاهر أيضاً). الضغط يفتح قائمة؛ كل صف ينقل لصفحة الطلب.
 */
export default function PreviousOrdersChip({ summary, mobile, currentId, className }) {
  const items = Array.isArray(summary?.items) ? summary.items.filter((i) => String(i.id) !== String(currentId)) : [];
  const count = Number(summary?.count ?? items.length) || items.length;
  const label = previousOrdersLabel(count);
  if (!label) return null;

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-previous-orders={count}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#F1D59A] bg-[#FFF7E6] px-3 text-[13px] font-semibold text-[#7A4B00] hover:bg-[#FFF0D1] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
            className
          )}
          title={`مدفوعة: ${summary?.count_paid ?? "—"} · غير مدفوعة: ${summary?.count_unpaid ?? "—"}`}
        >
          <Flag className="size-3.5" />
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[380px] max-w-[92vw] rounded-2xl border border-[#DBE3DC] bg-white p-1.5 text-right shadow-[0_8px_24px_rgba(20,40,30,.12)] dark:border-white/10 dark:bg-card"
      >
        <DropdownMenuLabel className="px-3 py-1.5 text-[12px] font-semibold text-[#6B7B71] dark:text-white/50">
          طلبات العميل {mobile ? <span dir="ltr" className="tabular-nums">{formatSaudiMobileDisplay(mobile)}</span> : null} السابقة
          {summary?.count_paid != null ? (
            <span className="ms-1">
              · {summary.count_paid} مدفوع{summary.count_unpaid ? ` · ${summary.count_unpaid} غير مدفوع` : ""}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <div className="max-h-[320px] overflow-y-auto">
          {items.map((item) => {
            const paid = item.is_paid || ["paid", "partially_refunded", "partially_paid"].includes(item.payment_state?.status);
            return (
              <DropdownMenuItem key={item.id} asChild className="cursor-pointer rounded-xl px-3 py-2.5 text-[13.5px] focus:bg-[#EEF5F0] dark:focus:bg-white/[0.06]">
                <Link href={`/home/orders/${item.id}`} className="flex w-full min-w-0 items-center gap-2">
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-5">
                    <span className="font-extrabold text-brand-deep tabular-nums dark:text-emerald-300">#{item.uuid}</span>
                    <span className="text-[#6B7B71] dark:text-white/50">· {item.type_label ?? item.type}</span>
                    <span className={cn("font-bold", paid ? "text-brand-deep dark:text-emerald-300" : "text-[#B42318] dark:text-red-300")}>
                      · {paid ? `مدفوع${item.payment_state?.paid_total ? ` ${sar(item.payment_state.paid_total)}` : ""}` : "غير مدفوع"}
                    </span>
                    <span className="text-[#33403B] dark:text-white/70">· {item.status_label}</span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-[#6B7B71] tabular-nums dark:text-white/50" dir="ltr">
                    {shortDate(item.created_at)}
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
