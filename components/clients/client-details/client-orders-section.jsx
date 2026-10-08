"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabToOrderListParams } from "@/src/lib/order-status-keys";
import { useOrderStatusCounts } from "@/src/hooks/use-order-status-counts";
import { buildAdminOrdersParams, useRealtimeOrdersList } from "@/src/hooks/use-realtime-new-orders";
import OrderStatusTabs from "@/components/orders/order-status-tabs";
import { StatusPill } from "@/components/orders/status-pill";

const ORDERS_PAGE_SIZE = 10;

/**
 * دفعة د (د2): طلبات العميل من نفس قائمة «جميع الطلبات» (GET /admin/orders?user_id=)
 * ونفس العدّادات (status-counts?user_id=) — فتتطابق الأرقام في كل مكان.
 */
export default function ClientOrdersSection({ clientId, userId, backUrl }) {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ownerId = userId ?? clientId;

  const counts = useOrderStatusCounts({ userId: ownerId, enabled: ownerId != null });
  const tabs = counts.tabs.filter((t) => t.key === "all" || t.key === "incomplete" || t.count > 0);
  const tabParams = tabToOrderListParams(filter);
  const list = useRealtimeOrdersList({
    params: buildAdminOrdersParams({
      page: currentPage,
      perPage: ORDERS_PAGE_SIZE,
      userId: ownerId,
      statusKey: tabParams.status_key,
      tab: tabParams.tab,
    }),
    queryKey: "client-orders",
    enabled: ownerId != null,
  });

  const paginatedOrders = list.items;
  const totalOrders = list.pagination?.total ?? paginatedOrders.length;
  const ordersLastPage = Math.max(1, list.pagination?.last_page ?? 1);
  const ordersPage = Math.min(currentPage, ordersLastPage);
  const ordersStart = totalOrders === 0 ? 0 : (ordersPage - 1) * ORDERS_PAGE_SIZE + 1;
  const ordersEnd = Math.min(ordersPage * ORDERS_PAGE_SIZE, totalOrders);

  const handleFilterChange = (tabId) => {
    setFilter(tabId);
    setCurrentPage(1);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border bg-white overflow-hidden",
        "border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
        "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 pt-5 pb-3">
        <div className="inline-flex items-center gap-2">
          <FileText className="size-4 text-brand-dark dark:text-emerald-300 shrink-0" />
          <h3 className="text-15 font-bold text-gray-900 dark:text-white">طلبات العميل</h3>
        </div>
        <p className="text-xs font-medium text-gray-400 dark:text-white/45">
          إجمالي طلبات العميل:{" "}
          <span className="tabular-nums text-gray-700 dark:text-white/70 font-bold">{counts.total ?? "—"}</span>
          {counts.incomplete ? (
            <span className="ms-2">· مسودات غير مكتملة: <span className="tabular-nums font-bold">{counts.incomplete}</span></span>
          ) : null}
        </p>
      </div>

      <div className="px-5 pb-4">
        <OrderStatusTabs tabs={tabs} value={filter} onChange={handleFilterChange} isLoading={counts.isLoading} />
      </div>

      <div className="w-full overflow-x-auto border-t border-[#EEF1F0] dark:border-white/[0.06]">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-[#FAFBFA] dark:bg-white/[0.03]">
              {["الطلب", "النوع", "الحالة", "حالة الدفع", ""].map((h) => (
                <th
                  key={h || "actions"}
                  className="px-4 py-3 text-xs font-semibold text-gray-400 dark:text-white/45 text-right whitespace-nowrap border-b border-[#EEF1F0] dark:border-white/[0.08]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-13 text-gray-400 dark:text-white/40">
                  جاري التحميل…
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-13 text-gray-400 dark:text-white/40">
                  لا توجد طلبات في هذا التصنيف
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-status-neutral-bg dark:border-white/[0.05] last:border-0 hover:bg-[#F8FAF9]/80 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <td className="px-4 py-3.5 text-13 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                    #{order.uuid ?? order.id}
                  </td>
                  <td className="px-4 py-3.5 text-13 font-medium text-gray-700 dark:text-white/70 whitespace-nowrap">
                    {order.contract_type || "—"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusPill order={order} />
                  </td>
                  <td className="px-4 py-3.5 text-13 font-medium text-gray-700 dark:text-white/70 whitespace-nowrap">
                    {order.payment_label_ar || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-left">
                    <Link
                      href={`/home/orders/${order.id}?from=${encodeURIComponent(
                        `/home/users/${clientId}?from=${encodeURIComponent(backUrl)}`
                      )}`}
                      className={cn(
                        "inline-flex items-center justify-center h-8 px-3.5 rounded-full border text-xs font-bold transition-colors",
                        "border-brand-dark/25 bg-[#E8F5F1] text-brand-dark hover:bg-brand-dark hover:text-white",
                        "dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white"
                      )}
                    >
                      فتح
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalOrders > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[#EEF1F0] dark:border-white/[0.06] text-13">
          <div className="text-status-neutral dark:text-white/45 font-medium">
            يعرض {ordersStart}-{ordersEnd} من {totalOrders} طلب
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={ordersPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 text-gray-700 dark:text-white/70 font-medium hover:text-brand-dark dark:hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-gray-700 dark:disabled:hover:text-white/70 transition-colors"
            >
              <ChevronRight className="size-3.5" />
              السابق
            </button>

            <span className="min-w-12 text-center tabular-nums text-gray-900 dark:text-white font-semibold">
              {ordersPage}/{ordersLastPage}
            </span>

            <button
              type="button"
              disabled={ordersPage >= ordersLastPage}
              onClick={() => setCurrentPage((p) => Math.min(ordersLastPage, p + 1))}
              className="inline-flex items-center gap-1 text-gray-700 dark:text-white/70 font-medium hover:text-brand-dark dark:hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-gray-700 dark:disabled:hover:text-white/70 transition-colors"
            >
              التالي
              <ChevronLeft className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
