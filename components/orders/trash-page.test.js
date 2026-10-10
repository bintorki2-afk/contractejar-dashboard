import { describe, expect, it } from "vitest";
import { extractRealEstatesTrash } from "./trash-page";

describe("real-estates trash (D6)", () => {
  it("reads { real_estates, units } directly or nested in data", () => {
    const payload = { real_estates: [{ id: 1, name_real_estate: "عمارة", days_left: 20 }], units: [{ id: 5, unit_number: "3" }] };
    expect(extractRealEstatesTrash(payload).realEstates).toHaveLength(1);
    expect(extractRealEstatesTrash({ data: payload }).units[0].id).toBe(5);
    expect(extractRealEstatesTrash(undefined)).toEqual({ realEstates: [], units: [], retention: 30 });
  });
});
