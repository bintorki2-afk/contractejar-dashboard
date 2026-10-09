"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgePercent, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { useConfirm } from "@/components/shared/confirm-provider";

const TYPES = [
  { value: "percentage", label: "نسبة %" },
  { value: "fixed", label: "مبلغ ثابت" },
  { value: "waiver", label: "إعفاء كامل" },
];

/** يبني جسم `POST /admin/users/{id}/discount` لطلب واحد غير مدفوع. */
export function buildOrderDiscountPayload({ contractId, type, value, reason }) {
  const payload = { contract_id: Number(contractId), type, reason: String(reason ?? "").trim() };
  if (type !== "waiver") {
    const n = Number(String(value ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    payload.value = Number.isFinite(n) ? n : null;
  }
  return payload;
}

function firstError(err) {
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  if (err?.response?.status === 403) return "ليست لديك صلاحية تطبيق خصم للعميل";
  return data?.message || "تعذّر تطبيق الخصم";
}

/**
 * خصم على هذا الطلب (غير المدفوع) — `POST /admin/users/{user}/discount`.
 * الخادم يحدّث المبلغ المستحق، يسجّل «تطبيق خصم» في سجل النشاط، ويُبلغ العميل
 * بإشعار `discount_applied` (بند 54). لا يظهر بعد الدفع (الاسترجاع بدلاً منه).
 */
export default function ApplyOrderDiscountForm({ orderData }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const orderId = orderData?.id;
  const userId = orderData?.user_id ?? orderData?.user?.id;

  const mutation = useMutation({
    mutationFn: async (payload) =>
      (await axiosInstance.post(`/admin/users/${userId}/discount`, payload))?.data,
    onSuccess: () => {
      toast.success("طُبّق الخصم وأُبلغ العميل");
      setOpen(false);
      setValue("");
      setReason("");
      setError("");
      invalidateOrdersCaches(queryClient, { orderId });
    },
    onError: (err) => setError(firstError(err)),
  });

  if (!orderId || !userId) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-line bg-white text-[13px] font-bold text-brand-deep hover:bg-brand-mint dark:bg-transparent dark:border-white/10 dark:text-emerald-300"
      >
        <BadgePercent className="size-4" />
        تطبيق خصم على هذا الطلب
      </button>
    );
  }

  const payload = buildOrderDiscountPayload({ contractId: orderId, type, value, reason });
  const invalid = payload.reason.length < 3 || (type !== "waiver" && !(payload.value > 0));

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-brand-line p-3 dark:border-white/10">
      <div role="radiogroup" aria-label="نوع الخصم" className="grid grid-cols-3 gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "h-9 rounded-lg border text-[12.5px] font-bold",
              type === t.value
                ? "border-brand-deep bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300"
                : "border-brand-line text-[#6B7570] dark:border-white/10 dark:text-white/60"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {type !== "waiver" ? (
        <input
          inputMode="decimal"
          aria-label={type === "percentage" ? "نسبة الخصم" : "مبلغ الخصم"}
          placeholder={type === "percentage" ? "مثال: 20 (%)" : "مثال: 50 (ر.س)"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 rounded-lg border border-brand-line bg-white px-3 text-[12.5px] dark:bg-white/[0.04] dark:border-white/10"
        />
      ) : null}
      <textarea
        rows={2}
        aria-label="سبب الخصم"
        placeholder="سبب الخصم (يُحفظ في سجل النشاط)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-lg border border-brand-line bg-white px-3 py-2 text-[12.5px] dark:bg-white/[0.04] dark:border-white/10"
      />
      {error ? <p role="alert" className="text-[12px] font-bold text-[#B42318]">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={invalid || mutation.isPending}
          onClick={async () => {
            const ok = await confirm({
              title: "تطبيق خصم على الطلب",
              description: "سيتغيّر المبلغ المستحق ويصل للعميل إشعار «تم تطبيق خصم على طلبك».",
              confirmLabel: "تطبيق",
            });
            if (ok) mutation.mutate(payload);
          }}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-deep text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <BadgePercent className="size-4" />} تطبيق الخصم
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-brand-line px-3 text-[12.5px] font-bold">
          إلغاء
        </button>
      </div>
    </div>
  );
}
