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
  // 502 = رفض/تعذّر بوابة الدفع: رسالة الخادم عربية ومقصودة للموظف («تعذّر الاسترجاع من بوابة الدفع: …»)،
  // لكن معترض axios يستبدل رسائل 5xx بنص عام — نعرض الأصل هنا فقط.
  if (error?.response?.status === 502 && typeof data?.server_message === "string" && /بوابة الدفع|Moyasar/.test(data.server_message)) {
    return data.server_message;
  }
  return data?.message || "تعذّر تنفيذ الاسترجاع";
}

// دفعة هـ (D-2): منطق اختيار الدفعة في src/lib/refund-payment.js (قابل للاختبار بلا axios).
export { pickRefundablePayment, pickRefundPayment, refundableAmount } from "@/src/lib/refund-payment";

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
