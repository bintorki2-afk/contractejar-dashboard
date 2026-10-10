/** Downloads the report panel as a PDF file (client-side render via html2canvas + jsPDF). */
export async function downloadReportPdf(
  panelId = "reports-print-area",
  filenamePrefix = "report"
) {
  const panel = document.getElementById(panelId);
  if (!panel) return false;

  document.body.classList.add("reports-printing");

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(panel, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#F4F6F5",
      windowWidth: panel.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch {
    return false;
  } finally {
    document.body.classList.remove("reports-printing");
  }
}

/** Prints only the report panel matching `panelId` (see `.reports-printing` rule in globals.css). */
export function printReportPanel(panelId = "reports-print-area") {
  const panel = document.getElementById(panelId);
  if (!panel) return false;

  document.body.classList.add("reports-printing");
  const cleanup = () => document.body.classList.remove("reports-printing");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 3000);
  return true;
}

function csvCell(text) {
  return `"${String(text ?? "").replace(/"/g, '""').trim()}"`;
}

function sectionTitleOf(el) {
  return el.closest?.("[data-section-title]")?.getAttribute("data-section-title") || "";
}

/** صفوف جدول حقيقي `<table>`. */
function rowsOfTable(table) {
  return Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent)
  );
}

/** صفوف «جدول» مرسوم كـdiv (الرسوم الأفقية وقوائم المبالغ): `[data-export-table] > [data-export-row] > [data-export-cell]`. */
function rowsOfDivTable(el) {
  return Array.from(el.querySelectorAll("[data-export-row]"))
    .map((row) => Array.from(row.querySelectorAll("[data-export-cell]")).map((cell) => cell.textContent))
    .filter((cells) => cells.length);
}

/** يبني نص CSV من كل الجداول (الحقيقية والمرسومة كـdiv) داخل اللوحة، مع عنوان القسم فوق كل جدول. */
export function buildPanelCsv(panel) {
  if (!panel) return "";
  const nodes = Array.from(panel.querySelectorAll("table, [data-export-table]")).filter(
    // جدول div داخل جدول div آخر يُحسب مرة واحدة.
    (el) => !el.parentElement?.closest("[data-export-table]")
  );
  const blocks = nodes
    .map((el) => {
      const rows = el.tagName === "TABLE" ? rowsOfTable(el) : rowsOfDivTable(el);
      if (!rows.length) return null;
      const title = sectionTitleOf(el);
      const lines = rows.map((cells) => cells.map(csvCell).join(","));
      return (title ? [csvCell(title), ...lines] : lines).join("\n");
    })
    .filter(Boolean);
  return blocks.length ? `\uFEFF${blocks.join("\n\n")}` : "";
}

/** QA DASH-8: تنزيل ملف باسمه وامتداده (الرابط يُلحق بالصفحة، والإلغاء بعد النقر لا قبله). */
export function downloadTextFile(content, filename, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Exports every table (real `<table>` + div-drawn `[data-export-table]`, QA DASH-9) inside the report panel
 *  into a CSV. Returns false if the active report has no tabular data. */
export function exportPanelTablesToCsv(panelId = "reports-print-area", filenamePrefix = "report") {
  const panel = document.getElementById(panelId);
  if (!panel) return false;
  const csv = buildPanelCsv(panel);
  if (!csv) return false;
  const safePrefix = String(filenamePrefix || "report").replace(/[\\/:*?"<>|]+/g, "-").trim() || "report";
  downloadTextFile(csv, `${safePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
  return true;
}
