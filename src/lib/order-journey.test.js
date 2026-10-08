import { describe, expect, it } from "vitest";
import { buildOrderJourney } from "./order-journey";

describe("buildOrderJourney (د10)", () => {
  it("unpaid new order → current step is payment", () => {
    const j = buildOrderJourney({ status_key: "new", is_paid: false });
    expect(j.currentKey).toBe("paid");
    expect(j.steps.every((s) => !s.done)).toBe(true);
  });

  it("paid + under review → current is receive; who/when from history", () => {
    const j = buildOrderJourney({
      status_key: "under_review",
      is_paid: true,
      payments: [{ status: "success", paid_at: "2026-10-08T15:59:09+03:00" }],
      status_timeline: [{ status: "under_review", created_at: "2026-10-08T16:00:00+03:00" }],
    });
    expect(j.steps.find((s) => s.key === "paid")).toMatchObject({ done: true, who: "العميل" });
    expect(j.steps.find((s) => s.key === "under_review")).toMatchObject({ done: true, at: "2026-10-08T16:00:00+03:00" });
    expect(j.currentKey).toBe("received");
  });

  it("draft sent by an employee → draft done with actor, current is notarize", () => {
    const j = buildOrderJourney({
      status_key: "whatsapp_draft",
      is_paid: true,
      is_received: true,
      ejar_contract_draft_number: "778899",
      activities: [
        { action: "stage_received", actor_type: "employee", actor_name: "سارة", at: "2026-10-09T10:00:00+03:00" },
        { action: "stage_draft_sent", actor_type: "employee", actor_name: "سارة", at: "2026-10-09T11:00:00+03:00" },
      ],
    });
    const draft = j.steps.find((s) => s.key === "draft_sent");
    expect(draft).toMatchObject({ done: true, who: "سارة", note: "رقم المسودة 778899" });
    expect(j.steps.find((s) => s.key === "received").who).toBe("سارة");
    expect(j.currentKey).toBe("notarized");
  });

  it("side states stop the journey", () => {
    const j = buildOrderJourney({ status_key: "on_hold", is_paid: true });
    expect(j.sideState).toBe("on_hold");
    expect(j.currentKey).toBe(null);
  });

  it("legacy completed order without history marks all steps done", () => {
    const j = buildOrderJourney({ status_key: "completed", is_paid: true });
    expect(j.steps.every((s) => s.done)).toBe(true);
    expect(j.progress).toBe(100);
  });
});
