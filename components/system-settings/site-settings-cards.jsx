"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/src/utils/axios";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { mapApiValidationErrors } from "@/src/lib/contract-update/payload";
import { METER_FEE_SETTINGS_QUERY_KEY } from "@/src/lib/meter-fee-settings";
import {
  APP_VERSION_MESSAGE_KEY,
  APP_VERSION_PLATFORMS,
  buildAppVersionPayload,
  buildSupportPayload,
  extractAppVersionSettings,
  extractSupportSettings,
  validateAppVersionForm,
  validateSupportNumber,
  buildPricingPayload,
  buildSocialPayload,
  emptyPricingForm,
  emptySocialForm,
  extractPricingSettings,
  extractSocialSettings,
  normalizeNumericInput,
  PRICING_FIELD_GROUPS,
  SITE_SETTINGS_API,
  SITE_SETTINGS_QUERY_KEY,
  SOCIAL_FIELDS,
  SOCIAL_HELPER_TEXT,
  validatePricingForm,
} from "@/src/lib/site-settings";

const INPUT_CLASS =
  "h-11 rounded-xl border-[#E4EBE8] bg-[#F8FAF9] text-13 font-semibold text-gray-900 focus-visible:ring-brand-dark/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function isDirty(a, b) {
  return Object.keys(a).some((key) => (a[key] ?? "") !== (b[key] ?? ""));
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-500">{message}</p>;
}

function HelperText({ children }) {
  if (!children) return null;
  return (
    <p className="text-[11.5px] font-medium leading-5 text-[#8a978f] dark:text-white/45">{children}</p>
  );
}

function SaveButton({ onClick, disabled, pending, label = "حفظ" }) {
  return (
    <button type="button" className="xbtn disabled:cursor-not-allowed disabled:opacity-50" onClick={onClick} disabled={disabled}>
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          جاري الحفظ...
        </>
      ) : (
        label
      )}
    </button>
  );
}

/** يستخدم استعلاماً واحداً لإعدادات الموقع (الأسعار + حسابات التواصل). */
export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: [SITE_SETTINGS_QUERY_KEY],
    queryFn: () => axiosInstance.get(SITE_SETTINGS_API).then((res) => res?.data),
  });
}

function useSaveSiteSettings({ successMessage, errorFallback, onValidationError }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      axiosInstance.post(SITE_SETTINGS_API, payload).then((res) => res?.data),
    onSuccess: (response) => {
      toast.success(response?.message || successMessage);
      queryClient.invalidateQueries({ queryKey: [SITE_SETTINGS_QUERY_KEY] });
      // تبويب «رسوم العدادات» يقرأ نفس الأعمدة من مسار آخر — نحدّثه أيضاً.
      queryClient.invalidateQueries({ queryKey: [METER_FEE_SETTINGS_QUERY_KEY] });
    },
    onError: (err) => {
      onValidationError?.(mapApiValidationErrors(err?.response?.data?.errors));
      toast.error(errorMessage(err, errorFallback));
    },
  });
}

function CardShell({ title, description, badge, children }) {
  return (
    <section className="cpf-sec">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="cpf-sec-t" style={{ marginBottom: description ? 4 : 0 }}>
            {title}
          </div>
          {description ? <HelperText>{description}</HelperText> : null}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function PricingSettingsCard({ data, canEdit }) {
  const [form, setForm] = useState(emptyPricingForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [syncedData, setSyncedData] = useState(null);

  const serverForm = extractPricingSettings(data);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setForm(serverForm);
    setFieldErrors({});
  }

  const mutation = useSaveSiteSettings({
    successMessage: "تم حفظ الأسعار والرسوم بنجاح",
    errorFallback: "تعذر حفظ الأسعار والرسوم",
    onValidationError: setFieldErrors,
  });

  const dirty = isDirty(form, serverForm);

  const updateField = (key, raw) => {
    const value = normalizeNumericInput(raw);
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    const errors = validatePricingForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("تحقق من القيم المدخلة");
      return;
    }
    mutation.mutate(buildPricingPayload(form));
  };

  return (
    <CardShell
      title="الأسعار والرسوم"
      description="الأسعار شاملة جميع الرسوم بما فيها رسوم منصة إيجار. تُطبّق التغييرات على الطلبات الجديدة فوراً."
      badge={
        <SaveButton
          onClick={handleSave}
          disabled={!canEdit || mutation.isPending || !dirty}
          pending={mutation.isPending}
          label="حفظ الأسعار"
        />
      }
    >
      <div className="space-y-5">
        {PRICING_FIELD_GROUPS.map((group) => (
          <div key={group.id} className="space-y-3">
            <div>
              <p className="text-[12.5px] font-black text-gray-900 dark:text-white">{group.title}</p>
              <HelperText>{group.description}</HelperText>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5 text-right">
                  <label htmlFor={`pricing-${field.key}`} className="text-xs font-bold text-gray-700 dark:text-white/80">
                    {field.label}
                  </label>
                  <div className="relative" dir="ltr">
                    <Input
                      id={`pricing-${field.key}`}
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={form[field.key]}
                      disabled={!canEdit}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder="0"
                      className={cn(INPUT_CLASS, "pr-12 text-left", fieldErrors[field.key] && "border-red-400")}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-bold text-[#8a978f] dark:text-white/40">
                      {field.unit}
                    </span>
                  </div>
                  <HelperText>{field.helper}</HelperText>
                  <FieldError message={fieldErrors[field.key]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function SocialSettingsCard({ data, canEdit }) {
  const [form, setForm] = useState(emptySocialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [syncedData, setSyncedData] = useState(null);

  const serverForm = extractSocialSettings(data);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setForm(serverForm);
    setFieldErrors({});
  }

  const mutation = useSaveSiteSettings({
    successMessage: "تم حفظ حسابات التواصل بنجاح",
    errorFallback: "تعذر حفظ حسابات التواصل",
    onValidationError: setFieldErrors,
  });

  const dirty = isDirty(form, serverForm);

  return (
    <CardShell
      title="حسابات التواصل"
      description={SOCIAL_HELPER_TEXT}
      badge={
        <SaveButton
          onClick={() => mutation.mutate(buildSocialPayload(form))}
          disabled={!canEdit || mutation.isPending || !dirty}
          pending={mutation.isPending}
          label="حفظ الحسابات"
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SOCIAL_FIELDS.map((field) => {
          const value = form[field.key] ?? "";
          const active = value.trim() !== "";
          return (
            <div key={field.key} className="space-y-1.5 text-right">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`social-${field.key}`} className="text-xs font-bold text-gray-700 dark:text-white/80">
                  {field.label}
                </label>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    active
                      ? "bg-[#dcf5e8] text-[#0B7A4C] dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-[#eef0ef] text-[#6b7c76] dark:bg-white/10 dark:text-white/50"
                  )}
                >
                  {active ? "ظاهر" : "مخفي"}
                </span>
              </div>
              <Input
                id={`social-${field.key}`}
                type="text"
                dir={field.dir}
                value={value}
                disabled={!canEdit}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((current) => ({ ...current, [field.key]: next }));
                  setFieldErrors((current) => {
                    if (!current[field.key]) return current;
                    const copy = { ...current };
                    delete copy[field.key];
                    return copy;
                  });
                }}
                placeholder={field.placeholder}
                className={cn(INPUT_CLASS, "text-left", fieldErrors[field.key] && "border-red-400")}
              />
              <FieldError message={fieldErrors[field.key]} />
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

export function SupportNumberCard({ data, canEdit }) {
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState(null);
  const [syncedData, setSyncedData] = useState(null);

  const support = extractSupportSettings(data);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setValue(support.form.whatsapp_contact);
    setFieldError(null);
  }

  const mutation = useSaveSiteSettings({
    successMessage: "تم حفظ رقم الدعم بنجاح",
    errorFallback: "تعذر حفظ رقم الدعم",
    onValidationError: (errors) => setFieldError(errors?.whatsapp_contact ?? null),
  });

  const dirty = (value ?? "") !== (support.form.whatsapp_contact ?? "");

  const handleSave = () => {
    const error = validateSupportNumber(value);
    if (error) {
      setFieldError(error);
      toast.error(error);
      return;
    }
    mutation.mutate(buildSupportPayload({ whatsapp_contact: value }));
  };

  return (
    <CardShell
      title="رقم الدعم (واتساب)"
      description="الرقم الذي يظهر للعملاء في الموقع والتطبيق لأزرار واتساب والدعم. اتركه فارغاً لاستخدام الرقم الافتراضي."
      badge={
        <SaveButton
          onClick={handleSave}
          disabled={!canEdit || mutation.isPending || !dirty}
          pending={mutation.isPending}
          label="حفظ الرقم"
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 text-right">
          <label htmlFor="support-whatsapp-contact" className="text-xs font-bold text-gray-700 dark:text-white/80">
            رقم واتساب الدعم
          </label>
          <Input
            id="support-whatsapp-contact"
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={value}
            disabled={!canEdit}
            onChange={(e) => {
              setValue(e.target.value);
              setFieldError(null);
            }}
            placeholder={support.fallback}
            className={cn(INPUT_CLASS, "text-left", fieldError && "border-red-400")}
          />
          <HelperText>يُحفظ بالصيغة الدولية تلقائياً (05XXXXXXXX ← 9665XXXXXXXX).</HelperText>
          <FieldError message={fieldError} />
        </div>
        <div className="rounded-xl bg-[#F3F9F6] dark:bg-white/[0.04] px-4 py-3 text-right">
          <p className="text-[11.5px] font-bold text-[#8a978f] dark:text-white/45">الرقم المعروض للعملاء الآن</p>
          <p className="mt-1 text-[15px] font-black text-brand-dark dark:text-emerald-300 tabular-nums" dir="ltr">
            {support.effectiveLocal}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

export function AppVersionCard({ data, canEdit }) {
  const [form, setForm] = useState(() => extractAppVersionSettings(null));
  const [fieldErrors, setFieldErrors] = useState({});
  const [syncedData, setSyncedData] = useState(null);

  const serverForm = extractAppVersionSettings(data);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setForm(serverForm);
    setFieldErrors({});
  }

  const mutation = useSaveSiteSettings({
    successMessage: "تم حفظ إعدادات إصدار التطبيق",
    errorFallback: "تعذر حفظ إعدادات إصدار التطبيق",
    onValidationError: setFieldErrors,
  });

  const dirty = isDirty(form, serverForm);

  const updateField = (key, next) => {
    setForm((current) => ({ ...current, [key]: next }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
  };

  const handleSave = () => {
    const errors = validateAppVersionForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("تحقق من القيم المدخلة");
      return;
    }
    mutation.mutate(buildAppVersionPayload(form));
  };

  return (
    <CardShell
      title="إصدار التطبيق والتحديث الإجباري"
      description="أي جهاز يعمل بإصدار أقدم من «أقل إصدار مسموح» يُطلب منه التحديث قبل المتابعة. «أحدث إصدار» يظهر كتحديث اختياري."
      badge={
        <SaveButton
          onClick={handleSave}
          disabled={!canEdit || mutation.isPending || !dirty}
          pending={mutation.isPending}
          label="حفظ الإصدارات"
        />
      }
    >
      <div className="space-y-5">
        {APP_VERSION_PLATFORMS.map((platform) => (
          <div key={platform.id} className="space-y-3">
            <p className="text-[12.5px] font-black text-gray-900 dark:text-white">{platform.title}</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {platform.fields.map((field) => (
                <div key={field.key} className="space-y-1.5 text-right">
                  <label htmlFor={`appver-${field.key}`} className="text-xs font-bold text-gray-700 dark:text-white/80">
                    {field.label}
                  </label>
                  <Input
                    id={`appver-${field.key}`}
                    type="text"
                    dir="ltr"
                    inputMode={field.kind === "version" ? "decimal" : "url"}
                    value={form[field.key] ?? ""}
                    disabled={!canEdit}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn(INPUT_CLASS, "text-left", fieldErrors[field.key] && "border-red-400")}
                  />
                  <FieldError message={fieldErrors[field.key]} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <HelperText>
          نفس الإصدارات تظهر في صفحة{" "}
          <Link href="/home/settings/app-status" className="font-bold text-[#0B7A4C] underline">
            حالة التطبيق والإصدارات
          </Link>{" "}
          (وفيها أيضاً إيقاف/تشغيل الموقع والتطبيق).
        </HelperText>

        <div className="space-y-1.5 text-right">
          <label htmlFor="appver-message" className="text-xs font-bold text-gray-700 dark:text-white/80">
            رسالة التحديث الإجباري
          </label>
          <textarea
            id="appver-message"
            rows={2}
            value={form[APP_VERSION_MESSAGE_KEY] ?? ""}
            disabled={!canEdit}
            onChange={(e) => updateField(APP_VERSION_MESSAGE_KEY, e.target.value)}
            placeholder="يرجى تحديث التطبيق لمتابعة الاستخدام"
            className={cn(INPUT_CLASS, "h-auto min-h-[72px] w-full rounded-xl border px-3 py-2.5 resize-none")}
          />
          <FieldError message={fieldErrors[APP_VERSION_MESSAGE_KEY]} />
        </div>
      </div>
    </CardShell>
  );
}

/** الحاوية التي تُدرج في تبويب «الإعدادات العامة». */
export default function SiteSettingsCards() {
  const { can, isReady } = usePermissions();
  const canEdit = isReady && can(PERMISSION_SECTIONS.settings, "edit");
  const { data, isLoading, isError, error } = useSiteSettingsQuery();

  if (isLoading) {
    return (
      <div className="cpf-sec flex min-h-[160px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[#0B7A4C]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#FECACA] bg-[#FFF5F5] p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
        <p className="text-[14px] font-bold text-[#B91C1C] dark:text-red-300">تعذر تحميل الأسعار وحسابات التواصل</p>
        <p className="mt-1 text-[12.5px] text-[#991B1B] dark:text-red-200/80">
          {errorMessage(error, "تأكد من توفر الـ API ثم أعد المحاولة")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PricingSettingsCard data={data} canEdit={canEdit} />
      <SupportNumberCard data={data} canEdit={canEdit} />
      <SocialSettingsCard data={data} canEdit={canEdit} />
      <AppVersionCard data={data} canEdit={canEdit} />
    </div>
  );
}
