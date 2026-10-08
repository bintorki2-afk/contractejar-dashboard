/**
 * Pure logic for the per-client "custom discount" coupon feature
 * (POST/GET/deactivate on /admin/users/{id}/coupons).
 */

export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
};

export const APPLIES_TO_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "housing", label: "سكني فقط" },
  { value: "commercial", label: "تجاري فقط" },
];

// The impact panel is an illustrative preview for "a typical first-year
// contract". The base fee per track comes from the official pricing
// (`GET /api/v2/pricing` → housing/commercial.first_year, passed in as
// `prices`); the constants below are only the last-resort fallbacks.
// The server applies the client discount to the first year only.
const PREVIEW_FALLBACK_FEES = { housing: 249, commercial: 349 };
const PREVIEW_MARGIN_RATIO = 0.304;

const PREVIEW_TRACKS = [
  { key: "housing", label: "سكني – السنة الأولى" },
  { key: "commercial", label: "تجاري – السنة الأولى" },
];

export function computeDiscountedAmount({ type, value, baseAmount }) {
  const base = Number(baseAmount) || 0;
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return { discount: 0, amountAfter: base };
  }

  const rawDiscount =
    type === DISCOUNT_TYPES.FIXED ? numericValue : (base * numericValue) / 100;
  const discount = Math.max(0, Math.min(rawDiscount, base));

  return { discount, amountAfter: base - discount };
}

function previewBaseFee(prices, key) {
  const value = Number(prices?.[key]);
  return Number.isFinite(value) && value > 0 ? value : PREVIEW_FALLBACK_FEES[key];
}

export function getDiscountPreviewRows({ type, value, appliesTo, prices }) {
  const tracks = PREVIEW_TRACKS.filter(
    (track) => !appliesTo || appliesTo === "all" || track.key === appliesTo
  );

  return tracks.map((track) => {
    const baseFee = previewBaseFee(prices, track.key);
    const { discount, amountAfter } = computeDiscountedAmount({
      type,
      value,
      baseAmount: baseFee,
    });
    const margin = baseFee * PREVIEW_MARGIN_RATIO;

    return {
      key: track.key,
      label: track.label,
      baseFee,
      discount,
      amountAfter,
      margin,
      isProfitable: margin - discount > 0,
    };
  });
}

export function buildAssignCouponPayload(values = {}) {
  const type =
    values.type === DISCOUNT_TYPES.FIXED ? DISCOUNT_TYPES.FIXED : DISCOUNT_TYPES.PERCENTAGE;

  const payload = {
    type,
    value: Number(values.value) || 0,
    applies_to: values.appliesTo || "all",
    reason: (values.reason || "").trim(),
    notify_on_login: Boolean(values.notifyOnLogin),
  };

  if (values.expiresAt) {
    payload.expires_at = values.expiresAt;
  }
  if (values.notifyOnLogin && values.notificationMessage) {
    payload.notification_message = values.notificationMessage.trim();
  }

  return payload;
}
