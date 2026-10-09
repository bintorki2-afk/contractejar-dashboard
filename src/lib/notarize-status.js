/**
 * حالة «توثيق العقد في إيجار» (دفعة هـ): تُحدَّد بمفتاح الحالة ثم بـ status_case ثم بالمعرّف القديم.
 * (قاعدة «المسودة قبل التوثيق» أُلغيت — لا توجد مرحلة إرسال مسودة.)
 */
export const NOTARIZE_STATUS_CASE = "ejar_authentication";
export const NOTARIZE_STATUS_KEY = "ejar_authenticated";
export const NOTARIZE_STATUS_ID = 9;

export function findNotarizeStatus(statuses = []) {
  const list = Array.isArray(statuses) ? statuses : [];
  return (
    list.find((s) => s?.status_key === NOTARIZE_STATUS_KEY) ??
    list.find((s) => s?.status_case?.key === NOTARIZE_STATUS_CASE) ??
    list.find((s) => String(s?.id) === String(NOTARIZE_STATUS_ID)) ??
    null
  );
}
