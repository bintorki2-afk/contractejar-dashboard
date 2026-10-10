"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { ORDER_STAGES_QUERY_KEY } from "@/src/hooks/use-order-stage";
import { openStageWhatsApp } from "@/src/hooks/use-order-stage";

export const BANK_TRANSFER_MESSAGE_KEY = "bank-transfer-message";

/** يحدّث تفاصيل الطلب والمراحل والقوائم بعد أي عملية دفع (حوالة / رسوم / فرق). */
export function invalidatePaymentCaches(queryClient, orderId) {
  invalidateOrdersCaches(queryClient, { orderId });
  queryClient.invalidateQueries({ queryKey: [ORDER_STAGES_QUERY_KEY, String(orderId)] });
  queryClient.invalidateQueries({ queryKey: ["single-order", String(orderId)] });
  queryClient.invalidateQueries({ queryKey: ["single-order", orderId] });
  queryClient.invalidateQueries({ queryKey: ["order-charges", String(orderId)] });
  queryClient.invalidateQueries({ queryKey: ["orders-attention"] });
  queryClient.invalidateQueries({ queryKey: ["payments"] });
  queryClient.invalidateQueries({ queryKey: ["reports"] });
}

export function apiErrorMessage(error, fallback = "تعذّر تنفيذ العملية") {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return data?.message || error?.message || fallback;
}

/**
 * GET /admin/orders/{id}/bank-transfer-message?amount=&charge_id=
 * → {amount, message, phone, whatsapp_url, bank:{bank,iban,account_name,is_configured}, payment_state}
 */
export function useBankTransferMessage(orderId, { amount, chargeId, enabled = true } = {}) {
  return useQuery({
    queryKey: [BANK_TRANSFER_MESSAGE_KEY, String(orderId), amount ?? null, chargeId ?? null],
    queryFn: async () => {
      const params = {};
      if (amount != null && amount !== "") params.amount = amount;
      if (chargeId != null) params.charge_id = chargeId;
      const res = await axiosInstance.get(`/admin/orders/${orderId}/bank-transfer-message`, { params });
      return res?.data?.data ?? null;
    },
    enabled: enabled && orderId != null && orderId !== "",
    staleTime: 30_000,
  });
}

/** يجلب رسالة الحوالة ويفتح واتساب العميل بها (زر «إرسال بيانات الحوالة»). */
export async function openBankTransferWhatsApp(orderId, { amount, chargeId } = {}) {
  const params = {};
  if (amount != null && amount !== "") params.amount = amount;
  if (chargeId != null) params.charge_id = chargeId;
  const res = await axiosInstance.get(`/admin/orders/${orderId}/bank-transfer-message`, { params });
  const data = res?.data?.data ?? null;
  if (!data?.bank?.is_configured) {
    toast.error("بيانات الحوالة البنكية غير مضبوطة — أضفها من إعدادات النظام ← الحوالة البنكية.");
    return data;
  }
  if (data?.whatsapp_url) openStageWhatsApp({ url: data.whatsapp_url, message: data.message });
  else toast.error("لا يوجد رقم جوال للعميل");
  return data;
}

/**
 * POST /admin/orders/{id}/payments/bank-transfer (multipart) — صلاحية payments.record_transfer.
 * variables: { orderId, amount, receipt(File), reference?, paid_at?, note?, charge_id? }
 */
export function useRecordBankTransfer({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, amount, receipt, reference, paid_at, note, charge_id }) => {
      const form = new FormData();
      form.append("amount", String(amount));
      if (receipt) form.append("receipt", receipt);
      if (reference) form.append("reference", reference);
      if (paid_at) form.append("paid_at", paid_at);
      if (note) form.append("note", note);
      if (charge_id != null) form.append("charge_id", String(charge_id));
      const res = await axiosInstance.post(`/admin/orders/${orderId}/payments/bank-transfer`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.data?.data ?? null;
    },
    onSuccess: (data, vars) => {
      invalidatePaymentCaches(queryClient, vars.orderId);
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      onError?.(error, vars);
    },
  });
}
