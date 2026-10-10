import { printHtmlDocument } from "@/src/lib/print";

const TYPE_LABEL = {
  residential: "سكني",
  commercial: "تجاري",
};

const STATUS_LABEL = {
  success: "ناجحة",
  failed: "فشلت",
  refunded: "مسترجعة",
  unknown: "غير معروفة",
};

/** وصف بند الفاتورة حسب نوع العقد ونوع العملية (دفعة هـ: فرق سعر / رسوم إضافية / حوالة). */
export function getInvoiceItemDescription(contractType, kind = "original", raw = null) {
  const base = contractType === "commercial" ? "عقد تجاري" : "عقد سكني";
  switch (kind) {
    case "extra_fee":
      return `رسوم إضافية – ${base}${raw?.name ? ` – ${raw.name}` : ""}`;
    case "price_difference":
      return `فرق سعر – ${base}${raw?.name ? ` – ${raw.name}` : ""}`;
    case "bank_transfer":
      return `رسوم توثيق ${base} – حوالة بنكية${raw?.reference ? ` – مرجع ${raw.reference}` : ""}`;
    case "refund":
      return `استرجاع – ${base}`;
    default:
      return contractType === "commercial"
        ? "رسوم توثيق عقد تجاري – صك إلكتروني – وزارة العدل"
        : "رسوم توثيق عقد سكني – صك إلكتروني – وزارة العدل";
  }
}

const RIYAL_SVG = `<svg viewBox="0 0 1124.14 1256.39" width="0.85em" height="0.85em" style="vertical-align:-0.05em" fill="currentColor"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/></svg>`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function invoiceStyles(isPaid) {
  return `  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Tahoma, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #111827;
      background: #fff;
    }
    .sheet {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 28px;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .brand { color: #0A4D33; }
    .brand h1 { margin: 0; font-size: 28px; }
    .brand p { margin: 4px 0 0; font-size: 13px; color: #6B7280; font-weight: 600; }
    .meta { text-align: left; font-size: 13px; color: #4B5563; line-height: 1.8; }
    .rule { height: 2px; background: #0A4D33; margin: 18px 0; border: 0; }
    .boxes { display: flex; gap: 10px; }
    .box {
      flex: 1;
      background: #F3F4F6;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .box .label { font-size: 12px; color: #6B7280; margin: 0 0 6px; }
    .box .value { font-size: 14px; font-weight: 700; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th {
      background: #F3F4F6;
      text-align: right;
      font-size: 13px;
      padding: 10px 12px;
    }
    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6; }
    .total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #E8F5F1;
      color: #0A4D33;
      font-weight: 800;
      padding: 12px 14px;
      border-radius: 8px;
      margin-top: 4px;
    }
    .status {
      display: inline-block;
      margin: 22px auto 0;
      padding: 6px 18px;
      border: 1.5px solid ${isPaid ? "#16A34A" : "#DC2626"};
      color: ${isPaid ? "#15803D" : "#DC2626"};
      border-radius: 999px;
      font-weight: 700;
      font-size: 13px;
    }
    .status-wrap { text-align: center; }
    .lines td.amount { text-align: left; white-space: nowrap; font-weight: 700; }
    .lines td.discount { color: #B91C1C; }
    .sum { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; color: #374151; }
    .sum .free { color: #15803D; font-weight: 800; }
  </style>`;
}

export function buildInvoicePrintHtml(invoice, customerName) {
  if (!invoice) return "";

  const name = (customerName || invoice.customerName || "").trim();
  const customerLine = name
    ? `${name} (${invoice.mobile})`
    : invoice.mobile;
  const typeLabel = invoice.contractType ? TYPE_LABEL[invoice.contractType] : null;
  const statusLabel = STATUS_LABEL[invoice.status] || invoice.status || "—";
  const isPaid = invoice.status === "success";
  const amount = Number(invoice.amount).toLocaleString("en-US");
  const description = getInvoiceItemDescription(invoice.contractType, invoice.kind, invoice.raw);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة ${escapeHtml(invoice.invoiceNo)}</title>
${invoiceStyles(isPaid)}
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <h1>عقد إيجار</h1>
        <p>منصة توثيق عقود الإيجار</p>
      </div>
      <div class="meta">
        <div>رقم الفاتورة ${escapeHtml(invoice.invoiceNo)}</div>
        <div>التاريخ ${escapeHtml(invoice.date)}</div>
        <div>الرقم المرجعي ${escapeHtml(invoice.referenceNo)}</div>
      </div>
    </div>
    <hr class="rule" />
    <div class="boxes">
      <div class="box">
        <p class="label">العميل</p>
        <p class="value">${escapeHtml(customerLine)}</p>
      </div>
      <div class="box">
        <p class="label">رقم الطلب</p>
        <p class="value">#${escapeHtml(invoice.orderNo)}</p>
      </div>
      <div class="box">
        <p class="label">نوع العقد</p>
        <p class="value">${escapeHtml(typeLabel || "—")}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:56px">#</th>
          <th>الوصف</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${escapeHtml(description)}</td>
        </tr>
      </tbody>
    </table>
    <div class="total">
      <span>الإجمالي المستحق</span>
      <span>${amount} ${RIYAL_SVG}</span>
    </div>
    <div class="status-wrap">
      <span class="status">${escapeHtml(statusLabel)}${isPaid ? " ✓" : ""}</span>
    </div>
  </div>
</body>
</html>`;
}

export function printInvoice(invoice, customerName) {
  const html = buildInvoicePrintHtml(invoice, customerName);
  return printHtmlDocument(html);
}

/**
 * طباعة فاتورة الخادم (ف1): البنود والمجاميع كما وصلت من ContractPricing — بلا أي حساب هنا.
 * `invoice` هو ناتج normalizeApiInvoice().
 */
export function buildApiInvoicePrintHtml(invoice) {
  if (!invoice) return "";
  const isPaid = invoice.isPaid;
  const customer = [invoice.customerName, invoice.customerPhone].filter(Boolean).join(" — ") || "—";
  const rows = invoice.items
    .map(
      (item) => `<tr>
          <td>${escapeHtml(item.index)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td class="amount${item.isDiscount ? " discount" : ""}">${escapeHtml(item.amountLabel)}</td>
        </tr>`
    )
    .join("");
  const discountRow =
    invoice.discount && invoice.discount !== 0
      ? `<div class="sum"><span>الخصم${invoice.couponCode ? ` (${escapeHtml(invoice.couponCode)})` : ""}</span><span>${escapeHtml(invoice.discountLabel)}</span></div>`
      : "";
  const vatIsFree = !invoice.vat;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة ${escapeHtml(invoice.invoiceNumber || "")}</title>
${invoiceStyles(isPaid)}
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <h1>${escapeHtml(invoice.platformName)}</h1>
        <p>${escapeHtml(invoice.platformSubtitle)}</p>
      </div>
      <div class="meta">
        <div>رقم الفاتورة ${escapeHtml(invoice.invoiceNumber || "—")}</div>
        <div>التاريخ ${escapeHtml(invoice.date || "—")}</div>
        <div>الرقم المرجعي ${escapeHtml(invoice.referenceNumber || "—")}</div>
      </div>
    </div>
    <hr class="rule" />
    <div class="boxes">
      <div class="box">
        <p class="label">العميل</p>
        <p class="value">${escapeHtml(customer)}</p>
      </div>
      <div class="box">
        <p class="label">رقم الطلب</p>
        <p class="value">${escapeHtml(invoice.orderNumber || "—")}</p>
      </div>
      <div class="box">
        <p class="label">نوع العقد</p>
        <p class="value">${escapeHtml(invoice.contractTypeLabel || "—")}</p>
      </div>
    </div>
    <table class="lines">
      <thead>
        <tr>
          <th style="width:56px">#</th>
          <th>الوصف</th>
          <th style="text-align:left">المبلغ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sum"><span>المجموع الفرعي</span><span>${escapeHtml(invoice.subtotalLabel)}</span></div>
    ${discountRow}
    <div class="sum"><span>ضريبة القيمة المضافة</span><span class="${vatIsFree ? "free" : ""}">${escapeHtml(invoice.vatLabel)}</span></div>
    <div class="total">
      <span>${escapeHtml(invoice.totalDueLabel)}</span>
      <span>${escapeHtml(invoice.totalLabel)}</span>
    </div>
    <div class="status-wrap">
      <span class="status">${escapeHtml(invoice.statusLabel || (isPaid ? "مدفوعة" : "غير مدفوعة"))}${isPaid ? " ✓" : ""}</span>
    </div>
  </div>
</body>
</html>`;
}

export function printApiInvoice(invoice) {
  return printHtmlDocument(buildApiInvoicePrintHtml(invoice));
}
