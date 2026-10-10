"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import SectionFormShell from "@/components/content/section-form-shell";
import SectionTextField from "@/components/content/section-text-field";
import {
  buildPageMetaFormData,
  extractPageMeta,
} from "@/src/lib/content-admin";
import { useSaveSection } from "@/src/hooks/use-save-section";

const DEFAULT_VALUES = {
  meta_title: "",
  meta_description: "",
};

/**
 * Page-level meta title / description editor for content-pages.
 * Arabic-only. Saves top-level `meta_title` / `meta_description` without section trees.
 */
export default function PageSeoForm({
  pageLabel,
  responseData,
  saveEndpoint,
  queryKey,
  canEdit = true,
}) {
  const form = useForm({ defaultValues: DEFAULT_VALUES });
  const { saveSection, isPending } = useSaveSection({ saveEndpoint, queryKey });

  useEffect(() => {
    form.reset(extractPageMeta(responseData));
  }, [form, responseData]);

  const onSubmit = (values) => {
    if (!canEdit) return;
    saveSection(buildPageMetaFormData(values), {
      onSuccess: (res) => {
        form.reset(extractPageMeta(res?.data));
      },
    });
  };

  return (
    <SectionFormShell
      title={`تحسين محركات البحث — ${pageLabel}`}
      description="عنوان ووصف الصفحة في نتائج البحث ومعاينات الروابط. اترك الحقل فارغًا لاستخدام القيمة الافتراضية في الموقع."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ بيانات SEO"
      submitDisabled={!canEdit}
      headerExtra={
        <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F3F3F3] px-4 text-xs font-bold text-[#616161] dark:bg-white/[0.06] dark:text-white/55">
          <Search className="size-3.5" />
          SEO
        </span>
      }
    >
      <fieldset disabled={!canEdit} className="space-y-5 disabled:opacity-70">
        <SectionTextField
          control={form.control}
          name="meta_title"
          label="عنوان الصفحة (SEO)"
          placeholder="مثال: الأسئلة الشائعة — عقدي"
          description="يُفضّل ألا يتجاوز ~60 حرفًا (الحد الأقصى 255)."
        />
        <SectionTextField
          control={form.control}
          name="meta_description"
          label="وصف الصفحة (SEO)"
          placeholder="وصف مختصر يظهر تحت العنوان في نتائج البحث"
          multiline
          description="يُفضّل ألا يتجاوز ~160 حرفًا (الحد الأقصى 500)."
        />
      </fieldset>
      {!canEdit ? (
        <p className="text-xs font-medium text-[#8A8A8A] dark:text-white/40">
          ليس لديك صلاحية تعديل بيانات SEO لهذه الصفحة.
        </p>
      ) : null}
    </SectionFormShell>
  );
}
