"use client";

import { useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/home/loader";
import { useProfitSettings, useProfitsReport, useUpdateProfitSettings } from "@/src/hooks/use-reports";
import { ReportKpiGrid } from "../shared/report-kpi-card";
import HorizontalBarChart from "../shared/horizontal-bar-chart";
import ReportSectionCard, { ReportLineList } from "../shared/report-section-card";
import ReportError from "../shared/report-error";

export default function ProfitsReportTab({ period, dateFrom, dateTo, contractType, employee }) {
  const { data, isLoading, isError, error, refetch } = useProfitsReport(
    period,
    dateFrom,
    dateTo,
    contractType,
    employee
  );
  const { data: settingsData } = useProfitSettings();
  const { mutate: updateSettings, isPending: isSavingSettings } = useUpdateProfitSettings();
  const [settings, setSettings] = useState(null);
  const currentSettings = settings ?? settingsData ?? {};
  if (isLoading) return <Loader />;
  if (isError) return <ReportError title="الأرباح والتكاليف" error={error} fallback="تعذّر تحميل تقرير الأرباح." onRetry={refetch} />;
  const k = data?.kpis ?? {};
  const kpis = [["customer_income", "دخل العملاء", "wallet"], ["gross_profit", "إجمالي الربح", "wallet"], ["net_profit", "صافي الربح", "wallet", "danger"], ["margin_percent", "هامش الربح", "percent"], ["profit_per_order", "ربح لكل طلب", "wallet"], ["ad_spend", "مصاريف الإعلانات", "wallet", "danger"]].map(([key, label, icon, tone]) => ({ key, label, value: key === "margin_percent" ? `${k[key] ?? 0}%` : k[key] ?? 0, icon, tone, isText: key === "margin_percent" }));
  const pnl = (data?.pnl ?? []).map((row) => ({ label: row.label, value: `${Number(row.value ?? 0).toLocaleString("en-US")} ريال`, tone: row.value < 0 ? "red" : "green", bold: row.is_total || row.is_subtotal, separator: row.is_subtotal }));
  const serviceProfitability = (data?.service_profitability ?? []).map((item) => ({
    label: `${item.label} — ${item.margin_percent ?? 0}%`,
    value: Number(item.profit ?? 0),
  }));
  const fields = [["moyasar_fee_percent", "رسوم Moyasar", "%"], ["monthly_salaries", "الرواتب الشهرية", "ريال"], ["operating_budget", "المصاريف التشغيلية", "ريال"], ["marketing_budget", "ميزانية التسويق", "ريال"]];
  // د7: لا حفظ تلقائي مع كل حرف — التعديل محلي حتى يضغط الموظف «حفظ الإعدادات».
  const toAsciiDigits = (v) => String(v).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g, ".");
  const editSetting = (key, rawValue) => {
    setSettings({ ...currentSettings, [key]: toAsciiDigits(rawValue) });
  };
  const isDirty = settings != null;
  const invalidKeys = fields
    .map(([key]) => key)
    .filter((key) => {
      const v = currentSettings[key];
      return v !== "" && v != null && Number.isNaN(Number(v));
    });
  const saveSettings = () => {
    if (invalidKeys.length) return;
    const next = Object.fromEntries(
      Object.entries(currentSettings).map(([key, v]) => [key, v === "" || v == null ? null : Number(v)])
    );
    updateSettings(next, {
      onSuccess: () => {
        setSettings(null);
        toast.success("تم حفظ إعدادات الأرباح");
      },
      onError: (err) => toast.error(err?.response?.data?.message || "تعذّر حفظ الإعدادات"),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <ReportKpiGrid items={kpis} />

      <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard title="أكثر و أقل الخدمات ربحاً">
          <HorizontalBarChart items={serviceProfitability} />
        </ReportSectionCard>

        <ReportSectionCard title="قائمة الأرباح والخسائر – كل الفترات">
          <ReportLineList items={pnl} />
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="إعدادات حساب الأرباح">
        <div  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map(([key, label, unit]) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-status-neutral dark:text-white/60">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentSettings[key] ?? ""}
                  inputMode="decimal"
                  dir="ltr"
                  onChange={(e) => editSetting(key, e.target.value)}
                  aria-invalid={invalidKeys.includes(key) || undefined}
                  className="flex-1 h-10 px-3 rounded-lg border border-surface-border-soft text-sm font-semibold text-gray-900 tabular-nums text-right focus:outline-none focus:border-brand-dark aria-[invalid]:border-red-500 dark:bg-[#0F1C16] dark:border-white/10 dark:text-white"
                />
                <span className="text-xs text-gray-400 shrink-0 dark:text-white/50">{unit}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {invalidKeys.length ? (
            <span className="text-xs font-semibold text-red-600">أدخل أرقاماً فقط</span>
          ) : isDirty ? (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">تعديلات غير محفوظة</span>
          ) : null}
          {isDirty ? (
            <button
              type="button"
              onClick={() => setSettings(null)}
              disabled={isSavingSettings}
              className="h-10 px-4 rounded-xl border border-surface-border-soft text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/70"
            >
              تراجع
            </button>
          ) : null}
          <button
            type="button"
            onClick={saveSettings}
            disabled={!isDirty || isSavingSettings || invalidKeys.length > 0}
            className="h-10 px-5 rounded-xl bg-brand-deep text-white text-sm font-bold hover:bg-brand-deep/90 disabled:opacity-50"
          >
            {isSavingSettings ? "جاري الحفظ…" : "حفظ الإعدادات"}
          </button>
        </div>
      </ReportSectionCard>
    </div>
  );
}
