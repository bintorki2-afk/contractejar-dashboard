/**
 * عرض تفاصيل الطلب بترتيب إدخال منصة إيجار (دفعة هـ — E1):
 *   ١ المؤجر · ٢ العقار والعنوان · ٣ الوحدة · ٤ المستأجر · ٥ المالية · ٦ الشروط الإضافية
 * يحوّل `GET /admin/orders/{id}` إلى خلايا مدمجة { key, label, value, copy?, big?, icon?, editKey? }.
 * الحقول الفارغة لا تُعرض. الأسماء (مالك/مستأجر) لا تُجمع من الموقع/التطبيق ولا تُعرض — إيجار يجلبها بالهوية.
 */

import { formatCalendarDate } from "@/components/realtime-orders/details/map-order-detail";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { getInstrumentTypeLabel } from "@/src/lib/instrument-types";

export const EJAR_SECTIONS = [
  { key: "lessor", number: "١", title: "المؤجر", requestSection: "lessor" },
  { key: "property", number: "٢", title: "العقار والعنوان", requestSection: "property" },
  { key: "unit", number: "٣", title: "الوحدة", requestSection: null },
  { key: "tenant", number: "٤", title: "المستأجر", requestSection: "tenant" },
  { key: "financial", number: "٥", title: "المالية", requestSection: null },
  { key: "conditions", number: "٦", title: "الشروط الإضافية", requestSection: null },
];

export const ADDRESS_MODE_LABELS = { manual: "إدخال يدوي", map: "من الخريطة", image: "مرفق كصورة", none: "غير مطلوب" };

function pick(...values) {
  for (const v of values) {
    if (v == null || v === "") continue;
    return v;
  }
  return null;
}

function truthy(v) {
  return v === true || v === 1 || v === "1" || v === "true";
}

/** null للقيم الصفرية/الفارغة (0 / "0" / "0.00"). */
function nonZero(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n === 0 ? null : v;
}

function digits(v) {
  return String(v ?? "").replace(/\D/g, "");
}

/** رقم بتنسيق 1,234 (لاتيني). */
export function formatNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(typeof value === "string" ? value.replace(/,/g, "").trim() : value);
  if (!Number.isFinite(n)) return value == null ? null : String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** «١٢/٠٣/١٤٤٤ هـ · ٢٠٢٢-١٠-٠٨ م» عندما يتوفر التاريخان، وإلا المتوفر فقط. */
export function dualDate(value, type, gregorian) {
  const primary = formatCalendarDate(value, type);
  if (!primary) return gregorian ? formatCalendarDate(gregorian, "gregorian") : null;
  const isHijri = /هـ$/.test(primary);
  const secondary = isHijri && gregorian ? formatCalendarDate(gregorian, "gregorian") : null;
  return secondary && secondary !== primary ? `${primary} · ${secondary}` : primary;
}

/** «سنة» / «سنتان» / «N سنوات» / «N شهر» / «سنة و N أشهر». */
export function durationLabel(months) {
  const m = Number(months) || 0;
  if (m <= 0) return null;
  const years = Math.floor(m / 12);
  const rest = m % 12;
  const y = years === 1 ? "سنة" : years === 2 ? "سنتان" : years >= 3 && years <= 10 ? `${years} سنوات` : years > 10 ? `${years} سنة` : "";
  const r = rest === 1 ? "شهر" : rest === 2 ? "شهران" : rest >= 3 && rest <= 10 ? `${rest} أشهر` : rest > 10 ? `${rest} شهراً` : "";
  if (y && r) return `${y} و ${r}`;
  return y || r;
}

const TENANT_ENTITY_LABELS = { person: "فرد", company: "مؤسسة أو شركة", institution: "مؤسسة أو شركة", org: "مؤسسة أو شركة" };
const AUTHORIZATION_LABELS = {
  owner_and_representative_of_record: "مالك السجل وممثله",
  agent_or_delegate: "وكيل أو مفوض عن مالك السجل",
};

function cell(key, label, value, extra = {}) {
  if (value == null || value === "" || value === "—") return null;
  const { raw, ...rest } = extra;
  return {
    key,
    label,
    value: String(value),
    copy: extra.copy !== false,
    copyValue: raw != null && raw !== "" ? String(raw) : String(value),
    ...rest,
  };
}

function compact(cells) {
  return cells.filter(Boolean);
}

export function lessorSection(order = {}) {
  const s = order.contract_summary ?? {};
  const doc = order.document ?? {};
  const typeKey = pick(doc.type_key, order.instrument_type_key, s.instrument_type_key);
  const isEndowment = /endowment/.test(String(typeKey ?? ""));
  const isDeceased = /deceased/.test(String(typeKey ?? ""));
  const hasAgent = truthy(pick(order.add_legal_agent_of_owner, s.add_legal_agent_of_owner)) || Boolean(pick(order.id_num_of_property_owner_agent, s.id_num_of_property_owner_agent));
  const subtitle = isEndowment ? "الوقف يمثّله الناظر" : isDeceased ? "ورثة مالك متوفى — يمثّلهم الوكيل" : hasAgent ? "المالك يمثّله وكيل" : null;

  const rows = [
    compact([
      cell("owner_id", isEndowment ? "هوية الناظر" : "الهوية", pick(order.property_owner_id_num, s.property_owner_id_num), { big: true, editKey: "property_owner_id_num" }),
      cell("owner_dob", "تاريخ الميلاد", dualDate(pick(order.property_owner_dob, s.property_owner_dob), pick(order.type_dob_property_owner, s.type_dob_property_owner), order.property_owner_dob_gregorian)),
      cell("owner_mobile", "الجوال", formatSaudiMobileDisplay(pick(order.property_owner_mobile, s.property_owner_mobile)), { big: true, editKey: "property_owner_mobile" }),
      cell("owner_iban", "الآيبان", pick(order.property_owner_iban, s.property_owner_iban), { big: true, ltr: true }),
    ]),
  ];
  if (hasAgent) {
    rows.push(
      compact([
        cell("agent_id", "هوية الوكيل", pick(order.id_num_of_property_owner_agent, s.id_num_of_property_owner_agent), { big: true }),
        cell("agent_dob", "ميلاد الوكيل", dualDate(pick(order.dob_of_property_owner_agent, s.dob_of_property_owner_agent, order.dob_hijri_of_property_owner_agent), pick(order.type_dob_property_owner_agent, s.type_dob_property_owner_agent), order.dob_gregorian_of_property_owner_agent)),
        cell("agent_mobile", "جوال الوكيل", formatSaudiMobileDisplay(pick(order.mobile_of_property_owner_agent, s.mobile_of_property_owner_agent)), { big: true }),
        cell("agency_number", "رقم الوكالة", pick(order.agency_number_in_instrument_of_property_owner, s.agency_number_in_instrument_of_property_owner), { big: true }),
        cell("agency_date", "تاريخ الوكالة", formatCalendarDate(pick(order.agency_instrument_date_of_property_owner, s.agency_instrument_date_of_property_owner), pick(order.type_agency_instrument_date_of_property_owner, s.type_agency_instrument_date_of_property_owner))),
        cell("agent_iban", "آيبان الوكيل", pick(order.agent_iban_of_property_owner, s.agent_iban_of_property_owner), { big: true, ltr: true }),
      ])
    );
  }
  return {
    headerLabel: "نوع المستند",
    headerValue: pick(doc.type_label, getInstrumentTypeLabel(typeKey), order.instrument_type_label),
    subtitle,
    rows: rows.filter((r) => r.length),
  };
}

export function propertySection(order = {}) {
  const s = order.contract_summary ?? {};
  const doc = order.document ?? {};
  const typeKey = pick(doc.type_key, order.instrument_type_key, s.instrument_type_key);
  const deedDate = doc.deed_date_hijri
    ? dualDate(doc.deed_date_hijri, "hijri", doc.deed_date_gregorian)
    : dualDate(pick(order.instrument_history, s.instrument_history), pick(order.type_instrument_history, s.type_instrument_history), doc.deed_date_gregorian);
  const docRow = compact([
    cell("document_type", "نوع المستند", pick(doc.type_label, getInstrumentTypeLabel(typeKey)), { copy: false }),
    cell("deed_number", "رقم الصك", pick(doc.deed_number, order.instrument_number, s.instrument_number), { big: true, editKey: "instrument_number" }),
    cell("deed_date", "تاريخه", deedDate),
    cell("registry_number", "رقم السجل العقاري", pick(doc.registry_number, order.real_estate_registry_number, s.real_estate_registry_number), { big: true }),
  ]);
  const step1 = order.step1 ?? {};
  const propertyRow = compact([
    cell("property_type", "نوع العقار", pick(order.property_type_name, step1.property_type_name), { copy: false }),
    cell("property_usage", "الاستخدام", pick(order.property_usages_name, step1.property_usages_name), { copy: false }),
    cell("floors", "عدد الأدوار", pick(order.number_of_floors, step1.number_of_floors)),
    cell("units_in_realestate", "وحدات العقار", pick(order.number_of_units_in_realestate, step1.number_of_units_in_realestate)),
    cell("property_name", "اسم العقار", pick(order.name_real_estate, s.name_real_estate)),
  ]);

  const a = order.address ?? {};
  const hasAnyAddress = [a.region, a.city, a.district, a.street, a.building_no, a.additional_no, a.postal_code, a.map_url, a.image_url, a.image_key, a.lat].some(
    (v) => v != null && v !== ""
  );
  // QA ORDERS-RES-6: بلا أي بيانات عنوان (مثل «عقد إيجار من الباطن») لا نفترض «إدخال يدوي».
  const mode = hasAnyAddress ? order.address_entry_mode ?? (a.map_url ? "map" : a.image_url ? "image" : "manual") : "none";
  // QA DASH-4: حقول العنوان الوطني التفصيلية تُعرض في كل الأوضاع متى أرسلها الخادم (الموظف يحتاجها لإيجار).
  const detailRows = () =>
    [
      compact([
        cell("district", "الحي", a.district, { editKey: "neighborhood" }),
        cell("street", "اسم الشارع", a.street, { editKey: "street" }),
      ]),
      compact([
        cell("building_no", "رقم المبنى", a.building_no, { big: true, editKey: "building_number" }),
        cell("additional_no", "الرقم الإضافي", a.additional_no, { big: true, editKey: "extra_figure" }),
        cell("postal_code", "الرمز البريدي", a.postal_code, { big: true, editKey: "postal_code" }),
      ]),
    ].filter((r) => r.length);
  let addressRows = [];
  let addressNote = null;
  if (mode === "none") {
    addressNote = "لا يوجد عنوان وطني لهذا الطلب (نوع المستند لا يتطلب عنواناً أو لم يُدخله العميل).";
  } else if (mode === "manual") {
    const [first = [], ...rest] = detailRows();
    addressRows = [compact([cell("region", "المنطقة", a.region, { editKey: null }), cell("city", "المدينة", a.city), ...first]), ...rest].filter((r) => r.length);
  } else if (mode === "map") {
    const coords = a.lat != null && a.lng != null ? `${a.lat}, ${a.lng}` : null;
    addressRows = [
      compact([
        cell("region", "المنطقة", a.region),
        cell("city", "المدينة", a.city),
        cell("map_url", "قوقل ماب", a.map_url, { link: a.map_url, linkLabel: "فتح الموقع على الخريطة ↗" }),
        cell("coords", "الإحداثيات", coords, { ltr: true }),
      ]),
      ...detailRows(),
    ].filter((r) => r.length);
  } else {
    addressRows = [compact([cell("region", "المنطقة", a.region), cell("city", "المدينة", a.city)]), ...detailRows()].filter((r) => r.length);
    addressNote = "العميل أرفق العنوان كصورة — تلقاها في قسم المرفقات (تبويب «العنوان الوطني»).";
  }
  return {
    docRow,
    propertyRow,
    addressMode: mode,
    addressModeLabel: ADDRESS_MODE_LABELS[mode] ?? mode,
    addressRows,
    addressNote,
    imageKey: a.image_key ?? null,
  };
}

const UNIT_ICON_TONES = {
  unit_number: { bg: "#E3F3EA", fg: "#1F5A3C" },
  unit_type: { bg: "#EEF2FF", fg: "#3B4FA0" },
  floor_number: { bg: "#F3E8FF", fg: "#6B3FA0" },
  unit_area: { bg: "#FFF3E0", fg: "#B25E00" },
  rooms: { bg: "#E8F1FF", fg: "#1B5FB4" },
  halls: { bg: "#FDF2F8", fg: "#9D174D" },
  baths: { bg: "#E0F7FA", fg: "#00798C" },
  kitchens: { bg: "#FDE8E6", fg: "#B42318" },
  ac: { bg: "#E6F4FF", fg: "#0B6BCB" },
  furnished: { bg: "#FFFFFF", fg: "#1F5A3C" },
  kitchen_cabinets: { bg: "#F5F3FF", fg: "#5B35C9" },
  electricity_meter: { bg: "#FFF8E1", fg: "#B26A00" },
  water_meter: { bg: "#E0F2FE", fg: "#0369A1" },
  parking: { bg: "#F0F4F2", fg: "#4B5753" },
};

const DEFAULT_UNIT_ORDER = ["unit_number", "unit_type", "floor_number", "unit_area", "rooms", "halls", "baths", "kitchens", "ac", "furnished", "kitchen_cabinets", "electricity_meter", "water_meter", "parking"];
const DEFAULT_UNIT_LABELS = {
  unit_number: "رقم الوحدة",
  unit_type: "النوع",
  floor_number: "الدور",
  unit_area: "المساحة",
  rooms: "الغرف",
  halls: "الصالات",
  baths: "دورات المياه",
  kitchens: "المطابخ",
  ac: "التكييف",
  furnished: "مؤثثة",
  kitchen_cabinets: "خزائن مطبخ",
  electricity_meter: "عداد الكهرباء",
  water_meter: "عداد المياه",
  parking: "مواقف",
};

/**
 * QA ORDERS-RES-7: نوع التأثيث (جديد/مستعمل). الموقع يرسل `type_furnished` = true (جديد) / false (مستعمل)
 * فيُخزَّن "1"/"0"؛ وقد يرسل الخادم لاحقاً "new"/"used" أو تسمية جاهزة في `furnished_label`.
 */
export function furnishingTypeLabel(type) {
  if (type === true || type === 1) return "جديد";
  if (type === false || type === 0) return "مستعمل";
  const t = String(type ?? "").trim().toLowerCase();
  if (["1", "true", "new", "جديد"].includes(t)) return "جديد";
  if (["0", "false", "used", "مستعمل"].includes(t)) return "مستعمل";
  return t ? String(type).trim() : null;
}

function furnishedText(unit = {}) {
  const fromLabel = String(unit.furnished_label ?? "")
    .replace(/^نعم\s*—?\s*/, "")
    .replace(/^أثاث\s*/, "")
    .trim();
  const kind = fromLabel || furnishingTypeLabel(unit.type_furnished);
  return kind ? `مؤثثة ✓ · ${kind}` : "مؤثثة ✓";
}

function floorLabel(v) {
  if (v === 0 || v === "0") return "أرضي";
  return v;
}

/** خلايا وحدة واحدة بترتيب معالج الموقع، مع أيقونة ملوّنة لكل حقل. */
export function unitCells(unit = {}) {
  const order = Array.isArray(unit.fields_order) && unit.fields_order.length ? unit.fields_order : DEFAULT_UNIT_ORDER;
  const labels = { ...DEFAULT_UNIT_LABELS, ...(unit.field_labels ?? {}) };
  const meters = Array.isArray(unit.meters) ? unit.meters : [];
  const meter = (kind) => meters.find((m) => m.kind === kind) ?? null;
  const metersFallback = (kind) => {
    const number = unit[`${kind}_meter_number`];
    const ownership = unit[`${kind}_meter_ownership`];
    const fee = unit[`${kind}_shared_monthly_fee`];
    if (!number && !ownership) return null;
    const ownershipLabel = { owner: "باسم المالك", tenant: "باسم المستأجر", shared: "مشترك" }[ownership] ?? ownership;
    return { number, ownership, ownership_label: ownershipLabel, shared: ownership === "shared", monthly_amount: fee, summary: ownership === "shared" && fee ? `مشترك · ${formatNumber(fee)} ر.س/شهر` : ownershipLabel };
  };
  const values = {
    unit_number: () => cell("unit_number", labels.unit_number, unit.unit_number, { big: true }),
    unit_type: () => {
      const type = pick(unit.unit_type_name, unit.unit_type);
      const usage = pick(unit.unit_usage_name, unit.unit_usage?.name);
      return cell("unit_type", labels.unit_type, [type, usage].filter(Boolean).join(" · "), { copy: false });
    },
    floor_number: () => cell("floor_number", labels.floor_number, floorLabel(unit.floor_number), { copy: false }),
    unit_area: () => cell("unit_area", "المساحة", unit.unit_area, { big: true, suffix: "م²" }),
    rooms: () => cell("rooms", labels.rooms, pick(unit.rooms, unit.tootal_rooms, unit.number_of_rooms), { copy: false }),
    halls: () => cell("halls", labels.halls, pick(unit.halls, unit.The_number_of_halls), { copy: false }),
    baths: () => cell("baths", labels.baths, pick(unit.baths, unit.The_number_of_toilets, unit.The_number_of_the_toilet), { copy: false }),
    kitchens: () => cell("kitchens", labels.kitchens, pick(unit.kitchens, unit.The_number_of_kitchens), { copy: false }),
    ac: () => {
      const label = unit.ac_label ?? (unit.split_ac ? `سبليت × ${unit.split_ac}` : unit.window_ac ? `شباك × ${unit.window_ac}` : null);
      return cell("ac", labels.ac, label, { copy: false });
    },
    // مؤثثة تُعرض فقط عندما تكون نعم.
    furnished: () => (truthy(unit.furnished) ? cell("furnished", null, furnishedText(unit), { copy: false, highlight: true }) : null),
    kitchen_cabinets: () => (truthy(unit.kitchen_cabinets) ? cell("kitchen_cabinets", null, "خزائن مطبخ ✓", { copy: false }) : null),
    electricity_meter: () => {
      const m = meter("electricity") ?? metersFallback("electricity");
      if (!m) return null;
      if (m.shared) return cell("electricity_meter", labels.electricity_meter, m.summary ?? "مشترك", { copy: false });
      return cell("electricity_meter", labels.electricity_meter, m.number ?? m.summary, { big: Boolean(m.number), note: m.number ? m.ownership_label : null, copy: Boolean(m.number) });
    },
    water_meter: () => {
      const m = meter("water") ?? metersFallback("water");
      if (!m) return null;
      if (m.shared) return cell("water_meter", labels.water_meter, m.summary ?? "مشترك", { copy: false });
      return cell("water_meter", labels.water_meter, m.number ?? m.summary, { big: Boolean(m.number), note: m.number ? m.ownership_label : null, copy: Boolean(m.number) });
    },
    parking: () => cell("parking", labels.parking, pick(unit.parking, unit.Number_parking_spaces), { copy: false }),
  };
  return order
    .map((key) => {
      const c = values[key]?.();
      if (!c) return null;
      return { ...c, icon: key, tone: UNIT_ICON_TONES[key] ?? UNIT_ICON_TONES.parking };
    })
    .filter(Boolean);
}

export function unitsSection(order = {}) {
  const units = Array.isArray(order.units) ? order.units : [];
  const list = units.map((u, i) => ({
    id: u.id ?? i,
    index: i,
    label: u.unit_number != null && u.unit_number !== "" ? `الوحدة ${u.unit_number}` : `الوحدة ${i + 1}`,
    cells: unitCells(u),
  }));
  const count = Number(order.units_count ?? list.length) || list.length;
  const note =
    count > 1
      ? `يوجد ${count === 2 ? "وحدتان" : `${count} وحدات`} في هذا الطلب — أدخل كل وحدة على حدة في إيجار.`
      : null;
  return { units: list, count, note };
}

export function tenantSection(order = {}) {
  const s = order.step3 ?? {};
  const entity = pick(s.tenant_entity, order.tenant_entity);
  const isCompany = ["company", "institution", "org"].includes(entity);
  const chip = entity ? TENANT_ENTITY_LABELS[entity] ?? entity : "فرد";
  const authorization = pick(s.authorization_type, order.authorization_type);
  const rows = [
    compact([
      cell("tenant_id", isCompany ? "هوية ممثل المنشأة" : "الهوية", pick(s.tenant_id_num, order.tenant_id_num), { big: true, editKey: "tenant_id_num" }),
      cell("tenant_dob", "تاريخ الميلاد", dualDate(pick(s.tenant_dob, order.tenant_dob), pick(s.type_tenant_dob, order.type_tenant_dob), order.tenant_dob_gregorian)),
      cell("tenant_mobile", "الجوال", formatSaudiMobileDisplay(pick(s.tenant_mobile, order.tenant_mobile)), { big: true, editKey: "tenant_mobile" }),
    ]),
  ];
  if (isCompany) {
    rows.push(
      compact([
        cell("registry_number", "رقم السجل الموحد", pick(s.tenant_entity_unified_registry_number, order.tenant_entity_unified_registry_number), { big: true }),
        cell("tenant_region", "منطقة المنشأة", pick(order.tenant_entity_region?.name, order.relation_labels?.tenant_entity_region)),
        cell("tenant_city", "مدينة المنشأة", pick(order.tenant_entity_city?.name, order.relation_labels?.tenant_entity_city)),
        cell("authorization", "صفة الممثل", authorization ? AUTHORIZATION_LABELS[authorization] ?? authorization : null, { copy: false }),
      ])
    );
  }
  const repId = pick(s.id_num_of_property_tenant_agent, order.id_num_of_property_tenant_agent);
  if (repId) {
    rows.push(
      compact([
        cell("rep_id", "هوية الوكيل", repId, { big: true }),
        cell("rep_dob", "ميلاد الوكيل", dualDate(pick(s.dob_of_property_tenant_agent, order.dob_of_property_tenant_agent), pick(s.type_dob_tenant_agent, order.type_dob_tenant_agent), order.dob_gregorian_of_property_tenant_agent)),
        cell("rep_mobile", "جوال الوكيل", formatSaudiMobileDisplay(pick(s.mobile_of_property_tenant_agent, order.mobile_of_property_tenant_agent)), { big: true }),
        cell("rep_agency_number", "رقم الوكالة", pick(order.agency_number_in_instrument_of_property_tenant), { big: true }),
      ])
    );
  }
  return { chip, rows: rows.filter((r) => r.length) };
}

export function financialSection(order = {}) {
  const s4 = order.step4 ?? {};
  const months = Number(pick(order.contract_months, s4.total_months, order.total_months)) || 0;
  const start = pick(s4.contract_starting_date, order.contract_starting_date);
  const startType = pick(s4.type_contract_starting_date, order.type_contract_starting_date);
  const startLabel = startType === "hijri"
    ? dualDate(start, "hijri", order.contract_starting_date_gregorian)
    : formatCalendarDate(order.contract_starting_date_gregorian ?? start, "gregorian");
  const rent = pick(s4.annual_rent_amount_for_the_unit, order.annual_rent_amount_for_the_unit);
  const units = Array.isArray(order.units) ? order.units : [];
  const sharedCells = [];
  for (const kind of ["electricity", "water"]) {
    const shared = units
      .map((u) => (Array.isArray(u.meters) ? u.meters.find((m) => m.kind === kind && m.shared) : u[`${kind}_meter_ownership`] === "shared" ? { monthly_amount: u[`${kind}_shared_monthly_fee`] } : null))
      .filter(Boolean);
    if (!shared.length) continue;
    // QA ORDERS-RES-8: البند الكامل (شهري × أشهر العقد = الإجمالي) من الخادم (`shared_meters`) — الواجهة لا تحسب مبالغ.
    const server = order.shared_meters?.[kind] ?? order.meter_fees?.shared_meters?.[kind] ?? null;
    const monthly = server?.monthly != null ? Number(server.monthly) : shared.reduce((sum, m) => sum + (Number(m.monthly_amount) || 0), 0);
    const sharedText =
      server && Number(server.months) > 0 && server.total != null
        ? `مشترك · ${formatNumber(server.monthly)} ر.س/شهر × ${formatNumber(server.months)} شهراً = ${formatNumber(server.total)} ر.س`
        : monthly > 0
          ? `مشترك · ${formatNumber(monthly)} ر.س/شهر`
          : "مشترك";
    sharedCells.push(
      cell(`${kind}_shared`, kind === "electricity" ? "عداد الكهرباء" : "عداد المياه", sharedText, {
        copy: false,
        icon: `${kind}_meter`,
        tone: UNIT_ICON_TONES[`${kind}_meter`],
      })
    );
  }
  const rows = [
    compact([
      cell("start_date", "بداية العقد", startLabel),
      cell("duration", "مدة العقد", durationLabel(months) ?? pick(order.contract_term_name, s4.contract_term_name), { copy: false }),
      cell("rent", "إجمالي الإيجار السنوي", formatNumber(rent), { big: true, suffix: "ر.س", raw: rent }),
      cell("payments", "الدفعات", pick(s4.payment_type_name, order.payment_type_name, order.payment_type?.name_ar), { copy: false }),
    ]),
    compact([
      // QA ORDERS-RES-19: المبالغ الاختيارية (الضمان/العربون/الغرامة) تُخفى إن كانت صفراً — المعالج لا يحوي حقل عربون أصلاً.
      cell("guarantee", "مبلغ الضمان", formatNumber(nonZero(pick(s4.Guarantee_amount, order.Guarantee_amount))), { big: true, raw: pick(s4.Guarantee_amount, order.Guarantee_amount) }),
      cell("deposit", "العربون", formatNumber(nonZero(pick(s4.deposit, order.deposit))), { big: true, raw: pick(s4.deposit, order.deposit) }),
      cell("daily_fine", "الغرامة اليومية", formatNumber(nonZero(pick(s4.daily_fine, order.daily_fine))), { big: true, raw: pick(s4.daily_fine, order.daily_fine) }),
      ...sharedCells,
    ]),
  ].filter((r) => r.length);
  const typeKey = pick(order.contract_type_key, order.contract_summary?.contract_type_key);
  const typeLabel = typeKey === "housing" ? "سكني" : typeKey === "commercial" ? "تجاري" : pick(order.contract_type_trans, order.contract_type);
  return { contractType: typeLabel, rows };
}

export function conditionsSection(order = {}) {
  const s4 = order.step4 ?? {};
  const list = pick(s4.other_conditions_list, order.other_conditions_list);
  const legacy = pick(s4.other_conditions, order.other_conditions);
  const extra = pick(s4.text_additional_terms, order.text_additional_terms);
  const items = Array.isArray(list) && list.length ? list.map((x) => String(x ?? "").trim()).filter(Boolean) : legacy ? [String(legacy).trim()] : [];
  if (extra && !items.includes(String(extra).trim())) items.push(String(extra).trim());
  const roles = Array.isArray(order.tenant_role_names) ? order.tenant_role_names.filter(Boolean) : [];
  return { items, roles };
}

/** نص «نسخ المجموعة»: سطر لكل خلية «التسمية: القيمة». */
export function groupCopyText(rows = []) {
  return rows
    .flat()
    .filter(Boolean)
    .map((c) => (c.label ? `${c.label}: ${c.copyValue ?? c.value}` : c.value))
    .join("\n");
}

export function buildEjarSections(order = {}) {
  return {
    lessor: lessorSection(order),
    property: propertySection(order),
    unit: unitsSection(order),
    tenant: tenantSection(order),
    financial: financialSection(order),
    conditions: conditionsSection(order),
  };
}
