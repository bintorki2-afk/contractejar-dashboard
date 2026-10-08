"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RotateCcw, Search, Trash2 } from "lucide-react";
import { axiosInstance } from "@/src/utils/axios";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { formatJourneyTime } from "@/src/lib/order-journey";
import { normalizeAdminSearch } from "@/src/lib/search-term";
import { StatusPill } from "./status-pill";

const SOURCES = {
  orders: {
    label: "الطلبات",
    queryKey: "orders-trash",
    list: "/admin/orders/trash",
    restore: (id) => `/admin/orders/${id}/restore`,
    section: PERMISSION_SECTIONS.all_requests,
  },
  lessor: {
    label: "طلبات تغيير المؤجر",
    queryKey: "lessor-change-trash",
    list: "/admin/lessor-change/trash",
    restore: (id) => `/admin/lessor-change/${id}/restore`,
    section: PERMISSION_SECTIONS.lessor_change,
  },
};

function extract(data) {
  const items = data?.items ?? [];
  const pagination = data?.pagination ?? data?.meta ?? null;
  return { items, pagination, retention: data?.retention_days ?? data?.meta?.retention_days ?? 30 };
}

function daysLeft(item, retention) {
  if (item?.days_left != null) return item.days_left;
  const at = item?.trashed_at ? new Date(item.trashed_at).getTime() : null;
  if (!at) return null;
  return Math.max(0, retention - Math.floor((Date.now() - at) / 86_400_000));
}

function TrashTable({ sourceKey }) {
  const src = SOURCES[sourceKey];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const params = { page, per_page: 20 };
  const term = normalizeAdminSearch(debounced);
  if (term) params.search = term;
  const query = useQuery({
    queryKey: [src.queryKey, params],
    queryFn: async () => (await axiosInstance.get(src.list, { params }))?.data?.data ?? {},
    placeholderData: keepPreviousData,
    retry: (count, err) => err?.response?.status !== 403 && count < 1,
  });
  const { items, pagination, retention } = extract(query.data);
  const lastPage = pagination?.last_page ?? 1;

  const restore = useMutation({
    mutationFn: (id) => axiosInstance.post(src.restore(id)),
    onSuccess: (_r, id) => {
      toast.success("تمت الاستعادة — عاد الطلب إلى القوائم");
      queryClient.invalidateQueries({ queryKey: [src.queryKey] });
      if (sourceKey === "orders") invalidateOrdersCaches(queryClient, { orderId: id });
      else queryClient.invalidateQueries({ queryKey: ["lessor-change"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "تعذرت الاستعادة"),
  });

  if (query.isError && query.error?.response?.status === 403) {
    return <p className="rounded-2xl border border-brand-line bg-white p-8 text-center text-[13px] text-[#6B7570]">ليست لديك صلاحية الحذف/الاستعادة في هذا القسم.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A958F]" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="بحث برقم الطلب / الجوال / الاسم"
          className="h-10 w-full rounded-xl border border-brand-line bg-white pr-9 pl-3 text-[13px] dark:bg-white/[0.04] dark:border-white/10"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white dark:bg-[#0F1C16] dark:border-white/10">
        <table className="w-full min-w-[720px] text-right">
          <thead>
            <tr className="bg-[#FAFCFB] text-[12px] font-bold text-[#6B7570] dark:bg-white/[0.03] dark:text-white/50">
              {["الطلب", "الحالة", "حذفه", "تاريخ الحذف", "المتبقي للاستعادة", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 border-b border-brand-line dark:border-white/10">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#8A958F]">جاري التحميل…</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Trash2 className="mx-auto mb-2 size-6 text-[#B5C0BB]" />
                  <p className="text-[13px] font-bold text-[#6B7570]">السلة فارغة</p>
                  <p className="text-[12px] text-[#8A958F]">العناصر المحذوفة تبقى هنا {retention} يوماً ثم تُحذف نهائياً.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const left = daysLeft(item, retention);
                const restorable = item.restorable !== false && (left == null || left > 0);
                return (
                  <tr key={item.id} className="border-b border-brand-line/70 last:border-0 text-[13px] dark:border-white/5">
                    <td className="px-4 py-3 font-extrabold text-brand-deep tabular-nums dark:text-emerald-300">
                      #{item.uuid ?? item.order_number ?? item.id}
                      {item.user_name || item.owner_name ? (
                        <span className="block text-[11.5px] font-semibold text-[#6B7570]">{item.user_name || item.owner_name}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{item.status_key || item.status ? <StatusPill order={item} /> : "—"}</td>
                    <td className="px-4 py-3 text-[#33403B] dark:text-white/70">{item.deleted_by_name || "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B7570] tabular-nums" dir="ltr">{formatJourneyTime(item.trashed_at) ?? "—"}</td>
                    <td className="px-4 py-3">
                      {left == null ? "—" : (
                        <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-bold tabular-nums", left <= 5 ? "bg-[#FDECEC] text-[#B42318]" : "bg-[#F0F4F2] text-[#4B5753]")}>
                          {left} يوم
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        type="button"
                        disabled={!restorable || restore.isPending}
                        onClick={() => restore.mutate(item.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-deep px-3 text-[12px] font-bold text-white disabled:opacity-50"
                      >
                        {restore.isPending && restore.variables === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                        استعادة
                      </button>
                    </td>
                  </tr>
                );
              })
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

/** «السلة» (د12): الطلبات وطلبات تغيير المؤجر المحذوفة — استعادة خلال 30 يوماً. */
export default function TrashPage() {
  const { can, isAdmin } = usePermissions();
  const tabs = Object.entries(SOURCES)
    .filter(([, src]) => isAdmin || can(src.section, "delete") || can(src.section, "view"))
    .map(([key, src]) => ({ key, label: src.label }));
  const [tab, setTab] = useState(null);
  const active = tab ?? tabs[0]?.key;

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div>
        <h1 className="text-[20px] font-extrabold text-[#0E1F18] dark:text-white">السلة</h1>
        <p className="mt-1 text-[12.5px] text-[#6B7570] dark:text-white/50">
          الطلبات المحذوفة تبقى هنا 30 يوماً ويمكن استعادتها، ثم تُحذف نهائياً تلقائياً.
        </p>
      </div>
      {tabs.length > 1 ? (
        <div role="tablist" className="inline-flex w-fit rounded-xl border border-brand-line bg-white p-1 dark:bg-white/[0.04] dark:border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setTab(t.key)}
              className={cn("h-9 px-4 rounded-lg text-[13px] font-bold", active === t.key ? "bg-brand-deep text-white" : "text-[#4B5753] dark:text-white/60")}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
      {active ? <TrashTable key={active} sourceKey={active} /> : null}
    </div>
  );
}
