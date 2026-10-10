import { axiosInstance } from "@/src/utils/axios";
import { writeExcelFile } from "@/src/lib/xlsx-export";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import {
  getOrderAdminApprovalStatus,
  isAdminRefundApproved,
  normalizeRefundContract,
} from "@/components/analysis/returned/refund-contract-utils";

function formatPaymentValue(row) {
  const isPaid =
    row?.is_paid === true ||
    row?.is_paid === 1 ||
    (row?.amount_payment && row?.is_paid !== false && row?.is_paid !== 0);

  if (!isPaid) {
    return row?.payment_label_ar || "لم يتم الدفع";
  }

  return row?.amount_payment ?? "";
}

/** ميلادي بأرقام لاتينية «YYYY-MM-DD HH:mm» (توقيت الرياض) — قابل للفرز في Excel. */
export function formatDateValue(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/** الجوال بصيغة 05XXXXXXXX في ملفات التصدير. */
function exportMobile(value) {
  return value ? formatSaudiMobileDisplay(value) : "";
}

function formatCustomerRefunded(value) {
  if (value === true || value === 1) return "تم الموافقة";
  if (value === false || value === 0) return "لم تتم الموافقة";
  return "بانتظار الاسترجاع";
}

function formatAdminApproval(value) {
  return isAdminRefundApproved(value) ? "تم الموافقة" : "لم تتم الموافقة";
}

function withPerPage(url, perPage) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}per_page=${perPage}`;
}

export function extractStandardOrderPage(response) {
  return {
    items: response?.data?.data?.items ?? [],
    lastPage: response?.data?.data?.pagination?.last_page ?? 1,
  };
}

export function extractWhatsappOrderPage(response) {
  return {
    items: response?.data?.data?.data ?? [],
    lastPage: response?.data?.data?.last_page ?? 1,
  };
}

export function extractRefundContractsPage(response) {
  const rawData = response?.data?.data;
  return {
    items: Array.isArray(rawData) ? rawData : (rawData?.items ?? []),
    lastPage:
      rawData?.pagination?.last_page ?? response?.data?.pagination?.last_page ?? 1,
  };
}

export async function fetchAllPaginatedItems(buildUrl, extractPage = extractStandardOrderPage) {
  const perPage = 100;
  const firstResponse = await axiosInstance(withPerPage(buildUrl(1), perPage));
  const { items: firstItems, lastPage } = extractPage(firstResponse);
  const items = [...firstItems];

  for (let page = 2; page <= lastPage; page += 1) {
    const response = await axiosInstance(withPerPage(buildUrl(page), perPage));
    const { items: pageItems } = extractPage(response);
    items.push(...pageItems);
  }

  return items;
}

export async function fetchAllPaginatedOrders(buildUrl) {
  return fetchAllPaginatedItems(buildUrl, extractStandardOrderPage);
}

export function mapOrderToExportRow(order, { showStatusColumn = true } = {}) {
  const row = {
    "رقم الطلب": order?.uuid ?? "",
    "رقم جوال العميل": exportMobile(order?.user_mobile),
    "نوع العقد": order?.contract_type ?? "",
    "نوع الوثيقة": order?.instrument_type ?? "",
    الدفع: formatPaymentValue(order),
    "مستلم منذ": formatDateValue(order?.updated_at),
  };

  if (showStatusColumn) {
    row["حالة الطلب"] =
      order?.status?.name || order?.contract_status_name || "قيد المعالجة";
  }

  row.الاستلام = order?.employee_name ?? "";

  // دفعة هـ (E5): أعمدة المال من الخادم عندما تكون موجودة في صف القائمة.
  if (order?.payment_state || order?.paid_original != null) {
    row["حالة الدفع"] = order?.payment_state?.label ?? order?.payment_state?.status_label ?? "";
    row["المدفوع الأصلي"] = order?.paid_original ?? "";
    row["إضافي"] = order?.paid_extra ?? "";
    row["مسترجع"] = order?.refunded_total ?? "";
    row["الصافي"] = order?.net_total ?? "";
    row["طريقة الدفع"] = order?.payment_method_label ?? order?.payment_method ?? "";
  }

  return row;
}

export function mapReturnOrderToExportRow(row = {}) {
  const customerRefunded =
    row.customer_refunded ?? row.is_refunded ?? row.refunded;

  return {
    "رقم الطلب": row?.uuid ?? "",
    "رقم جوال العميل": exportMobile(row?.user_mobile),
    "نوع العقد": row?.contract_type ?? "",
    الدفع: formatPaymentValue(row),
    "المبلغ المطالب استرجاعه": row?.refund_amount ?? "",
    "تم الاسترجاع": formatCustomerRefunded(customerRefunded),
    "رافع الطلب":
      row?.employee_name ?? row?.accept_retrun_contract_employee?.name ?? "",
    "موافقة الإدارة": formatAdminApproval(getOrderAdminApprovalStatus(row)),
  };
}

export function mapWhatsappCompletedToExportRow(row = {}) {
  return {
    "رقم جوال العميل": exportMobile(row?.mobile_number),
    "قيمة المبلغ": row?.amount_paid_by_client ?? "",
    "نوع العقد": row?.contract_type ?? "",
    "هل تم توثيق العقد":
      row?.is_documented == null ? "" : row.is_documented ? "نعم" : "لا",
    "مدة العقد": row?.contract_duration ?? "",
  };
}

export function mapWhatsappIncompletedToExportRow(row = {}) {
  return {
    "رقم جوال العميل": exportMobile(row?.mobile_number),
    ملاحظات: row?.notes ?? "",
    التاريخ: formatDateValue(row?.date),
  };
}

export function mapRefundContractToExportRow(item) {
  if (item?.orderUuid != null || item?.refundId != null) {
    return {
      "رقم الطلب": item.orderUuid ?? "",
      "رقم جوال العميل": exportMobile(item.userMobile),
      "نوع العقد": item.contractType ?? "",
      الدفع: item.isPaid
        ? item.amountPayment ?? ""
        : item.paymentLabelAr || "لم يتم الدفع",
      "المبلغ المطالب استرجاعه": item.refundAmount ?? "",
      "تم الاسترجاع": formatCustomerRefunded(item.customerRefunded),
      "رافع الطلب": item.employeeName ?? "",
      "موافقة الإدارة": formatAdminApproval(item.adminConfirmed),
      "رقم مسودة العقد": item.draftContractNumber ?? "",
    };
  }

  const row = normalizeRefundContract(item);
  if (!row) return null;

  return {
    "رقم الطلب": row.orderUuid ?? "",
    "رقم جوال العميل": row.userMobile ?? "",
    "نوع العقد": row.contractType ?? "",
    الدفع: row.isPaid
      ? row.amountPayment ?? ""
      : row.paymentLabelAr || "لم يتم الدفع",
    "المبلغ المطالب استرجاعه": row.refundAmount ?? "",
    "تم الاسترجاع": formatCustomerRefunded(row.customerRefunded),
    "رافع الطلب": row.employeeName ?? "",
    "موافقة الإدارة": formatAdminApproval(row.adminConfirmed),
    "رقم مسودة العقد": row.draftContractNumber ?? "",
  };
}

export async function exportOrdersToExcel(orders, { filename = "orders", showStatusColumn = true } = {}) {
  if (!orders?.length) return false;

  const rows = orders.map((order) => mapOrderToExportRow(order, { showStatusColumn }));
  return writeExcelFile(rows, { filename, sheetName: "الطلبات" });
}

export async function exportReturnOrdersToExcel(orders, { filename = "الطلبات-المسترجعة" } = {}) {
  if (!orders?.length) return false;
  const rows = orders.map(mapReturnOrderToExportRow);
  return writeExcelFile(rows, { filename, sheetName: "الطلبات المسترجعة" });
}

export async function exportWhatsappCompletedToExcel(
  orders,
  { filename = "واتساب-مكتملة" } = {}
) {
  if (!orders?.length) return false;
  const rows = orders.map(mapWhatsappCompletedToExportRow);
  return writeExcelFile(rows, { filename, sheetName: "واتساب مكتملة" });
}

export async function exportWhatsappIncompletedToExcel(
  orders,
  { filename = "واتساب-غير-مكتملة" } = {}
) {
  if (!orders?.length) return false;
  const rows = orders.map(mapWhatsappIncompletedToExportRow);
  return writeExcelFile(rows, { filename, sheetName: "واتساب غير مكتملة" });
}

export async function exportRefundContractsToExcel(
  items,
  { filename = "تحليل-المسترجع" } = {}
) {
  if (!items?.length) return false;
  const rows = items.map(mapRefundContractToExportRow).filter(Boolean);
  if (!rows.length) return false;
  return writeExcelFile(rows, { filename, sheetName: "المسترجع" });
}
