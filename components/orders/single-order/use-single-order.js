"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { describePriceDifference } from "@/src/lib/charges";
import { axiosInstance } from "@/src/utils/axios";
import { toast } from "sonner";
import { mapApiValidationErrors } from "@/src/lib/contract-update";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";

function toMultipartFormData(payload) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload || {})) {
    if (value === undefined || value === null) continue;
    if (typeof File !== "undefined" && value instanceof File) {
      formData.append(key, value);
      continue;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      continue;
    }
    formData.append(key, String(value));
  }
  return formData;
}

export function useSingleOrder(contractId) {
  const queryClient = useQueryClient();
  const queryKey = ["single-order", contractId];
  const unitsQueryKey = ["order-units", contractId];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      axiosInstance.get(`/admin/orders/${contractId}`).then((res) => res.data),
    enabled: Boolean(contractId),
  });

  const orderData = query.data?.data;

  const invalidateOrderAndUnits = (res) => {
    const updated = res?.data;
    // A partial update response would drop contract_summary (images, owner, …),
    // so only adopt it directly when it carries the full order shape.
    const isFullOrder =
      updated &&
      !Array.isArray(updated) &&
      updated.id === Number(contractId) &&
      updated.contract_summary != null;

    if (isFullOrder) {
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        data: updated,
      }));
    } else {
      queryClient.invalidateQueries({ queryKey });
    }
    queryClient.invalidateQueries({ queryKey: unitsQueryKey });
    invalidateOrdersCaches(queryClient, { queryKey, orderId: contractId });
  };

  const handleMutationError = (error) => {
    const apiErrors = error?.response?.data?.errors;
    if (apiErrors) {
      const mapped = mapApiValidationErrors(apiErrors);
      const first = Object.values(mapped)[0];
      toast.error(first || error?.response?.data?.message || "خطأ في التحقق");
      throw { fieldErrors: mapped, message: error?.response?.data?.message };
    }
    toast.error(error?.response?.data?.message || "حدث خطأ أثناء حفظ البيانات");
    throw error;
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => {
      const hasFile = Object.values(payload || {}).some(
        (value) => typeof File !== "undefined" && value instanceof File
      );
      const body = hasFile ? toMultipartFormData(payload) : payload;
      return axiosInstance
        .post(`/admin/orders/${contractId}`, body, {
          headers: hasFile
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
        })
        .then((res) => res.data);
    },
    onSuccess: (res) => {
      toast.success(res?.message || "تم تحديث بيانات العقد بنجاح");
      // دفعة هـ (E5): تغيّر السعر بعد التعديل ← فرق معلّق أو مستحق استرجاع.
      const pd = describePriceDifference(res?.data ?? res);
      if (pd) toast.warning(pd.title, { description: pd.description, duration: 8000 });
      invalidateOrderAndUnits(res);
    },
    onError: handleMutationError,
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, payload }) =>
      axiosInstance
        .post(`/admin/orders/${contractId}/units/${unitId}`, payload)
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res?.message || "تم تحديث الوحدة بنجاح");
      invalidateOrderAndUnits(res);
      query.refetch();
    },
    onError: handleMutationError,
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (unitId) =>
      axiosInstance
        .post(`/admin/orders/${contractId}/units/${unitId}/delete`)
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res?.message || "تم فصل الوحدة عن العقد");
      invalidateOrderAndUnits(res);
      query.refetch();
    },
    onError: handleMutationError,
  });

  return {
    orderData,
    contractId,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateContract: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
    updateUnit: (unitId, payload) =>
      updateUnitMutation.mutateAsync({ unitId, payload }),
    deleteUnit: deleteUnitMutation.mutateAsync,
    isSavingUnit: updateUnitMutation.isPending,
    isDeletingUnit: deleteUnitMutation.isPending,
  };
}
