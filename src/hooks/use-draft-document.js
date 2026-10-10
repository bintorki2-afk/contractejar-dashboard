"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { invalidatePaymentCaches } from "@/src/hooks/use-bank-transfer";

/**
 * D9: POST /admin/orders/{id}/draft-document (multipart: file + note?) — all_requests.edit.
 * الخادم يسجّل `draft_document_uploaded` ويرسل للعميل إشعار `draft_ready`.
 */
export function useUploadDraftDocument({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, file, note }) => {
      const form = new FormData();
      form.append("file", file);
      if (note) form.append("note", note);
      const res = await axiosInstance.post(`/admin/orders/${orderId}/draft-document`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res?.data;
    },
    onSuccess: (data, vars) => {
      invalidatePaymentCaches(queryClient, vars.orderId);
      onSuccess?.(data, vars);
    },
    onError,
  });
}

/** D9: POST /admin/orders/{id}/draft-document/delete */
export function useDeleteDraftDocument({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => (await axiosInstance.post(`/admin/orders/${orderId}/draft-document/delete`))?.data,
    onSuccess: (data, orderId) => {
      invalidatePaymentCaches(queryClient, orderId);
      onSuccess?.(data, orderId);
    },
    onError,
  });
}
