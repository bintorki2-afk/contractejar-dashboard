"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { ORDER_STAGES_QUERY_KEY, openStageWhatsApp, stageErrorMessage } from "@/src/hooks/use-order-stage";

export const DATA_REQUEST_CATALOGUE_KEY = "data-requests-catalogue";
export const ORDER_DATA_REQUESTS_KEY = "order-data-requests";

/** GET /admin/data-requests/catalogue → {sections:[{key,label,items:[{key,label,step,fields[]}]}], reminder_after_hours, owner_alert_after_hours} */
export function useDataRequestCatalogue({ enabled = true } = {}) {
  return useQuery({
    queryKey: [DATA_REQUEST_CATALOGUE_KEY],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/data-requests/catalogue");
      return res?.data?.data ?? { sections: [] };
    },
    enabled,
    staleTime: 10 * 60_000,
  });
}

/** GET /admin/orders/{id}/data-requests → {items[], pending[], data_request_pending} */
export function useOrderDataRequests(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: [ORDER_DATA_REQUESTS_KEY, String(orderId)],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/orders/${orderId}/data-requests`);
      return res?.data?.data ?? { items: [], pending: [], data_request_pending: null };
    },
    enabled: enabled && orderId != null && orderId !== "",
    staleTime: 10_000,
  });
}

function invalidateDataRequestCaches(queryClient, orderId) {
  invalidateOrdersCaches(queryClient, { orderId });
  queryClient.invalidateQueries({ queryKey: [ORDER_DATA_REQUESTS_KEY, String(orderId)] });
  queryClient.invalidateQueries({ queryKey: [ORDER_STAGES_QUERY_KEY, String(orderId)] });
  queryClient.invalidateQueries({ queryKey: ["single-order", String(orderId)] });
  queryClient.invalidateQueries({ queryKey: ["single-order", orderId] });
  queryClient.invalidateQueries({ queryKey: ["orders-attention"] });
}

/**
 * POST /admin/orders/{id}/data-requests {section, items, note?} → {request, whatsapp_url, message, phone}
 * يسجّل الطلب في الخادم (نشاط + إشعار data_missing للعميل) ثم يفتح واتساب بالرسالة الجاهزة.
 */
export function useCreateDataRequest({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, section, items, note }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/data-requests`, { section, items, note: note || undefined });
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateDataRequestCaches(queryClient, vars.orderId);
      if (vars.openWhatsApp !== false && data?.whatsapp_url) openStageWhatsApp({ url: data.whatsapp_url, message: data.message });
      toast.success("سُجّل طلب المرفق الناقص وأُبلغ العميل", { description: "ستظهر شارة «بانتظار العميل» حتى يرسل المطلوب." });
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(stageErrorMessage(error));
      onError?.(error, vars);
    },
  });
}

/** POST …/data-requests/{rid}/remind → {request, whatsapp_url, message} (يحدّث reminded_at ويعيد دفع الإشعار). */
export function useRemindDataRequest({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, requestId }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/data-requests/${requestId}/remind`);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateDataRequestCaches(queryClient, vars.orderId);
      if (vars.openWhatsApp !== false && data?.whatsapp_url) openStageWhatsApp({ url: data.whatsapp_url, message: data.message });
      toast.success("أُرسل التذكير للعميل");
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(stageErrorMessage(error));
      onError?.(error, vars);
    },
  });
}

/** POST …/data-requests/{rid}/resolve {note?} — «تم الحل يدوياً». */
export function useResolveDataRequest({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, requestId, note }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/data-requests/${requestId}/resolve`, { note: note || undefined });
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateDataRequestCaches(queryClient, vars.orderId);
      toast.success("أُغلق طلب المرفق — تم الحل");
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(stageErrorMessage(error));
      onError?.(error, vars);
    },
  });
}

/** POST …/data-requests/{rid}/cancel. */
export function useCancelDataRequest({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, requestId }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/data-requests/${requestId}/cancel`);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateDataRequestCaches(queryClient, vars.orderId);
      toast.success("أُلغي طلب المرفق");
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(stageErrorMessage(error));
      onError?.(error, vars);
    },
  });
}
