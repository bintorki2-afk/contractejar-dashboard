"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";

export const NOTIFICATION_DISPATCHES_API = "/admin/notification-dispatches";
export const NOTIFICATION_DISPATCHES_QUERY_KEY = "notification-dispatches";

/** GET /admin/notification-dispatches?kind=&date=&page= — سجل إرسال إشعارات العملاء (ف8). */
export function useNotificationDispatches({ kind, date, page = 1, perPage = 25 } = {}) {
  const params = { page, per_page: perPage };
  if (kind) params.kind = kind;
  if (date) params.date = date;

  const query = useQuery({
    queryKey: [NOTIFICATION_DISPATCHES_QUERY_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get(NOTIFICATION_DISPATCHES_API, { params });
      const payload = res?.data?.data ?? {};
      const pagination = payload.pagination ?? {};
      return {
        items: Array.isArray(payload.items) ? payload.items : [],
        kinds: Array.isArray(payload.kinds) ? payload.kinds : [],
        lastRun: payload.last_run ?? null,
        currentPage: pagination.current_page ?? 1,
        lastPage: pagination.last_page ?? 1,
        total: pagination.total ?? 0,
      };
    },
    placeholderData: keepPreviousData,
  });

  return {
    items: query.data?.items ?? [],
    kinds: query.data?.kinds ?? [],
    lastRun: query.data?.lastRun ?? null,
    currentPage: query.data?.currentPage ?? 1,
    lastPage: query.data?.lastPage ?? 1,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
