/**
 * اختيار دفعة الاسترجاع (دفعة هـ — D-2).
 * صفوف `orderData.payments` من الخادم تحمل `kind`: original | price_difference | extra_fee | bank_transfer
 * و`refundable_amount` (أو amount − refunded_amount).
 * القاعدة: استرجاع «مستحق للعميل» بعد تعديل السعر يُنفَّذ على آخر دفعة فرق/رسوم ناجحة تكفي للمبلغ،
 * وإلا على الدفعة الأصلية؛ الاسترجاع العادي يبدأ بالدفعة الأصلية.
 */

export const PAYMENT_KIND_LABELS = {
  original: "الدفعة الأصلية",
  price_difference: "فرق سعر",
  extra_fee: "رسوم إضافية",
  bank_transfer: "حوالة بنكية",
};

const CHARGE_KINDS = ["price_difference", "extra_fee"];

export function isSuccessfulPayment(p) {
  return p?.status === "success" || p?.status === "paid";
}

/** المبلغ القابل للاسترجاع في دفعة (من الخادم). */
export function refundableAmount(payment) {
  const n = Number(payment?.refundable_amount ?? (Number(payment?.amount ?? 0) - Number(payment?.refunded_amount ?? 0)));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

/** نوع الدفعة: من kind، وإلا حوالة/أصلية حسب الحقول القديمة. */
export function paymentKind(p) {
  if (p?.kind && PAYMENT_KIND_LABELS[p.kind]) return p.kind;
  if (p?.charge_id != null && p.charge_id !== "") return "extra_fee";
  if (p?.is_bank_transfer || p?.method === "bank_transfer") return "bank_transfer";
  return "original";
}

export function paymentKindLabel(p) {
  return p?.kind_label ?? PAYMENT_KIND_LABELS[paymentKind(p)] ?? PAYMENT_KIND_LABELS.original;
}

/** سطر الخيار في قائمة الدفعات: «فرق سعر · 75 ر.س · mada · المتبقي 75 ر.س». */
export function paymentOptionLabel(p, sar = (n) => `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`) {
  const parts = [paymentKindLabel(p), sar(p?.amount)];
  const brand = p?.is_bank_transfer || paymentKind(p) === "bank_transfer" ? "حوالة" : p?.brand || p?.method || null;
  if (brand) parts.push(brand);
  parts.push(`المتبقي ${sar(refundableAmount(p))}`);
  return parts.join(" · ");
}

function successful(payments) {
  return (Array.isArray(payments) ? payments : []).filter((p) => isSuccessfulPayment(p) && refundableAmount(p) > 0);
}

function byPaidAtDesc(a, b) {
  const ta = Date.parse(a?.paid_at ?? "") || 0;
  const tb = Date.parse(b?.paid_at ?? "") || 0;
  if (tb !== ta) return tb - ta;
  return (Number(b?.id) || 0) - (Number(a?.id) || 0);
}

/**
 * الدفعة الافتراضية في حوار الاسترجاع.
 * @param payments صفوف الدفع
 * @param opts { purpose: "refund_due" | "manual", amount?: number }
 *   - refund_due: آخر دفعة price_difference/extra_fee ناجحة بمتبقٍ ≥ amount (أو أكبر متبقٍ إن لم تكفِ أي واحدة) ← وإلا الأصلية.
 *   - manual (افتراضي): الأصلية (أو الحوالة) إن كان لها متبقٍ، وإلا أول دفعة قابلة للاسترجاع.
 */
export function pickRefundPayment(payments = [], { purpose = "manual", amount = null } = {}) {
  const ok = successful(payments);
  if (!ok.length) return null;
  const originals = ok.filter((p) => !CHARGE_KINDS.includes(paymentKind(p)));
  const charges = ok.filter((p) => CHARGE_KINDS.includes(paymentKind(p))).sort(byPaidAtDesc);
  const need = Number(amount) > 0 ? Number(amount) : null;

  if (purpose === "refund_due") {
    const enough = need == null ? charges : charges.filter((p) => refundableAmount(p) >= need);
    if (enough.length) return enough[0];
    if (charges.length && need != null) {
      const original = originals[0];
      if (!original || refundableAmount(original) < need) {
        return charges.slice().sort((a, b) => refundableAmount(b) - refundableAmount(a))[0];
      }
    }
    return originals[0] ?? charges[0] ?? null;
  }

  return originals[0] ?? ok[0] ?? null;
}

/** التوافق مع الاستدعاءات القديمة: أول دفعة ناجحة قابلة للاسترجاع. */
export function pickRefundablePayment(payments = []) {
  return pickRefundPayment(payments, { purpose: "manual" });
}
