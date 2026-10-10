"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AirVent,
  Armchair,
  Bath,
  BedDouble,
  Box,
  Building2,
  Car,
  Check,
  ChefHat,
  ClipboardCopy,
  Copy,
  Droplets,
  Hash,
  Layers,
  Loader2,
  Paperclip,
  Ruler,
  Sofa,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEditableValue } from "./inline-edit";

const UNIT_ICONS = {
  unit_number: Hash,
  unit_type: Building2,
  floor_number: Layers,
  unit_area: Ruler,
  rooms: BedDouble,
  halls: Sofa,
  baths: Bath,
  kitchens: ChefHat,
  ac: AirVent,
  furnished: Armchair,
  kitchen_cabinets: Box,
  electricity_meter: Zap,
  water_meter: Droplets,
  parking: Car,
};

export async function copyText(text, message = "تم النسخ") {
  if (!text?.toString().trim()) {
    toast.error("لا يوجد نص للنسخ");
    return false;
  }
  try {
    await navigator.clipboard.writeText(String(text));
    toast.success(message);
    return true;
  } catch {
    toast.error("تعذر النسخ — اسمح للمتصفح بالوصول للحافظة");
    return false;
  }
}

/** زر نسخ صغير 28px (كما في المخطط). */
export function CopyBtn({ text, label = "نسخ", className }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => copyText(text)}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-[#DBE3DC] bg-white text-[#4B6B58] transition-colors hover:border-[#9FC0AD] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/10",
        className
      )}
    >
      <Copy className="size-3.5" />
    </button>
  );
}

/** أيقونة ملوّنة لحقول الوحدة. */
export function UnitIcon({ name, tone }) {
  const Icon = UNIT_ICONS[name];
  if (!Icon) return null;
  return (
    <span
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: tone?.bg ?? "#F0F4F2", color: tone?.fg ?? "#4B5753" }}
    >
      <Icon className="size-4" />
    </span>
  );
}

/**
 * خلية مدمجة «تسمية · قيمة · نسخ» — الأرقام كبيرة (big) بأرقام لاتينية؛
 * editKey يفعّل التعديل السريع (د21) عبر InlineEditableValue.
 */
export function Cell({ cell }) {
  if (!cell) return null;
  const valueNode = cell.link ? (
    <a
      href={cell.link}
      target="_blank"
      rel="noreferrer"
      className="text-[14px] font-semibold text-brand-deep underline underline-offset-2 dark:text-emerald-300"
    >
      {cell.linkLabel ?? cell.value}
    </a>
  ) : (
    <span className="inline-flex min-w-0 items-baseline gap-1">
      <span
        dir={cell.ltr || cell.big ? "ltr" : "auto"}
        className={cn(
          "font-semibold text-[#14231D] dark:text-white",
          cell.big ? "text-[17px] tracking-[0.5px] tabular-nums" : "text-[14px]",
          cell.highlight && "text-brand-deep dark:text-emerald-300"
        )}
      >
        {cell.value}
      </span>
      {cell.suffix ? <span className="text-[12.5px] font-medium text-[#14231D] dark:text-white">{cell.suffix}</span> : null}
      {cell.note ? <span className="text-[12px] font-medium text-[#6B7570] dark:text-white/50">{cell.note}</span> : null}
    </span>
  );
  return (
    <div
      data-cell={cell.key}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-[10px] border px-2.5 py-1.5",
        cell.highlight
          ? "border-[#BFE0CC] bg-[#E3F3EA] dark:border-emerald-500/30 dark:bg-emerald-500/10"
          : "border-[#E3E8E3] bg-[#FAFBF9] dark:border-white/10 dark:bg-white/[0.03]"
      )}
    >
      {cell.icon ? <UnitIcon name={cell.icon} tone={cell.tone} /> : null}
      {cell.label ? <span className="whitespace-nowrap text-[12px] text-[#6B7B71] dark:text-white/50">{cell.label}</span> : null}
      {cell.editKey ? (
        <InlineEditableValue editKey={cell.editKey} className="min-w-0">
          {valueNode}
        </InlineEditableValue>
      ) : (
        valueNode
      )}
      {cell.copy ? <CopyBtn text={cell.copyValue ?? cell.value} label={`نسخ ${cell.label ?? ""}`.trim()} /> : null}
    </div>
  );
}

export function CellRow({ cells = [], className }) {
  if (!cells.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-2", className)}>
      {cells.map((c) => (
        <Cell key={c.key} cell={c} />
      ))}
    </div>
  );
}

/** ملاحظة كهرمانية (وحدات متعددة / عنوان كصورة). */
export function AmberNote({ children, className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[10px] border border-[#F1D59A] bg-[#FFF7E6] px-3 py-2 text-[13px] font-semibold text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        className
      )}
    >
      <span aria-hidden>⚠</span>
      <span>{children}</span>
    </div>
  );
}

const pillBase =
  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-bold transition-colors disabled:opacity-60";

/**
 * بطاقة قسم من أقسام إيجار: «N · العنوان [+ معلومة في الرأس]» و(أدخلتها في إيجار ✓ · نسخ المجموعة · مرفق ناقص).
 */
export function SectionCard({
  id,
  number,
  title,
  headerExtra,
  subtitle,
  entry,
  onToggleEntry,
  entryPending = false,
  onCopyGroup,
  onRequestData,
  children,
  className,
}) {
  const [busy, setBusy] = useState(false);
  const done = Boolean(entry?.done);
  return (
    <section
      id={id}
      data-section={id}
      className={cn(
        "flex flex-col gap-2.5 rounded-[14px] border bg-white px-4 py-3.5 dark:bg-[#0F1C16]",
        done ? "border-[#BFE0CC] dark:border-emerald-500/30" : "border-[#E3E8E3] dark:border-white/10",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex min-w-0 flex-wrap items-center gap-2.5 text-[16px] font-bold text-brand-deep dark:text-emerald-300">
          <span>
            {number} · {title}
          </span>
          {headerExtra}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleEntry ? (
            <label
              className={cn(
                "inline-flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-bold transition-colors",
                done
                  ? "border-brand-deep bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]"
                  : "border-[#DBE3DC] bg-white text-[#2F4A3B] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white/70"
              )}
              title={done && entry?.by_name ? `أدخلها ${entry.by_name}` : "علّم القسم بعد إدخاله في إيجار (يُحفظ لكل طلب)"}
            >
              {entryPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(e) => onToggleEntry(e.target.checked)}
                  className="size-4 accent-brand-deep"
                  aria-label={`أدخلتها في إيجار — ${title}`}
                />
              )}
              {done ? <Check className="size-3.5" /> : null}
              أدخلتها في إيجار
            </label>
          ) : null}
          {onCopyGroup ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onCopyGroup();
                } finally {
                  setBusy(false);
                }
              }}
              className={cn(pillBase, "border-[#DBE3DC] bg-white text-[#2F4A3B] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white/70")}
            >
              <ClipboardCopy className="size-3.5" />
              نسخ المجموعة
            </button>
          ) : null}
          {onRequestData ? (
            <button
              type="button"
              onClick={onRequestData}
              aria-label={`طلب مرفق ناقص من العميل — ${title}`}
              title="طلب مرفق ناقص من العميل"
              className={cn(pillBase, "border-[#F1D59A] bg-[#FFF7E6] text-[#B25E00] hover:bg-[#FFF0D1] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300")}
            >
              <Paperclip className="size-3.5" />
              مرفق ناقص
            </button>
          ) : null}
        </div>
      </div>
      {subtitle ? <p className="text-[12px] text-[#6B7B71] dark:text-white/50">{subtitle}</p> : null}
      {children}
    </section>
  );
}

/** «تسمية · قيمة» في رأس القسم (نوع المستند / نوع العقد). */
export function HeaderInfo({ label, value, pulse = false }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#E3E8E3] bg-[#FAFBF9] px-2.5 py-1 text-[14px] font-medium text-[#14231D] dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
      <span className="text-[12px] text-[#6B7B71] dark:text-white/50">{label}</span>
      <span className={cn(pulse && "animate-pulse-ring rounded-full bg-brand-deep px-3 py-0.5 text-[13.5px] font-bold text-white dark:bg-emerald-500 dark:text-[#0B1411]")}>{value}</span>
    </span>
  );
}

/** تبويب (الوحدة / المرفق) — غير المختار ينبض عند تعدد الوحدات. */
export function Tab({ active, pulse = false, onClick, children, className }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? "border-brand-deep bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]"
          : pulse
            ? "animate-pulse-ring border-brand-deep bg-white font-bold text-brand-deep dark:bg-transparent dark:text-emerald-300"
            : "border-[#DBE3DC] bg-white text-[#2F4A3B] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white/70",
        className
      )}
    >
      {children}
    </button>
  );
}
