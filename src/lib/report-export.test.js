import { describe, expect, it } from "vitest";
import { buildPanelCsv } from "./report-export";

describe("buildPanelCsv (QA DASH-9)", () => {
  it("يصدّر الجداول المرسومة كـdiv مع عنوان القسم، والجداول الحقيقية", () => {
    const panel = document.createElement("div");
    panel.innerHTML = `
      <div data-section-title="الطلبات حسب الموظف">
        <div data-export-table>
          <div data-export-row><span data-export-cell>أحمد</span><span data-export-cell>12</span></div>
          <div data-export-row><span data-export-cell>سارة</span><span data-export-cell>7</span></div>
        </div>
      </div>
      <table><tr><th>الموظف</th><th>العدد</th></tr><tr><td>خالد</td><td>3</td></tr></table>`;
    const csv = buildPanelCsv(panel);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"الطلبات حسب الموظف"\n"أحمد","12"\n"سارة","7"');
    expect(csv).toContain('"الموظف","العدد"\n"خالد","3"');
  });

  it("يرجع نصاً فارغاً بلا بيانات", () => {
    const panel = document.createElement("div");
    panel.innerHTML = "<div>KPI فقط</div>";
    expect(buildPanelCsv(panel)).toBe("");
  });
});
