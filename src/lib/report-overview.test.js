import { describe, expect, it } from "vitest";
import { formatOverviewCard } from "@/components/reports/tabs/overview-report-tab";

describe("reports overview cards (د3)", () => {
  it("formats the six numbers and shows «—» for null", () => {
    expect(formatOverviewCard({ key: "revenue", value: 13908.1 })).toBe("13,908 ر.س");
    expect(formatOverviewCard({ key: "completion_rate", value: 16 })).toBe("16%");
    expect(formatOverviewCard({ key: "completion_rate", value: null })).toBe("—");
    expect(formatOverviewCard({ key: "avg_notarization_hours", value: 2 })).toBe("2 س");
    expect(formatOverviewCard({ key: "top_source", value: { key: "google", label: "قوقل", orders: 2 } })).toBe("قوقل");
    expect(formatOverviewCard({ key: "orders_week", value: 84 })).toBe("84");
  });
});
