"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Download, ExternalLink, Eye, ImageIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MediaPreviewDialog from "@/components/shared/media-preview-dialog";
import { Field } from "./primitives";
import { isLikelyImageUrl, isMapsUrl } from "../national-address-utils";

const TAB_DEFS = [
  { id: "text", label: "العنوان النصي" },
  { id: "map", label: "الخريطة" },
  { id: "image", label: "صورة العنوان" },
];

function copyText(value) {
  if (!value) return;
  navigator.clipboard.writeText(String(value));
  toast.success("تم النسخ بنجاح");
}

function hasValue(value) {
  return value != null && value !== "";
}

function hasTextAddress(address) {
  return [
    address?.short_address,
    address?.city,
    address?.district,
    address?.building,
    address?.street,
    address?.postal_code,
    address?.additional_number,
  ].some(hasValue);
}

function hasMapAddress(address) {
  return (
    hasValue(address?.maps_url) ||
    hasValue(address?.embed_url) ||
    hasValue(address?.address_url) ||
    (address?.lat != null && address?.lng != null)
  );
}

function hasImageAddress(address) {
  return (
    hasValue(address?.image_url) ||
    (hasValue(address?.address_url) && isLikelyImageUrl(address.address_url))
  );
}

function getImageUrl(address) {
  if (hasValue(address?.image_url)) return address.image_url;
  if (hasValue(address?.address_url) && isLikelyImageUrl(address.address_url)) {
    return address.address_url;
  }
  return null;
}

function getMapsUrl(address) {
  if (hasValue(address?.maps_url)) return address.maps_url;
  if (hasValue(address?.address_url) && isMapsUrl(address.address_url)) {
    return address.address_url;
  }
  if (address?.lat != null && address?.lng != null) {
    return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
  }
  return null;
}

function TextAddressPanel({ address }) {
  const fields = [
    { label: "العنوان المختصر", value: address.short_address },
    { label: "المدينة", value: address.city },
    { label: "الحي", value: address.district, editKey: "neighborhood" },
    { label: "رقم المبنى", value: address.building, editKey: "building_number" },
    { label: "الشارع", value: address.street, editKey: "street" },
    { label: "الرمز البريدي", value: address.postal_code, editKey: "postal_code" },
    { label: "الرقم الإضافي", value: address.additional_number, editKey: "extra_figure" },
  ].filter((field) => hasValue(field.value));

  if (fields.length === 0) return null;

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <Field key={field.label} label={field.label} value={field.value} editKey={field.editKey} />
      ))}
    </div>
  );
}

function MapAddressPanel({ address }) {
  const mapsUrl = getMapsUrl(address);
  const hasCoords = address.lat != null && address.lng != null;

  if (!mapsUrl && !hasCoords && !address.embed_url) return null;

  return (
    <div className="rounded-xl border border-[#D7E3DE] bg-[#F7FAF8] p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10.5px] font-bold text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-200">
        <MapPin className="size-3" />
        رابط خرائط قوقل
      </div>

      {address.embed_url ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-[#D7E3DE] bg-white dark:border-white/10 dark:bg-[#0B1411]">
          <iframe
            src={address.embed_url}
            title="موقع العقار على الخريطة"
            className="h-[220px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : hasCoords ? (
        <div className="mb-3 flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[#D7E3DE] bg-white dark:border-white/10 dark:bg-[#0B1411]">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 size-8 text-brand-dark dark:text-[#6EE7B7]" />
            <p className="text-xs font-bold text-gray-600 dark:text-white/70">موقع على الخريطة</p>
          </div>
        </div>
      ) : null}

      {hasCoords ? (
        <p className="mb-3 text-[11px] font-bold text-gray-500 dark:text-white/50" dir="ltr">
          {address.lat}, {address.lng}
        </p>
      ) : null}

      {mapsUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => copyText(mapsUrl)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E3DE] bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-brand-dark/30 hover:text-brand-dark dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-[#6EE7B7]"
          >
            <Copy className="size-3.5" />
            نسخ الرابط
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-hover px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-hover/90"
          >
            <ExternalLink className="size-3.5" />
            فتح في الخرائط
          </a>
        </div>
      ) : null}
    </div>
  );
}

function ImageAddressPanel({ address }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageUrl = getImageUrl(address);

  if (!imageUrl) return null;

  return (
    <>
      <div className="rounded-xl border border-[#D7E3DE] bg-[#F7FAF8] p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10.5px] font-bold text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-200">
          <ImageIcon className="size-3" />
          صورة بطاقة العنوان
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="group relative mb-3 block w-full overflow-hidden rounded-xl border border-[#D7E3DE] bg-white dark:border-white/10 dark:bg-[#0B1411]"
        >
          <div className="relative aspect-[4/3] max-h-[220px] w-full">
            <Image
              src={imageUrl}
              alt="صورة العنوان الوطني"
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="size-3.5" />
              عرض بالحجم الكامل
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark hover:underline dark:text-[#6EE7B7]"
          >
            <Eye className="size-3.5" />
            عرض
          </button>
          <a
            href={imageUrl}
            download
            className="inline-flex items-center gap-1 text-xs font-bold text-status-neutral hover:underline dark:text-white/55"
          >
            <Download className="size-3.5" />
            تحميل
          </a>
        </div>
      </div>

      <MediaPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={imageUrl}
        downloadUrl={imageUrl}
        title="معاينة العنوان الوطني"
        subtitle={address.image_name}
        icon={ImageIcon}
        iconClassName="bg-[#2563EB]"
      />
    </>
  );
}

function tabHasData(address, tabId) {
  if (tabId === "text") return hasTextAddress(address);
  if (tabId === "map") return hasMapAddress(address);
  if (tabId === "image") return hasImageAddress(address);
  return false;
}

export default function NationalAddressContent({ address }) {
  const tabs = useMemo(() => {
    if (!address) return [];
    return TAB_DEFS.filter((tab) => tabHasData(address, tab.id));
  }, [address]);

  const [selectedTab, setActiveTab] = useState(tabs[0]?.id ?? null);
  // Fall back to the first available tab when the selected one has no data.
  const activeTab = tabs.some((tab) => tab.id === selectedTab)
    ? selectedTab
    : (tabs[0]?.id ?? null);

  if (!address || tabs.length === 0) {
    return (
      <p className="text-xs font-medium text-[#D1D5DB] dark:text-white/25">لم يُدخل العنوان بعد</p>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="أنواع العنوان الوطني"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-8 px-4 rounded-full text-[11px] font-bold transition-all shrink-0",
              activeTab === tab.id
                ? "bg-brand-dark text-white shadow-sm dark:bg-emerald-500 dark:text-[#0B1411]"
                : "bg-white text-[#616161] border border-[#E5E7EB] hover:border-brand-dark/30 dark:bg-[#0F1C16] dark:text-white/65 dark:border-white/10 dark:hover:border-emerald-500/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === "text" ? <TextAddressPanel address={address} /> : null}
        {activeTab === "map" ? <MapAddressPanel address={address} /> : null}
        {activeTab === "image" ? <ImageAddressPanel address={address} /> : null}
      </div>
    </div>
  );
}
