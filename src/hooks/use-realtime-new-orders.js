"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { NEW_CONTRACT_STATUS_ID } from "@/src/lib/contract-statuses";
import { normalizeAdminSearch } from "@/src/lib/search-term";

export const REALTIME_NEW_ORDERS_QUERY_KEY = "realtime-new-orders";
export const REALTIME_ORDERS_QUERY_KEY = "realtime-orders";
export const ALL_ORDERS_QUERY_KEY = "all-orders";
export const ADMIN_ORDERS_API = "/admin/orders";

const DEFAULT_NEW_PER_PAGE = 100;
const MAX_PAGES = 5;
const DEFAULT_REFETCH_INTERVAL = 15_000;
const TABLE_PER_PAGE = 20;

export function extractOrdersPayload(response) {
  const body = response?.data ?? response;
  const payload = body?.data ?? body;
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data?.items)
      ? payload.data.items
      : [];
  const pagination = payload?.pagination ?? payload?.data?.pagination ?? null;
  const summary = payload?.summary ?? payload?.data?.summary ?? null;
  return { items, pagination, summary };
}

export function buildAdminOrdersParams({
  page = 1,
  perPage = TABLE_PER_PAGE,
  search,
  contractStatusId,
  statusId,
  isCompleted,
  isReceived,
  employeeId,
  contractType,
  userId,
} = {}) {
  const params = { page, per_page: perPage };
  const resolvedStatusId =
    statusId != null && statusId !== "" ? statusId : contractStatusId;

  const term = normalizeAdminSearch(search);
  if (term) params.search = term;
  if (resolvedStatusId != null && resolvedStatusId !== "") {
    params.status_id = resolvedStatusId;
  }
  if (isCompleted === 1 || isCompleted === "1") {
    params.complete = 1;
  } else if (isCompleted === 0 || isCompleted === "0") {
    params.incomplete = 1;
  }
  if (isReceived === true || isReceived === false || isReceived === "true" || isReceived === "false") {
    params.is_received = isReceived;
  }
  if (employeeId != null && employeeId !== "") {
    params.employee_id = employeeId;
  }
  if (contractType) params.contract_type = contractType;
  if (userId != null && userId !== "") params.user_id = userId;

  return params;
}

export function buildAdminOrdersUrl(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value == null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${ADMIN_ORDERS_API}?${qs}` : ADMIN_ORDERS_API;
}

async function fetchAdminOrders(params) {
  const response = await axiosInstance.get(ADMIN_ORDERS_API, { params });
  const { items, pagination, summary } = extractOrdersPayload(response);
  return {
    items,
    pagination,
    summary,
    total: pagination?.total ?? items.length,
  };
}

async function fetchOrdersByContractStatus(statusId, { perPage = DEFAULT_NEW_PER_PAGE } = {}) {
  const first = await fetchAdminOrders(
    buildAdminOrdersParams({
      page: 1,
      perPage,
      contractStatusId: statusId,
    })
  );
  const lastPage = Math.min(first.pagination?.last_page ?? 1, MAX_PAGES);

  if (lastPage <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      fetchAdminOrders(
        buildAdminOrdersParams({
          page: index + 2,
          perPage,
          contractStatusId: statusId,
        })
      )
    )
  );

  const allItems = [...first.items, ...rest.flatMap((page) => page.items)];
  return {
    items: allItems,
    pagination: first.pagination,
    summary: first.summary,
    total: first.pagination?.total ?? allItems.length,
  };
}

export function useRealtimeNewOrders({
  statusId = NEW_CONTRACT_STATUS_ID,
  enabled = true,
  autoRefresh = true,
  refetchInterval = DEFAULT_REFETCH_INTERVAL,
} = {}) {
  const query = useQuery({
    queryKey: [REALTIME_NEW_ORDERS_QUERY_KEY, statusId],
    queryFn: () => fetchOrdersByContractStatus(statusId),
    enabled: enabled && statusId != null && statusId !== "",
    refetchInterval: autoRefresh ? refetchInterval : false,
    refetchIntervalInBackground: Boolean(autoRefresh),
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];

  return {
    items,
    total: query.data?.total ?? items.length,
    pagination: query.data?.pagination,
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useRealtimeOrdersList({
  params,
  enabled = true,
  autoRefresh = false,
  refetchInterval = DEFAULT_REFETCH_INTERVAL,
  queryKey = REALTIME_ORDERS_QUERY_KEY,
} = {}) {
  const query = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => fetchAdminOrders(params),
    enabled,
    refetchInterval: autoRefresh ? refetchInterval : false,
    refetchIntervalInBackground: Boolean(autoRefresh),
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];

  return {
    items,
    total: query.data?.total ?? items.length,
    pagination: query.data?.pagination,
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
