"use client";

import { startTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { MARKETING_TABS, SCOPE_BREADCRUMB } from "./shared/mock-data";
import { MarketingPeriodProvider } from "./shared/marketing-period-context";
import "./marketing-design.css";

// Only one panel renders at a time — load each on demand so a tab's code
// (and its charts/tables) isn't in the initial bundle.
const TAB_LOADING = (
  <p className="text-13 text-gray-400 dark:text-white/50 py-8">جارٍ التحميل…</p>
);
const loader = (importFn) =>
  dynamic(importFn, { loading: () => TAB_LOADING });

const TAB_COMPONENTS = {
  overview: loader(() => import("./tabs/overview-tab")),
  campaigns: loader(() => import("./tabs/campaigns-tab")),
  seo: loader(() => import("./tabs/seo-tab")),
  content: loader(() => import("./tabs/content-tab")),
  reviews: loader(() => import("@/components/content/reviews/reviews-content-view")),
  reports: loader(() => import("./tabs/reports-tab")),
  pixels: loader(() => import("./tabs/pixels-tab")),
};

export default function MarketingContentWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isReady } = usePermissions();

  const visibleTabs = useMemo(
    () => (isReady ? MARKETING_TABS.filter((tab) => can(tab.section, "view")) : []),
    [can, isReady]
  );

  const requestedTab = searchParams.get("tab");
  const activeTab = visibleTabs.some((tab) => tab.value === requestedTab)
    ? requestedTab
    : visibleTabs[0]?.value;

  const setActiveTab = (value) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const ActivePanel = TAB_COMPONENTS[activeTab];

  return (
    <div
      className="mkt-page flex flex-col min-h-screen -m-[45px] p-[45px] max-[1700px]:-m-[30px] max-[1700px]:p-[30px] bg-[#F4F6F5] dark:bg-[#0B1411]"
      dir="rtl"
    >
      <div className="radm-head">
        <button type="button" className="mkt-back" onClick={() => router.back()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 6-6 6 6 6" />
          </svg>
          رجوع
        </button>

        <div className="radm-ttl">
          <b>التسويق والمحتوى</b>
          <small>{SCOPE_BREADCRUMB}</small>
        </div>

      </div>

      <div className="mkt-tabs" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn("mtab", activeTab === tab.value && "on")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* D7: تبويب «التقييمات» بيانات حقيقية من الخادم — لا يُعرض عليه تنبيه الأرقام التجريبية. */}
      {activeTab !== "reviews" ? (
      <div
        className="rounded-xl border border-dashed border-amber-400/70 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 text-[12.5px] font-bold px-4 py-3 mb-4 flex items-start gap-2"
        dir="rtl"
        role="status"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
        <span>
          لوحة التسويق قيد الإعداد قبل الإطلاق: لم يتم ربط مصادر التحليلات (قوقل، ميتا،
          البكسلات) بعد، والأرقام المعروضة تجريبية للعرض فقط ولا تمثل بيانات فعلية.
        </span>
      </div>
      ) : null}

      <div className="mkt-body">
        {ActivePanel ? (
          <MarketingPeriodProvider>
            <ActivePanel />
          </MarketingPeriodProvider>
        ) : null}
      </div>
    </div>
  );
}
