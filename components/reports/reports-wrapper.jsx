"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  downloadReportPdf,
  exportPanelTablesToCsv,
  printReportPanel,
} from "@/src/lib/report-export";
import {
  resolveReportFilterValue,
  useReportFilterOptions,
} from "@/src/hooks/use-report-filter-options";
import ReportsHeader from "./shared/reports-header";
import ReportsFilters from "./shared/reports-filters";
import { REPORT_TABS } from "./mock-data";
import OrdersReportTab from "./tabs/orders-report-tab";
import OverviewReportTab from "./tabs/overview-report-tab";
import SalesReportTab from "./tabs/sales-report-tab";
import ProfitsReportTab from "./tabs/profits-report-tab";
import OperatingExpensesReportTab from "./tabs/operating-expenses-report-tab";
import EmployeesReportTab from "./tabs/employees-report-tab";
import CustomersReportTab from "./tabs/customers-report-tab";
import MarketingReportTab from "./tabs/marketing-report-tab";
import PerformanceReportTab from "./tabs/performance-report-tab";

const TAB_ALIASES = {
  financial: "sales",
  expenses: "operating-expenses",
  staff: "employees",
  users: "customers",
  properties: "orders",
  units: "orders",
  returns: "orders",
};

const TAB_COMPONENTS = {
  overview: OverviewReportTab,
  orders: OrdersReportTab,
  sales: SalesReportTab,
  profits: ProfitsReportTab,
  "operating-expenses": OperatingExpensesReportTab,
  employees: EmployeesReportTab,
  customers: CustomersReportTab,
  marketing: MarketingReportTab,
  performance: PerformanceReportTab,
};

// د3: «نظرة عامة» هي الافتراضية؛ باقي التبويبات تفاصيل ثانوية.
function resolveTab(raw) {
  if (!raw) return "overview";
  const normalized = TAB_ALIASES[raw] ?? raw;
  return TAB_COMPONENTS[normalized] ? normalized : "overview";
}

function formatLastUpdated() {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB");
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  return `${date} ${time}`;
}

export default function ReportsWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = resolveTab(searchParams.get("tab"));
  const [period, setPeriod] = useState(searchParams.get("period") ?? "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? "");
  const [selectedContractType, setContractType] = useState(searchParams.get("contract_type") ?? "all");
  const [selectedEmployee, setEmployee] = useState(searchParams.get("employee_id") ?? "all");

  const { contractTypeOptions, employeeOptions, isLoadingEmployees } =
    useReportFilterOptions();

  // Unknown filter values (stale URL, removed employee) fall back to a valid option.
  const contractType = isLoadingEmployees
    ? selectedContractType
    : resolveReportFilterValue(selectedContractType, contractTypeOptions);
  const employee = isLoadingEmployees
    ? selectedEmployee
    : resolveReportFilterValue(selectedEmployee, employeeOptions);

  const lastUpdated = useMemo(() => formatLastUpdated(), []);

  useEffect(() => {
    if (isLoadingEmployees) return;
    if (contractType === selectedContractType && employee === selectedEmployee) return;
    if (
      searchParams.get("contract_type") === contractType &&
      searchParams.get("employee_id") === employee
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("contract_type", contractType);
    params.set("employee_id", employee);
    router.replace(`${pathname}?${params.toString()}`);
  }, [
    isLoadingEmployees,
    contractType,
    employee,
    selectedContractType,
    selectedEmployee,
    pathname,
    router,
    searchParams,
  ]);

  const setActiveTab = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const updateFilter = (key, value, setter) => {
    setter(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const updatePeriod = (value) => {
    setPeriod(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "custom") {
      params.delete("date_from");
      params.delete("date_to");
      setDateFrom("");
      setDateTo("");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const ActivePanel = TAB_COMPONENTS[activeTab];
  const activeTabLabel = REPORT_TABS.find((tab) => tab.id === activeTab)?.label ?? "تقرير";

  const handlePrint = () => {
    if (!printReportPanel()) {
      toast.error("تعذر تجهيز التقرير للطباعة");
    }
  };

  const handleExportPdf = async () => {
    toast.message("جاري تجهيز ملف PDF...");
    const exported = await downloadReportPdf("reports-print-area", activeTabLabel);
    if (!exported) {
      toast.error("تعذر تصدير التقرير كـ PDF");
    }
  };

  const handleExportCsv = () => {
    const exported = exportPanelTablesToCsv("reports-print-area", activeTabLabel);
    if (!exported) {
      toast.message("لا توجد بيانات جدولية في هذا التقرير للتصدير");
    }
  };

  return (
    <div
      className="flex flex-col gap-5 min-h-full -m-[45px] p-[45px] max-[1700px]:-m-[30px] max-[1700px]:p-[30px] bg-[#F4F6F5] dark:bg-[#0B1411]"
      dir="rtl"
    >
      <ReportsHeader
        lastUpdated={lastUpdated}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onExportCsv={handleExportCsv}
      />

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-10 px-5 rounded-full text-13 font-bold transition-all shrink-0 flex items-center gap-2",
              activeTab === tab.id
                ? "bg-brand-dark text-white shadow-sm"
                : "bg-white text-[#616161] border border-surface-border hover:bg-[#F9FAFB] dark:bg-card dark:text-white/70 dark:border-white/10"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  "text-10 font-bold px-1.5 py-0.5 rounded",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-[#FEF3C7] text-[#B45309]"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab !== "overview" ? (
      <ReportsFilters
        period={period}
        onPeriodChange={updatePeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(value) => updateFilter("date_from", value, setDateFrom)}
        onDateToChange={(value) => updateFilter("date_to", value, setDateTo)}
        contractType={contractType}
        onContractTypeChange={(value) => updateFilter("contract_type", value, setContractType)}
        employee={employee}
        onEmployeeChange={(value) => updateFilter("employee_id", value, setEmployee)}
      />
      ) : null}

      <div id="reports-print-area">
        <ActivePanel period={period} dateFrom={dateFrom} dateTo={dateTo} contractType={contractType} employee={employee} />
      </div>
    </div>
  );
}
