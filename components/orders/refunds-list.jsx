"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRefundsList } from "@/src/hooks/use-refunds";
import { formatJourneyTime } from "@/src/lib/order-journey";

function Minus({ value }) {
  return (
    <>
      <bdi dir="ltr">−{Number(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</bdi> ر.س
    </>
  );
}

function sar(n) {
  return `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;
}

const STATUS_FILTERS = [
  { id: "", label: "الكل" },
  { id: "succeeded", label: "تم الاسترجاع" },
  { id: "failed", label: "فشل" },
  { id: "pending", label: "قيد التنفيذ" },
];

const STATUS_CLS = {
  succeeded: "bg-[#E3F4EA] text-[#0B7A4C] dark:bg-emerald-500/15 dark:text-emerald-300",
  failed: "bg-[#FDECEC] text-[#B42318] dark:bg-red-500/15 dark:text-red-300",
  pending: "bg-[#FFF4DE] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300",
};

/** «المرتجعات» (د9): عمليات الاسترجاع عبر Moyasar من GET /admin/payments/refunds. */
export default function RefundsList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);
  const resetKey = `${status}|${debounced}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setPage(1);
  }

  const { items, summary, pagination, isLoading, isError } = useRefundsList({ page, status, search: debounced });
  const lastPage = pagination?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "إجمالي المسترجع", value: sar(summary?.succeeded_total) },
          { label: "عمليات ناجحة", value: summary?.succeeded_count ?? "—" },
          { label: "عمليات فاشلة", value: summary?.failed_count ?? "—", danger: (summary?.failed_count ?? 0) > 0 },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-brand-line bg-white px-4 py-3 dark:bg-[#0F1C16] dark:border-white/10">
            <p className="text-[12px] font-semibold text-[#6B7570] dark:text-white/50">{card.label}</p>
            <p className={cn("mt-1 text-[22px] font-extrabold tabular-nums", card.danger ? "text-[#B42318]" : "text-[#0E1F18] dark:text-white")}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A958F]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب"
            className="h-10 w-full rounded-xl border border-brand-line bg-white pr-9 pl-3 text-[13px] dark:bg-white/[0.04] dark:border-white/10"
          />
        </div>
        <div className="inline-flex rounded-full border border-brand-line bg-white p-0.5 dark:bg-white/[0.04] dark:border-white/10">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                "h-8 px-3 rounded-full text-[12px] font-bold",
                status === f.id ? "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300" : "text-[#4B5753] dark:text-white/60"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white dark:bg-[#0F1C16] dark:border-white/10">
        <table className="w-full min-w-[760px] text-right">
          <thead>
            <tr className="bg-[#FAFCFB] text-[12px] font-bold text-[#6B7570] dark:bg-white/[0.03] dark:text-white/50">
              {["الطلب", "المبلغ", "الحالة", "السبب", "الموظف", "التاريخ"].map((h) => (
                <th key={h} className="px-4 py-3 border-b border-brand-line dark:border-white/10">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#8A958F]">جاري التحميل…</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#B42318]">تعذّر تحميل المرتجعات</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Undo2 className="mx-auto mb-2 size-6 text-[#B5C0BB]" />
                  <p className="text-[13px] font-bold text-[#6B7570]">لا توجد عمليات استرجاع</p>
                  <p className="text-[12px] text-[#8A958F]">الاسترجاع يتم من صفحة الطلب ← «استرجاع المبلغ».</p>
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-brand-line/70 last:border-0 text-[13px] dark:border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/home/orders/${r.contract_id}?from=${encodeURIComponent("/home/return-orders")}`} className="font-extrabold text-brand-deep hover:underline tabular-nums dark:text-emerald-300">
                      #{r.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-extrabold tabular-nums text-[#B42318] dark:text-red-300"><Minus value={r.amount} /></td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-bold", STATUS_CLS[r.status] ?? STATUS_CLS.pending)}>
                      {r.status_label || r.status}
                    </span>
                    {r.failure_message ? <p className="mt-1 text-[11px] text-[#B42318]">{r.failure_message}</p> : null}
                  </td>
                  <td className="px-4 py-3 max-w-[280px] text-[#33403B] dark:text-white/70">{r.reason}</td>
                  <td className="px-4 py-3 text-[#33403B] dark:text-white/70">{r.employee_name || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B7570] tabular-nums" dir="ltr">{formatJourneyTime(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center justify-center gap-3 text-[13px]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="font-bold disabled:opacity-40">السابق</button>
          <span dir="ltr" className="tabular-nums">{page} / {lastPage}</span>
          <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="font-bold disabled:opacity-40">التالي</button>
        </div>
      ) : null}
    </div>
  );
}
