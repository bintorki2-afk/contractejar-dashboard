import { findOrdersPageStatusIdByLabel } from "@/src/lib/orders-page-statuses";

export const CONTRACT_STATUSES_API = "/admin/contract-statuses";
export const CONTRACT_STATUSES_ACTIVE_API = "/admin/contract-statuses/active";
export const CONTRACT_STATUSES_QUERY_KEY = "status";
export const CONTRACT_STATUSES_ACTIVE_QUERY_KEY = "contract-statuses-active";

export const NEW_CONTRACT_STATUS_ID = 1;
export const RECEIVED_CONTRACT_STATUS_ID = 6;
// لا يوجد رقم ثابت لحالة «الاسترجاع»: الرقم 2 في قاعدة «عقدي» هو «قيد المراجعة».
// تُعرف حالة الاسترجاع بالاسم فقط (انظر resolveReturnedContractStatusId).
export const CANCELED_CONTRACT_STATUS_ID = 4;

export const emptyContractStatusForm = {
  name: "",
  color: "#22C55E",
  color_text: "#FFFFFF",
  client_explanation: "",
  description: "",
  is_active: true,
};

export function extractContractStatusItems(response) {
  const body = response?.data ?? response;
  if (Array.isArray(body?.data?.items)) return body.data.items;
  if (Array.isArray(body?.data?.data?.items)) return body.data.data.items;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.data) && !body.data.items) {
    return Array.isArray(body.data) ? body.data : [];
  }
  return [];
}

/** Body for POST /admin/contract-statuses and POST /admin/contract-statuses/:id */
export function buildContractStatusWritePayload(form = {}) {
  return {
    name: String(form.name ?? "").trim(),
    color: form.color || "#000000",
    client_explanation: form.client_explanation?.trim?.()
      ? form.client_explanation.trim()
      : form.client_explanation || null,
    is_active: form.is_active !== false && form.is_active !== 0 && form.is_active !== "0",
    ...(form.color_text ? { color_text: form.color_text } : {}),
    ...(form.description != null
      ? { description: String(form.description).trim() || null }
      : {}),
  };
}

export function formFromContractStatus(status = {}) {
  return {
    name: status.name ?? "",
    color: status.color || "#22C55E",
    color_text: status.color_text || "#FFFFFF",
    client_explanation: status.client_explanation ?? "",
    description: status.description ?? "",
    is_active: status.is_active !== false && status.is_active !== 0,
  };
}

function findExactStatusId(statusItems = [], name) {
  const target = String(name ?? "").trim();
  if (!target) return null;
  const found = (statusItems ?? []).find(
    (item) => String(item?.name ?? "").trim() === target
  );
  return found?.id ?? null;
}

export function resolveNewContractStatusId(statusItems = []) {
  return (
    findExactStatusId(statusItems, "جديد") ??
    findOrdersPageStatusIdByLabel(statusItems, "جديد") ??
    NEW_CONTRACT_STATUS_ID
  );
}

/**
 * دفعة و (D1): «مستلم» دُمجت مع «مستلم من الموظف» — نفضّل المفتاح الثابت `received_by_employee`
 * ثم الاسم، ولا نرجع للحالة القديمة «مستلم» إلا إن لم تُوجد الجديدة (قاعدة قبل الترحيل).
 */
export function resolveReceivedContractStatusId(statusItems = []) {
  const byKey = (statusItems ?? []).find((item) => item?.status_key === "received_by_employee");
  return (
    byKey?.id ??
    findExactStatusId(statusItems, "مستلم من الموظف") ??
    findExactStatusId(statusItems, "مستلم") ??
    findOrdersPageStatusIdByLabel(statusItems, "مستلم") ??
    RECEIVED_CONTRACT_STATUS_ID
  );
}

/** null عندما لا توجد حالة باسم «استرجاع/مسترجع» — لا احتياط برقم (كان 2 = «قيد المراجعة»). */
export function resolveReturnedContractStatusId(statusItems = []) {
  return (
    findExactStatusId(statusItems, "استرجاع") ??
    findOrdersPageStatusIdByLabel(statusItems, "استرجاع") ??
    null
  );
}

export function resolveCanceledContractStatusId(statusItems = []) {
  return (
    findExactStatusId(statusItems, "ملغى") ??
    findExactStatusId(statusItems, "ملغي") ??
    findOrdersPageStatusIdByLabel(statusItems, "ملغى") ??
    CANCELED_CONTRACT_STATUS_ID
  );
}

/** Statuses already covered by the main pills / new-requests strip. */
function isPillCoveredStatus(name = "", key = null) {
  // المفاتيح التاريخية (received/whatsapp_draft) لا تظهر كشرائح فلترة.
  if (key === "received" || key === "whatsapp_draft") return true;
  const normalized = String(name).trim();
  if (!normalized) return true;
  if (normalized === "جديد") return true;
  if (normalized === "مستلم") return true;
  if (normalized === "ملغى" || normalized === "ملغي" || normalized.includes("ملغ")) {
    return true;
  }
  if (
    normalized === "استرجاع" ||
    normalized.includes("استرجاع") ||
    normalized.includes("مسترجع")
  ) {
    return true;
  }
  return false;
}

export function getRealtimeExtraFilterStatuses(statusItems = []) {
  return (statusItems ?? []).filter(
    (item) => !isPillCoveredStatus(item?.name, item?.status_key)
  );
}

/** Status chips for the #statusF row (مستلم + in-pipeline statuses, no archived). */
export function getRealtimeStatusChipStatuses(statusItems = [], receivedStatusId) {
  const items = statusItems ?? [];
  const received = items.find((item) => String(item?.id) === String(receivedStatusId));
  const rest = getRealtimeExtraFilterStatuses(items);
  const chips = [];
  if (received) chips.push(received);
  rest.forEach((item) => {
    if (String(item?.id) === String(receivedStatusId)) return;
    chips.push(item);
  });
  return chips;
}

function isAllOrdersPillCoveredStatus(name = "") {
  const normalized = String(name).trim();
  if (!normalized) return true;
  if (
    normalized.includes("استرجاع") ||
    normalized.includes("مسترجع")
  ) {
    return true;
  }
  if (normalized.includes("ملغ")) return true;
  return false;
}

export function getAllOrdersExtraFilterStatuses(statusItems = []) {
  return (statusItems ?? []).filter(
    (item) => !isAllOrdersPillCoveredStatus(item?.name)
  );
}
