/**
 * الرسوم الإضافية وفروقات السعر (دفعة هـ — E5 / 2.3). الخادم يحسب كل الأرقام؛ هنا عرض فقط.
 */
import { sar } from "@/src/lib/payment-state";

export const CHARGE_KIND_LABELS = {
  price_difference: "فرق سعر",
  extra_fee: "رسوم إضافية",
};

export const CHARGE_STATUS_LABELS = {
  pending: "بانتظار الدفع",
  paid: "مدفوعة",
  cancelled: "ملغاة",
};

export const CHARGE_STATUS_TONES = {
  pending: "warning",
  paid: "success",
  cancelled: "neutral",
};

/** تحذير يُعرض فوق حقل الرسالة في «إضافة رسوم» — نص المالك حرفياً. */
export const ADD_FEE_WARNING = "⚠ هذه الرسالة سيقرأها العميل كما هي — بالتطبيق والموقع وواتساب";

export function chargeKindLabel(charge) {
  return charge?.kind_label ?? CHARGE_KIND_LABELS[charge?.kind] ?? charge?.kind ?? "رسوم";
}
export function chargeStatusLabel(charge) {
  return charge?.status_label ?? CHARGE_STATUS_LABELS[charge?.status] ?? charge?.status ?? "";
}

/** الرسوم المعلّقة (بانتظار الدفع) من charges[] أو payment_details.charges. */
export function pendingCharges(order = {}) {
  const list = Array.isArray(order?.charges) ? order.charges : Array.isArray(order?.payment_details?.charges) ? order.payment_details.charges : [];
  return list.filter((c) => c?.status === "pending");
}

export function allCharges(order = {}) {
  const list = Array.isArray(order?.charges) ? order.charges : Array.isArray(order?.payment_details?.charges) ? order.payment_details.charges : [];
  return [...list].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

/** «الفرق +75 ر.س — تغيير نوع المستند: إلكتروني → ورقي» (شريط الفرق بعد التعديل). */
export function pendingChargeBanner(charge) {
  if (!charge) return null;
  const amount = Number(charge.amount) || 0;
  const prefix = charge.kind === "price_difference" ? "الفرق" : "رسوم إضافية";
  return `${prefix} +${sar(amount)}${charge.message ? ` — ${charge.message}` : ""}`;
}

/** ملخّص الفروقات في الشارة/القائمة: «بانتظار دفع فرق · 75 ر.س». */
export function awaitingChargeLabel(order = {}) {
  const state = order?.payment_state ?? {};
  if (state.awaiting_charge_label) return state.awaiting_charge_label;
  const pending = pendingCharges(order);
  if (!pending.length && !(Number(state.pending_charges_count) > 0)) return null;
  const total = pending.length ? pending.reduce((s, c) => s + (Number(c.amount) || 0), 0) : Number(state.pending_charges_total) || 0;
  return `بانتظار دفع فرق · ${sar(total)}`;
}

/**
 * يقرأ `price_difference` من استجابة PATCH/POST /admin/orders/{id} ويرجع نص التنبيه المناسب:
 * فرق موجب ← رسوم معلّقة؛ فرق سالب ← مستحق استرجاع؛ وإلا null.
 */
export function describePriceDifference(payload) {
  const pd = payload?.price_difference ?? payload?.data?.price_difference ?? null;
  if (!pd) return null;
  const diff = Number(pd.difference) || 0;
  const refundDue = Number(pd.refund_due) || 0;
  if (diff > 0) {
    return {
      kind: "charge",
      amount: diff,
      title: `تغيّر السعر: على العميل فرق ${sar(diff)}`,
      description: `${pd.reason ? `${pd.reason} — ` : ""}أُنشئت رسوم «فرق سعر» بانتظار الدفع؛ «وثّقت» مقفول حتى تحصيلها.`,
      charge: pd.charge ?? null,
    };
  }
  if (refundDue > 0 || diff < 0) {
    const amount = refundDue || Math.abs(diff);
    return {
      kind: "refund_due",
      amount,
      title: `تغيّر السعر: مستحق للعميل ${sar(amount)}`,
      description: `${pd.reason ? `${pd.reason} — ` : ""}استرجع الفرق من زر «استرجاع الفرق» في صفحة الطلب.`,
      charge: null,
    };
  }
  return null;
}

/** صافي الحساب للعرض: أصلي + إضافي − مسترجع = صافي (تحقق من اتساق الأرقام فقط). */
export function chargesMath({ original = 0, extra = 0, refunded = 0 } = {}) {
  const o = Number(original) || 0;
  const e = Number(extra) || 0;
  const r = Number(refunded) || 0;
  return { original: o, extra: e, refunded: r, net: o + e - r };
}
