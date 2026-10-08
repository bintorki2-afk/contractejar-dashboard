import { describe, expect, it } from "vitest";

import { normalizeAdminSearch } from "./search-term";

describe("admin search term", () => {
  it("reduces every Saudi mobile format to the part shared by all stored formats", () => {
    for (const input of ["0501234508", "501234508", "966501234508", "+966501234508", "00966501234508", "050 123 4508", "٠٥٠١٢٣٤٥٠٨"]) {
      expect(normalizeAdminSearch(input)).toBe("501234508");
    }
  });

  it("leaves order numbers, names and other text unchanged (digits made Latin)", () => {
    expect(normalizeAdminSearch(" 201425 ")).toBe("201425");
    expect(normalizeAdminSearch("٢٠١٤٢٥")).toBe("201425");
    expect(normalizeAdminSearch("لطيفة")).toBe("لطيفة");
    expect(normalizeAdminSearch("1012345678")).toBe("1012345678");
    expect(normalizeAdminSearch("")).toBe("");
    expect(normalizeAdminSearch(null)).toBe("");
  });
});
