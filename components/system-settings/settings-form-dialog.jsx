"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared settings item modal shell — matches design.html #setItemOvl / .cust-modal.
 */
export default function SettingsFormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
  isPending = false,
  submitDisabled = false,
  maxWidthClass = "sm:max-w-[480px]",
}) {
  return (
    <Dialog dir="rtl" open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent
        closeButton={false}
        className={cn(
          "w-[calc(100%-2rem)] max-w-[480px] max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:rounded-2xl dark:border-white/10 dark:bg-card",
          maxWidthClass
        )}
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-4 py-3.5 text-right dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <DialogTitle className="text-[15px] font-black text-[#111827] dark:text-white">{title}</DialogTitle>
              {description ? (
                <p className="mt-1 text-[12px] font-medium text-[#6B7280] dark:text-white/55">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-white/50 dark:hover:bg-white/10"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div dir="rtl" className="flex min-w-0 max-w-full flex-col gap-3.5 overflow-hidden px-4 py-3.5 text-right">
          {children}
        </div>

        <div className="flex items-center gap-2 border-t border-[#EEF1F0] px-4 py-3 dark:border-white/10">
          <Button
            type="button"
            disabled={isPending || submitDisabled}
            onClick={onSubmit}
            className="h-10 flex-1 rounded-[10px] bg-[#0B5A3C] text-[13px] font-extrabold text-white hover:bg-[#0B7A4C]"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            className="h-10 flex-1 rounded-[10px] border-0 bg-[#F2F6F4] text-[13px] font-extrabold text-[#55625D] hover:bg-[#E7EDE9]"
          >
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const settingsFieldClass =
  "h-11 rounded-xl border-[#E6EBE9] bg-white text-[13px] font-semibold focus-visible:border-[#0B5A3C] focus-visible:ring-0 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

export function SettingsFieldLabel({ children, required }) {
  return (
    <span className="text-[13px] font-bold text-[#111827] dark:text-white">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  );
}
