"use client";

export default function GroupedBarChart({ items, height = 220 }) {
  const peak = Math.max(...items.flatMap((item) => [item.spend, item.revenue]), 1);
  const barMax = height - 36;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 sm:gap-5" style={{ height }}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div className="flex items-end gap-1.5" style={{ height: barMax }}>
              <div
                className="w-[14px] sm:w-[18px] rounded-t-[4px] bg-[#A7C7BE] transition-all duration-500"
                style={{ height: Math.max((item.spend / peak) * barMax, 4) }}
                title={`الصرف: ${item.spend.toLocaleString("en-US")}`}
              />
              <div
                className="w-[14px] sm:w-[18px] rounded-t-[4px] bg-[#0B5A3C] transition-all duration-500"
                style={{ height: Math.max((item.revenue / peak) * barMax, 4) }}
                title={`الإيراد: ${item.revenue.toLocaleString("en-US")}`}
              />
            </div>
            <span className="text-[12px] font-bold text-[#2c3a34] truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-[#eef4f1]">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4a5b54]">
          <span className="size-2.5 rounded-[3px] bg-[#0B5A3C]" />
          الإيراد
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4a5b54]">
          <span className="size-2.5 rounded-[3px] bg-[#A7C7BE]" />
          الصرف
        </span>
      </div>
    </div>
  );
}
