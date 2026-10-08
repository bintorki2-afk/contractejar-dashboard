"use client";

import { useCallback } from "react";
import Image from "next/image";
import { Download, Eye, Minus, Plus, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import OrderActionDialogHeader from "@/components/shared/order-action-dialog-header";
import { useImageZoomPan } from "@/components/orders/single-order/use-image-zoom-pan";
import { cn } from "@/lib/utils";

export function isPdfUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

export default function MediaPreviewDialog({
  open,
  onOpenChange,
  url,
  title = "معاينة الملف",
  subtitle,
  downloadUrl,
  icon = Eye,
  iconClassName = "bg-brand-hover",
}) {
  const isPdf = isPdfUrl(url);

  const {
    scale,
    position,
    containerRef,
    resetTransform,
    handleMouseDown,
    zoomIn,
    zoomOut,
    cursorClass,
  } = useImageZoomPan({
    enabled: open && !isPdf,
    resetDeps: [open, url],
  });

  const handleShare = useCallback(async () => {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url, title]);

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeButton={false}
        className="gap-0 overflow-hidden rounded-[20px] border-0 bg-[#F4F6F5] p-0 dark:bg-[#0B1411] sm:max-w-[min(920px,calc(100vw-32px))]"
        dir="rtl"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="bg-white px-6 pb-0 pt-6 dark:bg-[#0F1C16]">
          <OrderActionDialogHeader
            icon={icon}
            iconClassName={iconClassName}
            title={title}
            onClose={handleClose}
            className="mb-0"
          />
          {subtitle ? (
            <p className="-mt-2 mb-4 truncate text-xs font-medium text-gray-400 dark:text-white/45">
              {subtitle}
            </p>
          ) : (
            <div className="mb-4" />
          )}
        </div>

        <div className="relative overflow-hidden bg-[#F4F6F5] px-4 py-4 dark:bg-[#0B1411] sm:px-6">
          {open && url ? (
            <div className="relative overflow-hidden rounded-2xl border border-[#D7E3DE] bg-white dark:border-white/10 dark:bg-[#0F1C16]">
              <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
                <ViewerToolButton icon={Share2} label="مشاركة" onClick={handleShare} />
                <ViewerToolButton
                  icon={Minus}
                  label="تصغير"
                  onClick={zoomOut}
                  disabled={isPdf}
                />
                <ViewerToolButton
                  icon={Plus}
                  label="تكبير"
                  onClick={zoomIn}
                  disabled={isPdf}
                />
              </div>

              <div
                ref={containerRef}
                className={cn(
                  "flex min-h-[min(62vh,560px)] w-full items-center justify-center bg-[#F7FAF8] p-4 dark:bg-white/[0.02]",
                  !isPdf && cursorClass
                )}
                onMouseDown={handleMouseDown}
                onDoubleClick={resetTransform}
              >
                {isPdf ? (
                  <iframe
                    src={url}
                    title={title}
                    className="min-h-[min(58vh,520px)] w-full max-w-[min(720px,100%)] rounded-xl border-0 bg-white shadow-sm"
                  />
                ) : (
                  <div
                    className="relative will-change-transform"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      transformOrigin: "center center",
                      transition:
                        cursorClass === "cursor-grabbing" ? "none" : "transform 0.15s ease-out",
                    }}
                  >
                    <Image
                      src={url}
                      alt={title}
                      width={640}
                      height={900}
                      className="h-auto max-h-[min(56vh,520px)] w-auto max-w-full select-none object-contain"
                      draggable={false}
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[min(62vh,560px)] items-center justify-center rounded-2xl border border-dashed border-[#D7E3DE] bg-white dark:border-white/10 dark:bg-[#0F1C16]">
              <p className="text-sm text-gray-400 dark:text-white/45">لا يوجد ملف للمعاينة</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[#E8EEEC] bg-white px-6 py-5 dark:border-white/10 dark:bg-[#0F1C16]">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download
              className="inline-flex h-12 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D7E3DE] bg-[#F7FAF8] text-sm font-bold text-brand-dark transition-colors hover:bg-[#EEF5F1] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#6EE7B7] dark:hover:bg-white/[0.07]"
            >
              <Download className="size-4" />
              تحميل
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "h-12 min-w-[140px] rounded-2xl bg-brand-hover text-sm font-bold text-white transition-colors hover:bg-brand-hover/90",
              downloadUrl ? "flex-1" : "mx-auto w-full max-w-[280px]"
            )}
          >
            إغلاق
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ViewerToolButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#0B5A3C] text-white shadow-lg transition-colors hover:bg-[#0B7A4C] disabled:pointer-events-none disabled:opacity-40 dark:bg-[#2f9c73] dark:hover:bg-[#3db889]"
    >
      <Icon className="size-4" strokeWidth={2} />
    </button>
  );
}
