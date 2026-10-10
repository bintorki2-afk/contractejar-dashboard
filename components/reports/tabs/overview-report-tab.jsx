"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Clock, Gauge, Megaphone, PlusCircle, Scale, Undo2, Wallet } from "lucide-react";
import { axiosInstance } from "@/src/utils/axios";
import { cn } from "@/lib/utils";
import Loader from "@/components/home/loader";
import ReportError from "../shared/report-error";
import { formatDurationHours } from "@/src/lib/format-duration";

const CARD_ICONS = {
  orders_today: CalendarDays,
  orders_week: CalendarDays,
  revenue: Wallet,
  extra_fees: PlusCircle,
  price_differences: Scale,
  refunds: Undo2,
  net_revenue: Wallet,
  avg_notarization_hours: Clock,
  completion_rate: BadgeCheck,
  top_source: Megaphone,
};

/** قيمة البطاقة كنص — null ⇒ «—» (لا 0 ولا 100% مضلِّلة). */
export function formatOverviewCard(card) {
  if (!card) return "—";
  const v = card.value;
  if (v == null || v === "") return "—";
  switch (card.key) {
    case "revenue":
    case "extra_fees":
    case "price_differences":
    case "refunds":
    case "net_revenue":
      return `${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })} ر.س`;
    case "avg_notarization_hours":
      return formatDurationHours(v);
    case "completion_rate":
      return `${v}%`;
    case "top_source":
      return typeof v === "object" ? v.label ?? v.key ?? "—" : String(v);
    default:
      return `${Number(v).toLocaleString("en-US")}`;
  }
}

function cardHint(card, definitions = {}) {
  if (card.key === "revenue" && card.refunded) {
    return `الإجمالي ${Number(card.gross ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} − المسترجع ${Number(card.refunded).toLocaleString("en-US", { maximumFractionDigits: 0 })} ر.س`;
  }
  if ((card.key === "extra_fees" || card.key === "price_differences") && card.count != null) {
    return `${card.count} ${card.key === "extra_fees" ? "رسم إضافي" : "فرق سعر"} في الفترة`;
  }
  if (card.key === "net_revenue") return "الأصلي + الإضافي + الفروقات − المسترجع";
  if (card.key === "top_source" && card.value && typeof card.value === "object") {
    return `${card.value.orders ?? 0} طلب`;
  }
  if (card.key === "orders_today" || card.key === "orders_week") return "دائماً اليوم/هذا الأسبوع";
  return definitions[card.key] ?? null;
}

/**
 * «نظرة عامة» (د3): ستة أرقام من نطاق واحد متّسق — GET /admin/reports/overview?range=.
 * باقي التبويبات تفاصيل ثانوية.
 */
export default function OverviewReportTab() {
  const [range, setRange] = useState("week");
  const query = useQuery({
    queryKey: ["report", "overview", range],
    queryFn: async () => (await axiosInstance.get("/admin/reports/overview", { params: { range } }))?.data?.data ?? null,
    placeholderData: keepPreviousData,
  });
  const data = query.data;

  if (query.isLoading) return <Loader />;
  if (query.isError) {
    return <ReportError title="نظرة عامة" error={query.error} fallback="تعذّر تحميل النظرة العامة." onRetry={query.refetch} />;
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="size-5 text-brand-deep dark:text-emerald-300" />
          <h2 className="text-[17px] font-extrabold text-[#0E1F18] dark:text-white">نظرة عامة — {data?.range_label}</h2>
        </div>
        <div role="radiogroup" aria-label="الفترة" className="inline-flex flex-wrap rounded-full border border-brand-line bg-white p-0.5 dark:bg-white/[0.04] dark:border-white/10">
          {(data?.ranges ?? []).map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={range === r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "h-8 px-3.5 rounded-full text-[12.5px] font-bold",
                range === r.key ? "bg-brand-deep text-white" : "text-[#4B5753] hover:text-brand-deep dark:text-white/60"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", query.isFetching && "opacity-70")}>
        {(data?.cards ?? []).map((card) => {
          const Icon = CARD_ICONS[card.key] ?? Gauge;
          const hint = cardHint(card, data?.definitions);
          return (
            <div key={card.key} className="rounded-2xl border border-brand-line bg-white p-5 dark:bg-[#0F1C16] dark:border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#4B5753] dark:text-white/60">{card.label}</span>
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Icon className="size-[18px]" />
                </span>
              </div>
              <p className="mt-3 text-[30px] font-extrabold leading-none tabular-nums text-[#0E1F18] dark:text-white">
                {formatOverviewCard(card)}
              </p>
              {hint ? <p className="mt-2 text-[11.5px] leading-relaxed text-[#8A958F] dark:text-white/45">{hint}</p> : null}
            </div>
          );
        })}
      </div>

      {data?.pending_charges || data?.open_data_requests != null ? (
        <div className="flex flex-wrap gap-2 text-[12.5px] font-bold" data-overview-pending>
          <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-[#7A4B00] dark:bg-amber-500/10 dark:text-amber-300">
            رسوم بانتظار الدفع: {data?.pending_charges?.count ?? 0} ({Number(data?.pending_charges?.amount ?? 0).toLocaleString("en-US")} ر.س)
          </span>
          <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-[#7A4B00] dark:bg-amber-500/10 dark:text-amber-300">
            طلبات مرفق ناقص مفتوحة: {data?.open_data_requests ?? 0}
          </span>
        </div>
      ) : null}

      {data?.definitions?.scope ? (
        <p className="text-[11.5px] text-[#8A958F] dark:text-white/40">
          النطاق: {data.definitions.scope}. الطلبات {data.orders_in_range ?? "—"} · المدفوعة {data.paid_in_range ?? "—"} · الموثّقة {data.notarized_in_range ?? "—"}.
        </p>
      ) : null}
    </div>
  );
}
