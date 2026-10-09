function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportClientsCsv(rows) {
  const headers = [
    "رقم العميل",
    "اسم العميل",
    "رقم الجوال",
    "البريد الإلكتروني",
    "تاريخ الانضمام",
    "الطلبات",
    "مدفوعة",
    "عقارات",
    "وحدات",
    "مسترجع",
    "مدفوع",
    "صافي",
    "محظور",
  ];

  const lines = rows.map((row) =>
    [
      row.clientCode,
      row.name,
      row.mobile,
      row.email,
      row.joinedAt,
      row.ordersCount,
      row.completed,
      row.properties,
      row.units,
      row.refundedAmount,
      row.paid,
      row.net,
      row.blocked ? "نعم" : "لا",
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = `﻿${headers.map(csvCell).join(",")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
