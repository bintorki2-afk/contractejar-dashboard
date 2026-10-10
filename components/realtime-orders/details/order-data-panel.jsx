"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildEjarSections, EJAR_SECTIONS, groupCopyText } from "@/src/lib/order-detail-view";
import { useEjarEntryProgress } from "@/src/hooks/use-ejar-entry-progress";
import { AmberNote, CellRow, HeaderInfo, SectionCard, Tab, copyText } from "./order-cells";

/**
 * لوحة البيانات (دفعة هـ — E1): ستة أقسام بترتيب إدخال منصة إيجار، تتمرر لحالها (ارتفاع ثابت + تمرير داخلي
 * على الشاشات الواسعة). كل قسم: «أدخلتها في إيجار» (يُحفظ في الخادم)، «نسخ المجموعة»، و«مرفق ناقص» للأقسام ١/٢/٤.
 */
export default function OrderDataPanel({ orderData, canEdit = true, isLeaseRenewal = false, onRequestData, onOpenAttachment, className }) {
  const sections = useMemo(() => buildEjarSections(orderData ?? {}), [orderData]);
  const progress = orderData?.ejar_entry_progress ?? {};
  const entry = useEjarEntryProgress(orderData?.id);
  const [unitIndex, setUnitIndex] = useState(0);
  const unitList = sections.unit.units;
  const activeUnit = unitList[Math.min(unitIndex, Math.max(unitList.length - 1, 0))] ?? null;

  const toggle = (section) => (done) => entry.mutate({ section, done });
  const pending = (section) => entry.isPending && entry.variables?.section === section;
  const copyGroup = (rows, title) => () => copyText(groupCopyText(rows), `تم نسخ «${title}»`);
  const sec = (key) => EJAR_SECTIONS.find((s) => s.key === key);
  const hasInstrument = Array.isArray(orderData?.attachments) && orderData.attachments.some((a) => a?.key === "image_instrument" && a?.url);

  const lessor = sections.lessor;
  const property = sections.property;
  const tenant = sections.tenant;
  const financial = sections.financial;
  const conditions = sections.conditions;

  return (
    <div className={cn("flex flex-col gap-3", className)} dir="rtl" data-panel="ejar-data">
      {isLeaseRenewal ? (
        <AmberNote>
          طلب <b>تجديد عقد إيجار</b> — العقد السابق مرفق في المرفقات
          {onOpenAttachment && hasInstrument ? (
            <>
              {" "}
              <button type="button" onClick={() => onOpenAttachment("image_instrument")} className="font-bold underline underline-offset-2">
                فتح العقد السابق
              </button>
            </>
          ) : null}
          . الأقسام الفارغة تعني أن العميل اختار «نفس بيانات العقد السابق»، وأي تعديلات طلبها تظهر في الشروط والملاحظات.
        </AmberNote>
      ) : null}
      {/* ١ المؤجر */}
      <SectionCard
        id="sec-lessor"
        number={sec("lessor").number}
        title={sec("lessor").title}
        headerExtra={<HeaderInfo label={lessor.headerLabel} value={lessor.headerValue} />}
        subtitle={lessor.subtitle}
        entry={progress.lessor}
        onToggleEntry={canEdit ? toggle("lessor") : undefined}
        entryPending={pending("lessor")}
        onCopyGroup={copyGroup(lessor.rows, "المؤجر")}
        onRequestData={onRequestData ? () => onRequestData("lessor") : undefined}
      >
        {lessor.rows.length ? lessor.rows.map((row, i) => <CellRow key={i} cells={row} />) : <EmptyHint>لا توجد بيانات للمؤجر بعد.</EmptyHint>}
      </SectionCard>

      {/* ٢ العقار والعنوان */}
      <SectionCard
        id="sec-property"
        number={sec("property").number}
        title={sec("property").title}
        entry={progress.property}
        onToggleEntry={canEdit ? toggle("property") : undefined}
        entryPending={pending("property")}
        onCopyGroup={copyGroup([property.docRow, property.propertyRow, ...property.addressRows], "العقار والعنوان")}
        onRequestData={onRequestData ? () => onRequestData("property") : undefined}
      >
        <CellRow cells={property.docRow} />
        <CellRow cells={property.propertyRow} />
        {property.addressMode !== "none" ? (
          <p className="text-[12px] text-[#6B7B71] dark:text-white/50">
            العنوان الوطني — <span className="font-semibold text-[#2F4A3B] dark:text-white/70">{property.addressModeLabel}</span>
          </p>
        ) : null}
        {property.addressRows.map((row, i) => (
          <CellRow key={i} cells={row} />
        ))}
        {property.addressNote ? (
          <AmberNote>
            {property.addressNote}
            {onOpenAttachment && property.imageKey ? (
              <>
                {" "}
                <button type="button" onClick={() => onOpenAttachment(property.imageKey)} className="font-bold underline underline-offset-2">
                  فتح الصورة
                </button>
              </>
            ) : null}
          </AmberNote>
        ) : null}
      </SectionCard>

      {/* ٣ الوحدة */}
      <SectionCard
        id="sec-unit"
        number={sec("unit").number}
        title={sections.unit.count > 1 ? `الوحدات (${sections.unit.count})` : sec("unit").title}
        entry={progress.unit}
        onToggleEntry={canEdit ? toggle("unit") : undefined}
        entryPending={pending("unit")}
        onCopyGroup={activeUnit ? copyGroup([activeUnit.cells], activeUnit.label) : undefined}
      >
        {sections.unit.note ? <AmberNote>{sections.unit.note}</AmberNote> : null}
        {unitList.length > 1 ? (
          <div role="tablist" aria-label="الوحدات" className="flex flex-wrap gap-1.5">
            {unitList.map((u, i) => (
              <Tab key={u.id} active={i === unitIndex} pulse={i !== unitIndex} onClick={() => setUnitIndex(i)}>
                {u.label}
              </Tab>
            ))}
          </div>
        ) : null}
        {activeUnit ? (
          <UnitCells cells={activeUnit.cells} />
        ) : (
          <EmptyHint>لم يُضف العميل وحدة بعد.</EmptyHint>
        )}
      </SectionCard>

      {/* ٤ المستأجر */}
      <SectionCard
        id="sec-tenant"
        number={sec("tenant").number}
        title={sec("tenant").title}
        headerExtra={
          <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[12.5px] font-medium text-[#3B4FA0] dark:bg-blue-500/15 dark:text-blue-300">
            {tenant.chip}
          </span>
        }
        entry={progress.tenant}
        onToggleEntry={canEdit ? toggle("tenant") : undefined}
        entryPending={pending("tenant")}
        onCopyGroup={copyGroup(tenant.rows, "المستأجر")}
        onRequestData={onRequestData ? () => onRequestData("tenant") : undefined}
      >
        {tenant.rows.length ? tenant.rows.map((row, i) => <CellRow key={i} cells={row} />) : <EmptyHint>لا توجد بيانات للمستأجر بعد.</EmptyHint>}
      </SectionCard>

      {/* ٥ المالية */}
      <SectionCard
        id="sec-financial"
        number={sec("financial").number}
        title={sec("financial").title}
        headerExtra={<HeaderInfo label="نوع العقد:" value={financial.contractType} pulse />}
        entry={progress.financial}
        onToggleEntry={canEdit ? toggle("financial") : undefined}
        entryPending={pending("financial")}
        onCopyGroup={copyGroup(financial.rows, "المالية")}
      >
        {financial.rows.length ? financial.rows.map((row, i) => <CellRow key={i} cells={row} />) : <EmptyHint>لا توجد بيانات مالية بعد.</EmptyHint>}
      </SectionCard>

      {/* ٦ الشروط الإضافية */}
      <SectionCard
        id="sec-conditions"
        number={sec("conditions").number}
        title={sec("conditions").title}
        entry={progress.conditions}
        onToggleEntry={canEdit ? toggle("conditions") : undefined}
        entryPending={pending("conditions")}
        onCopyGroup={conditions.items.length || conditions.roles.length ? () => copyText([...conditions.items, ...conditions.roles.map((r) => `مسؤولية المستأجر: ${r}`)].join("\n"), "تم نسخ «الشروط الإضافية»") : undefined}
      >
        {conditions.items.length ? (
          <ol className="m-0 list-decimal ps-5 text-[14px] leading-[1.8] text-[#14231D] dark:text-white">
            {conditions.items.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        ) : null}
        {conditions.roles.length ? (
          <p className="text-[13px] text-[#2F4A3B] dark:text-white/70">
            <span className="text-[#6B7B71] dark:text-white/50">مسؤوليات المستأجر: </span>
            {conditions.roles.join(" · ")}
          </p>
        ) : null}
        {!conditions.items.length && !conditions.roles.length ? <EmptyHint>لا توجد شروط إضافية.</EmptyHint> : null}
      </SectionCard>
    </div>
  );
}

function UnitCells({ cells }) {
  // تقسيم بصري كما في المخطط: (رقم/نوع/دور/مساحة) ثم (غرف/صالات/دورات/مطابخ/تكييف/مؤثثة/خزائن) ثم (عدادات/مواقف)
  const groups = [
    ["unit_number", "unit_type", "floor_number", "unit_area"],
    ["rooms", "halls", "baths", "kitchens", "ac", "furnished", "kitchen_cabinets"],
    ["electricity_meter", "water_meter", "parking"],
  ];
  const used = new Set();
  const rows = groups.map((keys) => cells.filter((c) => keys.includes(c.key) && (used.add(c.key), true)));
  const rest = cells.filter((c) => !used.has(c.key));
  if (rest.length) rows.push(rest);
  return rows.filter((r) => r.length).map((row, i) => <CellRow key={i} cells={row} />);
}

function EmptyHint({ children }) {
  return <p className="text-[13px] text-[#9AA6A1] dark:text-white/40">{children}</p>;
}
