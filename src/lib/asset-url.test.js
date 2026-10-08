import { describe, expect, it } from "vitest";

import { resolveBackendAssetUrl } from "./asset-url";

const opts = {
  backendOrigin: "https://api.example.com",
  currentOrigin: "https://dash.example.com",
};

describe("resolveBackendAssetUrl", () => {
  it("moves storage links that point at the dashboard to the backend", () => {
    expect(resolveBackendAssetUrl("https://dash.example.com/storage/employees/a.jpg", opts)).toBe(
      "https://api.example.com/storage/employees/a.jpg"
    );
    expect(resolveBackendAssetUrl("http://localhost:3020/storage/employees/a.jpg", opts)).toBe(
      "https://api.example.com/storage/employees/a.jpg"
    );
  });

  it("builds relative storage paths on the backend", () => {
    expect(resolveBackendAssetUrl("storage/employees/a.jpg", opts)).toBe("https://api.example.com/storage/employees/a.jpg");
    expect(resolveBackendAssetUrl("/storage/employees/a.jpg", opts)).toBe("https://api.example.com/storage/employees/a.jpg");
    expect(resolveBackendAssetUrl("users/b.png", opts)).toBe("https://api.example.com/storage/users/b.png");
  });

  it("keeps backend, external, local and inline images unchanged", () => {
    expect(resolveBackendAssetUrl("https://api.example.com/storage/a.jpg", opts)).toBe("https://api.example.com/storage/a.jpg");
    expect(resolveBackendAssetUrl("https://cdn.other.com/storage/a.jpg", opts)).toBe("https://cdn.other.com/storage/a.jpg");
    expect(resolveBackendAssetUrl("/images/defaultUser.jpg", opts)).toBe("/images/defaultUser.jpg");
    expect(resolveBackendAssetUrl("data:image/png;base64,AAA", opts)).toBe("data:image/png;base64,AAA");
  });

  it("returns null for empty values", () => {
    for (const v of [null, undefined, "", "  ", "null"]) expect(resolveBackendAssetUrl(v, opts)).toBeNull();
  });
});
