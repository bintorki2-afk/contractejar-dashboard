import { describe, expect, it } from "vitest";

import { formatDateValue, mapOrderToExportRow } from "./orders-export";

describe("orders Excel export", () => {
  it("exports the mobile as 05XXXXXXXX and a sortable Gregorian date (Riyadh time)", () => {
    const row = mapOrderToExportRow({
      uuid: "611167",
      user_mobile: "00966501234506",
      contract_type: "سكني",
      updated_at: "2026-10-08T12:53:00Z",
      is_paid: false,
    });
    expect(row["رقم جوال العميل"]).toBe("0501234506");
    expect(row["مستلم منذ"]).toBe("2026-10-08 15:53");
    expect(formatDateValue("")).toBe("");
  });
});
