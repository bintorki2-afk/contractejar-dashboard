"use client";

import Image from "next/image";
import { toast } from "sonner";
import { BadgeCheck, Check, Copy, FileText, Hand, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { nextStageForRow } from "@/src/lib/order-status-keys";
import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import greenRial from "@/public/images/greenRial.svg";
import { cn } from "@/lib/utils";
import { RT } from "@/components/realtime-orders/theme";
import OrderActionsMenu from "@/components/realtime-orders/order-actions-menu";
import { normalizePaymentState } from "@/src/lib/payment-state";
import { AwaitingChargeBadge, AwaitingCustomerBadge, DelayBadge, StatusPill } from "./status-pill";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";

function formatRelativeShort(dateString) {
  if (!dateString) return null;
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (!Number.isFinite(diffMs)) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

const STAGE_ROW_LABELS = { received: "استلمت", notarized: "وثّقت" };
const STAGE_ROW_ICONS = { received: Hand, notarized: BadgeCheck };

export function buildAllOrderColumns({
  onView,
  onStatusChange,
  onPrint,
  onDelete,
  statuses,
  changingOrderId,
  canChangeStatus = true,
  canAddStatus = false,
  canDelete = false,
  canStage = false,
  onStage,
  dark = false,
} = {}) {
  return [
    {
      id: "contractType",
      label: "نوع العقد",
      hideable: false,
      sticky: "start",
      cell: (row) => (
        <span
          className={cn(
            "font-bold",
            dark ? "text-white/85" : "text-gray-700"
          )}
        >
          {row?.contract_type || "---"}
        </span>
      ),
    },
    {
      id: "orderNumber",
      label: "رقم الطلب",
      hideable: false,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span
            className="font-black tabular-nums"
            style={{ color: dark ? "#6EE7B7" : RT.brand }}
          >
            #{row?.uuid}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(String(row?.uuid ?? ""));
              toast.success("تم نسخ رقم الطلب");
            }}
            className={cn(
              "transition-colors",
              dark
                ? "text-white/30 hover:text-white/70"
                : "text-gray-400 hover:text-brand-dark"
            )}
            aria-label="نسخ"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: "status",
      label: "الحالة",
      hideable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusPill order={row} />
          <DelayBadge order={row} compact />
          <AwaitingCustomerBadge order={row} compact />
          <AwaitingChargeBadge order={row} compact />
        </div>
      ),
    },
    {
      id: "customer",
      label: "العميل",
      hideable: true,
      cell: (row) => (
        <div className="flex flex-col leading-tight min-w-0">
          <span className={cn("font-bold truncate max-w-[160px]", dark ? "text-white/85" : "text-[#22302C]")}>
            {row?.user_name || "—"}
          </span>
          {row?.user_mobile ? (
            <span className={cn("text-[11px] tabular-nums", dark ? "text-white/45" : "text-[#7A8580]")} dir="ltr">
              {formatSaudiMobileDisplay(row.user_mobile)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "payment",
      label: "الدفع",
      hideable: true,
      cell: (row) => {
        // دفعة هـ: payment_state من الخادم (غير مدفوع / مدفوع Moyasar / مدفوع حوالة / جزئياً / مسترجع).
        const state = normalizePaymentState(row);
        const paid = state.status !== "unpaid";
        const showAmount = paid && state.paid_total > 0;
        const tone = state.tone === "success" ? { bg: RT.successBg, fg: RT.success } : state.tone === "danger" ? { bg: RT.dangerBg, fg: RT.danger } : state.tone === "warning" ? { bg: "#FFF3E0", fg: "#9A6100" } : { bg: "#EEF2F0", fg: "#4B5753" };
        return (
          <div className="flex items-center gap-1.5 flex-wrap" title={state.label}>
            {showAmount ? (
              <span className="inline-flex items-center gap-1 font-bold text-xs tabular-nums text-[#007C13]">
                {state.paid_total.toLocaleString("en-US")}
                <Image src={greenRial} alt="rial" width={11} height={11} />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-bold whitespace-nowrap" style={{ backgroundColor: tone.bg, color: tone.fg }}>
              {paid ? <Check className="size-3" strokeWidth={2.75} /> : <X className="size-3" strokeWidth={2.75} />}
              {state.status_label}
              {paid && state.method_label && state.method !== "moyasar" ? ` · ${state.method_label}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      id: "receivedSince",
      label: "مستلم منذ",
      hideable: true,
      sortable: true,
      defaultSortDir: "asc",
      getSortValue: (row) => {
        const t = new Date(row?.received_at).getTime();
        return Number.isFinite(t) ? t : null;
      },
      cell: (row) => {
        const label = row?.received_since || formatRelativeShort(row?.received_at);
        if (!label) {
          return (
            <span className={dark ? "text-white/35" : "text-gray-400"}>—</span>
          );
        }
        return (
          <span
            className={cn(
              "font-medium whitespace-nowrap",
              dark ? "text-white/70" : "text-[#4B5563]"
            )}
          >
            {label}
          </span>
        );
      },
    },
    {
      id: "receivedBy",
      label: "مستلم من",
      hideable: true,
      cell: (row) => (
        <span
          className={cn(
            "font-medium",
            dark ? "text-white/70" : "text-[#4B5563]"
          )}
        >
          {row?.employee_name || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "الإجراءات",
      hideable: false,
      sticky: "end",
      stopRowClick: true,
      cell: (row) => {
        // الطباعة متاحة دائمًا (لا تشترط الدفع) — لعقدي بلا بوابة دفع.
        const canPrint = true;
        const stage = canStage ? nextStageForRow(row) : null;
        const StageIcon = STAGE_ROW_ICONS[stage];
        const waDigits = toSaudiMobileDialDigits(row?.user_mobile ?? "");
        return (
          <div className="flex items-center gap-1.5">
            {stage ? (
              <button
                type="button"
                onClick={() => onStage?.(row)}
                title={`${STAGE_ROW_LABELS[stage]} — دون فتح الطلب`}
                className="h-8 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 bg-brand-deep text-white hover:bg-brand-deep/90 dark:bg-emerald-500 dark:text-[#0B1411] whitespace-nowrap"
              >
                <StageIcon className="size-3.5" />
                {STAGE_ROW_LABELS[stage]}
              </button>
            ) : null}
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noreferrer"
                aria-label="واتساب العميل"
                title="واتساب العميل"
                className="size-8 rounded-lg border flex items-center justify-center transition-colors border-[#25D366]/40 text-[#128C4B] hover:bg-[#25D366]/10 dark:text-[#6EE7B7]"
              >
                <FaWhatsapp className="size-4" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onView?.(row)}
              className="h-8 px-3 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: dark ? "rgba(16,185,129,0.12)" : RT.viewBtnBg,
                color: dark ? "#6EE7B7" : RT.viewBtnText,
              }}
            >
              عرض
            </button>
            <OrderActionsMenu
              order={row}
              onStatusChange={onStatusChange}
              statuses={statuses}
              isStatusPending={changingOrderId != null && changingOrderId === row.id}
              canChangeStatus={canChangeStatus}
              canAddStatus={canAddStatus}
              onDelete={onDelete}
              canDelete={canDelete}
            />
            {canPrint ? (
              <button
                type="button"
                onClick={() => onPrint?.(row)}
                aria-label="طباعة العقد"
                title="طباعة العقد"
                className={cn(
                  "size-8 rounded-lg border flex items-center justify-center transition-colors",
                  "border-surface-border-soft text-status-neutral hover:text-brand-dark hover:border-brand-dark/30",
                  "dark:border-white/10 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                <FileText className="size-4" />
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];
}
