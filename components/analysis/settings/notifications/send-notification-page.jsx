"use client";

import { useState } from "react";
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
  CUSTOMER_NOTIFICATION_KINDS,
  NOTIFICATION_TARGETS,
  useSendNotification,
} from "@/src/hooks/use-send-notification";
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
};

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

  const handleSubmit = (e) => {
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

    mutation.mutate({
      target,
      form: {
        title: form.title,
        body: form.body,
        userId: form.userId,
        employeeId: form.employeeId,
        kind: form.kind,
        url: form.url,
      },
    });
  };

  return (
    <SettingsPageShell>
      <SettingsListHeader title={PAGE_TITLE} subtitle="إرسال إشعار للمستخدمين أو الموظفين" />

      <SettingsContentCard>
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
      </SettingsContentCard>

      <PermissionGate section={PERMISSION_SECTIONS.notifications} action="view">
        <NotificationDispatchLog />
      </PermissionGate>
    </SettingsPageShell>
  );
}
