import { describe, expect, it } from "vitest";
import { buildOrderDiscountPayload } from "./apply-order-discount-form";
import { refundErrorMessage } from "@/src/hooks/use-refunds";

describe("apply discount on an unpaid order (دفعة د — Q2)", () => {
  it("builds the POST /admin/users/{id}/discount body", () => {
    expect(buildOrderDiscountPayload({ contractId: "285", type: "percentage", value: "٢٠", reason: " ترضية " })).toEqual({
      contract_id: 285, type: "percentage", value: 20, reason: "ترضية",
    });
    expect(buildOrderDiscountPayload({ contractId: 285, type: "waiver", value: "99", reason: "إعفاء" })).toEqual({
      contract_id: 285, type: "waiver", reason: "إعفاء",
    });
  });
});

describe("refund error message", () => {
  it("shows the gateway message on 502 (axios replaces 5xx messages with a generic one)", () => {
    const err = { response: { status: 502, data: { message: "حدث خطأ في الخادم", server_message: "تعذّر الاسترجاع من بوابة الدفع: تعذّر العثور على معرّف الدفعة في Moyasar." } } };
    expect(refundErrorMessage(err)).toMatch(/بوابة الدفع/);
  });
  it("never leaks other 5xx internals", () => {
    const err = { response: { status: 500, data: { message: "حدث خطأ في الخادم", server_message: "SQLSTATE[HY000]" } } };
    expect(refundErrorMessage(err)).toBe("حدث خطأ في الخادم");
  });
});
