import { describe, expect, it } from "vitest";
import {
  buildStageBody,
  initialStageValues,
  isStageFieldRequired,
  isStageFieldVisible,
  validateStageValues,
} from "@/components/realtime-orders/details/order-stage-bar";

const DRAFT_FIELDS = [
  { name: "ejar_contract_draft_number", type: "string", required: true, label_ar: "رقم مسودة عقد إيجار" },
  { name: "contact_number_mode", type: "select", required: true, label_ar: "رقم التواصل", options: [{ value: "same", label_ar: "نفس الرقم" }, { value: "another", label_ar: "رقم آخر" }] },
  { name: "contact_number", type: "string", required: false, required_if: ["contact_number_mode", "another"], label_ar: "رقم التواصل الجديد" },
];

describe("stage fields (د16)", () => {
  it("defaults selects to their first option", () => {
    expect(initialStageValues(DRAFT_FIELDS)).toEqual({ ejar_contract_draft_number: "", contact_number_mode: "same", contact_number: "" });
  });
  it("required_if shows and requires the alternate number only for «رقم آخر»", () => {
    const f = DRAFT_FIELDS[2];
    expect(isStageFieldVisible(f, { contact_number_mode: "same" })).toBe(false);
    expect(isStageFieldRequired(f, { contact_number_mode: "another" })).toBe(true);
  });
  it("validates and builds the request body", () => {
    expect(validateStageValues(DRAFT_FIELDS, { contact_number_mode: "same" })).toHaveProperty("ejar_contract_draft_number");
    const values = { ejar_contract_draft_number: " 778899 ", contact_number_mode: "same", contact_number: "0500000000" };
    expect(validateStageValues(DRAFT_FIELDS, values)).toEqual({});
    expect(buildStageBody(DRAFT_FIELDS, values)).toEqual({ ejar_contract_draft_number: "778899", contact_number_mode: "same" });
  });
});
