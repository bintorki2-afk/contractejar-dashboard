"use client";

import { useEffect, useMemo } from "react";
import {
  ControllableDataTable,
  useTablePreferences,
} from "@/components/shared/controllable-table";
import { makeSelectionColumn } from "@/components/shared/table-selection-column";
import TableBatchActionsBar from "@/components/shared/table-batch-actions-bar";
import { useRowSelection } from "@/src/hooks/use-row-selection";
import RealtimeOrdersToolbar from "@/components/realtime-orders/realtime-orders-toolbar";
import AllOrdersPagination from "./all-orders-pagination";
import AllOrdersDialogs from "./all-orders-dialogs";
import { buildAllOrderColumns } from "./all-orders-columns";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { getStatusCaseFields } from "@/components/realtime-orders/change-order-status-fields-dialog";
import { ALL_ORDERS_QUERY_KEY } from "@/src/hooks/use-realtime-new-orders";
import { useAllOrdersWrapper } from "@/src/hooks/use-all-orders-wrapper";
import { isDraftOrderRow } from "@/src/lib/draft-contract-statuses";
import { cn } from "@/lib/utils";
import OrderStatusTabs from "./order-status-tabs";
import { PAYMENT_FILTERS } from "@/src/hooks/use-all-orders-wrapper";

function PaymentFilterChips({ value = "all", onChange }) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-bold" dir="rtl">
      <span className="text-[#6B7570] dark:text-white/50">الدفع:</span>
      <div className="inline-flex rounded-full border border-brand-line bg-white p-0.5 dark:bg-white/[0.04] dark:border-white/10">
        {PAYMENT_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={value === f.id}
            onClick={() => onChange?.(f.id)}
            className={cn(
              "h-7 px-3 rounded-full transition-colors",
              value === f.id
                ? "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300"
                : "text-[#4B5753] hover:text-brand-deep dark:text-white/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TABLE_STORAGE_KEY = "all-orders-table-prefs";

export default function AllOrdersWrapper() {
  const vm = useAllOrdersWrapper();
  const selection = useRowSelection();

  // Drop stale selections whenever the underlying query (page/filters/search) changes.
  const clearSelection = selection.clear;
  useEffect(() => {
    clearSelection();
  }, [vm.listParams, clearSelection]);

  const baseColumns = useMemo(
    () =>
      buildAllOrderColumns({
        dark: vm.isDark,
        onView: vm.goToDetails,
        onStatusChange: vm.handleStatusChange,
        onPrint: vm.handlePrint,
        onDelete: vm.requestDeleteOrder,
        statuses: vm.statusItems,
        changingOrderId: vm.isChangingStatus ? vm.changingStatusId?.orderId : null,
        canChangeStatus: vm.canChangeStatus,
        canAddStatus: vm.canAddStatus,
        canDelete: vm.canDelete,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      vm.isDark,
      vm.statusItems,
      vm.isChangingStatus,
      vm.changingStatusId,
      vm.canChangeStatus,
      vm.canAddStatus,
      vm.canDelete,
    ]
  );

  const columns = useMemo(
    () => [
      makeSelectionColumn({
        rows: vm.tableOrders,
        selectedIds: selection.selectedIds,
        onToggleRow: selection.toggle,
        onToggleAll: selection.toggleMany,
      }),
      ...baseColumns.map((col, index) =>
        index === 0 ? { ...col, sticky: undefined } : col
      ),
    ],
    [
      baseColumns,
      vm.tableOrders,
      selection.selectedIds,
      selection.toggle,
      selection.toggleMany,
    ]
  );

  const {
    density,
    setDensity,
    visibleColumns,
    toggleColumn,
    isColumnVisible,
  } = useTablePreferences({
    storageKey: TABLE_STORAGE_KEY,
    columns,
  });

  return (
    <div
      className="flex flex-col gap-4 min-h-full transition-colors -m-[45px] p-[45px] max-[1700px]:-m-[30px] max-[1700px]:p-[30px] bg-[#F4F6F5] dark:bg-[#0B1411]"
      dir="rtl"
    >
      <RealtimeOrdersToolbar
        title="جميع الطلبات"
        searchPlaceholder="بحث: رقم الطلب / الجوال / الاسم..."
        searchQuery={vm.searchQuery}
        onSearchChange={vm.setSearchQuery}
        filterPills={[]}
        extraStatuses={[]}
        contractType={vm.contractType}
        onContractTypeChange={vm.setContractType}
        columns={columns}
        density={density}
        onDensityChange={setDensity}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onExport={vm.handleExport}
        isExporting={vm.isExporting}
        canExport={vm.canExport}
        dark={vm.isDark}
        onOpenPaymentLink={() => vm.setPaymentLinkOpen(true)}
        canManageStatuses={vm.canManageStatuses}
        onManageStatuses={() => vm.setManageStatusesOpen(true)}
      />

      <div className="flex flex-col gap-3">
        <OrderStatusTabs
          tabs={vm.statusTabs}
          value={vm.tab}
          onChange={vm.setTab}
          isLoading={vm.statusTabsLoading}
        />
        <PaymentFilterChips value={vm.paymentFilter} onChange={vm.setPaymentFilter} />
      </div>

      <TableBatchActionsBar
        count={selection.selectedCount}
        onPrint={() => vm.handleBatchPrint(selection.selectedArray)}
        onDelete={
          vm.canDelete
            ? () => vm.requestBulkDelete(selection.selectedArray)
            : undefined
        }
        onClear={selection.clear}
        isPrinting={vm.isBatchPrinting}
        isDeleting={vm.isDeletingOrder}
        dark={vm.isDark}
      />

      <ControllableDataTable
        columns={columns}
        data={vm.tableOrders}
        density={density}
        isColumnVisible={isColumnVisible}
        isLoading={vm.tableLoading}
        emptyMessage="لا توجد طلبات مطابقة للبحث"
        onRowClick={vm.goToDetails}
        getRowHighlight={isDraftOrderRow}
        defaultSort={{ id: "receivedSince", direction: "asc" }}
      />

      <AllOrdersPagination
        pagination={vm.pagination}
        currentPage={vm.currentPage}
        onPageChange={vm.setCurrentPage}
        perPage={vm.perPage}
        onPerPageChange={vm.setPerPage}
        dark={vm.isDark}
      />

      <AllOrdersDialogs
        queryKey={[ALL_ORDERS_QUERY_KEY]}
        returnDialogOpen={vm.returnDialogOpen}
        onReturnDialogOpenChange={vm.setReturnDialogOpen}
        returnOrder={vm.returnOrder}
        paymentLinkOpen={vm.paymentLinkOpen}
        onPaymentLinkOpenChange={vm.setPaymentLinkOpen}
        statusFieldsOpen={vm.statusFieldsOpen}
        onStatusFieldsOpenChange={vm.setStatusFieldsOpen}
        pendingStatusChange={vm.pendingStatusChange}
        onPendingStatusChangeClear={() => vm.setPendingStatusChange(null)}
        isChangingStatus={vm.isChangingStatus}
        onStatusFieldsSubmit={(extraValues) => {
          if (!vm.pendingStatusChange) return;
          vm.changeStatus({
            orderId: vm.pendingStatusChange.order.id,
            statusId: vm.pendingStatusChange.status.id,
            extraValues,
            fields: getStatusCaseFields(vm.pendingStatusChange.status),
          });
        }}
        manageStatusesOpen={vm.manageStatusesOpen}
        onManageStatusesOpenChange={vm.setManageStatusesOpen}
        canAddStatus={vm.canAddStatus}
        canEditStatus={vm.canEditStatus}
      />

      <ConfirmDialog
        open={vm.deleteDialogOpen}
        onOpenChange={vm.setDeleteDialogOpen}
        title={vm.deleteCount > 1 ? "حذف الطلبات" : "حذف الطلب"}
        description={`سيتم حذف ${
          vm.deleteLabel ?? "الطلب"
        } نهائيًا مع جميع البيانات المرتبطة. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف نهائيًا"
        cancelLabel="إلغاء"
        destructive
        isPending={vm.isDeletingOrder}
        onConfirm={vm.confirmDeleteOrder}
      />
    </div>
  );
}
