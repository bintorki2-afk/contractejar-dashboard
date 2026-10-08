"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionFormShell from "@/components/content/section-form-shell";
import SectionImageField from "@/components/content/section-image-field";
import SectionTextField from "@/components/content/section-text-field";
import {
  assetFormValue,
  buildSectionFormData,
  getStringValue,
  newLocalId,
} from "@/src/lib/content-admin";
import { useSaveSection } from "@/src/hooks/use-save-section";
import { firstYearPriceForCard, usePublicPricing } from "@/src/hooks/use-public-pricing";

const DEFAULT_VALUES = {
  badgeText: "الأسعار",
  mainTitle: "وثّق عقدك",
  description: "اختر نوع العقد المناسب لك وابدأ التوثيق فورًا.",
  cards: [
    {
      title: "عقد سكني",
      subtitle: "مناسبة للإيجار، عقد فردي، عقد عائلي ...",
      price: "249",
      durationLabel: "/ السنة الواحدة",
      features: [
        { text: "خلال دقائق ينجز عقدك" },
        { text: "مناسب لحساب المواطن" },
        { text: "مناسب للضمان المطور" },
        { text: "سند تنفيذي" },
        { text: "يطلبه للإيجار أو الاستثمار" },
      ],
    },
    {
      title: "عقد تجاري",
      subtitle: "مناسبة لمحلات تجارية، مكتب، مصنع ...",
      price: "349",
      durationLabel: "/ السنة الواحدة",
      features: [
        { text: "خلال دقائق ينجز عقدك" },
        { text: "متوافق مع وزارة التجارة" },
        { text: "توثيق عقد تجاري" },
        { text: "متوافق مع المركز السعودي للأعمال" },
        { text: "يطلبه للإيجار أو الاستثمار" },
      ],
    },
  ],
};

function toFormCard(card = {}) {
  return {
    id: card.id ?? null,
    title: getStringValue(card.title),
    subtitle: getStringValue(card.subtitle),
    price: getStringValue(card.price),
    durationLabel: getStringValue(card.duration_label),
    isDefault: Boolean(card.is_default),
    imageUrl: getStringValue(card.image_url),
    image: null,
    features: card.features?.length
      ? card.features.map((feature) => ({
          id: feature.id ?? null,
          text: getStringValue(feature.text),
        }))
      : [{ text: "" }],
  };
}

function PricingFeaturesFields({ control, cardIndex }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `cards.${cardIndex}.features`,
  });

  return (
    <div className="space-y-3 rounded-[18px] border border-[#EEEEEE] bg-[#FCFCFC] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-black dark:text-white">مميزات الباقة</h5>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: newLocalId(), text: "" })}
          className="rounded-full"
        >
          <Plus className="size-4" />
          إضافة ميزة
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((fieldItem, featureIndex) => (
          <div key={fieldItem.id} className="flex items-start gap-2">
            <div className="flex-1">
              <SectionTextField
                control={control}
                name={`cards.${cardIndex}.features.${featureIndex}.text`}
                size="sm"
                className="h-[44px] rounded-[14px] border-[#EEEEEE] bg-white px-4 dark:border-white/10 dark:bg-white/[0.04]"
                placeholder={`الميزة ${featureIndex + 1}`}
                rules={{ required: "نص الميزة مطلوب" }}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(featureIndex)}
              className="mt-1 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingSectionForm({ initialData, saveEndpoint, queryKey }) {
  const form = useForm({ defaultValues: DEFAULT_VALUES });
  const { saveSection, isPending } = useSaveSection({ saveEndpoint, queryKey });
  // السعر الظاهر في الموقع يأتي دائماً من الأسعار الرسمية (CROSS-D1) — الحقل هنا للعرض فقط.
  const { data: pricing } = usePublicPricing();
  const cards = form.watch("cards");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cards",
  });

  useEffect(() => {
    form.reset({
      badgeText: getStringValue(initialData?.badge_text, DEFAULT_VALUES.badgeText),
      mainTitle: getStringValue(initialData?.main_title, DEFAULT_VALUES.mainTitle),
      description: getStringValue(initialData?.description, DEFAULT_VALUES.description),
      cards: initialData?.cards?.length
        ? initialData.cards.map(toFormCard)
        : DEFAULT_VALUES.cards.map(toFormCard),
    });
  }, [form, initialData]);

  const onSubmit = (values) =>
    saveSection(
      buildSectionFormData("pricing", {
        badge_text: values.badgeText,
        main_title: values.mainTitle,
        description: values.description,
        cards: values.cards.map((card) => ({
          id: card.id || newLocalId(),
          title: card.title,
          subtitle: card.subtitle,
          price: card.price,
          duration_label: card.durationLabel,
          is_default: card.isDefault ? "1" : "0",
          ...assetFormValue(card.image, card.imageRemoved),
          features: card.features.map((feature) => ({
            id: feature.id || newLocalId(),
            text: feature.text,
          })),
        })),
      })
    );

  return (
    <SectionFormShell
      title="قسم الأسعار"
      description="عدل بيانات القسم العامة ثم حرّر باقات الأسعار — يمكنك إضافة باقة أو حذفها وإضافة مميزات داخل كل باقة."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ قسم الأسعار"
      formClassName="space-y-8"
    >
      <div className="space-y-5">
        <SectionTextField
          control={form.control}
          name="badgeText"
          label="الشارة"
          placeholder="مثال: الأسعار"
          rules={{ required: "نص الشارة مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="mainTitle"
          label="العنوان الرئيسي"
          placeholder="مثال: وثّق عقدك"
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

      <div className="space-y-4">
        <div className="flex items-center justify-between border-t border-[#ECECEC] pt-6 dark:border-white/10">
          <h3 className="text-base font-bold text-black dark:text-white">باقات الأسعار</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                id: newLocalId(),
                title: "",
                subtitle: "",
                price: "",
                durationLabel: "",
                isDefault: false,
                imageUrl: "",
                image: null,
                features: [{ id: newLocalId(), text: "" }],
              })
            }
            className="rounded-full"
          >
            <Plus className="size-4" />
            إضافة باقة
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {fields.map((fieldItem, cardIndex) => (
            <div
              key={fieldItem.id}
              className="rounded-[24px] border border-[#EAEAEA] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-black dark:text-white">
                  {cards?.[cardIndex]?.title?.trim() || `باقة ${cardIndex + 1}`}
                </h4>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(cardIndex)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="space-y-4">
                <SectionTextField
                  control={form.control}
                  name={`cards.${cardIndex}.title`}
                  label="العنوان"
                  size="sm"
                  rules={{ required: "عنوان الباقة مطلوب" }}
                />
                <SectionTextField
                  control={form.control}
                  name={`cards.${cardIndex}.subtitle`}
                  label="الوصف المختصر"
                  size="sm"
                  rules={{ required: "الوصف المختصر مطلوب" }}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <SectionTextField
                    control={form.control}
                    name={`cards.${cardIndex}.price`}
                    label="السعر"
                    size="sm"
                    readOnly
                    description={
                      firstYearPriceForCard(pricing, cardIndex) != null
                        ? `يُدار من «إعدادات النظام ← الأسعار والرسوم» — السعر الحالي في الموقع: ${firstYearPriceForCard(pricing, cardIndex)} ريال`
                        : "يُدار من «إعدادات النظام ← الأسعار والرسوم» ويظهر في الموقع تلقائياً"
                    }
                  />
                  <SectionTextField
                    control={form.control}
                    name={`cards.${cardIndex}.durationLabel`}
                    label="وصف المدة"
                    size="sm"
                    rules={{ required: "مدة السعر مطلوبة" }}
                  />
                </div>

                <SectionImageField
                  form={form}
                  name={`cards.${cardIndex}.image`}
                  removedFieldName={`cards.${cardIndex}.imageRemoved`}
                  initialUrl={getStringValue(cards?.[cardIndex]?.imageUrl)}
                  label="صورة الباقة"
                  size="sm"
                  uploadTitle="ارفع صورة الباقة"
                  previewClassName="h-40"
                />

                <label className="flex items-center gap-2 text-[13px] font-bold text-black dark:text-white">
                  <input
                    type="checkbox"
                    checked={Boolean(cards?.[cardIndex]?.isDefault)}
                    onChange={(e) =>
                      form.setValue(`cards.${cardIndex}.isDefault`, e.target.checked)
                    }
                    className="size-4 accent-brand-main"
                  />
                  الباقة المميزة (الافتراضية)
                </label>

                <PricingFeaturesFields control={form.control} cardIndex={cardIndex} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionFormShell>
  );
}
