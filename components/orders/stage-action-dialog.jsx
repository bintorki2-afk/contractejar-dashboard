"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StageFields,
  buildStageBody,
  initialStageValues,
  validateStageValues,
} from "@/components/realtime-orders/details/order-stage-bar";
import { STAGE_LABELS, useOrderStages, useRunOrderStage } from "@/src/hooks/use-order-stage";

/**
 * نافذة تنفيذ المرحلة من صف القائمة (د18) أو باختصار «S» (د19) دون فتح التفاصيل.
 * تقرأ الحقول المطلوبة من الخادم ثم تستدعي POST /admin/orders/{id}/stage/{stage} وتفتح واتساب.
 */
export default function StageActionDialog({ order, open, onOpenChange, onDone }) {
  const orderId = order?.id ?? null;
  const { data: stages, isLoading } = useOrderStages(orderId, { enabled: open && orderId != null });
  const stage = stages?.next_stage ?? null;
  const fields = stages?.next_stage_required_fields ?? [];
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [seededFor, setSeededFor] = useState(null);
  const seedKey = `${orderId}:${stage}`;
  if (open && stages && seededFor !== seedKey) {
    setSeededFor(seedKey);
    setValues(initialStageValues(fields));
    setErrors({});
  }

  const run = useRunOrderStage({
    onSuccess: (data, vars) => {
      onOpenChange?.(false);
      onDone?.(data, vars);
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

  const label = stages?.next_stage_label ?? STAGE_LABELS[stage] ?? "الخطوة التالية";

  const submit = () => {
    if (!stage) return;
    const errs = validateStageValues(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    run.mutate({ orderId, stage, body: buildStageBody(fields, values) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "…" : stage ? `${label} — الطلب #${order?.uuid ?? ""}` : `الطلب #${order?.uuid ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            {stage
              ? "سيُحدَّث الطلب ويُبلَّغ العميل، ثم تُفتح رسالة واتساب جاهزة."
              : isLoading
                ? "جاري التحميل…"
                : "لا توجد مرحلة متاحة لهذا الطلب الآن."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-brand-deep" />
          </div>
        ) : stage && fields.length ? (
          <StageFields
            fields={fields}
            values={values}
            errors={errors}
            customerPhone={stages?.customer_phone}
            disabled={run.isPending}
            onChange={(name, value) => {
              setValues((prev) => ({ ...prev, [name]: value }));
              setErrors((prev) => ({ ...prev, [name]: undefined }));
            }}
          />
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="h-10 px-4 rounded-xl border border-brand-line text-sm font-bold text-[#33403B] hover:bg-gray-50 dark:border-white/10 dark:text-white/70"
          >
            إلغاء
          </button>
          {stage ? (
            <button
              type="button"
              onClick={submit}
              disabled={run.isPending}
              className="h-10 px-5 rounded-xl bg-brand-deep text-white text-sm font-bold hover:bg-brand-deep/90 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {run.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {label}
            </button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
