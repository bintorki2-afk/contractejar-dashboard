"use client";

import { CreditCard, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { refundableAmount } from "@/src/hooks/use-refunds";
import { formatJourneyTime } from "@/src/lib/order-journey";
import ApplyOrderDiscountForm from "./apply-order-discount-form";

function Minus({ value }) {
  return (
    <>
      <bdi dir="ltr">−{Number(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</bdi> ر.س
    </>
  );
}

function sar(n) {
  return `${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;
}

const REFUND_STATUS = {
  succeeded: { label: "تم الاسترجاع", cls: "bg-[#E3F4EA] text-[#0B7A4C]" },
  pending: { label: "قيد التنفيذ", cls: "bg-[#FFF4DE] text-[#9A6100]" },
  failed: { label: "فشل", cls: "bg-[#FDECEC] text-[#B42318]" },
};

const PAYMENT_REFUND = {
  full: { label: "مسترجع كاملاً", cls: "bg-[#EEF1F0] text-[#4B5753]" },
  partial: { label: "مسترجع جزئياً", cls: "bg-[#FFF4DE] text-[#9A6100]" },
};

/** المدفوعات + سجل الاسترجاع للطلب (د9). */
export default function OrderPaymentsTab({ orderData, canRefund, onRefund, canDiscount }) {
  const payments = orderData?.payments ?? [];
  const refunds = orderData?.refunds ?? [];
  const canRefundNow = canRefund && payments.some((p) => (p.status === "success" || p.status === "paid") && refundableAmount(p) > 0);

  const isPaid = orderData?.is_paid === true || Number(orderData?.is_completed) === 1;

  return (
    <div className="flex flex-col gap-4">
      {canDiscount && !isPaid ? <ApplyOrderDiscountForm orderData={orderData} /> : null}
      {canRefund ? (
        <button
          type="button"
          onClick={onRefund}
          disabled={!canRefundNow}
          title={!canRefundNow ? "لا توجد دفعة ناجحة متبقية للاسترجاع" : undefined}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#F5C9C6] bg-white text-[13px] font-bold text-[#B42318] hover:bg-[#FDECEC] disabled:opacity-50 dark:bg-transparent dark:border-red-500/30 dark:text-red-300"
        >
          <Undo2 className="size-4" />
          استرجاع المبلغ عبر Moyasar
        </button>
      ) : null}

      <div>
        <h4 className="mb-2 text-[12px] font-extrabold text-[#6B7570] dark:text-white/50">المدفوعات</h4>
        {payments.length === 0 ? (
          <p className="text-[12.5px] text-[#8A958F]">لا توجد مدفوعات لهذا الطلب.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {payments.map((p) => {
              const tag = PAYMENT_REFUND[p.refund_status];
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-brand-line px-3 py-2.5 dark:border-white/10">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CreditCard className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold tabular-nums">{sar(p.amount)}</p>
                    <p className="text-[11px] text-[#8A958F]">
                      {p.brand || p.method || "دفعة"}
                      {p.paid_at ? <span dir="ltr" className="tabular-nums"> · {formatJourneyTime(p.paid_at)}</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tag ? <span className={cn("rounded-full px-2 h-5 inline-flex items-center text-[10.5px] font-bold", tag.cls)}>{tag.label}</span> : null}
                    {Number(p.refunded_amount) > 0 ? (
                      <span className="text-[11px] font-bold text-[#B42318] tabular-nums"><Minus value={p.refunded_amount} /></span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-[12px] font-extrabold text-[#6B7570] dark:text-white/50">سجل الاسترجاع</h4>
        {refunds.length === 0 ? (
          <p className="text-[12.5px] text-[#8A958F]">لا توجد عمليات استرجاع.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {refunds.map((r) => {
              const st = REFUND_STATUS[r.status] ?? { label: r.status_label ?? r.status, cls: "bg-[#EEF1F0] text-[#4B5753]" };
              return (
                <li key={r.id} className="rounded-xl border border-brand-line px-3 py-2.5 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-extrabold tabular-nums text-[#B42318] dark:text-red-300"><Minus value={r.amount} /></span>
                    <span className={cn("rounded-full px-2 h-5 inline-flex items-center text-[10.5px] font-bold", st.cls)}>{r.status_label || st.label}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#33403B] dark:text-white/70">{r.reason}</p>
                  <p className="mt-0.5 text-[11px] text-[#8A958F]">
                    {r.employee_name || "—"}
                    {r.created_at ? <span dir="ltr" className="tabular-nums"> · {formatJourneyTime(r.created_at)}</span> : null}
                    {r.failure_message ? <span className="text-[#B42318]"> · {r.failure_message}</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
