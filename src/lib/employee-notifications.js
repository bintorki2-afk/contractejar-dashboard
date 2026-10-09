/**
 * إشعارات الموظف داخل اللوحة (دفعة هـ — D-1): GET /admin/employee-notifications.
 * الخادم يرسل {items:[{id, kind, title, body, url, contract_id, order_number, data, is_read, read_at, created_at}], unread_count, pagination}.
 * هنا فقط: التطبيع، تسمية النوع وأيقونته، رابط الطلب، ونص الوقت النسبي.
 */

export const EMPLOYEE_NOTIFICATION_KINDS = {
  data_request_resolved: { label: "ردّ العميل", tone: "info", icon: "reply" },
  charge_paid: { label: "دفع رسوم", tone: "success", icon: "paid" },
};

const DEFAULT_KIND = { label: "إشعار", tone: "neutral", icon: "bell" };

export function employeeNotificationKind(kind) {
  return EMPLOYEE_NOTIFICATION_KINDS[kind] ?? DEFAULT_KIND;
}

/** رابط صفحة الطلب في اللوحة: url من الخادم إن كان داخلياً، وإلا من contract_id. */
export function employeeNotificationHref(raw = {}) {
  const url = typeof raw?.url === "string" ? raw.url.trim() : "";
  if (url.startsWith("/home/")) return url;
  const contractId = raw?.contract_id ?? raw?.data?.contract_id;
  if (contractId != null && contractId !== "") return `/home/orders/${contractId}`;
  return null;
}

/** «قبل دقيقة» / «قبل دقيقتين» / «قبل 5 دقائق» / «قبل 15 دقيقة». */
function arUnit(n, one, two, few) {
  if (n === 1) return `قبل ${one}`;
  if (n === 2) return `قبل ${two}`;
  return `قبل ${n} ${n <= 10 ? few : one}`;
}

/** «قبل 5 دقائق» / «قبل ساعتين» / «أمس» / تاريخ قصير. */
export function relativeTimeAr(iso, now = new Date()) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return arUnit(diffMin, "دقيقة", "دقيقتين", "دقائق");
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return arUnit(diffH, "ساعة", "ساعتين", "ساعات");
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "أمس";
  if (diffD < 7) return `قبل ${diffD} أيام`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** صف واحد من الخادم ← شكل البطاقة. */
export function mapEmployeeNotification(raw = {}, now = new Date()) {
  const kind = String(raw?.kind ?? raw?.data?.type ?? "");
  const meta = employeeNotificationKind(kind);
  const isRead = raw?.is_read === true || raw?.is_read === 1 || Boolean(raw?.read_at);
  const contractId = raw?.contract_id ?? raw?.data?.contract_id ?? null;
  return {
    id: raw?.id,
    kind,
    kindLabel: meta.label,
    tone: meta.tone,
    icon: meta.icon,
    title: String(raw?.title ?? meta.label),
    body: String(raw?.body ?? ""),
    href: employeeNotificationHref(raw),
    contractId: contractId != null && contractId !== "" ? Number(contractId) : null,
    orderNumber: raw?.order_number ?? raw?.data?.contract_uuid ?? null,
    isRead,
    readAt: raw?.read_at ?? null,
    createdAt: raw?.created_at ?? null,
    timeLabel: relativeTimeAr(raw?.created_at, now),
  };
}

/** غلاف الاستجابة ← { items, unreadCount, currentPage, lastPage, total }. */
export function normalizeEmployeeNotifications(payload = {}, now = new Date()) {
  const items = Array.isArray(payload?.items) ? payload.items.map((row) => mapEmployeeNotification(row, now)) : [];
  const pagination = payload?.pagination ?? {};
  const unreadFromServer = Number(payload?.unread_count);
  return {
    items,
    unreadCount: Number.isFinite(unreadFromServer) ? unreadFromServer : items.filter((n) => !n.isRead).length,
    currentPage: Number(pagination.current_page ?? 1) || 1,
    lastPage: Number(pagination.last_page ?? 1) || 1,
    total: Number(pagination.total ?? items.length) || 0,
  };
}

/** نص شارة الجرس: لا شيء / 1..99 / «99+». */
export function unreadBadgeText(count) {
  const n = Number(count) || 0;
  if (n <= 0) return "";
  return n > 99 ? "99+" : String(n);
}

/** تحديث محلي متفائل: وضع إشعار (أو الكل) كمقروء. */
export function markReadLocally(data, id = null) {
  if (!data) return data;
  const items = data.items.map((n) => (id == null || n.id === id ? { ...n, isRead: true } : n));
  const changed = data.items.filter((n) => !n.isRead && (id == null || n.id === id)).length;
  return { ...data, items, unreadCount: Math.max(0, (data.unreadCount ?? 0) - changed) };
}
