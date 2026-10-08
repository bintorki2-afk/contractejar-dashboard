"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";

export const ORDERS_ATTENTION_QUERY_KEY = "orders-attention";
export const ATTENTION_BUCKETS = ["awaiting_receive", "awaiting_draft", "awaiting_notarize", "delayed"];

const EMPTY = {
  counts: { awaiting_receive: 0, awaiting_draft: 0, awaiting_notarize: 0, delayed: 0 },
  awaiting_receive: [],
  awaiting_draft: [],
  awaiting_notarize: [],
  delayed: [],
  rules: [],
  generated_at: null,
};

export async function fetchOrdersAttention(limit = 50) {
  const res = await axiosInstance.get("/admin/orders/attention", { params: { limit } });
  const data = res?.data?.data ?? {};
  return { ...EMPTY, ...data, counts: { ...EMPTY.counts, ...(data.counts ?? {}) } };
}

/**
 * لوحة «عليك الحين» — GET /admin/orders/attention (تُحسب حيّاً في الخادم):
 * بانتظار الاستلام (مدفوع) / بانتظار المسودة / بانتظار التوثيق / متأخرة. القوائم مرتبة الأقدم أولاً.
 */
export function useOrdersAttention({ enabled = true, limit = 50, refetchInterval = 30_000 } = {}) {
  const query = useQuery({
    queryKey: [ORDERS_ATTENTION_QUERY_KEY, limit],
    queryFn: () => fetchOrdersAttention(limit),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
  return {
    data: query.data ?? EMPTY,
    counts: query.data?.counts ?? EMPTY.counts,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

/** يحوّل عنصر لوحة الانتباه إلى شكل صف الطلب الذي تستخدمه البطاقات. */
export function attentionItemToOrderRow(item = {}) {
  const typeKey = item.contract_type;
  return {
    ...item,
    contract_type_key: typeKey,
    contract_type: typeKey === "commercial" ? "تجاري" : typeKey === "housing" ? "سكني" : typeKey || "",
    status_key: item.status,
    status_name: item.status_label,
    user_name: item.customer_name?.trim() || "",
    user_mobile: item.customer_mobile,
    updated_at: item.since ?? item.paid_at,
    waiting_minutes: item.age_minutes,
  };
}
