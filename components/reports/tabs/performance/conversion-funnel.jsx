"use client";

import EmptyNote from "../../shared/empty-note";

const FUNNEL_COLORS = ["#8A6D57", "#6C8A57", "#1F9D8F", "#A3781E", "#0B5A3C"];

export default function ConversionFunnel({ stages, leakage }) {
  if (!stages.length) return <EmptyNote />;
  const peak = Math.max(...stages.map((s) => Number(s.value) || 0), 1);

  return (
    <div className="flex flex-col">
      {stages.map((stage, index) => {
        const value = Number(stage.value) || 0;
        const width = Math.max((value / peak) * 100, value > 0 ? 3 : 0);
        const fromPrev =
          stage.from_previous_pct ??
          stage.conv_from_previous ??
          (index > 0 && stages[index - 1]?.value
            ? Math.round((value / Number(stages[index - 1].value)) * 100)
            : null);

        return (
          <div key={stage.label} className="mb-3 last:mb-0">
            <div className="flex items-baseline justify-between gap-2 mb-1 text-[11.5px]">
              <span className="font-bold text-[#4A5450] dark:text-white/70">{stage.label}</span>
              <b className="font-extrabold text-[#2B3A34] tabular-nums dark:text-white">
                {value.toLocaleString("en-US")}
                {fromPrev != null && (
                  <span className="text-[9.5px] text-[#9AA5A0] font-bold ms-1">
                    {fromPrev}% من السابق
                  </span>
                )}
              </b>
            </div>
            <div className="h-[13px] rounded-md overflow-hidden bg-[#F0F3F1] dark:bg-white/10">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: stage.color ?? FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}

      {leakage && (
        <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-dashed border-[#E7E2D4] text-13 dark:border-white/15">
          <span className="font-bold text-gray-600 dark:text-white/60">التسرّب — لم يكملوا الطلب</span>
          <b className="tabular-nums text-[#9A6100] dark:text-amber-300">
            {leakage.count} ({leakage.percent}%)
          </b>
        </div>
      )}
    </div>
  );
}
