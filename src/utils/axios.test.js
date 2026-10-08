import { describe, expect, it } from "vitest";

import { SERVER_ERROR_MESSAGE, sanitizeServerErrorMessage } from "./axios";

describe("server error messages shown in toasts", () => {
  it("hides internal exception text from 5xx responses", () => {
    const error = { response: { status: 500, data: { message: "حدث خطأ: SQLSTATE[23000] Integrity constraint ... /var/www/app" } } };
    sanitizeServerErrorMessage(error);
    expect(error.response.data.message).toBe(SERVER_ERROR_MESSAGE);
    expect(error.response.data.server_message).toContain("SQLSTATE");
  });

  it("keeps business messages of 4xx responses (validation, permission)", () => {
    const error = { response: { status: 422, data: { message: "لا يمكن توثيق العقد قبل إرسال المسودة للعميل عبر واتساب" } } };
    sanitizeServerErrorMessage(error);
    expect(error.response.data.message).toBe("لا يمكن توثيق العقد قبل إرسال المسودة للعميل عبر واتساب");
  });

  it("ignores network errors without a response", () => {
    expect(() => sanitizeServerErrorMessage({ message: "Network Error" })).not.toThrow();
  });
});
