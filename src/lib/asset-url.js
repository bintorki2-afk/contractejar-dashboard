// روابط ملفات الخادم (صور الموظفين/المستخدمين ...).
// الخادم يبني الرابط بـ url() من الطلب، والطلب يصله عبر بروكسي /api في اللوحة
// (X-Forwarded-Host = دومين اللوحة) فيرجع الرابط على دومين اللوحة ويظهر مكسوراً.
// الحل: أي مسار /storage/... يُعاد بناؤه على أصل الخادم (نفس قاعدة API_PROXY_TARGET).

export const DEFAULT_AVATAR = "/images/defaultUser.jpg";

const originOf = (value) => {
  if (!value) return "";
  try {
    return new URL(String(value)).origin;
  } catch {
    return "";
  }
};

/** أصل الخادم: BACKEND_ASSET_ORIGIN (من next.config عن API_PROXY_TARGET) ثم NEXT_PUBLIC_BASE_URL. */
export function getBackendOrigin() {
  return originOf(process.env.BACKEND_ASSET_ORIGIN) || originOf(process.env.NEXT_PUBLIC_BASE_URL);
}

const isStoragePath = (path) => /^\/?storage\//i.test(path);

/**
 * يرجّع رابطاً صالحاً لملف من الخادم أو null.
 * - data:/blob: وروابط خارجية تبقى كما هي.
 * - مسار نسبي storage/... أو اسم ملف مجرد → على أصل الخادم.
 * - رابط مطلق /storage/... على دومين اللوحة (أو localhost) → على أصل الخادم.
 * - مسارات محلية مثل /images/... تبقى للوحة.
 */
export function resolveBackendAssetUrl(src, { backendOrigin = getBackendOrigin(), currentOrigin } = {}) {
  if (src == null) return null;
  const value = String(src).trim();
  if (!value || value === "null" || value === "undefined") return null;
  if (/^(data|blob):/i.test(value)) return value;

  const here =
    currentOrigin ?? (typeof window !== "undefined" ? window.location.origin : "");

  if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
    let url;
    try {
      url = new URL(value, here || "http://localhost");
    } catch {
      return null;
    }
    if (!backendOrigin || url.origin === backendOrigin || !isStoragePath(url.pathname)) return url.href;
    const pointsAtDashboard =
      (here && url.origin === here) || /^(localhost|127\.0\.0\.1)$/i.test(url.hostname);
    return pointsAtDashboard ? `${backendOrigin}${url.pathname}${url.search}` : url.href;
  }

  if (value.startsWith("/") && !isStoragePath(value)) return value; // ملف محلي في public/
  if (!backendOrigin) return value.startsWith("/") ? value : `/${value}`;

  const path = value.replace(/^\/+/, "");
  return `${backendOrigin}/${isStoragePath(path) ? path : `storage/${path}`}`;
}
