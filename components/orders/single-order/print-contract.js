import { escapeHtml, printHtmlDocument, safeImageUrl } from "@/src/lib/print";

// Every value here comes from the customer (names, addresses, conditions…) — it
// is HTML-escaped so it prints as text and can never run as markup/script.
const display = (value) => {
  if (value === null || value === undefined || value === "") return "---";
  if (Array.isArray(value)) return escapeHtml(value.filter(Boolean).join("، ")) || "---";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  return escapeHtml(value);
};

const section = (title, rows) => {
  const items = rows
    .map(
      ([label, value]) => `
      <tr>
        <td class="label">${escapeHtml(label)}</td>
        <td class="value">${display(value)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <table>${items}</table>
    </section>
  `;
};

const CONTRACT_PRINT_STYLES = `
    /* margin:0 removes the browser-injected page URL/date footer & header */
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Tahoma, sans-serif;
      margin: 24px;
      color: #111;
      line-height: 1.6;
    }
    .contract-doc + .contract-doc { padding-top: 8px; }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0c6055;
    }
    .header h1 { margin: 0 0 8px; font-size: 22px; color: #0c6055; }
    .header p { margin: 4px 0; font-size: 13px; color: #555; }
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section h2 {
      font-size: 16px;
      margin: 0 0 10px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-right: 4px solid #0c6055;
    }
    table { width: 100%; border-collapse: collapse; }
    td {
      border: 1px solid #e5e5e5;
      padding: 8px 10px;
      font-size: 13px;
      vertical-align: top;
    }
    td.label {
      width: 35%;
      background: #fafafa;
      font-weight: bold;
      color: #444;
    }
    .images {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
    }
    .images img {
      max-width: 220px;
      max-height: 180px;
      border: 1px solid #ddd;
      border-radius: 8px;
      object-fit: contain;
    }
    @media print {
      /* keep readable page padding now that @page margin is 0 */
      body { margin: 14mm 12mm; }
      .section { page-break-inside: avoid; }
    }
`;

/** Builds the inner markup for a single contract (no <html>/<head>/<body> wrapper). */
export function buildContractPrintSections(orderData) {
  if (!orderData) return "";

  const summary = orderData.contract_summary ?? {};
  const step1 = orderData.step1 ?? {};
  const step2 = orderData.step2 ?? {};
  const step3 = orderData.step3 ?? {};
  const step4 = orderData.step4 ?? {};
  const user = orderData.user ?? {};

  const resolveImageUrl = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value.trim() || null;
    if (typeof value === "object") {
      return value.url || value.path || value.full_url || value.src || null;
    }
    return null;
  };

  const images = [
    summary.image_instrument,
    summary.image_instrument_from_the_front,
    summary.image_instrument_from_the_back,
    summary.copy_power_of_attorney_from_heirs_to_agent,
  ]
    .map(resolveImageUrl)
    .map(safeImageUrl)
    .filter(Boolean);

  const imagesHtml = images.length
    ? `<div class="images">${images
        .map((src) => `<img src="${src}" alt="صورة الصك" />`)
        .join("")}</div>`
    : "";

  return `
  <div class="header">
    <h1>عقد إيجار - تفاصيل الطلب</h1>
    <p>رقم الطلب: ${display(orderData.uuid)}</p>
    <p>حالة الطلب: ${display(summary.contract_status_name)}</p>
    <p>رقم جوال العميل: ${display(user.mobile)}</p>
    <p>تاريخ الطباعة: ${new Date().toLocaleString("ar-SA")}</p>
  </div>

  ${section("الصك - الملاك", [
    ["اسم المالك", summary.name_owner],
    ["رقم الهوية", summary.property_owner_id_num],
    ["تاريخ الميلاد", summary.property_owner_dob],
    ["رقم الجوال", summary.property_owner_mobile],
   // ["ايبان المالك", summary.property_owner_iban],
    ["المنطقة", summary.relation_labels?.property_region],
    ["المدينة", summary.relation_labels?.property_city],
    ["الحي", summary.neighborhood],
    ["الشارع", summary.street],
  ])}

  ${summary.add_legal_agent_of_owner === 1
    ? section("بيانات الوكيل", [
        ["اسم الوكيل", summary.name_owner],
        ["رقم الهوية", summary.id_num_of_property_owner_agent],
        ["تاريخ الميلاد", summary.dob_of_property_owner_agent],
        ["رقم الجوال", summary.mobile_of_property_owner_agent],
      ])
    : ""}

  ${imagesHtml ? `<section class="section"><h2>صور الصك</h2>${imagesHtml}</section>` : ""}

  ${section("العنوان الوطني للعقار", [
    ["المدينة", step1.city_name || step1.property_city_id],
    ["المنطقة", step1.property_place_name || step1.property_place_id],
    ["الشارع", step1.street],
    ["الحي", step1.neighborhood],
    ["رقم الإضافي", step1.extra_figure],
    ["رقم المبنى", step1.building_number],
    ["الرمز البريدي", step1.postal_code],
  ])}

  ${section("تفاصيل العقار", [
    // ["استخدام العقار", step1.property_usages_name],
    // ["نوع العقار", step1.property_type_name],
    // ["إجمالي عدد الوحدات في كل طابق", step1.number_of_units_per_floor],
    // ["إجمالي عدد الطوابق", step1.number_of_floors],
    // ["عمر العقار", step1.age_of_the_property],
    // ["إجمالي عدد الوحدات في العقار", step1.number_of_units_in_realestate],
    // ["اسم مالك العقار", summary.name_owner],
  ])}

  ${section("تفاصيل الوحدة", [
    ["رقم الوحدة", step2.unit?.unit_number || step2.unit_number],
    ["نوع الوحدة", step2.unit_type_name || step2.unit_type?.name_ar],
    ["استخدام الوحدة", step2.unit_usage_name || step2.unit_usage?.name_ar],
    ["رقم الطابق", step2.unit?.floor_number || step2.floor_number],
    ["مساحة الوحدة", step2.unit?.unit_area || step2.unit_area],
    ["عدد الغرف", step2.tootal_rooms],
    ["مؤثثة", step2.furnished],
    ["مطبخ راكب", step2.kitchen_tank],
    ["دورة مياه", step2.The_number_of_the_toilet],
    ["الصالة", step2.The_number_of_halls],
    ["مكيف سبليت", step2.split_ac || "لا يوجد"],
    ["مكيف شباك", step2.window_ac || "لا يوجد"],
    ["مطبخ", step2.The_number_of_kitchens],
    ["عداد الكهرباء", step2.electricity_meter_number],
    ["عداد المياه", step2.water_meter_number],
  ])}

  ${section("العقد - المستأجر", [
    ["نوع العقد", summary.contract_type],
    ["تاريخ بدء العقد", step4.contract_starting_date],
    ["مدة العقد", summary.contract_period],
    ["صلاحيات المستأجر", (() => {
      const details = orderData?.tenant_roles_details || step4.tenant_roles_details;
      if (Array.isArray(details) && details.length) {
        return details
          .map((item) => {
            const label = item?.text_of_reason || item?.name || "";
            const value = item?.value;
            return value != null && value !== ""
              ? `${label} (${value})`
              : label;
          })
          .filter(Boolean)
          .join("، ");
      }
      const names =
        orderData?.tenant_role_names ||
        step4.tenant_role_names ||
        step3.tenant_role_names;
      return Array.isArray(names) ? names.join("، ") : names;
    })()],
    ["رقم هوية المستأجر", step3.tenant_id_num],
    ["تاريخ ميلاد المستأجر", step3.tenant_dob],
    ["رقم جوال المستأجر", step3.tenant_mobile],
  ])}

  ${section("البيانات المالية", [
    ["مبلغ الإيجار السنوي للوحدة", step4.annual_rent_amount_for_the_unit],
    ["نوع الدفع", step4.payment_type_name],
    ["الغرامة اليومية", step4.daily_fine],
    ["إجمالي السعر", step4.contract_term_in_years?.price],
    ["مدة العقد", step4.contract_term_name],
    ["تاريخ بداية العقد", step4.contract_starting_date],
    ["نوع التاريخ", step4.type_contract_starting_date === "hijri" ? "هجري" : "ميلادي"],
    ["شروط أخرى", (() => {
      const list =
        orderData?.other_conditions_list || step4.other_conditions_list;
      if (Array.isArray(list) && list.length) {
        return list.filter(Boolean).join("، ");
      }
      return step4.other_conditions || orderData?.other_conditions || "لا يوجد";
    })()],
    ["نص الشروط الإضافية", step4.text_additional_terms],
  ])}`;
}

function wrapPrintDocument(title, innerHtml) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>${CONTRACT_PRINT_STYLES}</style>
</head>
<body>
${innerHtml}
</body>
</html>`;
}

export function buildContractPrintHtml(orderData) {
  if (!orderData) return "";
  return wrapPrintDocument(
    `طباعة العقد - ${orderData.uuid ?? "---"}`,
    buildContractPrintSections(orderData)
  );
}

/** Builds one print document containing every contract, one per page. */
export function buildBatchContractPrintHtml(ordersData = []) {
  const valid = (ordersData ?? []).filter(Boolean);
  if (!valid.length) return "";

  const articles = valid
    .map((orderData, index) => {
      const breakAfter =
        index < valid.length - 1 ? ' style="page-break-after: always;"' : "";
      return `<article class="contract-doc"${breakAfter}>${buildContractPrintSections(
        orderData
      )}</article>`;
    })
    .join("\n");

  return wrapPrintDocument(`طباعة العقود (${valid.length})`, articles);
}

export function printOrderContract(orderData) {
  return printHtmlDocument(buildContractPrintHtml(orderData));
}

export function printOrderContracts(ordersData) {
  return printHtmlDocument(buildBatchContractPrintHtml(ordersData));
}
