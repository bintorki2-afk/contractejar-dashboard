"use client";

import { Checkbox } from "@/components/ui/checkbox";

const CHECKBOX_CLASS =
  "size-4 rounded-[3px] border-[#C4C4C4] shadow-none " +
  "data-[state=checked]:bg-[#0B5A3C] data-[state=checked]:border-[#0B5A3C] data-[state=checked]:text-white " +
  "data-[state=indeterminate]:bg-[#0B5A3C] data-[state=indeterminate]:border-[#0B5A3C] data-[state=indeterminate]:text-white " +
  "dark:border-white/25";

/**
 * Builds a leading checkbox column for `ControllableDataTable`.
 * Selection state is owned by the caller (see `useRowSelection`).
 *
 * @param {object}   opts
 * @param {any[]}    opts.rows            current table rows (for the "select all" header)
 * @param {Set}      opts.selectedIds     currently selected row ids
 * @param {Function} opts.onToggleRow     (id) => void
 * @param {Function} opts.onToggleAll     (ids, checked) => void
 * @param {Function} [opts.isRowSelectable] (row) => boolean — rows that can be selected
 * @param {Function} [opts.getRowId]       (row) => id — defaults to `row.id`
 */
export function makeSelectionColumn({
  rows = [],
  selectedIds,
  onToggleRow,
  onToggleAll,
  isRowSelectable = () => true,
  getRowId = (row) => row?.id,
} = {}) {
  const selectableIds = rows
    .filter((row) => isRowSelectable(row))
    .map((row) => getRowId(row))
    .filter((id) => id != null);

  const total = selectableIds.length;
  const selected = selectableIds.filter((id) => selectedIds?.has(id)).length;
  const allChecked = total > 0 && selected === total;
  const headerState = allChecked
    ? true
    : selected > 0
      ? "indeterminate"
      : false;

  return {
    id: "__select",
    label: "",
    hideable: false,
    sticky: "start",
    stopRowClick: true,
    headerClassName: "w-9",
    cellClassName: "w-9",
    header: () => (
      <Checkbox
        checked={headerState}
        disabled={total === 0}
        onCheckedChange={(value) => onToggleAll?.(selectableIds, value === true)}
        aria-label="تحديد كل الطلبات"
        className={CHECKBOX_CLASS}
      />
    ),
    cell: (row) => {
      if (!isRowSelectable(row)) return null;
      const id = getRowId(row);
      return (
        <Checkbox
          checked={Boolean(selectedIds?.has(id))}
          onCheckedChange={() => onToggleRow?.(id)}
          onClick={(e) => e.stopPropagation()}
          aria-label="تحديد الطلب"
          className={CHECKBOX_CLASS}
        />
      );
    },
  };
}
