import { describe, expect, it } from "vitest";
import { buildDataRequestMessage, buildWhatsAppUrl, dataRequestBadgeLabel, defaultSelectionForSection, hoursWaitingLabel, needsReminder } from "./data-requests";

describe("data-request message builder (دفعة هـ — E4)", () => {
  it("renders order number, items, note and the deep link", () => {
    const msg = buildDataRequestMessage({
      orderNumber: "920012",
      items: [{ key: "deed_image_unclear", label: "صورة الصك غير واضحة" }, "رقم الصك"],
      note: "الصورة مقصوصة",
      deepLink: "https://contractejar.com/r/920012?fix=3",
    });
    const lines = msg.split("\n");
    expect(lines[1]).toBe("بخصوص طلبك رقم 920012 في «عقد إيجار»، نحتاج منك:");
    expect(lines).toContain("• صورة الصك غير واضحة");
    expect(lines).toContain("• رقم الصك");
    expect(lines).toContain("• الصورة مقصوصة");
    expect(lines.at(-1)).toContain("https://contractejar.com/r/920012?fix=3");
    expect(msg).not.toMatch(/مسودة/);
  });
  it("omits an empty note and falls back without a link", () => {
    const msg = buildDataRequestMessage({ orderNumber: "1", items: ["x"], note: "  " });
    expect(msg.split("\n")).toHaveLength(4);
    expect(msg.at(-1)).toBe(".");
  });
  it("wa.me url encodes the message", () => {
    expect(buildWhatsAppUrl("966598800011", "أهلاً")).toBe("https://wa.me/966598800011?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B");
    expect(buildWhatsAppUrl("", "x")).toBeNull();
  });
});

describe("data-request badges + reminders", () => {
  it("badge shows at most 2 items then +N", () => {
    expect(dataRequestBadgeLabel({ items: [{ label: "أ" }, { label: "ب" }, { label: "ج" }] })).toBe("بانتظار العميل · أ · ب +1");
    expect(dataRequestBadgeLabel({ items: [], label: "بانتظار العميل" })).toBe("بانتظار العميل");
    expect(dataRequestBadgeLabel(null)).toBeNull();
  });
  it("hours waiting + reminder threshold", () => {
    expect(hoursWaitingLabel(0.5)).toBe("قبل قليل");
    expect(hoursWaitingLabel(30)).toBe("منذ يوم");
    expect(hoursWaitingLabel(5)).toBe("منذ 5 ساعة");
    expect(hoursWaitingLabel(72)).toBe("منذ 3 أيام");
    expect(needsReminder({ hours_waiting: 25 })).toBe(true);
    expect(needsReminder({ hours: 3 })).toBe(false);
  });
  it("default selection = all items of the section from the catalogue", () => {
    const catalogue = { sections: [{ key: "tenant", items: [{ key: "a" }, { key: "b" }] }] };
    expect(defaultSelectionForSection(catalogue, "tenant")).toEqual(["a", "b"]);
    expect(defaultSelectionForSection(catalogue, "lessor")).toEqual([]);
  });
});
