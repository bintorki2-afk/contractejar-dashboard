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

  it("has no draft-stage template (دفعة هـ: مرحلة المسودة أُلغيت)", () => {
    const all = getOrderSmsTemplates("201425");
    expect(all.find((t) => t.id === "draft_ready")).toBeUndefined();
    expect(all.map((t) => t.body).join("\n")).not.toContain("المسودة");
  });
});
