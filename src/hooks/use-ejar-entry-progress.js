"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";

/**
 * «أدخلتها في إيجار» لكل قسم (دفعة هـ): PUT /admin/orders/{id}/ejar-entry-progress {section, done}
 * يُحفظ في الخادم لكل طلب (مع الموظف والوقت) ويرجع ejar_entry_progress المحدّث.
 */
export function useEjarEntryProgress(orderId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ section, done }) => {
      const res = await axiosInstance.put(`/admin/orders/${orderId}/ejar-entry-progress`, { section, done: Boolean(done) });
      return res?.data?.data ?? null;
    },
    onSuccess: (data) => {
      const progress = data?.ejar_entry_progress ?? data;
      if (progress && typeof progress === "object") {
        const keys = [["single-order", String(orderId)], ["single-order", orderId]];
        keys.forEach((key) => {
          queryClient.setQueryData(key, (prev) => {
            if (!prev) return prev;
            // الكاش قد يكون {data:{...}} أو الكائن مباشرة
            if (prev?.data && typeof prev.data === "object" && !Array.isArray(prev.data)) {
              return { ...prev, data: { ...prev.data, ejar_entry_progress: progress } };
            }
            return { ...prev, ejar_entry_progress: progress };
          });
        });
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "تعذّر حفظ علامة الإدخال");
    },
  });
}
