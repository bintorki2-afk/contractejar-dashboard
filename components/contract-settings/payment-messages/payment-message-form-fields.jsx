"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const inputClass =
  "h-11 rounded-xl border-[#E6EBE9] bg-white text-[13px] focus-visible:border-[#0B5A3C] focus-visible:ring-0";

export default function PaymentMessageFormFields({ form, onChange }) {
  const update = (key, value) => onChange({ ...form, [key]: value });

  return (
    <div dir="rtl" className="flex min-w-0 max-w-full flex-col gap-4 text-right">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-[#111827]">
          نص الرسالة <span className="text-red-500">*</span>
        </span>
        <Textarea
          placeholder="اكتب رسالة الدفع هنا..."
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          rows={4}
          className="min-h-[100px] resize-none rounded-xl border-[#E6EBE9] bg-white text-[13px] focus-visible:border-[#0B5A3C] focus-visible:ring-0"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827]">
            نص الزر الأول <span className="text-red-500">*</span>
          </span>
          <Input
            placeholder="مثال: عرض العقد"
            value={form.button_text}
            onChange={(e) => update("button_text", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827]">
            رابط الزر الأول <span className="text-red-500">*</span>
          </span>
          <Input
            placeholder="https://example.com"
            value={form.button_link}
            onChange={(e) => update("button_link", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827]">
            نص الزر الثاني <span className="text-red-500">*</span>
          </span>
          <Input
            placeholder="مثال: الصفحة الرئيسية"
            value={form.button_text_2}
            onChange={(e) => update("button_text_2", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#111827]">
            رابط الزر الثاني <span className="text-red-500">*</span>
          </span>
          <Input
            placeholder="https://example.com"
            value={form.button_link_2}
            onChange={(e) => update("button_link_2", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </label>
      </div>
    </div>
  );
}
