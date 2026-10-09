import { describe, expect, it } from "vitest";
import { buildAutoAssignPayload, extractAutoAssignSettings } from "./site-settings";

describe("auto-assign settings (د15)", () => {
  it("reads data.auto_assign and builds the POST payload", () => {
    const s = extractAutoAssignSettings({ data: { auto_assign: { enabled: true, strategy: "least_load", employee_ids: ["4"], eligible_employees: [{ id: 4, name: "خالد" }] } } });
    expect(s.form).toEqual({ enabled: true, strategy: "least_load", employee_ids: [4] });
    expect(s.eligible).toHaveLength(1);
    expect(buildAutoAssignPayload(s.form)).toEqual({ auto_assign_orders: true, auto_assign_strategy: "least_load", auto_assign_employee_ids: [4] });
  });
  it("defaults safely", () => {
    const s = extractAutoAssignSettings({});
    expect(s.form.enabled).toBe(false);
    expect(s.strategies.map((x) => x.value)).toEqual(["round_robin", "least_load"]);
  });
});
