/**
 * فاتورة الطلب كما يرسلها الخادم (ف1) — مصدر واحد للبنود من ContractPricing.
 * لا نحسب أي بند في الواجهة؛ نعرض items[] والمجاميع كما هي.
 */

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(typeof value === "string" ? value.replace(/,/g, "").trim() : value);
  return Number.isFinite(n) ? n : null;
}

function riyalLabel(value) {
  const n = toNumber(value);
  if (n == null) return "—";
  return `${n.toLocaleString("en-US")} ريال`;
}

/** يحوّل كتلة `invoice` من الخادم إلى شكل عرض موحّد، أو null إن لم توجد فاتورة. */
export function normalizeApiInvoice(invoice) {
  if (!invoice || typeof invoice !== "object") return null;

  const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
  const items = rawItems.map((item, index) => {
    const amount = toNumber(item?.amount);
    return {
      index: item?.index ?? index + 1,
      key: item?.key ?? `line-${index}`,
      description: item?.description || "—",
      amount,
      amountLabel: item?.amount_label || riyalLabel(amount),
      isDiscount: Boolean(item?.is_discount) || (amount != null && amount < 0),
    };
  });

  const vat = toNumber(invoice.vat);
  const discount = toNumber(invoice.discount);
  const total = toNumber(invoice.total_amount);

  return {
    invoiceNumber: invoice.invoice_number || invoice.invoice_no || null,
    orderNumber: invoice.order_number || null,
    date: invoice.datetime_label || invoice.date || null,
    referenceNumber: invoice.reference_number || null,
    customerName: invoice.customer_name || null,
    customerPhone: invoice.customer_phone || null,
    contractTypeLabel: invoice.contract_type_label || null,
    platformName: invoice.platform_name || "عقدي",
    platformSubtitle: invoice.platform_subtitle || "منصة توثيق عقود الإيجار",
    statusLabel: invoice.status_label || null,
    isPaid: invoice.is_paid !== false,
    items,
    hasItems: items.length > 0,
    subtotalLabel: invoice.subtotal_label || riyalLabel(invoice.subtotal),
    discount,
    discountLabel: invoice.discount_label || riyalLabel(discount),
    couponCode: invoice.coupon_code || null,
    vat,
    vatLabel: invoice.vat_label || (vat ? riyalLabel(vat) : "مجانًا"),
    total,
    totalLabel: invoice.total_amount_label || riyalLabel(total),
    totalDueLabel: invoice.total_due_label || "الإجمالي المستحق",
    amountMismatch: Boolean(invoice.amount_mismatch),
  };
}
