/**
 * Escapes text before it is interpolated into an HTML string (print documents).
 * Customer-provided values (names, addresses, conditions…) must never reach a
 * print template raw — the print iframe shares the dashboard origin.
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns an attribute-safe image URL (http/https/blob/data:image or same-origin path) or null. */
export function safeImageUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return null;
  if (/^(https?:|blob:)/i.test(url) || /^data:image\//i.test(url) || /^\/(?!\/)/.test(url)) {
    return escapeHtml(url);
  }
  return null;
}

/** Renders `html` into a hidden iframe and triggers the browser print dialog for it. */
export function printHtmlDocument(html) {
  if (!html) return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  );
  // Defence in depth: the printed document never needs to run scripts. Without
  // `allow-scripts`, any markup that slips through (e.g. an onerror handler in a
  // customer field) cannot execute in the dashboard origin. `allow-same-origin`
  // lets this page write the document; `allow-modals` keeps print() working.
  iframe.setAttribute("sandbox", "allow-same-origin allow-modals");
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc || !win) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(() => iframe.remove(), 1000);
    }
  };

  if (doc.readyState === "complete") {
    setTimeout(triggerPrint, 300);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 300);
  }

  return true;
}
