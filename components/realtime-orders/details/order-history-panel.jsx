"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import OrderPaymentsTab from "./order-payments-tab";
import OrderActivityTab from "./order-activity-tab";

/**
 * لوحة «سجل الطلب» الجانبية في تفاصيل الطلب: المدفوعات والاسترجاع (د9)،
 * سجل النشاط (د13)، الإشعارات المرسلة (د24).
 */
export default function OrderHistoryPanel({ orderData, tabs: extraTabs = [], canRefund, onRefund, className }) {
  const tabs = [
    {
      key: "activity",
      label: "سجل النشاط",
      count: (orderData?.activities ?? []).length || null,
      render: () => <OrderActivityTab orderData={orderData} />,
    },
    ...extraTabs,
    {
      key: "payments",
      label: "المدفوعات",
      count: (orderData?.refunds ?? []).length || null,
      render: () => <OrderPaymentsTab orderData={orderData} canRefund={canRefund} onRefund={onRefund} />,
    },
  ];
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <section
      aria-label="سجل الطلب"
      className={cn("rounded-2xl border border-brand-line bg-white dark:bg-[#0F1C16] dark:border-white/10", className)}
      dir="rtl"
    >
      <div role="tablist" className="flex gap-1 border-b border-brand-line p-1.5 dark:border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === current?.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold transition-colors",
              t.key === current?.key
                ? "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300"
                : "text-[#6B7570] hover:bg-[#F5F7F6] dark:text-white/55 dark:hover:bg-white/5"
            )}
          >
            {t.label}
            {t.count ? (
              <span className="min-w-5 h-5 px-1 rounded-full bg-white/80 text-[10.5px] tabular-nums inline-flex items-center justify-center dark:bg-white/10">
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-3.5">{current?.render?.()}</div>
    </section>
  );
}
