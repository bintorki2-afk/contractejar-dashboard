import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DelayBadge, StatusPill } from "./status-pill";
import OrderStatusTabs from "./order-status-tabs";

describe("StatusPill / DelayBadge (د26)", () => {
  it("labels by status_key, «تم الدفع» for a paid new order", () => {
    render(<StatusPill order={{ status_key: "new", is_paid: true, status: { name: "جديد" } }} />);
    expect(screen.getByText("تم الدفع")).toBeInTheDocument();
  });
  it("keeps the server name in the title when it differs", () => {
    render(<StatusPill order={{ status_key: "ejar_authenticated", status_name: "توثيق العقد في إيجار" }} />);
    expect(screen.getByTitle("توثيق العقد في إيجار")).toHaveTextContent("موثّق في إيجار");
  });
  it("delay badge only when flagged", () => {
    const { container, rerender } = render(<DelayBadge order={{ delay_flags: [] }} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<DelayBadge order={{ delay_flags: ["paid_not_received"], delay_labels: ["مدفوع ولم يُستلم (+ساعتين)"] }} />);
    expect(screen.getByText("مدفوع ولم يُستلم (+ساعتين)")).toBeInTheDocument();
  });
});

describe("OrderStatusTabs (د1)", () => {
  it("renders counts and reports the chosen tab", async () => {
    const onChange = vi.fn();
    render(
      <OrderStatusTabs
        tabs={[{ key: "all", label: "جميع الطلبات", count: 7 }, { key: "under_review", label: "قيد المراجعة", count: 2 }]}
        value="all"
        onChange={onChange}
      />
    );
    expect(screen.getByRole("tab", { name: /جميع الطلبات\s*7/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: /قيد المراجعة/ }));
    expect(onChange).toHaveBeenCalledWith("under_review");
  });
});
