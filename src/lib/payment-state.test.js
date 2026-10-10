import { describe, expect, it } from "vitest";
import { buildLabel, normalizePaymentState, paymentBreakdown, sar, transactionMeta } from "./payment-state";

describe("normalizePaymentState (دفعة هـ — 2.1)", () => {
  it("maps the five chip states to Arabic labels + tones (server label wins)", () => {
    const cases = [
      [{ status: "unpaid", due_total: 249 }, "غير مدفوع · 249 ر.س", "danger"],
      [{ status: "paid", method: "moyasar", paid_total: 279 }, "مدفوع · Moyasar · 279 ر.س", "success"],
      [{ status: "paid", method: "bank_transfer", paid_total: 264 }, "مدفوع · حوالة · 264 ر.س", "success"],
      [{ status: "partially_paid", paid_total: 249, due_total: 324 }, "مدفوع جزئياً · 249 من 324 ر.س", "warning"],
      [{ status: "partially_refunded", paid_total: 279, refunded_total: 100 }, "مسترجع جزئياً · 100 من 279 ر.س", "neutral"],
      [{ status: "refunded", paid_total: 279, refunded_total: 279 }, "مسترجع · 279 ر.س", "neutral"],
    ];
    for (const [ps, label, tone] of cases) {
      const s = normalizePaymentState({ payment_state: ps });
      expect(s.label).toBe(label);
      expect(s.tone).toBe(tone);
    }
    expect(normalizePaymentState({ payment_state: { status: "paid", label: "من الخادم" } }).label).toBe("من الخادم");
    expect(normalizePaymentState({ payment_state: { status: "paid", method: "mixed" } }).method_label).toBe("Moyasar + حوالة");
  });

  it("awaiting_charge + can_notarize come from the server", () => {
    const s = normalizePaymentState({
      payment_state: { status: "partially_paid", pending_charges_count: 1, pending_charges_total: 75, can_notarize: false, notarize_block_reason: "charge_pending" },
    });
    expect(s.awaiting_charge).toBe(true);
    expect(s.can_notarize).toBe(false);
    expect(s.notarize_block_reason).toBe("charge_pending");
    expect(normalizePaymentState({ payment_state: { status: "paid", is_paid: true } }).is_paid).toBe(true);
  });

  it("legacy orders without payment_state fall back to is_paid/amount_payment", () => {
    const unpaid = normalizePaymentState({ is_paid: 0, amount_payment: 249 });
    expect(unpaid.status).toBe("unpaid");
    expect(unpaid.can_notarize).toBe(false);
    expect(unpaid.notarize_block_reason).toBe("payment_required");
    const paid = normalizePaymentState({ is_paid: 1, amount_payment: 279 });
    expect(paid).toMatchObject({ status: "paid", paid_total: 279, outstanding: 0, can_notarize: true });
  });

  it("buildLabel / sar formatting", () => {
    expect(sar(1234.5)).toBe("1,234.5 ر.س");
    expect(buildLabel("paid", null, 100, 100, 0)).toBe("مدفوع · 100 ر.س");
  });
});

describe("paymentBreakdown (قائمة الشارة)", () => {
  const order = {
    payment_state: { status: "partially_paid", paid_total: 249, due_total: 324, refunded_total: 0, net_total: 249 },
    payment_details: {
      lines: [
        { key: "fee", label: "رسوم توثيق", amount: 249, kind: "fee" },
        { key: "price_difference_6", label: "فرق سعر", amount: 75, kind: "price_difference", charge_id: 6 },
      ],
      transactions: [
        { id: 95, kind: "original", amount: 249, method: "moyasar", method_label: "Moyasar", brand: "mada", card_last4: "4821", paid_at: "2026-10-09T22:02:00+03:00", status: "success" },
      ],
      invoice_number: "INV-308",
      invoice_url: "http://localhost:8010/api/v2/invoices/print/308?expires=1&signature=x",
      totals: { original: 249, extra: 75, refunded: 0, net: 324, due: 324, outstanding: 75, refund_due: 0 },
    },
  };
  it("exposes lines, totals, invoice url and the original transaction", () => {
    const b = paymentBreakdown(order);
    expect(b.lines).toHaveLength(2);
    expect(b.totals).toMatchObject({ original: 249, extra: 75, refunded: 0, net: 324, outstanding: 75 });
    expect(b.invoice_url).toContain("/invoices/print/308");
    expect(b.original.id).toBe(95);
    expect(transactionMeta(b.original, b.invoice_number)).toBe("Moyasar · بطاقة mada •••• 4821 · 09/10/2026 22:02 · فاتورة INV-308");
  });
  it("works for legacy orders without payment_details", () => {
    const b = paymentBreakdown({ is_paid: 1, amount_payment: 264 });
    expect(b.lines).toEqual([]);
    expect(b.totals.net).toBe(264);
    expect(b.invoice_url).toBeNull();
  });
  it("bank transfer transaction meta mentions reference and employee", () => {
    expect(transactionMeta({ kind: "bank_transfer", method: "bank_transfer", brand: "bank", reference: "TRF-1", employee: { name: "أدمن" } })).toBe("حوالة · مرجع TRF-1 · سجّلها أدمن");
  });
});

describe("QA WEB-5 — refund_pending", () => {
  it("شارة «مسترجع — بانتظار إعادة المبلغ» بدل «مدفوع»", async () => {
    const { normalizePaymentState } = await import("./payment-state");
    const s = normalizePaymentState({ payment_state: { status: "paid", paid_total: 1992, refund_pending: true, refund_pending_amount: 1992, refund_pending_label: "مسترجع — بانتظار إعادة المبلغ · 1992 ر.س" } });
    expect(s.label).toBe("مسترجع — بانتظار إعادة المبلغ · 1992 ر.س");
    expect(s.tone).toBe("warning");
    expect(s.refund_pending).toBe(true);
    const plain = normalizePaymentState({ payment_state: { status: "paid", paid_total: 10, label: "مدفوع · 10 ر.س" } });
    expect(plain.label).toBe("مدفوع · 10 ر.س");
  });
});
