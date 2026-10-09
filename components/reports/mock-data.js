/** Reports tabs + filter config. Analytics data comes from src/hooks/use-reports.js. */

export const REPORT_TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "orders", label: "الطلبات" },
  { id: "sales", label: "المبيعات والإيرادات", badge: "مالي" },
  { id: "profits", label: "الأرباح والتكاليف", badge: "مالي" },
  { id: "operating-expenses", label: "المصروفات التشغيلية", badge: "مالي" },
  { id: "employees", label: "الموظفون" },
  { id: "customers", label: "العملاء" },
  { id: "marketing", label: "المصادر والتسويق" },
  { id: "performance", label: "لوحة الأداء" },
];

export const PERIOD_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "last_30_days", label: "هذا الشهر" },
  { id: "last_7_days", label: "آخر ٧ أيام" },
  { id: "today", label: "اليوم" },
  { id: "custom", label: "مدة محددة" },
];

/** @deprecated Use useReportFilterOptions() — kept for backwards compatibility only. */
export const CONTRACT_TYPES = [
  { id: "all", label: "كل الأنواع" },
  { id: "housing", label: "سكني" },
  { id: "commercial", label: "تجاري" },
];

/** @deprecated Use useReportFilterOptions() — was demo placeholder data. */
export const EMPLOYEE_FILTERS = [
  { id: "all", label: "كل الموظفين" },
];

