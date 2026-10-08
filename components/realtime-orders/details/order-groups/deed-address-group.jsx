"use client";

import { useState } from "react";
import { Download, Eye, FileText, MapPin } from "lucide-react";
import MediaPreviewDialog from "@/components/shared/media-preview-dialog";
import { RT } from "../../theme";
import { AccentCard, Field, GroupTitle } from "./primitives";
import NationalAddressContent from "./national-address-content";

export default function DeedAddressGroup({ order, onEdit }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const address = order.national_address;

  return (
    <section className="rounded-2xl border border-dashed border-[#D7E3DE] dark:border-white/10 bg-[#F7FAF8] dark:bg-white/[0.02] p-3 sm:p-3.5 space-y-3">
      <GroupTitle>المجموعة 1 - الملاك - الصك - العنوان الوطني</GroupTitle>

      <AccentCard
        accent={RT.brand}
        icon={FileText}
        title="الصك والملاك"
        onEdit={() => onEdit?.("deed")}
      >
        <div className="rounded-xl bg-[#F0F7F4] dark:bg-white/[0.03] px-3 py-2 flex items-center gap-2">
          <FileText className="size-3.5 text-brand-dark dark:text-[#6EE7B7] shrink-0" />
          <span className="text-[11.5px] font-bold text-brand-dark dark:text-[#6EE7B7]">
            {order.deed?.type_label}
          </span>
        </div>

        <div className="space-y-2">
          <Field label="اسم المالك" value={order.deed?.owner_name} editKey="name_owner" />
          <Field label="رقم الصك" value={order.deed?.number} editKey="instrument_number" />
          <Field label="هوية المالك" value={order.deed?.owner_id} editKey="property_owner_id_num" />
          <Field label="جوال المالك" value={order.deed?.owner_phone} editKey="property_owner_mobile" />
          {order.deed?.is_deceased ? (
            <Field label="حالة المالك" value="متوفى" />
          ) : null}
        </div>

        {order.deed?.agent_id ||
        order.deed?.agent_phone ||
        order.deed?.agency_number ||
        order.deed?.agency_date ||
        order.deed?.agency_doc_url ? (
          <div className="space-y-2 rounded-xl bg-[#F0F7F4] dark:bg-white/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-black text-brand-dark dark:text-[#6EE7B7]">
              بيانات الوكيل (بموجب وكالة)
            </p>
            <Field label="هوية الوكيل" value={order.deed?.agent_id} />
            <Field label="جوال الوكيل" value={order.deed?.agent_phone} />
            <Field label="رقم الوكالة" value={order.deed?.agency_number} />
            <Field label="تاريخ الوكالة" value={order.deed?.agency_date} />
            {order.deed?.agency_doc_url ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-gray-400 font-medium">صورة الوكالة</span>
                <a
                  href={order.deed.agency_doc_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-dark dark:text-[#6EE7B7] hover:underline inline-flex items-center gap-1"
                >
                  <Eye className="size-3.5" />
                  عرض
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-xl bg-status-neutral-bg dark:bg-white/[0.04] px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#4B5563] dark:text-white/70 truncate">
            {order.deed?.file_name || "لا يوجد مرفق"}
          </span>
          {order.deed?.file_url ? (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="text-xs font-bold text-brand-dark dark:text-[#6EE7B7] hover:underline inline-flex items-center gap-1"
              >
                <Eye className="size-3.5" />
                عرض
              </button>
              <a
                href={order.deed.file_url}
                download
                className="text-xs font-bold text-status-neutral dark:text-white/55 hover:underline inline-flex items-center gap-1"
              >
                <Download className="size-3.5" />
                تحميل
              </a>
            </div>
          ) : null}
        </div>

        {order.deed?.special_docs?.length ? (
          <div className="space-y-1.5">
            <p className="text-[11px] font-black text-brand-dark dark:text-[#6EE7B7]">
              مستندات إضافية
            </p>
            {order.deed.special_docs.map((doc) => (
              <div
                key={doc.key}
                className="rounded-xl bg-status-neutral-bg dark:bg-white/[0.04] px-3 py-2 flex items-center justify-between gap-2"
              >
                <span className="text-xs font-bold text-[#4B5563] dark:text-white/70 truncate">
                  {doc.label}
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-dark dark:text-[#6EE7B7] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <Eye className="size-3.5" />
                  عرض
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </AccentCard>

      <MediaPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={order.deed?.file_url}
        downloadUrl={order.deed?.file_url}
        title="معاينة الصك"
        subtitle={order.deed?.file_name}
      />

      <AccentCard
        accent="#3B82F6"
        icon={MapPin}
        title="العنوان الوطني"
        onEdit={() => onEdit?.("address")}
      >
        <NationalAddressContent address={address} />
      </AccentCard>
    </section>
  );
}
