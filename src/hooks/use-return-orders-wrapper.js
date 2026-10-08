"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mapRealtimeTableOrder } from "@/components/realtime-orders/map-realtime-order";
import { ALL_ORDERS_QUERY_KEY } from "@/src/hooks/use-realtime-new-orders";
import { toast } from "sonner";
import { exportRefundContractsToExcel } from "@/components/orders/shared/orders-export";
import {
  buildRefundsLookup,
  ensureReturnOrderRefund,
  fetchAllRefundContracts,
  mapAnalyticsRefundContractToOrderRow,
} from "@/components/analysis/returned/refund-contract-utils";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { countReturnOrdersByApproval } from "@/components/orders/shared/return-orders-toolbar-kpis";
import { invalidateRefundCaches } from "@/src/lib/invalidate-orders-caches";
import { useAllOrdersWrapper } from "@/src/hooks/use-all-orders-wrapper";

const REFUNDS_LOOKUP_QUERY_KEY = "refundContractsLookup";

export function useReturnOrdersWrapper() {
  const queryClient = useQueryClient();
  const [successDialog, setSuccessDialog] = useState(null);

  const base = useAllOrdersWrapper({
    lockedFilter: "returned",
    exportFilename: "الطلبات-المسترجعة",
  });

  const { data: refundContracts = [], isLoading: refundsLoading } = useQuery({
    queryKey: [REFUNDS_LOOKUP_QUERY_KEY],
    queryFn: fetchAllRefundContracts,
    staleTime: 60_000,
  });

  // #19 (rows side): the table rows must be the refund requests themselves
  // (GET /admin/analytics/refunds/contracts), i.e. the SAME dataset the KPI
  // counters are computed from — not every order sitting in the generic
  // "return" contract status (which includes orders with no refund request).
  const refundRows = useMemo(
    () =>
      (Array.isArray(refundContracts) ? refundContracts : [])
        .map(mapAnalyticsRefundContractToOrderRow)
        .filter(Boolean)
        .map(mapRealtimeTableOrder),
    [refundContracts]
  );

  const filteredRefundRows = useMemo(() => {
    const term = String(base.searchQuery ?? "").trim().toLowerCase();
    const termDigits = term.replace(/\D/g, "");
    return refundRows.filter((row) => {
      if (base.contractType && row.contract_type_key && row.contract_type_key !== base.contractType) {
        return false;
      }
      if (
        base.extraStatusId != null &&
        base.extraStatusId !== "" &&
        String(row.contract_status_id ?? row.status?.id ?? "") !== String(base.extraStatusId)
      ) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        row.uuid,
        row.draft_contract_number,
        row.customer_name,
        row.employee_name,
        row.raw?.reference_number,
      ]
        .filter((value) => value != null && value !== "")
        .map((value) => String(value).toLowerCase());
      if (haystack.some((value) => value.includes(term))) return true;
      if (termDigits) {
        const mobiles = [row.user_mobile, formatSaudiMobileDisplay(row.user_mobile)]
          .filter(Boolean)
          .map((value) => String(value).replace(/\D/g, ""));
        if (mobiles.some((value) => value.includes(termDigits))) return true;
      }
      return false;
    });
  }, [refundRows, base.searchQuery, base.contractType, base.extraStatusId]);

  const perPage = Math.max(1, Number(base.perPage) || 20);
  const lastPage = Math.max(1, Math.ceil(filteredRefundRows.length / perPage));
  const currentPage = Math.min(Math.max(1, Number(base.currentPage) || 1), lastPage);

  const tableOrders = useMemo(
    () => filteredRefundRows.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredRefundRows, currentPage, perPage]
  );

  const pagination = useMemo(
    () => ({
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total: filteredRefundRows.length,
      from: filteredRefundRows.length ? (currentPage - 1) * perPage + 1 : 0,
      to: Math.min(currentPage * perPage, filteredRefundRows.length),
    }),
    [currentPage, lastPage, perPage, filteredRefundRows.length]
  );

  const refundsLookup = useMemo(
    () => buildRefundsLookup(refundContracts),
    [refundContracts]
  );

  // #19: KPI counters must derive from the SAME data source as the rows
  // (the full refund-contracts list that also builds refundsLookup), instead of
  // a separate page-1 summary endpoint that could disagree with the rows shown.
  const kpiCounts = useMemo(() => {
    if (!Array.isArray(refundContracts) || refundContracts.length === 0) {
      return null;
    }
    return countReturnOrdersByApproval(refundContracts);
  }, [refundContracts]);

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Export exactly what the page lists (all filtered refund requests, every page).
      const enriched = filteredRefundRows
        .map((row) => ensureReturnOrderRefund(row, refundsLookup))
        .filter(Boolean);
      const exported = await exportRefundContractsToExcel(enriched, {
        filename: "الطلبات-المسترجعة",
      });
      if (exported) toast.success(`تم تصدير ${enriched.length} سجل بنجاح`);
      else toast.error("لا توجد بيانات للتصدير");
    } catch (error) {
      toast.error(error?.message ? `تعذر تصدير البيانات: ${error.message}` : "تعذر تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  const invalidateAfterSuccess = () => {
    invalidateRefundCaches(queryClient, { queryKey: [ALL_ORDERS_QUERY_KEY] });
  };

  const handleSuccessDialogClose = (open) => {
    if (open) return;
    setSuccessDialog(null);
    invalidateAfterSuccess();
  };

  return {
    ...base,
    tableOrders,
    pagination,
    tableLoading: refundsLoading,
    currentPage,
    handleExport,
    isExporting,
    refundsLookup,
    refundItems: refundContracts,
    kpiCounts,
    successDialog,
    setSuccessDialog,
    handleSuccessDialogClose,
  };
}
