/**
 * إعدادات الموقع العامة (الأسعار والرسوم + حسابات التواصل).
 *
 * المصدر: `GET /admin/settings` → `data.pricing` و `data.social`.
 * الحفظ: `POST /admin/settings` بإرسال مفاتيح القسم فقط (المفاتيح غير المرسلة لا تُلمس،
 * والنص الفارغ في حسابات التواصل يمسح الحساب).
 */
export const SITE_SETTINGS_API = "/admin/settings";
export const SITE_SETTINGS_QUERY_KEY = "site-settings";

export const DOCUMENT_SURCHARGE_HELPER_TEXT =
  "تُضاف مرة واحدة لكل عقد عند اختيار أحد هذه الأنواع: صك ورقي، صك والمالك متوفى، صك والمالك وقف، ورقة مبايعة، وثيقة هيئة المدن الاقتصادية، حجة استحكام.";

export const PRICING_FIELD_GROUPS = [
  {
    id: "documentation",
    title: "رسوم التوثيق",
    description: "أي عقد لمدة سنة أو أقل يُحسب سنة؛ وكل سنة زيادة أو جزء منها تُحسب سنة إضافية.",
    fields: [
      { key: "doc_fee_housing_first_year", label: "سكني — السنة الأولى", unit: "ريال" },
      { key: "doc_fee_housing_extra_year", label: "سكني — كل سنة إضافية", unit: "ريال" },
      { key: "doc_fee_commercial_first_year", label: "تجاري — السنة الأولى", unit: "ريال" },
      { key: "doc_fee_commercial_extra_year", label: "تجاري — كل سنة إضافية", unit: "ريال" },
    ],
  },
  {
    id: "extras",
    title: "رسوم إضافية",
    fields: [
      {
        key: "document_surcharge_fee",
        label: "رسوم المستندات الإضافية",
        unit: "ريال",
        helper: DOCUMENT_SURCHARGE_HELPER_TEXT,
      },
      { key: "lessor_change_fee", label: "رسوم خدمة تغيير المؤجر", unit: "ريال" },
      {
        key: "vat_rate",
        label: "نسبة ضريبة القيمة المضافة",
        unit: "%",
        helper: "0 = بدون ضريبة (تظهر للعميل «مجانًا»).",
        max: 100,
      },
    ],
  },
  {
    id: "meters",
    title: "رسوم نقل العداد باسم المستأجر",
    description: "تُضاف لكل عداد عندما يختار العميل «باسم المستأجر» في بيانات الوحدة.",
    fields: [
      { key: "electricity_meter_fee_housing_tenant", label: "رسوم نقل عداد الكهرباء باسم المستأجر (سكني)", unit: "ريال" },
      { key: "water_meter_fee_housing_tenant", label: "رسوم نقل عداد المياه باسم المستأجر (سكني)", unit: "ريال" },
      { key: "electricity_meter_fee_commercial_tenant", label: "رسوم نقل عداد الكهرباء باسم المستأجر (تجاري)", unit: "ريال" },
      { key: "water_meter_fee_commercial_tenant", label: "رسوم نقل عداد المياه باسم المستأجر (تجاري)", unit: "ريال" },
    ],
  },
];

export const PRICING_FIELDS = PRICING_FIELD_GROUPS.flatMap((group) => group.fields);
export const PRICING_KEYS = PRICING_FIELDS.map((field) => field.key);

export const SOCIAL_FIELDS = [
  { key: "whatsapp", label: "واتساب (الرقم العام)", placeholder: "9665xxxxxxxx", dir: "ltr" },
  { key: "whatsapp_contract", label: "واتساب العقود", placeholder: "9665xxxxxxxx", dir: "ltr" },
  { key: "instagram", label: "إنستقرام", placeholder: "https://instagram.com/…", dir: "ltr" },
  { key: "twitter", label: "إكس (تويتر)", placeholder: "https://x.com/…", dir: "ltr" },
  { key: "snapchat", label: "سناب شات", placeholder: "https://snapchat.com/add/…", dir: "ltr" },
  { key: "facebook", label: "فيسبوك", placeholder: "https://facebook.com/…", dir: "ltr" },
  { key: "tiktok", label: "تيك توك", placeholder: "https://tiktok.com/@…", dir: "ltr" },
  { key: "linkedIn", label: "لينكد إن", placeholder: "https://linkedin.com/company/…", dir: "ltr" },
];

export const SOCIAL_KEYS = SOCIAL_FIELDS.map((field) => field.key);

export const SOCIAL_HELPER_TEXT = "اترك الحقل فارغاً ليختفي الحساب من الموقع والتطبيق.";

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** يحوّل الأرقام العربية الهندية (٠-٩ و ۰-۹) إلى أرقام إنجليزية ويوحّد الفاصلة العشرية. */
export function normalizeNumericInput(value) {
  if (value == null) return "";
  return String(value)
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EXTENDED_ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[٫,]/g, ".")
    .trim();
}

function unwrapSettings(response) {
  const body = response?.data ?? response;
  return body?.data ?? body;
}

function toInputValue(value) {
  if (value == null || value === "") return "";
  return String(value);
}

export const emptyPricingForm = PRICING_KEYS.reduce((acc, key) => {
  acc[key] = "";
  return acc;
}, {});

export const emptySocialForm = SOCIAL_KEYS.reduce((acc, key) => {
  acc[key] = "";
  return acc;
}, {});

export function extractPricingSettings(response) {
  const data = unwrapSettings(response);
  const pricing = data?.pricing && typeof data.pricing === "object" ? data.pricing : {};
  // ترجع الـ API قيم الرسوم أيضاً داخل `settings` (القديم) — نقرأ `pricing` أولاً.
  const legacy = data?.settings && typeof data.settings === "object" ? data.settings : {};

  return PRICING_KEYS.reduce((acc, key) => {
    acc[key] = toInputValue(pricing[key] ?? legacy[key]);
    return acc;
  }, {});
}

/** أكواد أنواع الصكوك التي تُطبّق عليها رسوم المستندات الإضافية (كما يرسلها الخادم). */
export function extractDocumentSurchargeTypes(response) {
  const data = unwrapSettings(response);
  const types = data?.pricing?.document_surcharge_instrument_types;
  return Array.isArray(types) ? types.filter((t) => typeof t === "string" && t) : [];
}

export function extractSocialSettings(response) {
  const data = unwrapSettings(response);
  const social = data?.social && typeof data.social === "object" ? data.social : {};

  return SOCIAL_KEYS.reduce((acc, key) => {
    acc[key] = toInputValue(social[key]);
    return acc;
  }, {});
}

/** يحوّل حقول النموذج إلى أرقام؛ الحقول الفارغة تُهمل (لا تُلمس في الخادم). */
export function buildPricingPayload(form = {}) {
  const payload = {};
  for (const key of PRICING_KEYS) {
    const raw = normalizeNumericInput(form[key]);
    if (raw === "") continue;
    const num = Number(raw);
    payload[key] = Number.isNaN(num) ? raw : num;
  }
  return payload;
}

/** يرسل كل مفاتيح التواصل؛ النص الفارغ يمسح الحساب من الخادم. */
export function buildSocialPayload(form = {}) {
  return SOCIAL_KEYS.reduce((acc, key) => {
    acc[key] = typeof form[key] === "string" ? form[key].trim() : "";
    return acc;
  }, {});
}

/** أخطاء تحقق محلية بسيطة قبل الإرسال (الخادم هو المرجع النهائي). */
export function validatePricingForm(form = {}) {
  const errors = {};
  for (const field of PRICING_FIELDS) {
    const raw = normalizeNumericInput(form[field.key]);
    if (raw === "") continue;
    const num = Number(raw);
    if (Number.isNaN(num)) {
      errors[field.key] = "أدخل رقماً صحيحاً";
    } else if (num < 0) {
      errors[field.key] = "لا يمكن أن تكون القيمة سالبة";
    } else if (field.max != null && num > field.max) {
      errors[field.key] = `الحد الأقصى ${field.max}`;
    }
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* رقم الدعم (ف18) — `whatsapp_contact` هو مصدر رقم الدعم في الموقع والتطبيق. */

export const SUPPORT_DEFAULT_NUMBER = "966597500014";
export const SUPPORT_DEFAULT_NUMBER_LOCAL = "0597500014";

export function extractSupportSettings(response) {
  const data = unwrapSettings(response);
  const social = data?.social && typeof data.social === "object" ? data.social : {};
  const support = data?.support && typeof data.support === "object" ? data.support : {};
  return {
    form: { whatsapp_contact: toInputValue(social.whatsapp_contact) },
    effective: toInputValue(support.whatsapp) || SUPPORT_DEFAULT_NUMBER,
    effectiveLocal: toInputValue(support.whatsapp_local) || SUPPORT_DEFAULT_NUMBER_LOCAL,
    fallback: toInputValue(support.default) || SUPPORT_DEFAULT_NUMBER,
  };
}

/** يقبل 05XXXXXXXX أو 9665XXXXXXXX أو +966…؛ الفارغ = الرجوع للرقم الافتراضي. */
export function validateSupportNumber(value) {
  const digits = normalizeNumericInput(value).replace(/\D/g, "");
  if (!digits) return null;
  if (/^05\d{8}$/.test(digits) || /^9665\d{8}$/.test(digits) || /^009665\d{8}$/.test(digits)) {
    return null;
  }
  return "أدخل رقم جوال سعودي صحيح (مثل 0597500014)";
}

export function buildSupportPayload(form = {}) {
  const digits = normalizeNumericInput(form.whatsapp_contact ?? "").replace(/\D/g, "");
  return { whatsapp_contact: digits };
}

/* ------------------------------------------------------------------ */
/* إصدارات التطبيق والتحديث الإجباري — تقرأها التطبيقات من GET /api/v2/app/version. */

export const APP_VERSION_PLATFORMS = [
  {
    id: "ios",
    title: "آيفون (App Store)",
    fields: [
      { key: "app_ios_min_version", label: "أقل إصدار مسموح", placeholder: "2.1.0", kind: "version" },
      { key: "app_ios_latest_version", label: "أحدث إصدار", placeholder: "2.2.0", kind: "version" },
      { key: "app_ios_store_url", label: "رابط المتجر", placeholder: "https://apps.apple.com/…", kind: "url" },
    ],
  },
  {
    id: "android",
    title: "أندرويد (Google Play)",
    fields: [
      { key: "app_android_min_version", label: "أقل إصدار مسموح", placeholder: "2.1.0", kind: "version" },
      { key: "app_android_latest_version", label: "أحدث إصدار", placeholder: "2.2.0", kind: "version" },
      { key: "app_android_store_url", label: "رابط المتجر", placeholder: "https://play.google.com/store/apps/details?id=…", kind: "url" },
    ],
  },
];

export const APP_VERSION_MESSAGE_KEY = "app_force_update_message";

export const APP_VERSION_KEYS = [
  ...APP_VERSION_PLATFORMS.flatMap((platform) => platform.fields.map((field) => field.key)),
  APP_VERSION_MESSAGE_KEY,
];

export function extractAppVersionSettings(response) {
  const data = unwrapSettings(response);
  const section = data?.app_version && typeof data.app_version === "object" ? data.app_version : {};
  return APP_VERSION_KEYS.reduce((acc, key) => {
    acc[key] = toInputValue(section[key]);
    return acc;
  }, {});
}

const VERSION_PATTERN = /^\d+(\.\d+){0,3}$/;

function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function validateAppVersionForm(form = {}) {
  const errors = {};
  for (const platform of APP_VERSION_PLATFORMS) {
    for (const field of platform.fields) {
      const value = String(form[field.key] ?? "").trim();
      if (!value) continue;
      if (field.kind === "version" && !VERSION_PATTERN.test(value)) {
        errors[field.key] = "صيغة الإصدار مثل 2.1.0";
      }
      if (field.kind === "url" && !/^https:\/\//i.test(value)) {
        errors[field.key] = "يجب أن يبدأ الرابط بـ https://";
      }
    }
    const [minField, latestField] = platform.fields;
    const min = String(form[minField.key] ?? "").trim();
    const latest = String(form[latestField.key] ?? "").trim();
    if (
      min &&
      latest &&
      !errors[minField.key] &&
      !errors[latestField.key] &&
      compareVersions(min, latest) > 0
    ) {
      errors[minField.key] = "أقل إصدار لا يمكن أن يكون أحدث من «أحدث إصدار»";
    }
  }
  return errors;
}

/** يرسل كل مفاتيح الإصدار؛ الفارغ يُرسل null (يمسح القيمة). */
export function buildAppVersionPayload(form = {}) {
  return APP_VERSION_KEYS.reduce((acc, key) => {
    const value = typeof form[key] === "string" ? form[key].trim() : "";
    acc[key] = value === "" ? null : value;
    return acc;
  }, {});
}
