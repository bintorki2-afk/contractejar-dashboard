"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";

export const ORDER_STAGES_QUERY_KEY = "order-stages";
export const STAGE_KEYS = ["received", "draft_sent", "notarized"];

export const STAGE_LABELS = {
  received: "استلمت",
  draft_sent: "أرسلت المسودة",
  notarized: "وثّقت",
};

/** GET /admin/orders/{id}/stages — المرحلة الحالية والتالية وحقولها المطلوبة. */
export function useOrderStages(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: [ORDER_STAGES_QUERY_KEY, String(orderId)],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/orders/${orderId}/stages`);
      return res?.data?.data ?? null;
    },
    enabled: enabled && orderId != null && orderId !== "",
    staleTime: 5_000,
  });
}

/** أول رسالة خطأ من استجابة 422 للخادم ({message, errors}). */
export function stageErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return data?.message || "تعذّر تنفيذ الخطوة";
}

/** يفتح واتساب برسالة القالب المُعادة من الخادم؛ إن منع المتصفح النافذة نعرض زراً في التنبيه. */
export function openStageWhatsApp(whatsapp) {
  const url = whatsapp?.url;
  if (!url || typeof window === "undefined") return false;
  // بدون "noopener" في الميزات: window.open يرجع null دائماً معها فيظهر تنبيه «النافذة محجوبة» خطأً.
  const win = window.open(url, "_blank");
  if (win) {
    try {
      win.opener = null;
    } catch {
      // ignore
    }
  } else {
    toast("افتح واتساب لإرسال الرسالة للعميل", {
      action: { label: "فتح واتساب", onClick: () => window.open(url, "_blank", "noopener,noreferrer") },
      duration: 15000,
    });
  }
  return true;
}

/**
 * POST /admin/orders/{id}/stage/{received|draft_sent|notarized}
 * يرجع { stage, next_stage, next_stage_label, whatsapp:{url,message}, contract, notifications_sent }.
 * variables: { orderId, stage, body?, openWhatsApp? (افتراضي true) }
 */
export function useRunOrderStage({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, stage, body = {} }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/stage/${stage}`, body);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateOrdersCaches(queryClient, { orderId: vars.orderId });
      queryClient.invalidateQueries({ queryKey: [ORDER_STAGES_QUERY_KEY, String(vars.orderId)] });
      queryClient.invalidateQueries({ queryKey: ["single-order", String(vars.orderId)] });
      queryClient.invalidateQueries({ queryKey: ["single-order", vars.orderId] });
      if (vars.openWhatsApp !== false && data?.whatsapp?.url) openStageWhatsApp(data.whatsapp);
      const next = data?.next_stage_label;
      toast.success(
        `تم: ${data?.stage_label ?? STAGE_LABELS[vars.stage] ?? "الخطوة"}`,
        next ? { description: `الخطوة التالية: ${next}` } : undefined
      );
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(stageErrorMessage(error));
      onError?.(error, vars);
    },
  });
}
