"use client";

import { startTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS, WEBSITE_IMAGES_REGISTRY_ENABLED } from "@/src/lib/permissions";

const VIEWS = [
  {
    value: "home",
    label: "الصفحة الرئيسية",
    section: PERMISSION_SECTIONS.app_content,
  },
  {
    value: "about",
    label: "صفحة من نحن",
    section: PERMISSION_SECTIONS.app_content,
  },
  {
    value: "images",
    label: "صور الموقع (SEO)",
    section: PERMISSION_SECTIONS.website_images,
    // د4: مخفي — يخص الموقع القديم aqdi.sa (انظر WEBSITE_IMAGES_REGISTRY_ENABLED).
    enabled: WEBSITE_IMAGES_REGISTRY_ENABLED,
  },
  { value: "articles", label: "المقالات", section: PERMISSION_SECTIONS.blogs },
  {
    value: "services",
    label: "صفحات الخدمات",
    section: PERMISSION_SECTIONS.analytics,
  },
  {
    value: "faqs",
    label: "الأسئلة الشائعة",
    section: PERMISSION_SECTIONS.faqs,
  },
];

const VIEW_LOADING = (
  <p className="text-13 text-gray-400 dark:text-white/50 py-8">جارٍ التحميل…</p>
);
const loader = (importFn) =>
  dynamic(importFn, { loading: () => VIEW_LOADING });

const VIEW_COMPONENTS = {
  home: loader(() => import("@/components/content/home/home-content-sections")),
  about: loader(() => import("@/components/content/about/about-content-sections")),
  images: loader(() =>
    import("@/components/content/website-images/website-images-section")
  ),
  articles: loader(() => import("./content-articles-view")),
  services: loader(() => import("./content-services-view")),
  faqs: loader(() => import("@/components/content/faqs/faqs-content-view")),
};

export default function ContentTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isReady } = usePermissions();

  const visibleViews = useMemo(
    () =>
      isReady
        ? VIEWS.filter((item) => item.enabled !== false && (!item.section || can(item.section, "view")))
        : [],
    [can, isReady]
  );

  const requestedView = searchParams.get("view");
  const currentView = visibleViews.some((item) => item.value === requestedView)
    ? requestedView
    : visibleViews[0]?.value;

  const setView = (value) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "content");
      params.set("view", value);
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const ActivePanel = VIEW_COMPONENTS[currentView];

  return (
    <div>
      <div className="mkt-subtabs">
        {visibleViews.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setView(item.value)}
            className={cn("mkt-subtab", currentView === item.value && "on")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {requestedView === "images" && !WEBSITE_IMAGES_REGISTRY_ENABLED ? (
        <div role="note" className="mb-4 rounded-2xl border border-[#F3DFA9] bg-[#FFF8E6] px-4 py-3 text-[13px] text-[#7A5600] dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          <b>«صور الموقع (SEO)» مخفية:</b> هذا السجل يخص الموقع القديم ولا يستخدمه موقع «عقد إيجار» (contractejar.com).
          صور المقالات والصفحات والأقسام تُدار من محرراتها في «إدارة المحتوى».
        </div>
      ) : null}
      {ActivePanel ? <ActivePanel /> : null}
    </div>
  );
}
