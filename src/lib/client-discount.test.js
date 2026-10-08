import { describe, expect, it } from "vitest";
import {
  APPLIES_TO_OPTIONS,
  DISCOUNT_TYPES,
  buildAssignCouponPayload,
  computeDiscountedAmount,
  getDiscountPreviewRows,
} from "./client-discount";

describe("computeDiscountedAmount", () => {
  it("applies a percentage discount to the base amount", () => {
    const result = computeDiscountedAmount({
      type: DISCOUNT_TYPES.PERCENTAGE,
      value: 10,
      baseAmount: 349,
    });
    expect(result.discount).toBeCloseTo(34.9);
    expect(result.amountAfter).toBeCloseTo(314.1);
  });

  it("applies a fixed discount to the base amount", () => {
    const result = computeDiscountedAmount({
      type: DISCOUNT_TYPES.FIXED,
      value: 50,
      baseAmount: 349,
    });
    expect(result.discount).toBe(50);
    expect(result.amountAfter).toBe(299);
  });

  it("clamps a fixed discount so it never exceeds the base amount", () => {
    const result = computeDiscountedAmount({
      type: DISCOUNT_TYPES.FIXED,
      value: 1000,
      baseAmount: 349,
    });
    expect(result.discount).toBe(349);
    expect(result.amountAfter).toBe(0);
  });

  it("clamps a percentage discount above 100% to the base amount", () => {
    const result = computeDiscountedAmount({
      type: DISCOUNT_TYPES.PERCENTAGE,
      value: 250,
      baseAmount: 349,
    });
    expect(result.discount).toBe(349);
    expect(result.amountAfter).toBe(0);
  });

  it("returns no discount when the value is empty, zero, or not a number", () => {
    expect(computeDiscountedAmount({ type: "percentage", value: "", baseAmount: 349 })).toEqual({
      discount: 0,
      amountAfter: 349,
    });
    expect(computeDiscountedAmount({ type: "percentage", value: 0, baseAmount: 349 })).toEqual({
      discount: 0,
      amountAfter: 349,
    });
    expect(computeDiscountedAmount({ type: "percentage", value: -5, baseAmount: 349 })).toEqual({
      discount: 0,
      amountAfter: 349,
    });
  });
});

describe("getDiscountPreviewRows", () => {
  it("returns one preview row per track when applies_to is 'all'", () => {
    const rows = getDiscountPreviewRows({ type: "percentage", value: 10, appliesTo: "all" });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.key).sort()).toEqual(["commercial", "housing"]);
  });

  it("returns a single row scoped to the selected track", () => {
    const rows = getDiscountPreviewRows({ type: "percentage", value: 10, appliesTo: "commercial" });
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("commercial");
  });

  it("flags a row as not profitable once the discount exceeds the contract margin", () => {
    const rows = getDiscountPreviewRows({ type: "fixed", value: 1000, appliesTo: "commercial" });
    expect(rows[0].isProfitable).toBe(false);
  });

  it("flags a row as profitable when the discount stays under the contract margin", () => {
    const rows = getDiscountPreviewRows({ type: "percentage", value: 5, appliesTo: "commercial" });
    expect(rows[0].isProfitable).toBe(true);
  });
});

describe("buildAssignCouponPayload", () => {
  it("maps camelCase form values to the API's snake_case payload", () => {
    const payload = buildAssignCouponPayload({
      type: "percentage",
      value: "10",
      appliesTo: "commercial",
      expiresAt: "2026-12-31",
      reason: "  عميل مميز  ",
      notifyOnLogin: true,
      notificationMessage: "تهانينا! حصلت على خصم",
    });

    expect(payload).toEqual({
      type: "percentage",
      value: 10,
      applies_to: "commercial",
      expires_at: "2026-12-31",
      reason: "عميل مميز",
      notify_on_login: true,
      notification_message: "تهانينا! حصلت على خصم",
    });
  });

  it("omits expires_at and notification_message when they are not provided", () => {
    const payload = buildAssignCouponPayload({
      type: "fixed",
      value: "20",
      appliesTo: "all",
      reason: "تعويض",
      notifyOnLogin: false,
      notificationMessage: "",
    });

    expect(payload).not.toHaveProperty("expires_at");
    expect(payload).not.toHaveProperty("notification_message");
    expect(payload.notify_on_login).toBe(false);
  });

  it("defaults an unrecognized type to percentage", () => {
    const payload = buildAssignCouponPayload({ type: "bogus", value: "1", appliesTo: "all" });
    expect(payload.type).toBe("percentage");
  });
});

describe("APPLIES_TO_OPTIONS", () => {
  it("exposes the three applies_to choices the API accepts", () => {
    expect(APPLIES_TO_OPTIONS.map((o) => o.value)).toEqual(["all", "housing", "commercial"]);
  });
});

describe("getDiscountPreviewRows — base fee from the official pricing (CROSS-D2)", () => {
  it("uses each track's first-year price instead of 349 for both", () => {
    const rows = getDiscountPreviewRows({
      type: "percentage",
      value: 10,
      appliesTo: "all",
      prices: { housing: 249, commercial: 349 },
    });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.housing.baseFee).toBe(249);
    expect(byKey.housing.discount).toBeCloseTo(24.9);
    expect(byKey.housing.amountAfter).toBeCloseTo(224.1);
    expect(byKey.commercial.baseFee).toBe(349);
  });

  it("follows a price change made in the settings", () => {
    const rows = getDiscountPreviewRows({
      type: "fixed",
      value: 50,
      appliesTo: "housing",
      prices: { housing: 299, commercial: 399 },
    });
    expect(rows[0].baseFee).toBe(299);
    expect(rows[0].amountAfter).toBe(249);
  });

  it("falls back to 249 (housing) / 349 (commercial) only when pricing is unavailable", () => {
    const rows = getDiscountPreviewRows({ type: "percentage", value: 0, appliesTo: "all" });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.housing.baseFee).toBe(249);
    expect(byKey.commercial.baseFee).toBe(349);
  });
});
