/**
 * دفعة و (D7) — تقييمات العملاء و«4.7 من 3000» من اللوحة.
 * الخادم هو المصدر: `GET /admin/customer-reviews` (+ settings) — انظر API.md.
 */

export const CUSTOMER_REVIEWS_API = "/admin/customer-reviews";
export const CUSTOMER_REVIEWS_SETTINGS_API = "/admin/customer-reviews/settings";
export const CUSTOMER_REVIEWS_QUERY_KEY = "customer-reviews";
export const CUSTOMER_REVIEWS_SETTINGS_QUERY_KEY = "customer-reviews-settings";

export const REVIEW_CONTRACT_TYPES = [
  { value: "", label: "بدون تحديد" },
  { value: "residential", label: "عقد سكني" },
  { value: "commercial", label: "عقد تجاري" },
];

export function contractTypeLabel(value) {
  return REVIEW_CONTRACT_TYPES.find((t) => t.value === (value ?? ""))?.label ?? "";
}

function unwrap(response) {
  const body = response?.data ?? response;
  // { success, data: {...} } أو {...} مباشرة.
  if (body && typeof body === "object" && body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return body.data;
  }
  return body ?? {};
}

function toBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (["0", "false", "no", ""].includes(s)) return false;
  return true;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeReview(row = {}) {
  return {
    id: row.id,
    name: String(row.name ?? ""),
    city: String(row.city ?? ""),
    text: String(row.text ?? ""),
    rating: Math.min(5, Math.max(1, Math.round(toNumber(row.rating, 5)))),
    contract_type: row.contract_type ?? "",
    sort_order: toNumber(row.sort_order, 0),
    is_visible: toBool(row.is_visible, true),
    created_at: row.created_at ?? null,
  };
}

/** `{ summary, reviews }` من رد القائمة — مرتبة بـ sort_order كما يعرضها الموقع. */
export function extractCustomerReviews(response) {
  const data = unwrap(response);
  const raw = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const reviews = raw.map(normalizeReview).sort((a, b) => a.sort_order - b.sort_order || toNumber(a.id) - toNumber(b.id));
  return { summary: data?.summary ?? null, reviews };
}

export const DEFAULT_REVIEWS_SETTINGS = { reviews_enabled: true, reviews_average: 4.7, reviews_count: 3000 };

export function extractReviewsSettings(response) {
  const data = unwrap(response);
  const s = data?.settings && typeof data.settings === "object" ? data.settings : data;
  return {
    reviews_enabled: toBool(s?.reviews_enabled, DEFAULT_REVIEWS_SETTINGS.reviews_enabled),
    reviews_average: toNumber(s?.reviews_average, DEFAULT_REVIEWS_SETTINGS.reviews_average),
    reviews_count: Math.max(0, Math.round(toNumber(s?.reviews_count, DEFAULT_REVIEWS_SETTINGS.reviews_count))),
  };
}

/** معاينة نص الملخص كما يظهر في الموقع (عرض فقط؛ النص النهائي `summary.label` من الخادم). */
export function reviewsSummaryPreview({ reviews_average, reviews_count } = {}) {
  const avg = toNumber(reviews_average, 0);
  const count = Math.max(0, Math.round(toNumber(reviews_count, 0)));
  const avgText = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  return `${avgText} من 5 · أكثر من ${count} تقييم`;
}

/** جسم POST للإضافة/التعديل — يرسل الحقول المعرفة فقط (التعديل جزئي). */
export function buildReviewPayload(values = {}) {
  const payload = {
    name: String(values.name ?? "").trim(),
    text: String(values.text ?? "").trim(),
    rating: Math.min(5, Math.max(1, Math.round(toNumber(values.rating, 5)))),
    city: String(values.city ?? "").trim() || null,
    contract_type: values.contract_type ? values.contract_type : null,
    is_visible: toBool(values.is_visible, true),
  };
  if (values.sort_order !== undefined && values.sort_order !== null && values.sort_order !== "") {
    payload.sort_order = Math.max(0, Math.round(toNumber(values.sort_order, 0)));
  }
  return payload;
}

/** ينقل عنصراً للأعلى/للأسفل ويعيد قائمة المعرّفات بالترتيب الجديد (لـ POST …/reorder). */
export function moveReviewIds(reviews = [], id, direction) {
  const ids = reviews.map((r) => r.id);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return ids;
}
