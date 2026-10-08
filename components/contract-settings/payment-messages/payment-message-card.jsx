"use client";

import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import { PAYMENT_MESSAGE_TYPE_META } from "@/src/lib/payment-messages";
import EditPaymentMessageDialog from "./edit-payment-message-dialog";

function ButtonPreview({ label, text, link }) {
  return (
    <div className="rounded-xl border border-[#EEF1F0] bg-[#FAFBFA] p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-1.5 text-[11px] font-bold text-[#9CA3AF] dark:text-white/45">{label}</p>
      <p className="text-[13px] font-bold text-[#111827] dark:text-white">{text || "—"}</p>
      <a
        href={link || undefined}
        target={link ? "_blank" : undefined}
        rel={link ? "noreferrer" : undefined}
        className={`mt-1 inline-flex max-w-full items-center gap-1 break-all text-[11px] ${
          link
            ? "text-[#0B5A3C] hover:underline dark:text-emerald-300"
            : "pointer-events-none text-[#9CA3AF] dark:text-white/45"
        }`}
        dir="ltr"
      >
        <ExternalLink className="size-3 shrink-0" />
        <span className="truncate">{link || "—"}</span>
      </a>
    </div>
  );
}

export default function PaymentMessageCard({ item, type }) {
  const meta = PAYMENT_MESSAGE_TYPE_META[type];
  const hasItem = Boolean(item?.id);
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : CircleAlert;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6EBE9] bg-white shadow-[0_4px_12px_rgba(11,83,69,0.04)] dark:border-white/10 dark:bg-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3 border-b border-[#EEF1F0] px-5 py-4 dark:border-white/10">
        <div className="flex min-w-0 items-start gap-3 text-right">
          <span
            className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: meta.badgeBg,
              color: meta.badgeText,
            }}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-black text-[#111827] dark:text-white">{meta.label}</h3>
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: meta.badgeBg,
                  color: meta.badgeText,
                }}
              >
                {hasItem ? "مفعّلة" : "غير مضافة"}
              </span>
            </div>
            <p className="mt-1 text-[12px] font-medium leading-5 text-[#6B7280] dark:text-white/55">
              {meta.description}
            </p>
          </div>
        </div>

        {hasItem ? (
          <EditPaymentMessageDialog
            item={item}
            type={type}
            triggerVariant="edit"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {hasItem ? (
          <>
            <div className="rounded-xl border border-[#EEF1F0] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="mb-2 text-[11px] font-bold text-[#9CA3AF] dark:text-white/45">نص الرسالة</p>
              <p className="text-[13px] font-bold leading-7 text-[#111827] dark:text-white">
                {item.message || "—"}
              </p>
            </div>

            <div className="mt-auto grid gap-3 sm:grid-cols-2">
              <ButtonPreview
                label="الزر الأول"
                text={item.button_text}
                link={item.button_link}
              />
              <ButtonPreview
                label="الزر الثاني"
                text={item.button_text_2}
                link={item.button_link_2}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#E6EBE9] bg-[#FAFBFA] px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <span
              className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: meta.badgeBg,
                color: meta.badgeText,
              }}
            >
              <Icon className="size-6" />
            </span>
            <p className="mb-1 text-[14px] font-black text-[#111827] dark:text-white">
              لا توجد رسالة مضافة بعد
            </p>
            <p className="mb-5 max-w-xs text-[12px] leading-6 text-[#6B7280] dark:text-white/55">
              أضف رسالة واحدة من نوع {meta.label}، ثم عدّلها لاحقاً بدون حذف.
            </p>
            <EditPaymentMessageDialog type={type} triggerVariant="add" />
          </div>
        )}
      </div>
    </div>
  );
}
