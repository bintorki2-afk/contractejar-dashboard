"use client";

import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKETING_PERIODS, useMarketingPeriod } from "@/src/hooks/use-marketing-tracking";

/* ------------------------------------------------------------------ *
 * Formatting — the API returns numbers already computed. We only add
 * locale grouping, the currency label, and the `x` / `—` conventions.
 * ------------------------------------------------------------------ */

export const DASH = "—";

export function fmtInt(value) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return DASH;
  return Number(value).toLocaleString("en-US");
}

export function fmtMoney(value, currencyLabel = "﷼") {
  if (value == null || value === "" || Number.isNaN(Number(value))) return DASH;
  return `${Number(value).toLocaleString("en-US")} ${currencyLabel}`;
}

/** Profit / loss — prefix `+` when positive. */
export function fmtSignedMoney(value, currencyLabel = "﷼") {
  if (value == null || value === "" || Number.isNaN(Number(value))) return DASH;
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("en-US")} ${currencyLabel}`;
}

/** ROAS pill text — `x2.28`, or `—` when null (no spend / not connected). */
export function fmtRoas(value) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return DASH;
  return `x${Number(value)}`;
}

export function fmtPercent(value) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return DASH;
  return `${Number(value)}%`;
}

/** Change badge — green ▲ when >= 0, red ▼ when < 0. */
export function ChangeBadge({ value, className }) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const up = n >= 0;
  return (
    <span className={cn(up ? "mkt-up" : "mkt-down", className)}>
      {up ? "▲" : "▼"} {Math.abs(n)}%
    </span>
  );
}

const ROAS_TONE_CLASS = {
  good: "roas-hi",
  ok: "roas-mid",
  bad: "roas-lo",
  muted: "roas-muted",
};

/** ROAS chip driven by the API's `roas_tone` (not recomputed on the client). */
export function RoasToneChip({ value, tone }) {
  return (
    <span className={cn("roas", ROAS_TONE_CLASS[tone] || "roas-muted")}>{fmtRoas(value)}</span>
  );
}

const COLOR_CLASS = {
  blue: "ch-g",
  purple: "ch-m",
  black: "ch-t",
  yellow: "ch-s",
  gray: "ch-x",
};

/** Channel / campaign pill — colour comes from the API `color` token. */
export function ColorChip({ label, color, className }) {
  return (
    <span className={cn("mkt-ch", COLOR_CLASS[color] || "ch-x", className)}>{label}</span>
  );
}

const RANK_TONE_CLASS = { good: "ptop", warn: "pmid", muted: "plow" };

export function RankChip({ rank, tone }) {
  if (rank == null) return <span className="mkt-flat">{DASH}</span>;
  return <span className={cn("mkt-pos", RANK_TONE_CLASS[tone] || "plow")}>{rank}</span>;
}

const KW_STATUS = {
  increased: { cls: "mkt-up", icon: "▲" },
  decreased: { cls: "mkt-down", icon: "▼" },
  stable: { cls: "mkt-flat", icon: "▬" },
};

export function KeywordStatusBadge({ status, label }) {
  const conf = KW_STATUS[status] || KW_STATUS.stable;
  return (
    <span className={conf.cls}>
      {conf.icon} {label || status || DASH}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Async state wrapper — loading / error (with retry) / empty.
 * ------------------------------------------------------------------ */

export function TrackingState({ isLoading, error, isEmpty, onRetry, children, emptyText }) {
  if (isLoading) {
    return <p className="text-13 text-gray-400 dark:text-white/50 py-4">جارٍ التحميل…</p>;
  }
  if (error) {
    const message =
      error?.response?.data?.message ||
      (error?.response?.status === 403
        ? "ليس لديك صلاحية لعرض بيانات التسويق."
        : "تعذّر تحميل بيانات التسويق.");
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap py-2">
        <p className="text-13 text-red-600 dark:text-red-300">{message}</p>
        {onRetry ? (
          <button type="button" className="mk-mini inline-flex items-center gap-1.5" onClick={onRetry}>
            <RotateCw className="size-3.5" />
            إعادة المحاولة
          </button>
        ) : null}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <p className="text-13 text-gray-400 dark:text-white/50 py-4">
        {emptyText || "لا توجد بيانات لهذه الفترة."}
      </p>
    );
  }
  return children;
}

/* ------------------------------------------------------------------ *
 * Shared period filter bar — one instance per tab, state in the URL.
 * ------------------------------------------------------------------ */

export function PeriodFilterBar({ periods }) {
  const { period, dateFrom, dateTo, isCustom, setPeriod, setRange } = useMarketingPeriod();
  // Prefer the API-provided period labels; fall back to the canonical list.
  const options = Array.isArray(periods) && periods.length ? periods : MARKETING_PERIODS;

  return (
    <div className="mkt-syncbar" style={{ marginBottom: 14 }}>
      <div className="mkt-cats">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPeriod(opt.key)}
            aria-pressed={period === opt.key}
              className={cn("mkt-catb", period === opt.key && "on")}
          >
            {opt.label_ar || opt.label || opt.key}
          </button>
        ))}
      </div>

      {isCustom ? (
        <div className="mkt-syncright">
          <label className="mkt-synctime" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            من
            <input
              type="date"
              className="mk-mini"
              value={dateFrom || ""}
              max={dateTo || undefined}
              onChange={(e) => setRange(e.target.value, dateTo)}
            />
          </label>
          <label className="mkt-synctime" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            إلى
            <input
              type="date"
              className="mk-mini"
              value={dateTo || ""}
              min={dateFrom || undefined}
              onChange={(e) => setRange(dateFrom, e.target.value)}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
