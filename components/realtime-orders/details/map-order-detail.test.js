import { describe, expect, it } from "vitest";

import { mapOrderDetailView, successfulPaymentsTotal } from "./map-order-detail";

const base = (extra = {}) => ({
  id: 176,
  uuid: "814671",
  contract_summary: {},
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  total_price: { fee: 249, vat: 0, vat_label: "مجانًا", total_price: 249 },
  ...extra,
});

describe("order detail — «المبلغ المدفوع» counts successful payments only", () => {
  it("does not show a failed payment as paid (demo order 176)", () => {
    const view = mapOrderDetailView(
      base({
        is_paid: true,
        amount_payment: 895,
        payment_and_admin: {
          contract_payments: [{ id: 33, amount: 895, status: "failed" }],
        },
      })
    );
    expect(view.financial.fees).toBe("لا توجد دفعة ناجحة مسجّلة");
    expect(view.financial.fees_paid).toBe(false);
  });

  it("sums successful payments and ignores failed/pending attempts", () => {
    const orderData = base({
      is_paid: true,
      amount_payment: 359.1,
      payment_and_admin: {
        contract_payments: [
          { amount: 249, status: "failed" },
          { amount: "359.10", status: "success" },
          { amount: 100, status: "pending" },
        ],
      },
    });
    expect(successfulPaymentsTotal(orderData)).toBeCloseTo(359.1);
    const view = mapOrderDetailView(orderData);
    expect(view.financial.fees).toBeCloseTo(359.1);
    expect(view.financial.fees_paid).toBe(true);
  });

  it("keeps the server value when the payment log is not sent", () => {
    const view = mapOrderDetailView(base({ is_paid: false, amount_payment: "لم يتم الدفع" }));
    expect(view.financial.fees).toBe("لم يتم الدفع");
    expect(view.financial.fees_paid).toBe(false);
  });
});

describe("order detail — guest customer's WhatsApp", () => {
  it("shows user.contact_mobile in 05 format", () => {
    const view = mapOrderDetailView(base({ user: { mobile: null, contact_mobile: "00966551234567", is_guest: true } }));
    expect(view.customer_whatsapp).toBe("0551234567");
    expect(view.customer_whatsapp_dial).toBe("966551234567");
  });
});

describe("Q1 reflection fixes (دفعة د)", () => {
  it("formats stored dates with their calendar", async () => {
    const { formatCalendarDate } = await import("./map-order-detail.js");
    expect(formatCalendarDate("01-05-1448", "hijri")).toBe("01/05/1448 هـ");
    expect(formatCalendarDate("2026-11-01", "gregorian")).toBe("01/11/2026 م");
    expect(formatCalendarDate("12-07-1990")).toBe("12/07/1990 م");
    expect(formatCalendarDate(null)).toBeNull();
  });

  it("resolves contract months from the period when total_months is null (shared meter ≠ ×0)", async () => {
    const { resolveContractMonths, mapOrderDetailView } = await import("./map-order-detail.js");
    expect(resolveContractMonths({ contract_term_in_years: { id: 1, period: "سنوي" } })).toBe(12);
    expect(resolveContractMonths({ contract_term_in_years: { id: 4, period: "سنتين", months: 24 } })).toBe(24);
    expect(resolveContractMonths({ duration_years: 1, duration_months: 3 })).toBe(15);
    const view = mapOrderDetailView({
      step4: { contract_term_in_years: { id: 1, period: "سنوي" }, contract_starting_date: "01-05-1448", type_contract_starting_date: "hijri" },
      units: [{ id: 1, unit_number: "11", floor_number: "0", electricity_meter_number: "E-1", electricity_meter_ownership: "tenant", water_meter_number: "W-1", water_meter_ownership: "shared", water_shared_monthly_fee: 50 }],
    });
    expect(view.financial.shared_meters.water).toEqual({ monthly: 50, months: 12, total: 600 });
    expect(view.financial.start_date).toBe("01/05/1448 هـ");
    expect(view.units[0].floor).toBe("أرضي");
    expect(view.units[0].electricity_meter).toBe("E-1 · باسم المستأجر");
    expect(view.units[0].water_meter).toBe("W-1 · مشترك · 50 ريال/شهر");
  });

  it("exposes institution representative + DOBs", async () => {
    const { mapOrderDetailView } = await import("./map-order-detail.js");
    const view = mapOrderDetailView({
      tenant_entity: "institution", authorization_type: "owner_and_representative_of_record",
      id_num_of_property_tenant_agent: "1034567890", mobile_of_property_tenant_agent: "566667777",
      dob_of_property_tenant_agent: "10-09-1400", type_dob_tenant_agent: "hijri",
      property_owner_dob: "20-02-1975", type_dob_property_owner: "gregorian",
    });
    expect(view.tenant.rep_id).toBe("1034567890");
    expect(view.tenant.rep_dob).toBe("10/09/1400 هـ");
    expect(view.tenant.authorization).toBe("مالك السجل وممثله");
    expect(view.deed.owner_dob).toBe("20/02/1975 م");
  });
});
