import { describe, expect, it } from "vitest";
import {
  isAutoOnlyStatus,
  manualStatusOptions,
  nextStageForRow,
  resolveOrderStatusKey,
  sortStatusTabs,
  statusKeyLabel,
  tabToOrderListParams,
} from "./order-status-keys";

describe("order status keys", () => {
  it("maps tabs to list params by status_key (never ids)", () => {
    expect(tabToOrderListParams("all")).toEqual({});
    expect(tabToOrderListParams("incomplete")).toEqual({ tab: "incomplete" });
    expect(tabToOrderListParams("under_review")).toEqual({ status_key: "under_review" });
    expect(tabToOrderListParams("new")).toEqual({ status_key: "new" });
    expect(tabToOrderListParams("paid")).toEqual({ status_key: "paid" });
  });

  it("labels: «قيد المراجعة» is the post-payment review, «مسترجع» is refunded", () => {
    expect(statusKeyLabel("under_review")).toBe("قيد المراجعة");
    expect(statusKeyLabel("refunded")).toBe("مسترجع");
    expect(statusKeyLabel("unknown_key", "اسم الخادم")).toBe("اسم الخادم");
  });

  it("a paid «new» order shows as «تم الدفع»", () => {
    expect(resolveOrderStatusKey({ status_key: "new", is_paid: true })).toBe("paid");
    expect(resolveOrderStatusKey({ status_key: "new", is_paid: false })).toBe("new");
  });

  it("sorts tabs along the flow with «غير مكتمل» last", () => {
    const sorted = sortStatusTabs([{ key: "incomplete" }, { key: "completed" }, { key: "paid" }, { key: "all" }, { key: "under_review" }, { key: "new" }]);
    expect(sorted.map((t) => t.key)).toEqual(["all", "new", "paid", "under_review", "completed", "incomplete"]);
  });

  it("next stage for a list row", () => {
    expect(nextStageForRow({ status_key: "under_review", is_paid: true, is_received: false })).toBe("received");
    expect(nextStageForRow({ status_key: "received_by_employee", is_paid: true, is_received: true })).toBe("notarized");
    expect(nextStageForRow({ status_key: "new", is_paid: false })).toBe(null);
    expect(nextStageForRow({ status_key: "completed", is_paid: true })).toBe(null);
  });

  it("D1: legacy «received» is labelled and merged as «مستلم من الموظف»", () => {
    expect(statusKeyLabel("received")).toBe("مستلم من الموظف");
    const sorted = sortStatusTabs([{ key: "received", count: 0 }, { key: "received_by_employee" }, { key: "whatsapp_draft" }, { key: "all" }]);
    expect(sorted.map((t) => t.key)).toEqual(["all", "received_by_employee"]);
  });

  it("D2: «مسترجع» cannot be chosen manually and legacy keys are hidden", () => {
    const opts = manualStatusOptions([
      { id: 1, name: "جديد", status_key: "new" },
      { id: 6, name: "مستلم", status_key: "received" },
      { id: 7, name: "مستلم من الموظف", status_key: "received_by_employee" },
      { id: 11, name: "مسترجع", status_key: "refunded" },
    ]);
    expect(opts.map((s) => s.id)).toEqual([1, 7, 11]);
    expect(opts.find((s) => s.id === 11).manualDisabled).toBe(true);
    expect(opts.find((s) => s.id === 11).manualHint).toContain("ميسر");
    expect(opts.find((s) => s.id === 7).manualDisabled).toBeUndefined();
    expect(isAutoOnlyStatus({ name: "مسترجع" })).toBe(true);
    expect(isAutoOnlyStatus({ name: "قيد المراجعة", status_key: "under_review" })).toBe(false);
  });
});
