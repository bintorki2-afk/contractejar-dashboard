// صور محرّر النصوص (TipTap): لا يوجد في الخادم مسار رفع لصور داخل المقال،
// فتبقى الصورة base64 داخل HTML لكن تُضغط في المتصفح بحيث لا تتجاوز ٣٠٠ ك.ب.

export const EDITOR_IMAGE_MAX_BYTES = 300 * 1024;
export const EDITOR_IMAGE_MAX_SIDE = 1600;

const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
const MIN_SIDE = 320;

/** الحجم الفعلي (بالبايت) لبيانات data:URL بعد فك base64. */
export function dataUrlBytes(dataUrl) {
  if (typeof dataUrl !== "string") return 0;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

/** أبعاد مصغّرة تحافظ على النسبة بحيث لا يتجاوز أطول ضلع maxSide. */
export function fitDimensions(width, height, maxSide = EDITOR_IMAGE_MAX_SIDE) {
  const w = Math.max(1, Math.round(width || 1));
  const h = Math.max(1, Math.round(height || 1));
  const longest = Math.max(w, h);
  if (longest <= maxSide) return { width: w, height: h };
  const scale = maxSide / longest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = src;
  });

/**
 * يحوّل ملف صورة إلى data:URL مضغوط (WebP، أو JPEG إن لم يدعم المتصفح WebP)
 * لا يتجاوز maxBytes. يرمي خطأ برسالة عربية إن تعذّر ذلك.
 */
export async function compressImageFile(file, { maxBytes = EDITOR_IMAGE_MAX_BYTES, maxSide = EDITOR_IMAGE_MAX_SIDE } = {}) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("الملف المختار ليس صورة");
  }

  const original = await readAsDataUrl(file);

  // صور متحركة/متجهة لا تُرسم على canvas بدون فقدان — تُقبل كما هي إن كانت صغيرة.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    if (dataUrlBytes(original) <= maxBytes) return original;
    throw new Error("حجم الصورة كبير (الحد ٣٠٠ ك.ب) — استخدم صورة أصغر");
  }

  const img = await loadImage(original);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (dataUrlBytes(original) <= maxBytes && Math.max(naturalW, naturalH) <= maxSide) return original;

  let { width, height } = fitDimensions(naturalW, naturalH, maxSide);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر ضغط الصورة في هذا المتصفح");

  let best = null;
  while (true) {
    canvas.width = width;
    canvas.height = height;
    // خلفية بيضاء حتى لا تصير الشفافية سوداء في JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", quality);
      const bytes = dataUrlBytes(out);
      if (!best || bytes < best.bytes) best = { out, bytes };
      if (bytes <= maxBytes) return out;
    }

    if (Math.max(width, height) <= MIN_SIDE) break;
    ({ width, height } = fitDimensions(width, height, Math.round(Math.max(width, height) * 0.75)));
  }

  if (best && best.bytes <= maxBytes) return best.out;
  throw new Error("تعذّر ضغط الصورة إلى ٣٠٠ ك.ب — استخدم صورة أصغر");
}
