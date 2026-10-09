import { describe, expect, it } from "vitest";
import { isTypingTarget, shortcutFromEvent } from "@/src/hooks/use-orders-shortcuts";

const ev = (o) => ({ ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, key: "", code: "", ...o });

describe("orders keyboard shortcuts (د19)", () => {
  it("maps physical keys (works with an Arabic layout too)", () => {
    expect(shortcutFromEvent(ev({ code: "KeyJ", key: "ت" }))).toBe("next");
    expect(shortcutFromEvent(ev({ code: "KeyK", key: "ن" }))).toBe("prev");
    expect(shortcutFromEvent(ev({ code: "KeyW", key: "ص" }))).toBe("whatsapp");
    expect(shortcutFromEvent(ev({ code: "KeyS", key: "س" }))).toBe("stage");
    expect(shortcutFromEvent(ev({ key: "Enter", code: "Enter" }))).toBe("open");
    expect(shortcutFromEvent(ev({ key: "/", code: "Slash" }))).toBe("search");
    expect(shortcutFromEvent(ev({ key: "?", code: "Slash", shiftKey: true }))).toBe("help");
  });
  it("ignores modified keys and typing targets", () => {
    expect(shortcutFromEvent(ev({ code: "KeyS", ctrlKey: true }))).toBe(null);
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
  });
});
