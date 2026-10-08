"use client";

import { ReportKpiGrid } from "../shared/report-kpi-card";
import HorizontalBarChart from "../shared/horizontal-bar-chart";
import ReportSectionCard from "../shared/report-section-card";
import ReportError from "../shared/report-error";
import Loader from "@/components/home/loader";
import { useOrdersReport } from "@/src/hooks/use-reports";
import { formatDurationMinutes } from "@/src/lib/format-duration";

// د3: «غير مكتمل» هنا = غير المدفوعة (تبويب «غير مكتمل» في القوائم = مسودات الخطوة < 4)، و«مسودة عقد» أُزيلت (دائماً 0 ولا تطابق أي قائمة).
const KPI_FIELDS = [["total", "إجمالي الطلبات", "file"], ["new", "حالة «جديد»", "filePlus", "danger"], ["paid", "مدفوعة", "creditCard"], ["incomplete", "غير مدفوعة", "xCircle", "warning"], ["canceled", "ملغاة", "xCircle", "danger"], ["returned", "مسترجعة", "undo", "muted"]];

export default function OrdersReportTab({ period, dateFrom, dateTo, contractType, employee }) {
  const { data, isLoading, isError, error, refetch } = useOrdersReport(period, dateFrom, dateTo, contractType, employee);
  if (isLoading) return <Loader />;
  if (isError) return <ReportError title="الطلبات" error={error} fallback="تعذّر تحميل تقرير الطلبات." onRetry={refetch} />;
  const kpis = KPI_FIELDS.map(([key, label, icon, tone]) => ({ key, label, value: data?.kpis?.[key] ?? 0, icon, tone }));
  const minutes = data?.kpis?.avg_completion_minutes ?? 0;
  kpis.push({ key: "avgTime", label: "متوسط مدة الإنجاز", value: formatDurationMinutes(minutes), icon: "clock", isText: true });
  const colorize = (items = []) => items.map((item, index) => ({ ...item, label: item.label ?? item.stage, color: ["#0A4D33", "#1E40AF", "#CA8A04", "#DC2626"][index % 4] }));
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <ReportKpiGrid items={kpis} columns="grid-cols-2 sm:grid-cols-4 2xl:grid-cols-7" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard title="الطلبات حسب الموظف">
          <HorizontalBarChart items={colorize(data?.by_employee)} />
        </ReportSectionCard>

        <ReportSectionCard title="الطلبات حسب نوع العقد">
          <HorizontalBarChart items={colorize(data?.by_contract_type)} />
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="الطلبات حسب المرحلة">
        <HorizontalBarChart items={colorize(data?.by_stage)} />
      </ReportSectionCard>
    </div>
  );
}
