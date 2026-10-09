"use client";

import { useState } from "react";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";

export const ORDERS_EXPORT_API = "/admin/orders/export";

/** يستخرج اسم الملف من Content-Disposition أو يبني اسماً افتراضياً بالتاريخ. */
export function exportFilenameFrom(headers = {}, fallback = "الطلبات", format = "xlsx") {
  const disposition = headers["content-disposition"] || headers["Content-Disposition"] || "";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* ignore */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  if (plain?.[1]) return plain[1];
  return `${fallback}-${new Date().toISOString().slice(0, 10)}.${format}`;
}

/** يبني معاملات التصدير من معاملات القائمة (بدون ترقيم الصفحات). */
export function buildExportParams(listParams = {}, format = "xlsx") {
  const params = { ...listParams, format };
  delete params.page;
  delete params.per_page;
  Object.keys(params).forEach((key) => {
    if (params[key] == null || params[key] === "") delete params[key];
  });
  return params;
}

function triggerDownload(blob, filename) {
  if (typeof window === "undefined") return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * تصدير الطلبات من الخادم (دفعة هـ — 2.7): GET /admin/orders/export?format=xlsx + فلاتر القائمة.
 * الملف يحوي أعمدة «المدفوع الأصلي / إضافي / مسترجع / الصافي / طريقة الدفع» بنفس أرقام الخادم.
 * عند فشل الخادم (مثلاً نسخة قديمة) يُستدعى `fallback` (التصدير المحلي القديم) إن وُجد.
 */
export function useServerOrdersExport({ params = {}, filename = "الطلبات", format = "xlsx", fallback } = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await axiosInstance.get(ORDERS_EXPORT_API, {
        params: buildExportParams(params, format),
        responseType: "blob",
      });
      const blob = res?.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        toast.error("لا توجد بيانات للتصدير");
        return false;
      }
      if (blob.type && blob.type.includes("application/json")) {
        const text = await blob.text();
        let message = "تعذر تصدير البيانات";
        try {
          message = JSON.parse(text)?.message || message;
        } catch {
          /* ignore */
        }
        toast.error(message);
        return false;
      }
      triggerDownload(blob, exportFilenameFrom(res?.headers ?? {}, filename, format));
      toast.success("تم تجهيز ملف Excel من الخادم");
      return true;
    } catch (error) {
      const status = error?.response?.status;
      if (fallback && (status === 404 || status === 405 || status === 501)) {
        try {
          return await fallback();
        } catch {
          /* يسقط للرسالة العامة أدناه */
        }
      }
      toast.error(error?.response?.data?.message || "تعذر تصدير البيانات من الخادم");
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
}
