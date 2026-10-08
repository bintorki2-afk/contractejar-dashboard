"use client";

import { AlertTriangle, Clock, Hand, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RT } from "./theme";
import { getWaitingMinutes } from "./map-realtime-order";

export function formatWaiting(minutes) {
  if (minutes < 1) return "الآن";

  const days = Math.floor(minutes / 1440);
  const remainderAfterDays = minutes % 1440;
  const hours = Math.floor(remainderAfterDays / 60);
  const mins = remainderAfterDays % 60;

  const parts = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 يوم" : `${days} أيام`);
  }
  if (hours > 0) {
    parts.push(hours === 1 ? "1 ساعة" : `${hours} ساعات`);
  }
  if (mins > 0) {
    parts.push(mins === 1 ? "دقيقة واحدة" : `${mins} دقيقة`);
  }

  return parts.join(" و ");
}

/**
 * New-request card — matches Figma light/dark cards.
 */
export default function NewRequestCard({
  order,
  onReceive,
  dark = false,
  className,
  dense = false,
  receiving = false,
}) {
  const isDraft = order?.status_kind === "draft";
  const waiting = getWaitingMinutes(order);
  const isCritical = waiting >= 30;
  const isWarning = waiting >= 15 && !isCritical;
  const timeColor = isCritical
    ? RT.danger
    : isWarning
      ? RT.warning
      : dark
        ? "rgba(255,255,255,0.55)"
        : RT.muted;

  return (
    <>
      <style>{`
        .card-gradient-top::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 3px;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(90deg, #1F9E86, #0B5A3C);
        }
      `}</style>
      <div
        className={cn(
          "rounded-xl border flex flex-col transition-colors relative overflow-hidden",
          dense ? "p-3 gap-2.5" : "p-3.5 gap-3",
          "min-w-[188px] shrink-0",
          dark
            ? "bg-card border-white/[0.08]"
            : "bg-white border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.06)]",
          "card-gradient-top",
          className
        )}
      >
      {/* Top: type · id · status */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          className="text-[10.5px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{
            backgroundColor:
              order?.contract_type_key === "housing"
                ? RT.housingBg
                : RT.commercialBg,
            color:
              order?.contract_type_key === "housing"
                ? RT.housingText
                : RT.commercialText,
          }}
        >
          {order?.contract_type}
        </span>

        <span
          className={cn(
            "text-13 font-black tabular-nums",
            dark ? "text-white" : "text-[#0B5A3C]"
          )}
        >
          #{order?.uuid}
        </span>

        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-10 font-bold whitespace-nowrap"
          style={{
            backgroundColor: isDraft ? RT.draftBg : RT.newBg,
            color: isDraft ? RT.draftText : RT.newText,
          }}
        >
          <Plus className="size-2.5 stroke-[3]" />
          {order?.status_label}
        </span>
      </div>

      {/* Waiting time */}
      <div
        className="flex items-center justify-center gap-1.5 text-xs"
        style={{ color: timeColor }}
      >
        {isCritical || isWarning ? (
          <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2.5} />
        ) : (
          <Clock className="size-3.5 shrink-0 opacity-70" strokeWidth={2.5} />
        )}
        <span>{formatWaiting(waiting)}</span>
      </div>

      {/* Receive CTA */}
      {onReceive ? (
      <button
        type="button"
        onClick={() => onReceive?.(order)}
        disabled={receiving}
        className="mt-auto w-full h-[36px] rounded-lg text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-colors hover:brightness-110 disabled:opacity-70 disabled:pointer-events-none"
        style={{ backgroundColor: RT.brand }}
      >
        {receiving ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
        ) : (
          <Hand className="size-3.5 rotate-[20deg]" strokeWidth={2.25} />
        )}
        استلام
      </button>
      ) : null}
    </div>
    </>
  );
}
