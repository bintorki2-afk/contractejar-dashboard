import { describe, expect, it } from "vitest";
import { attachmentIsPdf } from "./attachments-viewer";

describe("attachmentIsPdf (QA ORDERS-RES-4)", () => {
  it("يعتمد على ما يرسله الخادم لأن الروابط الموقّعة بلا امتداد", () => {
    const url = "https://api.example/api/v2/contracts/313/deed-image/image_instrument?expires=1&signature=x";
    expect(attachmentIsPdf({ url }, url)).toBe(false);
    expect(attachmentIsPdf({ url, is_pdf: true }, url)).toBe(true);
    expect(attachmentIsPdf({ url, mime: "application/pdf" }, url)).toBe(true);
    expect(attachmentIsPdf({ url, extension: ".PDF" }, url)).toBe(true);
  });

  it("يتعرّف على الامتداد في الرابط أو المسار", () => {
    expect(attachmentIsPdf({}, "https://x/storage/a.pdf?v=1")).toBe(true);
    expect(attachmentIsPdf({ path: "contracts/deeds/a.pdf" }, "https://x/sig")).toBe(true);
    expect(attachmentIsPdf({}, "https://x/storage/a.jpg")).toBe(false);
  });
});
