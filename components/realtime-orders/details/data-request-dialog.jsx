"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageCircle, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCreateDataRequest, useDataRequestCatalogue } from "@/src/hooks/use-data-requests";
import { buildDataRequestMessage, defaultSelectionForSection, itemLabels, sectionLabel } from "@/src/lib/data-requests";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";

const tabBase = "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors";

/**
 * «طلب مرفق ناقص من العميل» (دفعة هـ — E4): قائمة تحقق لكل قسم من كتالوج الخادم
 * (عناصر القسم المفتوح منه مختارة مسبقاً) + ملاحظة حرة + «إرسال واتساب» = يسجّل الطلب في الخادم
 * (نشاط + إشعار data_missing + شارة «بانتظار العميل») ثم يفتح wa.me بالرسالة الجاهزة.
 */
export default function DataRequestDialog({ open, onOpenChange, orderData, section = null, onDone }) {
  const orderId = orderData?.id;
  const catalogue = useDataRequestCatalogue({ enabled: open });
  const sections = catalogue.data?.sections ?? [];
  const [activeSection, setActiveSection] = useState(null);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [touched, setTouched] = useState(false);

  // عند الفتح: القسم المطلوب (أو الأول) وعناصره كلها مختارة.
  const firstKey = sections[0]?.key ?? null;
  const wantedSection = section && sections.some((s) => s.key === section) ? section : firstKey;
  if (open && !seeded && sections.length) {
    setSeeded(true);
    setActiveSection(wantedSection);
    setSelected(defaultSelectionForSection(catalogue.data, wantedSection));
    setNote("");
    setTouched(false);
  }
  if (!open && seeded) setSeeded(false);

  const current = sections.find((s) => s.key === activeSection) ?? null;
  const pendingSame = (orderData?.pending_data_requests ?? []).find((r) => r.section === activeSection) ?? null;

  const switchSection = (key) => {
    setActiveSection(key);
    setSelected(defaultSelectionForSection(catalogue.data, key));
    setTouched(false);
  };
  const toggle = (key) => {
    setTouched(true);
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const selectedItems = useMemo(() => (current?.items ?? []).filter((i) => selected.includes(i.key)), [current, selected]);
  const preview = useMemo(
    () => buildDataRequestMessage({ orderNumber: orderData?.uuid, items: selectedItems, note, deepLink: `${orderData?.smart_link ?? ""}${orderData?.smart_link ? "?fix=…" : ""}` }),
    [orderData?.uuid, orderData?.smart_link, selectedItems, note]
  );

  const create = useCreateDataRequest({
    onSuccess: (data) => {
      onDone?.(data);
      onOpenChange?.(false);
    },
  });

  const submit = () => {
    if (!current || !selectedItems.length) return;
    create.mutate({ orderId, section: current.key, items: selectedItems.map((i) => i.key), note: note.trim() });
  };

  const mobile = orderData?.creator_mobile?.local ? formatSaudiMobileDisplay(orderData.creator_mobile.local) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-[600px] overflow-y-auto rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <Paperclip className="size-5 text-[#B25E00]" />
            طلب مرفق ناقص من العميل
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-6 text-[#6B7570] dark:text-white/50">
            اختر المطلوب بدقة؛ يُسجَّل الطلب على الطلب #{orderData?.uuid}، ويصل العميل إشعاراً ورسالة واتساب برابط مباشر يفتح له الخطوة نفسها (بدون إعادة تعبئة).
            {mobile ? (
              <>
                {" "}
                جوال العميل: <bdi dir="ltr" className="font-bold tabular-nums text-[#14231D] dark:text-white">{mobile}</bdi>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {catalogue.isLoading ? (
          <div className="flex items-center justify-center py-8 text-[#8A958F]">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : catalogue.isError ? (
          <p role="alert" className="text-[13px] font-bold text-[#B42318]">
            تعذّر تحميل قائمة المرفقات —{" "}
            <button type="button" onClick={() => catalogue.refetch()} className="underline">
              أعد المحاولة
            </button>
          </p>
        ) : (
          <>
            <div role="tablist" aria-label="القسم" className="flex flex-wrap gap-1.5">
              {sections.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={s.key === activeSection}
                  onClick={() => switchSection(s.key)}
                  className={cn(
                    tabBase,
                    s.key === activeSection
                      ? "border-brand-deep bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]"
                      : "border-[#DBE3DC] bg-white text-[#2F4A3B] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white/70"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {pendingSame ? (
              <p className="rounded-xl border border-[#F1D59A] bg-[#FFF7E6] px-3 py-2 text-[12.5px] font-bold text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                يوجد طلب معلّق لهذا القسم ({itemLabels(pendingSame.items).join(" · ")}) — الإرسال الجديد يستبدله.
              </p>
            ) : null}

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-[12.5px] font-bold text-[#33403B] dark:text-white/70">
                المطلوب من قسم «{sectionLabel(activeSection, catalogue.data)}»{" "}
                <span className="font-normal text-[#8A958F]">({selectedItems.length} من {current?.items?.length ?? 0})</span>
                {!touched ? <span className="font-normal text-[#8A958F]"> — كلها مختارة؛ ألغِ ما لا تحتاجه</span> : null}
              </legend>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {(current?.items ?? []).map((item) => {
                  const on = selected.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[13.5px] font-semibold transition-colors",
                        on ? "border-[#F1D59A] bg-[#FFF7E6] text-[#7A4B00] dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200" : "border-[#E3E8E3] bg-[#FAFBF9] text-[#2F4A3B] hover:bg-[#EEF5F0] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70"
                      )}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggle(item.key)} className="size-4 accent-[#B25E00]" />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      <span className="text-[11px] font-normal text-[#8A958F]">الخطوة {item.step}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-bold text-[#33403B] dark:text-white/70">ملاحظة للعميل (اختياري)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="مثال: الصورة مقصوصة من الأسفل — صوّر الصك كاملاً"
                className="w-full resize-y rounded-lg border border-brand-line bg-white px-3 py-2 text-[13.5px] text-[#14231D] focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>

            <details className="rounded-xl border border-[#E3E8E3] bg-[#FAFBF9] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <summary className="cursor-pointer text-[12.5px] font-bold text-[#6B7570] dark:text-white/50">معاينة الرسالة (النص النهائي يُولَّد من قالب «طلب مرفق» في الخادم)</summary>
              <pre className="mt-2 whitespace-pre-wrap font-[inherit] text-[12.5px] leading-6 text-[#2F4A3B] dark:text-white/70">{preview}</pre>
            </details>
          </>
        )}

        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start">
          <button
            type="button"
            onClick={submit}
            disabled={create.isPending || !selectedItems.length || catalogue.isLoading}
            data-testid="data-request-send"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-5 text-[14px] font-extrabold text-white hover:bg-[#0F7A6D] disabled:opacity-60"
            title="يسجّل الطلب في الخادم ويرسل الإشعار ثم يفتح واتساب"
          >
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            إرسال واتساب
          </button>
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={create.isPending} className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-4 text-[14px] font-bold text-[#14231D] hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-white">
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
