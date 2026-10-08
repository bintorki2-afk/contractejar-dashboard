"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/src/hooks/use-lessor-change";

/** لون الخلفية الفاتح من لون الحالة (hex) للشارة. */
function withAlpha(hex, alpha = "1A") {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  return `${hex}${alpha}`;
}

export function LessorChangeStatusBadge({ status, label, color, className }) {
  const text = label || status || "—";
  const safeColor = typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0B5A3C";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        className
      )}
      style={{ backgroundColor: withAlpha(safeColor), color: safeColor }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: safeColor }} aria-hidden />
      {text}
    </span>
  );
}

export function formatFee(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ريال`;
}

export function platformLabel(platform) {
  if (!platform) return "—";
  return PLATFORM_LABELS[String(platform).toLowerCase()] || platform;
}

export function dobTypeLabel(type) {
  if (type === "gregorian") return "ميلادي";
  if (type === "hijri") return "هجري";
  return "";
}

export function formatDob(row = {}) {
  const dob = row.new_owner_dob;
  if (!dob) return "—";
  const typeLabel = dobTypeLabel(row.new_owner_dob_type);
  return typeLabel ? `${dob} (${typeLabel})` : String(dob);
}

export const LESSOR_CHANGE_SEARCH_PLACEHOLDER = "بحث برقم الطلب أو الجوال أو هوية المالك الجديد...";
