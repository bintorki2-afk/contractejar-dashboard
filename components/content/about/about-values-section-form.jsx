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
  badgeText: "قيمنا",
  mainTitle: "قيمنا",
  description:
    "يهدف (إيجار) إلى تنظيم قطاع الإيجار العقاري في المملكة العربية السعودية بصورة متوازنة تحفظ حقوق أطراف العملية الإيجارية.",
  cards: [
    {
      title: "نحو إدارة واضحة ومسؤولة",
      description:
        "نوفر معلومات واضحة ومحدثة بشكل كامل للجمهور بشفافية لتعزيز قيم المواطنين.",
    },
    {
      title: "أساس علاقتنا مع المواطن",
      description: "يمكنكم تستند إلى مبادئ شفافة ومعلومات دقيقة لخدمتكم بكفاءة.",
    },
    {
      title: "خدمة فعالة ورؤية واضحة",
      description:
        "نوفر معلومات واضحة ومحدثة بشكل كامل للجمهور بشفافية لتعزيز قيم المواطنين.",
    },
  ],
};

export default function AboutValuesSectionForm({ initialData, saveEndpoint, queryKey }) {
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
      buildSectionFormData("values", {
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
      title="قسم «قيمنا»"
      description="عدل الشارة والعنوان والوصف، ثم حدّث البطاقات الثلاث الأساسية مع إمكانية إضافة بطاقات جديدة."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ قسم «قيمنا»"
      formClassName="space-y-8"
    >
      <div className="space-y-5">
        <SectionTextField
          control={form.control}
          name="badgeText"
          label="الشارة"
          placeholder="مثال: قيمنا"
          rules={{ required: "نص الشارة مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="mainTitle"
          label="العنوان الرئيسي"
          placeholder="مثال: قيمنا"
          rules={{ required: "العنوان الرئيسي مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="description"
          label="الوصف"
          placeholder="أدخل وصف القسم"
          multiline
          rules={{ required: "الوصف مطلوب" }}
        />
      </div>

      <SectionCardsList
        control={form.control}
        heading="محتوى البطاقات"
        addLabel="إضافة بطاقة"
        emptyItem={{ title: "", description: "", imageUrl: "", image: null }}
        imageField={{ form, label: "صورة البطاقة", uploadTitle: "ارفع صورة البطاقة" }}
        getCardTitle={(index) =>
          cards?.[index]?.title?.trim() ||
          DEFAULT_VALUES.cards[index]?.title ||
          `بطاقة ${index + 1}`
        }
        fieldsConfig={[
          {
            key: "title",
            label: "العنوان",
            placeholder: (index) =>
              DEFAULT_VALUES.cards[index]?.title || "أدخل عنوان البطاقة",
            rules: { required: "عنوان البطاقة مطلوب" },
          },
          {
            key: "description",
            label: "الوصف",
            multiline: true,
            placeholder: (index) =>
              DEFAULT_VALUES.cards[index]?.description || "أدخل وصف البطاقة",
            rules: { required: "وصف البطاقة مطلوب" },
          },
        ]}
      />
    </SectionFormShell>
  );
}
