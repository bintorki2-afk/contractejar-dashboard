export const INSTRUMENT_TYPE_OWNER_ENDOWMENT = "property_ownership_owner_is_endowment";

export const INSTRUMENT_TYPES = [
  "electronic",
  "old_handwritten",
  "strong_argument",
  "electronic_tax_register",
  "property_ownership_owner_are_deceased_endowment",
  INSTRUMENT_TYPE_OWNER_ENDOWMENT,
  "sale_agreement",
  "electronic_deed_from_the_ministry_of_justice",
  "economic_cities_authority_suspended",
  "sublease_agreement",
  "lease_renewal",
  "property_ownership_owner_are_suspended",
  "property_ownership_owner_are_deceased",
];

const INSTRUMENT_TYPE_LABELS = {
  electronic: "صك إلكتروني",
  old_handwritten: "صك ورقي صادر من وزارة العدل",
  strong_argument: "حجة إستحكام",
  // QA ORDERS-COM-5 / WEB-29: المفتاح يُخزَّن لاختيار العميل «صك ملكية الكتروني من السجل العقاري» (ليس سجلاً ضريبياً).
  electronic_tax_register: "صك ملكية إلكتروني من السجل العقاري",
  property_ownership_owner_are_deceased_endowment: "وقف ورثة متوفين",
  [INSTRUMENT_TYPE_OWNER_ENDOWMENT]: "صك ملكية والمالك وقف",
  sale_agreement: "ورقة مبايعة مختومة من مكتب عقاري",
  electronic_deed_from_the_ministry_of_justice:
    "صك إلكتروني صادر من وزارة العدل و السجل العيني",
  economic_cities_authority_suspended: "هيئة المدن الاقتصادية - معلق",
  sublease_agreement: "عقد إيجار من الباطن",
  lease_renewal: "تجديد إيجار",
  property_ownership_owner_are_suspended: "ملكية عقار - معلق",
  property_ownership_owner_are_deceased: "ملكية عقار - متوفى",
};

export function getInstrumentTypeLabel(type) {
  if (!type) return "—";
  return INSTRUMENT_TYPE_LABELS[type] || type;
}

export function getInstrumentTypeOptions() {
  return INSTRUMENT_TYPES.map((value) => ({
    value,
    label: getInstrumentTypeLabel(value),
  }));
}

const SUBLEASE_LABELS = new Set([
  "اتفاقية إعارة من الباطن",
  "عقد إيجار من الباطن",
  INSTRUMENT_TYPE_LABELS.sublease_agreement,
]);

/** True when instrument is sublease / إعارة من الباطن. */
export function isSubleaseInstrument(orderData) {
  const summary = orderData?.contract_summary ?? {};
  const candidates = [
    orderData?.instrument_type_key,
    summary.instrument_type_key,
    orderData?.instrument_type,
    summary.instrument_type,
    orderData?.instrument_type_trans,
    summary.instrument_type_trans,
  ]
    .filter((value) => value != null && value !== "")
    .map((value) => String(value).trim());

  return candidates.some((value) => {
    if (value === "sublease_agreement") return true;
    if (SUBLEASE_LABELS.has(value)) return true;
    return value.includes("إعارة من الباطن") || value.includes("إيجار من الباطن");
  });
}
