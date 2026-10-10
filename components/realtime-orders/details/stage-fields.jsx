"use client";

import { cn } from "@/lib/utils";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";

/**
 * حقول المراحل (د16 → دفعة هـ): مساعدات مشتركة لبوب-أب «وثّقت» ونافذة المرحلة من القائمة.
 * (شريط «الخطوة التالية» المستقل أُلغي — الزر صار بجانب الخطوة الحالية في رحلة الطلب.)
 */

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
