/**
 * طلبات «مرفق ناقص / تصحيح بيانات» (دفعة هـ — E4 / 2.4).
 * الخادم هو المصدر: الكتالوج (`GET /admin/data-requests/catalogue`)، الرسالة، الرابط المباشر.
 * هنا: مساعدات عرض خالصة (تسميات الشارات، معاينة الرسالة قبل الإرسال، ساعات الانتظار).
 */

export const DATA_REQUEST_SECTIONS = [
  { key: "lessor", label: "المؤجر" },
  { key: "property", label: "العقار والعنوان" },
  { key: "tenant", label: "المستأجر" },
];

export const DATA_REQUEST_STATUS_LABELS = {
  pending: "بانتظار العميل",
  resolved: "تم الحل",
  cancelled: "ملغي",
};

export function sectionLabel(key, catalogue = null) {
  const fromCatalogue = catalogue?.sections?.find((s) => s.key === key)?.label;
  return fromCatalogue ?? DATA_REQUEST_SECTIONS.find((s) => s.key === key)?.label ?? key ?? "";
}

/** عناصر الطلب كنصوص (تقبل {key,label} أو نصوصاً جاهزة). */
export function itemLabels(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((i) => (typeof i === "string" ? i : i?.label ?? i?.key ?? ""))
    .filter(Boolean);
}

/** «بانتظار العميل · صورة الصك غير واضحة · رقم الصك» (أقصى 2 عناصر ثم «+N»). */
export function dataRequestBadgeLabel(pending, { max = 2 } = {}) {
  if (!pending) return null;
  const labels = itemLabels(pending.items);
  if (!labels.length) return pending.label ?? DATA_REQUEST_STATUS_LABELS.pending;
  const shown = labels.slice(0, max);
  const rest = labels.length - shown.length;
  return `${DATA_REQUEST_STATUS_LABELS.pending} · ${shown.join(" · ")}${rest > 0 ? ` +${rest}` : ""}`;
}

/** «منذ 30 ساعة» / «منذ 3 أيام» / «قبل قليل». */
export function hoursWaitingLabel(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h < 1) return "قبل قليل";
  if (h < 24) return `منذ ${Math.floor(h)} ساعة`;
  const days = Math.floor(h / 24);
  if (days === 1) return "منذ يوم";
  if (days === 2) return "منذ يومين";
  if (days <= 10) return `منذ ${days} أيام`;
  return `منذ ${days} يوماً`;
}

/** هل تجاوز الطلب حدّ التذكير (24 ساعة افتراضياً)؟ */
export function needsReminder(pending, reminderAfterHours = 24) {
  if (!pending) return false;
  return Number(pending.hours_waiting ?? pending.hours ?? 0) >= reminderAfterHours;
}

/**
 * معاينة رسالة الواتساب قبل الإرسال (الخادم يرجع الرسالة النهائية من القالب `data_request`؛
 * هذه المعاينة تُطابق بنيته: ترحيب + رقم الطلب + العناصر + الملاحظة + الرابط المباشر).
 */
export function buildDataRequestMessage({ orderNumber, items = [], note = "", deepLink = "" } = {}) {
  const labels = itemLabels(items);
  const lines = [`مرحباً عميل عقد إيجار`, `بخصوص طلبك رقم ${orderNumber ?? "—"} في «عقد إيجار»، نحتاج منك:`];
  labels.forEach((l) => lines.push(`• ${l}`));
  const trimmed = String(note ?? "").trim();
  if (trimmed) lines.push(`• ${trimmed}`);
  lines.push(deepLink ? `أرسلها من هذا الرابط مباشرة (بدون إعادة تعبئة الطلب): ${deepLink}` : "أرسلها من رابط طلبك مباشرة (بدون إعادة تعبئة الطلب).");
  return lines.join("\n");
}

/** يبني رابط wa.me من رقم الاتصال والرسالة (للمعاينة فقط؛ الخادم يرجع whatsapp_url الفعلي). */
export function buildWhatsAppUrl(dialDigits, message) {
  if (!dialDigits) return null;
  return `https://wa.me/${dialDigits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/** العناصر المختارة افتراضياً عند فتح الحوار من قسم معيّن (كل عناصر القسم). */
export function defaultSelectionForSection(catalogue, sectionKey) {
  const section = catalogue?.sections?.find((s) => s.key === sectionKey);
  return section ? section.items.map((i) => i.key) : [];
}
