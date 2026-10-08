"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";
import { axiosInstance } from "@/src/utils/axios";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import OrdersPagination from "@/components/orders/shared/orders-pagination";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusLabels = {
  success: "ناجحة",
  failed: "فشلت",
  pending: "قيد الانتظار",
};

function extractPayments(response) {
  const body = response?.data ?? response;
  const payload = body?.data ?? body;
  const items = payload?.items ?? [];
  const pagination = payload?.pagination ?? null;
  return { items: Array.isArray(items) ? items : [], pagination };
}

export default function PaymentNotificationList() {
  const { setDisplayedPart } = useSidebarStore();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["payment-notifications", currentPage],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/payments", {
        params: { page: currentPage, per_page: 20, filter: "today" },
      });
      return extractPayments(res.data);
    },
    placeholderData: keepPreviousData,
  });

  const payments = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? payments.length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header already has title + close; keep a compact summary only */}
      <div
        className={cn(
          "rounded-2xl border p-4 flex flex-col gap-2",
          "bg-white border-[#ECECEA]",
          "dark:bg-[#13251E] dark:border-[#26473A]"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="font-bold text-15 text-gray-900 dark:text-[#D6E5DE]">
            مدفوعات اليوم
          </p>
          <CreditCard className="size-5 text-[#0B5A3C] dark:text-emerald-300" />
        </div>
        <p className="font-black text-gray-900 dark:text-white text-3xl tabular-nums">
          {total}
        </p>
        <Link
          href="/home/invoices"
          onClick={() => setDisplayedPart("default")}
          className="text-xs font-bold text-[#0B5A3C] dark:text-emerald-300 hover:underline w-fit"
        >
          عرض كل الفواتير
        </Link>
      </div>

      <div
        className={cn(
          "flex flex-col gap-2.5",
          isFetching && !isLoading && "opacity-60 pointer-events-none"
        )}
      >
        {payments.length === 0 ? (
          <p className="text-center text-13 text-[#98A39E] dark:text-[#9FC0B4] py-8 font-medium">
            لا توجد مدفوعات اليوم
          </p>
        ) : (
          payments.map((payment) => {
            const success = payment.status === "success";
            return (
              <div
                key={payment.id}
                className={cn(
                  "rounded-[15px] border p-4 space-y-2",
                  "bg-white border-[#ECECEA]",
                  "dark:bg-[#13251E] dark:border-[#26473A]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-[#D6E5DE] truncate">
                      {payment.name || payment.name_payment || "عملية دفع"}
                    </p>
                    <p
                      className="text-xs text-[#98A39E] dark:text-[#9FC0B4] tabular-nums"
                      dir="ltr"
                    >
                      {payment.user_mobile || payment.contract_uuid || "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-11 font-bold",
                      success
                        ? "bg-[#E6F7EF] text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : payment.status === "failed"
                          ? "bg-[#FEF2F2] text-red-600 dark:bg-rose-500/20 dark:text-rose-300"
                          : "bg-status-neutral-bg text-status-neutral dark:bg-white/10 dark:text-white/70"
                    )}
                  >
                    {statusLabels[payment.status] || payment.status || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12.5px] font-bold">
                  <span className="tabular-nums text-[#0B5A3C] dark:text-emerald-300">
                    {payment.amount} {payment.tran_currency || "ريال"}
                  </span>
                  <span className="text-[#98A39E] dark:text-[#9FC0B4] font-medium">
                    {payment.payment_hour || payment.payment_date || ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <OrdersPagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
