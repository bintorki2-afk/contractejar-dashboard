"use client";

import { BadgeCheck, ChevronLeft, Hand } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import OrderActionsMenu from "@/components/realtime-orders/order-actions-menu";
import { nextStageForRow } from "@/src/lib/order-status-keys";
import { formatSaudiMobileDisplay, toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { normalizePaymentState } from "@/src/lib/payment-state";
import { AwaitingChargeBadge, AwaitingCustomerBadge, DelayBadge, StatusPill } from "./status-pill";

const STAGE_LABELS = { received: "استلمت", notarized: "وثّقت" };
const STAGE_ICONS = { received: Hand, notarized: BadgeCheck };

/**
 * «جميع الطلبات» على الجوال (د14): بطاقات مكدّسة بدل الجدول — الحالة والتأخير والعميل والدفع،
 * وأزرار المرحلة/واتساب/عرض/⋮ في أسفل كل بطاقة.
 */
export default function OrdersCardList({
  rows = [],
  isLoading,
  onView,
  onStage,
  canStage,
  statuses,
  onStatusChange,
  canChangeStatus,
  onDelete,
  canDelete,
  changingOrderId,
  emptyMessage = "لا توجد طلبات مطابقة",
  activeRowId = null,
}) {
  if (isLoading && !rows.length) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[132px] rounded-2xl bg-white/70 animate-pulse dark:bg-white/5" />
        ))}
      </div>
    );
  }
  if (!rows.length) {
    return <p className="rounded-2xl border border-brand-line bg-white p-8 text-center text-[13px] text-[#6B7570] dark:bg-[#0F1C16] dark:border-white/10">{emptyMessage}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5" aria-label="الطلبات">
      {rows.map((row) => {
        const stage = canStage ? nextStageForRow(row) : null;
        const StageIcon = STAGE_ICONS[stage];
        const payState = normalizePaymentState(row);
        const paid = payState.status !== "unpaid";
        const wa = toSaudiMobileDialDigits(row?.user_mobile ?? "");
        return (
          <li
            key={row.id}
            data-row-id={row.id}
            className={cn(
              "rounded-2xl border bg-white p-3.5 dark:bg-[#0F1C16]",
              activeRowId != null && String(row.id) === String(activeRowId) ? "border-brand-deep ring-2 ring-brand-deep/15" : "border-brand-line dark:border-white/10"
            )}
          >
            <button type="button" onClick={() => onView?.(row)} className="block w-full text-start">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold tabular-nums text-brand-deep dark:text-emerald-300">#{row.uuid}</p>
                  <p className="mt-0.5 truncate text-[13px] font-bold text-[#14231D] dark:text-white">{row.user_name || "—"}</p>
                  {row.user_mobile ? (
                    <p dir="ltr" className="text-right text-[11.5px] tabular-nums text-[#6B7570]">{formatSaudiMobileDisplay(row.user_mobile)}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusPill order={row} />
                  <DelayBadge order={row} compact />
                  <AwaitingCustomerBadge order={row} compact />
                  <AwaitingChargeBadge order={row} compact />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold">
                <span className="rounded-full bg-[#F0F4F2] px-2 h-6 inline-flex items-center text-[#4B5753] dark:bg-white/10 dark:text-white/70">{row.contract_type || "—"}</span>
                <span className={cn("rounded-full px-2 h-6 inline-flex items-center", paid ? "bg-[#E3F4EA] text-[#0B7A4C]" : "bg-[#FDECEC] text-[#B42318]")}>
                  {payState.status_label}{paid && payState.method_label && payState.method !== "moyasar" ? ` · ${payState.method_label}` : ""}
                </span>
                {row.employee_name && row.employee_name !== "لم يتم الاستلام" ? (
                  <span className="rounded-full bg-[#EFEAFD] px-2 h-6 inline-flex items-center text-[#5B35C9]">{row.employee_name}</span>
                ) : null}
                {row.received_since ? <span className="text-[#8A958F]">{row.received_since}</span> : null}
              </div>
            </button>
            <div className="mt-3 flex items-center gap-1.5">
              {stage ? (
                <button
                  type="button"
                  onClick={() => onStage?.(row)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-deep px-3 text-[13px] font-bold text-white dark:bg-emerald-500 dark:text-[#0B1411]"
                >
                  <StageIcon className="size-4" />
                  {STAGE_LABELS[stage]}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onView?.(row)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-brand-mint px-3 text-[13px] font-bold text-brand-deep"
                >
                  عرض الطلب
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="واتساب العميل"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-[#25D366]/40 text-[#128C4B]"
                >
                  <FaWhatsapp className="size-[18px]" />
                </a>
              ) : null}
              <OrderActionsMenu
                order={row}
                triggerClassName="size-10 rounded-xl"
                statuses={statuses}
                onStatusChange={onStatusChange}
                canChangeStatus={canChangeStatus}
                isStatusPending={changingOrderId != null && changingOrderId === row.id}
                onDelete={onDelete}
                canDelete={canDelete}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
