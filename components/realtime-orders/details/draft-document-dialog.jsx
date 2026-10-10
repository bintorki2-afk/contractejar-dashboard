"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText, FileUp, Loader2, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/shared/confirm-provider";
import { apiErrorMessage } from "@/src/hooks/use-bank-transfer";
import { useDeleteDraftDocument, useUploadDraftDocument } from "@/src/hooks/use-draft-document";
import { DRAFT_DOCUMENT_ACCEPT, getDraftDocument, isPayAfterDraftOrder, validateDraftFile } from "@/src/lib/draft-document";
import { formatJourneyTime } from "@/src/lib/order-journey";
import { normalizePaymentState, sar } from "@/src/lib/payment-state";

const field =
  "h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-[13.5px] font-semibold text-[#14231D] focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";
const label = "text-[12px] font-bold text-[#33403B] dark:text-white/70";

/**
 * «رفع مسودة العقد للعميل» (دفعة و — D9): ملف PDF/صورة يُخزَّن مرفقاً للطلب (`draft_document`)
 * ويصل العميل إشعار «مسودة عقدك جاهزة — راجعها وادفع للتوثيق». لا حالة ولا خطوة رحلة جديدة.
 */
export default function DraftDocumentDialog({ open, onOpenChange, orderData }) {
  const confirm = useConfirm();
  const orderId = orderData?.id;
  const current = getDraftDocument(orderData);
  const state = normalizePaymentState(orderData);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setSeeded(true);
    setFile(null);
    setNote("");
    setError(null);
  }
  if (!open && seeded) setSeeded(false);

  const upload = useUploadDraftDocument({
    onSuccess: () => {
      toast.success("رُفعت المسودة وأُبلغ العميل", {
        description: "«مسودة عقدك جاهزة — راجعها وادفع للتوثيق». «وثّقت» يبقى مقفلاً حتى الدفع.",
      });
      onOpenChange?.(false);
    },
    onError: (err) => setError(apiErrorMessage(err, "تعذّر رفع المسودة")),
  });
  const remove = useDeleteDraftDocument({
    onSuccess: () => toast.success("حُذفت المسودة من الطلب"),
    onError: (err) => toast.error(apiErrorMessage(err, "تعذّر حذف المسودة")),
  });

  const onFile = (f) => {
    const msg = validateDraftFile(f);
    setError(msg);
    setFile(msg ? null : f);
  };

  const submit = () => {
    setError(null);
    const msg = validateDraftFile(file);
    if (msg) return setError(msg);
    upload.mutate({ orderId, file, note: note.trim() || undefined });
  };

  const removeCurrent = async () => {
    const ok = await confirm({
      title: "حذف المسودة",
      description: "حذف المسودة المرفوعة من الطلب؟ لن يراها العميل بعد ذلك.",
      confirmLabel: "حذف",
      destructive: true,
    });
    if (ok) remove.mutate(orderId);
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[540px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <FileUp className="size-5 text-brand-deep dark:text-emerald-300" />
            رفع مسودة العقد للعميل
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-6 text-[#6B7570] dark:text-white/50">
            تظهر للعميل في «تتبّع الطلب» و«طلباتي» والتطبيق مع زر الدفع
            {state.outstanding > 0 ? <> بالمبلغ المستحق <b className="tabular-nums">{sar(state.outstanding)}</b></> : null}، ويصله إشعار بأن المسودة جاهزة.
          </DialogDescription>
        </DialogHeader>

        {isPayAfterDraftOrder(orderData) ? (
          <p className="rounded-xl bg-[#EEF5FF] px-3 py-2 text-[12.5px] font-bold text-[#1D4ED8] dark:bg-blue-500/10 dark:text-blue-300">
            العميل اختار «الدفع بعد مشاهدة المسودة»
            {orderData?.pay_after_draft_requested_at ? ` · ${formatJourneyTime(orderData.pay_after_draft_requested_at) ?? ""}` : ""}.
          </p>
        ) : null}

        {current ? (
          <div className="flex items-center gap-3 rounded-xl border border-brand-line bg-[#FAFBF9] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <FileText className="size-5 shrink-0 text-brand-deep dark:text-emerald-300" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-[#14231D] dark:text-white">{current.name || "مسودة العقد"}</div>
              <div className="text-[11.5px] text-[#6B7570] dark:text-white/50">
                المسودة الحالية
                {current.uploaded_at ? ` · ${formatJourneyTime(current.uploaded_at) ?? ""}` : ""}
                {current.uploaded_by?.name ? ` · ${current.uploaded_by.name}` : ""}
              </div>
            </div>
            <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-lg border border-brand-line px-2.5 text-[12px] font-bold text-brand-deep hover:bg-brand-mint dark:border-white/10 dark:text-emerald-300">
              <ExternalLink className="size-3.5" /> فتح
            </a>
            <button
              type="button"
              onClick={removeCurrent}
              disabled={busy}
              aria-label="حذف المسودة"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-[#F3C9C5] text-[#B42318] hover:bg-[#FDECEC] disabled:opacity-50 dark:border-red-500/30"
            >
              {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className={label}>
            {current ? "استبدال بملف جديد" : "ملف المسودة"} <span className="text-[#B42318]">*</span>{" "}
            <span className="font-normal text-[#8A958F]">(PDF / JPG / PNG / WebP — حتى 10MB)</span>
          </span>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0];
              if (f) onFile(f);
            }}
            className={cn(
              "relative flex min-h-[110px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-[#FAFBF9] text-center transition-colors hover:bg-[#EEF5F0] dark:bg-white/[0.03]",
              file ? "border-brand-green" : "border-brand-line dark:border-white/15"
            )}
          >
            <input type="file" accept={DRAFT_DOCUMENT_ACCEPT} className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} data-testid="draft-input" />
            {file ? (
              <span className="inline-flex items-center gap-2 px-8 text-[13px] font-bold text-brand-deep">
                <FileText className="size-5 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="font-normal text-[#8A958F]">({Math.round(file.size / 1024)} KB)</span>
              </span>
            ) : (
              <span className="flex flex-col items-center gap-1 p-4 text-[13px] text-[#6B7570]">
                <Upload className="size-6 text-brand-deep" />
                اضغط لاختيار المسودة أو اسحبها هنا
              </span>
            )}
            {file ? (
              <button
                type="button"
                aria-label="إزالة الملف"
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                className="absolute end-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-[#B42318] shadow"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={label}>ملاحظة للعميل (اختياري)</span>
          <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="مثال: راجع بيانات المستأجر وتاريخ البداية" className={field} />
        </label>

        {error ? <p role="alert" className="text-[12.5px] font-bold text-[#B42318]">{error}</p> : null}

        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !file}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 text-[14px] font-extrabold text-white hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]"
          >
            {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {current ? "استبدال وإبلاغ العميل" : "رفع وإبلاغ العميل"}
          </button>
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={upload.isPending} className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-4 text-[14px] font-bold text-[#14231D] hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-white">
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
