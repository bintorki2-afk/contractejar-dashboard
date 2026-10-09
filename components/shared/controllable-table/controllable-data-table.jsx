"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DENSITY_CELL_CLASS,
  DENSITY_TEXT_CLASS,
  DEFAULT_TABLE_DENSITY,
} from "./density";

function stickySide(sticky) {
  if (sticky === "end") return "end";
  if (sticky === "start" || sticky === true) return "start";
  return null;
}

/**
 * Horizontal sticky columns for RTL tables.
 * Uses physical left/right (design.html) — logical start/end is unreliable on <th>/<td>.
 * border-collapse must NOT be used on the table or sticky breaks in Chromium.
 */
function stickyClasses(side, { isHeader, highlighted } = {}) {
  if (!side) return null;

  // RTL: first col sticks to the right edge; actions stick to the left edge
  const edge =
    side === "end"
      ? "sticky left-0 shadow-[inset_8px_0_8px_-8px_rgba(20,60,45,0.10)]"
      : "sticky right-0 shadow-[inset_-8px_0_8px_-8px_rgba(20,60,45,0.10)]";

  if (isHeader) {
    return cn(
      edge,
      "top-0",
      side === "end" ? "z-40" : "z-30",
      "bg-[#FAFBFB] dark:bg-[#162820]"
    );
  }

  return cn(
    edge,
    side === "end" ? "z-20" : "z-10",
    highlighted
      ? "bg-[#FFFAF0] dark:bg-[#221D0E] group-hover:bg-[#FFF6E4] dark:group-hover:bg-[#282211]"
      : "bg-white dark:bg-[#0F1C16] group-hover:bg-[#F7FAF9] dark:group-hover:bg-white/[0.06]"
  );
}

function isMissingSortValue(value) {
  return value == null || value === "" || Number.isNaN(value);
}

function compareSortValues(a, b, direction) {
  const aMissing = isMissingSortValue(a);
  const bMissing = isMissingSortValue(b);
  if (aMissing && bMissing) return 0;
  // Missing values first — needs immediate action (matches design.html)
  if (aMissing) return -1;
  if (bMissing) return 1;

  let result = 0;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else if (typeof a === "string" && typeof b === "string") {
    result = a.localeCompare(b, "ar");
  } else {
    result = String(a).localeCompare(String(b), "ar");
  }

  return direction === "desc" ? -result : result;
}

function SortableHeaderButton({ label, active, direction, onClick }) {
  const Icon = !active
    ? ArrowUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      onClick={onClick}
      title="ترتيب"
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        "hover:text-[#0B5A3C] dark:hover:text-[#5FD0A8]",
        active && "text-[#0B5A3C] dark:text-[#5FD0A8]"
      )}
    >
      <span>{label}</span>
      <Icon
        className={cn("size-3 shrink-0", active ? "opacity-90" : "opacity-50")}
        strokeWidth={2.5}
      />
    </button>
  );
}

/**
 * Shared controllable data table — RTL, density-aware padding.
 * Supports column.sticky = true|"start"|"end" for sticky first/last columns.
 * Supports column.sortable + column.getSortValue for client-side sorting.
 */
export default function ControllableDataTable({
  columns = [],
  data = [],
  density = DEFAULT_TABLE_DENSITY,
  isColumnVisible,
  getRowKey = (row, index) => row?.id ?? index,
  onRowClick,
  getRowHighlight,
  activeRowId = null,
  emptyMessage = "لا توجد بيانات متوفرة حالياً",
  isLoading = false,
  className,
  tableClassName,
  defaultSort,
}) {
  const visible = columns.filter((col) =>
    typeof isColumnVisible === "function"
      ? isColumnVisible(col)
      : col.hideable === false || col.visible !== false
  );

  const [sort, setSort] = useState(() => {
    if (defaultSort?.id) {
      return {
        id: defaultSort.id,
        direction: defaultSort.direction === "desc" ? "desc" : "asc",
      };
    }
    return { id: null, direction: "asc" };
  });

  const sortedData = useMemo(() => {
    if (!sort.id) return data;
    const column = columns.find((col) => col.id === sort.id);
    if (!column?.sortable || typeof column.getSortValue !== "function") {
      return data;
    }

    return [...data].sort((left, right) =>
      compareSortValues(
        column.getSortValue(left),
        column.getSortValue(right),
        sort.direction
      )
    );
  }, [columns, data, sort]);

  const handleSort = (column) => {
    if (!column?.sortable) return;
    const nextDefault = column.defaultSortDir === "desc" ? "desc" : "asc";
    setSort((prev) => {
      if (prev.id !== column.id) {
        return { id: column.id, direction: nextDefault };
      }
      return {
        id: column.id,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  const cellPad = DENSITY_CELL_CLASS[density] || DENSITY_CELL_CLASS.compact;
  const textSize = DENSITY_TEXT_CLASS[density] || DENSITY_TEXT_CLASS.compact;

  return (
    <div
      className={cn(
        // design.html .tblwrap — white card, #ECECEA border, 16px radius
        "w-full overflow-x-auto rounded-2xl border",
        "bg-white border-[#ECECEA] shadow-[0_1px_2px_rgba(11,83,69,0.04)]",
        "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none",
        className
      )}
      dir="rtl"
    >
      {/* border-separate required for position:sticky on th/td */}
      <table
        className={cn(
          "w-full border-separate border-spacing-0",
          tableClassName
        )}
      >
        <thead>
          <tr className="bg-[#FAFBFB] dark:bg-[#162820]">
            {visible.map((col) => {
              const side = stickySide(col.sticky);
              const isSorted = sort.id === col.id;
              return (
                <th
                  key={col.id}
                  className={cn(
                    "text-right font-semibold border-b whitespace-nowrap",
                    cellPad,
                    textSize,
                    "text-[#75827C] border-[#F0F0ED]",
                    "dark:text-white/55 dark:border-white/[0.08]",
                    !side && "sticky top-0 z-[5] bg-[#FAFBFB] dark:bg-[#162820]",
                    stickyClasses(side, { isHeader: true }),
                    col.headerClassName
                  )}
                >
                  {col.sortable ? (
                    <SortableHeaderButton
                      label={col.label}
                      active={isSorted}
                      direction={sort.direction}
                      onClick={() => handleSort(col)}
                    />
                  ) : typeof col.header === "function" ? (
                    col.header()
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, rowIndex) => (
              <tr key={`table-skel-${rowIndex}`}>
                {visible.map((col) => (
                  <td
                    key={`${col.id}-${rowIndex}`}
                    className={cn(
                      "border-b border-[#F0F0ED] dark:border-white/[0.06]",
                      cellPad
                    )}
                  >
                    <div
                      className="h-3.5 rounded-md bg-[#EEF1F0] dark:bg-white/[0.06] animate-pulse"
                      style={{
                        width: `${55 + ((rowIndex + String(col.id ?? "").length) % 4) * 10}%`,
                        opacity: 1 - rowIndex * 0.07,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(visible.length, 1)}
                className={cn(
                  "text-center p-12 text-xs font-medium",
                  "text-[#8A8A84] dark:text-white/35"
                )}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const highlighted = getRowHighlight?.(row);
              const isActive = activeRowId != null && String(row?.id) === String(activeRowId);
              return (
                <tr
                  key={getRowKey(row, index)}
                  data-row-id={row?.id ?? undefined}
                  aria-selected={isActive || undefined}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "group transition-colors",
                    isActive && "outline outline-2 -outline-offset-2 outline-brand-green/70",
                    highlighted
                      ? "bg-[#FFFAF0] dark:bg-[#221D0E]"
                      : "bg-white dark:bg-transparent",
                    onRowClick && "cursor-pointer",
                    highlighted
                      ? "hover:bg-[#FFF6E4] dark:hover:bg-[#282211]"
                      : "hover:bg-[#F7FAF9] dark:hover:bg-white/[0.06]"
                  )}
                  style={
                    highlighted
                      ? { boxShadow: "inset -3px 0 0 #E0B25C" }
                      : undefined
                  }
                >
                  {visible.map((col) => {
                    const side = stickySide(col.sticky);
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          cellPad,
                          textSize,
                          "text-[#22302C] dark:text-white/90",
                          "border-b border-[#F6F6F4] dark:border-white/[0.04]",
                          stickyClasses(side, { highlighted }),
                          col.cellClassName
                        )}
                        onClick={
                          col.stopRowClick
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {col.cell?.(row, index)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
