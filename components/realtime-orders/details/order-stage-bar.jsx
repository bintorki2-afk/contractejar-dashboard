"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Check, ExternalLink, Hand, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/shared/confirm-provider";
import {
  openStageWhatsApp,
  STAGE_LABELS,
  useOrderStages,
  useRunOrderStage,
} from "@/src/hooks/use-order-stage";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { EjarCopyButtons } from "./ejar-copy";

const STAGE_ICONS = { received: Hand, draft_sent: Send, notarized: BadgeCheck };

const STAGE_HINTS = {
  received: "استلم الطلب باسمك ليبدأ العمل عليه — سيُبلَّغ العميل وتُفتح رسالة واتساب جاهزة.",
  draft_sent: "بعد رفع المسودة في إيجار: أدخل رقمها ثم أرسلها للعميل عبر واتساب.",
  notarized: "بعد موافقة العميل وتوثيق العقد في إيجار: أدخل نوع الصك ورقمه كما أُضيف في إيجار.",
};

/** هل الحقل مطلوب الآن؟ (يدعم required_if: [field, value]) */
export function isStageFieldRequired(field, values = {}) {
  if (field?.required) return true;
  const cond = field?.required_if;
  if (Array.isArray(cond) && cond.length >= 2) return String(values[cond[0]] ?? "") === String(cond[1]);
  return false;
}

/** هل يُعرض الحقل؟ (حقل required_if يظهر فقط عند تحقق شرطه) */
export function isStageFieldVisible(field, values = {}) {
  const cond = field?.required_if;
  if (Array.isArray(cond) && cond.length >= 2) return String(values[cond[0]] ?? "") === String(cond[1]);
  return true;
}

export function initialStageValues(fields = []) {
  const values = {};
  fields.forEach((f) => {
    if (f.type === "select" && Array.isArray(f.options) && f.options.length) values[f.name] = String(f.options[0].value);
    else values[f.name] = "";
  });
  return values;
}

function toAscii(value) {
  return String(value ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

/** حقول المرحلة كما يرسلها الخادم (next_stage_required_fields) — نموذج داخل البطاقة. */
export function StageFields({ fields = [], values, onChange, errors = {}, customerPhone, disabled }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.filter((f) => isStageFieldVisible(f, values)).map((field) => {
        const required = isStageFieldRequired(field, values);
        const id = `stage-field-${field.name}`;
        const error = errors[field.name];
        if (field.type === "select" && Array.isArray(field.options)) {
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-[#33403B] dark:text-white/70">
                {field.label_ar}
                {required ? <span className="text-[#B42318]"> *</span> : null}
              </span>
              <div role="radiogroup" aria-label={field.label_ar} className="inline-flex flex-wrap gap-1.5">
                {field.options.map((opt) => {
                  const active = String(values[field.name]) === String(opt.value);
                  const label =
                    field.name === "contact_number_mode" && opt.value === "same" && customerPhone
                      ? `${opt.label_ar} (${formatSaudiMobileDisplay(customerPhone)})`
                      : opt.label_ar;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={disabled}
                      onClick={() => onChange(field.name, String(opt.value))}
                      className={cn(
                        "h-9 px-3 rounded-lg border text-[12.5px] font-bold transition-colors",
                        active
                          ? "border-brand-deep bg-brand-mint text-brand-deep dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border-brand-line bg-white text-[#33403B] hover:border-brand-green/40 dark:bg-white/[0.04] dark:border-white/10 dark:text-white/70"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {error ? <span className="text-[11.5px] font-semibold text-[#B42318]">{error}</span> : null}
            </div>
          );
        }
        return (
          <label key={field.name} htmlFor={id} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-[#33403B] dark:text-white/70">
              {field.label_ar}
              {required ? <span className="text-[#B42318]"> *</span> : null}
            </span>
            <input
              id={id}
              name={field.name}
              dir="ltr"
              inputMode={/number|mobile|phone/.test(field.name) ? "numeric" : undefined}
              value={values[field.name] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(field.name, toAscii(e.target.value))}
              aria-invalid={error ? true : undefined}
              className={cn(
                "h-10 rounded-lg border bg-white px-3 text-[13px] font-semibold tabular-nums text-right text-[#14231D] focus:outline-none focus:ring-2 focus:ring-brand-green/30 dark:bg-white/[0.04] dark:text-white",
                error ? "border-[#B42318]" : "border-brand-line dark:border-white/10"
              )}
            />
            {error ? <span className="text-[11.5px] font-semibold text-[#B42318]">{error}</span> : null}
          </label>
        );
      })}
    </div>
  );
}

export function validateStageValues(fields = [], values = {}) {
  const errors = {};
  fields.forEach((f) => {
    if (!isStageFieldVisible(f, values)) return;
    if (isStageFieldRequired(f, values) && !String(values[f.name] ?? "").trim()) {
      errors[f.name] = `${f.label_ar} مطلوب`;
    }
  });
  return errors;
}

export function buildStageBody(fields = [], values = {}) {
  const body = {};
  fields.forEach((f) => {
    if (!isStageFieldVisible(f, values)) return;
    const v = String(values[f.name] ?? "").trim();
    if (v !== "") body[f.name] = v;
  });
  return body;
}

/**
 * شريط «الخطوة التالية» (د16): استلمت ← أرسلت المسودة ← وثّقت.
 * كل خطوة تستدعي POST /admin/orders/{id}/stage/{stage}، وتفتح واتساب برسالة القالب، وتعرض الخطوة التالية.
 */
export default function OrderStageBar({ orderId, canEdit = true, className }) {
  const confirm = useConfirm();
  const { data: stages, isLoading } = useOrderStages(orderId);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [lastWhatsApp, setLastWhatsApp] = useState(null);
  const [lastStageLabel, setLastStageLabel] = useState(null);

  const nextStage = stages?.next_stage ?? null;
  const fields = useMemo(() => stages?.next_stage_required_fields ?? [], [stages]);
  const fieldsKey = `${nextStage}:${fields.map((f) => f.name).join(",")}`;
  const [valuesKey, setValuesKey] = useState(null);
  if (valuesKey !== fieldsKey && stages) {
    setValuesKey(fieldsKey);
    setValues(initialStageValues(fields));
    setErrors({});
  }

  const run = useRunOrderStage({
    onSuccess: (data) => {
      setLastWhatsApp(data?.whatsapp ?? null);
      setLastStageLabel(data?.stage_label ?? null);
    },
    onError: (error) => {
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        const mapped = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      }
    },
  });

  if (isLoading) {
    return (
      <div className={cn("h-[92px] rounded-2xl border border-brand-line bg-white animate-pulse dark:bg-[#0F1C16] dark:border-white/10", className)} />
    );
  }
  if (!stages) return null;

  const allDone = !nextStage;
  const Icon = STAGE_ICONS[nextStage] ?? Check;

  const submit = async () => {
    if (!nextStage) return;
    const errs = validateStageValues(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const label = stages.next_stage_label ?? STAGE_LABELS[nextStage];
    const ok = await confirm({
      title: `تأكيد: ${label}`,
      description:
        nextStage === "received"
          ? "سيُسجَّل الطلب باسمك ويُبلَّغ العميل، ثم تُفتح رسالة واتساب جاهزة."
          : nextStage === "draft_sent"
            ? "ستتغير حالة الطلب إلى «إرسال المسودة» ويُبلَّغ العميل، ثم تُفتح رسالة المسودة في واتساب."
            : "ستتغير حالة الطلب إلى «موثّق في إيجار» ويُبلَّغ العميل، ثم تُفتح رسالة التوثيق في واتساب.",
      confirmLabel: label,
    });
    if (!ok) return;
    run.mutate({ orderId, stage: nextStage, body: buildStageBody(fields, values) });
  };

  return (
    <section
      aria-label="الخطوة التالية"
      className={cn(
        "rounded-2xl border bg-white p-4 sm:p-5 dark:bg-[#0F1C16]",
        allDone ? "border-brand-line dark:border-white/10" : "border-brand-deep/30 shadow-[0_6px_24px_rgba(11,90,60,0.08)] dark:border-emerald-400/30",
        className
      )}
      dir="rtl"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-bold text-[#6B7570] dark:text-white/50">
              {allDone ? "مراحل الموظف" : "الخطوة التالية"}
            </span>
            <ol className="flex items-center gap-1.5">
              {(stages.stages ?? []).map((st) => (
                <li
                  key={st.key}
                  className={cn(
                    "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-bold",
                    st.done
                      ? "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300"
                      : st.key === nextStage
                        ? "bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]"
                        : "bg-[#F0F4F2] text-[#8A958F] dark:bg-white/10 dark:text-white/40"
                  )}
                >
                  {st.done ? <Check className="size-3" strokeWidth={3} /> : null}
                  {st.label}
                </li>
              ))}
            </ol>
          </div>
          {allDone ? (
            <p className="mt-2 text-[15px] font-extrabold text-brand-deep dark:text-emerald-300">
              اكتملت مراحل الموظف — العقد موثّق في إيجار.
            </p>
          ) : (
            <>
              <h2 className="mt-2 flex items-center gap-2 text-[19px] font-extrabold text-[#0E1F18] dark:text-white">
                <Icon className="size-5 text-brand-deep dark:text-emerald-300" />
                {stages.next_stage_label ?? STAGE_LABELS[nextStage]}
              </h2>
              <p className="mt-1 text-[12.5px] text-[#6B7570] dark:text-white/50">{STAGE_HINTS[nextStage]}</p>
              {fields.length ? (
                <div className="mt-3">
                  <StageFields
                    fields={fields}
                    values={values}
                    errors={errors}
                    customerPhone={stages.customer_phone}
                    disabled={!canEdit || run.isPending}
                    onChange={(name, value) => {
                      setValues((prev) => ({ ...prev, [name]: value }));
                      setErrors((prev) => ({ ...prev, [name]: undefined }));
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
          {lastWhatsApp?.url ? (
            <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl bg-brand-mint px-3 py-2 text-[12px] font-bold text-brand-deep dark:bg-emerald-500/10 dark:text-emerald-300">
              تم «{lastStageLabel}».
              <button
                type="button"
                onClick={() => openStageWhatsApp(lastWhatsApp)}
                className="inline-flex items-center gap-1 underline underline-offset-2"
              >
                <ExternalLink className="size-3.5" />
                فتح رسالة واتساب مرة أخرى
              </button>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-1.5 lg:w-[240px]">
          {!allDone ? (
            <>
              <button
                type="button"
                onClick={submit}
                disabled={!canEdit || run.isPending}
                title={!canEdit ? "ليست لديك صلاحية تعديل الطلبات" : undefined}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 text-[15px] font-extrabold text-white shadow-sm hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]"
              >
                {run.isPending ? <Loader2 className="size-5 animate-spin" /> : <Icon className="size-5" />}
                {stages.next_stage_label ?? STAGE_LABELS[nextStage]}
              </button>
              <span className="text-center text-[11px] font-semibold text-[#8A958F] dark:text-white/40">يفتح واتساب برسالة جاهزة</span>
            </>
          ) : null}
          {/* د17: نسخ بيانات الطلب بترتيب منصة إيجار */}
          <EjarCopyButtons orderId={orderId} className="justify-center lg:mt-1" />
        </div>
      </div>
    </section>
  );
}
