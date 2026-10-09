import { CONTRACT_TYPE, INVOICE_STATUS } from "./mock-data";

export function exportInvoicesCsv(rows) {
  const headers = [
    "رقم الفاتورة",
    "رقم العقد",
    "جوال العميل",
    "نوع العقد",
    "المبلغ",
    "نوع العملية",
    "المصدر",
    "الحالة",
    "التاريخ",
  ];

  const lines = rows.map((row) =>
    [
      row.invoiceNo,
      row.orderNo,
      row.mobile,
      CONTRACT_TYPE[row.contractType]?.label ?? "—",
      row.amount,
      row.kindLabel ?? "",
      row.source,
      INVOICE_STATUS[row.status]?.label ?? row.status,
      row.date,
    ].join(",")
  );

  const csv = `﻿${headers.join(",")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
