"use client";

import { useState } from "react";
import { Building2, Home, ChevronDown } from "lucide-react";
import { RT } from "../../theme";
import { AccentCard, EditBtn, GridField, GroupTitle } from "./primitives";

const UNITS_PAGE_SIZE = 6;

const UNIT_FIELDS = [
  { key: "number", label: "رقم الوحدة" },
  { key: "type", label: "النوع" },
  { key: "use", label: "الاستخدام" },
  { key: "floor", label: "الدور" },
  { key: "area", label: "المساحة" },
  { key: "rooms", label: "الغرف" },
  { key: "bathrooms", label: "دورات المياه" },
  { key: "kitchens", label: "المطابخ" },
  { key: "ac", label: "المكيفات" },
  { key: "furnished", label: "مؤثثة" },
];

const METER_FIELDS = [
  { key: "electricity_meter", label: "عداد الكهرباء" },
  { key: "water_meter", label: "عداد المياه" },
];

function UnitCard({ unit, onEdit }) {
  return (
    <div
      className="relative rounded-xl border-2 p-3 bg-white dark:bg-[#0F1C16]"
      style={{ borderColor: RT.brand }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Home className="size-4 text-brand-dark dark:text-[#6EE7B7] shrink-0" />
          <h5 className="text-13 font-black text-brand-dark dark:text-white">
            {unit.title}
          </h5>
          <span className="px-2 py-0.5 rounded-full bg-[#E0E7FF] text-[#3730A3] text-[10.5px] font-bold">
            {unit.badge}
          </span>
        </div>
        <EditBtn onClick={onEdit} />
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        {UNIT_FIELDS.map(({ key, label }) => (
          <GridField key={key} label={label} value={unit[key]} />
        ))}
      </div>

      {METER_FIELDS.some(({ key }) => unit[key]) ? (
        <div className="mt-2.5 pt-2.5 border-t border-[#EEF1F0] dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
          {METER_FIELDS.map(({ key, label }) => (
            <GridField key={key} label={label} value={unit[key]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function UnitsGroup({ order, onEdit }) {
  const units = order.units ?? [];
  const unitCount = order.units_count ?? units.length;
  // Progressive loading: render a page of units at a time so a contract with
  // many units (e.g. 30) doesn't mount every card up front.
  const [visibleCount, setVisibleCount] = useState(UNITS_PAGE_SIZE);
  const visibleUnits = units.slice(0, visibleCount);
  const remaining = units.length - visibleUnits.length;

  return (
    <section className="rounded-2xl border border-dashed border-[#E8DFD0] dark:border-white/10 bg-[#FBF8F3] dark:bg-white/[0.02] p-3 sm:p-3.5 space-y-3">
      <GroupTitle
        end={
          <span className="text-11 font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
            عدد الوحدات المضافة من العميل: {unitCount}
          </span>
        }
      >
        المجموعة 3 - الوحدات
      </GroupTitle>

      <AccentCard
        accent="#C4A574"
        icon={Building2}
        title="الوحدات"
      >
        <div className="space-y-3">
          {units.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium py-4 text-center">
              لا توجد وحدات مرتبطة بهذا الطلب
            </p>
          ) : (
            <>
              {visibleUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} onEdit={() => onEdit?.("units")} />
              ))}
              {remaining > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + UNITS_PAGE_SIZE)
                  }
                  className="w-full h-9 rounded-xl border border-dashed border-[#C4A574]/60 text-[#B45309] dark:text-[#E0C79A] text-12 font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#FEF3C7]/40 transition-colors"
                >
                  <ChevronDown className="size-3.5" />
                  عرض المزيد ({remaining})
                </button>
              ) : null}
            </>
          )}
        </div>
      </AccentCard>
    </section>
  );
}
