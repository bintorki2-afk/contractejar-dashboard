"use client";

/**
 * Admin "Website images SEO" catalog — edit `alt` / `meta title` / `meta description`
 * (bilingual) for public website images. Backed by `/api/admin/website-images`
 * (axios baseURL already carries the `/api` prefix). Permission section:
 * `website_images` (view / create / edit / delete).
 */
export const WEBSITE_IMAGES_ENDPOINT = "/admin/website-images";
export const WEBSITE_IMAGES_QUERY_KEY = "website-images";

/** Text fields the edit form owns, as bilingual (ar/en) pairs. */
export const WEBSITE_IMAGE_TEXT_FIELDS = [
  {
    key: "alt",
    label: "النص البديل (alt)",
    hint: "يصف الصورة لقارئات الشاشة ومحركات البحث. اتركه فارغًا للرجوع للنص الافتراضي.",
    multiline: false,
  },
  {
    key: "meta_title",
    label: "عنوان الميتا",
    hint: "عنوان SEO المرتبط بالصورة (اختياري).",
    multiline: false,
  },
  {
    key: "meta_description",
    label: "وصف الميتا",
    hint: "وصف SEO مختصر يظهر في نتائج البحث (اختياري).",
    multiline: true,
  },
];

export const WEBSITE_IMAGE_SUMMARY_CARDS = [
  { key: "total", label: "إجمالي الصور" },
  { key: "active", label: "المفعّلة" },
  { key: "with_alt", label: "لديها نص بديل" },
  { key: "with_meta", label: "لديها ميتا" },
];

function str(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

/** Normalize the list endpoint payload into `{ summary, items }`. */
export function extractWebsiteImages(responseData) {
  const payload = responseData?.data ?? responseData ?? {};
  const summary = payload.summary ?? {};
  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  return { summary, items };
}

/** Public marketing site — static `/website/asset/...` files live here, not on the API host. */
export const PUBLIC_WEBSITE_ORIGIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WEBSITE_ORIGIN) ||
  "https://aqdi.sa";

/**
 * Best-effort resolved URL for a row.
 * (سجل قديم مخفي — د4) الـ API القديم كان يعيد روابط `/website/...` على خادم آخر تُرجع 404 —
 * تلك الملفات الثابتة كانت على الموقع القديم. Uploaded media on other paths
 * keep their absolute URL as-is.
 */
export function resolveImageUrl(item = {}) {
  const raw = item.url || item.path || item.static_path || "";
  if (!raw || typeof raw !== "string") return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/website/")) {
        return `${PUBLIC_WEBSITE_ORIGIN}${parsed.pathname}${parsed.search}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${PUBLIC_WEBSITE_ORIGIN}${path}`;
}

export const EMPTY_WEBSITE_IMAGE_FORM = {
  label_ar: "",
  label_en: "",
  alt_ar: "",
  alt_en: "",
  meta_title_ar: "",
  meta_title_en: "",
  meta_description_ar: "",
  meta_description_en: "",
  static_path: "",
  sort_order: "",
  is_active: true,
};

export function websiteImageToForm(item) {
  if (!item) return { ...EMPTY_WEBSITE_IMAGE_FORM };
  return {
    label_ar: str(item.label_ar),
    label_en: str(item.label_en),
    alt_ar: str(item.alt_ar),
    alt_en: str(item.alt_en),
    meta_title_ar: str(item.meta_title_ar),
    meta_title_en: str(item.meta_title_en),
    meta_description_ar: str(item.meta_description_ar),
    meta_description_en: str(item.meta_description_en),
    static_path: str(item.static_path),
    sort_order: item.sort_order == null ? "" : String(item.sort_order),
    is_active: item.is_active !== false,
  };
}

/**
 * Build a multipart body for create/update. Update goes through `POST /{id}` with
 * `_method=PUT` so the optional `image` file survives (Laravel doesn't parse
 * multipart PUT bodies). `key` is only sent on create — it is stable afterwards.
 */
export function buildWebsiteImageFormData(form, { imageFile, key } = {}) {
  const fd = new FormData();
  if (key) fd.append("key", key);

  [
    "label_ar",
    "label_en",
    "alt_ar",
    "alt_en",
    "meta_title_ar",
    "meta_title_en",
    "meta_description_ar",
    "meta_description_en",
  ].forEach((field) => fd.append(field, (form[field] ?? "").trim()));

  const staticPath = (form.static_path ?? "").trim();
  if (staticPath) fd.append("static_path", staticPath);

  const sortOrder = String(form.sort_order ?? "").trim();
  if (sortOrder !== "") fd.append("sort_order", sortOrder);

  fd.append("is_active", form.is_active ? "1" : "0");

  if (imageFile instanceof File) fd.append("image", imageFile);

  return fd;
}
