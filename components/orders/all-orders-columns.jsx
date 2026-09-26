"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Check, Copy, FileText, X } from "lucide-react";
import greenRial from "@/public/images/greenRial.svg";
import { cn } from "@/lib/utils";
import { RT } from "@/components/realtime-orders/theme";
import OrderActionsMenu from "@/components/realtime-orders/order-actions-menu";

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
      id: "payment",
      label: "الدفع",
      hideable: true,
      cell: (row) => {
        const paid = row?.is_paid === true || row?.is_paid === 1;
        const amount = row?.amount_payment;
        const showAmount = paid && amount != null && amount !== "";
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {showAmount ? (
              <span className="inline-flex items-center gap-1 font-bold text-xs tabular-nums text-[#007C13]">
                {amount}
                <Image src={greenRial} alt="rial" width={11} height={11} />
              </span>
            ) : null}
            {paid ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-bold"
                style={{ backgroundColor: RT.successBg, color: RT.success }}
              >
                <Check className="size-3" strokeWidth={2.75} />
                مدفوع
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-11 font-bold"
                style={{ backgroundColor: RT.dangerBg, color: RT.danger }}
              >
                <X className="size-3" strokeWidth={2.75} />
                غير مدفوع
              </span>
            )}
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
        // الطباعة متاحة دائمًا (لا تشترط الدفع) — لعقد إيجار بلا بوابة دفع.
        const canPrint = true;
        return (
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
