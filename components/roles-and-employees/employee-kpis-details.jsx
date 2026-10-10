"use client";

import { useMemo } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Header from "@/components/home/header";
import Loader from "@/components/home/loader";
import { useEmployeeKpisDetail } from "@/src/hooks/use-employee-kpis";
import { EmployeeAvatar, TABLE_TH, TABLE_WRAPPER } from "./shared";

const FALLBACK_PERIODS = [
  { key: "today", label_ar: "اليوم" },
  { key: "yesterday", label_ar: "أمس" },
  { key: "last_7_days", label_ar: "آخر 7 أيام" },
  { key: "last_30_days", label_ar: "آخر 30 يومًا" },
  { key: "all", label_ar: "كل الفترات" },
  { key: "custom", label_ar: "مدة محددة" },
];

const SLA_STYLES = {
  pass: "text-[#047857] dark:text-emerald-300",
  fail: "text-red-600 dark:text-red-300",
  na: "text-gray-400 dark:text-white/45",
};

function findCard(item, key) {
  return item.cards?.find((c) => c.key === key);
}

function StatTile({ label, value, danger }) {
  return (
    <div className="rounded-xl bg-[#F9FAFB] p-3 text-center dark:bg-white/5">
      <p className={cn("text-lg font-black", danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white")}>
        {value}
      </p>
      <p className="text-11 text-gray-400 mt-0.5 dark:text-white/45">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="text-center min-w-0">
      <p className="text-13 font-bold text-gray-900 truncate dark:text-white">{value ?? "—"}</p>
      <p className="text-11 text-gray-400 mt-0.5 dark:text-white/45">{label}</p>
    </div>
  );
}

export default function EmployeeKpisDetails() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = searchParams.get("period") || "today";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const isCustom = period === "custom";
  const hasValidRange = Boolean(dateFrom && dateTo && dateFrom <= dateTo);
  const needsCustomRange = isCustom && !hasValidRange;

  const { data, isLoading, isError, error, refetch } = useEmployeeKpisDetail(
    id,
    period,
    dateFrom || undefined,
    dateTo || undefined
  );

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setPeriod = (value) => {
    if (value === "custom") {
      updateParams({ period: value });
      return;
    }
    updateParams({ period: value, date_from: null, date_to: null });
  };

  const isNotFound = error?.response?.status === 404;

  const periods = data?.periods?.length
    ? data.periods
    : FALLBACK_PERIODS.map((p) => ({ ...p, selected: p.key === period }));

  const employee = data?.employee ?? {};
  const shift = data?.shift ?? {};
  const isOnDuty = shift.is_on_duty ?? shift.duty_status === "inside";

  const openNow = data ? findCard(data, "open_now") : null;
  const received = data ? findCard(data, "received") : null;
  const completed = data ? findCard(data, "completed") : null;
  const late = data ? findCard(data, "late_over_24h") : null;
  const isLateDanger = late?.tone === "danger" && (late?.value ?? 0) > 0;
  const hasExtraMetrics = data && (data.avg_receive || data.avg_process || data.revenue || data.receive_sla);
  // دفعة هـ (2.7): رسوم أضافها · فروقات سعر · طلبات مرفق ناقص · حوالات سجّلها.
  const feesCard = data ? findCard(data, "fees_added_count") : null;
  const diffCard = data ? findCard(data, "price_difference_count") : null;
  const dataReqCard = data ? findCard(data, "data_requests_count") : null;
  const transfersCard = data ? findCard(data, "bank_transfers_recorded") : null;
  const hasMoneyMetrics = Boolean(data && (feesCard || diffCard || dataReqCard || transfersCard || data.fees_added_count != null));
  const moneyLabel = (count, amount) =>
    `${Number(count ?? 0).toLocaleString("en-US")}${Number(amount) > 0 ? ` · ${Number(amount).toLocaleString("en-US")} ر.س` : ""}`;

  const receivedOrders = useMemo(() => data?.received_orders?.items ?? [], [data]);
  const activityItems = useMemo(() => data?.activity?.items ?? [], [data]);

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <Header
        title="مؤشرات الموظف"
        isMain={false}
        first="الرئيــسية"
        firstURL="/home"
        second="الموظفون والأدوار"
        secondURL="/home/roles-and-employees?tab=performance"
        third="مؤشرات الموظف"
        thirdURL={pathname}
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-1 border-b border-[#E5E7EB] dark:border-white/10">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-4 py-2.5 text-13 font-semibold transition-colors border-b-2 -mb-px",
                period === p.key
                  ? "text-brand-dark border-brand-dark dark:text-emerald-300 dark:border-emerald-400"
                  : "text-gray-400 border-transparent hover:text-gray-700 dark:text-white/45 dark:hover:text-white/70"
              )}
            >
              {p.label_ar}
            </button>
          ))}
        </div>

        {isCustom ? (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#616161] dark:text-white/60">
              من
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => updateParams({ period: "custom", date_from: event.target.value })}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs dark:bg-card dark:border-white/10 dark:text-white/80"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#616161] dark:text-white/60">
              إلى
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => updateParams({ period: "custom", date_to: event.target.value })}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs dark:bg-card dark:border-white/10 dark:text-white/80"
              />
            </label>
          </div>
        ) : null}

        {needsCustomRange ? (
          <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center text-sm text-gray-400 dark:border-white/10 dark:text-white/45">
            اختر تاريخ البداية والنهاية لعرض المؤشرات.
          </div>
        ) : isLoading ? (
          <Loader />
        ) : isNotFound ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
            الموظف غير موجود.
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
            {error?.response?.status === 403 ? (
              "ليس لديك صلاحية عرض مؤشرات هذا الموظف."
            ) : (
              <>
                تعذّر تحميل مؤشرات الموظف.{" "}
                <button type="button" onClick={() => refetch()} className="font-semibold underline">
                  إعادة المحاولة
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-5 dark:bg-card dark:border-white/10">
              <div className="flex items-start gap-3 min-w-0">
                <EmployeeAvatar name={employee.name} image={employee.profile_image} size="md" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {employee.name_label ?? employee.name ?? "—"}
                  </h3>
                  {employee.role_title ? (
                    <p className="text-xs text-gray-400 mt-0.5 dark:text-white/50">{employee.role_title}</p>
                  ) : null}
                  <p className="text-xs text-gray-400 mt-1 dark:text-white/45">{shift.label_ar ?? "—"}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-11 font-semibold",
                      isOnDuty
                        ? "bg-[#D1FAE5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-status-neutral-bg text-status-neutral dark:bg-white/10 dark:text-white/60"
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", isOnDuty ? "bg-brand-accent" : "bg-gray-400")} />
                    {shift.duty_status_label_ar ?? (isOnDuty ? "داخل الدوام الآن" : "خارج الدوام")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label={openNow?.label_ar ?? "مفتوح الآن"} value={openNow?.value ?? 0} />
                <StatTile label={received?.label_ar ?? "استلم"} value={received?.value ?? 0} />
                <StatTile label={completed?.label_ar ?? "منجز بالفترة"} value={completed?.value ?? 0} />
                <StatTile label={late?.label_ar ?? "متأخر > 24 س"} value={late?.value ?? 0} danger={isLateDanger} />
              </div>

              {hasExtraMetrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-dashed border-[#E5E7EB] dark:border-white/10">
                  {data.avg_receive ? <MiniMetric label="متوسط الاستلام (د عمل)" value={data.avg_receive.value_label} /> : null}
                  {data.avg_process ? <MiniMetric label="متوسط المعالجة" value={data.avg_process.value_label} /> : null}
                  {data.revenue ? <MiniMetric label="إيراد محقق" value={data.revenue.value_label} /> : null}
                  {data.receive_sla ? (
                    <MiniMetric
                      label="التزام الاستلام ≤ 5د"
                      value={data.receive_sla.percent != null ? `${data.receive_sla.percent}%` : "—"}
                    />
                  ) : null}
                </div>
              ) : null}

              {hasMoneyMetrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-dashed border-[#E5E7EB] dark:border-white/10" data-kpi-money>
                  <MiniMetric label={feesCard?.label_ar ?? "رسوم أضافها"} value={moneyLabel(feesCard?.value ?? data.fees_added_count, feesCard?.amount ?? data.fees_added_amount)} />
                  <MiniMetric label={diffCard?.label_ar ?? "فروقات سعر"} value={moneyLabel(diffCard?.value ?? data.price_difference_count, diffCard?.amount ?? data.price_difference_amount)} />
                  <MiniMetric label={dataReqCard?.label_ar ?? "طلبات مرفق ناقص"} value={moneyLabel(dataReqCard?.value ?? data.data_requests_count)} />
                  <MiniMetric label={transfersCard?.label_ar ?? "حوالات سجّلها"} value={moneyLabel(transfersCard?.value ?? data.bank_transfers_recorded, transfersCard?.amount ?? data.bank_transfers_amount)} />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">الطلبات المستلمة بالفترة</h3>
              <div className={TABLE_WRAPPER}>
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr>
                      <th className={TABLE_TH}>الطلب</th>
                      <th className={TABLE_TH}>وقت الاستلام</th>
                      <th className={TABLE_TH}>مدة الاستلام</th>
                      <th className={TABLE_TH}>SLA</th>
                      <th className={TABLE_TH}>الحالة الحالية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedOrders.length > 0 ? (
                      receivedOrders.map((order) => (
                        <tr key={order.uuid ?? order.order}>
                          <td className="px-4 py-3.5 text-13 text-gray-700 border-b border-[#EEF1F0] whitespace-nowrap dark:text-white/70 dark:border-white/10">
                            {order.order}
                          </td>
                          <td className="px-4 py-3.5 text-13 text-gray-700 border-b border-[#EEF1F0] whitespace-nowrap dark:text-white/70 dark:border-white/10">
                            {order.received_at_label ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-13 text-gray-700 border-b border-[#EEF1F0] whitespace-nowrap dark:text-white/70 dark:border-white/10">
                            {order.receive_work_minutes_label ?? "—"}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3.5 text-13 font-semibold border-b border-[#EEF1F0] whitespace-nowrap dark:border-white/10",
                              SLA_STYLES[order.sla] ?? SLA_STYLES.na
                            )}
                          >
                            {order.sla_label_ar ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-13 text-gray-700 border-b border-[#EEF1F0] whitespace-nowrap dark:text-white/70 dark:border-white/10">
                            {order.current_status ?? "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center p-6 text-gray-400 text-sm dark:text-white/50">
                          لا توجد طلبات مستلمة في هذه الفترة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{data?.activity?.label_ar ?? "آخر التحركات"}</h3>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm dark:bg-card dark:border-white/10">
                {activityItems.length > 0 ? (
                  <ul className="divide-y divide-[#EEF1F0] dark:divide-white/10">
                    {activityItems.map((activity, index) => (
                      <li key={`${activity.contract_id}-${activity.occurred_at}-${index}`} className="p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-13 font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                          <span className="text-11 text-gray-400 whitespace-nowrap dark:text-white/45">
                            {activity.occurred_at_label}
                          </span>
                        </div>
                        {activity.details ? (
                          <p className="text-12 text-gray-400 dark:text-white/50">{activity.details}</p>
                        ) : null}
                        {activity.contract_number ? (
                          <p className="text-11 text-gray-400 dark:text-white/45">{activity.contract_number}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-6 text-center text-13 text-gray-400 dark:text-white/45">لا تحركات مسجلة بعد</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
