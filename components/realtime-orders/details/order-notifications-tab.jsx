"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Inbox, Loader2, Mail, Send, Smartphone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { formatJourneyTime } from "@/src/lib/order-journey";
import { useConfirm } from "@/components/shared/confirm-provider";

const CHANNEL_ICONS = { push: Bell, whatsapp: FaWhatsapp, sms: Smartphone, inbox: Inbox, email: Mail };
const CHANNEL_LABELS = { push: "إشعار", whatsapp: "واتساب", sms: "رسالة نصية", inbox: "صندوق الإشعارات", email: "بريد" };

/** نتيجة الإرسال بالعربية (push_result). */
export const PUSH_RESULT = {
  sent: { label: "وصل للجهاز", cls: "bg-[#E3F4EA] text-[#0B7A4C]" },
  no_token: { label: "في الصندوق فقط (لا جهاز مسجّل)", cls: "bg-[#F0F4F2] text-[#4B5753]" },
  // `disabled` من الخادم = إرسال Firebase غير مُعدّ على الخادم (ليس قرار العميل).
  disabled: { label: "في الصندوق فقط (الإرسال للجوال غير مفعّل على الخادم)", cls: "bg-[#FFF4DE] text-[#9A6100]" },
  failed: { label: "فشل الإرسال", cls: "bg-[#FDECEC] text-[#B42318]" },
  prepared: { label: "رسالة جاهزة (فُتح واتساب)", cls: "bg-[#25D366]/12 text-[#128C4B]" },
};

const STEPS = [
  { value: "", label: "بدون تحديد" },
  { value: "1", label: "1 · العقار والصك" },
  { value: "2", label: "2 · الوحدات" },
  { value: "3", label: "3 · المستأجر" },
  { value: "4", label: "4 · البيانات المالية" },
  { value: "5", label: "5 · الشروط" },
  { value: "6", label: "6 · المراجعة" },
];

function NotifyCustomerForm({ orderId, onSent }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("");
  const mutation = useMutation({
    mutationFn: async () =>
      (await axiosInstance.post(`/admin/orders/${orderId}/notify`, {
        kind: "data_missing",
        message: message.trim() || undefined,
        step: step ? Number(step) : undefined,
      }))?.data,
    onSuccess: () => {
      toast.success("أُرسل إشعار «نحتاج بيانات إضافية» للعميل");
      setOpen(false);
      setMessage("");
      setStep("");
      invalidateOrdersCaches(queryClient, { orderId });
      onSent?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "تعذّر إرسال الإشعار"),
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-line bg-white text-[12.5px] font-bold text-brand-deep hover:bg-brand-mint dark:bg-transparent dark:border-white/10 dark:text-emerald-300"
      >
        <Send className="size-4" /> إشعار العميل ببيانات ناقصة
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-brand-line p-3 dark:border-white/10">
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="مثال: صورة الصك غير واضحة، نرجو إعادة رفعها"
        className="rounded-lg border border-brand-line bg-white px-3 py-2 text-[12.5px] dark:bg-white/[0.04] dark:border-white/10"
      />
      <label className="flex items-center gap-2 text-[12px] font-bold text-[#6B7570]">
        الخطوة المطلوبة
        <select value={step} onChange={(e) => setStep(e.target.value)} className="h-8 flex-1 rounded-lg border border-brand-line bg-white px-2 text-[12.5px] dark:bg-white/[0.04] dark:border-white/10">
          {STEPS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={async () => {
            const ok = await confirm({ title: "إرسال إشعار للعميل", description: "سيصل للعميل إشعار «نحتاج بيانات إضافية لطلبك» برابط الخطوة.", confirmLabel: "إرسال" });
            if (ok) mutation.mutate();
          }}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-deep text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} إرسال
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-brand-line px-3 text-[12.5px] font-bold">إلغاء</button>
      </div>
    </div>
  );
}

/** «الإشعارات المرسلة» (د24): كل ما وصل العميل لهذا الطلب — النوع، القناة، النتيجة، الوقت. */
export default function OrderNotificationsTab({ orderData, canNotify }) {
  const list = [...(orderData?.notifications_sent ?? [])].sort((a, b) =>
    String(b?.sent_at ?? "").localeCompare(String(a?.sent_at ?? ""))
  );
  return (
    <div className="flex flex-col gap-3">
      {canNotify ? <NotifyCustomerForm orderId={orderData?.id} /> : null}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center">
          <Bell className="size-6 text-[#B5C0BB]" />
          <p className="text-[12.5px] font-bold text-[#6B7570]">لم يُرسل أي إشعار لهذا الطلب بعد</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((n) => {
            const channels = n.channels?.length ? n.channels : [n.channel].filter(Boolean);
            const result = PUSH_RESULT[n.push_result];
            return (
              <li key={n.id} className="rounded-xl border border-brand-line px-3 py-2.5 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-extrabold text-[#14231D] dark:text-white">{n.title || n.kind_label}</p>
                    <p className="text-[11px] font-semibold text-[#8A958F]">{n.kind_label}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    {channels.map((c) => {
                      const Icon = CHANNEL_ICONS[c] ?? Bell;
                      return (
                        <span key={c} title={CHANNEL_LABELS[c] ?? c} className="inline-flex size-6 items-center justify-center rounded-md bg-[#F0F4F2] text-[#4B5753] dark:bg-white/10 dark:text-white/70">
                          <Icon className="size-3.5" />
                        </span>
                      );
                    })}
                  </span>
                </div>
                {n.body ? <p className="mt-1 whitespace-pre-wrap text-[12px] text-[#33403B] dark:text-white/70 line-clamp-3">{n.body}</p> : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {result ? <span className={cn("inline-flex h-5 items-center rounded-full px-2 font-bold", result.cls)}>{result.label}</span> : null}
                  {n.sent_at ? <span dir="ltr" className="tabular-nums text-[#8A958F]">{formatJourneyTime(n.sent_at)}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
