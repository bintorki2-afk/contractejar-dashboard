"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Loader from "@/components/home/loader";
import { useAllEmployeesKpis } from "@/src/hooks/use-employee-kpis";
import { ReportKpiGrid } from "../shared/report-kpi-card";
import HorizontalBarChart from "../shared/horizontal-bar-chart";
import ReportSectionCard from "../shared/report-section-card";
import ReportError from "../shared/report-error";

const TH =
  "px-3 py-3 text-xs font-semibold text-gray-400 border-b border-[#EEF1F0] whitespace-nowrap text-right dark:text-white/50 dark:border-white/10";

const TD = "px-3 py-3 text-13 text-gray-700 border-b border-status-neutral-bg whitespace-nowrap dark:text-white/70 dark:border-white/10";

const CHART_COLORS = ["#0A4D33", "#0D9488", "#1E40AF", "#7C3AED", "#CA8A04", "#DC2626", "#6B7280"];

function StatusPill({ isOnDuty, label }) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-0.5 rounded-full text-11 font-bold",
        isOnDuty
          ? "bg-[#DCFCE7] text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-status-neutral-bg text-status-neutral dark:bg-white/10 dark:text-white/60"
      )}
    >
      {label ?? (isOnDuty ? "في الخدمة" : "خارج الخدمة")}
    </span>
  );
}

function cardValue(item, key) {
  return item.cards?.find((card) => card.key === key)?.value ?? 0;
}

function averageValue(items, selector) {
  const values = items.map(selector).filter((value) => typeof value === "number");
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function formatRevenue(value) {
  return value != null ? `${Number(value).toLocaleString("en-US")} ر.س` : "—";
}

export default function EmployeesReportTab({ period, dateFrom, dateTo }) {
  const { data, isLoading, isError, error, refetch } = useAllEmployeesKpis(period, dateFrom, dateTo);
  const items = useMemo(() => data?.items ?? [], [data]);

  const kpis = useMemo(() => {
    const summary = data?.summary;
    const received = summary?.received_total ?? items.reduce((sum, item) => sum + cardValue(item, "received"), 0);
    const completed = summary?.completed_total ?? items.reduce((sum, item) => sum + cardValue(item, "completed"), 0);
    const late = summary?.late_over_24h_total ?? items.reduce((sum, item) => sum + cardValue(item, "late_over_24h"), 0);
    const assigned = summary?.assigned_total ?? items.reduce((sum, item) => sum + cardValue(item, "assigned"), 0);
    const returned = summary?.returned_total ?? items.reduce((sum, item) => sum + cardValue(item, "returned"), 0);
    const avgReceive = summary?.avg_receive_work_minutes ?? averageValue(items, (item) => item.avg_receive?.value);
    const avgProcess = summary?.avg_process_minutes ?? averageValue(items, (item) => item.avg_process?.value);
    const revenue = summary?.revenue_sar_total ?? items.reduce((sum, item) => sum + (item.revenue?.value ?? 0), 0);

    return [
      { key: "count", label: "عدد الموظفين", value: items.length, icon: "users" },
      { key: "received", label: "استلم بالفترة", value: received, icon: "file" },
      { key: "completed", label: "منجز بالفترة", value: completed, icon: "checkCircle" },
      { key: "assigned", label: "طلبات مسندة", value: assigned, icon: "file" },
      { key: "returned", label: "مسترجع", value: returned, icon: "xCircle", tone: returned > 0 ? "warning" : "default" },
      {
        key: "late",
        label: "متأخر > 24 س",
        value: late,
        icon: "clock",
        tone: late > 0 ? "danger" : "default",
      },
      {
        key: "avgReceive",
        label: "متوسط الاستلام (د عمل)",
        value: avgReceive != null ? `${avgReceive.toFixed(1)} د` : "—",
        icon: "clock",
        isText: true,
      },
      {
        key: "avgProcess",
        label: "متوسط المعالجة",
        value: avgProcess != null ? `${avgProcess.toFixed(1)} د` : "—",
        icon: "clock",
        isText: true,
      },
      { key: "revenue", label: "إيراد محقق", value: formatRevenue(revenue), icon: "creditCard", isText: true },
    ];
  }, [data, items]);

  const completedByEmployee = useMemo(
    () =>
      items.map((item, index) => ({
        label: item.employee?.name ?? "—",
        value: cardValue(item, "completed"),
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [items]
  );

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <ReportError
        title="الموظفون"
        error={error}
        fallback="تعذّر تحميل بيانات أداء الموظفين من الخادم."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportKpiGrid items={kpis} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />

      <ReportSectionCard title="ملخص الورديات والأداء – SLA استلام 5 دقائق">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[1500px] border-collapse">
            <thead>
              <tr>
                <th className={TH}>الموظف</th>
                <th className={TH}>الوردية</th>
                <th className={TH}>الحالة</th>
                <th className={TH}>مستلم</th>
                <th className={TH}>مسند</th>
                <th className={TH}>مسترجع</th>
                <th className={TH}>مفتوح</th>
                <th className={TH}>متأخر (+24 س)</th>
                <th className={TH}>منجز</th>
                <th className={TH}>متوسط الاستلام</th>
                <th className={TH}>التزام الاستلام</th>
                <th className={TH}>متوسط المعالجة</th>
                <th className={TH}>الإيراد</th>
                <th className={TH} title="رسوم إضافية أضافها الموظف (العدد · المبلغ)">رسوم أضافها</th>
                <th className={TH} title="فروقات سعر نتجت عن تعديلاته">فروقات سعر</th>
                <th className={TH} title="طلبات مرفق ناقص أرسلها">طلبات مرفق</th>
                <th className={TH} title="حوالات بنكية سجّلها (العدد · المبلغ)">حوالات سجّلها</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => {
                  const openNow = cardValue(item, "open_now");
                  const avgReceiveLabel = item.avg_receive?.value_label ?? "—";
                  const avgReceiveUnit = item.avg_receive?.value != null ? ` ${item.avg_receive.unit ?? ""}` : "";
                  const slaPercent = item.receive_sla?.percent;

                  return (
                    <tr key={item.employee?.id}>
                      <td className={cn(TD, "font-semibold text-gray-900 dark:text-white")}>
                        {item.employee?.name_label ?? item.employee?.name}
                      </td>
                      <td className={TD}>{item.shift?.label_ar ?? "—"}</td>
                      <td className={TD}>
                        <StatusPill isOnDuty={item.shift?.is_on_duty} label={item.shift?.duty_status_label_ar} />
                      </td>
                      <td className={TD}>{cardValue(item, "received")}</td>
                      <td className={TD}>{cardValue(item, "assigned")}</td>
                      <td className={TD}>{cardValue(item, "returned")}</td>
                      <td className={cn(TD, openNow > 0 && "text-red-600 font-semibold dark:text-red-300")}>{openNow}</td>
                      <td className={TD}>{cardValue(item, "late_over_24h")}</td>
                      <td className={TD}>{cardValue(item, "completed")}</td>
                      <td className={TD}>
                        {avgReceiveLabel}
                        {avgReceiveUnit}
                      </td>
                      <td className={TD}>{slaPercent != null ? `${slaPercent}%` : "—"}</td>
                      <td className={TD}>{item.avg_process?.value_label ?? "—"}</td>
                      <td className={TD}>{formatRevenue(item.revenue?.value)}</td>
                      <td className={TD}>
                        {item.fees_added_count ?? cardValue(item, "fees_added_count")}
                        {Number(item.fees_added_amount) > 0 ? ` · ${formatRevenue(item.fees_added_amount)}` : ""}
                      </td>
                      <td className={TD}>{item.price_difference_count ?? cardValue(item, "price_difference_count")}</td>
                      <td className={TD}>{item.data_requests_count ?? cardValue(item, "data_requests_count")}</td>
                      <td className={TD}>
                        {item.bank_transfers_recorded ?? cardValue(item, "bank_transfers_recorded")}
                        {Number(item.bank_transfers_amount) > 0 ? ` · ${formatRevenue(item.bank_transfers_amount)}` : ""}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="text-center p-6 text-gray-400 text-sm dark:text-white/50">
                    لا توجد بيانات لعرضها في هذه الفترة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-11 text-gray-400 mt-2 dark:text-white/50">
          * يُحسب SLA الاستلام من لحظة وصول الطلب حتى أول إجراء من الموظف.
        </p>
      </ReportSectionCard>

      <ReportSectionCard title="العقود المكتملة حسب الموظف" className="max-w-xl">
        {completedByEmployee.length > 0 ? (
          <HorizontalBarChart items={completedByEmployee} />
        ) : (
          <p className="text-13 text-gray-400 dark:text-white/50">لا توجد بيانات لعرضها.</p>
        )}
      </ReportSectionCard>

    </div>
  );
}
