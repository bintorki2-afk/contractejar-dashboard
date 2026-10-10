"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fieldLabel(field) {
  return field?.label_ar || field?.label_en || field?.name || "";
}

function optionLabel(option) {
  return option?.label_ar || option?.label_en || option?.value || "";
}

function isFieldRequired(field, values) {
  if (field?.required) return true;
  const requiredIf = field?.required_if;
  if (!Array.isArray(requiredIf) || requiredIf.length < 2) return false;
  const [otherName, expected] = requiredIf;
  return String(values?.[otherName] ?? "") === String(expected);
}

function isFieldVisible(field, values) {
  const requiredIf = field?.required_if;
  if (!Array.isArray(requiredIf) || requiredIf.length < 2) return true;
  return isFieldRequired(field, values) || String(values?.[requiredIf[0]] ?? "") === String(requiredIf[1]);
}

function buildEmptyValues(fields) {
  return Object.fromEntries(
    fields.map((field) => [field.name, field.type === "file" ? null : ""])
  );
}

export function getStatusCaseFields(status) {
  const fields = status?.status_case?.fields;
  return Array.isArray(fields) ? fields : [];
}

export function statusRequiresExtraFields(status) {
  return getStatusCaseFields(status).length > 0;
}

export { buildOrderStatusChangePayload } from "@/src/lib/order-status-api";

export default function ChangeOrderStatusFieldsDialog({
  open,
  onOpenChange,
  status,
  isPending = false,
  onSubmit,
}) {
  const fields = useMemo(() => getStatusCaseFields(status), [status]);
  const [values, setValues] = useState({});
  const [session, setSession] = useState(0);
  const [prevOpen, setPrevOpen] = useState(false);

  // Each open starts a fresh session: remount the content and clear the fields.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSession((value) => value + 1);
      setValues(buildEmptyValues(fields));
    }
  }

  const missingRequired = fields.some(
    (field) =>
      isFieldRequired(field, values) &&
      isFieldVisible(field, values) &&
      (values[field.name] == null || values[field.name] === "")
  );

  const handleSubmit = () => {
    if (missingRequired || isPending) return;
    onSubmit?.(values);
  };

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent
        key={session}
        className="sm:max-w-[560px] p-8 rounded-32 border-0 dark:bg-card dark:text-white gap-0"
        dir="rtl"
        closeButton={false}
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/10 pb-4 mb-6">
          <DialogTitle className="text-22 font-black text-black dark:text-white text-right truncate">
            {status?.name || status?.label || "تغيير الحالة"}
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-ink-placeholder transition-colors hover:bg-[#FFEBEB] hover:text-[#E24444] dark:bg-white/10"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {fields.map((field) => {
            if (!isFieldVisible(field, values)) return null;
            const required = isFieldRequired(field, values);
            const label = fieldLabel(field);

            if (field.type === "select") {
              return (
                <label key={field.name} className="flex flex-col gap-2">
                  <span className="text-13 font-bold px-1">
                    {label}
                    {required ? <span className="text-status-danger mr-1">*</span> : null}
                  </span>
                  <Select
                    key={`${field.name}-select-${session}`}
                    dir="rtl"
                    value={values[field.name] || undefined}
                    onValueChange={(value) =>
                      setValues((prev) => ({ ...prev, [field.name]: value }))
                    }
                  >
                    <SelectTrigger className="h-13.5 rounded-2xl bg-surface-input dark:bg-white/[0.04] border-surface-border dark:border-white/10">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {optionLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              );
            }

            if (field.type === "file") {
              return (
                <label key={field.name} className="flex flex-col gap-2">
                  <span className="text-13 font-bold px-1">
                    {label}
                    {required ? <span className="text-status-danger mr-1">*</span> : null}
                  </span>
                  <input
                    key={`${field.name}-file-${session}`}
                    type="file"
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.files?.[0] ?? null,
                      }))
                    }
                    className="w-full h-13.5 bg-surface-input dark:bg-white/[0.04] border border-surface-border dark:border-white/10 rounded-2xl px-5 py-3 text-13"
                  />
                </label>
              );
            }

            const isTextarea = field.type === "text";
            const InputTag = isTextarea ? "textarea" : "input";

            return (
              <label key={field.name} className="flex flex-col gap-2">
                <span className="text-13 font-bold px-1">
                  {label}
                  {required ? <span className="text-status-danger mr-1">*</span> : null}
                </span>
                <InputTag
                  value={values[field.name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  rows={isTextarea ? 3 : undefined}
                  className={
                    isTextarea
                      ? "w-full min-h-[96px] bg-surface-input dark:bg-white/[0.04] border border-surface-border dark:border-white/10 rounded-2xl px-5 py-3 text-15 focus:outline-none focus:border-brand-dark font-medium text-right resize-none"
                      : "w-full h-13.5 bg-surface-input dark:bg-white/[0.04] border border-surface-border dark:border-white/10 rounded-2xl px-5 text-15 focus:outline-none focus:border-brand-dark font-medium text-right"
                  }
                />
              </label>
            );
          })}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || missingRequired}
            className="w-full h-13.5 bg-brand-dark text-white rounded-2xl font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 mt-2"
          >
            {isPending ? <Loader2 className="animate-spin mx-auto" /> : "تأكيد تغيير الحالة"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="w-full h-13 rounded-2xl border border-surface-border text-ink-subtle font-bold text-15 hover:bg-neutral-100 transition-all"
          >
            إلغاء
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
