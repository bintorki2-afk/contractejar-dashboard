"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusKeyLabel } from "@/src/lib/order-status-keys";

/**
 * QA DASH-7: مؤشّرات تمرير (تدرّج + أسهم) عندما تتجاوز التبويبات عرض الحاوية،
 * والتبويب النشط يُمرَّر لمجال الرؤية. RTL: scrollLeft = 0 عند البداية (اليمين) وسالب نحو اليسار.
 */
function useHorizontalOverflow(deps) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos > 2, end: max - pos > 2 });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);
  return { ref, edges, measure };
}

/**
 * تبويبات حالات الطلب مع العدّاد (من `status-counts`).
 * تمرير أفقي على الجوال، والتبويب النشط بالأخضر الأساسي.
 */
export default function OrderStatusTabs({ tabs = [], value = "all", onChange, isLoading = false }) {
  if (!tabs.length && isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-9 w-24 rounded-full bg-black/5 dark:bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return <ScrollableTabs tabs={tabs} value={value} onChange={onChange} />;
}

function ScrollableTabs({ tabs, value, onChange }) {
  const { ref, edges } = useHorizontalOverflow([tabs.length]);

  useEffect(() => {
    const el = ref.current?.querySelector('[aria-selected="true"]');
    el?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [value, ref]);

  // في RTL: «التالي» = نحو اليسار (scrollLeft أكثر سلبية).
  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  const arrow =
    "absolute top-0 z-10 hidden h-9 w-8 items-center justify-center rounded-full border border-brand-line bg-white text-[#33403B] shadow-sm hover:bg-brand-mint sm:inline-flex dark:border-white/10 dark:bg-[#0F1C16] dark:text-white/80";

  return (
    <div className="relative" dir="rtl">
      {edges.start ? (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-10 bg-gradient-to-l from-[#F4F6F5] to-transparent dark:from-[#0B1411]" />
          <button type="button" aria-label="التبويبات السابقة" onClick={() => scrollBy(1)} className={cn(arrow, "right-0")}>
            <ChevronRight className="size-4" />
          </button>
        </>
      ) : null}
      {edges.end ? (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-10 bg-gradient-to-r from-[#F4F6F5] to-transparent dark:from-[#0B1411]" />
          <button type="button" aria-label="مزيد من التبويبات" onClick={() => scrollBy(-1)} className={cn(arrow, "left-0")}>
            <ChevronLeft className="size-4" />
          </button>
        </>
      ) : null}
    <div
      ref={ref}
      role="tablist"
      aria-label="حالات الطلب"
      className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin"
      dir="rtl"
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        const label = statusKeyLabel(tab.key, tab.label);
        const empty = !tab.count;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            title={tab.label}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 h-9 ps-3.5 pe-2 rounded-full border text-[12.5px] font-bold transition-colors whitespace-nowrap",
              active
                ? "bg-brand-deep border-brand-deep text-white shadow-sm"
                : "bg-white border-brand-line text-[#33403B] hover:border-brand-green/40 hover:bg-brand-mint dark:bg-white/[0.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[0.08]",
              !active && empty && "text-[#8A958F] dark:text-white/40"
            )}
          >
            {label}
            <span
              className={cn(
                "min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center text-[11.5px] font-extrabold tabular-nums",
                active
                  ? "bg-white/20 text-white"
                  : "bg-[#F0F4F2] text-[#4B5753] dark:bg-white/10 dark:text-white/70"
              )}
            >
              {tab.count ?? 0}
            </span>
          </button>
        );
      })}
    </div>
    </div>
  );
}
