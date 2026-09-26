"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/home/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/src/utils/axios";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  APP_STATUS_API,
  APP_STATUS_QUERY_KEY,
  APP_STATUS_VERSION_FIELDS,
  WEBSITE_MESSAGE_FIELDS,
  buildOpenStatePayload,
  buildPlatformPayload,
  buildWebsiteStatusPayload,
  emptyPlatformForm,
  emptyWebsiteForm,
  extractAppStatus,
} from "@/src/lib/app-status";

const PLATFORMS = [
  { key: "ios", label: "إصدار iOS" },
  { key: "android", label: "إصدار Android" },
];

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

// شارة «قريبًا» للميزات غير المفعّلة بعد (مثل تطبيق الجوال لعقد إيجار).
function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
      قريبًا
    </span>
  );
}

export default function AppStatusPanel() {
  const queryClient = useQueryClient();
  const { can, isReady } = usePermissions();
  const canEdit = isReady && can(PERMISSION_SECTIONS.settings, "edit");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [APP_STATUS_QUERY_KEY],
    queryFn: () => axiosInstance.get(APP_STATUS_API).then((res) => res?.data),
  });

  const status = extractAppStatus(data);

  const [forms, setForms] = useState({
    website: emptyWebsiteForm,
    ios: emptyPlatformForm.ios,
    android: emptyPlatformForm.android,
  });

  const [syncedData, setSyncedData] = useState(null);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setForms({ website: status.website, ios: status.ios, android: status.android });
  }

  const mobileToggleMutation = useMutation({
    mutationFn: ({ value }) =>
      axiosInstance
        .put(APP_STATUS_API, buildOpenStatePayload("mobile", value))
        .then((res) => res?.data),
    onSuccess: (response) => {
      toast.success(response?.message || "تم تحديث حالة تطبيق الجوال");
      queryClient.invalidateQueries({ queryKey: [APP_STATUS_QUERY_KEY] });
    },
    onError: (err) => toast.error(errorMessage(err, "تعذر تحديث حالة تطبيق الجوال")),
  });

  const websiteMutation = useMutation({
    mutationFn: () =>
      axiosInstance
        .put(APP_STATUS_API, buildWebsiteStatusPayload(forms.website))
        .then((res) => res?.data),
    onSuccess: (response) => {
      toast.success(response?.message || "تم تحديث حالة الموقع");
      queryClient.invalidateQueries({ queryKey: [APP_STATUS_QUERY_KEY] });
    },
    onError: (err) => toast.error(errorMessage(err, "تعذر تحديث حالة الموقع")),
  });

  const versionMutation = useMutation({
    mutationFn: ({ platform }) =>
      axiosInstance
        .put(APP_STATUS_API, buildPlatformPayload(platform, forms[platform]))
        .then((res) => res?.data),
    onSuccess: (response) => {
      toast.success(response?.message || "تم حفظ إعدادات الإصدار");
      queryClient.invalidateQueries({ queryKey: [APP_STATUS_QUERY_KEY] });
    },
    onError: (err) => toast.error(errorMessage(err, "تعذر حفظ إعدادات الإصدار")),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-[#FECACA] bg-[#FFF5F5] p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
        <p className="text-15 font-bold text-[#B91C1C] dark:text-red-300">
          تعذر تحميل حالة التطبيق
        </p>
        <p className="mt-2 text-13 text-[#991B1B] dark:text-red-200/80">
          {errorMessage(error, "تأكد من توفر الـ API ثم أعد المحاولة")}
        </p>
      </div>
    );
  }

  const updateWebsiteField = (key, value) => {
    setForms((current) => ({
      ...current,
      website: { ...current.website, [key]: value },
    }));
  };

  const updatePlatformField = (platform, key, value) => {
    setForms((current) => ({
      ...current,
      [platform]: { ...current[platform], [key]: value },
    }));
  };

  const websiteForm = forms.website;
  const websiteOpen = websiteForm.is_open;
  const websiteDirty =
    websiteForm.is_open !== status.website.is_open ||
    websiteForm.message_ar !== status.website.message_ar ||
    websiteForm.message_en !== status.website.message_en;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card dark:shadow-none">
        <h2 className="text-lg font-black text-black dark:text-white">حالة الموقع الإلكتروني</h2>
        <p className="mt-1 text-13 leading-7 text-[#707070] dark:text-white/55">
          عند الإيقاف يعرض الموقع صفحة صيانة كاملة برسالة الإغلاق أدناه بحسب لغة الزائر.
        </p>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-surface-border bg-neutral-50 px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <div className="text-sm font-bold text-black dark:text-white">تشغيل الموقع</div>
            <div
              className={`text-xs font-bold ${
                websiteOpen
                  ? "text-[#0B7A4C] dark:text-emerald-300"
                  : "text-[#B91C1C] dark:text-red-300"
              }`}
            >
              {websiteOpen ? "الموقع يعمل" : "الموقع مغلق"}
            </div>
          </div>
          <Switch
            checked={websiteOpen}
            disabled={!canEdit || websiteMutation.isPending}
            onCheckedChange={(value) => updateWebsiteField("is_open", value)}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {WEBSITE_MESSAGE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2 text-right">
              <label className="text-sm font-bold text-black dark:text-white">
                {field.label}
              </label>
              <Textarea
                value={websiteForm[field.key]}
                disabled={!canEdit}
                onChange={(e) => updateWebsiteField(field.key, e.target.value)}
                rows={2}
                dir={field.key === "message_en" ? "ltr" : "rtl"}
                className="min-h-[64px] resize-none rounded-2xl border-surface-border bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04]"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={() => websiteMutation.mutate()}
            disabled={!canEdit || websiteMutation.isPending || !websiteDirty}
            className="h-12 min-w-[160px] rounded-full bg-brand-main px-6 font-bold text-white hover:bg-brand-hover"
          >
            {websiteMutation.isPending ? (
              <>
                <Loader2 className="ml-2 size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ حالة الموقع"
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card dark:shadow-none">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-black dark:text-white">حالة تطبيق الجوال</h2>
          <ComingSoonBadge />
        </div>
        <p className="mt-1 text-13 leading-7 text-[#707070] dark:text-white/55">
          هذه الميزة غير مفعّلة حاليًا (لا يوجد تطبيق جوال لعقد إيجار بعد).
        </p>

        <div className="pointer-events-none mt-5 flex items-center justify-between gap-4 rounded-2xl border border-surface-border bg-neutral-50 px-4 py-3.5 opacity-60 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <div className="text-sm font-bold text-black dark:text-white">تشغيل التطبيق</div>
            <div
              className={`text-xs font-bold ${
                status.mobile.is_open
                  ? "text-[#0B7A4C] dark:text-emerald-300"
                  : "text-[#B91C1C] dark:text-red-300"
              }`}
            >
              {status.mobile.is_open ? "التطبيق يعمل" : "التطبيق متوقف"}
            </div>
          </div>
          {mobileToggleMutation.isPending ? (
            <Loader2 className="size-4 animate-spin text-[#0B7A4C]" />
          ) : (
            <Switch
              checked={status.mobile.is_open}
              disabled={!canEdit}
              onCheckedChange={(value) => mobileToggleMutation.mutate({ value })}
            />
          )}
        </div>
      </section>

      {PLATFORMS.map((platform) => {
        const form = forms[platform.key];
        const fields = APP_STATUS_VERSION_FIELDS[platform.key];
        const isSaving =
          versionMutation.isPending &&
          versionMutation.variables?.platform === platform.key;
        return (
          <section
            key={platform.key}
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card dark:shadow-none"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-black dark:text-white">
                {platform.label}
              </h2>
              <ComingSoonBadge />
            </div>

            <div className="pointer-events-none mt-5 grid gap-5 opacity-60 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={`space-y-2 text-right ${field.textarea ? "sm:col-span-2" : ""}`}
                >
                  <label className="text-sm font-bold text-black dark:text-white">
                    {field.label}
                  </label>
                  {field.textarea ? (
                    <Textarea
                      value={form[field.key]}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updatePlatformField(platform.key, field.key, e.target.value)
                      }
                      rows={2}
                      dir={field.key === "message_en" ? "ltr" : "rtl"}
                      className="min-h-[64px] resize-none rounded-2xl border-surface-border bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04]"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      value={form[field.key]}
                      disabled={!canEdit}
                      dir="ltr"
                      onChange={(e) =>
                        updatePlatformField(platform.key, field.key, e.target.value)
                      }
                      className="h-12 rounded-2xl border-surface-border bg-neutral-50 text-right dark:border-white/10 dark:bg-white/[0.04]"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pointer-events-none mt-5 flex flex-wrap items-center justify-between gap-4 opacity-60">
              <label className="flex items-center gap-3">
                <Switch
                  checked={form.force_update}
                  disabled={!canEdit}
                  onCheckedChange={(value) =>
                    updatePlatformField(platform.key, "force_update", value)
                  }
                />
                <span className="text-sm font-bold text-black dark:text-white">
                  إلزام التحديث
                </span>
              </label>

              <Button
                type="button"
                onClick={() => versionMutation.mutate({ platform: platform.key })}
                disabled={!canEdit || versionMutation.isPending}
                className="h-12 min-w-[160px] rounded-full bg-brand-main px-6 font-bold text-white hover:bg-brand-hover"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="ml-2 size-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ الإصدار"
                )}
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
