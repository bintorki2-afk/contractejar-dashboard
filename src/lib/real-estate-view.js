import { resolveBackendAssetUrl } from "@/src/lib/asset-url";

/**
 * QA PROPS-9: الخادم يخزّن تاريخ ميلاد المالك في `dob_hijri` أياً كان نوعه، ونوعه في `type_dob_property_owner`.
 * نعرض تاريخاً واحداً بنوعه الصحيح؛ وبلا نوع معروف نُبقي العرض القديم (عمودان).
 */
export function ownerDobCells(data = {}) {
  const type = data?.type_dob_property_owner ?? data?.type_dob ?? null;
  const value = data?.owner_dob || data?.dob_hijri || data?.DOB || data?.property_owner_dob || null;
  if (type === "gregorian") return [{ label: "تاريخ الميلاد (ميلادي)", value: data?.DOB || value }];
  if (type === "hijri") return [{ label: "تاريخ الميلاد (هجري)", value: data?.dob_hijri || value }];
  return [
    { label: "تاريخ الميلاد (ميلادي)", value: data?.DOB },
    { label: "تاريخ الميلاد (هجري)", value: data?.dob_hijri },
  ];
}

const isPdfPath = (value) => /\.pdf(\?|$)/i.test(String(value ?? ""));

/**
 * QA PROPS-7: مرفقات العقار الفعلية. الخادم قد يرسل `attachments[]` ({key,label,url,is_pdf}) — وإلا نقرأ
 * الأعمدة الحقيقية لجدول `real_estates` ثم الأعمدة القديمة.
 */
export function realEstateAttachments(data = {}) {
  if (Array.isArray(data?.attachments) && data.attachments.length) {
    return data.attachments
      .filter((a) => a?.url)
      .map((a) => ({ label: a.label ?? a.key, src: a.url, pdf: Boolean(a.is_pdf) || String(a.mime ?? "").includes("pdf") || isPdfPath(a.url) || isPdfPath(a.path) }));
  }
  const fields = [
    ["image_instrument", "صورة الصك"],
    ["image_instrument_from_the_front", "الصك (الوجه)"],
    ["image_instrument_from_the_back", "الصك (الخلف)"],
    ["copy_of_the_endowment_registration_certificate", "شهادة تسجيل الوقف"],
    ["copy_of_the_trusteeship_deed", "صك النظارة"],
    ["copy_of_the_authorization_or_agency", "الوكالة"],
    ["image_address", "صورة العنوان الوطني"],
    ["old_handwritten_photo", "صورة الصك الورقي"],
    ["photo_of_the_electronic", "صورة الصك الإلكتروني"],
    ["strong_argument_photo", "صورة الحجة القوية"],
  ];
  const seen = new Set();
  return fields
    .map(([key, label]) => {
      const raw = data?.[`${key}_url`] ?? data?.[key];
      const value = typeof raw === "object" && raw ? raw.url ?? raw.path ?? null : raw;
      const src = resolveBackendAssetUrl(value);
      if (!src || seen.has(src)) return null;
      seen.add(src);
      return { label, src, pdf: isPdfPath(value) };
    })
    .filter(Boolean);
}

