"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommentForm() {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { orderId } = useSidebarStore();

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: (data) =>
      axiosInstance.post(`/admin/orders/${orderId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderComments", orderId] });
      toast.success("تم إضافة الملاحظة بنجاح");
      setComment("");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ ما");
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error("الرجاء كتابة ملاحظة أولاً");
      return;
    }
    addComment({ comment });
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <h3 className="font-bold text-gray-900 dark:text-white text-right">
        هل ترغب بذكر ملاحظة !
      </h3>

      <textarea
        className={cn(
          "w-full min-h-40 p-6 rounded-xl border text-base font-medium resize-none text-right",
          "border-[#E3E8E6] bg-white text-gray-900 placeholder:text-[#98A39E]",
          "focus:outline-none focus:ring-1 focus:ring-brand-accent",
          "dark:border-[#2C5648] dark:bg-[#13251E] dark:text-[#D6E5DE] dark:placeholder:text-[#9FC0B4]"
        )}
        placeholder="أكتب هنا ..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          "w-full h-12 transition-colors duration-300 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60",
          "bg-[#0B5A3C] hover:bg-[#0A4D33] text-white",
          "dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-[#0B1411]"
        )}
      >
        {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "إضافة"}
      </button>
    </div>
  );
}
