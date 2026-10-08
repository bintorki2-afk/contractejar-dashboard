import * as schemas from "@/components/orders/single-order/contract-edit/contract-field-schemas";
import { ADDRESS_FIELDS, INSTRUMENT_IMAGE_FIELDS } from "@/components/orders/single-order/frontend-contract-fields";

/**
 * خريطة «مفتاح الحقل ← التسمية العربية» من مخططات حقول الطلب (د6):
 * لا تظهر مفاتيح خام مثل `image_instrument` للموظف في رسائل الخطأ أو السجلات.
 */
const EXTRA_LABELS = {
  image_instrument: "صورة الصك",
  image_instrument_pages: "صفحات صورة الصك",
  contract_status_id: "حالة الطلب",
  ejar_contract_draft_number: "رقم مسودة إيجار",
  ejar_contract_number: "رقم عقد إيجار",
  deed_number: "رقم الصك",
  deed_type: "نوع الصك",
  contact_number: "رقم التواصل",
  contact_number_mode: "رقم التواصل",
  reason: "السبب",
  amount: "المبلغ",
  notes: "الملاحظات",
};

let cache = null;

export function getFieldLabelMap() {
  if (cache) return cache;
  const map = {};
  const add = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((f) => {
      if (f?.key && f?.label && !map[f.key]) map[f.key] = String(f.label);
    });
  };
  Object.values(schemas).forEach(add);
  add(ADDRESS_FIELDS);
  add(INSTRUMENT_IMAGE_FIELDS);
  cache = { ...map, ...EXTRA_LABELS };
  return cache;
}

export function fieldLabel(key) {
  if (!key) return "";
  const base = String(key).split(".")[0];
  return getFieldLabelMap()[base] ?? String(key);
}

/** يستبدل أي مفتاح حقل معروف داخل نص (رسالة تحقق من الخادم) بتسميته العربية. */
export function humanizeFieldKeys(text) {
  if (text == null) return text;
  const map = getFieldLabelMap();
  return String(text).replace(/\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b|\b[a-z]{4,}\b/g, (m) => {
    const label = map[m];
    return label ? `«${label}»` : m.replace(/_/g, " ");
  });
}
