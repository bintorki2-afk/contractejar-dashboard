/**
 * حالة الدفع (دفعة هـ — 2.1): `payment_state` من الخادم هو المصدر الوحيد للأرقام والتسميات.
 * هنا فقط: لون الشارة ونصوص احتياطية عند غياب الحقول (بيانات قديمة).
 */

export const PAYMENT_STATUS_TONES = {
  unpaid: "danger",
  paid: "success",
  partially_paid: "warning",
  partially_refunded: "neutral",
  refunded: "neutral",
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: "غير مدفوع",
  paid: "مدفوع",
  partially_paid: "مدفوع جزئياً",
  partially_refunded: "مسترجع جزئياً",
  refunded: "مسترجع",
};

export const PAYMENT_METHOD_LABELS = {
  moyasar: "Moyasar",
  bank_transfer: "حوالة",
  mixed: "Moyasar + حوالة",
};

export function sar(value) {
  const n = Number(value ?? 0);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;
}

/**
 * يطبّع payment_state (أو يبنيه من is_paid/amount_payment للبيانات القديمة).
 * يرجع { status, status_label, method, method_label, label, tone, paid_total, due_total, outstanding,
 *         refunded_total, net_total, refund_due, pending_charges_count, pending_charges_total,
 *         can_notarize, notarize_block_reason, notarize_block_message, is_paid, awaiting_charge }.
 */
export function normalizePaymentState(order = {}) {
  const ps = order?.payment_state;
  if (ps && typeof ps === "object" && ps.status) {
    const status = ps.status;
    // QA WEB-5 / DASH-25: طلب «مسترجع» بلا استرجاع منفّذ بعد — الخادم يرسل `refund_pending` + `refund_pending_label`.
    const refundPending = ps.refund_pending === true;
    const pendingLabel =
      ps.refund_pending_label ||
      (ps.refund_pending_amount != null ? `مسترجع — بانتظار إعادة المبلغ · ${sar(ps.refund_pending_amount)}` : "مسترجع — بانتظار إعادة المبلغ");
    return {
      ...ps,
      status_label: refundPending ? "بانتظار إعادة المبلغ" : ps.status_label ?? PAYMENT_STATUS_LABELS[status] ?? status,
      method_label: ps.method_label ?? (ps.method ? PAYMENT_METHOD_LABELS[ps.method] ?? ps.method : null),
      label: refundPending ? pendingLabel : ps.label ?? buildLabel(status, ps.method, ps.paid_total, ps.due_total, ps.refunded_total),
      tone: refundPending ? "warning" : PAYMENT_STATUS_TONES[status] ?? "neutral",
      refund_pending: refundPending,
      is_paid: ps.is_paid ?? ["paid", "partially_refunded"].includes(status),
      awaiting_charge: Boolean(ps.awaiting_charge ?? (ps.pending_charges_count > 0)),
    };
  }
  // بيانات قديمة بلا payment_state
  const paid = order?.is_paid === true || order?.is_paid === 1 || order?.is_completed === 1 || order?.is_completed === true;
  const amount = Number(order?.amount_payment ?? order?.total_price?.total_price ?? 0) || 0;
  const status = paid ? "paid" : "unpaid";
  return {
    status,
    status_label: PAYMENT_STATUS_LABELS[status],
    method: paid ? "moyasar" : null,
    method_label: paid ? "Moyasar" : null,
    label: buildLabel(status, paid ? "moyasar" : null, paid ? amount : 0, amount, 0),
    tone: PAYMENT_STATUS_TONES[status],
    paid_total: paid ? amount : 0,
    due_total: amount,
    outstanding: paid ? 0 : amount,
    refunded_total: 0,
    net_total: paid ? amount : 0,
    refund_due: 0,
    pending_charges_count: 0,
    pending_charges_total: 0,
    can_notarize: paid,
    notarize_block_reason: paid ? null : "payment_required",
    notarize_block_message: paid ? null : "لا يمكن توثيق العقد قبل تسجيل الدفع (رابط دفع أو حوالة بنكية).",
    is_paid: paid,
    awaiting_charge: false,
  };
}

export function buildLabel(status, method, paidTotal, dueTotal, refundedTotal) {
  const m = method ? PAYMENT_METHOD_LABELS[method] ?? method : null;
  switch (status) {
    case "paid":
      return [PAYMENT_STATUS_LABELS.paid, m, sar(paidTotal)].filter(Boolean).join(" · ");
    case "partially_paid":
      return `${PAYMENT_STATUS_LABELS.partially_paid} · ${(Number(paidTotal) || 0).toLocaleString("en-US")} من ${sar(dueTotal)}`;
    case "partially_refunded":
      return `${PAYMENT_STATUS_LABELS.partially_refunded} · ${(Number(refundedTotal) || 0).toLocaleString("en-US")} من ${sar(paidTotal)}`;
    case "refunded":
      return `${PAYMENT_STATUS_LABELS.refunded} · ${sar(refundedTotal || paidTotal)}`;
    default:
      return `${PAYMENT_STATUS_LABELS.unpaid} · ${sar(dueTotal)}`;
  }
}

/** صفوف العرض في قائمة الشارة المنسدلة: بنود الفاتورة + الإجمالي + سطر تعريفي للعملية الأصلية. */
export function paymentBreakdown(order = {}) {
  const details = order?.payment_details ?? {};
  const lines = Array.isArray(details.lines) ? details.lines : [];
  const transactions = Array.isArray(details.transactions) ? details.transactions : [];
  const totals = details.totals ?? {};
  const state = normalizePaymentState(order);
  const original = transactions.find((t) => t.kind === "original") ?? transactions.find((t) => t.status === "success" || t.status === "paid") ?? null;
  return {
    lines,
    transactions,
    totals: {
      original: Number(totals.original ?? state.paid_total ?? 0) || 0,
      extra: Number(totals.extra ?? 0) || 0,
      refunded: Number(totals.refunded ?? state.refunded_total ?? 0) || 0,
      net: Number(totals.net ?? state.net_total ?? 0) || 0,
      due: Number(totals.due ?? state.due_total ?? 0) || 0,
      outstanding: Number(totals.outstanding ?? state.outstanding ?? 0) || 0,
      refund_due: Number(totals.refund_due ?? state.refund_due ?? 0) || 0,
    },
    invoice_number: details.invoice_number ?? order?.invoice?.invoice_number ?? null,
    invoice_url: details.invoice_url ?? null,
    original,
    state,
    hasCharges: Boolean(details.charges?.length || order?.charges?.length),
  };
}

/** سطر «Moyasar · بطاقة مدى •••• 4821 · 08/10/2026 22:40 · مرجع … · فاتورة INV-…». */
export function transactionMeta(tx, invoiceNumber) {
  if (!tx) return null;
  const parts = [];
  parts.push(tx.method_label ?? PAYMENT_METHOD_LABELS[tx.method] ?? tx.method ?? "");
  if (tx.brand && tx.brand !== "bank") parts.push(`بطاقة ${tx.brand}${tx.card_last4 ? ` •••• ${tx.card_last4}` : ""}`);
  if (tx.paid_at) {
    const d = new Date(tx.paid_at);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`
      );
    }
  }
  if (tx.reference) parts.push(`مرجع ${tx.reference}`);
  if (tx.employee?.name) parts.push(`سجّلها ${tx.employee.name}`);
  if (invoiceNumber) parts.push(`فاتورة ${invoiceNumber}`);
  return parts.filter(Boolean).join(" · ");
}
