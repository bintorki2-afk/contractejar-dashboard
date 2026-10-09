"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SETTINGS_VIEW_TRIGGER_CLASS } from "@/components/system-settings/shared";
import { MessageSquareText, X } from "lucide-react";

export default function DisplayMessageForPropertyDialog({ messageAlert }) {
  const [open, setOpen] = useState(false);

  const section =
    messageAlert?.section?.name_ar || messageAlert?.section?.name_en || "—";
  const item =
    messageAlert?.section_item?.name_ar ||
    messageAlert?.section_item?.name_en ||
    "—";
  const message = messageAlert?.message || "—";

  return (
    <Dialog dir="rtl" open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={SETTINGS_VIEW_TRIGGER_CLASS}>
          عرض
        </button>
      </DialogTrigger>

      <DialogContent
        closeButton={false}
        className="max-w-md max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_12px_40px_rgba(11,83,69,0.12)] sm:max-w-md"
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-5 py-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3 text-right">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#0B5A3C]">
                <MessageSquareText className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-black text-[#111827]">
                  عرض رسالة العقار
                </DialogTitle>
                <p className="mt-1 text-[12px] font-medium text-[#6B7280]">
                  تفاصيل الرسالة التوضيحية المرتبطة بالقسم والبند.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div dir="rtl" className="flex flex-col gap-3 px-5 py-4 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E6EBE9] bg-[#F8FAF9] px-3.5 py-3">
              <p className="text-[11px] font-bold text-[#9CA3AF]">القسم</p>
              <p className="mt-1 text-[13px] font-bold text-[#111827]">{section}</p>
            </div>
            <div className="rounded-xl border border-[#E6EBE9] bg-[#F8FAF9] px-3.5 py-3">
              <p className="text-[11px] font-bold text-[#9CA3AF]">بند القسم</p>
              <p className="mt-1 text-[13px] font-bold text-[#0B5A3C]">{item}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E6EBE9] bg-white px-3.5 py-3">
            <p className="text-[11px] font-bold text-[#9CA3AF]">نص الرسالة</p>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#374151] whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-[#EEF1F0] px-5 py-3">
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 rounded-xl bg-[#0B5A3C] px-5 text-[13px] font-bold text-white hover:bg-[#043F38]"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
