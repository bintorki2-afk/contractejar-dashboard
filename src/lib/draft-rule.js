import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";

/**
 * قاعدة «المسودة قبل التوثيق» (ف2):
 * لا يُوثَّق العقد في إيجار (أو يُغلق «مكتمل») إلا بعد إرسال المسودة للعميل عبر واتساب.
 * الخادم يفرضها (422) — هنا فقط تلميحات الواجهة والإجراءات السريعة.
 */

export const SEND_DRAFT_STATUS_CASE = "send_draft";
export const NOTARIZE_STATUS_CASE = "ejar_authentication";
export const SEND_DRAFT_STATUS_ID = 8;
export const NOTARIZE_STATUS_ID = 9;
export const COMPLETED_STATUS_NAME = "مكتمل";

export const DRAFT_RULE_HINT = "يتطلب إرسال المسودة للعميل أولاً";

function statusCaseKey(status) {
  return status?.status_case?.key ?? null;
}

function findStatus(statuses = [], caseKey, fallbackId) {
  const list = Array.isArray(statuses) ? statuses : [];
  return (
    list.find((s) => statusCaseKey(s) === caseKey) ??
    list.find((s) => String(s?.id) === String(fallbackId)) ??
    null
  );
}

export function findSendDraftStatus(statuses) {
  return findStatus(statuses, SEND_DRAFT_STATUS_CASE, SEND_DRAFT_STATUS_ID);
}

export function findNotarizeStatus(statuses) {
  return findStatus(statuses, NOTARIZE_STATUS_CASE, NOTARIZE_STATUS_ID);
}

export function isSendDraftStatus(status) {
  if (!status) return false;
  if (statusCaseKey(status)) return statusCaseKey(status) === SEND_DRAFT_STATUS_CASE;
  return String(status.id) === String(SEND_DRAFT_STATUS_ID);
}

/** الحالات التي يرفضها الخادم قبل إرسال المسودة: التوثيق في إيجار + مكتمل. */
export function statusRequiresDraftFirst(status) {
  if (!status) return false;
  if (statusCaseKey(status) === NOTARIZE_STATUS_CASE) return true;
  if (String(status.id) === String(NOTARIZE_STATUS_ID)) return true;
  const name = String(status.name ?? status.label ?? "").trim();
  return name === COMPLETED_STATUS_NAME;
}

/** نص رسالة واتساب للعميل عند إرسال المسودة (يتضمن رقم الطلب). */
export function buildDraftWhatsAppText(orderNumber) {
  const order = orderNumber ? ` رقم #${orderNumber}` : "";
  return [
    "السلام عليكم ورحمة الله،",
    `معك فريق «عقد إيجار». أرسلنا لك مسودة عقد الإيجار لطلبك${order} عبر منصة إيجار.`,
    "نرجو الاطلاع على المسودة وتأكيد موافقتك، ولن نوثّق العقد في إيجار إلا بعد اطلاعك عليها.",
    "شكراً لك.",
  ].join("\n");
}

/**
 * رابط wa.me للعميل — يستخدم الرقم البديل إن اختاره الموظف في نموذج الحالة،
 * وإلا رقم جوال صاحب الطلب.
 */
export function buildDraftWhatsAppUrl(orderData, extraValues = {}) {
  const alternate =
    extraValues?.contact_number_mode === "another" ? extraValues?.contact_number : null;
  const mobile =
    alternate ||
    orderData?.user?.mobile ||
    orderData?.user_mobile ||
    orderData?.step3?.tenant_mobile ||
    orderData?.tenant_mobile ||
    "";
  const digits = toSaudiMobileDialDigits(mobile);
  if (!digits) return null;
  const text = encodeURIComponent(buildDraftWhatsAppText(orderData?.uuid));
  return `https://wa.me/${digits}?text=${text}`;
}
