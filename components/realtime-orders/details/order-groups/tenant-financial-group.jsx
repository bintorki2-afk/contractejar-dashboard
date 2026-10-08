"use client";

import { Check, ScrollText, UserRound, Wallet } from "lucide-react";
import { RT } from "../../theme";
import { cn } from "@/lib/utils";
import { AccentCard, Field, GroupTitle, Money } from "./primitives";
import InvoiceCard from "./invoice-card";

function hasValue(value) {
  return value != null && value !== "";
}

function isZeroAmount(value) {
  const amount = Number(typeof value === "string" ? value.replace(/,/g, "").trim() : value);
  return Number.isFinite(amount) && amount === 0;
}

function FeeLine({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-status-neutral dark:text-white/50 font-medium">{label}</span>
      {children}
    </div>
  );
}

export default function TenantFinancialGroup({ order, onEdit }) {
  const financial = order.financial ?? {};
  const terms = order.terms ?? {};
  const hasFeeBlock = hasValue(financial.doc_fee) || hasValue(financial.doc_fee_base);
  const amountPaidIsNumber = Number.isFinite(
    Number(typeof financial.fees === "string" ? financial.fees.replace(/,/g, "").trim() : financial.fees)
  );

  return (
    <section className="rounded-2xl border border-dashed border-[#D7E3DE] dark:border-white/10 bg-[#F7FAF8] dark:bg-white/[0.02] p-3 sm:p-3.5 space-y-3">
      <GroupTitle>المجموعة 2 - المستأجر، المالية، الشروط</GroupTitle>

      <AccentCard
        accent={RT.brand}
        icon={UserRound}
        title="المستأجر"
        onEdit={() => onEdit?.("tenant")}
        badge={
          <>
            <UserRound className="size-3" />
            {order.tenant?.type_label}
          </>
        }
        badgeClassName="bg-[#DCFCE7] text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]"
      >
        {order.tenant?.is_company ? (
          <div className="space-y-2">
            <Field label="جوال المستأجر" value={order.tenant?.phone} />
            <Field label="رقم السجل الموحّد" value={order.tenant?.registry_number} />
            <Field label="المنطقة" value={order.tenant?.region} />
            <Field label="المدينة" value={order.tenant?.city} />
          </div>
        ) : (
          <div className="space-y-2">
            <Field label="هوية المستأجر" value={order.tenant?.id_num} />
            <Field label="جوال المستأجر" value={order.tenant?.phone} />
          </div>
        )}
      </AccentCard>

      <AccentCard
        accent={financial.missing_count ? "#EF4444" : RT.brand}
        icon={Wallet}
        title="البيانات المالية"
        missingCount={financial.missing_count}
        onEdit={() => onEdit?.("financial")}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {financial.payment_method ? (
            <span className="px-2 py-0.5 rounded-full bg-status-neutral-bg dark:bg-white/10 text-[10.5px] font-bold text-[#4B5563] dark:text-white/70">
              {financial.payment_method}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold",
              financial.paid
                ? "bg-[#DCFCE7] text-green-700 dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]"
                : "bg-[#FEE2E2] text-red-600 dark:bg-[#3F1D1D] dark:text-[#FCA5A5]"
            )}
          >
            {financial.paid ? (
              <Check className="size-3" strokeWidth={2.75} />
            ) : null}
            {financial.paid ? "مدفوع" : "غير مدفوع"}
          </span>
        </div>

        <div className="space-y-2">
          <Field
            label="بداية العقد"
            value={financial.start_date}
            empty={!financial.start_date}
          />
          <Field label="المدة" value={financial.duration} />
          <Field label="الدفعات" value={financial.frequency} />
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 dark:text-white/40 font-medium">إجمالي الإيجار</span>
            <Money value={financial.rent} className="text-sm" />
          </div>
        </div>

        <div className="pt-2 border-t border-[#EEF1F0] dark:border-white/10 space-y-1.5">
          {hasFeeBlock ? (
            <>
              <FeeLine label="رسوم التوثيق">
                <Money value={financial.doc_fee_base ?? financial.doc_fee} />
              </FeeLine>
              {Number(financial.document_surcharge) > 0 ? (
                <FeeLine label="رسوم المستندات الإضافية">
                  <Money value={financial.document_surcharge} />
                </FeeLine>
              ) : null}
              {Number(financial.meter_fees_total) > 0 ? (
                <FeeLine label="رسوم نقل العدادات باسم المستأجر">
                  <Money value={financial.meter_fees_total} />
                </FeeLine>
              ) : null}
              <FeeLine label="ضريبة القيمة المضافة">
                {isZeroAmount(financial.doc_fee_vat) || !hasValue(financial.doc_fee_vat) ? (
                  <span className="text-xs font-black text-green-700 dark:text-[#6EE7B7]">
                    {financial.doc_fee_vat_label || "مجانًا"}
                  </span>
                ) : (
                  <Money value={financial.doc_fee_vat} />
                )}
              </FeeLine>
              <FeeLine label="إجمالي رسوم التوثيق">
                <Money value={financial.doc_fee} className="text-sm" />
              </FeeLine>
            </>
          ) : null}
          <FeeLine label={hasFeeBlock ? "المبلغ المدفوع" : "رسوم التوثيق"}>
            <span className="inline-flex items-center gap-1.5">
              {financial.fees_paid ? (
                <Check className="size-3.5 text-green-700 dark:text-[#6EE7B7]" strokeWidth={2.75} />
              ) : null}
              {amountPaidIsNumber ? (
                <Money value={financial.fees} />
              ) : (
                <span className="text-xs font-bold text-red-600 dark:text-[#FCA5A5]">
                  {financial.fees || "لم يتم الدفع"}
                </span>
              )}
            </span>
          </FeeLine>
        </div>
      </AccentCard>

      {financial.payment_review_count > 0 ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          دفعة بحاجة لمراجعة: مبلغها ({financial.payment_review_amount} ريال) لا يطابق المستحق — لا تُعتبر
          دفعاً حتى تُراجع يدوياً.
        </div>
      ) : null}

      <InvoiceCard invoice={order.invoice} />

      <AccentCard
        accent={RT.brand}
        icon={ScrollText}
        title="الشروط"
        onEdit={() => onEdit?.("financial")}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 dark:text-white/40 font-medium">مبلغ الضمان</span>
            {hasValue(terms.guarantee) ? <Money value={terms.guarantee} /> : <span className="font-bold text-[#D1D5DB] dark:text-white/25">—</span>}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 dark:text-white/40 font-medium">التأمين (العربون)</span>
            {hasValue(terms.deposit) ? <Money value={terms.deposit} /> : <span className="font-bold text-[#D1D5DB] dark:text-white/25">—</span>}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 dark:text-white/40 font-medium">الغرامة اليومية</span>
            {hasValue(terms.daily_fine) ? <Money value={terms.daily_fine} /> : <span className="font-bold text-[#D1D5DB] dark:text-white/25">—</span>}
          </div>
        </div>

        {financial.shared_meters ? (
          <div className="pt-2 border-t border-[#EEF1F0] dark:border-white/10 space-y-1.5">
            <p className="text-[11px] font-black text-brand-dark dark:text-[#6EE7B7]">
              رسوم العداد المشترك على المستأجر
              <span className="mr-1 font-bold text-gray-400 dark:text-white/40">(بند عقد — ليس ضمن رسوم التوثيق)</span>
            </p>
            {[
              ["الكهرباء", financial.shared_meters.electricity],
              ["المياه", financial.shared_meters.water],
            ]
              .filter(([, line]) => line)
              .map(([label, line]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-400 dark:text-white/40 font-medium">{label}</span>
                  <span className="font-bold text-[#4B5563] dark:text-white/70 tabular-nums" dir="rtl">
                    {line.monthly.toLocaleString("en-US")} ريال/شهر × {line.months} شهر ={" "}
                    <Money value={line.total} />
                  </span>
                </div>
              ))}
          </div>
        ) : null}

        <div className="pt-2 border-t border-[#EEF1F0] dark:border-white/10 space-y-1.5">
          <p className="text-[11px] font-black text-brand-dark dark:text-[#6EE7B7]">الشروط الإضافية</p>
          {terms.conditions?.length ? (
            <ul className="space-y-1">
              {terms.conditions.map((condition, index) => (
                <li
                  key={`${index}-${condition}`}
                  className="rounded-xl bg-status-neutral-bg dark:bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#4B5563] dark:text-white/70 leading-5"
                >
                  {condition}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 dark:text-white/40 font-medium">لا توجد شروط إضافية</p>
          )}
          {hasValue(terms.additional_terms) ? (
            <p className="rounded-xl bg-[#F0F7F4] dark:bg-white/[0.03] px-3 py-2 text-xs font-medium text-[#4B5563] dark:text-white/70 leading-5 whitespace-pre-line">
              {terms.additional_terms}
            </p>
          ) : null}
        </div>
      </AccentCard>
    </section>
  );
}
