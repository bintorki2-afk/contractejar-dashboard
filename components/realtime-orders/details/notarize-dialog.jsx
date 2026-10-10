"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRunOrderStage } from "@/src/hooks/use-order-stage";
import {
  StageFields,
  buildStageBody,
  initialStageValues,
  validateStageValues,
} from "./stage-fields";

/** حقول التوثيق الافتراضية إن لم يرسلها الخادم (نوع الصك + رقمه). */
const DEFAULT_NOTARIZE_FIELDS = [
  {
    name: "deed_type",
    type: "select",
    required: true,
    label_ar: "نوع الصك",
    options: [
      { value: "electronic", label_ar: "إلكتروني" },
      { value: "paper", label_ar: "ورقي" },
      { value: "other", label_ar: "أخرى" },
    ],
  },
  { name: "deed_number", type: "string", required: true, label_ar: "رقم الصك" },
];

/**
 * بوب-أب «وثّقت» (دفعة هـ — د8): نوع الصك + رقمه ← POST /admin/orders/{id}/stage/notarized.
 * مقفول (payment_required / charge_pending) يعرض السبب ولا يرسل؛ مدير النظام يمكنه الإجبار (force=1).
 */
export default function NotarizeDialog({
  open,
  onOpenChange,
  orderId,
  stages,
  canForce = false,
  onDone,
}) {
  const fields = useMemo(() => {
    const list = stages?.next_stage === "notarized" ? stages?.next_stage_required_fields : null;
    return Array.isArray(list) && list.length ? list : DEFAULT_NOTARIZE_FIELDS;
  }, [stages]);
  const locked = Boolean(stages?.next_stage_locked) && stages?.next_stage === "notarized";
  const lockMessage =
    stages?.next_stage_lock_message ||
    stages?.payment_state?.notarize_block_message ||
    (stages?.next_stage_lock_reason === "charge_pending"
      ? "لا يمكن توثيق العقد وهناك رسوم بانتظار الدفع — حصّل الفرق أولاً أو ألغِ الرسوم."
      : "لا يمكن توثيق العقد قبل تسجيل الدفع (رابط دفع أو حوالة بنكية).");
  const warnings = Array.isArray(stages?.warnings) ? stages.warnings : [];

  const [values, setValues] = useState(() => initialStageValues(fields));
  const [errors, setErrors] = useState({});
  const [force, setForce] = useState(false);
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded) {
    setSeeded(true);
    setValues(initialStageValues(fields));
    setErrors({});
    setForce(false);
  }
  if (!open && seeded) setSeeded(false);

  const run = useRunOrderStage({
    onSuccess: (data) => {
      onDone?.(data);
      onOpenChange?.(false);
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

  const submit = () => {
    const errs = validateStageValues(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = buildStageBody(fields, values);
    if (locked && canForce && force) body.force = 1;
    run.mutate({ orderId, stage: "notarized", body });
  };

  const blocked = locked && !(canForce && force);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[520px] rounded-2xl text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-extrabold text-[#0E1F18] dark:text-white">
            <BadgeCheck className="size-5 text-brand-deep dark:text-emerald-300" />
            تأكيد التوثيق في إيجار
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6B7570] dark:text-white/50">
            أدخل نوع الصك ورقمه كما أُضيف في إيجار. بعد الحفظ يصل العميل إشعار «تم توثيق عقدك» وتُفتح رسالة واتساب جاهزة.
          </DialogDescription>
        </DialogHeader>

        {locked ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#F5C9C6] bg-[#FDECEC] px-3 py-2.5 text-[12.5px] font-bold text-[#B42318] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <Lock className="mt-0.5 size-4 shrink-0" />
            <span>{lockMessage}</span>
          </div>
        ) : null}

        {warnings.map((w) => (
          <p
            key={w.code ?? w.message}
            className="rounded-xl border border-[#F1D59A] bg-[#FFF7E6] px-3 py-2 text-[12.5px] font-bold text-[#7A4B00] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            ⚠ {w.message}
          </p>
        ))}

        <StageFields
          fields={fields}
          values={values}
          errors={errors}
          customerPhone={stages?.customer_phone}
          disabled={run.isPending || blocked}
          onChange={(name, value) => {
            setValues((prev) => ({ ...prev, [name]: value }));
            setErrors((prev) => ({ ...prev, [name]: undefined }));
          }}
        />

        {locked && canForce ? (
          <label className="flex items-center gap-2 text-[12.5px] font-bold text-[#B42318] dark:text-red-300">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="size-4" />
            تجاوز القفل بصفتي مدير النظام (يُسجَّل في سجل النشاط)
          </label>
        ) : null}

        <DialogFooter className="flex-row justify-start gap-2 sm:justify-start">
          <button
            type="button"
            onClick={submit}
            disabled={run.isPending || blocked}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-deep px-5 text-[14px] font-extrabold text-white hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]"
            )}
          >
            {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
            حفظ وتوثيق
          </button>
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            disabled={run.isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-line bg-white px-5 text-[14px] font-bold text-[#14231D] hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-white"
          >
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
