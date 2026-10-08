"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import { useCallback, useRef, useState } from "react";
import { Inbox, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ContractStepEditor } from "./contract-edit/contract-step-editor";
import {
  ADMIN_UNIT_CORE_FIELDS,
  ADMIN_UNIT_ROOM_FIELDS,
  ADMIN_UNIT_SERVICE_FIELDS,
} from "./contract-edit/contract-field-schemas";
import { normalizeFieldValue } from "@/src/lib/contract-update";
import { useSingleOrderContext } from "./single-order-context";

const GOLD = "#B8860B";

const UNIT_FIELD_GROUPS = [
  { title: "بيانات الوحدة", fields: ADMIN_UNIT_CORE_FIELDS },
  { title: "تفاصيل الغرف", fields: ADMIN_UNIT_ROOM_FIELDS },
  { title: "الخدمات", fields: ADMIN_UNIT_SERVICE_FIELDS },
];

const ALL_UNIT_FIELDS = [
  ...ADMIN_UNIT_CORE_FIELDS,
  ...ADMIN_UNIT_ROOM_FIELDS,
  ...ADMIN_UNIT_SERVICE_FIELDS,
];

/**
 * The unit endpoint replaces the whole record, so a section save has to resend
 * every field it isn't editing — otherwise rooms/services get wiped.
 */
function getUnitFullPayload(unit) {
  const payload = {};
  for (const field of ALL_UNIT_FIELDS) {
    const value = normalizeFieldValue(unit?.[field.key], field.key);
    if (value === "" || value === null || value === undefined) continue;
    payload[field.key] = value;
  }
  return payload;
}

function getUnitInitialValues(unit, fields) {
  const entries = fields.flatMap((field) => {
    const pairs = [
      [field.key, normalizeFieldValue(unit?.[field.key], field.key)],
    ];
    if (field.displayKey && unit?.[field.displayKey] != null) {
      pairs.push([field.displayKey, unit[field.displayKey]]);
    }
    return pairs;
  });
  return Object.fromEntries(entries);
}

function getAllUnitInitialValues(unit) {
  return {
    ...getUnitInitialValues(unit, ADMIN_UNIT_CORE_FIELDS),
    ...getUnitInitialValues(unit, ADMIN_UNIT_ROOM_FIELDS),
    ...getUnitInitialValues(unit, ADMIN_UNIT_SERVICE_FIELDS),
  };
}

function unitFormDeps(unit) {
  return [
    unit?.id,
    unit?.unit_number,
    unit?.floor_number,
    unit?.unit_area,
    unit?.unit_type_id,
    unit?.unit_usage_id,
    unit?.tootal_rooms,
    unit?.The_number_of_kitchens,
    unit?.The_number_of_toilets,
    unit?.window_ac,
    unit?.split_ac,
    unit?.kitchen_tank,
    unit?.furnished,
    unit?.type_furnished,
    unit?.electricity_meter,
    unit?.electricity_meter_number,
    unit?.electricity_meter_ownership,
    unit?.water_meter,
    unit?.water_meter_number,
    unit?.water_meter_ownership,
    unit?.updated_at,
  ];
}

function isSelectedUnit(unit, data) {
  const selectedId = data?.real_units_id ?? data?.contract_summary?.real_units_id;
  if (selectedId == null || unit?.id == null) return false;
  return Number(unit.id) === Number(selectedId);
}

function SingleUnitBlock({ unit, data, index, formRef }) {
  const confirm = useConfirm();
  const { updateUnit, deleteUnit, isSavingUnit, isDeletingUnit } =
    useSingleOrderContext();
  const selected = isSelectedUnit(unit, data);

  const unitLabel =
    unit?.unit_number != null && unit.unit_number !== ""
      ? `الوحدة رقم ${unit.unit_number}`
      : `وحدة #${unit?.id ?? index + 1}`;

  // Keep the form seed stable; rebuild it only when a field the form uses changes.
  const unitFormKey = JSON.stringify(unitFormDeps(unit));
  const [initialSnapshot, setInitialSnapshot] = useState(() => ({
    key: unitFormKey,
    values: getAllUnitInitialValues(unit),
  }));
  if (initialSnapshot.key !== unitFormKey) {
    setInitialSnapshot({ key: unitFormKey, values: getAllUnitInitialValues(unit) });
  }
  const initialValues = initialSnapshot.values;

  const handleSaveSection = useCallback(
    async (payload) => {
      if (unit?.id == null) {
        toast.error("معرف الوحدة غير موجود");
        return;
      }
      await updateUnit(unit.id, { ...getUnitFullPayload(unit), ...payload });
    },
    [unit, updateUnit]
  );

  const handleDetach = async () => {
    if (unit?.id == null) return;
    const ok = await confirm({
      title: "فصل الوحدة",
      description: `فصل الوحدة ${unitLabel} عن هذا العقد؟ لن تُحذف الوحدة من العقار.`,
      confirmLabel: "فصل الوحدة",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteUnit(unit.id);
    } catch {
      /* toast handled in mutation */
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{unitLabel}</h3>
          {selected ? (
            <span className="rounded-full bg-brand-hover px-3 py-1 text-11 font-bold text-white">
              الوحدة المختارة في العقد
            </span>
          ) : null}
          {unit?.id != null ? (
            <span className="text-xs font-medium text-ink-placeholder dark:text-white/40" dir="ltr">
              ID: {unit.id}
            </span>
          ) : null}
        </div>
        {unit?.id != null ? (
          <button
            type="button"
            onClick={handleDetach}
            disabled={isDeletingUnit}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-500/30 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#3F1D1D] disabled:opacity-60"
          >
            <Trash2 size={14} />
            فصل عن العقد
          </button>
        ) : null}
      </div>

      <ContractStepEditor
        ref={formRef}
        step="step2"
        fieldGroups={UNIT_FIELD_GROUPS}
        initialValues={initialValues}
        seedFromInitialValuesOnly
        onSave={handleSaveSection}
        isSaving={isSavingUnit}
        startInEditing
        formOnly
        hideFooter
      />
    </div>
  );
}

function UnitsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-6 py-16 text-ink-placeholder dark:text-white/40">
      <Inbox size={36} className="text-gray-300 dark:text-white/20" />
      <p className="text-sm font-bold text-gray-500 dark:text-white/60">لا توجد وحدات مرتبطة بهذا العقد</p>
      <p className="text-xs">عدد الوحدات = 0</p>
    </div>
  );
}

const UnitDetailes = ({ data }) => {
  const units = Array.isArray(data?.units) ? data.units : [];
  const unitsCount = data?.units_count ?? units.length;
  const isEmpty = unitsCount === 0 || units.length === 0;
  const unitRefs = useRef(new Map());
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all(
        Array.from(unitRefs.current.values())
          .filter(Boolean)
          .map((formHandle) => formHandle.save())
      );
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          وحدات العقد
          <span className="mr-2 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:text-white/60">
            {unitsCount}
          </span>
        </p>
      </div>

      {isEmpty ? (
        <UnitsEmptyState />
      ) : (
        <>
          <div className="space-y-8 divide-y divide-surface-border dark:divide-white/10">
            {units.map((unit, index) => (
              <div
                key={unit?.id ?? `unit-${index}`}
                className={index === 0 ? undefined : "pt-8"}
              >
                <SingleUnitBlock
                  unit={unit}
                  data={data}
                  index={index}
                  formRef={(handle) => {
                    const key = unit?.id ?? `unit-${index}`;
                    if (handle) unitRefs.current.set(key, handle);
                    else unitRefs.current.delete(key);
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="flex w-full items-center justify-center gap-2 h-13 rounded-full text-white text-15 font-bold disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            {isSavingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save size={18} />
            )}
            حفظ التعديلات
          </button>
        </>
      )}
    </div>
  );
};

export default UnitDetailes;
