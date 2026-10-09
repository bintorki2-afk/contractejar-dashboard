/**
 * أسماء الأدوار بالعربية (دفعة د — د6). الخادم يرسل `role` كمفتاح إنجليزي (admin, manager…)
 * و`role_title`/`title_ar` بالعربية؛ نفضّل العربي دائماً ونترجم المفاتيح المعروفة احتياطاً.
 */
export const ROLE_KEY_LABELS = {
  admin: "مدير النظام",
  super_admin: "مدير النظام",
  superadmin: "مدير النظام",
  system_admin: "مدير النظام",
  administrator: "مدير النظام",
  manager: "مسؤول",
  supervisor: "مشرف",
  customer_service: "خدمة العملاء",
  receiver: "مستلم الطلبات",
  contract_receiver: "مستلم الطلبات",
  employee: "موظف",
  marketing: "التسويق",
  accountant: "محاسب",
  content_admin: "مسؤول المحتوى",
};

const LATIN_RE = /[A-Za-z]/;

/** يحوّل مفتاح/اسم دور إلى نص عربي واضح. */
export function roleKeyToArabic(value) {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (!LATIN_RE.test(raw)) return raw;
  const key = raw.toLowerCase().replace(/[-\s]+/g, "_");
  return ROLE_KEY_LABELS[key] ?? raw;
}

/**
 * أفضل تسمية عربية لدور المستخدم/الموظف: العنوان العربي أولاً، ثم ترجمة المفتاح.
 * يقبل كائن المستخدم أو الموظف أو الدور.
 */
export function roleLabelAr(source) {
  if (!source) return "";
  if (typeof source === "string") return roleKeyToArabic(source);
  const candidates = [
    source.role_title,
    source.role_relation?.title_ar,
    source.role_relation?.title_trans,
    source.title_ar,
    source.title_trans,
    typeof source.role === "object" ? source.role?.title_ar : null,
  ];
  const arabic = candidates.find((c) => c && !LATIN_RE.test(String(c)));
  if (arabic) return String(arabic);
  const key =
    (typeof source.role === "string" ? source.role : source.role?.name) ??
    source.role_relation?.name ??
    source.name;
  return roleKeyToArabic(key);
}
