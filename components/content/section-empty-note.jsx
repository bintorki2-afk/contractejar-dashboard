"use client";

import { Info } from "lucide-react";

/** هل القسم غير معبّأ في الخادم؟ (لا قيمة نصية ولا بطاقات ولا صور) — د5. */
export function isSectionEmpty(data) {
  if (data == null) return true;
  if (typeof data !== "object") return String(data).trim() === "";
  const values = Object.entries(data)
    .filter(([key]) => !["id", "key", "section", "section_key", "updated_at", "created_at", "is_active", "order", "sort_order"].includes(key))
    .map(([, value]) => value);
  return values.every((value) => {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return isSectionEmpty(value);
    return String(value).trim() === "";
  });
}

/** «غير معبّأ — الموقع يستخدم النص الافتراضي» فوق نموذج القسم. */
export default function SectionEmptyNote({ data }) {
  if (!isSectionEmpty(data)) return null;
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#F3DFA9] bg-[#FFF8E6] px-4 py-3 text-[13px] text-[#7A5600] dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        <b>غير معبّأ — الموقع يستخدم النص الافتراضي.</b> القيم الظاهرة في النموذج أدناه هي النص الافتراضي نفسه؛
        احفظ القسم ليصبح المحتوى قابلاً للتعديل من هنا.
      </span>
    </div>
  );
}
