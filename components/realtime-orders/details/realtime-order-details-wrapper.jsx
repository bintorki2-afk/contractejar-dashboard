"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronDown, Images } from "lucide-react";
import Loader from "@/components/home/loader";
import { SingleOrderProvider, useSingleOrderContext } from "@/components/orders/single-order/single-order-context";
import LeaseRenewalOrderView from "@/components/orders/single-order/lease-renewal/lease-renewal-order-view";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { useContractStatuses } from "@/src/hooks/use-contract-statuses";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { useOrderDetailsDialogs } from "@/src/hooks/use-order-details-dialogs";
import OrderTopCard from "./order-top-card";
import OrderDataPanel from "./order-data-panel";
import AttachmentsViewer from "./attachments-viewer";
import OrderDetailsDialogs from "./order-details-dialogs";
import ContractExpandedViewDialog from "./contract-expanded-view-dialog";
import { mapOrderDetailView } from "./map-order-detail";
import RefundDialog from "./refund-dialog";
import BankTransferDialog from "./bank-transfer-dialog";
import { UnpaidBanner, UnpaidDialog, markUnpaidPopupSeen, unpaidPopupSeen } from "./unpaid-notice";
import { normalizePaymentState } from "@/src/lib/payment-state";
import DataRequestBadge from "./data-request-badge";
import ChargesPanel from "./charges-panel";
import AddFeeDialog from "./add-fee-dialog";
import { InlineEditProvider } from "./inline-edit";
import ShortcutsHelp from "@/components/orders/shortcuts-help";
import { ORDER_DETAIL_SHORTCUTS, useOrderDetailShortcuts } from "@/src/hooks/use-orders-shortcuts";
import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  return { href: "/home/orders", label: "الطلبات" };
}

/** ارتفاع الشاشة المقسومة: الشاشة − (الرأس + الهوامش) — كما في المخطط (calc(100vh - 212px)). */
const SPLIT_HEIGHT = "lg:h-[calc(100vh-236px)] lg:min-h-[420px]";

function OrderDetailsBody() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const { orderData, isLoading, isError, refetch } = useSingleOrderContext();
  const { setOrderId, setDisplayedPart } = useSidebarStore();
  const { can, isAdmin } = usePermissions();
  const { activeItems: statuses } = useContractStatuses();

  const canChangeStatus = isAdmin || can(PERMISSION_SECTIONS.request_classification, "edit") || can(PERMISSION_SECTIONS.all_requests, "edit");
  const canEditOrder = isAdmin || can(PERMISSION_SECTIONS.all_requests, "edit");
  // خصم على طلب غير مدفوع = تعديل بيانات العميل في الخادم (UserPolicy@update → users.edit).
  const canDiscountOrder = isAdmin || can(PERMISSION_SECTIONS.users, "edit");
  // د9: الاسترجاع عبر Moyasar بصلاحية payments.refund (مدير النظام ضمنياً).
  const canRefundPayments = isAdmin || can(PERMISSION_SECTIONS.payments, "refund");
  // دفعة هـ: تسجيل حوالة بنكية / إضافة رسوم (قسم المدفوعات).
  const canRecordTransfer = isAdmin || can(PERMISSION_SECTIONS.payments, "record_transfer");
  const canAddFee = isAdmin || can(PERMISSION_SECTIONS.payments, "add_fee");
  const canReturn = isAdmin || can(PERMISSION_SECTIONS.returned_request, "create") || can(PERMISSION_SECTIONS.returned_request, "edit");

  const dialogs = useOrderDetailsDialogs({ orderData, id, canReturn, refetch, statuses });
  const [expandedViewOpen, setExpandedViewOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPrefill, setRefundPrefill] = useState(null);
  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const openRefund = (prefill = null) => {
    setRefundPrefill(prefill);
    setRefundOpen(true);
  };
  const [sideMode, setSideMode] = useState("attachments");
  const [attachmentKey, setAttachmentKey] = useState(null);
  const [mobileAttachmentsOpen, setMobileAttachmentsOpen] = useState(false);
  // دفعة هـ (د2): حوالة بنكية + بوب-أب «غير مدفوع» مرة واحدة لكل طلب في الجلسة.
  const [bankTransfer, setBankTransfer] = useState({ open: false, charge: null });
  const [unpaidOpen, setUnpaidOpen] = useState(false);
  const [unpaidCheckedFor, setUnpaidCheckedFor] = useState(null);
  if (orderData?.id && unpaidCheckedFor !== orderData.id) {
    setUnpaidCheckedFor(orderData.id);
    if (normalizePaymentState(orderData).status === "unpaid" && !unpaidPopupSeen(orderData.id)) {
      markUnpaidPopupSeen(orderData.id);
      setUnpaidOpen(true);
    }
  }
  const openBankTransfer = (charge = null) => setBankTransfer({ open: true, charge });

  // د19: S = المرحلة التالية، W = واتساب العميل، ? = المساعدة.
  const detailShortcuts = useOrderDetailShortcuts({
    enabled: Boolean(orderData),
    onStage: () => {
      const btn = document.querySelector('[aria-label="رحلة الطلب"] button[data-next-stage]');
      if (btn) {
        btn.scrollIntoView({ block: "center", behavior: "smooth" });
        btn.click();
      } else toast.message("لا توجد مرحلة متبقية لهذا الطلب");
    },
    onWhatsApp: () => {
      const digits =
        orderData?.creator_mobile?.dial ||
        toSaudiMobileDialDigits(orderData?.user?.contact_mobile || orderData?.user?.mobile || orderData?.user_mobile || orderData?.tenant_mobile || "");
      if (!digits) toast.error("لا يوجد رقم جوال للعميل");
      else window.open(orderData?.creator_mobile?.whatsapp_url || `https://wa.me/${digits}`, "_blank", "noopener,noreferrer");
    },
  });

  useEffect(() => {
    setOrderId(id);
    return () => {
      setOrderId(null);
      if (useSidebarStore.getState().displayedPart === "comments") {
        setDisplayedPart("default");
      }
    };
  }, [id, setOrderId, setDisplayedPart]);

  const view = useMemo(() => (orderData ? mapOrderDetailView(orderData) : null), [orderData]);
  const back = resolveBackLink(searchParams.get("from"));
  const isLeaseRenewal = orderData?.contract_summary?.instrument_type_key === "lease_renewal";
  const attachments = Array.isArray(orderData?.attachments) ? orderData.attachments : [];

  const handleOpenNotes = () => {
    setOrderId(id);
    setDisplayedPart("comments");
  };
  const openAttachment = (key) => {
    setSideMode("attachments");
    setAttachmentKey(key);
    setMobileAttachmentsOpen(true);
    document.getElementById("order-attachments")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  if (isLoading) return <Loader />;
  if (isError || !orderData || !view) {
    return (
      <div className="p-6 text-center text-ink-placeholder" dir="rtl">
        تعذر تحميل بيانات الطلب
      </div>
    );
  }

  const orderId = orderData.id ?? id;
  const sideProps = {
    orderData,
    attachments,
    selectedKey: attachmentKey,
    onSelect: setAttachmentKey,
    mode: sideMode,
    onModeChange: setSideMode,
    historyProps: { canRefund: canRefundPayments, onRefund: () => openRefund(null), canNotify: canEditOrder, canDiscount: canDiscountOrder },
  };

  return (
    <div
      className="flex min-h-full flex-col gap-3 bg-[#F3F5F2] transition-colors -m-[45px] p-[45px] pt-4 max-[1700px]:-m-[30px] max-[1700px]:p-[30px] max-[1700px]:pt-4 max-md:-m-4 max-md:p-4 max-md:pb-28 dark:bg-[#0B1411]"
      dir="rtl"
    >
      <UnpaidBanner orderData={orderData} onPayLink={dialogs.handlePayLink} onBankTransfer={() => openBankTransfer(null)} canRecordTransfer={canRecordTransfer} />

      <OrderTopCard
        orderData={orderData}
        view={view}
        orderId={orderId}
        backHref={back.href}
        backLabel={back.label}
        canEdit={canEditOrder}
        isAdmin={isAdmin}
        canRefund={canRefundPayments}
        canRecordTransfer={canRecordTransfer}
        canAddFee={canAddFee}
        statuses={statuses}
        canChangeStatus={canChangeStatus}
        isStatusPending={dialogs.isChangingStatus}
        onStatusChange={dialogs.handleStatusChange}
        onOpenNotes={handleOpenNotes}
        onPayLink={dialogs.handlePayLink}
        onBankTransfer={() => openBankTransfer(null)}
        onAddFee={() => setAddFeeOpen(true)}
        onRefund={() => (canRefundPayments ? openRefund(null) : dialogs.openReturn(orderData))}
        badges={<DataRequestBadge orderData={orderData} canEdit={canEditOrder} />}
        onPropertyUpdate={() => dialogs.setPropertyUpdateOpen(true)}
        onRequestData={(section) => dialogs.openDataRequest(section)}
        onEjarDocumentation={() => dialogs.setEjarDocumentationOpen(true)}
        onSendSectionError={dialogs.setSectionErrorContext}
        onViewExpanded={() => setExpandedViewOpen(true)}
        onEditSection={dialogs.setEditorSection}
        onShowHistory={() => {
          setSideMode("history");
          setMobileAttachmentsOpen(true);
          document.getElementById("order-attachments")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }}
      />

      {/* دفعة هـ (E5): فروقات السعر / الرسوم المعلّقة / مستحق الاسترجاع */}
      <ChargesPanel
        orderData={orderData}
        canEdit={canEditOrder}
        canRecordTransfer={canRecordTransfer}
        canRefund={canRefundPayments}
        onBankTransfer={(charge) => openBankTransfer(charge)}
        onRefundDue={(amount) => openRefund({ amount, reason: "استرجاع فرق سعر بعد تعديل الطلب" })}
      />

      {/* الشاشة المقسومة: يمين = البيانات (تمرير داخلي) · يسار = المرفقات (ثابتة) */}
      <div className={cn("flex flex-col items-start gap-3 lg:flex-row", SPLIT_HEIGHT)}>
        <div className={cn("w-full min-w-0 flex-1 lg:h-full lg:overflow-y-auto lg:pe-1 [scrollbar-gutter:stable]")} data-scroll="ejar-panel">
          <InlineEditProvider orderData={orderData} canEdit={canEditOrder}>
            {isLeaseRenewal ? (
              <LeaseRenewalOrderView orderData={orderData} />
            ) : (
              <OrderDataPanel orderData={orderData} canEdit={canEditOrder} onRequestData={(section) => dialogs.openDataRequest(section)} onOpenAttachment={openAttachment} />
            )}
          </InlineEditProvider>
        </div>

        {/* الجوال: المرفقات قابلة للطي؛ الشاشات الواسعة: عمود ثابت */}
        <div id="order-attachments" className="w-full lg:sticky lg:top-0 lg:h-full lg:w-[400px] lg:shrink-0">
          <button
            type="button"
            onClick={() => setMobileAttachmentsOpen((v) => !v)}
            aria-expanded={mobileAttachmentsOpen}
            aria-controls="order-attachments-panel"
            className="mb-2 flex w-full items-center justify-between rounded-[12px] border border-[#E3E8E3] bg-white px-4 py-2.5 text-[14px] font-bold text-[#14231D] lg:hidden dark:border-white/10 dark:bg-[#0F1C16] dark:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <Images className="size-4 text-brand-deep" />
              المرفقات وسجل الطلب{attachments.length ? ` (${attachments.length})` : ""}
            </span>
            <ChevronDown className={cn("size-4 transition-transform", mobileAttachmentsOpen && "rotate-180")} />
          </button>
          <div id="order-attachments-panel" className={cn("lg:block lg:h-full", mobileAttachmentsOpen ? "block" : "hidden")}>
            <AttachmentsViewer {...sideProps} className="lg:h-full" />
          </div>
        </div>
      </div>

      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} orderData={orderData} prefill={refundPrefill} />
      <AddFeeDialog open={addFeeOpen} onOpenChange={setAddFeeOpen} orderData={orderData} />
      <BankTransferDialog
        open={bankTransfer.open}
        onOpenChange={(next) => setBankTransfer((prev) => ({ ...prev, open: next }))}
        orderData={orderData}
        charge={bankTransfer.charge}
      />
      <UnpaidDialog
        open={unpaidOpen}
        onOpenChange={setUnpaidOpen}
        orderData={orderData}
        onPayLink={dialogs.handlePayLink}
        onBankTransfer={() => openBankTransfer(null)}
        canRecordTransfer={canRecordTransfer}
      />
      <ShortcutsHelp open={detailShortcuts.helpOpen} onOpenChange={detailShortcuts.setHelpOpen} items={ORDER_DETAIL_SHORTCUTS} />
      <OrderDetailsDialogs id={id} orderData={orderData} view={view} dialogs={dialogs} />
      <ContractExpandedViewDialog open={expandedViewOpen} onOpenChange={setExpandedViewOpen} order={view} orderData={orderData} />
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
