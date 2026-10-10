"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Eye,
  FileText,
  Hand,
  ImageIcon,
} from "lucide-react";
import { ContractStepEditor } from "../contract-edit/contract-step-editor";
import {
  LEASE_RENEWAL_NOTES_FIELDS,
  LEASE_RENEWAL_TENANT_FIELDS,
  LEASE_RENEWAL_TERMS_FIELDS,
} from "../contract-edit/contract-field-schemas";
import {
  formatDisplayValue,
  isEmptyDisplayValue,
} from "../contract-summary-view";
import AgencyDocumentViewerDialog from "../agency-document-viewer-dialog";

const EMPTY_ADDITIONAL_TERMS = "لا توجد شروط أو متغيرات إضافية من العميل";
const EMPTY_NOTES = "لا توجد ملاحظات";

function resolveInstrumentUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    return value.url || value.path || value.full_url || value.src || null;
  }
  return null;
}

function isPdfUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

const getFileExtension = (url) => {
  if (!url) return "file";
  if (isPdfUrl(url)) return "pdf";
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "jpg";
};

export default function LeaseRenewalRenewTab({ orderData }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const step3 = orderData?.step3 ?? {};
  const step4 = orderData?.step4 ?? {};
  const orderUuid = orderData?.uuid ?? "410001";
  const instrumentImage = resolveInstrumentUrl(
    orderData?.contract_summary?.image_instrument ??
      orderData?.image_instrument
  );
  const isPdf = isPdfUrl(instrumentImage);
  const fileExtension = getFileExtension(instrumentImage);
  const documentName = `الصك #${orderUuid}`;
  const viewerTitle = isPdf ? "معاينة عقد PDF" : "معاينة الصك";

  const additionalTerms = step4.text_additional_terms?.trim() || null;
  const notesEdits = step4.notes_edits?.trim() || null;
  const termsLines = additionalTerms
    ? additionalTerms.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    : [];

  const requireInstrumentImage = () => {
    if (!instrumentImage) {
      toast.error("لا يوجد ملف عقد متاح");
      return false;
    }
    return true;
  };

  const handleDownloadInstrument = async () => {
    if (!requireInstrumentImage()) return;

    const filename = `${documentName}.${fileExtension}`;

    try {
      const response = await fetch(instrumentImage);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(isPdf ? "تم تحميل العقد PDF بنجاح" : "تم تحميل صورة الصك بنجاح");
    } catch {
      const link = document.createElement("a");
      link.href = instrumentImage;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(isPdf ? "تم بدء تحميل العقد PDF" : "تم بدء تحميل صورة الصك");
    }
  };

  const handleViewInstrument = () => {
    if (!requireInstrumentImage()) return;
    setViewerOpen(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,350px)_minmax(0,1fr)] gap-5 w-full min-w-0">
      <div className="min-w-0">
        <ContractStepEditor title="العقد المرغوب تجديده :" step="summary" fields={[]} showEdit={false}>
          <div className="bg-[#F4F4F4] rounded-20 p-5 flex flex-col gap-4">
            <button
              type="button"
              onClick={instrumentImage ? handleViewInstrument : undefined}
              disabled={!instrumentImage}
              className="bg-white rounded-[18px] py-6 px-4 flex flex-col items-center border border-[#EBEBEB] hover:border-[#0019FF] hover:bg-[#F8FAFF] transition-colors w-full min-w-0 disabled:opacity-60 disabled:hover:border-[#EBEBEB] disabled:hover:bg-white"
            >
              {instrumentImage ? (
                isPdf ? (
                  <div className="w-full max-w-[200px] h-[120px] mb-4 rounded-xl border border-[#EEE] bg-[#F8F8F8] flex flex-col items-center justify-center gap-2">
                    <FileText className="size-10 text-[#E24444]" />
                    <span className="text-xs font-bold text-[#616161] uppercase">
                      PDF
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full max-w-[200px] h-[120px] mb-4 rounded-xl overflow-hidden border border-[#EEE]">
                    <Image
                      src={instrumentImage}
                      alt="صورة الصك"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-black flex items-center justify-center mb-4">
                  <ImageIcon className="size-8 text-white" />
                </div>
              )}
              <p className="font-black text-15 text-black">
                {isPdf ? "معاينة العقد PDF" : "تحميل العقد"}
              </p>
              <p className="text-xs text-[#9E9E9E] mt-1">{fileExtension}</p>
            </button>

            {instrumentImage ? (
              <div className="flex items-center justify-between gap-2 bg-white rounded-xl p-3 border border-surface-border min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleViewInstrument}
                    className="w-8 h-8 rounded-full border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-gray-50"
                    title="معاينة"
                  >
                    <Eye className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadInstrument}
                    className="w-8 h-8 rounded-full border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-gray-50"
                    title="تحميل"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-right min-w-0">
                    <p className="text-xs font-bold text-black truncate">{documentName}</p>
                    <p className="text-10 text-[#9E9E9E]">{fileExtension}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 overflow-hidden relative">
                    {isPdf ? (
                      <FileText className="size-5 text-white" />
                    ) : (
                      <Image
                        src={instrumentImage}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-[#9E9E9E] py-2">
                لا يوجد ملف عقد مرفق
              </p>
            )}
          </div>
        </ContractStepEditor>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          <div className="bg-[#F4F4F4] rounded-20 p-5 min-w-0 overflow-hidden">
            <ContractStepEditor
              title="تفاصيل المستأجر :"
              step="step3"
              fields={LEASE_RENEWAL_TENANT_FIELDS}
            >
              <div
                className={`bg-white rounded-2xl p-4 border-r-[3px] border-r-[#9C27B0] shadow-sm w-full min-w-0 ${
                  isEmptyDisplayValue(step3.tenant_dob) ? "opacity-45" : ""
                }`}
              >
                <p className="text-11 text-[#9E9E9E] mb-1">تاريخ ميلاد المستأجر</p>
                <p
                  className={`text-15 font-bold break-words ${
                    isEmptyDisplayValue(step3.tenant_dob) ? "text-ink-placeholder" : "text-black"
                  }`}
                >
                  {formatDisplayValue(step3.tenant_dob)}
                </p>
              </div>
            </ContractStepEditor>
          </div>

        </div>

        <ContractStepEditor
          title="الشروط والمتغيرات التي طلبها العميل :"
          step="step4"
          fields={LEASE_RENEWAL_TERMS_FIELDS}
        >
          <div className="bg-white rounded-20 p-6 border border-[#EBEBEB] shadow-sm relative min-h-[200px] min-w-0 overflow-hidden">
            <button
              type="button"
              className="absolute left-4 bottom-4 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-ink-placeholder hover:bg-gray-50 disabled:opacity-40"
              disabled={!additionalTerms}
              onClick={() => {
                if (!additionalTerms) {
                  toast.error("لا يوجد نص للنسخ");
                  return;
                }
                navigator.clipboard.writeText(additionalTerms);
                toast.success("تم النسخ");
              }}
            >
              <Copy className="size-4" />
            </button>
            {additionalTerms ? (
              termsLines.length > 1 ? (
                <ol className="list-decimal list-inside space-y-4 text-13 text-[#333] leading-[1.8] pr-1 break-words">
                  {termsLines.map((term, i) => (
                    <li key={i} className="text-right">
                      <span className="mr-1">{term}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-13 text-[#333] leading-[1.8] text-right whitespace-pre-wrap break-words">
                  {additionalTerms}
                </p>
              )
            ) : (
              <p className="text-13 text-ink-placeholder text-right opacity-70">{EMPTY_ADDITIONAL_TERMS}</p>
            )}
          </div>
        </ContractStepEditor>

        <ContractStepEditor
          title="يرجى الانتباه :"
          step="step4"
          fields={LEASE_RENEWAL_NOTES_FIELDS}
        >
          <div className="bg-[#F0F0F0] rounded-2xl p-5 flex gap-3 items-start border border-[#E8E8E8] min-w-0">
            <Hand className="size-7 text-status-danger shrink-0 rotate-180" />
            <div className="text-right flex-1 min-w-0">
              <p className="font-black text-black text-sm mb-2">يرجى الانتباه :</p>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-wrap break-words">
                {notesEdits ?? (
                  <span className="text-ink-placeholder opacity-70">{EMPTY_NOTES}</span>
                )}
              </p>
            </div>
          </div>
        </ContractStepEditor>
      </div>

      <AgencyDocumentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentUrl={instrumentImage}
        title={viewerTitle}
      />
    </div>
  );
}
