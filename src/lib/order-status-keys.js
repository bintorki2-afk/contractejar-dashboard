/**
 * مفاتيح حالات الطلب الثابتة (`status_key`) — المصدر الوحيد هو الخادم
 * (`GET /admin/contract-statuses` و `GET /admin/orders/status-counts`).
 * لا تعتمد على أرقام الحالات (id) — قد تختلف بين قواعد البيانات.
 *
 * المسار: جديد → تم الدفع → قيد المراجعة → مستلم من الموظف → موثّق في إيجار → مكتمل
 * (دفعة هـ: أُلغيت مرحلة «إرسال المسودة»؛ المفتاح القديم whatsapp_draft بيانات تاريخية فقط.)
 * حالات جانبية: ملغى، معلق، مسترجع.
 */

export const ORDER_FLOW_KEYS = [
  "new",
  "paid",
  "under_review",
  "received_by_employee",
  "ejar_authenticated",
  "completed",
];

export const SIDE_STATUS_KEYS = ["cancelled", "on_hold", "refunded", "waiting_supervisor"];

/** تسميات قصيرة وواضحة للواجهة (الاسم الطويل من الخادم يبقى في التلميح). */
export const STATUS_KEY_LABELS = {
  new: "جديد",
  paid: "تم الدفع",
  under_review: "قيد المراجعة",
  // دفعة و (D1): «مستلم» دُمجت مع «مستلم من الموظف» — المفتاح القديم يُعرض بنفس التسمية.
  received: "مستلم من الموظف",
  received_by_employee: "مستلم من الموظف",
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

/** مفاتيح تاريخية لا تُختار ولا تُعرض كتبويب (D1 + E3). */
export const LEGACY_STATUS_KEYS = ["received", "whatsapp_draft"];

/** حالات لا تُوضع يدوياً من اللوحة — «مسترجع» يتحوّل تلقائياً بعد الاسترجاع الكامل من ميسر (D2). */
export const AUTO_ONLY_STATUS_KEYS = ["refunded"];

export const REFUNDED_MANUAL_HINT =
  "يتحوّل الطلب إلى «مسترجع» تلقائياً بعد تنفيذ الاسترجاع الكامل من ميسر";

function statusRowKey(status) {
  return status?.status_key ?? status?.key ?? null;
}

function looksLikeRefundedName(status) {
  const name = String(status?.name ?? status?.label ?? "").trim();
  return name === "مسترجع" || name === "استرجاع";
}

/** هل الحالة تلقائية فقط (لا تُختار يدوياً)؟ */
export function isAutoOnlyStatus(status) {
  if (!status) return false;
  // الخادم (D2) يرسل manual_selectable=false لـ refunded — هو المصدر الأول.
  if (status.manual_selectable === false || status.manual_selectable === 0) return true;
  if (status.manual_selectable === true || status.manual_selectable === 1) return false;
  const key = statusRowKey(status);
  if (key) return AUTO_ONLY_STATUS_KEYS.includes(key);
  return looksLikeRefundedName(status);
}

/**
 * قائمة الحالات المعروضة في «تغيير الحالة»: تُستبعد المفاتيح التاريخية (received/whatsapp_draft)
 * ويُعلَّم «مسترجع» بـ `manualDisabled` + تلميح بدل إخفائه بصمت.
 */
export function manualStatusOptions(statuses = []) {
  const list = Array.isArray(statuses) ? statuses : [];
  return list
    .filter((s) => s && !LEGACY_STATUS_KEYS.includes(statusRowKey(s)))
    .map((s) =>
      isAutoOnlyStatus(s) ? { ...s, manualDisabled: true, manualHint: s.manual_hint || REFUNDED_MANUAL_HINT } : s
    );
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
  // الخادم (متابعة 1): تبويب «جديد» = غير المدفوع فقط و«تم الدفع» تبويب مستقل —
  // كل تبويب يُرسل مفتاحه كما هو فيتطابق العدّاد مع القائمة.
  return { status_key: tab };
}

/** ترتيب تبويبات «جميع الطلبات»: الكل، ثم مسار العمل، ثم الحالات الجانبية، ثم «غير مكتمل». */
const TAB_ORDER = [
  "all",
  "new",
  "paid",
  "under_review",
  "received_by_employee",
  "ejar_authenticated",
  "completed",
  "on_hold",
  "waiting_supervisor",
  "cancelled",
  "refunded",
  "incomplete",
];

export function sortStatusTabs(tabs = []) {
  // D1: تبويبات المفاتيح التاريخية (received/whatsapp_draft) لا تُعرض — طلباتها نُقلت إلى «مستلم من الموظف».
  const list = Array.isArray(tabs) ? tabs.filter((t) => !LEGACY_STATUS_KEYS.includes(t?.key)) : [];
  const rank = (key) => {
    const i = TAB_ORDER.indexOf(key);
    return i === -1 ? TAB_ORDER.length - 1 : i;
  };
  return list.sort((a, b) => rank(a?.key) - rank(b?.key));
}

/**
 * المرحلة التالية لصف في القائمة (د18) — تقدير من الواجهة لعرض الزر فقط؛
 * الخادم يتحقق من الشروط عند التنفيذ (POST /admin/orders/{id}/stage/{stage}).
 */
export function nextStageForRow(row = {}) {
  const key = row?.status_key ?? null;
  const paid = row?.is_paid === true || row?.is_paid === 1 || row?.is_completed === true || row?.is_completed === 1;
  const received = Boolean(row?.is_received || row?.received_contract_exists);
  if (!paid) return null;
  if (["new", "paid", "under_review"].includes(key) && !received) return "received";
  if (["new", "paid", "under_review", "received", "received_by_employee"].includes(key)) return "notarized";
  return null;
}
