"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import SectionCardsList from "@/components/content/section-cards-list";
import SectionFormShell from "@/components/content/section-form-shell";
import SectionTextField from "@/components/content/section-text-field";
import {
  assetFormValue,
  buildSectionFormData,
  getStringValue,
  newLocalId,
} from "@/src/lib/content-admin";
import { useSaveSection } from "@/src/hooks/use-save-section";

const DEFAULT_VALUES = {
  badgeText: "مميزاتنا",
  mainTitle: "لماذا عقدي؟",
  description: "عقدك الموثق من شبكة إيجار والهيئة العامة للعقار خلال دقائق.",
  cards: [
    {
      title: "ثقة عالية",
      description:
        "منصة مرخصة من شبكة إيجار والهيئة العامة لكامل تضمن لك عقود موثقة ومعتمدة رسميًا.",
    },
    {
      title: "نوفر وقتك",
      description: "أنجز عقدك الإلكتروني خلال دقائق فقط دون الحاجة لزيارة مكتب.",
    },
    {
      title: "دعم قوي 24/7",
      description: "دعم قوي لمساعدتك في إنشاء العقد وحل أي مشكلة بسرعة.",
    },
  ],
};

export default function FeaturesSectionForm({ initialData, saveEndpoint, queryKey }) {
  const form = useForm({ defaultValues: DEFAULT_VALUES });
  const { saveSection, isPending } = useSaveSection({ saveEndpoint, queryKey });
  const cards = form.watch("cards");

  useEffect(() => {
    form.reset({
      badgeText: getStringValue(initialData?.badge_text, DEFAULT_VALUES.badgeText),
      mainTitle: getStringValue(initialData?.main_title, DEFAULT_VALUES.mainTitle),
      description: getStringValue(initialData?.description, DEFAULT_VALUES.description),
      cards: (initialData?.cards?.length
        ? initialData.cards
        : DEFAULT_VALUES.cards
      ).map((card) => ({
        id: card.id ?? null,
        title: getStringValue(card.title),
        description: getStringValue(card.description),
        imageUrl: getStringValue(card.image_url),
        image: null,
      })),
    });
  }, [form, initialData]);

  const onSubmit = (values) =>
    saveSection(
      buildSectionFormData("features", {
        badge_text: values.badgeText,
        main_title: values.mainTitle,
        description: values.description,
        cards: values.cards.map((card) => ({
          id: card.id || newLocalId(),
          title: card.title,
          description: card.description,
          ...assetFormValue(card.image, card.imageRemoved),
        })),
      })
    );

  return (
    <SectionFormShell
      title="قسم المميزات"
      description="عدل الشارة والعنوان والوصف، ثم حدّث محتوى بطاقات المميزات الثابتة دون تغيير عددها."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ قسم المميزات"
      formClassName="space-y-8"
    >
      <div className="space-y-5">
        <SectionTextField
          control={form.control}
          name="badgeText"
          label="الشارة"
          placeholder="مثال: مميزاتنا"
          rules={{ required: "نص الشارة مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="mainTitle"
          label="العنوان الرئيسي"
          placeholder="مثال: لماذا عقدي؟"
          rules={{ required: "العنوان الرئيسي مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="description"
          label="الوصف"
          placeholder="أدخل الوصف الخاص بالقسم"
          multiline
          rules={{ required: "الوصف مطلوب" }}
        />
      </div>

      <SectionCardsList
        control={form.control}
        heading="محتوى البطاقات"
        addLabel="إضافة ميزة"
        emptyItem={{ title: "", description: "", imageUrl: "", image: null }}
        imageField={{ form, label: "صورة الميزة", uploadTitle: "ارفع صورة الميزة" }}
        getCardTitle={(index) =>
          cards?.[index]?.title?.trim() ||
          DEFAULT_VALUES.cards[index]?.title ||
          `ميزة ${index + 1}`
        }
        fieldsConfig={[
          {
            key: "title",
            label: "العنوان",
            placeholder: (index) =>
              DEFAULT_VALUES.cards[index]?.title || `ميزة ${index + 1}`,
            rules: { required: "عنوان الميزة مطلوب" },
          },
          {
            key: "description",
            label: "الوصف",
            multiline: true,
            placeholder: (index) => DEFAULT_VALUES.cards[index]?.description || "",
            rules: { required: "وصف الميزة مطلوب" },
          },
        ]}
      />
    </SectionFormShell>
  );
}
