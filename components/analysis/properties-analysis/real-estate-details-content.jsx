"use client";

import { Copy, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import waIcon from "@/public/images/waIcon.svg";
import { getInstrumentTypeLabel as instrumentLabel } from "@/src/lib/instrument-types";
import { ownerDobCells, realEstateAttachments } from "@/src/lib/real-estate-view";
import { formatSaudiMobileDisplay, toSaudiMobileDialDigits } from "@/src/lib/format-phone";

const display = (value) => {
  if (value === null || value === undefined || value === "") return "---";
  return String(value);
};

const copy = (value) => {
  if (!value) return;
  navigator.clipboard.writeText(String(value));
  toast.success("تم النسخ بنجاح");
};

// QA PROPS-11: كل أنواع الوثيقة بالعربية (لا مفاتيح إنجليزية خام).
const getInstrumentTypeLabel = (type) => {
  if (!type) return display(type);
  if (type === "paper" || type === "handwritten") return "صك ورقي";
  const label = instrumentLabel(type);
  return label && label !== type ? label : display(type);
};

const getContractTypeLabel = (type) => {
  if (type === "housing" || type === "residential") return "سكني";
  if (type === "commercial") return "تجاري";
  return display(type);
};

const DetailCard = ({ label, value, copyable = false, borderColor = "border-gray-200" }) => (
  <div className={`bg-white p-4 rounded-2xl shadow-sm border-r-4 ${borderColor}`}>
    <span className="text-gray-400 text-xs font-medium block mb-1">{label}</span>
    <p className="flex items-center gap-2 text-gray-800 font-bold text-sm">
      {copyable && value && value !== "---" && (
        <button type="button" onClick={() => copy(value)} className="text-gray-400 hover:text-brand-main">
          <Copy size={14} />
        </button>
      )}
      <span>{display(value)}</span>
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <section>
    <div className="flex items-center gap-2 mb-4 px-2">
      <FileText className="text-green-600 w-5 h-5" />
      <h3 className="text-gray-800 font-bold text-lg">{title}</h3>
    </div>
    <div className="bg-gray-100/50 p-6 rounded-[28px] border border-gray-100">{children}</div>
  </section>
);

const ImagePreview = ({ label, src, pdf = false }) => {
  if (!src) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="relative flex w-full max-w-[280px] h-[180px] items-center justify-center rounded-2xl overflow-hidden border border-gray-200 bg-white"
        title="فتح في تبويب جديد"
      >
        {pdf ? (
          <span className="flex flex-col items-center gap-2 text-[#B42318]">
            <FileText className="size-10" />
            <span className="text-xs font-bold">PDF — فتح المستند</span>
          </span>
        ) : (
          <Image src={src} alt={label} fill className="object-contain p-2" unoptimized />
        )}
      </a>
      <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-deep hover:underline">
        فتح في تبويب جديد <ExternalLink className="size-3" />
      </a>
    </div>
  );
};

export default function RealEstateDetailsContent({ data }) {
  const images = realEstateAttachments(data);
  const dobCells = ownerDobCells(data);
  // QA PROPS-12: الجوال يُخزَّن بلا 966 ⇒ رابط واتساب بمفتاح الدولة.
  const waDigits = data?.mobile_international || toSaudiMobileDialDigits(data?.mobile);

  return (
    <div dir="rtl" className="flex flex-col gap-8">
      <Section title="بيانات المالك">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DetailCard label="اسم المالك" value={data?.name_owner} copyable borderColor="border-green-500" />
          <DetailCard label="رقم الهوية" value={data?.national_num} copyable borderColor="border-blue-500" />
          {dobCells.map((c, i) => (
            <DetailCard key={c.label} label={c.label} value={c.value} borderColor={i ? "border-orange-500" : "border-purple-500"} />
          ))}
          <DetailCard label="رقم الجوال" value={data?.mobile ? formatSaudiMobileDisplay(data.mobile) || data.mobile : null} copyable borderColor="border-lime-500" />
          <DetailCard label="الآيبان" value={data?.iban_bank} copyable borderColor="border-gray-400" />
        </div>
        {waDigits && (
          <div className="mt-4 flex items-center gap-2">
            <Link href={`https://wa.me/${waDigits}`} target="_blank" className="hover:scale-110 transition-all">
              <Image src={waIcon} alt="WhatsApp" width={22} height={22} />
            </Link>
            <span className="text-sm text-gray-500">تواصل عبر واتساب</span>
          </div>
        )}
      </Section>

      <Section title="بيانات الصك">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <DetailCard label="نوع الوثيقة" value={data?.instrument_type_label || getInstrumentTypeLabel(data?.instrument_type)} borderColor="border-pink-500" />
          <DetailCard label="رقم الصك" value={data?.instrument_number} copyable borderColor="border-blue-600" />
          <DetailCard label="تاريخ الصك" value={data?.instrument_history} borderColor="border-yellow-400" />
          <DetailCard label="رقم السجل العقاري" value={data?.real_estate_registry_number} copyable borderColor="border-indigo-500" />
          <DetailCard label="تاريخ أول تسجيل" value={data?.date_first_registration} borderColor="border-teal-500" />
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <ImagePreview key={img.src} {...img} />
            ))}
          </div>
        )}
        {images.length === 0 ? <p className="text-sm text-gray-400">لا توجد مرفقات لهذا العقار.</p> : null}
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* QA PROPS-10: قسم «تفاصيل العقار» كان معلّقاً في الكود. */}
        <Section title="تفاصيل العقار">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard label="اسم العقار" value={data?.name_real_estate || "مسودة — بلا اسم"} borderColor="border-green-600" />
            <DetailCard label="نوع العقار" value={data?.property_type_name} borderColor="border-lime-500" />
            <DetailCard label="استخدام العقار" value={data?.property_usages_name} borderColor="border-blue-600" />
            <DetailCard label="نوع العقد" value={data?.contract_type_label || getContractTypeLabel(data?.contract_type)} borderColor="border-purple-600" />
            <DetailCard label="عدد الوحدات المضافة" value={data?.Count_Units} borderColor="border-orange-500" />
            <DetailCard label="إجمالي عدد الوحدات" value={data?.number_of_units_in_realestate} borderColor="border-sky-400" />
            <DetailCard label="عدد الطوابق" value={data?.number_of_floors} borderColor="border-gray-300" />
            {data?.type_real_estate_other ? <DetailCard label="نوع آخر" value={data?.type_real_estate_other} borderColor="border-gray-400" /> : null}
          </div>
        </Section>

        <Section title="العنوان الوطني">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard label="المنطقة" value={data?.property_place_name || data?.property_place_id} borderColor="border-pink-500" />
            <DetailCard label="المدينة" value={data?.property_city_name || data?.property_city_id} borderColor="border-blue-500" />
            <DetailCard label="الحي" value={data?.neighborhood} borderColor="border-purple-500" />
            <DetailCard label="الشارع" value={data?.street} borderColor="border-orange-500" />
            <DetailCard label="رقم المبنى" value={data?.building_number} borderColor="border-blue-400" />
            <DetailCard label="رقم إضافي" value={data?.extra_figure} borderColor="border-green-500" />
            <DetailCard label="الرمز البريدي" value={data?.postal_code} borderColor="border-gray-800" />
          </div>
        </Section>
      </div>
    </div>
  );
}
