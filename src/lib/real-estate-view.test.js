import { describe, expect, it } from "vitest";
import { ownerDobCells, realEstateAttachments } from "./real-estate-view";
import { isDraftRealEstate, mapRealEstateToProperty } from "@/src/hooks/use-clients";

describe("صفحة العقار في اللوحة (QA PROPS-7/9/17)", () => {
  it("تاريخ الميلاد الميلادي المخزّن في dob_hijri يُعرض تحت «ميلادي»", () => {
    expect(ownerDobCells({ DOB: null, dob_hijri: "12-05-1985", type_dob_property_owner: "gregorian" })).toEqual([
      { label: "تاريخ الميلاد (ميلادي)", value: "12-05-1985" },
    ]);
    expect(ownerDobCells({ dob_hijri: "15-05-1405", type_dob_property_owner: "hijri" })[0].label).toBe("تاريخ الميلاد (هجري)");
  });

  it("المرفقات من attachments[] للخادم مع تمييز PDF، أو من الأعمدة الحقيقية", () => {
    const fromServer = realEstateAttachments({ attachments: [{ key: "image_instrument", label: "صورة الصك", url: "https://x/sig", is_pdf: true }] });
    expect(fromServer).toEqual([{ label: "صورة الصك", src: "https://x/sig", pdf: true }]);
    const fromColumns = realEstateAttachments({ image_instrument: "https://api.example/storage/deeds/a.pdf", copy_of_the_trusteeship_deed: "https://api.example/storage/deeds/b.png" });
    expect(fromColumns.map((a) => a.label)).toEqual(["صورة الصك", "صك النظارة"]);
    expect(fromColumns[0].pdf).toBe(true);
  });

  it("العقار بلا اسم مسودة مميّزة", () => {
    expect(isDraftRealEstate({ name_real_estate: null })).toBe(true);
    expect(isDraftRealEstate({ name_real_estate: "عمارة" })).toBe(false);
    expect(isDraftRealEstate({ name_real_estate: null, is_complete: true })).toBe(false);
    expect(mapRealEstateToProperty({ id: 15 }).title).toMatch(/مسودة عقار #15/);
  });
});
