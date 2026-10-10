"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import SectionCard from "@/components/content/marketing/shared/section-card";
import { useConfirm } from "@/components/shared/confirm-provider";
import { reviewsSummaryPreview } from "@/src/lib/customer-reviews";
import { useCustomerReviewsSettings, useSaveCustomerReviewsSettings } from "@/src/hooks/use-customer-reviews";

const inputClass =
  "h-11 w-full rounded-xl border border-[#E6EBE9] bg-white px-3 text-[14px] font-bold tabular-nums text-[#14231D] focus:border-[#0B5A3C] focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

function validate(form) {
  const avg = Number(form.reviews_average);
  const count = Number(form.reviews_count);
  if (form.reviews_average === "" || !Number.isFinite(avg) || avg < 0 || avg > 5) return "متوسط التقييم بين 0 و 5";
  if (form.reviews_count === "" || !Number.isInteger(count) || count < 0) return "عدد التقييمات رقم صحيح (0 أو أكثر)";
  return null;
}

function SummaryForm({ settings, canEdit }) {
  const confirm = useConfirm();
  const save = useSaveCustomerReviewsSettings();
  const [form, setForm] = useState({
    reviews_average: String(settings.reviews_average),
    reviews_count: String(settings.reviews_count),
  });
  const dirty =
    Number(form.reviews_average) !== settings.reviews_average || Number(form.reviews_count) !== settings.reviews_count;
  const error = validate(form);
  const preview = reviewsSummaryPreview(error ? settings : form);

  const toggleEnabled = async (checked) => {
    const ok = await confirm({
      title: checked ? "إظهار التقييمات" : "إخفاء التقييمات",
      description: checked
        ? "سيظهر قسم «آراء العملاء» وشارة التقييم في الموقع والتطبيق."
        : "سيختفي قسم «آراء العملاء» وشارة التقييم من الموقع والتطبيق.",
      confirmLabel: checked ? "إظهار" : "إخفاء",
      destructive: !checked,
    });
    if (ok) save.mutate({ reviews_enabled: checked });
  };

  const submit = () => {
    if (error) return;
    save.mutate({ reviews_average: Number(form.reviews_average), reviews_count: Number(form.reviews_count) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E6EFEA] bg-[#F8FBF9] px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold text-[#14231D] dark:text-white">إظهار التقييمات في الموقع والتطبيق</div>
            <p className="text-[11.5px] font-semibold text-[#8A958F]">
              {settings.reviews_enabled ? "ظاهرة — القسم والشارة يظهران للعملاء." : "مخفية — لا يظهر القسم ولا الشارة."}
            </p>
          </div>
          {save.isPending && save.variables && "reviews_enabled" in save.variables ? (
            <Loader2 className="size-4 animate-spin text-[#0B7A4C]" />
          ) : (
            <label className="mkt-switch" aria-label="إظهار التقييمات">
              <input
                type="checkbox"
                checked={settings.reviews_enabled}
                disabled={!canEdit || save.isPending}
                onChange={(e) => toggleEnabled(e.target.checked)}
              />
              <span />
            </label>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold text-[#33403B] dark:text-white/80">متوسط التقييم (من 5)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={5}
              step={0.1}
              dir="ltr"
              value={form.reviews_average}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, reviews_average: e.target.value }))}
              className={cn(inputClass, "text-right")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold text-[#33403B] dark:text-white/80">عدد التقييمات</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              dir="ltr"
              value={form.reviews_count}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, reviews_count: e.target.value }))}
              className={cn(inputClass, "text-right")}
            />
          </label>
        </div>
        {error ? <p className="text-[12px] font-bold text-[#B42318]">{error}</p> : null}
        {canEdit ? (
          <div className="flex items-center gap-2">
            <button type="button" className="xbtn" disabled={!dirty || Boolean(error) || save.isPending} onClick={submit}>
              {save.isPending && save.variables && "reviews_count" in save.variables ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "حفظ الملخص"
              )}
            </button>
            {dirty ? (
              <button
                type="button"
                className="mk-mini"
                onClick={() =>
                  setForm({ reviews_average: String(settings.reviews_average), reviews_count: String(settings.reviews_count) })
                }
              >
                تراجع
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* معاينة كما تظهر للعميل */}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#CFE3D9] bg-gradient-to-b from-[#F3FBF7] to-white p-5 text-center dark:border-white/10 dark:from-white/[0.04] dark:to-transparent",
          !settings.reviews_enabled && "opacity-50"
        )}
        aria-label="معاينة"
      >
        <span className="text-[11px] font-bold text-[#8A958F]">معاينة في الموقع</span>
        <div className="flex items-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "size-5",
                n <= Math.round(Number(error ? settings.reviews_average : form.reviews_average) || 0)
                  ? "fill-[#F5B301] text-[#F5B301]"
                  : "text-[#D4DCD8]"
              )}
            />
          ))}
        </div>
        <b className="text-[15px] font-black text-[#0B5A3C] dark:text-emerald-300">{preview}</b>
        {!settings.reviews_enabled ? <span className="text-[11px] font-bold text-[#9A6100]">مخفي حالياً</span> : null}
      </div>
    </div>
  );
}

/** ملخص التقييمات «4.7 من 3000» + إظهار/إخفاء (D7). */
export default function ReviewsSummaryCard({ canEdit }) {
  const { settings, isLoading, isError } = useCustomerReviewsSettings();
  return (
    <SectionCard
      title="ملخص التقييم"
      subtitle="الرقم الظاهر في الموقع والتطبيق بجانب «آراء العملاء» (مثل: 4.7 من 5 · أكثر من 3000 تقييم)."
    >
      {isLoading ? (
        <p className="py-6 text-center text-[13px] text-[#8A958F]">جارٍ التحميل…</p>
      ) : isError || !settings ? (
        <p className="py-6 text-center text-[13px] font-bold text-[#B42318]">تعذر تحميل إعدادات التقييمات</p>
      ) : (
        // key: يعيد تهيئة الحقول بعد الحفظ/التحديث من الخادم.
        <SummaryForm key={`${settings.reviews_average}-${settings.reviews_count}`} settings={settings} canEdit={canEdit} />
      )}
    </SectionCard>
  );
}
