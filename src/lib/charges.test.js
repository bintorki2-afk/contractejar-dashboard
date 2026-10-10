import { describe, expect, it } from "vitest";
import { ADD_FEE_WARNING, awaitingChargeLabel, chargesMath, describePriceDifference, pendingChargeBanner, pendingCharges } from "./charges";

describe("charges display math (دفعة هـ — E5)", () => {
  it("net = original + extra − refunded", () => {
    expect(chargesMath({ original: 249, extra: 75, refunded: 0 })).toEqual({ original: 249, extra: 75, refunded: 0, net: 324 });
    expect(chargesMath({ original: 264, extra: 120, refunded: 100 }).net).toBe(284);
    expect(chargesMath({ original: "279", extra: null, refunded: undefined }).net).toBe(279);
  });

  it("pending charge banner + awaiting label", () => {
    const charge = { id: 6, kind: "price_difference", amount: 75, message: "تغيير نوع المستند: إلكتروني → ورقي", status: "pending" };
    expect(pendingChargeBanner(charge)).toBe("الفرق +75 ر.س — تغيير نوع المستند: إلكتروني → ورقي");
    expect(pendingChargeBanner({ kind: "extra_fee", amount: 120, message: "رسوم وحدة ثانية" })).toBe("رسوم إضافية +120 ر.س — رسوم وحدة ثانية");
    const order = { charges: [charge, { id: 7, status: "paid", amount: 120 }] };
    expect(pendingCharges(order)).toHaveLength(1);
    expect(awaitingChargeLabel(order)).toBe("بانتظار دفع فرق · 75 ر.س");
    expect(awaitingChargeLabel({ payment_state: { awaiting_charge_label: "بانتظار دفع فرق · 195 ر.س" } })).toBe("بانتظار دفع فرق · 195 ر.س");
    expect(awaitingChargeLabel({ charges: [] })).toBeNull();
  });

  it("describePriceDifference: positive → charge, negative → refund_due, zero → null", () => {
    const up = describePriceDifference({ price_difference: { difference: 75, refund_due: 0, reason: "تغيير نوع المستند", charge: { id: 6 } } });
    expect(up.kind).toBe("charge");
    expect(up.title).toContain("75 ر.س");
    expect(up.charge.id).toBe(6);
    const down = describePriceDifference({ data: { price_difference: { difference: -30, refund_due: 30, reason: "إلغاء عداد" } } });
    expect(down.kind).toBe("refund_due");
    expect(down.amount).toBe(30);
    expect(describePriceDifference({ price_difference: { difference: 0, refund_due: 0 } })).toBeNull();
    expect(describePriceDifference({})).toBeNull();
  });

  it("the owner's warning text is shown verbatim", () => {
    expect(ADD_FEE_WARNING).toBe("⚠ هذه الرسالة سيقرأها العميل كما هي — بالتطبيق والموقع وواتساب");
  });
});
