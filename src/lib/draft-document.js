/**
 * دفعة و (D9) — «الدفع بعد مشاهدة المسودة»: مسودة العقد مرفق للطلب (`draft_document`) + إشعار للعميل.
 * ليست مرحلة ولا حالة (E3 باقٍ): لا تغيّر الرحلة.
 */

export const DRAFT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DRAFT_DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
export const DRAFT_ATTACHMENT_KEY = "draft_document";

/** يتحقق من ملف المسودة (PDF/صورة ≤ 10MB) ويرجع رسالة الخطأ أو null. */
export function validateDraftFile(file) {
  if (!file) return "اختر ملف المسودة (PDF أو صورة)";
  const type = String(file.type || "");
  const okType = /^(application\/pdf|image\/(jpeg|png|webp))$/.test(type) || /\.(pdf|jpe?g|png|webp)$/i.test(file.name || "");
  if (!okType) return "الملف يجب أن يكون PDF أو صورة (JPG/PNG/WebP)";
  if (file.size > DRAFT_DOCUMENT_MAX_BYTES) return "حجم الملف يتجاوز 10MB";
  return null;
}

/** المسودة المرفوعة كما يرسلها الخادم، أو null. */
export function getDraftDocument(orderData) {
  const d = orderData?.draft_document;
  return d && typeof d === "object" && d.url ? d : null;
}

/** هل اختار العميل «الدفع بعد مشاهدة المسودة»؟ */
export function isPayAfterDraftOrder(orderData) {
  const v = orderData?.pay_after_draft;
  return v === true || v === 1 || v === "1";
}

/**
 * يضيف المسودة لعارض المرفقات (أولاً) إن لم يرسلها الخادم ضمن `attachments`.
 */
export function withDraftAttachment(attachments = [], orderData) {
  const list = Array.isArray(attachments) ? attachments : [];
  const draft = getDraftDocument(orderData);
  if (!draft || list.some((a) => a?.key === DRAFT_ATTACHMENT_KEY)) return list;
  return [
    {
      key: DRAFT_ATTACHMENT_KEY,
      label: "مسودة العقد (للعميل)",
      url: draft.url,
      is_pdf: draft.is_pdf === true || String(draft.mime ?? "").includes("pdf"),
      mime: draft.mime ?? null,
      name: draft.name ?? null,
    },
    ...list,
  ];
}
