"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import SettingsFormDialog, {
  SettingsFieldLabel,
  settingsFieldClass,
} from "@/components/system-settings/settings-form-dialog";
import { cn } from "@/lib/utils";
import { REVIEW_CONTRACT_TYPES } from "@/src/lib/customer-reviews";
import { useSaveCustomerReview } from "@/src/hooks/use-customer-reviews";

const EMPTY = { name: "", city: "", text: "", rating: 5, contract_type: "", is_visible: true };
const TEXT_MAX = 600;

/** اختيار النجوم 1..5 (أزرار؛ يعمل بلوحة المفاتيح). */
export function StarPicker({ value = 5, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="عدد النجوم" className="flex items-center gap-1" dir="rtl">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} من 5`}
            disabled={disabled}
            onClick={() => onChange?.(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A3C]/40"
          >
            <Star className={cn("size-6", on ? "fill-[#F5B301] text-[#F5B301]" : "text-[#D4DCD8] dark:text-white/20")} />
          </button>
        );
      })}
      <span className="ms-2 text-[12px] font-bold tabular-nums text-[#6B7570] dark:text-white/50">{value} / 5</span>
    </div>
  );
}

/**
 * نموذج إضافة/تعديل تقييم (D7). `review` = null للإضافة.
 * الحقول: الاسم*، المدينة/الوصف، النص*، النجوم*، نوع العقد، ظاهر.
 */
export default function ReviewFormDialog({ open, onOpenChange, review = null }) {
  const isEdit = Boolean(review?.id);
  const save = useSaveCustomerReview();
  const form = useForm({ defaultValues: EMPTY });
  const { register, control, handleSubmit, reset, formState } = form;
  const text = useWatch({ control, name: "text" }) ?? "";

  useEffect(() => {
    if (!open) return;
    reset(
      review
        ? {
            name: review.name ?? "",
            city: review.city ?? "",
            text: review.text ?? "",
            rating: review.rating ?? 5,
            contract_type: review.contract_type ?? "",
            is_visible: review.is_visible !== false,
          }
        : EMPTY
    );
  }, [open, review, reset]);

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: review?.id, values },
      { onSuccess: () => onOpenChange?.(false) }
    )
  );

  const errors = formState.errors;

  return (
    <SettingsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "تعديل تقييم" : "تقييم جديد"}
      description="يظهر كما هو في قسم «آراء العملاء» في الموقع والتطبيق — اكتب الاسم مختصراً (مثل: عبدالملك س.)."
      onSubmit={onSubmit}
      submitLabel={isEdit ? "حفظ التعديل" : "إضافة التقييم"}
      isPending={save.isPending}
      maxWidthClass="sm:max-w-[560px]"
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <SettingsFieldLabel required>اسم العميل</SettingsFieldLabel>
          <Input
            {...register("name", { validate: (v) => (String(v ?? "").trim() ? true : "اسم العميل مطلوب") })}
            placeholder="مثال: عبدالملك س."
            maxLength={80}
            className={cn(settingsFieldClass, errors.name && "border-red-400")}
          />
          {errors.name ? <span className="text-[11.5px] font-bold text-red-600">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1.5">
          <SettingsFieldLabel>المدينة / الوصف</SettingsFieldLabel>
          <Input {...register("city")} placeholder="مثال: الرياض أو «مؤجر»" maxLength={80} className={settingsFieldClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between">
          <SettingsFieldLabel required>نص التقييم</SettingsFieldLabel>
          <span className={cn("text-[11px] font-bold tabular-nums", text.length > TEXT_MAX ? "text-red-600" : "text-[#8A958F]")}>
            {text.length} / {TEXT_MAX}
          </span>
        </span>
        <Textarea
          {...register("text", {
            validate: (v) => {
              const s = String(v ?? "").trim();
              if (!s) return "نص التقييم مطلوب";
              if (s.length > TEXT_MAX) return `النص أطول من ${TEXT_MAX} حرف`;
              return true;
            },
          })}
          rows={4}
          placeholder="ما قاله العميل عن تجربته…"
          className={cn(settingsFieldClass, "h-auto min-h-[110px] resize-none py-2.5 leading-6", errors.text && "border-red-400")}
        />
        {errors.text ? <span className="text-[11.5px] font-bold text-red-600">{errors.text.message}</span> : null}
      </label>

      <div className="flex flex-col gap-1.5">
        <SettingsFieldLabel required>التقييم</SettingsFieldLabel>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <StarPicker value={Number(field.value) || 5} onChange={field.onChange} />}
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <SettingsFieldLabel>نوع العقد</SettingsFieldLabel>
          <select {...register("contract_type")} className={cn(settingsFieldClass, "border px-3")}>
            {REVIEW_CONTRACT_TYPES.map((t) => (
              <option key={t.value || "none"} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1.5">
          <SettingsFieldLabel>الظهور</SettingsFieldLabel>
          <Controller
            control={control}
            name="is_visible"
            render={({ field }) => (
              <label className="flex h-11 items-center justify-between rounded-xl border border-[#E6EBE9] px-3 dark:border-white/10">
                <span className="text-[13px] font-bold text-[#33403B] dark:text-white/80">
                  {field.value ? "ظاهر في الموقع والتطبيق" : "مخفي"}
                </span>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} className="data-[state=checked]:bg-[#12B886]" />
              </label>
            )}
          />
        </div>
      </div>
    </SettingsFormDialog>
  );
}
