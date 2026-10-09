"use client";

import { Check, CircleDot, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildOrderJourney, formatJourneyTime } from "@/src/lib/order-journey";

/**
 * رحلة الطلب (د10): الدفع → قيد المراجعة → الاستلام → المسودة → التوثيق → مكتمل.
 * لكل خطوة: من نفّذها ومتى، والخطوة الحالية مميّزة. أفقية على الشاشات الواسعة وعمودية على الجوال.
 */
export default function OrderJourney({ orderData, className }) {
  const journey = buildOrderJourney(orderData);

  return (
    <section
      aria-label="رحلة الطلب"
      className={cn(
        "rounded-2xl border border-brand-line bg-white px-4 py-4 sm:px-5 dark:bg-[#0F1C16] dark:border-white/10",
        className
      )}
      dir="rtl"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-[#14231D] dark:text-white">رحلة الطلب</h3>
        {journey.sideState ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-2.5 h-6 text-[11.5px] font-bold text-[#B42318] dark:bg-red-500/15 dark:text-red-300">
            <PauseCircle className="size-3.5" />
            الطلب {journey.sideStateLabel} — الرحلة متوقفة
          </span>
        ) : (
          <span className="text-[11.5px] font-bold text-[#6B7570] dark:text-white/50 tabular-nums">
            {journey.progress}% مكتمل
          </span>
        )}
      </div>

      <ol className="grid grid-cols-1 gap-0 md:grid-cols-6 md:gap-2">
        {journey.steps.map((step, index) => {
          const last = index === journey.steps.length - 1;
          const time = formatJourneyTime(step.at);
          return (
            <li
              key={step.key}
              aria-current={step.current ? "step" : undefined}
              className="relative flex gap-3 md:flex-col md:items-center md:gap-2 md:text-center pb-4 md:pb-0"
            >
              {/* الخط الواصل */}
              {!last ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-8 bottom-0 start-[15px] w-0.5 md:top-[15px] md:bottom-auto md:start-1/2 md:w-[calc(100%+0.5rem)] md:h-0.5",
                    step.done ? "bg-brand-deep dark:bg-emerald-400" : "bg-[#E3ECE8] dark:bg-white/10"
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-extrabold",
                  step.done && "border-brand-deep bg-brand-deep text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-[#0B1411]",
                  step.current && "border-brand-green bg-brand-mint text-brand-deep ring-4 ring-brand-mint dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/15",
                  !step.done && !step.current && "border-[#DCE5E1] bg-white text-[#9AA6A1] dark:border-white/15 dark:bg-transparent dark:text-white/40"
                )}
              >
                {step.done ? <Check className="size-4" strokeWidth={3} /> : step.current ? <CircleDot className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0 pt-1 md:pt-0">
                <p
                  className={cn(
                    "text-[12.5px] font-bold leading-tight",
                    step.current ? "text-brand-deep dark:text-emerald-300" : step.done ? "text-[#14231D] dark:text-white" : "text-[#8A958F] dark:text-white/45"
                  )}
                >
                  {step.label}
                  {step.current ? <span className="ms-1 text-[10.5px] font-extrabold">(الآن)</span> : null}
                </p>
                {step.who || time ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6B7570] dark:text-white/50">
                    {step.who ? <span className="font-semibold">{step.who}</span> : null}
                    {step.who && time ? " · " : null}
                    {time ? <span dir="ltr" className="tabular-nums">{time}</span> : null}
                  </p>
                ) : null}
                {step.note ? (
                  <p className="mt-0.5 text-[10.5px] text-[#8A958F] dark:text-white/40 tabular-nums">{step.note}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
