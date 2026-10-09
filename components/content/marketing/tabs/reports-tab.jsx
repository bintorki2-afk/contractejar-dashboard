"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  useExportMarketingReport,
  useMarketingReport,
  useMarketingReportChannels,
} from "@/src/hooks/use-marketing-reports";
import SectionCard from "../shared/section-card";
import { StatCardRow } from "../shared/stat-card";
import {
  ChangeBadge,
  ColorChip,
  DASH,
  PeriodFilterBar,
  RoasToneChip,
  TrackingState,
  fmtInt,
  fmtMoney,
  fmtSignedMoney,
} from "../shared/tracking-ui";

const CHANNEL_OPTIONS = [
  { id: "all", label: "كل القنوات" },
  { id: "google", label: "قوقل" },
  { id: "meta", label: "ميتا" },
  { id: "tiktok", label: "تيك توك" },
  { id: "snapchat", label: "سناب" },
  { id: "twitter", label: "إكس" },
];

const EXPORTS = [
  { format: "pdf", label: "PDF" },
  { format: "xlsx", label: "Excel" },
  { format: "csv", label: "CSV" },
  { format: "email", label: "إرسال بالبريد" },
];

function formatValue(item, currencyLabel) {
  if (item.value == null) return DASH;
  if (item.is_money) return fmtMoney(item.value, currencyLabel);
  return `${fmtInt(item.value)}${item.suffix || ""}`;
}

export default function ReportsTab() {
  const { can } = usePermissions();
  const canExport = can(PERMISSION_SECTIONS.analytics, "view");
  const [channel, setChannel] = useState("all");

  const overview = useMarketingReport({ channel });
  const channelsReport = useMarketingReportChannels({ channel });
  const exportMutation = useExportMarketingReport();

  const data = overview.data;
  const currency = data?.currency_label_ar || "﷼";

  const handleExport = (format) => {
    exportMutation.mutate(
      { format, channel },
      {
        onSuccess: (res) => {
          if (res?.emailed) toast.success(res.message || "أُرسل التقرير إلى بريدك");
          else toast.success("تم تنزيل التقرير");
        },
        onError: (err) =>
          toast.error(err?.response?.data?.message || "تعذّر تصدير التقرير"),
      }
    );
  };

  const stats = (data?.stats || []).map((s) => ({
    value: formatValue(s, currency),
    label: s.label_ar,
    tone: s.key === "total_revenue" || s.key === "revenue_per_riyal" ? "g" : s.key === "marketing_cost" ? "y" : "b",
    trend:
      s.change_percent == null
        ? undefined
        : { direction: s.change_percent >= 0 ? "up" : "down", value: `${Math.abs(s.change_percent)}%` },
  }));

  return (
    <div>
      <PeriodFilterBar periods={data?.periods} />

      <div className="mkt-blogbar" style={{ marginTop: 0 }}>
        <div className="mkt-cats">
          {EXPORTS.map((opt) => (
            <button
              key={opt.format}
              type="button"
              className="mk-mini"
              onClick={() => handleExport(opt.format)}
              disabled={!canExport || exportMutation.isPending}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          className="mk-mini"
          dir="rtl"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {CHANNEL_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <TrackingState
        isLoading={overview.isLoading}
        error={overview.error}
        isEmpty={!overview.isLoading && !data}
        onRetry={overview.refetch}
      >
        {data?.highlights?.length ? (
          <div className="mkt-best4">
            {data.highlights.map((item) => (
              <div key={item.key} className="cpf-sec mk-best">
                <div className="mk-co-t">{item.title_ar}</div>
                <div
                  className="mk-co-n"
                  style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                >
                  {item.badge && typeof item.badge === "object" ? (
                    <ColorChip label={item.badge.label_ar} color={item.badge.color} />
                  ) : item.badge ? (
                    <span className="mkt-pos ptop">{item.badge}</span>
                  ) : null}
                  {item.label}
                </div>
                <div className="mk-co-v">{item.detail_ar}</div>
              </div>
            ))}
          </div>
        ) : null}

        {data?.comparison ? (
          <SectionCard title={data.comparison.title_ar} className="mt-[14px]">
            <div className="mkt-cmp">
              {(data.comparison.items || []).map((item) => (
                <div key={item.key} className="mkt-cmpc">
                  <div style={{ marginBottom: 4 }}>
                    <ChangeBadge value={item.change_percent} />
                  </div>
                  <div className="mkt-cmpv">
                    {item.is_money ? fmtMoney(item.value, currency) : fmtInt(item.value)}
                  </div>
                  <div className="mkt-cmpl">{item.label_ar}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {stats.length ? <StatCardRow items={stats} className="mt-[14px]" /> : null}

        <SectionCard title="تقرير القنوات المدفوعة" className="mt-[14px]">
          <TrackingState
            isLoading={channelsReport.isLoading}
            error={channelsReport.error}
            isEmpty={!channelsReport.isLoading && !channelsReport.data?.rows?.length}
            onRetry={channelsReport.refetch}
          >
            {channelsReport.data?.range_label_ar ? (
              <p className="mkt-synchint" style={{ marginTop: 0 }}>
                {channelsReport.data.range_label_ar}
              </p>
            ) : null}
            <div className="tblwrap">
              <table className="mkt-tbl">
                <thead>
                  <tr>
                    <th>القناة</th>
                    <th>الصرف</th>
                    <th>الإيراد</th>
                    <th>ROAS</th>
                    <th>العملاء المحتملون</th>
                    <th>تحويلات</th>
                    <th>CAC</th>
                    <th>الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {(channelsReport.data?.rows || []).map((row) => (
                    <tr key={row.source}>
                      <td>
                        <ColorChip label={row.label_ar || row.source} color={row.color} />
                      </td>
                      <td>{fmtMoney(row.spend, currency)}</td>
                      <td>{fmtMoney(row.revenue, currency)}</td>
                      <td>
                        <RoasToneChip value={row.roas} tone={row.roas_tone} />
                      </td>
                      <td>{fmtInt(row.leads)}</td>
                      <td>{fmtInt(row.conversions)}</td>
                      <td>{row.cac == null ? DASH : fmtMoney(row.cac, currency)}</td>
                      <td className={Number(row.profit) >= 0 ? "mk-pos" : "mk-neg"}>
                        {fmtSignedMoney(row.profit, currency)}
                      </td>
                    </tr>
                  ))}
                  {channelsReport.data?.total ? (
                    <tr>
                      <td className="mkt-title">الإجمالي</td>
                      <td className="mkt-title">{fmtMoney(channelsReport.data.total.spend, currency)}</td>
                      <td className="mkt-title">{fmtMoney(channelsReport.data.total.revenue, currency)}</td>
                      <td>
                        <RoasToneChip
                          value={channelsReport.data.total.roas}
                          tone={channelsReport.data.total.roas_tone}
                        />
                      </td>
                      <td className="mkt-title">{fmtInt(channelsReport.data.total.leads)}</td>
                      <td className="mkt-title">{fmtInt(channelsReport.data.total.conversions)}</td>
                      <td className="mkt-title">
                        {channelsReport.data.total.cac == null
                          ? DASH
                          : fmtMoney(channelsReport.data.total.cac, currency)}
                      </td>
                      <td className={Number(channelsReport.data.total.profit) >= 0 ? "mk-pos" : "mk-neg"}>
                        {fmtSignedMoney(channelsReport.data.total.profit, currency)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TrackingState>
        </SectionCard>
      </TrackingState>
    </div>
  );
}
