"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CreditCard,
  Filter,
  Link2,
  PanelLeft,
  Search,
  Settings2,
  Tags,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSettingsPopover } from "@/components/shared/controllable-table";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { SECTION_NOTE, STATUS_FILTER_PILLS } from "./mock-data";
import MoreFiltersPopover from "./more-filters-popover";
import { RT } from "./theme";

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const PILL_ACTIVE_COLOR = {
  authenticated: RT.success,
  done: RT.success,
  canceled: RT.danger,
  cancelled: RT.danger,
  returned: RT.refunded,
  incomplete: RT.warning,
};

const SECTION_TONE = {
  authenticated: {
    title: "text-[#0B7A4C] dark:text-emerald-300",
    count: "bg-[#E4F3EC] text-[#0B7A4C] dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  canceled: {
    title: "text-[#B3472A] dark:text-red-300",
    count: "bg-[#F7E7E1] text-[#B3472A] dark:bg-red-500/15 dark:text-red-300",
  },
  returned: {
    title: "text-[#557086] dark:text-slate-300",
    count: "bg-[#E9EEF3] text-[#557086] dark:bg-slate-500/20 dark:text-slate-300",
  },
  incomplete: {
    title: "text-[#9A6100] dark:text-amber-300",
    count: "bg-[#FFF3DE] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300",
  },
};

const WEEKDAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function formatDateTime(date) {
  const day = WEEKDAYS_AR[date.getDay()];
  const d = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const t = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { day, stamp: `${d} - ${t}`, timeOnly: t };
}

function SectionHead({
  section,
  count,
  onClose,
  dark = false,
}) {
  if (!section) return null;
  const tone = SECTION_TONE[section.id] ?? SECTION_TONE.returned;
  const title = section.sectionTitle ?? section.label;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[14px] border px-3.5 py-2.5",
        dark
          ? "bg-[#13251E] border-[#26473A]"
          : "bg-white border-[#ECECEA]"
      )}
      dir="rtl"
    >
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12.5px] font-bold transition-colors shrink-0",
          dark
            ? "border-white/10 text-white/80 hover:bg-white/10"
            : "border-[#E3E8E6] text-[#33403B] bg-white hover:bg-[#F7FAF9]"
        )}
      >
        <ArrowRight className="size-3.5" strokeWidth={2.2} />
        الطلبات مباشر
      </button>

      <div className="flex items-center gap-2.5 min-w-0">
        <b className={cn("text-[15px] font-extrabold truncate", tone.title)}>{title}</b>
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-6 h-[22px] px-2 rounded-full text-xs font-extrabold tabular-nums",
            tone.count
          )}
        >
          {count ?? 0}
        </span>
      </div>

      <span
        className={cn(
          "ms-auto text-[10.5px] font-bold shrink-0 hidden sm:inline",
          dark ? "text-[#7E9A8F]" : "text-[#98A39E]"
        )}
      >
        {SECTION_NOTE}
      </span>
    </div>
  );
}

export default function RealtimeOrdersToolbar({
  searchQuery,
  onSearchChange,
  activeFilters = [],
  onToggleFilter,
  filterPills = STATUS_FILTER_PILLS,
  extraStatuses = [],
  extraStatusId,
  onExtraStatusChange,
  contractType,
  onContractTypeChange,
  filtersOpen = false,
  onToggleFilters,
  hasActiveFilters = false,
  columns,
  density,
  onDensityChange,
  visibleColumns,
  onToggleColumn,
  onExport,
  isExporting = false,
  canExport = true,
  dark = false,
  onOpenPaymentLink,
  title = "الطلبات مباشر",
  searchPlaceholder = "بحث: رقم الطلب / الجوال / الاسم…",
  canManageStatuses = false,
  onManageStatuses,
  activeSection = null,
  sectionCount = 0,
  onCloseSection,
  headerKpis = null,
}) {
  const now = useLiveClock();
  const { day, stamp, timeOnly } = formatDateTime(now);
  const {
    displayedPart,
    setDisplayedPart,
    isSidebarOpen,
    toggleSidebar,
  } = useSidebarStore();

  const useInlineFilters = typeof onToggleFilters === "function";

  const openNotifications = () => {
    if (displayedPart === "notification") {
      setDisplayedPart("default");
    } else {
      setDisplayedPart("notification");
    }
  };

  const openPayments = () => {
    if (displayedPart === "payments") {
      setDisplayedPart("default");
    } else {
      setDisplayedPart("payments");
    }
  };

  // Matches design.html .fbtn/.bell — 40px icon buttons
  const roundBtn = cn(
    "size-10 rounded-xl flex items-center justify-center transition-all shrink-0 border relative",
    dark
      ? "border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/[0.1]"
      : "border-[#E3E8E6] bg-white text-[#33403B] hover:border-[#CDEBDF] hover:text-[#0B5A3C]"
  );

  const toolbarControls = (
    <>
      {!headerKpis
        ? filterPills.map((pill) => {
            const active = activeFilters.includes(pill.id);
            const Icon = pill.Icon;
            const activeColor = PILL_ACTIVE_COLOR[pill.id] || RT.brand;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onToggleFilter?.(pill.id)}
                title={pill.sectionTitle ?? pill.label}
                className={cn(
                  "h-10 px-3 rounded-xl text-[11px] font-extrabold border transition-all flex items-center gap-1.5 whitespace-nowrap",
                  active
                    ? "text-white border-transparent shadow-sm"
                    : dark
                      ? "border-[#28453A] bg-[#132620] text-[#C4D8D0] hover:bg-[#1A332B]"
                      : "border-[#E3E8E6] bg-white text-[#33403B] hover:border-[#CFD6D2] hover:bg-[#F7FAF9]"
                )}
                style={active ? { backgroundColor: activeColor } : undefined}
              >
                <Icon className="size-3.5" strokeWidth={2} />
                {pill.label}
              </button>
            );
          })
        : null}

      <div className="relative min-w-[180px] max-w-[320px] flex-1">
        <Search
          className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2 size-[14px]",
            dark ? "text-white/35" : "text-[#8A8A84]"
          )}
        />
        <input
          type="text"
          data-orders-search
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            "w-full h-10 rounded-xl pr-9 pl-9 text-[11px] font-bold transition-colors focus:outline-none",
            dark
              ? "bg-[#132620] border border-[#28453A] text-white placeholder:text-white/30 focus:border-[#34D399]/40"
              : "bg-white border border-[#E3E8E6] text-[#22302C] placeholder:text-[#8A8A84] focus:border-[#0B5A3C]"
          )}
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            aria-label="مسح البحث"
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center",
              dark
                ? "text-white/40 hover:bg-white/10"
                : "text-gray-400 hover:bg-[#E5E7EB]"
            )}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <TableSettingsPopover
        columns={columns}
        density={density}
        onDensityChange={onDensityChange}
        visibleColumns={visibleColumns}
        onToggleColumn={onToggleColumn}
        align="end"
        triggerClassName={roundBtn}
        TriggerIcon={Settings2}
      />

      {useInlineFilters ? (
        <button
          type="button"
          onClick={onToggleFilters}
          aria-label="فلاتر"
          title="فلاتر"
          className={cn(
            roundBtn,
            filtersOpen && "!bg-[#0B5A3C] !text-white !border-[#0B5A3C]"
          )}
        >
          <Filter className="size-[16px]" />
          {hasActiveFilters ? (
            <span className="absolute top-1.5 left-1.5 size-2 rounded-full bg-[#EF4444] border-2 border-white dark:border-[#0B1411]" />
          ) : null}
        </button>
      ) : (
        <MoreFiltersPopover
          statuses={extraStatuses}
          extraStatusId={extraStatusId}
          onExtraStatusChange={onExtraStatusChange}
          contractType={contractType}
          onContractTypeChange={onContractTypeChange}
          triggerClassName={roundBtn}
          dark={dark}
        />
      )}

      {canManageStatuses ? (
        <button
          type="button"
          onClick={onManageStatuses}
          aria-label="إدارة الحالات"
          title="إدارة الحالات"
          className={roundBtn}
        >
          <Tags className="size-[16px]" />
        </button>
      ) : null}

      {canExport ? (
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className={cn(
            "h-10 px-3.5 rounded-xl border font-extrabold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-60",
            dark
              ? "border-[#28453A] bg-[#132620] text-[#C4D8D0] hover:bg-[#1A332B]"
              : "border-[#E3E8E6] text-[#33403B] bg-white hover:border-[#CDEBDF] hover:text-[#0B5A3C]"
          )}
        >
          {isExporting ? "جاري التصدير..." : "تصدير Excel"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={openNotifications}
        aria-label="الإشعارات"
        title="الإشعارات"
        className={cn(
          roundBtn,
          displayedPart === "notification" &&
            "!bg-[#0B5A3C] !text-white !border-[#0B5A3C]"
        )}
      >
        <Bell className="size-[16px]" />
      </button>

      {/* أزرار الدفع (إشعارات الدفع + رابط دفع واتساب) مخفية — بوابة الدفع غير مفعّلة لعقد إيجار.
          لإعادة تفعيلها لاحقًا: غيّر false إلى true. */}
      {false && (
        <>
          <button
            type="button"
            onClick={openPayments}
            aria-label="إشعارات الدفع"
            title="إشعارات الدفع"
            className={cn(
              roundBtn,
              displayedPart === "payments" &&
                "!bg-[#0B5A3C] !text-white !border-[#0B5A3C]"
            )}
          >
            <CreditCard className="size-[16px]" />
          </button>

          <button
            type="button"
            onClick={() => onOpenPaymentLink?.()}
            aria-label="توليد رابط دفع — طلب واتساب"
            title="توليد رابط دفع — طلب واتساب"
            className={roundBtn}
          >
            <Link2 className="size-[16px]" />
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3.5" dir="rtl">
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "طي القائمة الجانبية" : "توسيع القائمة الجانبية"}
            aria-expanded={isSidebarOpen}
            className={cn(roundBtn, "hidden max-[1200px]:flex")}
          >
            <PanelLeft className="size-[18px]" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className={cn(
                  "text-lg font-extrabold leading-none tracking-tight",
                  dark ? "text-[#E9F4EF]" : "text-[#22302C]"
                )}
              >
                {title}
              </h1>

              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-[7px] py-0.5 text-[8.5px] font-extrabold",
                  dark
                    ? "bg-[#14312A] border-[#245844] text-[#5FD0A8]"
                    : "bg-[#E7F5EF] border-[#CFE9DE] text-[#0E7A5C]"
                )}
                title="آخر مزامنة تلقائية"
              >
                <span className="relative flex size-[7px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FA46F] opacity-50" />
                  <span className="relative inline-flex rounded-full size-[7px] bg-[#2FA46F]" />
                </span>
                مُزامن
                <span className="opacity-80">•</span>
                <span className="tabular-nums font-bold">{timeOnly}</span>
              </span>
            </div>

            <p
              className={cn(
                "mt-1.5 text-[11px] font-bold tabular-nums",
                dark ? "text-white/45" : "text-[#8A8A84]"
              )}
            >
              {day} {stamp}
            </p>
          </div>
        </div>

        {headerKpis ? (
          headerKpis
        ) : (
          <div className="flex items-center gap-2 flex-wrap">{toolbarControls}</div>
        )}
      </div>

      <SectionHead
        section={activeSection}
        count={sectionCount}
        onClose={onCloseSection}
        dark={dark}
      />
    </div>
  );
}
