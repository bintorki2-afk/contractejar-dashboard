/**
 * مفاتيح حالات الطلب الثابتة (`status_key`) — المصدر الوحيد هو الخادم
 * (`GET /admin/contract-statuses` و `GET /admin/orders/status-counts`).
 * لا تعتمد على أرقام الحالات (id) — قد تختلف بين قواعد البيانات.
 *
 * المسار: جديد → تم الدفع → قيد المراجعة → مستلم من الموظف → مسودة واتساب → موثّق في إيجار → مكتمل
 * حالات جانبية: ملغى، معلق، مسترجع.
 */

export const ORDER_FLOW_KEYS = [
  "new",
  "paid",
  "under_review",
  "received_by_employee",
  "whatsapp_draft",
  "ejar_authenticated",
  "completed",
];

export const SIDE_STATUS_KEYS = ["cancelled", "on_hold", "refunded", "waiting_supervisor"];

/** تسميات قصيرة وواضحة للواجهة (الاسم الطويل من الخادم يبقى في التلميح). */
export const STATUS_KEY_LABELS = {
  new: "جديد",
  paid: "تم الدفع",
  under_review: "قيد المراجعة",
  received: "مستلم",
  received_by_employee: "مستلم من الموظف",
  whatsapp_draft: "أُرسلت المسودة",
  ejar_authenticated: "موثّق في إيجار",
  completed: "مكتمل",
  cancelled: "ملغى",
  on_hold: "معلق",
  refunded: "مسترجع",
  waiting_supervisor: "بانتظار المشرف",
  incomplete: "غير مكتمل",
  all: "جميع الطلبات",
};

/**
 * درجات الألوان (فئات Tailwind) لكل مفتاح — شارات «pill» موحّدة في القائمة والتفاصيل.
 * tone: brand | info | warning | success | danger | neutral | violet
 */
export const STATUS_KEY_TONES = {
  new: "info",
  paid: "info",
  under_review: "warning",
  received: "violet",
  received_by_employee: "violet",
  whatsapp_draft: "brand",
  ejar_authenticated: "success",
  completed: "success",
  cancelled: "danger",
  on_hold: "neutral",
  refunded: "neutral",
  waiting_supervisor: "warning",
  incomplete: "neutral",
};

export const TONE_CLASSES = {
  brand: "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300",
  info: "bg-[#E8F0FE] text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-300",
  warning: "bg-[#FFF4DE] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300",
  success: "bg-[#E3F4EA] text-[#0B7A4C] dark:bg-emerald-500/15 dark:text-emerald-300",
  danger: "bg-[#FDECEC] text-[#B42318] dark:bg-red-500/15 dark:text-red-300",
  neutral: "bg-[#EEF1F0] text-[#4B5753] dark:bg-white/10 dark:text-white/70",
  violet: "bg-[#EFEAFD] text-[#5B35C9] dark:bg-violet-500/15 dark:text-violet-300",
};

export function statusKeyLabel(key, fallback = "") {
  if (!key) return fallback || "—";
  return STATUS_KEY_LABELS[key] ?? fallback ?? key;
}

export function statusKeyTone(key) {
  return STATUS_KEY_TONES[key] ?? "neutral";
}

export function statusToneClass(key) {
  return TONE_CLASSES[statusKeyTone(key)];
}

/** يبحث عن صف الحالة بالمفتاح (`status_key`) في قائمة الحالات. */
export function findStatusByKey(statuses = [], key) {
  if (!key) return null;
  const list = Array.isArray(statuses) ? statuses : [];
  return list.find((s) => s?.status_key === key) ?? null;
}

/** مفتاح الحالة لصف طلب (قائمة أو تفاصيل) — يفضّل `status_key` من الخادم. */
export function resolveOrderStatusKey(order = {}) {
  if (!order) return null;
  const key = order.status_key ?? order.status?.status_key ?? null;
  if (key === "new" && (order.is_paid === true || order.is_completed === true || order.is_completed === 1)) {
    return "paid";
  }
  return key;
}

/** هل الطلب مغلق (لا خطوات متبقية في رحلة الموظف)؟ */
export function isClosedStatusKey(key) {
  return ["ejar_authenticated", "completed", "cancelled", "refunded", "on_hold"].includes(key);
}

/**
 * يحوّل تبويب القائمة إلى معاملات `GET /admin/orders`.
 * all → بلا فلتر، incomplete → tab=incomplete، غيره → status_key=<key>.
 */
export function tabToOrderListParams(tab) {
  if (!tab || tab === "all") return {};
  if (tab === "incomplete") return { tab: "incomplete" };
  return { status_key: tab };
}

/** ترتيب تبويبات «جميع الطلبات»: الكل، ثم مسار العمل، ثم الحالات الجانبية، ثم «غير مكتمل». */
const TAB_ORDER = [
  "all",
  "new",
  "under_review",
  "received",
  "received_by_employee",
  "whatsapp_draft",
  "ejar_authenticated",
  "completed",
  "on_hold",
  "waiting_supervisor",
  "cancelled",
  "refunded",
  "incomplete",
];

export function sortStatusTabs(tabs = []) {
  const list = Array.isArray(tabs) ? [...tabs] : [];
  const rank = (key) => {
    const i = TAB_ORDER.indexOf(key);
    return i === -1 ? TAB_ORDER.length - 1 : i;
  };
  return list.sort((a, b) => rank(a?.key) - rank(b?.key));
}
