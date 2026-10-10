import { describe, expect, it } from "vitest";
import { financialSection, furnishingTypeLabel, propertySection, unitCells } from "./order-detail-view";

const keys = (rows) => rows.flat().map((c) => c.key);

describe("propertySection — العنوان الوطني (QA DASH-4 / ORDERS-RES-6)", () => {
  it("يعرض الحي/الشارع/المبنى/الإضافي/الرمز في وضع الخريطة عندما يرسلها الخادم", () => {
    const p = propertySection({
      address_entry_mode: "map",
      address: {
        region: "الرياض",
        city: "الدوادمي",
        district: "النسيم",
        street: "طريق الأمير محمد بن سلمان",
        building_no: "1422",
        additional_no: "7012",
        postal_code: "12347",
        map_url: "https://maps.google.com/?q=1,2",
        lat: 1,
        lng: 2,
      },
    });
    expect(p.addressMode).toBe("map");
    expect(keys(p.addressRows)).toEqual(
      expect.arrayContaining(["region", "city", "map_url", "coords", "district", "street", "building_no", "additional_no", "postal_code"])
    );
  });

  it("بلا أي بيانات عنوان لا يدّعي «إدخال يدوي»", () => {
    const p = propertySection({ address: { region: null, city: null } });
    expect(p.addressMode).toBe("none");
    expect(p.addressRows).toEqual([]);
    expect(p.addressNote).toMatch(/لا يوجد عنوان وطني/);
  });

  it("الإدخال اليدوي يبقى كما هو", () => {
    const p = propertySection({ address: { region: "الجوف", city: "سكاكا", district: "العليا", building_no: "1234" } });
    expect(p.addressMode).toBe("manual");
    expect(keys(p.addressRows)).toEqual(["region", "city", "district", "building_no"]);
  });
});

describe("نوع التأثيث (QA ORDERS-RES-7)", () => {
  it("يحوّل قيم الموقع إلى جديد/مستعمل", () => {
    expect(furnishingTypeLabel("1")).toBe("جديد");
    expect(furnishingTypeLabel(true)).toBe("جديد");
    expect(furnishingTypeLabel("new")).toBe("جديد");
    expect(furnishingTypeLabel("0")).toBe("مستعمل");
    expect(furnishingTypeLabel("used")).toBe("مستعمل");
    expect(furnishingTypeLabel(null)).toBeNull();
  });

  it("خلية «مؤثثة» تحمل النوع حتى لو كانت تسمية الخادم «نعم» فقط", () => {
    const cells = unitCells({ furnished: true, furnished_label: "نعم", type_furnished: "1" });
    expect(cells.find((c) => c.key === "furnished").value).toBe("مؤثثة ✓ · جديد");
    const used = unitCells({ furnished: true, furnished_label: "نعم — أثاث مستعمل" });
    expect(used.find((c) => c.key === "furnished").value).toBe("مؤثثة ✓ · مستعمل");
  });
});

describe("financialSection (QA ORDERS-RES-8 / ORDERS-RES-19)", () => {
  it("العداد المشترك يعرض البند الكامل من الخادم (شهري × أشهر = إجمالي)", () => {
    const f = financialSection({
      units: [{ meters: [{ kind: "electricity", shared: true, monthly_amount: 200 }] }],
      shared_meters: { electricity: { monthly: 200, months: 24, total: 4800 }, water: null, total: 4800 },
    });
    const c = f.rows.flat().find((x) => x.key === "electricity_shared");
    expect(c.value).toBe("مشترك · 200 ر.س/شهر × 24 شهراً = 4,800 ر.س");
  });

  it("يخفي العربون/الضمان/الغرامة الصفرية", () => {
    const f = financialSection({ deposit: "0", Guarantee_amount: 0, daily_fine: "150" });
    const k = keys(f.rows);
    expect(k).not.toContain("deposit");
    expect(k).not.toContain("guarantee");
    expect(k).toContain("daily_fine");
  });
});
