"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { usePaymentsList } from "@/src/hooks/use-payments";
import InvoiceStatCards from "./invoice-stat-cards";
import InvoicesFilters from "./invoices-filters";
import InvoicesTable from "./invoices-table";
import InvoicesPagination from "./invoices-pagination";
import InvoicePreviewDialog from "./invoice-preview-dialog";
import { getInvoiceStats } from "./mock-data";
import { exportInvoicesCsv } from "./invoices-csv";

const PAGE_SIZE = 10;

function InvoicesHeader({ onToggleSidebar, isSidebarOpen, onBack }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <button
        type="button"
        onClick={onToggleSidebar}
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

      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-13 font-medium text-gray-400 dark:text-white/45 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors mb-1"
        >
          الطلبات
          <span className="text-[#C4C4C4]">›</span>
        </button>
        <h1 className="text-[24px] font-bold text-gray-900 dark:text-white leading-tight">
          الفواتير
        </h1>
        <p className="mt-1 text-13 font-medium text-gray-400 dark:text-white/45">
          فواتير رسوم توثيق العقود عبر بوابة الدفع
        </p>
      </div>
    </div>
  );
}

export default function InvoicesWrapper() {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { rows, isLoading } = usePaymentsList();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.contractType !== typeFilter) return false;
      if (kindFilter !== "all" && (row.kind || "original") !== kindFilter) return false;
      if (!q) return true;

      return [row.invoiceNo, row.orderNo, row.mobile]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, searchQuery, statusFilter, typeFilter, kindFilter]);

  // Any filter change sends the user back to the first page.
  const filterKey = JSON.stringify([searchQuery, statusFilter, typeFilter, kindFilter]);
  const [pageFilterKey, setPageFilterKey] = useState(filterKey);
  if (pageFilterKey !== filterKey) {
    setPageFilterKey(filterKey);
    setPage(1);
  }

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const stats = useMemo(() => getInvoiceStats(rows), [rows]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.error("لا توجد فواتير لتصديرها");
      return;
    }
    exportInvoicesCsv(filtered);
    toast.success("تم تصدير CSV");
  };

  return (
    <div className="flex flex-col gap-5 min-h-full" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <InvoicesHeader
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          onBack={() => router.push("/home/orders")}
        />
        <InvoiceStatCards stats={stats} />
      </div>

      <div
        className={cn(
          "rounded-2xl border overflow-hidden transition-colors",
          "bg-white border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
          "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
        )}
      >
        <InvoicesFilters
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
          onExport={handleExport}
        />

        <InvoicesTable
          rows={pageRows}
          isLoading={isLoading}
          onSelectInvoice={setSelectedInvoice}
        />

        <div className="border-t border-[#EEF1F0] dark:border-white/[0.08]">
          <InvoicesPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </div>

      <InvoicePreviewDialog
        open={Boolean(selectedInvoice)}
        onOpenChange={(next) => {
          if (!next) setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
}
