"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import SettingsFormDialog, {
  settingsFieldClass,
  SettingsFieldLabel,
} from "@/components/system-settings/settings-form-dialog";
import {
  resolveImageUrl,
  websiteImageToForm,
  WEBSITE_IMAGE_TEXT_FIELDS,
} from "@/src/lib/website-images";

function LangPair({ base, label, hint, multiline, values, onChange }) {
  const Field = multiline ? Textarea : Input;
  const extra = multiline
    ? "min-h-[76px] rounded-xl py-2.5 leading-6 resize-none"
    : "";

  return (
    <div className="space-y-2">
      <SettingsFieldLabel>{label}</SettingsFieldLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#8a978f] dark:text-white/45">
            عربي
          </span>
          <Field
            dir="rtl"
            value={values[`${base}_ar`]}
            onChange={(e) => onChange(`${base}_ar`, e.target.value)}
            className={`${settingsFieldClass} ${extra}`}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#8a978f] dark:text-white/45">
            English
          </span>
          <Field
            dir="ltr"
            value={values[`${base}_en`]}
            onChange={(e) => onChange(`${base}_en`, e.target.value)}
            className={`${settingsFieldClass} ${extra} text-left`}
          />
        </div>
      </div>
      {hint ? (
        <p className="text-[11px] font-medium leading-5 text-[#8a978f] dark:text-white/45">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function WebsiteImageFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isPending = false,
  canEdit = true,
}) {
  // Seeded once per mount — callers pass `key={item?.id}` so switching rows remounts fresh.
  const [form, setForm] = useState(() => websiteImageToForm(item));
  const [imageFile, setImageFile] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const existingUrl = resolveImageUrl(item);
  const previewUrl = localPreview || existingUrl;

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const pickImage = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      toast.error("يجب اختيار ملف صورة فقط");
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setImageFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const clearPickedImage = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setImageFile(null);
    setLocalPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!canEdit) return;
    onSubmit({ form, imageFile });
  };

  return (
    <SettingsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `تحرير: ${item.label_ar || item.key}` : "صورة موقع جديدة"}
      description={item?.key ? `المفتاح: ${item.key}` : "أضف صورة جديدة إلى فهرس صور الموقع"}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitDisabled={!canEdit}
      submitLabel="حفظ"
      maxWidthClass="sm:max-w-[560px]"
    >
      {/* image preview + replace */}
      <div className="flex items-center gap-3 rounded-xl border border-[#E6EBE9] bg-[#F7FAF9] p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-[#E6EBE9] bg-white dark:border-white/10 dark:bg-white/[0.04]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center text-[#b7c2bc] dark:text-white/30">
              <ImageUp className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#cfe3da] bg-white px-3 text-[12px] font-bold text-[#0B5A3C] hover:bg-[#eef8f3] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08]">
              <ImageUp className="size-3.5" />
              {imageFile ? "تغيير الاختيار" : "استبدال الصورة"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!canEdit}
                onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
              />
            </label>
            {imageFile ? (
              <button
                type="button"
                onClick={clearPickedImage}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f0d3cd] bg-white px-3 text-[12px] font-bold text-[#c0392b] hover:bg-[#fdf0ee] dark:border-red-500/30 dark:bg-white/[0.04] dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                تراجع
              </button>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11px] font-medium text-[#8a978f] dark:text-white/45">
            {imageFile
              ? imageFile.name
              : item?.static_path || existingUrl || "لا توجد صورة مرفوعة"}
          </p>
        </div>
      </div>

      {/* labels */}
      <LangPair
        base="label"
        label="التسمية الإدارية"
        hint="اسم يظهر في هذه الشاشة فقط للتعرّف على الصورة."
        values={form}
        onChange={setField}
      />

      {/* alt / meta title / meta description */}
      {WEBSITE_IMAGE_TEXT_FIELDS.map((field) => (
        <LangPair
          key={field.key}
          base={field.key}
          label={field.label}
          hint={field.hint}
          multiline={field.multiline}
          values={form}
          onChange={setField}
        />
      ))}

      {/* static path + sort order + active */}
      <div className="space-y-2">
        <SettingsFieldLabel>مسار الملف الثابت (static_path)</SettingsFieldLabel>
        <Input
          dir="ltr"
          value={form.static_path}
          onChange={(e) => setField("static_path", e.target.value)}
          placeholder="website/asset/images/logo.svg"
          className={`${settingsFieldClass} text-left`}
        />
        <p className="text-[11px] font-medium text-[#8a978f] dark:text-white/45">
          اتركه فارغًا ما لم تكن الصورة ملفًا ثابتًا داخل الموقع.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-28 space-y-2">
          <SettingsFieldLabel>الترتيب</SettingsFieldLabel>
          <Input
            type="number"
            inputMode="numeric"
            value={form.sort_order}
            onChange={(e) => setField("sort_order", e.target.value)}
            className={`${settingsFieldClass} text-center`}
          />
        </div>
        <label className="flex h-11 items-center gap-2.5">
          <Switch
            checked={form.is_active}
            disabled={!canEdit}
            onCheckedChange={(v) => setField("is_active", v)}
          />
          <span className="text-[13px] font-bold text-[#111827] dark:text-white">
            مفعّلة على الموقع
          </span>
        </label>
      </div>
    </SettingsFormDialog>
  );
}
