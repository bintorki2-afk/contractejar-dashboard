"use client";

import { ReportKpiGrid } from "../shared/report-kpi-card";
import HorizontalBarChart from "../shared/horizontal-bar-chart";
import ReportSectionCard from "../shared/report-section-card";
import Loader from "@/components/home/loader";
import { useCustomersReport } from "@/src/hooks/use-reports";
import ReportError from "../shared/report-error";

const TH =
  "px-3 py-3 text-xs font-semibold text-gray-400 border-b border-[#EEF1F0] whitespace-nowrap text-right dark:text-white/50 dark:border-white/10";
const TD = "px-3 py-3 text-13 text-gray-700 border-b border-status-neutral-bg whitespace-nowrap dark:text-white/70 dark:border-white/10";

export default function CustomersReportTab({ period, dateFrom, dateTo, contractType, employee }) {
  const { data, isLoading, isError, error, refetch } = useCustomersReport(period, dateFrom, dateTo, contractType, employee);
  if (isLoading) return <Loader />;
  if (isError) return <ReportError title="العملاء" error={error} fallback="تعذّر تحميل تقرير العملاء." onRetry={refetch} />;
  const k = data?.kpis ?? {};
  const kpis = [["total", "إجمالي العملاء", k.total, "users"], ["new", "عملاء جدد (في الفترة)", k.new, "userPlus"], ["active", "عملاء نشطون (طلبوا في الفترة)", k.active, "activity"], ["returning", "عملاء عائدون", k.returning, "userCheck"], ["avg", "متوسط العقود لكل عميل", k.avg_contracts_per_customer, "file"], ["incomplete", "لم يكملوا الطلب", k.incomplete, "xCircle"]].map(([key, label, value, icon]) => ({ key, label, value: value ?? 0, icon, isText: key === "avg" }));
  return (
    <div className="flex flex-col gap-5">
      <ReportKpiGrid items={kpis} columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       

        <ReportSectionCard title="أفضل العملاء من حيث القيمة">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <th className={TH}>العميل</th>
                  <th className={TH}>الجوال</th>
                  <th className={TH}>العقود</th>
                  <th className={TH}>المدفوعة</th>
                  <th className={TH}>إجمالي الإنفاق</th>
                </tr>
              </thead>
              <tbody>
                {(data?.top_customers ?? []).map((row) => (
                  <tr key={row.customer_id ?? row.mobile}>
                    <td className={`${TD} font-semibold text-gray-900 dark:text-white`}>{row.name}</td>
                    <td className={`${TD} tabular-nums`} dir="ltr">
                      {row.mobile}
                    </td>
                    <td className={TD}>{row.contracts_count}</td>
                    <td className={TD}>{row.paid_count}</td>
                    <td className={`${TD} tabular-nums font-semibold`}>
                      {Number(row.total_spending ?? 0).toLocaleString("en-US")} ريال
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSectionCard>
        <ReportSectionCard title="العملاء الجدد مقابل العائدين">
          <HorizontalBarChart items={data?.segments ?? []} />
        </ReportSectionCard>
      </div>
    </div>
  );
}
