"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  PanelLeft,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { useClientsList } from "@/src/hooks/use-clients";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { exportClientsCsv } from "./clients-csv";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const TH =
  "px-3 py-3.5 text-xs font-semibold text-gray-400 dark:text-white/45 border-b border-[#EEF1F0] dark:border-white/[0.08] whitespace-nowrap";

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function splitDateTime(iso) {
  if (!iso) return { time: "—", date: "—" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: "—", date: String(iso) };
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-CA");
  return { time, date };
}

function CountBadge({ value, tone = "muted" }) {
  const n = Number(value) || 0;
  if (n === 0) {
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] text-13 font-medium text-gray-400 dark:text-white/35">
        0
      </span>
    );
  }

  const tones = {
    completed:
      "bg-[#DCFCE7] text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    draft:
      "bg-[#FEF3C7] text-[#B45309] dark:bg-amber-500/20 dark:text-amber-300",
    property:
      "bg-[#F5E6D3] text-[#92400E] dark:bg-amber-700/25 dark:text-amber-200",
    muted:
      "bg-status-neutral-bg text-[#4B5563] dark:bg-white/10 dark:text-white/70",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-7 rounded-full text-xs font-bold tabular-nums",
        tones[tone] || tones.muted
      )}
    >
      {n}
    </span>
  );
}

function MoneyPill({ value }) {
  const n = Number(value) || 0;
  if (n === 0) {
    return (
      <span className="text-13 font-medium text-gray-400 dark:text-white/35 tabular-nums">
        0.00
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#DCFCE7] text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-bold tabular-nums whitespace-nowrap">
      {formatMoney(n)}
    </span>
  );
}

export default function ClientsWrapper() {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  // Matches design.html custSort default: newest join first
  const [joinedSortDir, setJoinedSortDir] = useState("desc");

  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput.trim()), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const pageResetKey = JSON.stringify([searchQuery, pageSize]);
  const [prevPageResetKey, setPrevPageResetKey] = useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setCurrentPage(1);
  }

  const { rows, meta, summary, isLoading, isFetching, isError } = useClientsList({
    page: currentPage,
    perPage: pageSize,
    search: searchQuery,
  });

  const sortedRows = useMemo(() => {
    const dir = joinedSortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const at = a?.joinedAt ? new Date(a.joinedAt).getTime() : NaN;
      const bt = b?.joinedAt ? new Date(b.joinedAt).getTime() : NaN;
      const aMissing = !Number.isFinite(at);
      const bMissing = !Number.isFinite(bt);
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      return (at - bt) * dir;
    });
  }, [rows, joinedSortDir]);

  const JoinedSortIcon = joinedSortDir === "asc" ? ArrowUp : ArrowDown;

  const statCards = summary
    ? [
        { key: "total", value: summary.total_customers, label: summary.total_customers_label, bar: "#10B981" },
        { key: "website", value: summary.website_customers, label: summary.website_customers_label, bar: "#0A4D33" },
        { key: "google_play", value: summary.google_play_customers, label: summary.google_play_customers_label, bar: "#3B82F6" },
        { key: "apple_store", value: summary.apple_store_customers, label: summary.apple_store_customers_label, bar: "#6B7280" },
        { key: "banned", value: summary.banned, label: summary.banned_label, bar: "#F97316" },
      ]
    : [];

  const total = meta.total;
  const lastPage = Math.max(1, meta.lastPage);
  const page = Math.min(currentPage, lastPage);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const handleExport = () => {
    exportClientsCsv(rows);
  };

  return (
    <div className="flex flex-col gap-5 min-h-full transition-colors" dir="rtl">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "طي القائمة الجانبية" : "توسيع القائمة الجانبية"}
          aria-expanded={isSidebarOpen}
          className={cn(
            "inline-flex items-center justify-center size-[42px] rounded-full border shrink-0 transition-colors",
            "border-[#E4EBE8] bg-white text-[#4B5563] hover:bg-[#E8F5F1] hover:text-brand-dark",
            "dark:border-white/10 dark:bg-[#0F1C16] dark:text-white/70 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
          )}
        >
          <PanelLeft className="size-[18px]" />
        </button>

        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-status-neutral dark:text-white/50 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
          >
            <ChevronLeft className="size-4 shrink-0" />
            رجوع
          </button>

          <div>
            <h1 className="text-22 font-bold text-gray-900 dark:text-white leading-tight mb-1">
              العملاء
            </h1>
            <p className="text-13 text-gray-400 dark:text-white/45 font-medium leading-relaxed">
              كل عملاء «عقدي» - اضغط «عرض» لملف العميل الكامل
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {statCards.length > 0 ? (
        <div className="grid grid-cols-5 gap-3 max-[1200px]:grid-cols-3 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1">
          {statCards.map((card) => (
            <div
              key={card.key}
              className={cn(
                "relative overflow-hidden rounded-2xl border transition-colors",
                "bg-white border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.05)]",
                "dark:bg-card dark:border-white/[0.08] dark:shadow-none"
              )}
            >
              <span
                aria-hidden
                className="absolute inset-y-2 right-0 w-[4px] rounded-full"
                style={{ backgroundColor: card.bar }}
              />
              <div className="px-4 py-4 text-center">
                <div className="text-[28px] font-black tabular-nums text-gray-900 dark:text-white leading-none mb-2">
                  {card.value ?? 0}
                </div>
                <div className="text-xs font-medium text-status-neutral dark:text-white/50 whitespace-nowrap">
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Search + export */}
      <div className="flex items-center gap-3 max-[640px]:flex-col max-[640px]:items-stretch">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-[18px] text-gray-400 dark:text-white/35 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالاسم أو الجوال..."
            className={cn(
              "w-full h-[44px] rounded-xl border pr-11 pl-4 text-13 transition-all",
              "bg-white border-[#E5E7EB] text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10",
              "dark:bg-[#0F1C16] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/35",
              "dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/15"
            )}
          />
        </div>

        <button
          type="button"
          onClick={handleExport}
          className={cn(
            "h-[44px] px-4 rounded-xl border text-13 font-bold inline-flex items-center justify-center gap-2 transition-colors shrink-0",
            "bg-white border-[#E5E7EB] text-gray-700 hover:bg-[#F9FAFB]",
            "dark:bg-card dark:border-white/[0.1] dark:text-white/80 dark:hover:bg-white/[0.06]"
          )}
        >
          <Download className="size-4" />
          <span>تصدير الصفحة الحالية</span>
        </button>
      </div>

      {/* Pagination bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-13">
        <div className="text-status-neutral dark:text-white/45 font-medium inline-flex items-center gap-2">
          {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
          يعرض {start}-{end} من {total} عميل
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 text-gray-700 dark:text-white/70 font-medium hover:text-brand-dark dark:hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-gray-700 dark:disabled:hover:text-white/70 transition-colors"
          >
            <ChevronRight className="size-3.5" />
            السابق
          </button>

          <span className="min-w-12 text-center tabular-nums text-gray-900 dark:text-white font-semibold">
            <span dir="ltr">{page} / {lastPage}</span>
          </span>

          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
            className="inline-flex items-center gap-1 text-gray-700 dark:text-white/70 font-medium hover:text-brand-dark dark:hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-gray-700 dark:disabled:hover:text-white/70 transition-colors"
          >
            التالي
            <ChevronLeft className="size-3.5" />
          </button>

          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-status-neutral dark:text-white/45 font-medium">
              يعرض
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger
                className={cn(
                  "h-8 w-[72px] rounded-lg border px-2.5 text-xs font-semibold gap-1 shadow-none focus:ring-1 focus:ring-offset-0",
                  "bg-white border-[#E5E7EB] text-gray-900 focus:border-brand-dark focus:ring-brand-dark/20",
                  "dark:bg-[#0F1C16] dark:border-white/[0.1] dark:text-white dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/20"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="min-w-[72px] dark:bg-[#0F1C16] dark:border-white/[0.1]"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem
                    key={n}
                    value={String(n)}
                    className="text-xs font-semibold dark:focus:bg-white/[0.06]"
                  >
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
          "bg-white border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
          "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
        )}
      >
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#F8FAF9] dark:bg-card">
              <th className={cn(TH, "text-right px-4")}>
                <button
                  type="button"
                  onClick={() =>
                    setJoinedSortDir((d) => (d === "desc" ? "asc" : "desc"))
                  }
                  title="ترتيب حسب تاريخ الانضمام"
                  className={cn(
                    "inline-flex items-center gap-1 transition-colors",
                    "hover:text-[#0B5A3C] dark:hover:text-[#5FD0A8]",
                    "text-[#0B5A3C] dark:text-[#5FD0A8]"
                  )}
                >
                  تاريخ الانضمام
                  <JoinedSortIcon className="size-3 opacity-90" strokeWidth={2.5} />
                </button>
              </th>
              <th className={cn(TH, "text-right")}>رقم العميل</th>
              <th className={cn(TH, "text-right")}>اسم العميل</th>
              <th className={cn(TH, "text-right")}>رقم الجوال</th>
              <th className={cn(TH, "text-center px-2.5")}>الطلبات</th>
              <th className={cn(TH, "text-center px-2.5")}>مدفوعة</th>
              <th className={cn(TH, "text-center px-2.5")}>عقارات</th>
              <th className={cn(TH, "text-center px-2.5")}>وحدات</th>
              <th className={cn(TH, "text-center px-2.5")}>مسترجع</th>
              <th className={cn(TH, "text-center px-2.5")}>مدفوع</th>
              <th className={cn(TH, "text-center px-2.5")}>صافي</th>
              <th className={cn(TH, "text-center")}>عرض</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, rowIndex) => (
                <tr key={`clients-skel-${rowIndex}`}>
                  {Array.from({ length: 12 }).map((__, colIndex) => (
                    <td
                      key={`clients-skel-${rowIndex}-${colIndex}`}
                      className="px-3 py-3.5 border-b border-[#F0F0ED] dark:border-white/[0.06]"
                    >
                      <div
                        className="h-3.5 rounded-md bg-[#EEF1F0] dark:bg-white/[0.06] animate-pulse mx-auto"
                        style={{
                          width: `${50 + ((rowIndex + colIndex) % 5) * 8}%`,
                          opacity: 1 - rowIndex * 0.07,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-16 text-13 text-[#FA5252] font-medium"
                >
                  تعذر تحميل قائمة العملاء من الخادم
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-16 text-13 text-gray-400 dark:text-white/35 font-medium"
                >
                  لا يوجد عملاء مطابقون لبحثك
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const { time, date } = splitDateTime(row.joinedAt);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-status-neutral-bg dark:border-white/[0.05] last:border-0 hover:bg-[#F8FAF9]/80 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-13 font-semibold text-gray-900 dark:text-white tabular-nums leading-none">
                          {time}
                        </span>
                        <span className="text-xs text-status-neutral dark:text-white/45 tabular-nums leading-none">
                          {date}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-13 font-bold text-brand-dark dark:text-emerald-300 tabular-nums whitespace-nowrap">
                      {row.clientCode}
                    </td>

                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className="text-13 font-bold text-gray-900 dark:text-white">
                        {row.name}
                      </span>
                      {row.platformLabel ? (
                        <span className="ms-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#DCFCE7] text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-10 font-bold">
                          {row.platformLabel}
                        </span>
                      ) : null}
                      {row.blocked ? (
                        <span className="ms-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FEE2E2] text-red-600 dark:bg-rose-500/20 dark:text-rose-300 text-10 font-bold">
                          محظور
                        </span>
                      ) : null}
                    </td>

                    <td
                      className="px-3 py-3.5 text-13 font-medium text-gray-700 dark:text-white/70 tabular-nums whitespace-nowrap"
                      dir="ltr"
                    >
                      {formatSaudiMobileDisplay(row.mobile) || row.mobile}
                    </td>

                    <td className="px-2.5 py-3.5 text-center">
                      <CountBadge value={row.ordersCount} tone="completed" />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <CountBadge value={row.completed} tone="draft" />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <CountBadge value={row.properties} tone="property" />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <CountBadge value={row.units} tone="completed" />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <MoneyPill value={row.refundedAmount} />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <MoneyPill value={row.paid} />
                    </td>
                    <td className="px-2.5 py-3.5 text-center">
                      <MoneyPill value={row.net} />
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <Link
                        href={`/home/users/${row.id}?from=${encodeURIComponent("/home/clients")}`}
                        className={cn(
                          "inline-flex items-center justify-center h-8 px-3.5 rounded-full border text-xs font-bold transition-colors",
                          "border-brand-dark/25 bg-[#E8F5F1] text-brand-dark hover:bg-brand-dark hover:text-white",
                          "dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-white"
                        )}
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
