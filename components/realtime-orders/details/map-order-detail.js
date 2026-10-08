import { getInstrumentTypeLabel } from "@/src/lib/instrument-types";
import { getContractTypeLabel } from "@/src/lib/contract-period-utils";
import { getOrderClientPhone } from "@/components/orders/messages/order-section-message-utils";
import { formatSaudiMobileDisplay, toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { fileNameFromUrl, resolveImageUrl, resolveNationalAddress } from "./national-address-utils";
import { normalizeApiInvoice } from "@/src/lib/invoice-lines";
import { isPaymentNeedsReview } from "@/src/lib/payment-status";

function pick(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    return value;
  }
  return null;
}

function isPaidValue(value) {
  return value === true || value === 1 || value === "1" || value === "paid";
}

const SUCCESS_PAYMENT_STATUSES = new Set(["success", "succeeded", "paid", "captured"]);

/**
 * المبلغ المدفوع فعلياً من سجل الدفعات (الناجحة فقط).
 * null عندما لا يرسل الخادم السجل (فنعتمد `amount_payment` كما هو).
 * سبب ذلك: طلب `is_completed` بدفعة وحيدة فاشلة كان يُعرض «مدفوع 895».
 */
export function successfulPaymentsTotal(orderData = {}) {
  const list = orderData?.payment_and_admin?.contract_payments;
  if (!Array.isArray(list)) return null;
  return list
    .filter((payment) => SUCCESS_PAYMENT_STATUSES.has(String(payment?.status ?? "").toLowerCase()))
    .reduce((sum, payment) => sum + toAmount(payment?.amount), 0);
}

/** دفعات «مراجعة:» المعلّقة (مبلغ لا يطابق المستحق) — تُعرض للمراجعة ولا تُحسب دفعاً. */
export function reviewPayments(orderData = {}) {
  const list = orderData?.payment_and_admin?.contract_payments;
  return Array.isArray(list) ? list.filter(isPaymentNeedsReview) : [];
}

function paidAmountFields(summary, orderData, paid) {
  const apiAmount = pick(summary.amount_payment, orderData.amount_payment);
  const review = reviewPayments(orderData);
  const reviewFields = {
    payment_review_count: review.length,
    payment_review_amount: review.reduce((sum, p) => sum + toAmount(p?.amount), 0),
  };
  const successfulTotal = successfulPaymentsTotal(orderData);
  if (successfulTotal == null) return { fees: apiAmount, fees_paid: paid, ...reviewFields };
  if (successfulTotal > 0) {
    return { fees: Math.round(successfulTotal * 100) / 100, fees_paid: true, ...reviewFields };
  }
  if (review.length) return { fees: "بحاجة لمراجعة", fees_paid: false, ...reviewFields };
  return { fees: paid ? "لا توجد دفعة ناجحة مسجّلة" : "لم يتم الدفع", fees_paid: false, ...reviewFields };
}

/** user.contact_mobile (زائر) ثم user.mobile — بدون الرجوع لجوال المالك/المستأجر. */
export function customerWhatsapp(orderData = {}) {
  const user = orderData?.user ?? {};
  return pick(user.contact_mobile, user.mobile, orderData.user_contact_mobile) || "";
}

function isCompanyEntity(value) {
  return value === "company" || value === "institution" || value === "org";
}

function tenantEntityLabel(value) {
  if (value === "person") return "فرد";
  if (isCompanyEntity(value)) return "مؤسسة أو شركة";
  return value || "مستأجر";
}

/** Extract a readable name from a relation summary (object) or a plain value. */
function relationName(value) {
  if (value == null) return null;
  if (typeof value === "object") {
    return value.name ?? value.name_ar ?? value.name_en ?? value.title ?? null;
  }
  return value;
}

function durationLabel(step4 = {}, orderData = {}) {
  const years = pick(step4.duration_years, orderData.duration_years);
  const months = pick(step4.duration_months, orderData.duration_months);
  if (years && months) return `${years} سنة / ${months} شهر`;
  if (years) return `${years} سنة`;
  if (months) return `${months} شهر`;

  const term = pick(step4.contract_term_in_years, orderData.contract_term_in_years);
  if (term) {
    if (typeof term === "string") return term;
    const period = relationName(term) ?? term.period ?? term.years;
    if (period) return typeof period === "number" ? `${period} سنة` : period;
  }

  const totalMonths = pick(step4.total_months, orderData.total_months);
  if (totalMonths) return `${totalMonths} شهر`;

  return pick(step4.duration_preset, orderData.duration_preset);
}

function toAmount(value) {
  const amount = Number(typeof value === "string" ? value.replace(/,/g, "").trim() : value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * العداد المشترك: مبلغ شهري يدفعه المستأجر × مدة العقد — بند من بنود العقد
 * (يُعرض فقط ولا يدخل في إجمالي رسومنا). يُحسب من الوحدات عندما تكون ملكية
 * العداد `shared` ومعها رسم شهري، باستخدام `total_months` من الخطوة 4.
 */
function buildSharedMeters(units = [], step4 = {}, orderData = {}) {
  const months = Number(pick(step4.total_months, orderData.total_months)) || 0;
  const sums = { electricity: 0, water: 0 };

  for (const unit of units) {
    if (!unit || typeof unit !== "object") continue;
    if (unit.electricity_meter_ownership === "shared") {
      sums.electricity += toAmount(unit.electricity_shared_monthly_fee);
    }
    if (unit.water_meter_ownership === "shared") {
      sums.water += toAmount(unit.water_shared_monthly_fee);
    }
  }

  const line = (monthly) =>
    monthly > 0 ? { monthly, months, total: Math.round(monthly * months * 100) / 100 } : null;

  const electricity = line(sums.electricity);
  const water = line(sums.water);
  if (!electricity && !water) return null;

  return {
    electricity,
    water,
    total: (electricity?.total ?? 0) + (water?.total ?? 0),
  };
}

const SPECIAL_DOC_DEFS = [
  // Deceased owner (وريث/متوفى)
  { key: "Image_inheritance_certificate", label: "صك حصر الإرث" },
  { key: "copy_power_of_attorney_from_heirs_to_agent", label: "وكالة الورثة للوكيل" },
  // Waqf (وقف)
  { key: "copy_of_the_endowment_registration_certificate", label: "شهادة تسجيل الوقف" },
  { key: "copy_of_the_trusteeship_deed", label: "صك النظارة" },
  { key: "copy_of_guardians_power_of_attorney_for_agent", label: "وكالة النظّار للوكيل" },
];

function receiverFromActivities(orderData = {}) {
  const list = Array.isArray(orderData.activities) ? orderData.activities : [];
  const hit = [...list]
    .reverse()
    .find((a) => ["stage_received", "received", "assigned"].includes(a?.action) && a?.actor_type === "employee");
  if (hit?.actor_name) return hit.actor_name;
  const assigned = [...list].reverse().find((a) => a?.action === "assigned");
  return assigned?.after?.employee_name ?? null;
}

function buildSpecialDocs(summary = {}, orderData = {}) {
  return SPECIAL_DOC_DEFS.map(({ key, label }) => {
    const url = resolveImageUrl(pick(summary[key], orderData[key]));
    if (!url) return null;
    return { key, label, url, file_name: fileNameFromUrl(url) };
  }).filter(Boolean);
}

function normalizeConditionsList(list, legacy) {
  if (Array.isArray(list) && list.length) {
    return list.map((item) => (item == null ? "" : String(item).trim())).filter(Boolean);
  }
  if (legacy != null && String(legacy).trim() !== "") return [String(legacy).trim()];
  return [];
}

/** Contract terms stored by step 6 (Guarantee / deposit / daily fine / conditions). */
function buildTerms(step4 = {}, orderData = {}) {
  const conditions = normalizeConditionsList(
    pick(step4.other_conditions_list, orderData.other_conditions_list),
    pick(step4.other_conditions, orderData.other_conditions)
  );
  const additionalTerms = pick(step4.text_additional_terms, orderData.text_additional_terms);
  const guarantee = pick(step4.Guarantee_amount, orderData.Guarantee_amount);
  const deposit = pick(step4.deposit, orderData.deposit);
  const dailyFine = pick(step4.daily_fine, orderData.daily_fine);

  return {
    guarantee,
    deposit,
    daily_fine: dailyFine,
    conditions,
    additional_terms: additionalTerms,
    has_any:
      guarantee != null ||
      deposit != null ||
      dailyFine != null ||
      conditions.length > 0 ||
      additionalTerms != null,
  };
}

/**
 * Shape GET /admin/orders/:id into the realtime detail header/groups view.
 */
export function mapOrderDetailView(orderData = {}) {
  const summary = orderData.contract_summary ?? {};
  const step1 = orderData.step1 ?? {};
  const step3 = orderData.step3 ?? {};
  const step4 = orderData.step4 ?? {};
  const units = Array.isArray(orderData.units) ? orderData.units : [];

  const contractTypeRaw = pick(
    summary.contract_type_trans,
    orderData.contract_type_trans,
    summary.contract_type,
    orderData.contract_type
  );
  const contractType =
    contractTypeRaw === "housing" || contractTypeRaw === "commercial"
      ? getContractTypeLabel(contractTypeRaw)
      : contractTypeRaw || "—";

  const instrumentRaw = pick(
    summary.instrument_type_trans,
    orderData.instrument_type_trans,
    summary.instrument_type,
    orderData.instrument_type,
    summary.instrument_type_key,
    orderData.instrument_type_key
  );

  const paid = isPaidValue(
    pick(summary.is_paid, orderData.is_paid, summary.payment_status, orderData.payment_status)
  );

  const deedUrl = resolveImageUrl(
    pick(
      summary.image_instrument,
      orderData.image_instrument,
      summary.image_instrument_from_the_front
    )
  );

  return {
    id: orderData.id ?? summary.id,
    uuid: pick(orderData.uuid, summary.uuid, orderData.id),
    contract_type: contractType,
    contract_type_key: pick(summary.contract_type_key, orderData.contract_type_key),
    instrument_type: getInstrumentTypeLabel(instrumentRaw),
    // د22: مفتاح الحالة الثابت لشارة الحالة الموحّدة (tag «تم الدفع» للجديد المدفوع).
    status_key:
      orderData.status_key === "new" && (orderData.is_paid || orderData.is_completed)
        ? "paid"
        : orderData.status_key ?? null,
    status_id: pick(
      summary.contract_status_id,
      orderData.contract_status_id,
      orderData.status?.id
    ),
    status_name: pick(
      summary.contract_status_name,
      orderData.status?.name,
      orderData.contract_status_name,
      "قيد المعالجة"
    ),
    status_color: pick(
      summary.contract_status_color,
      orderData.status?.color,
      orderData.contract_status_color
    ),
    is_paid: paid,
    amount_payment: pick(summary.amount_payment, orderData.amount_payment),
    user_mobile: formatSaudiMobileDisplay(
      pick(getOrderClientPhone(orderData), orderData.user_mobile, summary.user_mobile)
    ),
    user_mobile_dial: toSaudiMobileDialDigits(
      pick(getOrderClientPhone(orderData), orderData.user_mobile, summary.user_mobile)
    ),
    // جوال واتساب الذي كتبه العميل (الزائر) في الموقع — هو رقم التواصل مع صاحب الطلب.
    customer_whatsapp: formatSaudiMobileDisplay(customerWhatsapp(orderData)),
    customer_whatsapp_dial: toSaudiMobileDialDigits(customerWhatsapp(orderData)),
    // الخادم لا يرسل employee_name بعد الاستلام عبر المراحل أحياناً — نأخذه من سجل النشاط.
    employee_name: pick(summary.employee_name, orderData.employee_name, receiverFromActivities(orderData), "—"),
    received_at: pick(orderData.received_at, summary.received_at),
    received_since: pick(orderData.received_since, summary.received_since),
    banner: pick(summary.notes_edits, orderData.notes_edits, summary.client_explanation),
    deed: {
      type_label: getInstrumentTypeLabel(instrumentRaw),
      number: pick(summary.instrument_number, orderData.instrument_number, summary.deed_number),
      owner_id: pick(summary.property_owner_id_num, orderData.property_owner_id_num),
      owner_phone: formatSaudiMobileDisplay(
        pick(summary.property_owner_mobile, orderData.property_owner_mobile)
      ),
      owner_name: pick(summary.name_owner, orderData.name_owner),
      // Owner-by-agency (وكالة) fields
      agent_id: pick(
        summary.id_num_of_property_owner_agent,
        orderData.id_num_of_property_owner_agent
      ),
      agent_phone: formatSaudiMobileDisplay(
        pick(summary.mobile_of_property_owner_agent, orderData.mobile_of_property_owner_agent)
      ),
      agency_number: pick(
        summary.agency_number_in_instrument_of_property_owner,
        orderData.agency_number_in_instrument_of_property_owner
      ),
      agency_date: pick(
        summary.agency_instrument_date_of_property_owner,
        orderData.agency_instrument_date_of_property_owner
      ),
      agency_doc_url: resolveImageUrl(
        pick(
          summary.copy_of_the_authorization_or_agency,
          orderData.copy_of_the_authorization_or_agency
        )
      ),
      is_deceased: isPaidValue(
        pick(summary.property_owner_is_deceased, orderData.property_owner_is_deceased)
      ),
      special_docs: buildSpecialDocs(summary, orderData),
      file_url: deedUrl,
      file_name: fileNameFromUrl(deedUrl),
      images: [
        resolveImageUrl(pick(summary.image_instrument, orderData.image_instrument)),
        resolveImageUrl(
          pick(summary.image_instrument_from_the_front, orderData.image_instrument_from_the_front)
        ),
        resolveImageUrl(
          pick(summary.image_instrument_from_the_back, orderData.image_instrument_from_the_back)
        ),
      ].filter(Boolean),
    },
    national_address: resolveNationalAddress(orderData),
    tenant: {
      entity: pick(step3.tenant_entity, orderData.tenant_entity),
      is_company: isCompanyEntity(pick(step3.tenant_entity, orderData.tenant_entity)),
      type_label: tenantEntityLabel(pick(step3.tenant_entity, orderData.tenant_entity)),
      id_num: pick(step3.tenant_id_num, orderData.tenant_id_num),
      phone: formatSaudiMobileDisplay(pick(step3.tenant_mobile, orderData.tenant_mobile)),
      // Organization (مؤسسة/شركة) fields
      registry_number: pick(
        step3.tenant_entity_unified_registry_number,
        orderData.tenant_entity_unified_registry_number
      ),
      region: relationName(
        pick(
          orderData.tenant_entity_region,
          orderData.relation_labels?.tenant_entity_region,
          step3.tenant_entity_region
        )
      ),
      city: relationName(
        pick(
          orderData.tenant_entity_city,
          orderData.relation_labels?.tenant_entity_city,
          step3.tenant_entity_city
        )
      ),
    },
    financial: {
      paid,
      payment_method: pick(step4.payment_type_name, orderData.payment_type?.name_ar),
      start_date: pick(step4.contract_starting_date, orderData.contract_starting_date),
      duration: durationLabel(step4, orderData),
      frequency: pick(step4.payment_type_name, orderData.payment_type?.name_trans),
      rent: pick(
        step4.annual_rent_amount_for_the_unit,
        orderData.annual_rent_amount_for_the_unit,
        relationName(step4.contract_term_in_years) && step4.contract_term_in_years?.price
      ),
      // Documentation fee money block (fee + VAT = total), NOT the rent.
      // Source: `total_price` = { fee, vat, vat_label, total_price } (single pricing source).
      doc_fee_base: pick(orderData.total_price?.fee, orderData.total_price?.details?.documentation_fee),
      doc_fee_vat: orderData.total_price?.vat,
      doc_fee_vat_label: pick(orderData.total_price?.vat_label, orderData.total_price?.details?.vat_label),
      doc_fee: pick(orderData.total_price?.total_price, orderData.total_price?.fee),
      // رسوم المستندات الإضافية (أنواع صكوك محددة) — تُعرض فقط عندما تكون > 0.
      document_surcharge: toAmount(
        pick(orderData.total_price?.document_surcharge, orderData.total_price?.details?.document_surcharge)
      ),
      // رسوم نقل العدادات باسم المستأجر (ضمن الإجمالي).
      meter_fees_total: toAmount(orderData.total_price?.details?.meter_fees_total),
      // العداد المشترك (بند عقد — ليس ضمن رسومنا).
      shared_meters: buildSharedMeters(units, step4, orderData),
      // Amount actually paid to the platform for documentation (number when paid,
      // otherwise the API sends a label such as "لم يتم الدفع"). When the payment
      // log is present, only successful payments count (a failed attempt is not "paid").
      ...paidAmountFields(summary, orderData, paid),
    },
    terms: buildTerms(step4, orderData),
    units: units.map((unit, index) => ({
      id: unit.id ?? index,
      title:
        unit.unit_number != null && unit.unit_number !== ""
          ? `الوحدة ${unit.unit_number}`
          : `الوحدة ${index + 1}`,
      badge: pick(unit.unit_type_name, unit.unit_type, unit.badge),
      number: unit.unit_number,
      type: pick(unit.unit_type_name, unit.unit_type),
      use: pick(unit.unit_usage_name, unit.unit_usage),
      floor: unit.floor_number,
      area: unit.unit_area != null ? `${unit.unit_area} م²` : null,
      rooms: pick(unit.number_of_rooms, unit.tootal_rooms),
      bathrooms: pick(unit.The_number_of_toilets, unit.The_number_of_the_toilet),
      kitchens: unit.The_number_of_kitchens,
      ac:
        unit.split_ac || unit.window_ac
          ? [unit.split_ac ? "سبليت" : null, unit.window_ac ? "شباك" : null]
              .filter(Boolean)
              .join(" / ")
          : null,
      furnished: unit.furnished === true || unit.furnished === 1 ? "نعم" : unit.furnished === false || unit.furnished === 0 ? "لا" : unit.furnished,
    })),
    units_count: orderData.units_count ?? units.length,
    // فاتورة الطلب من الخادم (ف1): البنود والمجاميع من ContractPricing — null قبل الدفع.
    invoice: normalizeApiInvoice(orderData.invoice),
  };
}
