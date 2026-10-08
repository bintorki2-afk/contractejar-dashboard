import { extractRefundContractId } from "./ids";

// حالة «الاسترجاع» تُعرف بالاسم فقط. كان هنا احتياط بالرقم 2، وهو في «عقد إيجار»
// حالة «قيد المراجعة» — فكان اختيار «قيد المراجعة» يفتح طلب استرجاع بدل تغيير الحالة.

export function mapCreatedAtFilter(id) {
  if (!id || id === "total") return "all";
  if (id === "day") return "today";
  return id;
}

export function getReturnAnalysisTitle(id) {
  switch (id) {
    case "day":
      return "مسترجع اليــوم";
    case "week":
      return "مسترجع الأسبوع";
    case "month":
      return "مسترجع الشهر";
    case "year":
      return "مسترجع السنة";
    case "total":
      return "إجمالي المسترجع";
    default:
      return "مسترجع اليــوم";
  }
}

/** API uses `false` for pending/rejected, `true` when admin approved. */
export function isAdminRefundApproved(value) {
  return value === true || value === 1;
}

/**
 * Defensive read of `data.summary.management_approval` into KPI counts.
 * Key names vary across API revisions, so several aliases are tried.
 * NOTE: verify the resolved tiles against the live API response.
 */
export function parseManagementApprovalCounts(summary) {
  const source =
    summary?.management_approval ??
    summary?.managementApproval ??
    summary ??
    {};

  const pick = (...keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
        return Number(value);
      }
    }
    return 0;
  };

  const pending = pick("pending", "waiting", "unconfirmed", "in_review", "under_review", "null");
  const approved = pick("approved", "confirmed", "accepted", "approved_count");
  const rejected = pick("rejected", "not_approved", "declined", "refused", "denied");
  const refunded = pick("refunded", "is_refunded", "customer_refunded", "completed", "done");
  const processing = pick("processing", "in_progress", "pending_refund", "awaiting_refund");

  const hasRefundSplit = refunded > 0 || processing > 0;

  return {
    pending,
    processing: hasRefundSplit
      ? processing || Math.max(approved - refunded, 0)
      : 0,
    completed: hasRefundSplit ? refunded : approved,
    rejected,
  };
}

export function isReturnContractStatus(status) {
  if (!status) return false;
  const name = String(status?.name || status?.label || "").trim();
  return name === "استرجاع" || name.includes("استرجاع") || name.includes("مسترجع");
}

export function getOrderContractStatusDisplay(order) {
  const status = order?.status ?? {};
  const summary = order?.contract_summary ?? {};

  return {
    id: status.id ?? order?.contract_status_id ?? summary.contract_status_id ?? null,
    name: status.name ?? order?.contract_status_name ?? summary.contract_status_name ?? "—",
    color: status.color ?? order?.contract_status_color ?? summary.contract_status_color ?? "#E6F0FF",
  };
}

export function isOrderInReturnStatus(order) {
  const { name } = getOrderContractStatusDisplay(order);
  return isReturnContractStatus({ name: name === "—" ? "" : name });
}

export function isReturnContractOrder(order) {
  if (order?.return_contract === true) return true;
  const statusName = order?.status?.name ?? order?.contract_status_name ?? "";
  return isReturnContractStatus({ name: statusName });
}

/** `refund_amount` is `0` / `"0.00"` / `null` on orders with no return request. */
function hasPositiveRefundAmount(value) {
  if (value == null || value === "") return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

/** A refund record only counts when it carries a real id or amount — not `{}` / `0`. */
function isMeaningfulRefundRecord(record) {
  if (record == null) return false;
  if (typeof record === "number" || typeof record === "string") {
    const key = String(record).trim();
    return key !== "" && key !== "0";
  }
  if (typeof record !== "object") return false;
  if (record.id != null && record.id !== "" && String(record.id) !== "0") return true;
  return hasPositiveRefundAmount(record.refund_amount ?? record.amount);
}

/**
 * Authoritative "a return request exists for this order" — from the explicit
 * backend flag only (top-level or mirrored in `contract_summary`). Never derived.
 */
export const RETURN_REQUEST_UNPAID_MESSAGE = "لا يمكن رفع طلب استرجاع لعقد غير مدفوع";

/**
 * True when the order is known to be unpaid (server rule: refund only for a
 * paid contract). Unknown payment state is treated as paid so the server
 * remains the final authority.
 */
export function isOrderUnpaidForReturn(order) {
  const summary = order?.contract_summary ?? {};
  const isPaid = order?.is_paid ?? summary.is_paid;
  if (isPaid === true || isPaid === 1 || isPaid === "1") return false;
  if (isPaid === false || isPaid === 0 || isPaid === "0") return true;
  const status = order?.payment_status ?? summary.payment_status;
  if (status === "paid") return false;
  if (status === "unpaid") return true;
  return false;
}

export function hasReturnRequest(order) {
  return (
    order?.has_return_request === true ||
    order?.contract_summary?.has_return_request === true
  );
}

/** `pending` | `approved` | `rejected` | `refunded` | null. */
export function getReturnRequestStatus(order) {
  return (
    order?.return_request_status ??
    order?.contract_summary?.return_request_status ??
    null
  );
}

const RETURN_REQUEST_EXISTS_MESSAGE = {
  pending: "يوجد طلب استرجاع قيد المراجعة لهذا الطلب",
  approved: "تمت الموافقة على طلب استرجاع لهذا الطلب",
  rejected: "يوجد طلب استرجاع مرفوض لهذا الطلب",
  refunded: "تم استرجاع مبلغ هذا الطلب بالفعل",
};

/** Toast text for "can't start a return — one already exists", keyed to its status. */
export function getReturnRequestExistsMessage(order) {
  return (
    RETURN_REQUEST_EXISTS_MESSAGE[getReturnRequestStatus(order)] ||
    "يوجد طلب استرجاع مسبقاً لهذا الطلب"
  );
}

/** Refundable-contract record id for approve/reject actions, or null. */
export function getRefundContractId(order) {
  return (
    order?.refund_contract_id ??
    order?.contract_summary?.refund_contract_id ??
    null
  );
}

export function hasExistingReturnRequest(order) {
  if (!order) return false;
  // Explicit backend flag wins whenever the row carries it.
  if (order.has_return_request != null || order.contract_summary?.has_return_request != null) {
    return hasReturnRequest(order);
  }
  if (isReturnContractOrder(order)) return true;
  if (order.is_return_order === true) return true;

  const refundContractId = extractRefundContractId(order);
  if (refundContractId != null && refundContractId !== "" && String(refundContractId) !== "0") {
    return true;
  }

  if (hasPositiveRefundAmount(order.refund_amount)) return true;

  const nested =
    order.refundable_contract ??
    order.refund ??
    (Array.isArray(order.refundable_contracts) ? order.refundable_contracts[0] : null);
  if (isMeaningfulRefundRecord(nested)) return true;

  return false;
}

/** Whether "رفع طلب استرجاع" can still be opened — i.e. no request exists yet. */
export function canRequestOrderReturn(order) {
  return !!order && !hasReturnRequest(order);
}

export function isCustomerRefundPending(order) {
  const value = order?.customer_refunded ?? order?.is_refunded ?? order?.refunded;
  return value === null || value === undefined;
}

export function canManageAdminRefund(refund) {
  if (!refund) return false;
  if (refund.returnContract) {
    return !isAdminRefundApproved(refund.adminConfirmed);
  }
  return !isAdminRefundApproved(refund.adminConfirmed);
}

export function formatRelativeTimeAr(dateString) {
  if (!dateString) return "—";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes}د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days >= 1 && remainingHours > 0) return `منذ ${days} يوم و ${remainingHours} س`;
  if (days >= 1) return `منذ ${days} يوم`;
  return `منذ ${hours} س`;
}

export function buildRefundApprovedCustomerMessage(refund) {
  const amount = refund?.refundAmount ?? "—";
  const reference = refund?.referenceNumber ?? "—";
  const orderNumber = refund?.orderUuid ?? "—";

  return `عميلنا العزيز،

نود إبلاغكم بأنه تم استرجاع المبلغ بنجاح
المبلغ: ${amount}
الرقم المرجعي: ${reference}
رقم الطلب: ${orderNumber}

شكراً لتفهمكم.`;
}
