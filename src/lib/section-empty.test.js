import { describe, expect, it } from "vitest";
import { isSectionEmpty } from "@/components/content/section-empty-note";

describe("content section empty state (د5)", () => {
  it("treats missing/blank sections as empty", () => {
    expect(isSectionEmpty(null)).toBe(true);
    expect(isSectionEmpty({})).toBe(true);
    expect(isSectionEmpty({ id: 3, main_title: "", cards: [] })).toBe(true);
    expect(isSectionEmpty({ main_title: "لماذا عقدي؟" })).toBe(false);
    expect(isSectionEmpty({ cards: [{ title: "ثقة" }] })).toBe(false);
  });
});
