"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Ban, CheckCircle2, Undo2 } from "lucide-react";
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
import { getAllOrdersExtraFilterStatuses } from "@/src/lib/contract-statuses";

const COMPLETION_FILTERS = ["authenticated", "incomplete"];
const STATUS_PILLS = ["canceled", "returned"];
const DEFAULT_PER_PAGE = 20;

export const ALL_ORDERS_FILTER_PILLS = [
  { id: "authenticated", label: "موثق", Icon: CheckCircle2 },
  { id: "canceled", label: "ملغي", Icon: Ban },
  { id: "returned", label: "مسترجع", Icon: Undo2 },
  { id: "incomplete", label: "طلب غير مكتمل", Icon: AlertCircle },
];

const PILL_PERMISSIONS = {
  authenticated: PERMISSION_SECTIONS.request_classification,
  canceled: PERMISSION_SECTIONS.request_classification,
  returned: PERMISSION_SECTIONS.returned_request,
  incomplete: PERMISSION_SECTIONS.incomplete_request,
};

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
  const canReturn =
    isAdmin ||
    can(PERMISSION_SECTIONS.returned_request, "create") ||
    can(PERMISSION_SECTIONS.returned_request, "edit");

  const visiblePills = ALL_ORDERS_FILTER_PILLS.filter((pill) => {
    if (lockedFilter && STATUS_PILLS.includes(pill.id)) return false;
    const section = PILL_PERMISSIONS[pill.id];
    if (!section) return true;
    return isAdmin || can(section, "view");
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState(() =>
    lockedFilter ? [lockedFilter] : []
  );
  const [extraStatusId, setExtraStatusId] = useState(null);
  const [contractType, setContractType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [statusFieldsOpen, setStatusFieldsOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [manageStatusesOpen, setManageStatusesOpen] = useState(false);

  const {
    activeItems: statusItems,
    returnedStatusId,
    canceledStatusId,
  } = useContractStatuses();

  const extraStatuses = useMemo(
    () => (lockedFilter ? [] : getAllOrdersExtraFilterStatuses(statusItems)),
    [statusItems, lockedFilter]
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Any list-param change sends the user back to the first page.
  const pageResetKey = JSON.stringify([
    debouncedSearch,
    activeFilters,
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
    const hasAuthenticated = activeFilters.includes("authenticated");
    const hasIncomplete = activeFilters.includes("incomplete");
    const hasReturned = activeFilters.includes("returned");
    const hasCanceled = activeFilters.includes("canceled");
    const hasExtraStatus = extraStatusId != null && extraStatusId !== "";

    return buildAdminOrdersParams({
      page: currentPage,
      perPage,
      search: debouncedSearch,
      isCompleted: hasAuthenticated ? 1 : hasIncomplete ? 0 : undefined,
      statusId: hasExtraStatus
        ? extraStatusId
        : hasCanceled
          ? canceledStatusId
          : hasReturned
            ? returnedStatusId
            : undefined,
      contractType: contractType || undefined,
    });
  }, [
    activeFilters,
    canceledStatusId,
    contractType,
    currentPage,
    debouncedSearch,
    extraStatusId,
    perPage,
    returnedStatusId,
  ]);

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

  const handleToggleFilter = (id) => {
    if (lockedFilter && STATUS_PILLS.includes(id)) return;
    setActiveFilters((prev) => {
      const isOn = prev.includes(id);
      if (isOn) return prev.filter((item) => item !== id);

      if (STATUS_PILLS.includes(id)) setExtraStatusId(null);

      let next = prev;
      if (COMPLETION_FILTERS.includes(id)) {
        next = next.filter((item) => !COMPLETION_FILTERS.includes(item));
      }
      if (STATUS_PILLS.includes(id)) {
        next = next.filter((item) => !STATUS_PILLS.includes(item));
      }
      return [...next, id];
    });
  };

  const handleExtraStatusChange = (statusId) => {
    if (lockedFilter) return;
    setExtraStatusId(statusId);
    if (statusId != null) {
      setActiveFilters((prev) =>
        prev.filter((item) => !STATUS_PILLS.includes(item))
      );
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
    visiblePills,
    searchQuery,
    setSearchQuery,
    activeFilters,
    extraStatusId,
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
    extraStatuses,
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
    handleToggleFilter,
    handleExtraStatusChange,
    handleExport,
    isExporting,
    exportParams,
    listParams,
    // delete-order flow
    canDelete: deleteFlow.canDelete,
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
