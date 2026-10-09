"use client";

import { X } from "lucide-react";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import NotificationList from "@/components/notification/notification-list";
import CommentList from "@/components/comment/comment-list";
import PaymentNotificationList from "@/components/realtime-orders/payment-notification-list";
import { cn } from "@/lib/utils";

const TITLES = {
  notification: "الإشعارات",
  comments: "التعليقات",
  payments: "إشعارات الدفع",
};

export default function UtilitySidePanel() {
  const { displayedPart, setDisplayedPart } = useSidebarStore();
  const isOpen =
    displayedPart === "notification" ||
    displayedPart === "comments" ||
    displayedPart === "payments";

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[98] bg-black/30 dark:bg-black/50 max-[1200px]:block hidden"
        onClick={() => setDisplayedPart("default")}
        aria-label="إغلاق اللوحة"
      />
      <aside
        id="utility-side-panel"
        className={cn(
          // design.html .npanel — light panel (not the nav sidebar chrome)
          "relative flex h-screen w-80 shrink-0 flex-col overflow-hidden border-s",
          "bg-[#F7F8F8] border-[#E8EEEC] text-gray-900",
          "dark:bg-[#0B1411] dark:border-white/[0.08] dark:text-white",
          "shadow-[-12px_0_40px_rgba(15,26,23,0.12)] dark:shadow-[-12px_0_40px_rgba(0,0,0,0.45)]",
          "max-[1200px]:absolute max-[1200px]:inset-e-0 max-[1200px]:inset-y-0 max-[1200px]:z-[100]"
        )}
        dir="rtl"
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 py-4 shrink-0 border-b",
            "border-[#ECECEA] dark:border-white/[0.08]"
          )}
        >
          <h2 className="text-15 font-bold text-gray-900 dark:text-white">
            {TITLES[displayedPart] || "لوحة جانبية"}
          </h2>
          <button
            type="button"
            onClick={() => setDisplayedPart("default")}
            aria-label="إغلاق"
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              "bg-[#0B5A3C] text-white hover:bg-[#0A4D33]",
              "dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-[#0B1411]"
            )}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-4 no-scrollbar">
          {displayedPart === "notification" ? <NotificationList /> : null}
          {displayedPart === "comments" ? <CommentList /> : null}
          {displayedPart === "payments" ? <PaymentNotificationList /> : null}
        </div>
      </aside>
    </>
  );
}
