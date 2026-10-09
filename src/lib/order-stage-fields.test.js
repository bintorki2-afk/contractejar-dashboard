import { describe, expect, it } from "vitest";
import {
  buildStageBody,
  initialStageValues,
  isStageFieldRequired,
  isStageFieldVisible,
  validateStageValues,
} from "@/components/realtime-orders/details/stage-fields";

const SAMPLE_FIELDS = [
  { name: "deed_number", type: "string", required: true, label_ar: "رقم الصك" },
  { name: "contact_number_mode", type: "select", required: true, label_ar: "رقم التواصل", options: [{ value: "same", label_ar: "نفس الرقم" }, { value: "another", label_ar: "رقم آخر" }] },
  { name: "contact_number", type: "string", required: false, required_if: ["contact_number_mode", "another"], label_ar: "رقم التواصل الجديد" },
];

describe("stage fields (د16)", () => {
  it("defaults selects to their first option", () => {
    expect(initialStageValues(SAMPLE_FIELDS)).toEqual({ deed_number: "", contact_number_mode: "same", contact_number: "" });
  });
  it("required_if shows and requires the alternate number only for «رقم آخر»", () => {
    const f = SAMPLE_FIELDS[2];
    expect(isStageFieldVisible(f, { contact_number_mode: "same" })).toBe(false);
    expect(isStageFieldRequired(f, { contact_number_mode: "another" })).toBe(true);
  });
  it("validates and builds the request body", () => {
    expect(validateStageValues(SAMPLE_FIELDS, { contact_number_mode: "same" })).toHaveProperty("deed_number");
    const values = { deed_number: " 778899 ", contact_number_mode: "same", contact_number: "0500000000" };
    expect(validateStageValues(SAMPLE_FIELDS, values)).toEqual({});
    expect(buildStageBody(SAMPLE_FIELDS, values)).toEqual({ deed_number: "778899", contact_number_mode: "same" });
  });
});
