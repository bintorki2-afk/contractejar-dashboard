import { describe, expect, it } from "vitest";
import { renderTemplateLocally, unknownPlaceholders, SAMPLE_TEMPLATE_VARS } from "@/src/hooks/use-message-templates";

describe("message templates rendering (د20/د26)", () => {
  const placeholders = [{ token: "{order}" }, { token: "{name}" }, { token: "{link}" }, { token: "{amount}" }];
  it("replaces known tokens with sample values", () => {
    expect(renderTemplateLocally("مرحباً {name}، طلبك {order} بمبلغ {amount} ر.س", SAMPLE_TEMPLATE_VARS)).toBe(
      "مرحباً محمد، طلبك 123456 بمبلغ 249 ر.س"
    );
  });
  it("keeps unknown tokens and reports them", () => {
    expect(renderTemplateLocally("{foo} {order}", { order: "1" })).toBe("{foo} 1");
    expect(unknownPlaceholders("{foo} {order} {bar_baz}", placeholders)).toEqual(["foo", "bar_baz"]);
  });
});
