"use client";

import { Pencil } from "lucide-react";
import Image from "next/image";
import greenRial from "@/public/images/greenRial.svg";
import { cn } from "@/lib/utils";
import { RT } from "../../theme";
import { InlineEditableValue } from "../inline-edit";

export function GroupTitle({ children, end }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
      <h3 className="text-13 font-black text-brand-dark dark:text-[#6EE7B7] truncate">
        {children}
      </h3>
      {end}
    </div>
  );
}

export function EditBtn({ className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "size-8 rounded-full border border-surface-border-soft dark:border-white/10 bg-white dark:bg-white/[0.04]",
        "text-gray-400 hover:text-brand-dark hover:border-brand-dark/30 flex items-center justify-center transition-colors",
        className
      )}
      aria-label="تعديل"
    >
      <Pencil className="size-3.5" />
    </button>
  );
}

/** Card with colored top accent bar — matches Figma groups. */
export function AccentCard({
  accent = RT.brand,
  icon: Icon,
  title,
  badge,
  badgeClassName,
  missingCount,
  onEdit,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-surface-border-soft dark:border-white/10 bg-white dark:bg-[#0F1C16]",
        "overflow-hidden shadow-[0_1px_2px_rgba(11,83,69,0.04)]",
        className
      )}
    >
      <div className="h-[4px] w-full" style={{ backgroundColor: accent }} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon ? (
              <span
                className="size-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${accent}18`,
                  color: accent,
                }}
              >
                <Icon className="size-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h4 className="text-sm font-black text-brand-dark dark:text-white">
                {title}
              </h4>
              {badge ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold",
                    badgeClassName || "bg-[#DBEAFE] text-[#1D4ED8]"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {missingCount > 0 ? (
              <span className="h-6 px-2 rounded-full bg-[#FEE2E2] text-red-600 text-[10.5px] font-black">
                {missingCount} ناقص
              </span>
            ) : null}
            {onEdit ? <EditBtn onClick={onEdit} /> : null}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export function Field({ label, value, empty, editKey }) {
  const isEmpty = empty || value === "" || value == null;
  const valueClass = cn(
    "font-bold text-left truncate min-w-0",
    isEmpty ? "text-[#D1D5DB] dark:text-white/25" : "text-gray-900 dark:text-white/90"
  );
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-gray-400 font-medium shrink-0">{label}</span>
      {editKey ? (
        // د21: تعديل سريع للحقول المسموحة (PATCH + سجل النشاط)
        <InlineEditableValue editKey={editKey} className={valueClass}>
          {isEmpty ? "—" : value}
        </InlineEditableValue>
      ) : (
        <span className={valueClass}>{isEmpty ? "—" : value}</span>
      )}
    </div>
  );
}

export function GridField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-xs font-bold text-gray-900 dark:text-white/90 truncate">
        {value || "—"}
      </p>
    </div>
  );
}

export function Money({ value, className }) {
  const amount = Number(
    typeof value === "string" ? value.replace(/,/g, "").trim() : value
  );
  const display = Number.isFinite(amount) ? amount.toLocaleString("en-US") : "—";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-black text-green-700 dark:text-[#6EE7B7]",
        className
      )}
    >
      {display}
      <Image src={greenRial} alt="" width={12} height={12} />
    </span>
  );
}
