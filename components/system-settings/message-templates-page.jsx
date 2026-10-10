"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Loader2, MessageSquareText, Pencil, Plus, Smartphone, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/shared/confirm-provider";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SAMPLE_TEMPLATE_VARS,
  previewMessageTemplate,
  renderTemplateLocally,
  unknownPlaceholders,
  useDeleteMessageTemplate,
  useMessageTemplates,
  useSaveMessageTemplate,
} from "@/src/hooks/use-message-templates";

const CHANNEL_META = {
  whatsapp: { label: "واتساب", Icon: FaWhatsapp, cls: "bg-[#25D366]/12 text-[#128C4B]" },
  sms: { label: "رسالة نصية", Icon: Smartphone, cls: "bg-[#E8F0FE] text-[#1D4ED8]" },
  push: { label: "إشعار", Icon: Bell, cls: "bg-[#EFEAFD] text-[#5B35C9]" },
};

const KEY_LABELS = {
  stage_received: "مرحلة: استلمت",
  stage_notarized: "مرحلة: وثّقت",
  data_missing: "بيانات ناقصة",
  data_request: "طلب مرفق ناقص / تصحيح",
  data_request_reminder: "تذكير بطلب المرفق الناقص",
  charge_payment_request: "طلب دفع فرق / رسوم إضافية",
  bank_transfer_instructions: "تعليمات الحوالة البنكية",
  refund: "استرجاع المبلغ",
  payment_reminder: "تذكير بالدفع",
  status_under_review: "الحالة: قيد المراجعة",
  status_received_by_employee: "الحالة: مستلم من الموظف",
  status_on_hold: "الحالة: معلق",
  status_cancelled: "الحالة: ملغى",
  notarized: "التوثيق",
};

function TemplateEditor({ open, onOpenChange, template, placeholders, channels }) {
  const isNew = !template?.id;
  const [form, setForm] = useState({ key: "", channel: "whatsapp", title: "", body: "", description: "", is_active: true });
  const [seed, setSeed] = useState(null);
  const [preview, setPreview] = useState(null);
  const bodyRef = useRef(null);
  const seedKey = `${open}:${template?.id ?? "new"}`;
  if (open && seed !== seedKey) {
    setSeed(seedKey);
    setForm({
      key: template?.key ?? "",
      channel: template?.channel ?? "whatsapp",
      title: template?.title ?? "",
      body: template?.body ?? "",
      description: template?.description ?? "",
      is_active: template?.is_active ?? true,
    });
    setPreview(null);
  }
  if (!open && seed) setSeed(null);

  // معاينة الخادم (تأخير 400ms) مع معاينة محلية فورية.
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => {
      previewMessageTemplate({ body: form.body, title: form.title })
        .then((p) => setPreview(p))
        .catch(() => setPreview(null));
    }, 400);
    return () => clearTimeout(t);
  }, [open, form.body, form.title]);

  const save = useSaveMessageTemplate({ onSuccess: () => onOpenChange(false) });
  const unknown = unknownPlaceholders(`${form.title} ${form.body}`, placeholders);
  const keyValid = /^[a-z0-9_]+$/.test(form.key);

  const insertToken = (token) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? form.body.length;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const submit = () => {
    if (isNew && !keyValid) return;
    if (!form.body.trim()) return;
    const body = { title: form.title || null, body: form.body, description: form.description || null, is_active: form.is_active };
    if (isNew) save.mutate({ ...body, key: form.key, channel: form.channel });
    else save.mutate({ id: template.id, ...body });
  };

  const shownTitle = preview?.title ?? renderTemplateLocally(form.title, SAMPLE_TEMPLATE_VARS);
  const shownBody = preview?.body ?? renderTemplateLocally(form.body, SAMPLE_TEMPLATE_VARS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "قالب رسالة جديد" : `تعديل: ${KEY_LABELS[template.key] ?? template.key}`}</DialogTitle>
          <DialogDescription>{"الرموز بين { } تُستبدل تلقائياً عند الإرسال. المعاينة ببيانات تجريبية."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {isNew ? (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold">المفتاح (إنجليزي صغير و _ فقط)</span>
                  <input
                    dir="ltr"
                    value={form.key}
                    onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase() }))}
                    className={cn("h-10 rounded-lg border px-3 text-[13px] text-right", form.key && !keyValid ? "border-[#B42318]" : "border-brand-line")}
                    placeholder="offer_ramadan"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold">القناة</span>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                    className="h-10 rounded-lg border border-brand-line bg-white px-3 text-[13px] dark:bg-white/[0.04]"
                  >
                    {channels.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            {form.channel !== "whatsapp" || form.title ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold">العنوان {form.channel === "push" ? "(يظهر في الإشعار)" : ""}</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="h-10 rounded-lg border border-brand-line bg-white px-3 text-[13px] dark:bg-white/[0.04] dark:border-white/10"
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold">نص الرسالة <span className="text-[#B42318]">*</span></span>
              <textarea
                ref={bodyRef}
                rows={7}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-[13px] leading-6 dark:bg-white/[0.04] dark:border-white/10"
              />
            </label>
            <div>
              <span className="text-[11.5px] font-bold text-[#6B7570]">أدرج رمزاً في موضع المؤشر:</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {placeholders.map((p) => (
                  <button
                    key={p.token}
                    type="button"
                    onClick={() => insertToken(p.token)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-brand-line bg-white px-2 text-[11.5px] font-bold text-brand-deep hover:bg-brand-mint dark:bg-white/[0.04] dark:border-white/10 dark:text-emerald-300"
                  >
                    {p.label} <code dir="ltr" className="text-[10.5px] opacity-70">{p.token}</code>
                  </button>
                ))}
              </div>
              {unknown.length ? (
                <p className="mt-1.5 text-[11.5px] font-semibold text-[#B42318]">
                  رموز غير معروفة ستظهر كما هي للعميل: <span dir="ltr">{unknown.map((u) => `{${u}}`).join(" ")}</span>
                </p>
              ) : null}
            </div>
            <label className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F7F6] px-3 py-2 dark:bg-white/[0.04]">
              <span className="text-[12.5px] font-bold">{form.is_active ? "مُفعّل" : "مُعطّل (يُستخدم النص الافتراضي)"}</span>
              <Switch dir="ltr" checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#6B7570]">المعاينة</span>
            <div className={cn("rounded-2xl p-3", form.channel === "whatsapp" ? "bg-[#E7F7EC]" : "bg-[#F5F7F6] dark:bg-white/[0.04]")}>
              <div className="ms-auto max-w-[92%] rounded-xl rounded-tr-sm bg-white px-3 py-2 shadow-sm dark:bg-[#0F1C16]">
                {shownTitle ? <p className="mb-1 text-[13px] font-extrabold">{shownTitle}</p> : null}
                <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#14231D] dark:text-white">{shownBody || "—"}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#8A958F]">
              بيانات المعاينة: الطلب {SAMPLE_TEMPLATE_VARS.order} · {SAMPLE_TEMPLATE_VARS.name} · {SAMPLE_TEMPLATE_VARS.amount} ر.س
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-xl border border-brand-line text-sm font-bold">
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending || !form.body.trim() || (isNew && !keyValid)}
            className="h-10 px-5 rounded-xl bg-brand-deep text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            حفظ القالب
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** «قوالب الرسائل» (د20): رسائل واتساب/SMS/الإشعارات لكل مرحلة وحالة — تُستخدم في أزرار المراحل والإشعارات. */
export default function MessageTemplatesPage() {
  const { can, isAdmin } = usePermissions();
  const canEdit = isAdmin || can(PERMISSION_SECTIONS.settings, "edit");
  const confirm = useConfirm();
  const { data, isLoading, isError } = useMessageTemplates();
  const [channel, setChannel] = useState("all");
  const [editing, setEditing] = useState(null);
  const save = useSaveMessageTemplate();
  const del = useDeleteMessageTemplate();

  const items = useMemo(() => data?.items ?? [], [data]);
  const channels = data?.channels ?? [];
  const placeholders = data?.placeholders ?? [];
  const shown = channel === "all" ? items : items.filter((t) => t.channel === channel);

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#0E1F18] dark:text-white">قوالب الرسائل</h1>
          <p className="mt-1 text-[12.5px] text-[#6B7570] dark:text-white/50">
            نصوص واتساب والرسائل النصية والإشعارات التي تُرسل للعميل عند كل مرحلة وحالة.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing({})}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-deep px-4 text-[13px] font-bold text-white"
          >
            <Plus className="size-4" /> قالب جديد
          </button>
        ) : null}
      </div>

      <div role="tablist" className="inline-flex w-fit flex-wrap rounded-xl border border-brand-line bg-white p-1 dark:bg-white/[0.04] dark:border-white/10">
        {[{ value: "all", label: "الكل" }, ...channels].map((c) => (
          <button
            key={c.value}
            type="button"
            role="tab"
            aria-selected={channel === c.value}
            onClick={() => setChannel(c.value)}
            className={cn("h-9 px-4 rounded-lg text-[13px] font-bold", channel === c.value ? "bg-brand-deep text-white" : "text-[#4B5753] dark:text-white/60")}
          >
            {c.label} ({c.value === "all" ? items.length : items.filter((t) => t.channel === c.value).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-brand-deep" /></div>
      ) : isError ? (
        <p className="rounded-2xl border border-brand-line bg-white p-6 text-center text-[13px] text-[#B42318]">تعذّر تحميل القوالب</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shown.map((t) => {
            const meta = CHANNEL_META[t.channel] ?? CHANNEL_META.push;
            const Icon = meta.Icon;
            return (
              <article key={t.id} className={cn("rounded-2xl border border-brand-line bg-white p-4 dark:bg-[#0F1C16] dark:border-white/10", !t.is_active && "opacity-70")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold", meta.cls)}>
                        <Icon className="size-3.5" /> {meta.label}
                      </span>
                      <h3 className="truncate text-[14px] font-extrabold">{KEY_LABELS[t.key] ?? t.description ?? t.key}</h3>
                    </div>
                    <code dir="ltr" className="text-[10.5px] text-[#8A958F]">{t.key}</code>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-1.5">
                      <Switch
                        dir="ltr"
                        checked={t.is_active}
                        aria-label="تفعيل القالب"
                        onCheckedChange={async (v) => {
                          const ok = await confirm({
                            title: v ? "تفعيل القالب" : "تعطيل القالب",
                            description: v ? "سيُستخدم هذا النص عند الإرسال." : "سيُستخدم النص الافتراضي بدلاً منه.",
                            confirmLabel: v ? "تفعيل" : "تعطيل",
                          });
                          if (ok) save.mutate({ id: t.id, is_active: v });
                        }}
                      />
                      <button type="button" aria-label="تعديل" onClick={() => setEditing(t)} className="inline-flex size-8 items-center justify-center rounded-lg border border-brand-line text-brand-deep hover:bg-brand-mint">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف"
                        onClick={async () => {
                          const ok = await confirm({ title: "حذف القالب", description: "سيُستخدم النص الافتراضي بعد الحذف.", confirmLabel: "حذف", destructive: true });
                          if (ok) del.mutate(t.id);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-[#F5C9C6] text-[#B42318] hover:bg-[#FDECEC]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {t.title ? <p className="mt-2 text-[13px] font-bold">{t.title}</p> : null}
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-6 text-[#33403B] dark:text-white/70 line-clamp-4">{t.body}</p>
                {t.placeholders_used?.length ? (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {t.placeholders_used.map((p) => (
                      <code key={p} dir="ltr" className="rounded bg-[#F0F4F2] px-1.5 text-[10.5px] text-[#4B5753]">{p}</code>
                    ))}
                  </p>
                ) : null}
              </article>
            );
          })}
          {shown.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-1.5 rounded-2xl border border-brand-line bg-white py-10 text-center">
              <MessageSquareText className="size-6 text-[#B5C0BB]" />
              <p className="text-[13px] font-bold text-[#6B7570]">لا توجد قوالب في هذه القناة</p>
            </div>
          ) : null}
        </div>
      )}

      <TemplateEditor
        open={editing != null}
        onOpenChange={(o) => !o && setEditing(null)}
        template={editing}
        placeholders={placeholders}
        channels={channels}
      />
    </div>
  );
}
