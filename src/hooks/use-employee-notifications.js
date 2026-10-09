"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { markReadLocally, normalizeEmployeeNotifications } from "@/src/lib/employee-notifications";

export const EMPLOYEE_NOTIFICATIONS_API = "/admin/employee-notifications";
export const EMPLOYEE_NOTIFICATIONS_QUERY_KEY = "employee-notifications";
export const EMPLOYEE_NOTIFICATIONS_POLL_MS = 60_000;

const EMPTY = { items: [], unreadCount: 0, currentPage: 1, lastPage: 1, total: 0 };

export async function fetchEmployeeNotifications({ unreadOnly = false, perPage = 20, page = 1 } = {}) {
  const params = { per_page: perPage, page };
  if (unreadOnly) params.unread = 1;
  const res = await axiosInstance.get(EMPLOYEE_NOTIFICATIONS_API, { params });
  return normalizeEmployeeNotifications(res?.data?.data ?? {});
}

/**
 * دفعة هـ (D-1): إشعارات الموظف (ردّ العميل على طلب مرفق، دفع رسوم/فرق) — تُستطلع كل 60 ثانية.
 * نقرأ الكل (مقروء وغير مقروء) حتى تبقى القائمة مفيدة بعد «قراءة الكل»؛ unread_count من الخادم.
 */
export function useEmployeeNotifications({ enabled = true, perPage = 20, refetchInterval = EMPLOYEE_NOTIFICATIONS_POLL_MS } = {}) {
  const query = useQuery({
    queryKey: [EMPLOYEE_NOTIFICATIONS_QUERY_KEY, { perPage }],
    queryFn: () => fetchEmployeeNotifications({ perPage }),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: 1,
  });
  return {
    data: query.data ?? EMPTY,
    items: query.data?.items ?? EMPTY.items,
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

function patchCache(queryClient, id) {
  queryClient.setQueriesData({ queryKey: [EMPLOYEE_NOTIFICATIONS_QUERY_KEY] }, (old) => markReadLocally(old, id));
}

/** POST /admin/employee-notifications/{id}/read — تحديث متفائل ثم إعادة جلب. */
export function useMarkEmployeeNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.post(`${EMPLOYEE_NOTIFICATIONS_API}/${id}/read`);
      return res?.data?.data ?? null;
    },
    onMutate: (id) => patchCache(queryClient, id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [EMPLOYEE_NOTIFICATIONS_QUERY_KEY] }),
  });
}

/** POST /admin/employee-notifications/read-all */
export function useMarkAllEmployeeNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`${EMPLOYEE_NOTIFICATIONS_API}/read-all`);
      return res?.data?.data ?? null;
    },
    onMutate: () => patchCache(queryClient, null),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [EMPLOYEE_NOTIFICATIONS_QUERY_KEY] }),
  });
}
