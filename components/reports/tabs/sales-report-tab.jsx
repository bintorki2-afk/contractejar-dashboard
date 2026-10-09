"use client";

import { ReportKpiGrid } from "../shared/report-kpi-card";
import HorizontalBarChart, { VerticalBarChart } from "../shared/horizontal-bar-chart";
import ReportSectionCard, { ReportLineList } from "../shared/report-section-card";
import Loader from "@/components/home/loader";
import { useSalesReport } from "@/src/hooks/use-reports";
import ReportError from "../shared/report-error";

export default function SalesReportTab({ period, dateFrom, dateTo, contractType, employee }) {
  const { data, isLoading, isError, error, refetch } = useSalesReport(period, dateFrom, dateTo, contractType, employee);
  if (isLoading) return <Loader />;
  if (isError) return <ReportError title="المبيعات والإيرادات" error={error} fallback="تعذّر تحميل تقرير المبيعات." onRetry={refetch} />;
  const kpis = [
    ["total_sales", "إجمالي المبيعات (ريال)", "wallet"], ["payments_count", "عدد عمليات الدفع", "receipt"],
    ["avg_order_value", "متوسط قيمة الطلب", "creditCard"], ["discounts_used", "الخصومات المستخدمة", "tag"],
    ["extra_fees", "رسوم إضافية", "filePlus"], ["price_differences", "فروقات السعر", "layers"],
    ["refunds", "المبالغ المسترجعة", "undo"], ["net_revenue", "صافي الإيرادات", "banknote"],
  ].map(([key, label, icon]) => ({ key, label, value: data?.kpis?.[key] ?? 0, icon }));
  const money = (value) => `${Number(value ?? 0).toLocaleString("en-US")} ريال`;
  return (
    <div className="flex flex-col gap-5">
      <ReportKpiGrid items={kpis} />

      <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard title="المبيعات حسب الفترة">
          <ReportLineList
            items={(data?.by_period ?? []).map((row) => ({
              label: row.label,
              value: money(row.value),
            }))}
          />
        </ReportSectionCard>

        <ReportSectionCard title="اتجاه المبيعات اليومي">
          {(data?.daily ?? []).length > 0 ? (
            <VerticalBarChart items={data.daily} height={180} pageSize={7} />
          ) : (
            <p className="text-13 text-gray-400 dark:text-white/50">لا توجد بيانات لعرضها في هذه الفترة.</p>
          )}
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard title="الإيرادات حسب مدة العقد">
          <HorizontalBarChart items={data?.revenue_by_duration ?? []} />
        </ReportSectionCard>

        <ReportSectionCard title="الإيرادات حسب نوع العقد">
          <HorizontalBarChart items={data?.revenue_by_contract_type ?? []} />
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="hidden lg:block" />
        <ReportSectionCard title="الخصومات والاسترجاعات وصافي الإيراد">
          <ReportLineList items={[
            { label: "الخصومات الممنوحة", value: money(data?.summary?.discounts_granted), tone: "gold" },
            { label: "عدد الطلبات المخصومة", value: `${data?.summary?.discounted_orders_count ?? 0} طلب` },
            { label: "الإيراد الأصلي", value: money(data?.kpis?.original_revenue ?? data?.summary?.original_revenue) },
            { label: `رسوم إضافية (${data?.kpis?.extra_fees_count ?? 0})`, value: money(data?.summary?.extra_fees ?? data?.kpis?.extra_fees), tone: "gold" },
            { label: `فروقات السعر (${data?.kpis?.price_differences_count ?? 0})`, value: money(data?.summary?.price_differences ?? data?.kpis?.price_differences), tone: "gold" },
            { label: `حوالات بنكية (${data?.kpis?.bank_transfers_count ?? 0})`, value: money(data?.kpis?.bank_transfers) },
            { label: "المبالغ المسترجعة", value: money(data?.summary?.refunds_total ?? data?.summary?.refunds) },
            { label: "نسبة الاسترجاع من المبيعات", value: `${data?.summary?.refund_rate_percent ?? 0}%` },
            { label: "الصافي = الأصلي + الإضافي + الفروقات − المسترجع", value: money(data?.summary?.net_revenue ?? data?.summary?.net_revenue_after_refunds), tone: "green", bold: true },
          ]} />
        </ReportSectionCard>
      </div>
    </div>
  );
}
