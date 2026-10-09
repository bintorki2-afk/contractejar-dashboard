"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import SectionCard from "../shared/section-card";
import GroupedBarChart from "../shared/grouped-bar-chart";
import {
  ChangeBadge,
  ColorChip,
  DASH,
  KeywordStatusBadge,
  PeriodFilterBar,
  RankChip,
  RoasToneChip,
  TrackingState,
  fmtInt,
  fmtMoney,
  fmtPercent,
  fmtRoas,
  fmtSignedMoney,
} from "../shared/tracking-ui";
import {
  useMarketingChannels,
  useMarketingOverview,
} from "@/src/hooks/use-marketing-tracking";

export default function OverviewTab() {
  const overview = useMarketingOverview();
  const channels = useMarketingChannels();

  const data = overview.data;
  const currency = data?.currency_label_ar || "﷼";
  const summary = data?.summary || {};
  const kpis = data?.kpis || {};

  return (
    <div>
      <PeriodFilterBar periods={data?.periods} />

      <TrackingState
        isLoading={overview.isLoading}
        error={overview.error}
        isEmpty={!overview.isLoading && !data}
        onRetry={overview.refetch}
      >
        {/* ROAS hero (section 4 header) */}
        <div className="mkt-hero">
          <div className="mkt-hero-l">
            <div className="mkt-hero-lbl">العائد على الإنفاق الإعلاني (ROAS)</div>
            <div className="mkt-hero-big">{fmtRoas(summary.roas)}</div>
            {summary.roas_caption_ar ? (
              <div className="mkt-hero-cap">{summary.roas_caption_ar}</div>
            ) : null}
          </div>
          <div className="mkt-hero-r">
            <div className="mkt-hero-kpi">
              <span>{fmtMoney(summary.spend, currency)}</span>
              <small>إجمالي الصرف</small>
            </div>
            <div className="mkt-hero-kpi">
              <span>{fmtMoney(summary.revenue, currency)}</span>
              <small>إيراد مُسنَد</small>
            </div>
            <div
              className={cn(
                "mkt-hero-kpi",
                Number(summary.profit) >= 0 ? "pos" : "neg"
              )}
            >
              <span>{fmtSignedMoney(summary.profit, currency)}</span>
              <small>ربح صافٍ</small>
            </div>
          </div>
        </div>

        {/* KPI cards (section 4) */}
        <div className="cust-kcards">
          <Kpi value={kpis.cac == null ? DASH : fmtMoney(kpis.cac, currency)} label="تكلفة العميل CAC" tone="y" />
          <Kpi value={fmtPercent(kpis.conversion_rate)} label="معدل التحويل زائر→عميل" />
          <Kpi value={fmtInt(kpis.paying_customers)} label="عملاء دفعوا" tone="g" />
          <Kpi value={fmtInt(kpis.marketing_orders)} label="طلبات من التسويق" tone="e" />
          <Kpi
            value={fmtInt(kpis.app_visits?.value)}
            label="زيارات التطبيق"
            tone="b"
            change={kpis.app_visits?.change_percent}
          />
          <Kpi
            value={fmtInt(kpis.website_visits?.value)}
            label="زيارات الموقع"
            tone="b"
            change={kpis.website_visits?.change_percent}
          />
        </div>

        <div className="cpf-grid cols-2">
          <SectionCard title="الصرف مقابل الإيراد — حسب القناة">
            {Array.isArray(data?.chart) &&
            data.chart.some((row) => Number(row.spend) || Number(row.revenue)) ? (
              <GroupedBarChart
                items={data.chart.map((row) => ({
                  label: row.label_ar || row.source,
                  spend: Number(row.spend) || 0,
                  revenue: Number(row.revenue) || 0,
                }))}
              />
            ) : (
              <p className="mkt-synchint">لا توجد بيانات صرف/إيراد لهذه الفترة.</p>
            )}
          </SectionCard>

          <SectionCard title="القمع التسويقي الكامل">
            <TrackingState
              isLoading={channels.isLoading}
              error={channels.error}
              isEmpty={!channels.isLoading && !channels.data?.funnel?.length}
              onRetry={channels.refetch}
            >
              <FunnelBars steps={channels.data?.funnel} />
            </TrackingState>
          </SectionCard>
        </div>

        {/* Paid-channel ROI table (section 2) */}
        <SectionCard title="أداء القنوات المدفوعة (ROI)" className="mt-[14px]">
          <TrackingState
            isLoading={channels.isLoading}
            error={channels.error}
            isEmpty={!channels.isLoading && !channels.data?.channels?.length}
            onRetry={channels.refetch}
          >
            <div className="tblwrap">
              <table className="mkt-tbl">
                <thead>
                  <tr>
                    <th>القناة</th>
                    <th>الصرف</th>
                    <th>الإيراد</th>
                    <th>ROAS</th>
                    <th>تحويلات</th>
                    <th>CAC</th>
                    <th>الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {(channels.data?.channels || []).map((row) => (
                    <tr key={row.source}>
                      <td>
                        <ColorChip label={row.label_ar || row.source} color={row.color} />
                      </td>
                      <td>{fmtMoney(row.spend, currency)}</td>
                      <td>{fmtMoney(row.revenue, currency)}</td>
                      <td>
                        <RoasToneChip value={row.roas} tone={row.roas_tone} />
                      </td>
                      <td>{fmtInt(row.conversions)}</td>
                      <td>{row.cac == null ? DASH : fmtMoney(row.cac, currency)}</td>
                      <td className={Number(row.profit) >= 0 ? "mk-pos" : "mk-neg"}>
                        {fmtSignedMoney(row.profit, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TrackingState>
        </SectionCard>

        {/* Overview widgets (section 3) */}
        <div className="mkt-top3">
          <SectionCard title="أكثر الحملات تحقيقًا للطلبات">
            <TopList
              rows={data?.top_campaigns}
              empty="لا توجد حملات بها طلبات."
              render={(item) => (
                <div key={`${item.campaign}-${item.orders}`} className="mkt-toprow">
                  <span className="mkt-topn">
                    {item.campaign} <ColorChip label={item.label_ar} color={item.color} />
                  </span>
                  <b>{fmtInt(item.orders)} طلب</b>
                </div>
              )}
            />
          </SectionCard>

          <SectionCard title="أكثر الصفحات والمقالات زيارة">
            <TopList
              rows={data?.top_pages}
              empty="اربط Search Console لعرض الصفحات الأكثر زيارة."
              render={(item) => (
                <div key={item.path || item.title} className="mkt-toprow">
                  <span className="mkt-topn">
                    {item.title}
                    {item.type_label_ar ? (
                      <span className="mkt-cat">{item.type_label_ar}</span>
                    ) : null}
                    {item.path ? <span className="mkt-url">{item.path}</span> : null}
                  </span>
                  <b>{fmtInt(item.visits)}</b>
                </div>
              )}
            />
          </SectionCard>

          <SectionCard title="أهم الكلمات في Google">
            <TopList
              rows={data?.top_keywords}
              empty="اربط Search Console لعرض ترتيب الكلمات."
              render={(item, index) => (
                <div key={`${item.keyword}-${index}`} className="mkt-toprow">
                  <span className="mkt-topn">
                    {item.rank != null ? <RankChip rank={item.rank} tone="good" /> : null}{" "}
                    {item.keyword}
                  </span>
                  <KeywordStatusBadge status={item.status} label={item.status_label_ar} />
                </div>
              )}
            />
          </SectionCard>
        </div>

        {/* Best / weakest campaign highlight cards */}
        <div className="cpf-grid cols-2" style={{ marginTop: 14 }}>
          <HighlightCard data={data?.best_campaign} kind="good" title="أفضل حملة (ROAS)" currency={currency} />
          <HighlightCard data={data?.weakest_campaign} kind="bad" title="أضعف حملة (ROAS)" currency={currency} />
        </div>
      </TrackingState>
    </div>
  );
}

function Kpi({ value, label, tone, change }) {
  return (
    <div className={cn("ckpi", tone)}>
      <div className="ckpi-v">{value}</div>
      <div className="ckpi-l">{label}</div>
      {change != null && change !== "" && !Number.isNaN(Number(change)) ? (
        <div className={cn("ckpi-sub", Number(change) < 0 && "down")}>
          {Number(change) >= 0 ? "▲" : "▼"} {Math.abs(Number(change))}%
        </div>
      ) : null}
    </div>
  );
}

function FunnelBars({ steps }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((step, index) => {
        const width = Math.max(Math.min(Number(step.share_percent) || 0, 100), 3);
        return (
          <div key={step.key || step.label_ar} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-left tabular-nums">
              {index > 0 ? <ChangeBadge value={step.change_percent} /> : null}
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="flex-1 h-[30px] bg-[#eef2f0] rounded-[8px] overflow-hidden dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-[8px] bg-[#0B5A3C] transition-all duration-500 flex items-center px-3"
                  style={{ width: `${width}%` }}
                >
                  <span className="text-[11.5px] font-extrabold text-white tabular-nums whitespace-nowrap">
                    {fmtInt(step.value)}
                  </span>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#2c3a34] shrink-0 min-w-[84px] text-right dark:text-white/75">
                {step.label_ar}
                {step.rate_from_previous != null ? (
                  <span className="block text-[10.5px] font-semibold text-[#9aa8a2]">
                    {fmtPercent(step.rate_from_previous)} من السابق
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopList({ rows, render, empty }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <p className="mkt-synchint" style={{ margin: 0 }}>{empty}</p>;
  }
  return <div className="mkt-toplist">{rows.map(render)}</div>;
}

function HighlightCard({ data, kind, title, currency }) {
  if (!data) return null;
  return (
    <div className={cn("mk-callout", kind)}>
      <div className="mk-co-t">{title}</div>
      <div className="mk-co-n" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {data.label_ar ? <ColorChip label={data.label_ar} color={data.color} /> : null}
        {data.campaign}
      </div>
      <div className="mk-co-v">
        {fmtRoas(data.roas)}
        {data.result_amount != null
          ? ` · ${data.result_label_ar || ""} ${fmtInt(data.result_amount)} ${currency}`.trimEnd()
          : ""}
      </div>
      <Link href="?tab=campaigns" className="mk-co-b">
        التفاصيل →
      </Link>
    </div>
  );
}
