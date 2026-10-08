"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, PanelLeft, RefreshCw, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { useDeleteLessorChangeRequest, useLessorChangeList } from "@/src/hooks/use-lessor-change";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LessorChangeDetailsDialog from "./lessor-change-details-dialog";
import {
  LESSOR_CHANGE_SEARCH_PLACEHOLDER,
  LessorChangeStatusBadge,
  formatDob,
  formatFee,
  platformLabel,
} from "./lessor-change-shared";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const COLUMNS = 9;

const TH =
  "px-3 py-3.5 text-xs font-semibold text-gray-400 dark:text-white/45 border-b border-[#EEF1F0] dark:border-white/[0.08] whitespace-nowrap";

function StatusTab({ active, label, count, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-[12.5px] font-bold transition-colors",
        active
          ? "border-brand-dark bg-brand-dark text-white dark:border-emerald-500 dark:bg-emerald-600"
          : "border-[#D8E7E0] bg-white text-[#4A5B54] hover:bg-[#F3F8F6] dark:border-white/10 dark:bg-[#0F1C16] dark:text-white/70 dark:hover:bg-white/[0.06]"
      )}
    >
      {color ? (
        <span className="size-2 rounded-full" style={{ backgroundColor: active ? "#fff" : color }} aria-hidden />
      ) : null}
      {label}
      <span
        className={cn(
          "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] font-black tabular-nums",
          active ? "bg-white/20 text-white" : "bg-[#EEF1F0] text-[#4B5563] dark:bg-white/10 dark:text-white/70"
        )}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

export default function LessorChangeWrapper() {
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const { can, isReady } = usePermissions();
  const canDelete = isReady && can(PERMISSION_SECTIONS.lessor_change, "delete");

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const pageResetKey = JSON.stringify([searchQuery, status, pageSize]);
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setCurrentPage(1);
  }

  const { items, statuses, counts, meta, isLoading, isFetching, isError, refetch } =
    useLessorChangeList({ page: currentPage, perPage: pageSize, status, search: searchQuery });

  const deleteMutation = useDeleteLessorChangeRequest();

  const totalAll = Object.values(counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const total = meta.total;
  const lastPage = Math.max(1, meta.lastPage);
  const page = Math.min(currentPage, lastPage);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex min-h-full flex-col gap-5 transition-colors" dir="rtl">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "طي القائمة الجانبية" : "توسيع القائمة الجانبية"}
          aria-expanded={isSidebarOpen}
          className={cn(
            "inline-flex size-[42px] shrink-0 items-center justify-center rounded-full border transition-colors",
            "border-[#E4EBE8] bg-white text-[#4B5563] hover:bg-[#E8F5F1] hover:text-brand-dark",
            "dark:border-white/10 dark:bg-[#0F1C16] dark:text-white/70 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
          )}
        >
          <PanelLeft className="size-[18px]" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-22 font-bold leading-tight text-gray-900 dark:text-white">
            طلبات تغيير المؤجر
          </h1>
          <p className="text-13 font-medium leading-relaxed text-gray-400 dark:text-white/45">
            طلبات نقل العقود من صك قديم إلى صك جديد — اضغط «عرض» لمراجعة الصور وتحديث الحالة
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "inline-flex h-[42px] shrink-0 items-center gap-2 rounded-full border px-4 text-13 font-bold transition-colors",
            "border-[#E5E7EB] bg-white text-gray-700 hover:bg-[#F9FAFB] disabled:opacity-60",
            "dark:border-white/[0.1] dark:bg-card dark:text-white/80 dark:hover:bg-white/[0.06]"
          )}
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          تحديث
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusTab active={status === ""} label="الكل" count={totalAll} onClick={() => setStatus("")} />
        {statuses.map((item) => (
          <StatusTab
            key={item.value}
            active={status === item.value}
            label={item.label}
            color={item.color}
            count={counts[item.value]}
            onClick={() => setStatus(item.value)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-gray-400 dark:text-white/35" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={LESSOR_CHANGE_SEARCH_PLACEHOLDER}
          className={cn(
            "h-[44px] w-full rounded-xl border pl-4 pr-11 text-13 transition-all",
            "border-[#E5E7EB] bg-white text-gray-900 placeholder:text-gray-400",
            "focus:border-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-dark/10",
            "dark:border-white/[0.1] dark:bg-[#0F1C16] dark:text-white dark:placeholder:text-white/35",
            "dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/15"
          )}
        />
      </div>

      {/* Pagination bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-13">
        <div className="inline-flex items-center gap-2 font-medium text-status-neutral dark:text-white/45">
          {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
          يعرض {start}-{end} من {total} طلب
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 font-medium text-gray-700 transition-colors hover:text-brand-dark disabled:opacity-40 dark:text-white/70 dark:hover:text-emerald-300"
          >
            <ChevronRight className="size-3.5" />
            السابق
          </button>
          <span className="min-w-12 text-center font-semibold tabular-nums text-gray-900 dark:text-white">
            {page}/{lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
            className="inline-flex items-center gap-1 font-medium text-gray-700 transition-colors hover:text-brand-dark disabled:opacity-40 dark:text-white/70 dark:hover:text-emerald-300"
          >
            التالي
            <ChevronLeft className="size-3.5" />
          </button>

          <div className="mr-1 flex items-center gap-1.5">
            <span className="font-medium text-status-neutral dark:text-white/45">يعرض</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger
                className={cn(
                  "h-8 w-[72px] gap-1 rounded-lg border px-2.5 text-xs font-semibold shadow-none focus:ring-1 focus:ring-offset-0",
                  "border-[#E5E7EB] bg-white text-gray-900 focus:border-brand-dark focus:ring-brand-dark/20",
                  "dark:border-white/[0.1] dark:bg-[#0F1C16] dark:text-white dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/20"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl" className="min-w-[72px] dark:border-white/[0.1] dark:bg-[#0F1C16]">
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs font-semibold dark:focus:bg-white/[0.06]">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={cn(
          "w-full overflow-x-auto rounded-2xl border transition-colors",
          "border-[#E8EEEC] bg-white shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
          "dark:border-white/[0.08] dark:bg-[#0F1C16] dark:shadow-none"
        )}
      >
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-[#F8FAF9] dark:bg-card">
              <th className={cn(TH, "px-4 text-right")}>رقم الطلب</th>
              <th className={cn(TH, "text-right")}>الجوال</th>
              <th className={cn(TH, "text-right")}>هوية المالك الجديد</th>
              <th className={cn(TH, "text-right")}>تاريخ الميلاد</th>
              <th className={cn(TH, "text-center")}>الرسوم</th>
              <th className={cn(TH, "text-center")}>الحالة</th>
              <th className={cn(TH, "text-center")}>المنصة</th>
              <th className={cn(TH, "text-right")}>التاريخ</th>
              <th className={cn(TH, "text-center")}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`lc-skel-${rowIndex}`}>
                  {Array.from({ length: COLUMNS }).map((__, colIndex) => (
                    <td
                      key={`lc-skel-${rowIndex}-${colIndex}`}
                      className="border-b border-[#F0F0ED] px-3 py-3.5 dark:border-white/[0.06]"
                    >
                      <div
                        className="mx-auto h-3.5 animate-pulse rounded-md bg-[#EEF1F0] dark:bg-white/[0.06]"
                        style={{ width: `${50 + ((rowIndex + colIndex) % 5) * 8}%`, opacity: 1 - rowIndex * 0.07 }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={COLUMNS} className="py-16 text-center text-13 font-medium text-[#FA5252]">
                  تعذر تحميل طلبات تغيير المؤجر من الخادم
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS} className="py-16 text-center text-13 font-medium text-gray-400 dark:text-white/35">
                  لا توجد طلبات مطابقة
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-status-neutral-bg transition-colors last:border-0 hover:bg-[#F8FAF9]/80 dark:border-white/[0.05] dark:hover:bg-white/[0.04]"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-13 font-bold tabular-nums text-brand-dark dark:text-emerald-300">
                    #{row.order_number ?? row.uuid ?? row.id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-13 font-medium tabular-nums text-gray-700 dark:text-white/70" dir="ltr">
                    {formatSaudiMobileDisplay(row.mobile) || row.mobile || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-13 font-semibold tabular-nums text-gray-900 dark:text-white" dir="ltr">
                    {row.new_owner_id_number || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-13 font-medium tabular-nums text-gray-700 dark:text-white/70">
                    {formatDob(row)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-center text-13 font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatFee(row.fee)}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <LessorChangeStatusBadge status={row.status} label={row.status_label} color={row.status_color} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-center text-13 font-medium text-gray-700 dark:text-white/70">
                    {platformLabel(row.platform)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-13 font-medium tabular-nums text-gray-700 dark:text-white/70" dir="ltr">
                    {row.created_at || "—"}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "inline-flex h-8 items-center justify-center rounded-full border px-3.5 text-xs font-bold transition-colors",
                          "border-brand-dark/25 bg-[#E8F5F1] text-brand-dark hover:bg-brand-dark hover:text-white",
                          "dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white"
                        )}
                      >
                        عرض
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          title="حذف الطلب"
                          aria-label="حذف الطلب"
                          className="inline-flex size-8 items-center justify-center rounded-full border border-[#FECACA] bg-[#FFF5F5] text-[#B91C1C] transition-colors hover:bg-[#B91C1C] hover:text-white dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LessorChangeDetailsDialog
        requestId={selectedId}
        statuses={statuses}
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف طلب تغيير المؤجر"
        description={
          deleteTarget
            ? `سيتم حذف الطلب #${deleteTarget.order_number ?? deleteTarget.id} ولن يظهر في القائمة. هل أنت متأكد؟`
            : ""
        }
        confirmLabel="حذف"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
      />
    </div>
  );
}
