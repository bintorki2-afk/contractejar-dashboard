"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { REFUNDS_CONTRACTS_API } from "@/components/analysis/returned/refund-contract-utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

const POLL_INTERVAL = 60_000;

// Same dataset as the "طلبات الاسترجاع" page rows + KPI counters
// (GET /admin/analytics/refunds/contracts), so the sidebar badge, the KPI
// cards and the table can never disagree (#19).
const fetchReturnedOrdersTotal = async () => {
  const response = await axiosInstance.get(REFUNDS_CONTRACTS_API, {
    params: { created_at: "all", page: 1 },
  });
  const body = response?.data?.data ?? response?.data ?? {};
  const total = body?.pagination?.total;
  if (total != null) return Number(total) || 0;
  return Array.isArray(body?.contracts) ? body.contracts.length : 0;
};

// Polls the total number of refund requests for the sidebar badge.
export function useReturnedOrdersCount() {
  // QA DASH-20: المسار يتطلب analytics.view في الخادم — لا نستطلعه لدور لا يملكها (403 كل دقيقة).
  const { can, isAdmin, isReady } = usePermissions();
  const allowed = isReady && (isAdmin || can(PERMISSION_SECTIONS.analytics, "view"));
  const { data: total } = useQuery({
    queryKey: ["returnedOrdersTotal"],
    queryFn: fetchReturnedOrdersTotal,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 30_000,
    enabled: allowed,
  });

  return total ?? 0;
}
