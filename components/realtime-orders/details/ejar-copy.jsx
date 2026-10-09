"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCopy, Copy, Eye, Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/src/utils/axios";
import { escapeHtml, printHtmlDocument } from "@/src/lib/print";
import { cn } from "@/lib/utils";

/**
 * «نسخ بيانات إيجار» (د17) — GET /admin/orders/{id}/ejar-copy:
 * كتل مرتبة بترتيب إدخال منصة إيجار (المؤجر ← المستأجر ← العقار ← الوحدات ← المالية ← التواريخ ← العدادات)،
 * أرقام لاتينية وتواريخ هجري + ميلادي. نسخ الكل أو كتلة أو حقل واحد، وعرض للطباعة.
 */
export async function fetchEjarCopy(orderId) {
  const res = await axiosInstance.get(`/admin/orders/${orderId}/ejar-copy`);
  return res?.data?.data ?? null;
}

export async function copyToClipboard(text, message = "تم النسخ") {
  if (!text) {
    toast.error("لا يوجد نص للنسخ");
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error("تعذر النسخ — اسمح للمتصفح بالوصول للحافظة");
    return false;
  }
}

export function buildEjarPrintHtml(data) {
  const blocks = (data?.blocks ?? [])
    .map(
      (b) => `<section><h2>${escapeHtml(b.title)}</h2><table>${(b.fields ?? [])
        .map((f) => `<tr><th>${escapeHtml(f.label)}</th><td dir="auto">${escapeHtml(f.value)}</td></tr>`)
        .join("")}</table></section>`
    )
    .join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بيانات إيجار — الطلب ${escapeHtml(
    data?.order_number ?? ""
  )}</title><style>
  body{font-family:"IBM Plex Sans Arabic",Tahoma,Arial,sans-serif;color:#14231D;margin:24px}
  h1{font-size:18px;margin:0 0 4px;color:#0B5A3C} p.meta{color:#6B7570;font-size:12px;margin:0 0 16px}
  section{border:1px solid #E3ECE8;border-radius:12px;padding:10px 14px;margin:0 0 12px;break-inside:avoid}
  h2{font-size:14px;margin:0 0 8px;color:#0B5A3C} table{width:100%;border-collapse:collapse;font-size:13px}
  th{width:38%;text-align:right;color:#4B5753;font-weight:600;padding:4px 0} td{padding:4px 0;font-weight:700}
  tr+tr th,tr+tr td{border-top:1px dashed #E3ECE8}
  </style></head><body><h1>بيانات إيجار — الطلب #${escapeHtml(data?.order_number ?? "")}</h1>
  <p class="meta">بترتيب الإدخال في منصة إيجار · ${escapeHtml(new Date().toLocaleString("en-GB"))}</p>${blocks}</body></html>`;
}

export function useEjarCopy(orderId, { enabled = false } = {}) {
  return useQuery({
    queryKey: ["ejar-copy", String(orderId)],
    queryFn: () => fetchEjarCopy(orderId),
    enabled: enabled && orderId != null,
    staleTime: 0,
  });
}

/** زر «نسخ بيانات إيجار» + «عرض» (نافذة بكل حقل وزر نسخه، وطباعة). */
export function EjarCopyButtons({ orderId, className, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const copyAll = async () => {
    setBusy(true);
    try {
      const data = await fetchEjarCopy(orderId);
      await copyToClipboard(data?.text, "تم نسخ بيانات إيجار — الصقها في منصة إيجار");
    } catch (e) {
      toast.error(e?.response?.data?.message || "تعذر تحميل بيانات إيجار");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={copyAll}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-line bg-white px-3 text-[12.5px] font-bold text-brand-deep hover:bg-brand-mint disabled:opacity-60 dark:bg-white/[0.04] dark:border-white/10 dark:text-emerald-300"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCopy className="size-4" />}
        {compact ? "نسخ لإيجار" : "نسخ بيانات إيجار"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="عرض بيانات إيجار"
        title="عرض بيانات إيجار حقلاً حقلاً / طباعة"
        className="inline-flex size-9 items-center justify-center rounded-xl border border-brand-line bg-white text-brand-deep hover:bg-brand-mint dark:bg-white/[0.04] dark:border-white/10 dark:text-emerald-300"
      >
        <Eye className="size-4" />
      </button>
      <EjarCopyDialog orderId={orderId} open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function EjarCopyDialog({ orderId, open, onOpenChange }) {
  const { data, isLoading, isError } = useEjarCopy(orderId, { enabled: open });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-[720px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>بيانات إيجار — الطلب #{data?.order_number ?? ""}</DialogTitle>
          <DialogDescription>بترتيب الإدخال في منصة إيجار. انسخ حقلاً أو كتلة أو الكل.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!data}
            onClick={() => copyToClipboard(data?.text, "تم نسخ كل البيانات")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-deep px-3.5 text-[12.5px] font-bold text-white disabled:opacity-60"
          >
            <ClipboardCopy className="size-4" /> نسخ الكل
          </button>
          <button
            type="button"
            disabled={!data}
            onClick={() => {
              if (!printHtmlDocument(buildEjarPrintHtml(data))) toast.error("تعذر فتح الطباعة");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-line px-3.5 text-[12.5px] font-bold text-[#33403B] disabled:opacity-60 dark:border-white/10 dark:text-white/70"
          >
            <Printer className="size-4" /> طباعة
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-brand-deep" />
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-[13px] text-[#B42318]">تعذر تحميل بيانات إيجار</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(data?.blocks ?? []).map((block) => (
              <section key={block.key} className="rounded-xl border border-brand-line p-3 dark:border-white/10">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-extrabold text-brand-deep dark:text-emerald-300">{block.title}</h3>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(block.text, `تم نسخ «${block.title}»`)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11.5px] font-bold text-brand-deep hover:bg-brand-mint dark:text-emerald-300"
                  >
                    <Copy className="size-3.5" /> نسخ الكتلة
                  </button>
                </div>
                <dl className="divide-y divide-dashed divide-brand-line dark:divide-white/10">
                  {(block.fields ?? []).map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-2 py-1.5">
                      <dt className="text-[12px] text-[#6B7570] dark:text-white/50">{f.label}</dt>
                      <dd className="flex items-center gap-1.5 min-w-0">
                        <span dir="auto" className="break-words text-[12.5px] font-bold tabular-nums text-[#14231D] dark:text-white">
                          {f.value}
                        </span>
                        <button
                          type="button"
                          aria-label={`نسخ ${f.label}`}
                          onClick={() => copyToClipboard(String(f.value ?? ""), `تم نسخ ${f.label}`)}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[#8A958F] hover:bg-brand-mint hover:text-brand-deep"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
