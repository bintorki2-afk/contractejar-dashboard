"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mapRealtimeTableOrder } from "@/components/realtime-orders/map-realtime-order";
import {
  getStatusCaseFields,
  statusRequiresExtraFields,
} from "@/components/realtime-orders/change-order-status-fields-dialog";
import {
  getReturnRequestExistsMessage,
  hasReturnRequest,
  isOrderUnpaidForReturn,
  RETURN_REQUEST_UNPAID_MESSAGE,
  isReturnContractStatus,
  normalizeOrderForReturnRequest,
} from "@/components/analysis/returned/refund-contract-utils";
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close";
import {
  exportOrdersToExcel,
  extractStandardOrderPage,
} from "@/components/orders/shared/orders-export";
import { usePaginatedExport } from "@/components/orders/shared/use-paginated-export";
import { printOrderContract } from "@/components/orders/single-order/print-contract";
import { useBatchPrintContracts } from "@/src/hooks/use-batch-print-contracts";
import { useIsDark } from "@/src/hooks/use-theme-mode";
import { useContractStatuses } from "@/src/hooks/use-contract-statuses";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  ALL_ORDERS_QUERY_KEY,
  buildAdminOrdersParams,
  buildAdminOrdersUrl,
  useRealtimeOrdersList,
} from "@/src/hooks/use-realtime-new-orders";
import { axiosInstance } from "@/src/utils/axios";
import { useChangeOrderStatus } from "@/src/hooks/use-change-order-status";
import { useDeleteOrderFlow } from "@/src/hooks/use-delete-order-flow";
import { tabToOrderListParams } from "@/src/lib/order-status-keys";
import { useOrderStatusCounts } from "@/src/hooks/use-order-status-counts";

const DEFAULT_PER_PAGE = 20;

/** فلتر الدفع (مستقل عن تبويب الحالة): الكل / مدفوع / غير مدفوع. */
export const PAYMENT_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "paid", label: "مدفوع" },
  { id: "unpaid", label: "غير مدفوع" },
];

const VALID_TABS_RE = /^[a-z_]+$/;

function readInitialTab(lockedFilter) {
  if (lockedFilter === "returned") return "refunded";
  if (typeof window === "undefined") return "all";
  try {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab && VALID_TABS_RE.test(tab) ? tab : "all";
  } catch {
    return "all";
  }
}

export function useAllOrdersWrapper({
  lockedFilter = null,
  exportFilename = "جميع-الطلبات",
} = {}) {
  const router = useRouter();
  const isDark = useIsDark();
  const { can, isAdmin } = usePermissions();

  const canChangeStatus =
    isAdmin ||
    can(PERMISSION_SECTIONS.request_classification, "edit") ||
    can(PERMISSION_SECTIONS.all_requests, "edit");
  const canAddStatus =
    isAdmin || can(PERMISSION_SECTIONS.contract_statuses, "create");
  const canEditStatus =
    isAdmin || can(PERMISSION_SECTIONS.contract_statuses, "edit");
  const canManageStatuses = canAddStatus || canEditStatus;
  const canExport =
    isAdmin ||
    can(PERMISSION_SECTIONS.all_requests, "view") ||
    can(PERMISSION_SECTIONS.completed_request, "view") ||
    can(PERMISSION_SECTIONS.incomplete_request, "view") ||
    can(PERMISSION_SECTIONS.request_classification, "view") ||
    can(PERMISSION_SECTIONS.returned_request, "view");
  // د18: أزرار المراحل في الصف = صلاحية «استلمت» في الخادم (all_requests.edit).
  const canStage = isAdmin || can(PERMISSION_SECTIONS.all_requests, "edit");
  const canReturn =
    isAdmin ||
    can(PERMISSION_SECTIONS.returned_request, "create") ||
    can(PERMISSION_SECTIONS.returned_request, "edit");

  const { activeItems: statusItems } = useContractStatuses();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // دفعة د (D1): الافتراضي = جميع الحالات. التبويب يُحفظ في الرابط (?tab=) ليُشارك ويُستعاد.
  const [tab, setTabState] = useState(() => readInitialTab(lockedFilter));
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [contractType, setContractType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [statusFieldsOpen, setStatusFieldsOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [manageStatusesOpen, setManageStatusesOpen] = useState(false);

  const setTab = (next) => {
    if (lockedFilter) return;
    const value = next || "all";
    setTabState(value);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (value === "all") url.searchParams.delete("tab");
      else url.searchParams.set("tab", value);
      window.history.replaceState(window.history.state, "", url.toString());
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Any list-param change sends the user back to the first page.
  const pageResetKey = JSON.stringify([
    debouncedSearch,
    tab,
    paymentFilter,
    contractType,
    perPage,
  ]);
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setCurrentPage(1);
  }

  const statusCounts = useOrderStatusCounts({
    search: debouncedSearch,
    contractType: contractType || undefined,
    enabled: !lockedFilter,
  });
  const statusTabs = statusCounts.tabs;

  const listParams = useMemo(() => {
    const tabParams = tabToOrderListParams(tab);
    const isCompleted =
      paymentFilter === "paid" ? 1 : paymentFilter === "unpaid" ? 0 : undefined;
    // الخادم يتجاهل status_key عند إرسال فلتر الدفع (complete/incomplete) — نستخدم رقم الحالة
    // القادم من status-counts لنفس التبويب في هذه الحالة فقط (مسجّل في issues-for-backend).
    const tabStatusId =
      isCompleted !== undefined && tabParams.status_key
        ? statusTabs.find((t) => t.key === tab)?.status_id ?? null
        : null;
    return buildAdminOrdersParams({
      page: currentPage,
      perPage,
      search: debouncedSearch,
      isCompleted: tabParams.tab === "incomplete" ? undefined : isCompleted,
      statusId: tabStatusId ?? undefined,
      statusKey: tabStatusId ? undefined : tabParams.status_key,
      tab: tabParams.tab,
      contractType: contractType || undefined,
    });
  }, [contractType, currentPage, debouncedSearch, paymentFilter, perPage, tab, statusTabs]);

  const {
    items: tableItems,
    pagination,
    isLoading: tableLoading,
  } = useRealtimeOrdersList({
    params: listParams,
    queryKey: ALL_ORDERS_QUERY_KEY,
  });

  const tableOrders = useMemo(
    () => tableItems.map(mapRealtimeTableOrder),
    [tableItems]
  );

  const goToDetails = (row) => {
    router.push(`/home/orders/${row.id ?? row.uuid}`);
  };

  const {
    mutate: changeStatus,
    isPending: isChangingStatus,
    variables: changingStatusId,
  } = useChangeOrderStatus({
    queryKey: [ALL_ORDERS_QUERY_KEY],
    onSuccess: () => {
      setStatusFieldsOpen(false);
      setPendingStatusChange(null);
    },
  });

  const handleStatusChange = (row, status) => {
    const menuStatus = {
      id: status.id,
      name: status.name ?? status.label,
      label: status.label ?? status.name,
      color: status.color,
      status_case: status.status_case ?? null,
    };

    if (isReturnContractStatus(menuStatus)) {
      if (!canReturn) {
        toast.error("ليست لديك صلاحية طلب الاسترجاع");
        return;
      }
      const normalized = normalizeOrderForReturnRequest(row, row?.id);
      if (hasReturnRequest(normalized)) {
        toast.info(getReturnRequestExistsMessage(normalized));
        return;
      }
      if (isOrderUnpaidForReturn(normalized)) {
        toast.error(RETURN_REQUEST_UNPAID_MESSAGE);
        return;
      }
      setReturnOrder(normalized);
      openDialogAfterMenuClose(() => setReturnDialogOpen(true));
      return;
    }

    if (statusRequiresExtraFields(menuStatus)) {
      setPendingStatusChange({ order: row, status: menuStatus });
      openDialogAfterMenuClose(() => setStatusFieldsOpen(true));
      return;
    }

    changeStatus({ orderId: row.id, statusId: status.id });
  };

  const deleteFlow = useDeleteOrderFlow({ queryKey: [ALL_ORDERS_QUERY_KEY] });

  const { isBatchPrinting, batchPrint: handleBatchPrint } =
    useBatchPrintContracts();

  const handlePrint = async (row) => {
    if (!row?.id) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    try {
      const res = await axiosInstance.get(`/admin/orders/${row.id}`);
      const orderData = res?.data?.data ?? res?.data;
      const opened = printOrderContract(orderData);
      if (!opened) toast.error("تعذر فتح نافذة الطباعة");
    } catch (error) {
      toast.error(error?.response?.data?.message || "تعذر تحميل بيانات الطباعة");
    }
  };

  const exportParams = useMemo(() => {
    const params = { ...listParams };
    delete params.page;
    delete params.per_page;
    return params;
  }, [listParams]);

  const { handleExport, isExporting } = usePaginatedExport({
    buildUrl: (page) => buildAdminOrdersUrl({ ...exportParams, page }),
    extractPage: extractStandardOrderPage,
    onExport: (rows) =>
      exportOrdersToExcel(rows, {
        filename: exportFilename,
        showStatusColumn: true,
      }),
  });

  return {
    router,
    isDark,
    canChangeStatus,
    canAddStatus,
    canEditStatus,
    canManageStatuses,
    canExport,
    canReturn,
    canStage,
    searchQuery,
    setSearchQuery,
    tab,
    setTab,
    paymentFilter,
    setPaymentFilter,
    statusTabs,
    statusTabsLoading: statusCounts.isLoading,
    refetchStatusCounts: statusCounts.refetch,
    contractType,
    setContractType,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    returnDialogOpen,
    setReturnDialogOpen,
    returnOrder,
    paymentLinkOpen,
    setPaymentLinkOpen,
    statusFieldsOpen,
    setStatusFieldsOpen,
    pendingStatusChange,
    setPendingStatusChange,
    manageStatusesOpen,
    setManageStatusesOpen,
    statusItems,
    tableOrders,
    pagination,
    tableLoading,
    goToDetails,
    changeStatus,
    isChangingStatus,
    changingStatusId,
    handleStatusChange,
    handlePrint,
    handleBatchPrint,
    isBatchPrinting,
    handleExport,
    isExporting,
    exportParams,
    listParams,
    // delete-order flow
    canDelete: deleteFlow.canDelete,
    deleteForce: deleteFlow.deleteForce,
    setDeleteForce: deleteFlow.setDeleteForce,
    canForceDelete: deleteFlow.canForceDelete,
    deleteLabel: deleteFlow.deleteLabel,
    deleteCount: deleteFlow.deleteCount,
    deleteDialogOpen: deleteFlow.deleteDialogOpen,
    setDeleteDialogOpen: deleteFlow.setDeleteDialogOpen,
    isDeletingOrder: deleteFlow.isDeletingOrder,
    requestDeleteOrder: deleteFlow.requestDeleteOrder,
    requestBulkDelete: deleteFlow.requestBulkDelete,
    confirmDeleteOrder: deleteFlow.confirmDeleteOrder,
  };
}
