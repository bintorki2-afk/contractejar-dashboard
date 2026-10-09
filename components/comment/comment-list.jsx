"use client";

import React from "react";
import CommentForm from "./comment-form";
import CommentCard from "./comment-card";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { axiosInstance } from "@/src/utils/axios";
import { cn } from "@/lib/utils";

export default function CommentList() {
  const { orderId, displayedPart } = useSidebarStore();

  function getOrderComments() {
    return axiosInstance
      .get(`/admin/orders/${orderId}/comments`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err;
      });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["orderComments", orderId],
    queryFn: getOrderComments,
    enabled: Boolean(orderId) && displayedPart === "comments",
  });
  const comments = data?.data?.items;

  return (
    <div className="flex flex-col gap-6">
      <CommentForm />

      <div className="flex flex-col gap-4">
        <p className="font-bold text-13 text-gray-700 dark:text-[#D6E5DE]">
          ملاحظات الموظفيــن :
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin h-6 w-6 text-brand-accent" />
          </div>
        ) : comments?.length ? (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-[18px] py-10 px-4 border text-center",
              "bg-white border-[#ECECEA]",
              "dark:bg-[#13251E] dark:border-[#26473A]"
            )}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#F0F8F4] text-[#0B5A3C] dark:bg-[#1B3A2E] dark:text-emerald-300">
              <MessageSquare size={18} strokeWidth={2} />
            </div>
            <p className="text-13 font-bold text-gray-700 dark:text-[#D6E5DE]">
              لا توجد ملاحظات بعد
            </p>
            <p className="text-11 text-[#98A39E] dark:text-[#9FC0B4]">
              أول من يكتب ملاحظة يظهر هنا
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
