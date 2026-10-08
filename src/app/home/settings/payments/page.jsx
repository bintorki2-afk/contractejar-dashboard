"use client";

import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import { useState } from "react";
import {
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsPagination,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
  SettingsPageShell,
} from "@/components/system-settings/shared";
import { axiosInstance } from "@/src/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { paymentStatusKey, paymentStatusLabel } from "@/src/lib/payment-status";

const HEADERS = [
  "الاسم",
  "رقم الجوال",
  "المبلغ",
  "تاريخ الدفع",
  "الساعة",
  "رقم العقد",
  "طريقة الدفع",
  "العملة",
  { label: "الحالة", className: "text-center" },
];

const periodFilters = [
  { value: "today", label: "اليوم" },
  { value: "month", label: "الشهر" },
  { value: "year", label: "السنة" },
];

const statusFilters = [
  { value: "", label: "الكل" },
  { value: "success", label: "ناجحة" },
  { value: "failed", label: "فشلت" },
  { value: "review", label: "بحاجة لمراجعة" },
];


function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-13 font-bold text-gray-900">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-13 font-bold transition-colors border",
              value === option.value
                ? "bg-[#0B5A3C] text-white border-[#0B5A3C]"
                : "bg-white text-status-neutral border-surface-border-soft hover:border-[#0B5A3C]/40 hover:text-[#0B5A3C]"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PaymentsPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  const [currentPage, setCurrentPage] = useState(1);
  const [periodFilter, setPeriodFilter] = useState("month");
  const [statusFilter, setStatusFilter] = useState("");

  const [pagePeriodFilter, setPagePeriodFilter] = useState(periodFilter);
  if (pagePeriodFilter !== periodFilter) {
    setPagePeriodFilter(periodFilter);
    setCurrentPage(1);
  }

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["payments", currentPage, periodFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        per_page: "20",
        page: String(currentPage),
        filter: periodFilter,
      });
      return axiosInstance.get(`/admin/payments?${params.toString()}`).then((res) => res?.data);
    },
  });

  const allPayments = responseData?.data?.items ?? [];
  const payments = statusFilter
    ? allPayments.filter((payment) => paymentStatusKey(payment) === statusFilter)
    : allPayments;
  const pagination = responseData?.data?.pagination;

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="المدفوعات"
        subtitle={
          pagination?.total != null
            ? `إجمالي ${pagination.total} عملية`
            : "سجل العمليات"
        }
      />

      <div className="rounded-2xl border border-surface-border-soft bg-white p-5 flex flex-col md:flex-row md:items-end gap-6 shadow-[0_4px_12px_rgba(11,83,69,0.04)]">
        <FilterGroup
          label="الفترة الزمنية"
          options={periodFilters}
          value={periodFilter}
          onChange={setPeriodFilter}
        />
        <FilterGroup
          label="حالة الدفع"
          options={statusFilters}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <SettingsTable headers={HEADERS} minWidth="1080px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={9} />
        ) : isError ? (
          <SettingsEmptyRow colSpan={9} message="حدث خطأ أثناء تحميل المدفوعات." />
        ) : payments.length === 0 ? (
          <SettingsEmptyRow colSpan={9} message="لا توجد مدفوعات للفلاتر المحددة." />
        ) : (
          payments.map((payment) => (
            <SettingsTableRow key={payment.id}>
              <SettingsTd>{payment.name || payment.name_payment || "—"}</SettingsTd>
              <SettingsTd dir="ltr">{payment.user_mobile || "—"}</SettingsTd>
              <SettingsTd className="font-bold tabular-nums">
                {payment.amount} {payment.tran_currency || ""}
              </SettingsTd>
              <SettingsTd>{payment.payment_date || "—"}</SettingsTd>
              <SettingsTd>{payment.payment_hour || "—"}</SettingsTd>
              <SettingsTd dir="ltr">{payment.contract_uuid || "—"}</SettingsTd>
              <SettingsTd>{payment.payment_method || "—"}</SettingsTd>
              <SettingsTd>{payment.tran_currency || "—"}</SettingsTd>
              <SettingsTd className="text-center">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-11 font-bold",
                    paymentStatusKey(payment) === "success"
                      ? "bg-[#E6F7EF] text-green-700"
                      : paymentStatusKey(payment) === "failed"
                        ? "bg-[#FEF2F2] text-red-600"
                        : paymentStatusKey(payment) === "review"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-status-neutral-bg text-status-neutral"
                  )}
                  title={
                    paymentStatusKey(payment) === "review"
                      ? "مبلغ الدفعة لا يطابق المستحق — ليست دفعاً حتى تُراجع"
                      : undefined
                  }
                >
                  {paymentStatusLabel(payment)}
                </span>
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>

      <SettingsPagination
        page={currentPage}
        lastPage={pagination?.last_page}
        onPageChange={setCurrentPage}
      />
    </SettingsPageShell>
  );
}
