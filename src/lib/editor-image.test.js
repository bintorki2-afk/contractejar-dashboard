import { describe, expect, it } from "vitest";

import { dataUrlBytes, fitDimensions, EDITOR_IMAGE_MAX_BYTES } from "./editor-image";

describe("editor image helpers", () => {
  it("measures decoded bytes of a data URL", () => {
    expect(dataUrlBytes("data:image/png;base64,QUJD")).toBe(3);
    expect(dataUrlBytes("data:image/png;base64,QUI=")).toBe(2);
    expect(dataUrlBytes("data:image/png;base64,QQ==")).toBe(1);
    expect(dataUrlBytes("not a data url")).toBe(0);
    expect(dataUrlBytes(null)).toBe(0);
  });

  it("scales the longest side down to the limit keeping the ratio", () => {
    expect(fitDimensions(4000, 2000, 1600)).toEqual({ width: 1600, height: 800 });
    expect(fitDimensions(1000, 3000, 1600)).toEqual({ width: 533, height: 1600 });
    expect(fitDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("caps editor images at 300KB", () => {
    expect(EDITOR_IMAGE_MAX_BYTES).toBe(300 * 1024);
  });
});
