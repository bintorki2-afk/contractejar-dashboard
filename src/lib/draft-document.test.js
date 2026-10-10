import { describe, expect, it } from "vitest";
import { getDraftDocument, isPayAfterDraftOrder, validateDraftFile, withDraftAttachment } from "./draft-document";

describe("draft document (D9)", () => {
  it("validates type and size", () => {
    expect(validateDraftFile(null)).toBeTruthy();
    expect(validateDraftFile({ type: "application/pdf", size: 1000, name: "a.pdf" })).toBeNull();
    expect(validateDraftFile({ type: "image/png", size: 1000, name: "a.png" })).toBeNull();
    expect(validateDraftFile({ type: "application/zip", size: 1000, name: "a.zip" })).toContain("PDF");
    expect(validateDraftFile({ type: "application/pdf", size: 11 * 1024 * 1024, name: "a.pdf" })).toContain("10MB");
  });

  it("adds the uploaded draft first in the attachments viewer (once)", () => {
    const order = { draft_document: { url: "https://x/contracts/9/draft-document?signature=s", mime: "application/pdf", is_pdf: true, name: "draft.pdf" } };
    const list = withDraftAttachment([{ key: "deed", label: "الصك", url: "u" }], order);
    expect(list.map((a) => a.key)).toEqual(["draft_document", "deed"]);
    expect(list[0].is_pdf).toBe(true);
    expect(withDraftAttachment(list, order)).toHaveLength(2);
    expect(withDraftAttachment([], { draft_document: null })).toEqual([]);
  });

  it("reads pay_after_draft and draft_document defensively", () => {
    expect(isPayAfterDraftOrder({ pay_after_draft: true })).toBe(true);
    expect(isPayAfterDraftOrder({})).toBe(false);
    expect(getDraftDocument({ draft_document: { name: "x" } })).toBeNull();
  });
});
