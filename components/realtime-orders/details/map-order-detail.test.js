import { describe, expect, it } from "vitest";

import { mapOrderDetailView, successfulPaymentsTotal } from "./map-order-detail";

const base = (extra = {}) => ({
  id: 176,
  uuid: "814671",
  contract_summary: {},
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  total_price: { fee: 249, vat: 0, vat_label: "مجانًا", total_price: 249 },
  ...extra,
});

describe("order detail — «المبلغ المدفوع» counts successful payments only", () => {
  it("does not show a failed payment as paid (demo order 176)", () => {
    const view = mapOrderDetailView(
      base({
        is_paid: true,
        amount_payment: 895,
        payment_and_admin: {
          contract_payments: [{ id: 33, amount: 895, status: "failed" }],
        },
      })
    );
    expect(view.financial.fees).toBe("لا توجد دفعة ناجحة مسجّلة");
    expect(view.financial.fees_paid).toBe(false);
  });

  it("sums successful payments and ignores failed/pending attempts", () => {
    const orderData = base({
      is_paid: true,
      amount_payment: 359.1,
      payment_and_admin: {
        contract_payments: [
          { amount: 249, status: "failed" },
          { amount: "359.10", status: "success" },
          { amount: 100, status: "pending" },
        ],
      },
    });
    expect(successfulPaymentsTotal(orderData)).toBeCloseTo(359.1);
    const view = mapOrderDetailView(orderData);
    expect(view.financial.fees).toBeCloseTo(359.1);
    expect(view.financial.fees_paid).toBe(true);
  });

  it("keeps the server value when the payment log is not sent", () => {
    const view = mapOrderDetailView(base({ is_paid: false, amount_payment: "لم يتم الدفع" }));
    expect(view.financial.fees).toBe("لم يتم الدفع");
    expect(view.financial.fees_paid).toBe(false);
  });
});

describe("order detail — guest customer's WhatsApp", () => {
  it("shows user.contact_mobile in 05 format", () => {
    const view = mapOrderDetailView(base({ user: { mobile: null, contact_mobile: "00966551234567", is_guest: true } }));
    expect(view.customer_whatsapp).toBe("0551234567");
    expect(view.customer_whatsapp_dial).toBe("966551234567");
  });
});
