"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import OrderDataPanel from "./order-data-panel";

/** عرض مكبّر (دفعة هـ): نفس أقسام إيجار الستة بخط أكبر داخل نافذة واسعة — للقراءة فقط. */
export default function ContractExpandedViewDialog({ open, onOpenChange, order, orderData }) {
  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButton={false}
        dir="rtl"
        className="gap-0 overflow-hidden rounded-[20px] border-0 p-0 sm:max-w-[min(1100px,calc(100vw-32px))] max-h-[min(92vh,1200px)] bg-[#F4F6F5] dark:bg-[#0B1411]"
      >
        <DialogTitle className="sr-only">عرض مكبّر للعقد</DialogTitle>

        <div className="flex items-center justify-between gap-3 border-b border-[#E8EEEC] dark:border-white/10 bg-white dark:bg-[#0F1C16] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-brand-dark dark:text-[#6EE7B7]">
              عرض مكبّر — عقد #{order?.uuid ?? "—"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {order?.contract_type} — {order?.instrument_type}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-ink-placeholder transition-colors hover:bg-[#FFEBEB] hover:text-[#E24444] dark:bg-white/10"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          id="bigBody"
          className="bigbody overflow-y-auto max-h-[calc(min(92vh,1200px)-72px)] p-5 text-[115%] [&_[data-cell]_span]:text-[1.1em]"
        >
          {orderData ? <OrderDataPanel orderData={orderData} canEdit={false} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
