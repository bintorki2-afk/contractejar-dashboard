"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Loader from "@/components/home/loader";
import {
  SingleOrderProvider,
  useSingleOrderContext,
} from "@/components/orders/single-order/single-order-context";
import LeaseRenewalOrderView from "@/components/orders/single-order/lease-renewal/lease-renewal-order-view";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { useContractStatuses } from "@/src/hooks/use-contract-statuses";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { useOrderDetailsDialogs } from "@/src/hooks/use-order-details-dialogs";
import OrderDetailsHeader from "./order-details-header";
import OrderGroupsLayout from "./order-groups-layout";
import OrderDetailsDialogs from "./order-details-dialogs";
import ContractExpandedViewDialog from "./contract-expanded-view-dialog";
import { mapOrderDetailView } from "./map-order-detail";
import OrderJourney from "./order-journey";
import OrderStageBar from "./order-stage-bar";
import OrderHistoryPanel from "./order-history-panel";
import RefundDialog from "./refund-dialog";
import { InlineEditProvider } from "./inline-edit";

function resolveBackLink(from) {
  if (from === "/home/realtime-orders" || from?.startsWith("/home/realtime-orders")) {
    return { href: "/home/realtime-orders", label: "الطلبات مباشر" };
  }
  if (from?.startsWith("/home/clients") || from?.startsWith("/home/users")) {
    return { href: from, label: "العملاء" };
  }
  if (from?.startsWith("/home/")) {
    return { href: from, label: "رجوع" };
  }
  return { href: "/home/orders", label: "جميع الطلبات" };
}

function OrderDetailsBody() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const { orderData, isLoading, isError, refetch } = useSingleOrderContext();
  const { setOrderId, setDisplayedPart } = useSidebarStore();
  const { can, isAdmin } = usePermissions();
  const { activeItems: statuses } = useContractStatuses();

  const canChangeStatus =
    isAdmin ||
    can(PERMISSION_SECTIONS.request_classification, "edit") ||
    can(PERMISSION_SECTIONS.all_requests, "edit");
  const canEditOrder = isAdmin || can(PERMISSION_SECTIONS.all_requests, "edit");
  // د9: الاسترجاع عبر Moyasar بصلاحية payments.refund (مدير النظام ضمنياً).
  const canRefundPayments = isAdmin || can(PERMISSION_SECTIONS.payments, "refund");
  const canAddStatus =
    isAdmin || can(PERMISSION_SECTIONS.request_classification, "create");
  const canReturn =
    isAdmin ||
    can(PERMISSION_SECTIONS.returned_request, "create") ||
    can(PERMISSION_SECTIONS.returned_request, "edit");

  const dialogs = useOrderDetailsDialogs({
    orderData,
    id,
    canReturn,
    refetch,
    statuses,
  });
  const [expandedViewOpen, setExpandedViewOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  useEffect(() => {
    setOrderId(id);
    return () => {
      setOrderId(null);
      if (useSidebarStore.getState().displayedPart === "comments") {
        setDisplayedPart("default");
      }
    };
  }, [id, setOrderId, setDisplayedPart]);

  const view = useMemo(
    () => (orderData ? mapOrderDetailView(orderData) : null),
    [orderData]
  );
  const back = resolveBackLink(searchParams.get("from"));
  const isLeaseRenewal =
    orderData?.contract_summary?.instrument_type_key === "lease_renewal";

  const handleOpenNotes = () => {
    setOrderId(id);
    setDisplayedPart("comments");
  };

  if (isLoading) return <Loader />;
  if (isError || !orderData || !view) {
    return (
      <div className="p-6 text-center text-ink-placeholder" dir="rtl">
        تعذر تحميل بيانات الطلب
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-5 min-h-full transition-colors -m-[45px] p-[45px] max-[1700px]:-m-[30px] max-[1700px]:p-[30px] bg-[#F4F6F5] dark:bg-[#0B1411]"
      dir="rtl"
    >
      <OrderDetailsHeader
        order={view}
        orderData={orderData}
        backHref={back.href}
        backLabel={back.label}
        onStatusChange={dialogs.handleStatusChange}
        onOpenNotes={handleOpenNotes}
        onPayLink={dialogs.handlePayLink}
        onRefund={() => (canRefundPayments ? setRefundOpen(true) : dialogs.openReturn(orderData))}
        refundLabel={canRefundPayments ? "استرجاع المبلغ" : undefined}
        onPropertyUpdate={() => dialogs.setPropertyUpdateOpen(true)}
        onSendDraft={() => dialogs.setSendDraftOpen(true)}
        onMissingAttachment={() => dialogs.setCorrectionRequestOpen(true)}
        onEjarDocumentation={() => dialogs.setEjarDocumentationOpen(true)}
        onQuickSendDraft={() => dialogs.openQuickStatus("send_draft")}
        onQuickNotarized={() => dialogs.openQuickStatus("notarized")}
        onSendSectionError={dialogs.setSectionErrorContext}
        onViewExpanded={() => setExpandedViewOpen(true)}
        statuses={statuses}
        canChangeStatus={canChangeStatus}
        canAddStatus={canAddStatus}
        isStatusPending={dialogs.isChangingStatus}
      />

      <OrderStageBar orderId={orderData.id ?? id} canEdit={canEditOrder} />

      <OrderJourney orderData={orderData} />

      <div className="grid grid-cols-1 items-start gap-5 min-[1500px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <InlineEditProvider orderData={orderData} canEdit={canEditOrder}>
            {isLeaseRenewal ? (
              <LeaseRenewalOrderView orderData={orderData} />
            ) : (
              <OrderGroupsLayout order={view} onEdit={dialogs.setEditorSection} />
            )}
          </InlineEditProvider>
        </div>
        <OrderHistoryPanel
          orderData={orderData}
          canRefund={canRefundPayments}
          onRefund={() => setRefundOpen(true)}
          className="min-[1500px]:sticky min-[1500px]:top-0"
        />
      </div>

      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} orderData={orderData} />

      <OrderDetailsDialogs id={id} orderData={orderData} view={view} dialogs={dialogs} />

      <ContractExpandedViewDialog
        open={expandedViewOpen}
        onOpenChange={setExpandedViewOpen}
        order={view}
      />
    </div>
  );
}

export default function RealtimeOrderDetailsWrapper() {
  const params = useParams();
  const id = params?.id;

  return (
    <SingleOrderProvider contractId={id}>
      <OrderDetailsBody />
    </SingleOrderProvider>
  );
}
