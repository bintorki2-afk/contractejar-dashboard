import { describe, expect, it } from "vitest";
import { buildNotificationPayload } from "@/src/hooks/use-send-notification";
import { PUSH_RESULT } from "@/components/realtime-orders/details/order-notifications-tab";

describe("broadcast payload (د24)", () => {
  it("adds segment, city, coupon and validity for all-users", () => {
    const { endpoint, payload } = buildNotificationPayload("all-users", {
      title: " عرض ", body: "نص", kind: "offer", url: "", segment: "city", cityId: "7", couponCode: "WEEKEND20", validUntil: "2026-12-31",
    });
    expect(endpoint).toBe("/admin/notifications/all-users");
    expect(payload).toMatchObject({ title: "عرض", segment: "city", city_id: 7, coupon_code: "WEEKEND20", valid_until: "2026-12-31", kind: "offer" });
  });
  it("employee notifications never carry customer fields", () => {
    const { payload } = buildNotificationPayload("employee", { title: "t", body: "b", employeeId: "3", couponCode: "X" });
    expect(payload).toEqual({ title: "t", body: "b", employee_id: 3 });
  });
  it("push results have Arabic labels", () => {
    expect(PUSH_RESULT.no_token.label).toContain("الصندوق");
    expect(PUSH_RESULT.prepared.label).toContain("واتساب");
  });
});
