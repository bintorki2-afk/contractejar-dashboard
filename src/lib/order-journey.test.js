import { describe, expect, it } from "vitest";
import { buildOrderJourney, JOURNEY_STEPS } from "./order-journey";

describe("buildOrderJourney (دفعة هـ — 3 خطوات)", () => {
  it("has exactly 3 steps and no draft step", () => {
    expect(JOURNEY_STEPS.map((s) => s.key)).toEqual(["under_review", "received_by_employee", "ejar_authenticated"]);
    expect(JOURNEY_STEPS.some((s) => /مسودة/.test(s.label))).toBe(false);
  });

  it("uses the server journey[] when present (who/when per step, current step)", () => {
    const j = buildOrderJourney({
      status_key: "received_by_employee",
      deed_number: null,
      journey: [
        { step: 1, key: "under_review", label: "قيد المراجعة", done: true, current: false, at: "2026-10-09T22:02:37+03:00", by: null },
        { step: 2, key: "received_by_employee", label: "مستلم من الموظف", done: true, current: false, at: "2026-10-09T22:10:00+03:00", by: "أحمد" },
        { step: 3, key: "ejar_authenticated", label: "تم التوثيق", done: false, current: true, at: null, by: null },
      ],
      journey_side_state: null,
    });
    expect(j.steps).toHaveLength(3);
    expect(j.steps[0]).toMatchObject({ done: true, who: "بعد الدفع" });
    expect(j.steps[1]).toMatchObject({ done: true, who: "أحمد", at: "2026-10-09T22:10:00+03:00" });
    expect(j.currentKey).toBe("ejar_authenticated");
    expect(j.progress).toBe(67);
    expect(j.sideState).toBeNull();
  });

  it("unpaid new order → current step is «قيد المراجعة» (nothing done)", () => {
    const j = buildOrderJourney({ status_key: "new", is_paid: false });
    expect(j.currentKey).toBe("under_review");
    expect(j.steps.every((s) => !s.done)).toBe(true);
  });

  it("legacy fallback: paid + under review → current is receive", () => {
    const j = buildOrderJourney({
      status_key: "under_review",
      is_paid: true,
      payments: [{ status: "success", paid_at: "2026-10-08T15:59:09+03:00" }],
      status_timeline: [{ status: "under_review", created_at: "2026-10-08T16:00:00+03:00" }],
    });
    expect(j.steps.find((s) => s.key === "under_review")).toMatchObject({ done: true, at: "2026-10-08T16:00:00+03:00" });
    expect(j.currentKey).toBe("received_by_employee");
  });

  it("legacy whatsapp_draft key is treated as received (no draft step)", () => {
    const j = buildOrderJourney({ status_key: "whatsapp_draft", is_paid: true, is_received: true });
    expect(j.currentKey).toBe("ejar_authenticated");
    expect(j.steps.map((s) => s.key)).not.toContain("draft_sent");
  });

  it("side states (server) stop the journey with their label and tone", () => {
    const j = buildOrderJourney({
      status_key: "refunded",
      journey: [{ key: "under_review", done: true }, { key: "received_by_employee", done: true }, { key: "ejar_authenticated", done: false }],
      journey_side_state: { key: "refunded", label: "مسترجع", color: "#64748B", at: "2026-10-09T12:00:00+03:00" },
    });
    expect(j.sideState).toBe("refunded");
    expect(j.sideStateLabel).toBe("مسترجع");
    expect(j.sideStateTone).toBe("neutral");
    expect(j.currentKey).toBe(null);
    const c = buildOrderJourney({ status_key: "cancelled", is_paid: true });
    expect(c.sideStateTone).toBe("danger");
  });

  it("legacy completed order without history marks all steps done", () => {
    const j = buildOrderJourney({ status_key: "completed", is_paid: true });
    expect(j.steps.every((s) => s.done)).toBe(true);
    expect(j.progress).toBe(100);
    expect(j.allDone).toBe(true);
  });
});
