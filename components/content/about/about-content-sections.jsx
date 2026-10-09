"use client";

import { useState } from "react";
import {
  BarChart3,
  HeartHandshake,
  LayoutTemplate,
  Search,
  Telescope,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AboutBeneficiariesSectionForm from "@/components/content/about/about-beneficiaries-section-form";
import AboutHeroSectionForm from "@/components/content/about/about-hero-section-form";
import AboutStorySectionForm from "@/components/content/about/about-story-section-form";
import AboutValuesSectionForm from "@/components/content/about/about-values-section-form";
import AboutVisionMissionSectionForm from "@/components/content/about/about-vision-mission-section-form";
import PageSeoForm from "@/components/content/page-seo-form";
import SectionEmptyNote from "@/components/content/section-empty-note";
import Loader from "@/components/home/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/src/hooks/use-permissions";
import { CONTENT_PAGE_ENDPOINTS, extractContentSections } from "@/src/lib/content-admin";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { axiosInstance } from "@/src/utils/axios";

const QUERY_KEY = ["content-page", "about"];

const ABOUT_CONTENT_TABS = [
  { value: "seo", label: "SEO", icon: Search, kind: "seo" },
  { value: "hero", label: "القسم الرئيسي", icon: LayoutTemplate, sectionKey: "hero", Form: AboutHeroSectionForm },
  { value: "story", label: "قصتنا", icon: BarChart3, sectionKey: "story", Form: AboutStorySectionForm },
  { value: "vision-mission", label: "الرؤية والرسالة", icon: Telescope, sectionKey: "vision_mission", Form: AboutVisionMissionSectionForm },
  { value: "beneficiaries", label: "المستفيدون", icon: Users, sectionKey: "beneficiaries", Form: AboutBeneficiariesSectionForm },
  { value: "values", label: "قيمنا", icon: HeartHandshake, sectionKey: "values", Form: AboutValuesSectionForm },
];

export default function AboutContentSections() {
  const [activeTab, setActiveTab] = useState(ABOUT_CONTENT_TABS[0].value);
  const { can, isAdmin } = usePermissions();
  const canEditSeo = isAdmin || can(PERMISSION_SECTIONS.app_content, "edit");
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      axiosInstance.get(CONTENT_PAGE_ENDPOINTS.about).then((res) => res?.data),
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
        {ABOUT_CONTENT_TABS.map((tab) => {
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

      {ABOUT_CONTENT_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.kind === "seo" ? (
            <PageSeoForm
              pageLabel="صفحة من نحن"
              responseData={responseData}
              saveEndpoint={CONTENT_PAGE_ENDPOINTS.about}
              queryKey={QUERY_KEY}
              canEdit={canEditSeo}
            />
          ) : (
            <>
            <SectionEmptyNote data={sections[tab.sectionKey]} />
            <tab.Form
              initialData={sections[tab.sectionKey]}
              saveEndpoint={CONTENT_PAGE_ENDPOINTS.about}
              queryKey={QUERY_KEY}
            />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
