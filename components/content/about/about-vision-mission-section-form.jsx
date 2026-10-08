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
  sectionTitle: "كل ما تريد معرفته",
  sectionDescription:
    'يمكنك استخدام منصة «عقد إيجار» لتوثيق عقودك السكنية والتجارية بسهولة ويسر.',
  mission: {
    badgeText: "الرسالة",
    title: "رسالتنا",
    description:
      "نقدم حلولًا عقارية موثوقة تركز على الكفاءة والفعالية لتشغيل أعمالنا وحماية الوقت، لنكون عنصرًا أساسيًا في نجاح شركائنا وموظفينا.",
    image: null,
  },
  vision: {
    badgeText: "الرؤية",
    title: "رؤيتنا..",
    description:
      "أن تكون إيجار الأولى في قطاع المنشآت العقارية ومرافق مستهدفات رؤية 2030.",
    image: null,
  },
};

function VisionMissionItem({ form, sectionKey, title, initialUrl, uploadLabel }) {
  return (
    <div className="rounded-[24px] border border-[#EAEAEA] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-black dark:text-white">{title}</h4>
      </div>

      <div className="space-y-4">
        <SectionTextField
          control={form.control}
          name={`${sectionKey}.badgeText`}
          label="الشارة"
          size="sm"
          rules={{ required: "نص الشارة مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name={`${sectionKey}.title`}
          label="العنوان"
          size="sm"
          rules={{ required: "العنوان مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name={`${sectionKey}.description`}
          label="الوصف"
          size="sm"
          multiline
          className="min-h-[110px] rounded-[16px] border-[#EEEEEE] bg-white px-4 py-3 text-sm leading-6 resize-none dark:border-white/10 dark:bg-white/[0.04]"
          rules={{ required: "الوصف مطلوب" }}
        />
        <SectionImageField
          form={form}
          name={`${sectionKey}.image`}
          removedFieldName={`${sectionKey}.imageRemoved`}
          initialUrl={initialUrl}
          label="صورة الجزء"
          size="sm"
          uploadTitle={uploadLabel}
          previewClassName="h-[220px]"
        />
      </div>
    </div>
  );
}

export default function AboutVisionMissionSectionForm({
  initialData,
  saveEndpoint,
  queryKey,
}) {
  const form = useForm({ defaultValues: DEFAULT_VALUES });
  const { saveSection, isPending } = useSaveSection({ saveEndpoint, queryKey });

  useEffect(() => {
    form.reset({
      sectionTitle: getStringValue(
        initialData?.section_title,
        DEFAULT_VALUES.sectionTitle
      ),
      sectionDescription: getStringValue(
        initialData?.section_description,
        DEFAULT_VALUES.sectionDescription
      ),
      mission: {
        badgeText: getStringValue(
          initialData?.mission?.badge_text,
          DEFAULT_VALUES.mission.badgeText
        ),
        title: getStringValue(initialData?.mission?.title, DEFAULT_VALUES.mission.title),
        description: getStringValue(
          initialData?.mission?.description,
          DEFAULT_VALUES.mission.description
        ),
        image: null,
      },
      vision: {
        badgeText: getStringValue(
          initialData?.vision?.badge_text,
          DEFAULT_VALUES.vision.badgeText
        ),
        title: getStringValue(initialData?.vision?.title, DEFAULT_VALUES.vision.title),
        description: getStringValue(
          initialData?.vision?.description,
          DEFAULT_VALUES.vision.description
        ),
        image: null,
      },
    });
  }, [form, initialData]);

  const onSubmit = (values) =>
    saveSection(
      buildSectionFormData("vision_mission", {
        section_title: values.sectionTitle,
        section_description: values.sectionDescription,
        mission: {
          badge_text: values.mission.badgeText,
          title: values.mission.title,
          description: values.mission.description,
          ...assetFormValue(values.mission.image, values.mission.imageRemoved),
        },
        vision: {
          badge_text: values.vision.badgeText,
          title: values.vision.title,
          description: values.vision.description,
          ...assetFormValue(values.vision.image, values.vision.imageRemoved),
        },
      })
    );

  return (
    <SectionFormShell
      title="قسم الرؤية والرسالة"
      description="عدل محتوى جزئي الرسالة والرؤية، مع صورة مستقلة لكل جزء."
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="حفظ قسم الرؤية والرسالة"
      formClassName="space-y-8"
    >
      <div className="space-y-5">
        <SectionTextField
          control={form.control}
          name="sectionTitle"
          label="عنوان القسم"
          placeholder="مثال: كل ما تريد معرفته"
          rules={{ required: "عنوان القسم مطلوب" }}
        />
        <SectionTextField
          control={form.control}
          name="sectionDescription"
          label="وصف القسم"
          placeholder='مثال: يمكنك استخدام منصة «عقد إيجار» لتوثيق عقودك السكنية والتجارية بسهولة ويسر.'
          multiline
          rules={{ required: "وصف القسم مطلوب" }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <VisionMissionItem
          form={form}
          sectionKey="mission"
          title="الرسالة"
          initialUrl={initialData?.mission?.image_url || ""}
          uploadLabel="ارفع صورة الرسالة"
        />
        <VisionMissionItem
          form={form}
          sectionKey="vision"
          title="الرؤية"
          initialUrl={initialData?.vision?.image_url || ""}
          uploadLabel="ارفع صورة الرؤية"
        />
      </div>
    </SectionFormShell>
  );
}
