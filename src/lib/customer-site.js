/**
 * موقع العملاء «عقد إيجار» (contractejar.com) — منفصل تماماً عن aqdi.sa.
 * أي رابط يُرسل للعميل من اللوحة يجب أن يكون على هذا الموقع.
 */
export const CUSTOMER_SITE_URL = String(
  process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || "https://contractejar.com"
).replace(/\/+$/, "");

/**
 * الرابط الذكي للطلب `/r/{رقم الطلب}` (نفس ما يرسله الخادم في الإشعارات):
 * يفتح التطبيق إن كان مثبّتاً، وإلا صفحة الطلب على الموقع، وفيها «ادفع الآن» للطلب غير المدفوع.
 */
export function buildOrderSmartLink(orderNumber) {
  const id = String(orderNumber ?? "").trim();
  if (!id) return "";
  return `${CUSTOMER_SITE_URL}/r/${encodeURIComponent(id)}`;
}
