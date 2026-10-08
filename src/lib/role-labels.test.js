import { describe, expect, it } from "vitest";
import { roleKeyToArabic, roleLabelAr } from "./role-labels";

describe("role labels (د6)", () => {
  it("translates known role keys", () => {
    expect(roleKeyToArabic("admin")).toBe("مدير النظام");
    expect(roleKeyToArabic("customer_service")).toBe("خدمة العملاء");
    expect(roleKeyToArabic("receiver")).toBe("مستلم الطلبات");
    expect(roleKeyToArabic("مشرف")).toBe("مشرف");
  });
  it("prefers the Arabic title of a user/employee", () => {
    expect(roleLabelAr({ role: "manager", role_title: "المسؤول" })).toBe("المسؤول");
    expect(roleLabelAr({ role_relation: { name: "admin", title_ar: "مدير النظام" } })).toBe("مدير النظام");
    expect(roleLabelAr({ role_relation: { name: "manager" } })).toBe("مسؤول");
  });
});
