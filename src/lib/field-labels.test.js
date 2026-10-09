import { describe, expect, it } from "vitest";
import { fieldLabel, humanizeFieldKeys } from "./field-labels";

describe("field labels (د6)", () => {
  it("maps raw keys to Arabic labels", () => {
    expect(fieldLabel("image_instrument")).toBe("صورة الصك");
    expect(fieldLabel("tenant_role_values.3")).not.toBe("");
  });
  it("humanizes server validation messages", () => {
    expect(humanizeFieldKeys("The image_instrument field must be an image.")).toContain("«صورة الصك»");
    expect(humanizeFieldKeys("حقل image_instrument مطلوب")).toBe("حقل «صورة الصك» مطلوب");
  });
});
