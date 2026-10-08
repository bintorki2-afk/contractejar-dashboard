"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mapRealtimeNewOrder, mapRealtimeTableOrder } from "@/components/realtime-orders/map-realtime-order";
import {
  getStatusCaseFields,
  statusRequiresExtraFields,
} from "@/components/realtime-orders/change-order-status-fields-dialog";
import { STATUS_FILTER_PILLS } from "@/components/realtime-orders/mock-data";
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
import { useIsDark } from "@/src/hooks/use-theme-mode";
import { useContractStatuses } from "@/src/hooks/use-contract-statuses";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  REALTIME_ORDERS_QUERY_KEY,
  buildAdminOrdersParams,
  buildAdminOrdersUrl,
  useRealtimeNewOrders,
  useRealtimeOrdersList,
} from "@/src/hooks/use-realtime-new-orders";
import { useChangeOrderStatus } from "@/src/hooks/use-change-order-status";
import { useDeleteOrderFlow } from "@/src/hooks/use-delete-order-flow";
import { getRealtimeStatusChipStatuses } from "@/src/lib/contract-statuses";
import { useReceiveContract } from "@/src/hooks/use-receive-contract";
import { useBatchPrintContracts } from "@/src/hooks/use-batch-print-contracts";

const SECTION_FILTERS = ["authenticated", "canceled", "returned", "incomplete"];
export const REALTIME_DEFAULT_PER_PAGE = 25;
export const REALTIME_PAGE_SIZE_OPTIONS = [25, 50, 100];

const PILL_PERMISSIONS = {
  authenticated: PERMISSION_SECTIONS.request_classification,
  canceled: PERMISSION_SECTIONS.request_classification,
  returned: PERMISSION_SECTIONS.returned_request,
  incomplete: PERMISSION_SECTIONS.incomplete_request,
};

export function useRealtimeOrdersWrapper() {
  const router = useRouter();
  const isDark = useIsDark();
  const { can, isAdmin } = usePermissions();

  const canViewReceivedQueue =
    isAdmin ||
    can(PERMISSION_SECTIONS.all_requests, "view") ||
    can(PERMISSION_SECTIONS.completed_request, "view");
  const canViewNewRequests = isAdmin || can(PERMISSION_SECTIONS.all_requests, "view");
  // يطابق الخادم: POST /admin/received-contracts يتطلب all_requests.edit فقط.
  const canReceive = isAdmin || can(PERMISSION_SECTIONS.all_requests, "edit");
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
  const canReturn =
    isAdmin ||
    can(PERMISSION_SECTIONS.returned_request, "create") ||
    can(PERMISSION_SECTIONS.returned_request, "edit");

  const {
    activeItems: statusItems,
    receivedStatusId,
    newStatusId,
    returnedStatusId,
    canceledStatusId,
  } = useContractStatuses();

  const visiblePills = STATUS_FILTER_PILLS.filter((pill) => {
    // لا توجد حالة «استرجاع» بالاسم → لا نعرض الفلتر (بدل الاحتياط بحالة أخرى).
    if (pill.id === "returned" && returnedStatusId == null) return false;
    const section = PILL_PERMISSIONS[pill.id];
    if (!section) return true;
    return isAdmin || can(section, "view");
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [extraStatusId, setExtraStatusId] = useState(null);
  const [contractType, setContractType] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedNew, setExpandedNew] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(REALTIME_DEFAULT_PER_PAGE);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [statusFieldsOpen, setStatusFieldsOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [manageStatusesOpen, setManageStatusesOpen] = useState(false);

  const activeFilters = activeSection ? [activeSection] : [];
  const inSectionMode = Boolean(activeSection);

  const statusChips = useMemo(
    () => getRealtimeStatusChipStatuses(statusItems, receivedStatusId),
    [statusItems, receivedStatusId]
  );

  const {
    items: newOrderItems,
    total: newOrdersTotal,
    summary: newOrdersSummary,
    isLoading: newOrdersLoading,
  } = useRealtimeNewOrders({
    statusId: newStatusId,
    autoRefresh,
    enabled: canViewNewRequests,
  });

  const newRequests = useMemo(
    () => newOrderItems.map(mapRealtimeNewOrder),
    [newOrderItems]
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Any list-param change sends the user back to the first page.
  const pageResetKey = JSON.stringify([
    debouncedSearch,
    activeSection,
    extraStatusId,
    contractType,
    perPage,
  ]);
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setCurrentPage(1);
  }

  const listParams = useMemo(() => {
    const hasAuthenticated = activeSection === "authenticated";
    const hasIncomplete = activeSection === "incomplete";
    const hasReturned = activeSection === "returned";
    const hasCanceled = activeSection === "canceled";
    const hasCompletionFilter = hasAuthenticated || hasIncomplete;

    const hasExtraStatus = extraStatusId != null && extraStatusId !== "";
    const statusId = hasExtraStatus
      ? extraStatusId
      : hasCanceled
        ? canceledStatusId
        : hasReturned
          ? returnedStatusId
          : hasCompletionFilter || !canViewReceivedQueue
            ? undefined
            : receivedStatusId;

    return buildAdminOrdersParams({
      page: currentPage,
      perPage,
      search: debouncedSearch,
      isCompleted: hasAuthenticated ? 1 : hasIncomplete ? 0 : undefined,
      statusId,
      contractType: contractType || undefined,
    });
  }, [
    activeSection,
    canceledStatusId,
    contractType,
    currentPage,
    debouncedSearch,
    extraStatusId,
    perPage,
    receivedStatusId,
    returnedStatusId,
    canViewReceivedQueue,
  ]);

  const {
    items: tableItems,
    pagination,
    isLoading: tableLoading,
  } = useRealtimeOrdersList({
    params: listParams,
    autoRefresh,
  });

  const tableOrders = useMemo(
    () => tableItems.map(mapRealtimeTableOrder),
    [tableItems]
  );

  const goToDetails = (row) => {
    router.push(
      `/home/orders/${row.id ?? row.uuid}?from=${encodeURIComponent("/home/realtime-orders")}`
    );
  };

  const { mutate: receiveOrder, isPending: isReceiving, variables: receivingOrder } =
    useReceiveContract();

  const { isBatchPrinting, batchPrint: handleBatchPrint } =
    useBatchPrintContracts();

  const deleteFlow = useDeleteOrderFlow({
    queryKey: [REALTIME_ORDERS_QUERY_KEY],
  });

  const {
    mutate: changeStatus,
    isPending: isChangingStatus,
    variables: changingStatusId,
  } = useChangeOrderStatus({
    queryKey: [REALTIME_ORDERS_QUERY_KEY],
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

  const handleToggleFilter = (id) => {
    if (!SECTION_FILTERS.includes(id)) return;
    setExtraStatusId(null);
    setSearchQuery("");
    setFiltersOpen(false);
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const handleCloseSection = () => {
    setActiveSection(null);
    setSearchQuery("");
  };

  const handleExtraStatusChange = (statusId) => {
    setExtraStatusId(statusId);
    if (statusId != null) {
      setActiveSection(null);
    }
  };

  const activeSectionMeta =
    STATUS_FILTER_PILLS.find((pill) => pill.id === activeSection) ?? null;
  const sectionCount = pagination?.total ?? tableOrders.length;
  const hasInlineFilters = extraStatusId != null || Boolean(contractType);

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
        filename: "الطلبات-مباشر",
        showStatusColumn: true,
      }),
  });

  return {
    isDark,
    canViewNewRequests,
    canReceive,
    canChangeStatus,
    canAddStatus,
    canEditStatus,
    canManageStatuses,
    canExport,
    visiblePills,
    searchQuery,
    setSearchQuery,
    activeFilters,
    activeSection,
    inSectionMode,
    extraStatusId,
    contractType,
    setContractType,
    filtersOpen,
    setFiltersOpen,
    expandedNew,
    setExpandedNew,
    autoRefresh,
    setAutoRefresh,
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
    statusChips,
    newRequests,
    newOrdersTotal,
    newOrdersSummary,
    newOrdersLoading,
    tableOrders,
    pagination,
    tableLoading,
    listParams,
    handleBatchPrint,
    isBatchPrinting,
    receiveOrder,
    isReceiving,
    receivingOrder,
    changeStatus,
    isChangingStatus,
    changingStatusId,
    goToDetails,
    handleStatusChange,
    handleToggleFilter,
    handleCloseSection,
    handleExtraStatusChange,
    handleExport,
    isExporting,
    activeSectionMeta,
    sectionCount,
    hasInlineFilters,
    getStatusCaseFields,
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
