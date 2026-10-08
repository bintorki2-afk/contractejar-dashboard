"use client";

import { useState } from "react";
import {
  Grid2x2,
  LayoutTemplate,
  MessageCircleMore,
  Search,
  Smartphone,
  Sparkles,
  Tags,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppSectionForm from "@/components/content/home/app-section-form";
import ContactSectionForm from "@/components/content/home/contact-section-form";
import FeaturesSectionForm from "@/components/content/home/features-section-form";
import HeroContentForm from "@/components/content/home/hero-content-form";
import OfficialAuthoritiesForm from "@/components/content/home/official-authorities-form";
import PricingSectionForm from "@/components/content/home/pricing-section-form";
import PageSeoForm from "@/components/content/page-seo-form";
import SectionEmptyNote from "@/components/content/section-empty-note";
import Loader from "@/components/home/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/src/hooks/use-permissions";
import { CONTENT_PAGE_ENDPOINTS, extractContentSections } from "@/src/lib/content-admin";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { axiosInstance } from "@/src/utils/axios";

const QUERY_KEY = ["content-page", "home"];

const HOME_CONTENT_TABS = [
  { value: "seo", label: "SEO", icon: Search, kind: "seo" },
  { value: "hero", label: "القسم الرئيسي", icon: LayoutTemplate, sectionKey: "hero", Form: HeroContentForm },
  { value: "official-authorities", label: "الجهات الرسمية", icon: Grid2x2, sectionKey: "official_authorities", Form: OfficialAuthoritiesForm },
  { value: "features", label: "المميزات", icon: Sparkles, sectionKey: "features", Form: FeaturesSectionForm },
  { value: "pricing", label: "الأسعار", icon: Tags, sectionKey: "pricing", Form: PricingSectionForm },
  { value: "contact", label: "التواصل", icon: MessageCircleMore, sectionKey: "contact", Form: ContactSectionForm },
  { value: "app", label: "التطبيق", icon: Smartphone, sectionKey: "app", Form: AppSectionForm },
];

export default function HomeContentSections() {
  const [activeTab, setActiveTab] = useState(HOME_CONTENT_TABS[0].value);
  const { can, isAdmin } = usePermissions();
  const canEditSeo = isAdmin || can(PERMISSION_SECTIONS.app_content, "edit");
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      axiosInstance.get(CONTENT_PAGE_ENDPOINTS.home).then((res) => res?.data),
  });

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-dashed border-[#D9D9D9] bg-white p-6 dark:border-white/15 dark:bg-white/[0.03]">
        <p className="text-sm leading-7 text-[#7A7A7A] dark:text-white/50">
          تعذر تحميل محتوى الصفحة. يرجى إعادة المحاولة لاحقًا.
        </p>
      </div>
    );
  }

  const sections = extractContentSections(responseData);

  return (
    <Tabs dir="rtl" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 h-auto flex-wrap justify-start gap-3 bg-transparent p-0">
        {HOME_CONTENT_TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-12 rounded-full bg-[#F3F3F3] px-5 text-sm font-bold text-[#616161] transition-all hover:bg-[#ECECEC] data-[state=active]:bg-brand-main data-[state=active]:text-white data-[state=active]:shadow-none dark:bg-white/[0.06] dark:text-white/60 dark:hover:bg-white/[0.1] dark:data-[state=active]:bg-emerald-500 dark:data-[state=active]:text-[#0B1411]"
            >
              <Icon className="ml-2 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {HOME_CONTENT_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.kind === "seo" ? (
            <PageSeoForm
              pageLabel="الصفحة الرئيسية"
              responseData={responseData}
              saveEndpoint={CONTENT_PAGE_ENDPOINTS.home}
              queryKey={QUERY_KEY}
              canEdit={canEditSeo}
            />
          ) : (
            <>
            <SectionEmptyNote data={sections[tab.sectionKey]} />
            <tab.Form
              initialData={sections[tab.sectionKey]}
              saveEndpoint={CONTENT_PAGE_ENDPOINTS.home}
              queryKey={QUERY_KEY}
            />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
