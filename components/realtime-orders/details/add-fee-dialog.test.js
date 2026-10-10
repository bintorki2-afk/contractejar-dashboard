import { describe, expect, it } from "vitest";
import { parseFeeAmount } from "./add-fee-dialog";

describe("parseFeeAmount (QA DASH-14/15)", () => {
  it("يرفض السالب بدل تحويله صامتاً إلى موجب", () => {
    expect(parseFeeAmount("-50").error).toMatch(/سالب/);
    expect(parseFeeAmount("−50").error).toMatch(/سالب/);
  });
  it("يرفض الفارغ والصفر والنص", () => {
    expect(parseFeeAmount("").error).toBe("أدخل مبلغ الرسوم");
    expect(parseFeeAmount("0").error).toMatch(/أكبر من صفر/);
    expect(parseFeeAmount("abc").error).toBeTruthy();
    expect(parseFeeAmount("1.2.3").error).toBeTruthy();
  });
  it("يقبل الأرقام العربية والفاصلة العشرية", () => {
    expect(parseFeeAmount("١٢٠").value).toBe(120);
    expect(parseFeeAmount("75٫5").value).toBe(75.5);
  });
});
