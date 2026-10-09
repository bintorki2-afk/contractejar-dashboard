import { describe, expect, it } from "vitest";
import { formatDurationHours, formatDurationMinutes } from "./format-duration";

describe("formatDurationMinutes (د6)", () => {
  it("formats minutes/hours/days", () => {
    expect(formatDurationMinutes(45)).toBe("45 د");
    expect(formatDurationMinutes(200)).toBe("3 س و 20 د");
    expect(formatDurationMinutes(1381 * 60 + 5)).toBe("57 يوم و 13 س");
  });
  it("hours helper handles null", () => {
    expect(formatDurationHours(null)).toBe("—");
    expect(formatDurationHours(10)).toBe("10 س");
  });
});
