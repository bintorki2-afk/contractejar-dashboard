"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, FileText, History, Images, Minus, Plus, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tab } from "./order-cells";
import OrderHistoryPanel from "./order-history-panel";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

function isPdf(url = "") {
  return /\.pdf(\?|$)/i.test(String(url)) || /[?&]type=pdf/.test(String(url));
}

/**
 * عارض المرفقات (دفعة هـ — E1): تبويبات حسب ما يوجد فعلاً (الصك / هوية … / العنوان الوطني / شهادة الوقف / صك النظارة / الوكالة …)،
 * تكبير بالعجلة أو الأزرار، تدوير، سحب للتحريك، وفتح بالحجم الكامل. ثابت (sticky) بجانب لوحة البيانات.
 * وضع «سجل الطلب» يعرض سجل النشاط / الإشعارات / المدفوعات في نفس المكان حتى تبقى متاحة.
 */
export default function AttachmentsViewer({
  orderData,
  attachments = [],
  selectedKey,
  onSelect,
  mode = "attachments",
  onModeChange,
  historyProps = {},
  className,
}) {
  const list = useMemo(() => (Array.isArray(attachments) ? attachments.filter((a) => a?.url) : []), [attachments]);
  const current = list.find((a) => a.key === selectedKey) ?? list[0] ?? null;
  const pages = Array.isArray(current?.pages) && current.pages.length ? current.pages : null;
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const frameRef = useRef(null);

  const url = pages ? pages[Math.min(pageIndex, pages.length - 1)]?.url ?? pages[0]?.url : current?.url;

  // عند تغيير المرفق نعيد التكبير والتدوير والموضع (أثناء التصيير، بلا effect).
  const [shownKey, setShownKey] = useState(current?.key ?? null);
  if ((current?.key ?? null) !== shownKey) {
    setShownKey(current?.key ?? null);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setPageIndex(0);
    setLoadError(false);
  }

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!url || isPdf(url)) return;
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + (e.deltaY < 0 ? 0.15 : -0.15)) * 100) / 100)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [url]);

  const startDrag = (e) => {
    if (!url || isPdf(url)) return;
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    setDragging(true);
  };
  const moveDrag = (e) => {
    if (!dragRef.current) return;
    setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const historyMode = mode === "history";

  return (
    <aside
      aria-label={historyMode ? "سجل الطلب" : "المرفقات"}
      className={cn(
        "flex flex-col gap-2.5 rounded-[14px] border border-[#E3E8E3] bg-white p-3.5 dark:border-white/10 dark:bg-[#0F1C16]",
        className
      )}
      dir="rtl"
    >
      {onModeChange ? (
        <div role="tablist" aria-label="عرض الجانب" className="flex gap-1 rounded-xl bg-[#F3F5F2] p-1 dark:bg-white/5">
          <button
            type="button"
            role="tab"
            aria-selected={!historyMode}
            onClick={() => onModeChange("attachments")}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold transition-colors",
              !historyMode ? "bg-white text-brand-deep shadow-sm dark:bg-white/10 dark:text-emerald-300" : "text-[#6B7570] dark:text-white/50"
            )}
          >
            <Images className="size-3.5" />
            المرفقات
            {list.length ? <span className="tabular-nums text-[11px] opacity-70">({list.length})</span> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={historyMode}
            onClick={() => onModeChange("history")}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-bold transition-colors",
              historyMode ? "bg-white text-brand-deep shadow-sm dark:bg-white/10 dark:text-emerald-300" : "text-[#6B7570] dark:text-white/50"
            )}
          >
            <History className="size-3.5" />
            سجل الطلب
          </button>
        </div>
      ) : null}

      {historyMode ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <OrderHistoryPanel orderData={orderData} className="border-0" {...historyProps} />
        </div>
      ) : (
        <>
          {list.length ? (
            <div role="tablist" aria-label="المرفقات" className="flex flex-wrap gap-1.5">
              {list.map((a) => (
                <Tab key={a.key} active={a.key === current?.key} onClick={() => onSelect?.(a.key)}>
                  {a.label}
                </Tab>
              ))}
            </div>
          ) : null}
          {pages && pages.length > 1 ? (
            <div role="tablist" aria-label="صفحات المرفق" className="flex flex-wrap gap-1">
              {pages.map((p, i) => (
                <button
                  key={p.key ?? i}
                  type="button"
                  role="tab"
                  aria-selected={i === pageIndex}
                  onClick={() => setPageIndex(i)}
                  className={cn(
                    "h-7 rounded-md px-2 text-[12px] font-bold",
                    i === pageIndex ? "bg-brand-mint text-brand-deep" : "text-[#6B7570] hover:bg-[#F3F5F2]"
                  )}
                >
                  صفحة {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          <div
            ref={frameRef}
            className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-[10px] bg-[#F3F5F2] dark:bg-white/5"
            onMouseDown={startDrag}
            onMouseMove={moveDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            style={{ cursor: url && !isPdf(url) ? (dragging ? "grabbing" : "grab") : "default" }}
          >
            {!url ? (
              <div className="p-5 text-center text-[13px] text-[#6B7B71] dark:text-white/50">
                <FileText className="mx-auto mb-2 size-9 opacity-50" />
                <div className="font-semibold text-[#2F4A3B] dark:text-white/70">لا توجد مرفقات</div>
                <div className="mt-1 text-[12px]">لم يرفع العميل أي مستند لهذا الطلب بعد.</div>
              </div>
            ) : isPdf(url) ? (
              <iframe title={current?.label ?? "مرفق"} src={url} className="h-full min-h-[420px] w-full rounded-[10px] bg-white" />
            ) : loadError ? (
              <div className="p-5 text-center text-[13px] text-[#6B7B71]">
                <div className="font-semibold text-[#2F4A3B]">تعذّر عرض الصورة</div>
                <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-brand-deep underline">
                  فتح الملف في تبويب جديد ↗
                </a>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={current?.label ?? "مرفق"}
                draggable={false}
                onError={() => setLoadError(true)}
                className="max-h-full max-w-full select-none object-contain transition-transform duration-75"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)` }}
              />
            )}
            {url && !isPdf(url) ? (
              <span className="pointer-events-none absolute bottom-2 start-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button type="button" aria-label="تكبير" disabled={!url} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))} className={toolBtn}>
                <Plus className="size-4" />
              </button>
              <button type="button" aria-label="تصغير" disabled={!url} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.25))} className={toolBtn}>
                <Minus className="size-4" />
              </button>
              <button type="button" aria-label="تدوير" disabled={!url} onClick={() => setRotation((r) => (r + 90) % 360)} className={toolBtn}>
                <RotateCw className="size-4" />
              </button>
              {zoom !== 1 || rotation !== 0 || offset.x || offset.y ? (
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="h-7 rounded-[7px] border border-[#DBE3DC] bg-white px-2 text-[11.5px] font-bold text-[#4B6B58] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white/60"
                >
                  إعادة
                </button>
              ) : null}
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-deep hover:underline dark:text-emerald-300"
              >
                فتح بالحجم الكامل
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
          {url && !isPdf(url) ? (
            <p className="text-center text-[11.5px] text-[#8A958F] dark:text-white/40">تكبير بالعجلة · سحب للتحريك</p>
          ) : null}
        </>
      )}
    </aside>
  );
}

const toolBtn =
  "inline-flex size-7 items-center justify-center rounded-[7px] border border-[#DBE3DC] bg-white text-[#4B6B58] hover:border-[#9FC0AD] hover:bg-[#EEF5F0] disabled:opacity-40 dark:border-white/15 dark:bg-transparent dark:text-white/60";
