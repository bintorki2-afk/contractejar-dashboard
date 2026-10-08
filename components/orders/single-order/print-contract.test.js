import { afterEach, describe, expect, it, vi } from "vitest";

import { buildBatchContractPrintHtml, buildContractPrintHtml } from "./print-contract";
import { escapeHtml, printHtmlDocument, safeImageUrl } from "@/src/lib/print";

const PAYLOAD = `<img src=x onerror="parent.__xss=1">`;

function orderWithPayload() {
  return {
    uuid: `201425${PAYLOAD}`,
    user: { mobile: "0551234567" },
    contract_summary: {
      name_owner: `مالك ${PAYLOAD}`,
      contract_status_name: "جديد",
      image_instrument: "https://api.example.com/deed.jpg?a=1&b=2",
      image_instrument_from_the_front: `javascript:alert(1)`,
      image_instrument_from_the_back: `https://x.test/a.jpg" onerror="alert(1)`,
    },
    step1: { street: `شارع ${PAYLOAD}`, neighborhood: `حي ${PAYLOAD}` },
    step2: { unit_number: `U-${PAYLOAD}` },
    step4: { other_conditions: `شرط ${PAYLOAD}`, text_additional_terms: PAYLOAD },
  };
}

describe("contract print — customer data is printed as text (stored XSS)", () => {
  it("escapes customer-provided fields instead of emitting markup", () => {
    const html = buildContractPrintHtml(orderWithPayload());

    expect(html).not.toContain("<img src=x");
    expect(html).not.toMatch(/onerror="parent/);
    expect(html).toContain("مالك &lt;img src=x onerror=&quot;parent.__xss=1&quot;&gt;");
    expect(html).toContain("شارع &lt;img");
    expect(html).toContain("حي &lt;img");
    expect(html).toContain("U-&lt;img");
    expect(html).toContain("شرط &lt;img");
    // the <title> is escaped too
    expect(html).toMatch(/<title>طباعة العقد - 201425&lt;img/);
  });

  it("keeps safe deed image URLs and drops script / attribute-breaking ones", () => {
    const html = buildContractPrintHtml(orderWithPayload());

    expect(html).toContain('<img src="https://api.example.com/deed.jpg?a=1&amp;b=2"');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain('a.jpg" onerror');
    expect(html).toContain("a.jpg&quot; onerror=&quot;alert(1)");
  });

  it("escapes every order in a batch print", () => {
    const html = buildBatchContractPrintHtml([orderWithPayload(), orderWithPayload()]);
    expect(html).not.toContain("<img src=x");
    expect(html.match(/class="contract-doc"/g)).toHaveLength(2);
  });

  it("still prints normal Arabic values unchanged", () => {
    const html = buildContractPrintHtml({
      uuid: "100200",
      contract_summary: { name_owner: "محمد العلي" },
      step1: { street: "طريق الملك فهد" },
    });
    expect(html).toContain("محمد العلي");
    expect(html).toContain("طريق الملك فهد");
  });
});

describe("print helpers", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("escapeHtml covers the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;"
    );
    expect(escapeHtml(null)).toBe("");
  });

  it("safeImageUrl only allows http(s), blob, data:image and same-origin paths", () => {
    expect(safeImageUrl("https://a.test/x.png")).toBe("https://a.test/x.png");
    expect(safeImageUrl("/storage/x.png")).toBe("/storage/x.png");
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("//evil.test/x.png")).toBeNull();
    expect(safeImageUrl("data:text/html,<script>")).toBeNull();
    expect(safeImageUrl("")).toBeNull();
  });

  it("prints inside a sandboxed iframe that cannot run scripts", () => {
    vi.useFakeTimers();
    const ok = printHtmlDocument("<html><body>x</body></html>");
    expect(ok).toBe(true);
    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    const sandbox = iframe.getAttribute("sandbox");
    expect(sandbox).toContain("allow-same-origin");
    expect(sandbox).toContain("allow-modals");
    expect(sandbox).not.toContain("allow-scripts");
  });
});
