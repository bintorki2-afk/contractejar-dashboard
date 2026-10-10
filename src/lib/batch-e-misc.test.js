import { describe, expect, it } from "vitest";
import { previousOrdersLabel } from "@/components/realtime-orders/details/previous-orders-chip";
import { buildBankTransferPayload, extractBankTransferSettings, formatIbanDisplay, validateBankTransferForm } from "./site-settings";
import { buildExportParams, exportFilenameFrom } from "@/src/hooks/use-orders-export";
import { PERMISSION_ACTION_LABELS, PERMISSION_ACTIONS } from "./permissions";

describe("previous orders chip label (د7)", () => {
  it("uses correct Arabic plural forms", () => {
    expect(previousOrdersLabel(0)).toBeNull();
    expect(previousOrdersLabel(1)).toBe("للعميل طلب سابق");
    expect(previousOrdersLabel(2)).toBe("للعميل طلبان سابقان");
    expect(previousOrdersLabel(5)).toBe("للعميل 5 طلبات سابقة");
    expect(previousOrdersLabel(15)).toBe("للعميل 15 طلباً سابقاً");
  });
});

describe("bank transfer settings (د9)", () => {
  it("reads data.bank_transfer and validates a Saudi IBAN", () => {
    const s = extractBankTransferSettings({ data: { bank_transfer: { bank_name: "الراجحي", bank_iban: "SA0380000000608010167519", bank_account_name: "عقدي", is_configured: true } } });
    expect(s.form.bank_iban).toBe("SA0380000000608010167519");
    expect(s.isConfigured).toBe(true);
    expect(validateBankTransferForm({ bank_name: "الراجحي", bank_iban: "sa03 8000 0000 6080 1016 7519" })).toEqual({});
    expect(validateBankTransferForm({ bank_iban: "SA123" }).bank_iban).toMatch(/24 خانة/);
    expect(validateBankTransferForm({ bank_iban: "SA0380000000608010167519" }).bank_name).toBeTruthy();
    expect(buildBankTransferPayload({ bank_name: " الراجحي ", bank_iban: "sa03 8000 0000 6080 1016 7519", bank_account_name: "عقدي" })).toEqual({ bank_name: "الراجحي", bank_iban: "SA0380000000608010167519", bank_account_name: "عقدي" });
    expect(formatIbanDisplay("SA0380000000608010167519")).toBe("SA03 8000 0000 6080 1016 7519");
  });
  it("lists the two new payments permissions with Arabic labels", () => {
    expect(PERMISSION_ACTIONS).toContain("record_transfer");
    expect(PERMISSION_ACTIONS).toContain("add_fee");
    expect(PERMISSION_ACTION_LABELS.record_transfer).toBe("تسجيل حوالة بنكية");
    expect(PERMISSION_ACTION_LABELS.add_fee).toBe("إضافة رسوم");
  });
});

describe("server orders export (د10)", () => {
  it("drops pagination and empty params, keeps filters, adds format", () => {
    expect(buildExportParams({ page: 3, per_page: 20, payment: "paid", attention: "", search: null, status_key: "received_by_employee" })).toEqual({ payment: "paid", status_key: "received_by_employee", format: "xlsx" });
  });
  it("reads the filename from Content-Disposition or builds a dated one", () => {
    expect(exportFilenameFrom({ "content-disposition": 'attachment; filename="orders-2026-10-10.xlsx"' })).toBe("orders-2026-10-10.xlsx");
    expect(exportFilenameFrom({ "content-disposition": "attachment; filename*=UTF-8''%D8%A7%D9%84%D8%B7%D9%84%D8%A8%D8%A7%D8%AA.xlsx" })).toBe("الطلبات.xlsx");
    expect(exportFilenameFrom({}, "الطلبات")).toMatch(/^الطلبات-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
