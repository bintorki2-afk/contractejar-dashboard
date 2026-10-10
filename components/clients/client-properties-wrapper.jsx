"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  LayoutGrid,
} from "lucide-react";
import { cn, safeInternalPath } from "@/lib/utils";
import Loader from "@/components/home/loader";
import { useClientProperties } from "@/src/hooks/use-clients";

function FieldCell({ label, value, className }) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <span className="text-11 font-medium text-gray-400 dark:text-white/45">
        {label}
      </span>
      <span
        className={cn(
          "rounded-lg border px-3 py-2 text-13 font-bold text-gray-900 dark:text-white tabular-nums break-words",
          "border-[#EEF1F0] bg-[#F8FAF9] dark:border-white/[0.08] dark:bg-white/[0.04]"
        )}
      >
        {value == null || value === "" ? "–" : value}
      </span>
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div className="border-b border-[#EEF1F0] dark:border-white/[0.06] last:border-0 py-4 first:pt-1 last:pb-1">
      <h4 className="text-13 font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}

function AccordionButton({ open, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-13 font-bold transition-colors",
        "bg-[#E8F5F1] text-brand-dark hover:bg-[#D5EFE8]",
        "dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25",
        open && "bg-[#D5EFE8] dark:bg-emerald-500/25"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  );
}

function UnitRow({ unit }) {
  const [open, setOpen] = useState(false);
  const summary = `${unit.type} – رقم ${unit.number} – ${unit.area} م²`;

  return (
    <div className="border-b border-status-neutral-bg dark:border-white/[0.05] last:border-0">
      <div className="flex items-center justify-between gap-3 px-1 py-3">
        <p className="text-13 font-bold text-gray-900 dark:text-white min-w-0">
          {summary}
        </p>
        <div className="inline-flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-colors",
              "text-brand-dark hover:bg-[#E8F5F1]",
              "dark:text-emerald-300 dark:hover:bg-emerald-500/15"
            )}
          >
            <Eye className="size-3.5" />
            عرض
          </button>
        </div>
      </div>
      {open ? (
        <div className="pb-3 px-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ["النوع", unit.type],
            ["الرقم", unit.number],
            ["المساحة", `${unit.area} م²`],
            ["الطابق", unit.floor],
            ["الغرف", unit.rooms],
            ["الاستخدام", unit.usage],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[#EEF1F0] bg-[#F8FAF9] dark:border-white/[0.08] dark:bg-white/[0.04] px-2.5 py-2"
            >
              <p className="text-10 font-medium text-gray-400 dark:text-white/40 mb-0.5">
                {label}
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PropertyCard({
  property,
  defaultPropertyOpen = false,
  defaultUnitsOpen = false,
}) {
  const [propertyOpen, setPropertyOpen] = useState(defaultPropertyOpen);
  const [unitsOpen, setUnitsOpen] = useState(defaultUnitsOpen);

  const metaParts = [
    `شارع: ${property.street || "–"}`,
    `مبنى ${property.buildingNumber || "–"}`,
  ];
  if (property.addedAt) metaParts.push(`أضيف ${property.addedAt}`);
  if (property.orderId) metaParts.push(`طلب #${property.orderId}`);
  const meta = metaParts.join(" · ");

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white overflow-hidden",
        "border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
        "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
      )}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="inline-flex items-center gap-2">
          <span className={cn("size-2 rounded-full shrink-0", property.isDraft ? "bg-amber-500" : "bg-brand-dark dark:bg-emerald-400")} />
          <h2 className={cn("text-15 font-bold leading-tight", property.isDraft ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-white")}>
            {property.title}
          </h2>
        </div>
        <p className="mt-1.5 text-xs font-medium text-gray-400 dark:text-white/45 leading-relaxed">
          {meta}
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-2.5">
        <AccordionButton
          open={propertyOpen}
          onClick={() => setPropertyOpen((v) => !v)}
          icon={Eye}
        >
          عرض العقار
        </AccordionButton>

        {propertyOpen ? (
          <div
            className={cn(
              "rounded-xl border px-4 py-2",
              "border-[#EEF1F0] bg-white dark:border-white/[0.08] dark:bg-[#0B1411]/40"
            )}
          >
            <SectionBlock title="اسم العقار">
              <FieldCell label="اسم العقار" value={property.propertyName} />
            </SectionBlock>

            <SectionBlock title="وثيقة الملكية">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldCell label="نوع المستند" value={property.documentType} />
                <FieldCell label="رقم الصك" value={property.deedNumber} />
              </div>
            </SectionBlock>

            <SectionBlock title="العنوان الوطني للعقار">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <FieldCell label="المنطقة" value={property.region} />
                <FieldCell label="المدينة" value={property.city} />
                <FieldCell label="الحي" value={property.district} />
                <FieldCell label="رقم المبنى" value={property.buildingNumber} />
              </div>
            </SectionBlock>

            <SectionBlock title="بيانات المالك">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldCell label="رقم الهوية" value={property.ownerId} />
                <FieldCell label="رقم الجوال" value={property.ownerMobile} />
              </div>
            </SectionBlock>
          </div>
        ) : null}

        <AccordionButton
          open={unitsOpen}
          onClick={() => setUnitsOpen((v) => !v)}
          icon={LayoutGrid}
        >
          عرض وحدات العقار ({property.units.length})
        </AccordionButton>

        {unitsOpen ? (
          <div
            className={cn(
              "rounded-xl border px-4",
              "border-[#EEF1F0] bg-white dark:border-white/[0.08] dark:bg-[#0B1411]/40"
            )}
          >
            {property.units.length === 0 ? (
              <p className="py-6 text-center text-13 text-gray-400 dark:text-white/40">
                لا توجد وحدات لهذا العقار
              </p>
            ) : (
              property.units.map((unit) => <UnitRow key={unit.id} unit={unit} />)
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function ClientPropertiesWrapper() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params?.userId;

  const fromParam = searchParams.get("from");
  const backUrl = useMemo(() => {
    return safeInternalPath(
      fromParam,
      `/home/users/${clientId}?from=${encodeURIComponent("/home/clients")}`
    );
  }, [fromParam, clientId]);

  const { client, properties, totals, isLoading, isError } =
    useClientProperties(clientId);

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col gap-4 min-h-full" dir="rtl">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-status-neutral dark:text-white/50 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
        >
          <ChevronLeft className="size-4 shrink-0" />
          رجوع لملف العميل
        </button>
        <div className="rounded-2xl border border-[#E8EEEC] bg-white dark:bg-[#0F1C16] dark:border-white/[0.08] p-10 text-center text-[#FA5252] text-15 font-medium">
          لم يتم العثور على عقارات هذا العميل
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 min-h-full transition-colors" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-status-neutral dark:text-white/50 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
          >
            <ChevronLeft className="size-4 shrink-0" />
            رجوع لملف العميل
          </button>
          <div>
            <h1 className="text-[20px] sm:text-22 font-bold text-gray-900 dark:text-white leading-tight">
              عقارات العميل – {client.name}
            </h1>
            <p className="mt-1 text-13 text-gray-400 dark:text-white/45 font-medium">
              استعراض بنفس مدخلات الموقع – عرض فقط
            </p>
          </div>
        </div>

        <p className="text-13 font-bold text-status-neutral dark:text-white/55 tabular-nums shrink-0 sm:pt-8">
          {totals.properties} عقار{totals.drafts ? ` (+${totals.drafts} مسودة غير مكتملة)` : ""} · {totals.units} وحدة
        </p>
      </div>

      {properties.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border bg-white p-10 text-center text-sm text-gray-400",
            "border-[#E8EEEC] dark:bg-[#0F1C16] dark:border-white/[0.08] dark:text-white/40"
          )}
        >
          لا توجد عقارات مسجّلة لهذا العميل
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              defaultPropertyOpen={index === 0}
              defaultUnitsOpen={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
