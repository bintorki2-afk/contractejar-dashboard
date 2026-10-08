import { describe, expect, it } from "vitest";

import { isPaymentNeedsReview, paymentStatusKey, paymentStatusLabel } from "./payment-status";
import { mapOrderDetailView } from "@/components/realtime-orders/details/map-order-detail";

describe("payments that need review (amount does not match what is due)", () => {
  it("pending + name starting with «مراجعة:» is «بحاجة لمراجعة», not paid", () => {
    const p = { status: "pending", name: "مراجعة: المبلغ 100 لا يطابق المستحق 249", amount: 100 };
    expect(isPaymentNeedsReview(p)).toBe(true);
    expect(paymentStatusKey(p)).toBe("review");
    expect(paymentStatusLabel(p)).toBe("بحاجة لمراجعة");
  });

  it("other statuses keep their labels", () => {
    expect(paymentStatusLabel({ status: "success" })).toBe("ناجحة");
    expect(paymentStatusLabel({ status: "failed" })).toBe("فشلت");
    expect(paymentStatusLabel({ status: "pending", name: "دفع" })).toBe("قيد الانتظار");
  });

  it("order detail does not count a review payment as paid and flags it", () => {
    const view = mapOrderDetailView({
      id: 1, uuid: "1", contract_summary: {}, step1: {}, step2: {}, step3: {}, step4: {},
      is_paid: false,
      payment_and_admin: { contract_payments: [{ status: "pending", name: "مراجعة: مبلغ مختلف", amount: 100 }] },
    });
    expect(view.financial.fees).toBe("بحاجة لمراجعة");
    expect(view.financial.fees_paid).toBe(false);
    expect(view.financial.payment_review_count).toBe(1);
    expect(view.financial.payment_review_amount).toBe(100);
  });
});
