"use client";

import React from "react";
import { Hand, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReceiveContract } from "@/src/hooks/use-receive-contract";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { getWaitingMinutes } from "@/components/realtime-orders/map-realtime-order";
import { cn } from "@/lib/utils";

// No backend SLA flag exists for unreceived orders yet — 12h is a stated
// client-side assumption for when to switch the waiting label to overdue-red.
const OVERDUE_HOURS = 12;

export default function NotifictionCard({ order }) {
  const router = useRouter();
  // الاستلام = POST /admin/received-contracts ويتطلب all_requests.edit في الخادم.
  const { can, isAdmin } = usePermissions();
  const canReceive = isAdmin || can(PERMISSION_SECTIONS.all_requests, "edit");
  const { mutate: acceptOrder, isPending } = useReceiveContract({
    onSuccess: () => {
      router.push(`/home/orders/${order?.id}`);
    },
  });

  const waitingHours = Math.floor(getWaitingMinutes(order) / 60);
  const isOverdue = waitingHours >= OVERDUE_HOURS;
  // تاريخ ميلادي بترتيب يوم/شهر/سنة ثابت (كان هجرياً بأرقام عربية ويُقلب في RTL).
  const dateLabel = order?.updated_at
    ? new Date(order.updated_at)
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", " ·")
    : "";
  const waitingLabel = isOverdue
    ? `بلا استلام منذ ${waitingHours} ساعة`
    : "بانتظار الاستلام";

  return (
    <div
      className={cn(
        "rounded-[15px] border p-3.5 flex flex-col gap-3",
        "bg-white border-[#ECECEA]",
        "dark:bg-[#13251E] dark:border-[#26473A] dark:text-[#D6E5DE]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative shrink-0">
            <span
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full text-base",
                "bg-[#F0F8F4] dark:bg-[#1B3A2E]"
              )}
            >
              🎉
            </span>
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#FF4444]",
                "ring-2 ring-white dark:ring-[#13251E]"
              )}
            />
          </span>
          <h4 className="text-13 font-black text-gray-900 dark:text-[#D6E5DE] leading-tight truncate">
            طلب جديد {order?.contract_type || ""}
          </h4>
        </div>
        <span
          className="text-11 font-bold text-[#8A9490] dark:text-[#9FC0B4] tabular-nums shrink-0"
          dir="ltr"
        >
          #{order?.uuid}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span
          dir="ltr"
          className={cn(
            "text-11 font-bold tabular-nums text-right",
            isOverdue ? "text-[#D33A2C]" : "text-[#98A39E] dark:text-[#9FC0B4]"
          )}
        >
          {dateLabel}
        </span>
        <span
          className={cn(
            "text-11 font-bold",
            isOverdue ? "text-[#D33A2C]" : "text-[#98A39E] dark:text-[#9FC0B4]"
          )}
        >
          {waitingLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/home/orders/${order?.id}`)}
          className={cn(
            "h-9 flex-1 rounded-[9px] border text-13 font-bold transition-colors",
            "border-[#E3E8E6] bg-white text-[#33403B] hover:bg-[#F7FAF9]",
            "dark:border-[#2C5648] dark:bg-[#1B3A2E] dark:text-[#CDEBDD] dark:hover:bg-[#234B3C]"
          )}
        >
          استعراض
        </button>
        {canReceive ? (
        <button
          type="button"
          onClick={() => acceptOrder(order)}
          disabled={isPending}
          className={cn(
            "h-9 flex-[1.3] rounded-[9px] transition-colors flex items-center justify-center gap-1.5 font-bold text-13 disabled:opacity-60",
            "bg-brand-dark text-white hover:bg-brand-dark/90",
            "dark:bg-emerald-500 dark:text-brand-ink dark:hover:bg-emerald-400"
          )}
        >
          {isPending ? (
            <Loader2 className="animate-spin h-4 w-4 shrink-0 text-current" />
          ) : (
            <Hand size={14} strokeWidth={2.5} className="rotate-[15deg] shrink-0 text-current" />
          )}
          <span>استلام</span>
        </button>
        ) : null}
      </div>
    </div>
  );
}
