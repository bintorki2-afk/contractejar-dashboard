import { describe, expect, it } from "vitest";
import {
  WORKING_HOURS_DEFAULT_TEXT,
  buildWorkingHoursPayload,
  extractPayAfterDraftEnabled,
  extractWorkingHoursSettings,
  validateWorkingHours,
} from "./site-settings";

describe("site settings — D8 working hours / D9 pay after draft", () => {
  it("reads working_hours from settings and falls back to the default text", () => {
    expect(extractWorkingHoursSettings({ data: { data: { settings: { working_hours: "نص" } } } })).toEqual({ working_hours: "نص", effective: "نص" });
    expect(extractWorkingHoursSettings({ data: { data: {} } }).effective).toBe(WORKING_HOURS_DEFAULT_TEXT);
  });
  it("validates and trims the payload", () => {
    expect(validateWorkingHours("  ")).toBeTruthy();
    expect(validateWorkingHours("x".repeat(501))).toBeTruthy();
    expect(validateWorkingHours("يومياً")).toBeNull();
    expect(buildWorkingHoursPayload("  يومياً  ")).toEqual({ working_hours: "يومياً" });
  });
  it("pay_after_draft_enabled defaults to false", () => {
    expect(extractPayAfterDraftEnabled({ data: { data: { settings: {} } } })).toBe(false);
    expect(extractPayAfterDraftEnabled({ data: { data: { settings: { pay_after_draft_enabled: true } } } })).toBe(true);
    expect(extractPayAfterDraftEnabled({ data: { data: { settings: { pay_after_draft_enabled: 0 } } } })).toBe(false);
  });
});
