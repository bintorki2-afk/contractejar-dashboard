import { describe, expect, it } from "vitest";
import { activityChanges } from "@/components/realtime-orders/details/order-activity-tab";

describe("activity changes (د13)", () => {
  it("status change shows names", () => {
    expect(
      activityChanges({
        action: "status_changed",
        before: { status_key: "under_review", status_name: "قيد المراجعة" },
        after: { status_key: "on_hold", status_name: "معلق" },
      })
    ).toEqual([{ label: "الحالة", before: "قيد المراجعة", after: "معلق" }]);
  });
  it("edited fields use Arabic labels and skip unchanged", () => {
    const out = activityChanges({
      action: "edited",
      before: { tenant_mobile: "0500000000", street: "أ" },
      after: { tenant_mobile: "0511111111", street: "أ" },
    });
    expect(out).toHaveLength(1);
    expect(out[0].after).toBe("0511111111");
    expect(out[0].label).not.toBe("tenant_mobile");
  });
});
