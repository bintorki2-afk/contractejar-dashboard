import { describe, expect, it } from "vitest";

import { buildOrderPaymentUrl, getOrderSmsTemplates } from "./order-sms-templates";

describe("order links sent to the customer", () => {
  it("point to the contractejar smart link, never to aqdi.sa", () => {
    expect(buildOrderPaymentUrl("201425")).toBe("https://contractejar.com/r/201425");
    expect(buildOrderPaymentUrl(" 201425 ")).toBe("https://contractejar.com/r/201425");
    expect(buildOrderPaymentUrl("")).toBe("");

    const all = getOrderSmsTemplates("201425").map((t) => t.body).join("\n");
    expect(all).not.toContain("aqdi.sa");
    expect(all).toContain("https://contractejar.com/r/201425");
  });

  it("draft template follows the rule: draft via WhatsApp, notarize only after the customer reviews it", () => {
    const draft = getOrderSmsTemplates("201425").find((t) => t.id === "draft_ready");
    expect(draft.body).toContain("واتساب");
    expect(draft.body).toContain("لن نوثّق العقد في إيجار إلا بعد اطلاعكم على المسودة");
    expect(draft.body).not.toContain("إتمام الدفع");
  });
});
