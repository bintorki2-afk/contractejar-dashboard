"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { normalizeAdminSearch } from "@/src/lib/search-term";
import { sortStatusTabs } from "@/src/lib/order-status-keys";

export const ORDER_STATUS_COUNTS_QUERY_KEY = "orders-status-counts";

/**
 * عدّادات تبويبات «جميع الطلبات» من `GET /admin/orders/status-counts`
 * (نفس فلاتر القائمة: بحث، نوع العقد، العميل) — نفس النطاق الذي تستخدمه القائمة.
 */
export function useOrderStatusCounts({ search, contractType, userId, enabled = true } = {}) {
  const params = {};
  const term = normalizeAdminSearch(search);
  if (term) params.search = term;
  if (contractType) params.contract_type = contractType;
  if (userId != null && userId !== "") params.user_id = userId;

  const query = useQuery({
    queryKey: [ORDER_STATUS_COUNTS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/orders/status-counts", { params });
      return res?.data?.data ?? null;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const data = query.data ?? null;
  return {
    data,
    tabs: sortStatusTabs(data?.tabs ?? []),
    byKey: data?.by_key ?? {},
    total: data?.all ?? null,
    paid: data?.paid ?? null,
    unpaid: data?.unpaid ?? null,
    incomplete: data?.incomplete ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
