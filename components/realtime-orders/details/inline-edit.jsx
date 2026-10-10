"use client";

import { createContext, useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describePriceDifference } from "@/src/lib/charges";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";

/**
 * تعديل سريع لحقول الطلب الصغيرة (د21) — PATCH /admin/orders/{id} مع تسجيل قبل/بعد في «سجل النشاط».
 * الحقول المسموحة من GET /admin/orders/editable-fields؛ أي حقل آخر لا يظهر عليه زر التعديل.
 */
const InlineEditContext = createContext(null);

export function useEditableFields(enabled = true) {
  return useQuery({
    queryKey: ["orders-editable-fields"],
    queryFn: async () => (await axiosInstance.get("/admin/orders/editable-fields"))?.data?.data ?? [],
    enabled,
    staleTime: 60 * 60_000,
  });
}

function toAscii(value) {
  return String(value ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

/** يحوّل الأخطاء/النتيجة إلى نص موجز «الحقل: قبل ← بعد». */
export function describeChanges(changed = {}) {
  return Object.values(changed)
    .map((c) => `${c.label}: ${c.before ?? "—"} ← ${c.after ?? "—"}`)
    .join(" · ");
}

export function InlineEditProvider({ orderData, canEdit, children }) {
  const { data: fields = [] } = useEditableFields(Boolean(canEdit));
  const queryClient = useQueryClient();
  const orderId = orderData?.id;
  const mutation = useMutation({
    mutationFn: async ({ key, value }) => (await axiosInstance.patch(`/admin/orders/${orderId}`, { [key]: value }))?.data,
    onSuccess: (res) => {
      const changed = res?.data?.changed ?? {};
      if (Object.keys(changed).length) {
        toast.success("تم تعديل البيانات وسُجّل في «سجل النشاط»", { description: describeChanges(changed) });
      } else {
        toast.message(res?.message || "لا توجد تغييرات.");
      }
      // دفعة هـ (E5): تغيّر السعر بعد التعديل ← فرق معلّق أو مستحق استرجاع.
      const pd = describePriceDifference(res?.data);
      if (pd) toast.warning(pd.title, { description: pd.description, duration: 8000 });
      invalidateOrdersCaches(queryClient, { orderId });
    },
  });
  const value = {
    canEdit: Boolean(canEdit && orderId),
    fields: new Map(fields.map((f) => [f.key, f])),
    rawValue: (key) => orderData?.[key] ?? orderData?.contract_summary?.[key] ?? "",
    save: (key, value) => mutation.mutateAsync({ key, value }),
  };
  return <InlineEditContext.Provider value={value}>{children}</InlineEditContext.Provider>;
}

export function useInlineEdit() {
  return useContext(InlineEditContext);
}

/** قيمة قابلة للتعديل داخل الصف. تُستخدم من Field عند تمرير editKey. */
export function InlineEditableValue({ editKey, children, className }) {
  const ctx = useInlineEdit();
  const field = ctx?.fields?.get(editKey);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!ctx?.canEdit || !field) return <span className={className}>{children}</span>;

  const start = () => {
    setDraft(String(ctx.rawValue(editKey) ?? ""));
    setError(null);
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setError(null);
  };
  const commit = async () => {
    setSaving(true);
    setError(null);
    try {
      await ctx.save(editKey, toAscii(draft).trim() === "" ? null : toAscii(draft).trim());
      setEditing(false);
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.errors?.[editKey]?.[0] ?? (data?.errors ? Object.values(data.errors).flat()[0] : null) ?? data?.message ?? "تعذّر الحفظ";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="flex flex-col items-end gap-1 min-w-0">
        <span className="flex items-center gap-1">
          <input
            autoFocus
            dir="auto"
            value={draft}
            aria-label={field.label}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className={cn(
              "h-7 w-[170px] rounded-md border bg-white px-2 text-[12px] font-bold tabular-nums dark:bg-white/[0.06]",
              error ? "border-[#B42318]" : "border-brand-green"
            )}
          />
          <button type="button" aria-label="حفظ" onClick={commit} disabled={saving} className="inline-flex size-7 items-center justify-center rounded-md bg-brand-deep text-white disabled:opacity-60">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </button>
          <button type="button" aria-label="إلغاء" onClick={cancel} className="inline-flex size-7 items-center justify-center rounded-md border border-brand-line text-[#6B7570]">
            <X className="size-3.5" />
          </button>
        </span>
        {error ? <span className="text-[10.5px] font-semibold text-[#B42318]">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className={cn("group/inline inline-flex items-center gap-1 min-w-0", className)}>
      <span className="truncate">{children}</span>
      <button
        type="button"
        onClick={start}
        aria-label={`تعديل ${field.label}`}
        title={`تعديل ${field.label} (يُسجَّل في سجل النشاط)`}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[#9AA6A1] opacity-0 transition-opacity hover:bg-brand-mint hover:text-brand-deep focus:opacity-100 group-hover/inline:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Pencil className="size-3" />
      </button>
    </span>
  );
}
