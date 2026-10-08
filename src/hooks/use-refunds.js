"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { normalizeAdminSearch } from "@/src/lib/search-term";

export const REFUNDS_QUERY_KEY = "payments-refunds";

/** أول رسالة خطأ من 422/502 للاسترجاع. */
export function refundErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  if (error?.response?.status === 403) return "ليست لديك صلاحية استرجاع المدفوعات";
  return data?.message || "تعذّر تنفيذ الاسترجاع";
}

/** المبلغ القابل للاسترجاع في دفعة (من الخادم). */
export function refundableAmount(payment) {
  const n = Number(payment?.refundable_amount ?? (Number(payment?.amount ?? 0) - Number(payment?.refunded_amount ?? 0)));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

/** أول دفعة ناجحة قابلة للاسترجاع. */
export function pickRefundablePayment(payments = []) {
  return (Array.isArray(payments) ? payments : []).find(
    (p) => (p?.status === "success" || p?.status === "paid") && refundableAmount(p) > 0
  ) ?? null;
}

/**
 * POST /admin/payments/{payment}/refund — { amount? (ر.س، بدون = كامل المتبقي), reason }.
 * vars: { paymentId, orderId, amount?, reason }
 */
export function useRefundPayment({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, amount, reason }) => {
      const body = { reason: String(reason ?? "").trim() };
      if (amount != null && amount !== "") body.amount = Number(amount);
      const res = await axiosInstance.post(`/admin/payments/${paymentId}/refund`, body);
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidateOrdersCaches(queryClient, { orderId: vars.orderId });
      queryClient.invalidateQueries({ queryKey: [REFUNDS_QUERY_KEY] });
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => onError?.(error, vars),
  });
}

/** GET /admin/payments/refunds — صفحة «المرتجعات». */
export function useRefundsList({ page = 1, perPage = 20, status = "", search = "" } = {}) {
  const params = { page, per_page: perPage };
  if (status) params.status = status;
  const term = normalizeAdminSearch(search);
  if (term) params.search = term;
  const query = useQuery({
    queryKey: [REFUNDS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/payments/refunds", { params });
      return res?.data?.data ?? {};
    },
    placeholderData: keepPreviousData,
  });
  return {
    items: query.data?.items ?? [],
    summary: query.data?.summary ?? null,
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
