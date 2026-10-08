import { describe, expect, it } from "vitest";

import {
  buildDraftWhatsAppText,
  buildDraftWhatsAppUrl,
  findNotarizeStatus,
  findSendDraftStatus,
  isSendDraftStatus,
  statusRequiresDraftFirst,
} from "./draft-rule";

const STATUSES = [
  { id: 3, name: "مكتمل" },
  { id: 8, name: "إرسال مسودة العقد لكم عبر واتساب" },
  { id: 9, name: "توثيق العقد في إيجار" },
];

describe("draft-before-notarize rule (ف2) in the dashboard", () => {
  it("finds the send-draft and notarize statuses by status_case, then by id", () => {
    expect(findSendDraftStatus(STATUSES)?.id).toBe(8);
    expect(findNotarizeStatus(STATUSES)?.id).toBe(9);
    const byCase = [{ id: 21, name: "مسودة", status_case: { key: "send_draft" } }];
    expect(findSendDraftStatus(byCase)?.id).toBe(21);
  });

  it("flags notarize and «مكتمل» as needing the draft first", () => {
    expect(statusRequiresDraftFirst({ id: 9, name: "توثيق العقد في إيجار" })).toBe(true);
    expect(statusRequiresDraftFirst({ id: 3, name: "مكتمل" })).toBe(true);
    expect(statusRequiresDraftFirst({ id: 2, name: "قيد المراجعة" })).toBe(false);
    expect(isSendDraftStatus({ id: 8 })).toBe(true);
    expect(isSendDraftStatus({ id: 9 })).toBe(false);
  });

  it("WhatsApp text promises no notarization before the customer reviews the draft", () => {
    const text = buildDraftWhatsAppText("201425");
    expect(text).toContain("#201425");
    expect(text).toContain("لن نوثّق العقد في إيجار إلا بعد اطلاعك عليها");
  });

  it("sends to the alternate number when chosen, otherwise to the customer", () => {
    const order = { uuid: "201425", user: { mobile: "0551112233" }, step3: { tenant_mobile: "0559876543" } };
    expect(buildDraftWhatsAppUrl(order)).toMatch(/^https:\/\/wa\.me\/966551112233\?text=/);
    expect(
      buildDraftWhatsAppUrl(order, { contact_number_mode: "another", contact_number: "0500000001" })
    ).toMatch(/^https:\/\/wa\.me\/966500000001\?/);
    expect(buildDraftWhatsAppUrl({ uuid: "1" })).toBeNull();
  });
});
