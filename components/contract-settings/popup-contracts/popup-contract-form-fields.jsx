"use client";

import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getPopupInstrumentTypeOptions } from "@/src/lib/popup-contracts";

const TextEditor = dynamic(
  () => import("@/components/analysis/settings/terms/text-editor"),
  { ssr: false }
);

export default function PopupContractFormFields({
  instrumentType,
  onInstrumentTypeChange,
  popupStatusContract,
  onPopupStatusContractChange,
  popupStatusRealestate,
  onPopupStatusRealestateChange,
  contentPopup,
  onContentPopupChange,
  contentEditorKey = 0,
  buttonText,
  onButtonTextChange,
  buttonLink,
  onButtonLinkChange,
  instrumentOptions,
  instrumentTypeDisabled = false,
}) {
  const options = instrumentOptions ?? getPopupInstrumentTypeOptions();

  return (
    <div dir="rtl" className="flex min-w-0 max-w-full flex-col gap-4 text-right">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-[#111827] dark:text-white">
          نوع الوثيقة <span className="text-red-500">*</span>
        </span>
        <Select
          dir="rtl"
          value={instrumentType}
          onValueChange={onInstrumentTypeChange}
          disabled={instrumentTypeDisabled || options.length === 0}
        >
          <SelectTrigger className="h-11 rounded-xl border-[#E6EBE9] bg-white px-3 text-[13px] focus:border-[#0B5A3C] focus:ring-0 dark:border-white/10 dark:bg-white/[0.04]">
            <SelectValue
              placeholder={
                options.length === 0
                  ? "لا توجد أنواع متاحة للإضافة"
                  : "اختر نوع الوثيقة"
              }
            />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-between rounded-xl border border-[#E6EBE9] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-[13px] font-bold text-[#111827] dark:text-white">بوب أب العقد</span>
          <Switch
            dir="ltr"
            checked={popupStatusContract}
            onCheckedChange={onPopupStatusContractChange}
            className="data-[state=checked]:bg-[#0B5A3C]"
          />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-[#E6EBE9] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-[13px] font-bold text-[#111827] dark:text-white">بوب أب العقار</span>
          <Switch
            dir="ltr"
            checked={popupStatusRealestate}
            onCheckedChange={onPopupStatusRealestateChange}
            className="data-[state=checked]:bg-[#0B5A3C]"
          />
        </label>
      </div>

      <div className="flex min-w-0 max-w-full flex-col gap-1.5">
        <span className="text-[13px] font-bold text-[#111827] dark:text-white">
          محتوى البوب أب <span className="text-red-500">*</span>
        </span>
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[#E6EBE9] dark:border-white/10">
          <TextEditor
            key={contentEditorKey}
            compact
            initialContent={contentPopup}
            placeholder="اكتب محتوى البوب أب هنا ..."
            onChange={(value) => onContentPopupChange(value?.html || "")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827] dark:text-white">نص الزر</span>
          <Input
            placeholder="مثال: ابدأ الآن"
            value={buttonText}
            onChange={(e) => onButtonTextChange(e.target.value)}
            className="h-11 rounded-xl border-[#E6EBE9] text-[13px] focus-visible:border-[#0B5A3C] focus-visible:ring-0 dark:border-white/10 dark:bg-white/[0.04]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827] dark:text-white">رابط الزر</span>
          <Input
            dir="ltr"
            placeholder="https://example.com"
            value={buttonLink}
            onChange={(e) => onButtonLinkChange(e.target.value)}
            className="h-11 rounded-xl border-[#E6EBE9] text-[13px] focus-visible:border-[#0B5A3C] focus-visible:ring-0 dark:border-white/10 dark:bg-white/[0.04]"
          />
        </label>
      </div>
    </div>
  );
}
