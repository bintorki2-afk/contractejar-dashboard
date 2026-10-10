"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Copy,
  X,
} from "lucide-react";
import greenRial from "@/public/images/greenRial.svg";
import waIcon from "@/public/images/waIcon.svg";
import { cn } from "@/lib/utils";
import { formatSaudiMobileDisplay, toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { RT } from "./theme";
import OrderActionsMenu from "./order-actions-menu";

function formatRelativeShort(dateString) {
  if (!dateString) return "---";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

function getReceivedUrgency(dateString) {
  const hours = (Date.now() - new Date(dateString).getTime()) / 3_600_000;
  if (hours >= 24) return "critical";
  if (hours >= 3) return "warn";
  return "ok";
}

// Status badges are intentionally neutral (light gray / dark gray) regardless
// of any color the API supplies, to keep the status column calm and legible.
function statusBadgeStyle(name = "", apiColor, apiTextColor, dark = false) {
  return dark
    ? { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
    : { backgroundColor: "#F3F4F6", color: "#374151" };
}

/**
 * Column definitions for the realtime orders controllable table.
 */
export function buildRealtimeOrderColumns({
  onView,
  onStatusChange,
  onDelete,
  statuses,
  changingOrderId,
  canChangeStatus = true,
  canAddStatus = false,
  canDelete = false,
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
        <div className="flex flex-col items-start gap-1">
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
          {row?.is_draft ? (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ backgroundColor: RT.draftBg, color: RT.draftText }}
            >
              طلب مسودة
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "customerPhone",
      label: "جوال العميل",
      hideable: true,
      stopRowClick: true,
      cell: (row) => {
        const phone = formatSaudiMobileDisplay(row?.user_mobile || row?.phone || "");
        if (!phone) {
          return (
            <span className={cn("text-13", dark ? "text-white/40" : "text-[#8A8A84]")}>
              —
            </span>
          );
        }
        const waHref = `https://wa.me/${toSaudiMobileDialDigits(phone)}`;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap" dir="ltr">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(String(phone));
                toast.success("تم نسخ رقم الجوال");
              }}
              className={cn(
                "text-[12px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md transition-colors",
                dark
                  ? "text-white/85 hover:bg-white/10"
                  : "text-[#33413B] hover:bg-[#EEF6F2]"
              )}
              title="نسخ الجوال"
            >
              {phone}
            </button>
            <Link
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="تواصل واتساب"
              className={cn(
                "size-[26px] rounded-full border inline-flex items-center justify-center transition-colors",
                dark
                  ? "bg-[#0F2E20] border-[#2C5648] hover:bg-[#163A2A]"
                  : "bg-[#E9F7EF] border-[#BFE6CE] hover:bg-[#D8F2E3]"
              )}
            >
              <Image src={waIcon} alt="whatsapp" width={15} height={15} />
            </Link>
          </div>
        );
      },
    },
    {
      id: "documentType",
      label: "نوع الوثيقة",
      hideable: true,
      cell: (row) => (
        <span
          className={cn(
            "text-13 font-semibold",
            dark ? "text-white/70" : "text-[#33403B]"
          )}
        >
          {row?.instrument_type || row?.instrument_type_trans || row?.document_type || "—"}
        </span>
      ),
    },
    {
      id: "payment",
      label: "الدفع",
      hideable: true,
      cell: (row) => {
        const paid = row?.is_paid === true || row?.is_paid === 1;
        const rawAmount = row?.amount_payment;
        const amountNum = Number(rawAmount);
        const showAmount =
          paid &&
          rawAmount != null &&
          rawAmount !== "" &&
          Number.isFinite(amountNum);

        if (paid) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-bold"
                style={{ backgroundColor: RT.successBg, color: RT.success }}
              >
                <Check className="size-3" strokeWidth={2.75} />
                مدفوع
              </span>
              {showAmount ? (
                <span className="inline-flex items-center gap-1 font-bold text-xs text-[#007C13] tabular-nums">
                  {amountNum.toLocaleString("en-US")}
                  <Image src={greenRial} alt="rial" width={11} height={11} />
                </span>
              ) : null}
            </div>
          );
        }

        return (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-bold"
            style={{ backgroundColor: RT.dangerBg, color: RT.danger }}
          >
            <X className="size-3" strokeWidth={2.75} />
            غير مدفوع
          </span>
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
        // QA DASH-3: طلب لم يُستلم بعد ⇒ «—» (لا نعرض عمر الطلب).
        if (!row?.received_at) {
          return <span className="text-11 font-bold text-ink-placeholder">—</span>;
        }
        const label = row?.received_since || formatRelativeShort(row?.received_at);
        const urgency = getReceivedUrgency(row?.received_at);
        const styles =
          urgency === "critical"
            ? { bg: RT.dangerBg, color: RT.danger }
            : urgency === "warn"
              ? { bg: RT.amberBadgeBg, color: RT.amberBadgeText }
              : {
                  bg: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  color: dark ? "rgba(255,255,255,0.65)" : "#4B5563",
                };
        return (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-11 font-bold"
            style={{ backgroundColor: styles.bg, color: styles.color }}
          >
            <Clock className="size-3" strokeWidth={2.5} />
            {label}
          </span>
        );
      },
    },
    {
      id: "orderStatus",
      label: "حالة الطلب",
      hideable: true,
      cell: (row) => {
        const name = row?.status_name || "---";
        const style = statusBadgeStyle(
          name,
          row?.status_color || row?.status?.color,
          row?.status_color_text || row?.status?.color_text,
          dark
        );
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-11 font-bold whitespace-nowrap"
            style={style}
          >
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: style.color }}
            />
            {name}
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
          {row?.employee_name || "---"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "الإجراءات",
      hideable: false,
      sticky: "end",
      stopRowClick: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
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
        </div>
      ),
    },
  ];
}
