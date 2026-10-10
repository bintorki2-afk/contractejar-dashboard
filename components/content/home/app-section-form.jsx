"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import SectionFormShell from "@/components/content/section-form-shell";
import SectionImageField from "@/components/content/section-image-field";
import SectionTextField from "@/components/content/section-text-field";
import {
  assetFormValue,
  buildSectionFormData,
  getStringValue,
} from "@/src/lib/content-admin";
import { useSaveSection } from "@/src/hooks/use-save-section";

const DEFAULT_VALUES = {
  badgeText: "تطبيق الجوال",
  mainTitle: "وثّق عقودك من هاتفك الذكي",
  description:
    "حمّل تطبيق «عقدي» وأنجز جميع معاملاتك الإيجارية من أي مكان، بواجهة سهلة الاستخدام وإشعارات فورية وتجربة سلسة تغنيك عن زيارة أي مكتب.",
  image: null,
};

export default function AppSectionForm({ initialData, saveEndpoint, queryKey }) {
  const form = useForm({ defaultValues: DEFAULT_VALUES });
  const { saveSection, isPending } = useSaveSection({ saveEndpoint, queryKey });

  useEffect(() => {
    form.reset({
      badgeText: getStringValue(initialData?.badge_text, DEFAULT_VALUES.badgeText),
      mainTitle: getStringValue(initialData?.main_title, DEFAULT_VALUES.mainTitle),
      description: getStringValue(initialData?.description, DEFAULT_VALUES.description),
      image: null,
    });
  }, [form, initialData]);

  const onSubmit = (values) =>
    saveSection(
      buildSectionFormData("app", {
        badge_text: values.badgeText,
        main_title: values.mainTitle,
        description: values.description,
        ...assetFormValue(values.image, values.imageRemoved),
      })
    );

  return (
    <SectionFormShell
      title="قسم التطبيق"
      description="عدل نصوص قسم التطبيق وصورته الرئيسية كما تظهر في الصفحة الرئيسية."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ قسم التطبيق"
    >
      <SectionTextField
        control={form.control}
        name="badgeText"
        label="الشارة"
        placeholder="مثال: تطبيق الجوال"
        rules={{ required: "نص الشارة مطلوب" }}
      />
      <SectionTextField
        control={form.control}
        name="mainTitle"
        label="العنوان الرئيسي"
        placeholder="مثال: وثّق عقودك من هاتفك الذكي"
        multiline
        rules={{ required: "العنوان الرئيسي مطلوب" }}
      />
      <SectionTextField
        control={form.control}
        name="description"
        label="الوصف"
        placeholder="أدخل وصف قسم التطبيق"
        multiline
        rules={{ required: "الوصف مطلوب" }}
      />
      <SectionImageField
        form={form}
        name="image"
        initialUrl={initialData?.image_url || ""}
        label="صورة القسم"
        uploadTitle="ارفع صورة قسم التطبيق"
      />
    </SectionFormShell>
  );
}
