"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetchContractPaymentLink } from "@/components/orders/shared/payment-gateway";
import { getOrderContractUuid } from "@/components/orders/messages/order-section-message-utils";
import {
  getReturnRequestExistsMessage,
  hasReturnRequest,
  isOrderUnpaidForReturn,
  RETURN_REQUEST_UNPAID_MESSAGE,
  isReturnContractStatus,
  normalizeOrderForReturnRequest,
} from "@/components/analysis/returned/refund-contract-utils";
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close";
import { statusRequiresExtraFields } from "@/components/realtime-orders/change-order-status-fields-dialog";
import { useChangeOrderStatus } from "@/src/hooks/use-change-order-status";
import { findNotarizeStatus } from "@/src/lib/notarize-status";

const EMPTY_PAYMENT_LINK = {
  paymentUrl: "",
  cartAmount: null,
  alreadyPaid: false,
  message: null,
  payment: null,
};

function toMenuStatus(status) {
  return {
    id: status.id,
    name: status.name ?? status.label,
    label: status.label ?? status.name,
    color: status.color,
    status_case: status.status_case ?? null,
  };
}

export function useOrderDetailsDialogs({
  orderData,
  id,
  canReturn,
  refetch,
  statuses = [],
}) {
  const [editorSection, setEditorSection] = useState(null);
  const [sectionErrorContext, setSectionErrorContext] = useState(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [propertyUpdateOpen, setPropertyUpdateOpen] = useState(false);
  const [correctionRequestOpen, setCorrectionRequestOpen] = useState(false);
  const [ejarDocumentationOpen, setEjarDocumentationOpen] = useState(false);
  const [statusFieldsOpen, setStatusFieldsOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLink, setPaymentLink] = useState(EMPTY_PAYMENT_LINK);

  const { mutate: changeStatus, isPending: isChangingStatus } = useChangeOrderStatus({
    queryKey: ["single-order", id],
    onSuccess: () => {
      setStatusFieldsOpen(false);
      setPendingStatusChange(null);
      refetch();
    },
  });

  const openReturn = (source = orderData) => {
    if (!canReturn) {
      toast.error("ليست لديك صلاحية طلب الاسترجاع");
      return;
    }
    const normalized = normalizeOrderForReturnRequest(source, source?.id ?? id);
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
  };

  const handleStatusChange = (_row, status) => {
    const menuStatus = toMenuStatus(status);

    if (isReturnContractStatus(menuStatus)) {
      // Same as the "رفع طلب استرجاع" pill: create a request, or block if one exists.
      openReturn(orderData);
      return;
    }

    if (statusRequiresExtraFields(menuStatus)) {
      setPendingStatusChange({ orderId: orderData.id, status: menuStatus });
      openDialogAfterMenuClose(() => setStatusFieldsOpen(true));
      return;
    }

    changeStatus({ orderId: orderData.id, statusId: status.id });
  };

  /** إجراء سريع: يفتح نموذج تغيير الحالة معبّأً بحالة التوثيق (الحقول الإلزامية تبقى). */
  const openQuickStatus = () => {
    if (!orderData?.id) return;
    const status = findNotarizeStatus(statuses);
    if (!status) {
      toast.error("الحالة غير متوفرة في قائمة الحالات النشطة");
      return;
    }
    const menuStatus = toMenuStatus(status);
    if (statusRequiresExtraFields(menuStatus)) {
      setPendingStatusChange({ orderId: orderData.id, status: menuStatus });
      setStatusFieldsOpen(true);
      return;
    }
    changeStatus({ orderId: orderData.id, statusId: status.id });
  };

  const handlePayLink = async () => {
    const uuid = getOrderContractUuid(orderData);
    if (!uuid) {
      toast.error("رقم الطلب غير متوفر");
      return;
    }
    try {
      const result = await fetchContractPaymentLink(uuid);
      setPaymentLink({
        paymentUrl: result.paymentUrl || "",
        cartAmount: result.cartAmount,
        alreadyPaid: result.alreadyPaid,
        message: result.message,
        payment: result.payment,
      });
      setPaymentDialogOpen(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.gateway_error ||
          error?.response?.data?.message ||
          error?.message ||
          "تعذر إنشاء رابط الدفع"
      );
    }
  };

  return {
    editorSection,
    setEditorSection,
    sectionErrorContext,
    setSectionErrorContext,
    returnDialogOpen,
    setReturnDialogOpen,
    returnOrder,
    propertyUpdateOpen,
    setPropertyUpdateOpen,
    correctionRequestOpen,
    setCorrectionRequestOpen,
    ejarDocumentationOpen,
    setEjarDocumentationOpen,
    statusFieldsOpen,
    setStatusFieldsOpen,
    pendingStatusChange,
    setPendingStatusChange,
    paymentDialogOpen,
    setPaymentDialogOpen,
    paymentLink,
    isChangingStatus,
    changeStatus,
    openReturn,
    handleStatusChange,
    openQuickStatus,
    handlePayLink,
  };
}
