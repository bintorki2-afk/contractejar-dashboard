"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AddFaqDialog from "@/components/analysis/settings/faqs/add-faq-dialog";
import EditFaqDialog from "@/components/analysis/settings/faqs/edit-faq-dialog";
import DeleteFaqDialog from "@/components/analysis/settings/faqs/delete-faq-dialog";
import ContentPageSeoPanel from "@/components/content/content-page-seo-panel";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsPagination,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
} from "@/components/system-settings/shared";
import SectionCard from "@/components/content/marketing/shared/section-card";
import { axiosInstance } from "@/src/utils/axios";

const PER_PAGE = 10;
const HEADERS = [
  "السؤال",
  "الجواب",
  { label: "الإجراءات", className: "text-left" },
];

/** FAQs index: page-level SEO card + questions CRUD table. */
export default function FaqsContentView() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["faqs", currentPage],
    queryFn: () =>
      axiosInstance
        .get(`/admin/faqs?per_page=${PER_PAGE}&page=${currentPage}`)
        .then((res) => res?.data),
  });

  const faqs = responseData?.data?.items ?? [];
  const pagination = responseData?.data?.pagination;

  return (
    <div>
      <ContentPageSeoPanel
        pageKey="faqs"
        pageLabel="صفحة قائمة الأسئلة الشائعة"
        permissionSection={PERMISSION_SECTIONS.faqs}
      />

      <SectionCard
        title="الأسئلة الشائعة"
        className="mt-3"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.faqs} action="create">
            <AddFaqDialog />
          </PermissionGate>
        }
      >
        <p className="mb-3 text-[12.5px] text-[#6B7570] dark:text-white/50">
          المصدر الوحيد للأسئلة الشائعة: ما تضيفه هنا يظهر مباشرة في صفحة «الأسئلة الشائعة» في الموقع والتطبيق.
        </p>
        <SettingsTable headers={HEADERS} minWidth="860px">
          {isLoading ? (
            <SettingsLoadingRows colSpan={3} />
          ) : faqs.length === 0 ? (
            <SettingsEmptyRow colSpan={3} />
          ) : (
            faqs.map((faq) => (
              <SettingsTableRow key={faq.id}>
                <SettingsTd className="min-w-[200px] font-bold">
                  {faq.title_ar || faq.title_trans || "—"}
                </SettingsTd>
                <SettingsTd className="max-w-[480px]">
                  <p className="line-clamp-3 whitespace-pre-wrap text-[#4B5563] dark:text-white/70">
                    {faq.answer_ar || faq.answer_trans || "—"}
                  </p>
                </SettingsTd>
                <SettingsTd>
                  <div className="flex items-center justify-end gap-2">
                    <PermissionGate
                      section={PERMISSION_SECTIONS.faqs}
                      action="edit"
                    >
                      <EditFaqDialog faq={faq} />
                    </PermissionGate>
                    <PermissionGate
                      section={PERMISSION_SECTIONS.faqs}
                      action="delete"
                    >
                      <DeleteFaqDialog faq={faq} />
                    </PermissionGate>
                  </div>
                </SettingsTd>
              </SettingsTableRow>
            ))
          )}
        </SettingsTable>

        <SettingsPagination
          page={currentPage}
          lastPage={pagination?.last_page}
          onPageChange={setCurrentPage}
        />
      </SectionCard>
    </div>
  );
}
