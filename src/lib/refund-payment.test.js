import { describe, expect, it } from "vitest";
import { paymentKind, paymentKindLabel, paymentOptionLabel, pickRefundPayment, pickRefundablePayment, refundableAmount } from "./refund-payment";

// صفوف payments الحقيقية من GET /admin/orders/308 (QA Q5 — دفعة هـ).
const ORIGINAL = { id: 104, amount: 249, status: "success", method: "creditcard", brand: "mada", paid_at: "2026-10-07T22:02:37+03:00", refunded_amount: 0, refundable_amount: 249, kind: "original", charge_id: null, is_bank_transfer: false };
const DIFF = { id: 108, amount: 75, status: "success", method: "creditcard", brand: "visa", paid_at: "2026-10-10T01:47:59+03:00", refunded_amount: 0, refundable_amount: 75, kind: "price_difference", charge_id: 6, is_bank_transfer: false };
const FEE = { id: 110, amount: 120, status: "success", method: "creditcard", brand: "mada", paid_at: "2026-10-09T23:41:14+03:00", refunded_amount: 0, refundable_amount: 120, kind: "extra_fee", charge_id: 4 };
const TRANSFER = { id: 95, amount: 264, status: "success", method: "bank_transfer", brand: "bank", paid_at: "2026-10-09T21:56:38+03:00", refundable_amount: 264, kind: "bank_transfer", is_bank_transfer: true };
const FAILED = { id: 50, amount: 249, status: "failed", kind: "original", refundable_amount: 249 };

describe("refund payment selection (دفعة هـ — D-2)", () => {
  it("refund_due picks the paid price-difference payment, not the original (QA Q5 on 920018)", () => {
    const pick = pickRefundPayment([ORIGINAL, DIFF], { purpose: "refund_due", amount: 75 });
    expect(pick.id).toBe(108);
    expect(paymentKind(pick)).toBe("price_difference");
  });

  it("refund_due prefers the latest charge payment that covers the amount", () => {
    expect(pickRefundPayment([ORIGINAL, FEE, DIFF], { purpose: "refund_due", amount: 75 }).id).toBe(108);
    expect(pickRefundPayment([ORIGINAL, FEE, DIFF], { purpose: "refund_due", amount: 100 }).id).toBe(110);
    // ترتيب المصفوفة لا يهم — الأحدث بتاريخ الدفع أولاً
    expect(pickRefundPayment([DIFF, FEE, ORIGINAL], { purpose: "refund_due", amount: 50 }).id).toBe(108);
  });

  it("refund_due falls back to the original when no charge payment exists or none covers the amount", () => {
    expect(pickRefundPayment([ORIGINAL], { purpose: "refund_due", amount: 75 }).id).toBe(104);
    expect(pickRefundPayment([ORIGINAL, DIFF], { purpose: "refund_due", amount: 200 }).id).toBe(104);
    // دفعة فرق مستردّة بالكامل ← الأصلية
    expect(pickRefundPayment([ORIGINAL, { ...DIFF, refunded_amount: 75, refundable_amount: 0 }], { purpose: "refund_due", amount: 75 }).id).toBe(104);
  });

  it("refund_due without an original big enough still returns the largest charge payment", () => {
    const smallOriginal = { ...ORIGINAL, refunded_amount: 200, refundable_amount: 49 };
    expect(pickRefundPayment([smallOriginal, DIFF, FEE], { purpose: "refund_due", amount: 100 }).id).toBe(110);
  });

  it("manual refund starts from the original (or bank transfer) payment", () => {
    expect(pickRefundPayment([DIFF, ORIGINAL], { purpose: "manual" }).id).toBe(104);
    expect(pickRefundPayment([DIFF, TRANSFER]).id).toBe(95);
    expect(pickRefundablePayment([DIFF, ORIGINAL]).id).toBe(104);
    // لا أصلية قابلة للاسترجاع ← أول دفعة قابلة
    expect(pickRefundPayment([{ ...ORIGINAL, refundable_amount: 0 }, DIFF]).id).toBe(108);
  });

  it("ignores failed / fully refunded payments and handles empty input", () => {
    expect(pickRefundPayment([FAILED])).toBeNull();
    expect(pickRefundPayment([{ ...ORIGINAL, refunded_amount: 249, refundable_amount: 0 }])).toBeNull();
    expect(pickRefundPayment(null)).toBeNull();
    expect(pickRefundPayment(undefined, { purpose: "refund_due", amount: 10 })).toBeNull();
  });

  it("refundable amount from server field, else amount − refunded", () => {
    expect(refundableAmount(ORIGINAL)).toBe(249);
    expect(refundableAmount({ amount: 249, refunded_amount: 75 })).toBe(174);
    expect(refundableAmount({ amount: "10.005" })).toBe(10.01);
    expect(refundableAmount({})).toBe(0);
  });

  it("kind labels and picker option text", () => {
    expect(paymentKindLabel(ORIGINAL)).toBe("الدفعة الأصلية");
    expect(paymentKindLabel(DIFF)).toBe("فرق سعر");
    expect(paymentKindLabel(FEE)).toBe("رسوم إضافية");
    expect(paymentKindLabel(TRANSFER)).toBe("حوالة بنكية");
    expect(paymentKindLabel({ kind_label: "من الخادم" })).toBe("من الخادم");
    // بيانات قديمة بلا kind
    expect(paymentKind({ charge_id: 3 })).toBe("extra_fee");
    expect(paymentKind({ method: "bank_transfer" })).toBe("bank_transfer");
    expect(paymentKind({})).toBe("original");

    expect(paymentOptionLabel(DIFF)).toBe("فرق سعر · 75 ر.س · visa · المتبقي 75 ر.س");
    expect(paymentOptionLabel(TRANSFER)).toBe("حوالة بنكية · 264 ر.س · حوالة · المتبقي 264 ر.س");
    expect(paymentOptionLabel({ ...ORIGINAL, refunded_amount: 75, refundable_amount: 174 })).toBe("الدفعة الأصلية · 249 ر.س · mada · المتبقي 174 ر.س");
  });
});
