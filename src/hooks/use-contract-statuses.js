"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import {
  CONTRACT_STATUSES_ACTIVE_API,
  CONTRACT_STATUSES_ACTIVE_QUERY_KEY,
  CONTRACT_STATUSES_API,
  CONTRACT_STATUSES_QUERY_KEY,
  extractContractStatusItems,
  resolveCanceledContractStatusId,
  resolveNewContractStatusId,
  resolveReceivedContractStatusId,
  resolveReturnedContractStatusId,
} from "@/src/lib/contract-statuses";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

export function useContractStatuses({ enabled = true, activeOnly = true } = {}) {
  // QA DASH-20: لا نطلب الحالات (contract_statuses.view) لدور لا يملكها — كان يرجع 403 في الكونسول.
  const { can, isAdmin, isReady } = usePermissions();
  const allowed = isReady && (isAdmin || can(PERMISSION_SECTIONS.contract_statuses, "view"));
  const query = useQuery({
    queryKey: [
      activeOnly ? CONTRACT_STATUSES_ACTIVE_QUERY_KEY : CONTRACT_STATUSES_QUERY_KEY,
    ],
    queryFn: () =>
      axiosInstance(
        activeOnly ? CONTRACT_STATUSES_ACTIVE_API : CONTRACT_STATUSES_API
      ),
    enabled: enabled && allowed,
    staleTime: 60_000,
  });

  const items = useMemo(
    () => extractContractStatusItems(query.data),
    [query.data]
  );

  const activeItems = useMemo(
    () => items.filter((item) => item?.is_active !== false && item?.is_active !== 0),
    [items]
  );

  return {
    items,
    activeItems,
    newStatusId: resolveNewContractStatusId(items),
    receivedStatusId: resolveReceivedContractStatusId(items),
    returnedStatusId: resolveReturnedContractStatusId(items),
    canceledStatusId: resolveCanceledContractStatusId(items),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
