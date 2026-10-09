"use client";

import { cn } from "@/lib/utils";
import { RT } from "./theme";
import { CONTRACT_TYPE_OPTIONS } from "./more-filters-popover";

function Chip({ active, onClick, children, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-[5px] text-[10.5px] font-extrabold transition-all whitespace-nowrap",
        active
          ? "bg-[#0B5A3C] border-[#0B5A3C] text-white"
          : dark
            ? "bg-[#132620] border-[#28453A] text-[#AFC8BE] hover:bg-[#1A332B]"
            : "bg-white border-[#E3E8E6] text-[#5F5E5A] hover:bg-[#F7FAF9]"
      )}
    >
      {children}
    </button>
  );
}

function Count({ children, active, dark }) {
  return (
    <span
      className={cn(
        "text-[9.5px] font-extrabold",
        active
          ? "opacity-70"
          : dark
            ? "text-[#8FD9BE]/80"
            : "opacity-65"
      )}
    >
      ({children})
    </span>
  );
}

/**
 * Inline status + contract-type chips — matches design.html #statusF .fchip row.
 */
export default function RealtimeStatusFilterBar({
  statusChips = [],
  statusId = null,
  onStatusChange,
  contractType = null,
  onContractTypeChange,
  totalCount,
  dark = false,
  className,
}) {
  const statusAll = statusId == null || statusId === "";

  return (
    <div
      className={cn("flex items-center gap-1.5 flex-wrap", className)}
      dir="rtl"
    >
      <Chip active={statusAll} dark={dark} onClick={() => onStatusChange?.(null)}>
        الكل
        {totalCount != null ? (
          <Count active={statusAll} dark={dark}>
            {totalCount}
          </Count>
        ) : null}
      </Chip>

      {statusChips.map((status) => {
        const active = String(statusId) === String(status.id);
        return (
          <Chip
            key={status.id}
            active={active}
            dark={dark}
            onClick={() => onStatusChange?.(active ? null : status.id)}
          >
            {status.color ? (
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: active ? "#fff" : status.color || RT.brand }}
              />
            ) : null}
            {status.name}
          </Chip>
        );
      })}

      <span
        className={cn(
          "w-px h-5 mx-1 shrink-0",
          dark ? "bg-white/15" : "bg-[#E3E8E6]"
        )}
        aria-hidden
      />

      <Chip
        active={!contractType}
        dark={dark}
        onClick={() => onContractTypeChange?.(null)}
      >
        الكل
      </Chip>
      {CONTRACT_TYPE_OPTIONS.map((option) => (
        <Chip
          key={option.id}
          active={contractType === option.value}
          dark={dark}
          onClick={() =>
            onContractTypeChange?.(
              contractType === option.value ? null : option.value
            )
          }
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
