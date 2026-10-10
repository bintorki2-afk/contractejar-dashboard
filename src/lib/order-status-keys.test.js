import { describe, expect, it } from "vitest";
import {
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
});
