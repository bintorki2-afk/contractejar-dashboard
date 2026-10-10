import { describe, expect, it } from "vitest";

import {
  getAllOrdersExtraFilterStatuses,
  resolveCanceledContractStatusId,
  resolveNewContractStatusId,
  resolveReceivedContractStatusId,
  resolveReturnedContractStatusId,
} from "./contract-statuses";
import {
  isOrderInReturnStatus,
  isReturnContractOrder,
  isReturnContractStatus,
} from "@/components/analysis/returned/refund-contract-utils";

// جدول الحالات كما في قاعدة «عقدي» (لا توجد حالة «استرجاع»؛ 2 = «قيد المراجعة»).
const SEEDED = [
  { id: 1, name: "جديد" },
  { id: 2, name: "قيد المراجعة" },
  { id: 3, name: "مكتمل" },
  { id: 4, name: "ملغى" },
  { id: 5, name: "معلق" },
  { id: 6, name: "مستلم" },
  { id: 7, name: "مستلم من الموظف" },
  { id: 8, name: "إرسال مسودة العقد لكم عبر واتساب" },
  { id: 9, name: "توثيق العقد في إيجار" },
];

describe("contract statuses are resolved by name, never by a guessed id", () => {
  it("resolves the main statuses from the seeded table", () => {
    expect(resolveNewContractStatusId(SEEDED)).toBe(1);
    // D1: «مستلم» دُمجت مع «مستلم من الموظف».
    expect(resolveReceivedContractStatusId(SEEDED)).toBe(7);
    expect(resolveReceivedContractStatusId(SEEDED.filter((s) => s.id !== 7))).toBe(6);
    expect(
      resolveReceivedContractStatusId([{ id: 6, name: "مستلم", status_key: "received" }, { id: 9, name: "استلمه موظف", status_key: "received_by_employee" }])
    ).toBe(9);
    expect(resolveCanceledContractStatusId(SEEDED)).toBe(4);
  });

  it("has no «returned» status when none is named استرجاع (id 2 is «قيد المراجعة»)", () => {
    expect(resolveReturnedContractStatusId(SEEDED)).toBeNull();
    expect(resolveReturnedContractStatusId([...SEEDED, { id: 12, name: "استرجاع" }])).toBe(12);
  });

  it("«قيد المراجعة» is a normal status, not a refund request", () => {
    expect(isReturnContractStatus({ id: 2, name: "قيد المراجعة" })).toBe(false);
    expect(isReturnContractStatus({ id: 12, name: "استرجاع" })).toBe(true);
    expect(isReturnContractStatus({ id: 13, name: "طلب مسترجع" })).toBe(true);

    const underReview = { contract_status_id: 2, contract_status_name: "قيد المراجعة" };
    expect(isReturnContractOrder(underReview)).toBe(false);
    expect(isOrderInReturnStatus(underReview)).toBe(false);
    expect(isReturnContractOrder({ return_contract: true })).toBe(true);
  });

  it("keeps «قيد المراجعة» in the extra status filter of «جميع الطلبات»", () => {
    const names = getAllOrdersExtraFilterStatuses(SEEDED).map((s) => s.name);
    expect(names).toContain("قيد المراجعة");
    expect(names).not.toContain("ملغى");
  });
});
