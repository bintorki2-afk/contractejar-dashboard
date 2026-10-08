"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SettingsContentCard,
  SettingsListHeader,
  SettingsPageShell,
} from "@/components/system-settings/shared";
import {
  SettingsFieldLabel,
  settingsFieldClass,
} from "@/components/system-settings/settings-form-dialog";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  BROADCAST_SEGMENTS,
  CUSTOMER_NOTIFICATION_KINDS,
  NOTIFICATION_TARGETS,
  previewBroadcast,
  useSendNotification,
} from "@/src/hooks/use-send-notification";
import { useCities } from "@/src/hooks/use-cities";
import { useConfirm } from "@/components/shared/confirm-provider";
import { Bell, Copy, Users } from "lucide-react";
import RecipientPicker from "./recipient-picker";
import NotificationDispatchLog from "./dispatch-log";
import { cn } from "@/lib/utils";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

const PAGE_TITLE = "الإشعارات";
const TARGET_OPTIONS = Object.values(NOTIFICATION_TARGETS);

const INITIAL_FORM = {
  title: "",
  body: "",
  userId: "",
  employeeId: "",
  kind: "offer",
  url: "",
  segment: "all",
  cityId: "",
  couponCode: "",
  validUntil: "",
};

/** معاينة الإشعار كما يراه العميل + عدد المستلمين (د24). */
function BroadcastPreview({ form, isBroadcast }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isBroadcast) return undefined;
    if (form.segment === "city" && !form.cityId) return undefined;
    const t = setTimeout(() => {
      setLoading(true);
      previewBroadcast(form)
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setLoading(false));
    }, 450);
    return () => clearTimeout(t);
  }, [isBroadcast, form]);
  const p = preview?.preview ?? { title: form.title, body: form.body, coupon_code: form.couponCode, valid_until: form.validUntil };
  return (
    <aside className="flex w-full flex-col gap-3 rounded-2xl border border-brand-line bg-[#FAFCFB] p-4 dark:bg-white/[0.03] dark:border-white/10 lg:max-w-sm">
      <span className="text-[12px] font-bold text-[#6B7570] dark:text-white/50">المعاينة كما تصل للعميل</span>
      {isBroadcast ? (
        <p className="inline-flex items-center gap-2 text-[13px] font-extrabold text-brand-deep dark:text-emerald-300">
          <Users className="size-4" />
          {form.segment === "city" && !form.cityId
            ? "اختر المدينة لحساب المستلمين"
            : loading
              ? "جارٍ حساب المستلمين…"
              : preview
                ? `سيصل إلى ${preview.recipients_count} عميل`
                : "—"}
        </p>
      ) : null}
      <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-[#0F1C16]">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-brand-deep">
            <Bell className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-[#14231D] dark:text-white">{p.title || "عنوان الإشعار"}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-[#4B5753] dark:text-white/70">{p.body || "نص الإشعار…"}</p>
          </div>
        </div>
        {p.coupon_code ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-brand-green/50 bg-brand-mint px-3 py-2">
            <span>
              <span className="block text-[10.5px] font-bold text-[#6B7570]">كود الخصم</span>
              <code dir="ltr" className="text-[14px] font-extrabold tracking-wider text-brand-deep">{p.coupon_code}</code>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-deep"><Copy className="size-3.5" /> نسخ</span>
          </div>
        ) : null}
        {p.valid_until ? (
          <p className="mt-2 text-[11px] font-semibold text-[#9A6100]">صالح حتى <span dir="ltr" className="tabular-nums">{p.valid_until}</span></p>
        ) : null}
      </div>
    </aside>
  );
}

function isValidOptionalUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function SendNotificationPage() {
  const [target, setTarget] = useState("all-users");
  const [form, setForm] = useState(INITIAL_FORM);

  const config = NOTIFICATION_TARGETS[target];
  const needsUser = config?.needsUser;
  const needsEmployee = config?.needsEmployee;
  const isCustomer = config?.isCustomer;

  const mutation = useSendNotification({
    onSuccess: () => setForm(INITIAL_FORM),
  });
  const confirm = useConfirm();
  const isBroadcast = target === "all-users";
  const { options: cityOptions = [] } = useCities({ enabled: isBroadcast && form.segment === "city" });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTargetChange = (value) => {
    setTarget(value);
    setForm((prev) => ({
      ...prev,
      userId: "",
      employeeId: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      toast.error("يرجى إدخال العنوان ونص الرسالة");
      return;
    }
    if (needsUser && !form.userId) {
      toast.error("يرجى اختيار المستخدم");
      return;
    }
    if (needsEmployee && !form.employeeId) {
      toast.error("يرجى اختيار الموظف");
      return;
    }
    if (isCustomer && !isValidOptionalUrl(form.url)) {
      toast.error("الرابط غير صالح — يجب أن يبدأ بـ https://");
      return;
    }
    if (isBroadcast && form.segment === "city" && !form.cityId) {
      toast.error("اختر المدينة");
      return;
    }
    if (isBroadcast) {
      let count = null;
      try {
        count = (await previewBroadcast(form))?.recipients_count ?? null;
      } catch {
        count = null;
      }
      const ok = await confirm({
        title: "إرسال إشعار جماعي",
        description: `سيُرسل «${form.title}» إلى ${count ?? "كل"} عميل${form.couponCode ? ` مع كود الخصم ${form.couponCode}` : ""}. لا يمكن سحب الإشعار بعد إرساله.`,
        confirmLabel: "إرسال الآن",
      });
      if (!ok) return;
    }

    mutation.mutate({
      target,
      form: {
        title: form.title,
        body: form.body,
        userId: form.userId,
        employeeId: form.employeeId,
        kind: form.kind,
        url: form.url,
        segment: form.segment,
        cityId: form.cityId,
        couponCode: form.couponCode,
        validUntil: form.validUntil,
      },
    });
  };

  return (
    <SettingsPageShell>
      <SettingsListHeader title={PAGE_TITLE} subtitle="إرسال إشعار للمستخدمين أو الموظفين" />

      <SettingsContentCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <SettingsFieldLabel required>نوع الإرسال</SettingsFieldLabel>
            <Select dir="rtl" value={target} onValueChange={handleTargetChange}>
              <SelectTrigger className={settingsFieldClass}>
                <SelectValue placeholder="اختر نوع الإرسال" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {TARGET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {isBroadcast ? (
            <>
              <label className="flex flex-col gap-1.5">
                <SettingsFieldLabel required>الشريحة</SettingsFieldLabel>
                <Select dir="rtl" value={form.segment} onValueChange={(value) => setForm((prev) => ({ ...prev, segment: value, cityId: "" }))}>
                  <SelectTrigger className={settingsFieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {BROADCAST_SEGMENTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {form.segment === "city" ? (
                <label className="flex flex-col gap-1.5">
                  <SettingsFieldLabel required>المدينة</SettingsFieldLabel>
                  <Select dir="rtl" value={form.cityId} onValueChange={(value) => updateField("cityId", value)}>
                    <SelectTrigger className={settingsFieldClass}>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="max-h-[280px]">
                      {cityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
            </>
          ) : null}

          {needsUser ? (
            <label className="flex flex-col gap-1.5">
              <SettingsFieldLabel required>المستخدم</SettingsFieldLabel>
              <RecipientPicker
                type="user"
                value={form.userId}
                onChange={(value) => updateField("userId", value)}
                placeholder="اختر المستخدم..."
              />
            </label>
          ) : null}

          {needsEmployee ? (
            <label className="flex flex-col gap-1.5">
              <SettingsFieldLabel required>الموظف</SettingsFieldLabel>
              <RecipientPicker
                type="employee"
                value={form.employeeId}
                onChange={(value) => updateField("employeeId", value)}
                placeholder="اختر الموظف..."
              />
            </label>
          ) : null}

          {isCustomer ? (
            <>
              <label className="flex flex-col gap-1.5">
                <SettingsFieldLabel required>نوع الإشعار</SettingsFieldLabel>
                <Select dir="rtl" value={form.kind} onValueChange={(value) => updateField("kind", value)}>
                  <SelectTrigger className={settingsFieldClass}>
                    <SelectValue placeholder="اختر نوع الإشعار" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {CUSTOMER_NOTIFICATION_KINDS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <SettingsFieldLabel>رابط عند الضغط (اختياري)</SettingsFieldLabel>
                <Input
                  className={settingsFieldClass}
                  placeholder="https://contractejar.com/..."
                  dir="ltr"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                />
                <span className="text-[11.5px] font-medium text-[#8a978f] dark:text-white/45">
                  يفتح الصفحة في الموقع أو التطبيق عند ضغط العميل على الإشعار.
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <SettingsFieldLabel>كود خصم (اختياري)</SettingsFieldLabel>
                  <Input
                    className={settingsFieldClass}
                    dir="ltr"
                    placeholder="RAMADAN25"
                    value={form.couponCode}
                    onChange={(e) => updateField("couponCode", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <SettingsFieldLabel>صالح حتى (اختياري)</SettingsFieldLabel>
                  <Input
                    type="date"
                    className={settingsFieldClass}
                    dir="ltr"
                    value={form.validUntil}
                    onChange={(e) => updateField("validUntil", e.target.value)}
                  />
                </label>
              </div>
            </>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <SettingsFieldLabel required>العنوان</SettingsFieldLabel>
            <Input
              className={settingsFieldClass}
              placeholder="عنوان الإشعار"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <SettingsFieldLabel required>نص الرسالة</SettingsFieldLabel>
            <Textarea
              className={cn(settingsFieldClass, "h-auto min-h-[120px] resize-none py-2.5")}
              placeholder="اكتب محتوى الإشعار هنا..."
              value={form.body}
              onChange={(e) => updateField("body", e.target.value)}
              required
            />
          </label>

          <PermissionGate section={PERMISSION_SECTIONS.notifications} action="create">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="mt-1 h-11 w-fit min-w-[160px] rounded-[10px] bg-[#0E5F4E] text-[13px] font-extrabold text-white hover:bg-[#0B7A4C]"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  إرسال الإشعار
                  <Send className="ms-1 size-4" />
                </>
              )}
            </Button>
          </PermissionGate>
        </form>
        {isCustomer ? <BroadcastPreview form={form} isBroadcast={isBroadcast} /> : null}
        </div>
      </SettingsContentCard>

      <PermissionGate section={PERMISSION_SECTIONS.notifications} action="view">
        <NotificationDispatchLog />
      </PermissionGate>
    </SettingsPageShell>
  );
}
