"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { computeEmployeePerfMetrics, findKpiCard } from "./employee-perf-metrics";
import "./employee-perf.css";

function barColor(percent) {
  const p = percent ?? 0;
  if (p >= 80) return "#0E8C7B";
  if (p >= 55) return "#D9930D";
  return "#B3261E";
}

function PerfBarRow({ label, percent }) {
  const value = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className="perf-barrow">
      <span>{label}</span>
      <span className="perf-barr">
        <i style={{ width: `${value}%`, background: barColor(value) }} />
      </span>
      <b>{value}%</b>
    </div>
  );
}

function PerfKpi({ label, value, danger }) {
  return (
    <div className="perf-kpi">
      <b className={cn(danger && "text-[#B3261E] dark:text-red-300")}>{value}</b>
      <small>{label}</small>
    </div>
  );
}

export default function EmployeePerfCard({ item, periodLabel, detailsHref }) {
  const employee = item.employee ?? {};
  const shift = item.shift ?? {};
  const isOnDuty = shift.is_on_duty ?? shift.duty_status === "inside";
  const maxCompleted = item._maxCompleted ?? findKpiCard(item, "completed")?.value ?? 0;

  const metrics = computeEmployeePerfMetrics(item, maxCompleted);
  const scoreTier = metrics.score >= 80 ? "sg" : metrics.score >= 55 ? "sa" : "sr";
  const receivedLabel = findKpiCard(item, "received")?.label_ar ?? `استلم (${periodLabel})`;

  return (
    <div className="perfcard">
      <div className="perf-head">
        <div className="min-w-0">
          <b>{employee.name_label ?? employee.name ?? "—"}</b>
          <small>{shift.label_ar ?? "—"}</small>
        </div>
        <span className={cn("dutychip", isOnDuty && "on")}>
          {isOnDuty ? "● داخل الدوام الآن" : "خارج الدوام"}
        </span>
      </div>

      <div className="perf-main">
        <div className={cn("perf-score", scoreTier)}>
          <b>{metrics.score}</b>
          <small>من 100</small>
        </div>
        <div className="perf-kpis">
          <PerfKpi label={receivedLabel} value={metrics.received} />
          <PerfKpi label={findKpiCard(item, "open_now")?.label_ar ?? "مفتوح الآن"} value={metrics.openNow} />
          <PerfKpi
            label={findKpiCard(item, "late_over_24h")?.label_ar ?? "متأخر >24س"}
            value={metrics.late}
            danger={metrics.late > 0}
          />
          <PerfKpi label={findKpiCard(item, "completed")?.label_ar ?? "منجَز بالفترة"} value={metrics.completed} />
        </div>
      </div>

      {/* دفعة هـ (2.7): رسوم أضافها · فروقات سعر · طلبات مرفق · حوالات سجّلها */}
      {(item.fees_added_count ?? item.price_difference_count ?? item.data_requests_count ?? item.bank_transfers_recorded) != null ? (
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#6B7B71] dark:text-white/55" data-perf-money>
          <span className="rounded-full bg-[#F3F6F4] px-2 py-0.5 dark:bg-white/[0.06]">رسوم أضافها {item.fees_added_count ?? 0}{Number(item.fees_added_amount) > 0 ? ` · ${Number(item.fees_added_amount).toLocaleString("en-US")} ر.س` : ""}</span>
          <span className="rounded-full bg-[#F3F6F4] px-2 py-0.5 dark:bg-white/[0.06]">فروقات {item.price_difference_count ?? 0}</span>
          <span className="rounded-full bg-[#F3F6F4] px-2 py-0.5 dark:bg-white/[0.06]">طلبات مرفق {item.data_requests_count ?? 0}</span>
          <span className="rounded-full bg-[#F3F6F4] px-2 py-0.5 dark:bg-white/[0.06]">حوالات {item.bank_transfers_recorded ?? 0}{Number(item.bank_transfers_amount) > 0 ? ` · ${Number(item.bank_transfers_amount).toLocaleString("en-US")} ر.س` : ""}</span>
        </div>
      ) : null}

      <PerfBarRow label={metrics.pickLabel} percent={metrics.pickPct} />
      <PerfBarRow label="التزام المعالجة (بلا تأخر >24س)" percent={metrics.procPct} />
      <PerfBarRow label="حجم الإنجاز مقارنةً بالأعلى" percent={metrics.volPct} />

      {detailsHref ? (
        <Link href={detailsHref} className="xbtn perf-detbtn">
          التفاصيل الكاملة ←
        </Link>
      ) : null}
    </div>
  );
}
