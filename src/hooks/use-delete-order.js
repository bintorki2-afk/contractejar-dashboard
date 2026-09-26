"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { postOrderDelete } from "@/src/lib/order-delete-api";

export function useDeleteOrder({ queryKey, onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }) => postOrderDelete(orderId),
    onSuccess: (res, vars) => {
      invalidateOrdersCaches(queryClient, {
        queryKey,
        orderId: vars.orderId,
      });
      toast.success(res?.data?.message || "تم حذف الطلب");
      onSuccess?.(res, vars);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف الطلب");
      onError?.(err);
    },
  });
}
