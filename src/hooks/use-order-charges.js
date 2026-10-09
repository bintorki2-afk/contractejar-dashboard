"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { invalidatePaymentCaches, apiErrorMessage } from "@/src/hooks/use-bank-transfer";

export const ORDER_CHARGES_KEY = "order-charges";

/** GET /admin/orders/{id}/charges → {items[], payment_state} */
export function useOrderCharges(orderId, { enabled = true } = {}) {
  return useQuery({
    queryKey: [ORDER_CHARGES_KEY, String(orderId)],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/orders/${orderId}/charges`);
      return res?.data?.data ?? { items: [] };
    },
    enabled: enabled && orderId != null && orderId !== "",
    staleTime: 10_000,
  });
}

/** POST /admin/orders/{id}/charges {amount, message, internal_reason?} — صلاحية payments.add_fee. */
export function useAddCharge({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, amount, message, internal_reason }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/charges`, { amount, message, internal_reason: internal_reason || undefined });
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidatePaymentCaches(queryClient, vars.orderId);
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(apiErrorMessage(error, "تعذّر إضافة الرسوم"));
      onError?.(error, vars);
    },
  });
}

/** POST …/charges/{cid}/payment-link → {payment_url, whatsapp_url, message, phone, charge, test_mode}. */
export function useChargePaymentLink({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, chargeId }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/charges/${chargeId}/payment-link`);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidatePaymentCaches(queryClient, vars.orderId);
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(error?.response?.data?.gateway_error || apiErrorMessage(error, "تعذّر إنشاء رابط الدفع"));
      onError?.(error, vars);
    },
  });
}

/** POST …/charges/{cid}/cancel. */
export function useCancelCharge({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, chargeId }) => {
      const res = await axiosInstance.post(`/admin/orders/${orderId}/charges/${chargeId}/cancel`);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidatePaymentCaches(queryClient, vars.orderId);
      toast.success("أُلغيت الرسوم");
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      toast.error(apiErrorMessage(error, "تعذّر إلغاء الرسوم"));
      onError?.(error, vars);
    },
  });
}
