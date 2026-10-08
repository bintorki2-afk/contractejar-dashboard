/**
 * حالة الدفعة كما تُعرض في اللوحة.
 * الخادم يسجّل دفعة البوابة التي لا يطابق مبلغها المستحق بحالة `pending` واسم
 * يبدأ بـ «مراجعة:» — هذه ليست دفعاً، وتحتاج مراجعة يدوية.
 */
export const REVIEW_PAYMENT_PREFIX = "مراجعة:";

export function isPaymentNeedsReview(payment) {
  const status = String(payment?.status ?? "").toLowerCase();
  const name = String(payment?.name ?? payment?.name_payment ?? "").trim();
  return status === "pending" && name.startsWith(REVIEW_PAYMENT_PREFIX);
}

export function paymentStatusKey(payment) {
  if (isPaymentNeedsReview(payment)) return "review";
  const status = String(payment?.status ?? "").toLowerCase();
  if (["success", "succeeded", "paid", "captured"].includes(status)) return "success";
  if (status === "failed") return "failed";
  if (status === "pending") return "pending";
  return status || "unknown";
}

export const PAYMENT_STATUS_LABELS = {
  success: "ناجحة",
  failed: "فشلت",
  pending: "قيد الانتظار",
  review: "بحاجة لمراجعة",
};

export function paymentStatusLabel(payment) {
  const key = paymentStatusKey(payment);
  return PAYMENT_STATUS_LABELS[key] || payment?.status || "—";
}
