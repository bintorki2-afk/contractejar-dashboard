"use client";

import { useState } from "react";
import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import ReturnOrdersWrapper from "@/components/orders/return-orders-wrapper";
import RefundsList from "@/components/orders/refunds-list";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * «المرتجعات» (دفعة د — د9): عمليات الاسترجاع عبر Moyasar (payments.view)،
 * وتبويب «طلبات الاسترجاع» القديمة (returned_request) كما هي.
 */
export default function Page(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  const { can, isAdmin } = usePermissions();
  const canRefunds = isAdmin || can(PERMISSION_SECTIONS.payments, "view");
  const canRequests = isAdmin || can(PERMISSION_SECTIONS.returned_request, "view");
  const tabs = [
    canRefunds ? { key: "refunds", label: "عمليات الاسترجاع (Moyasar)" } : null,
    canRequests ? { key: "requests", label: "طلبات الاسترجاع" } : null,
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab ?? tabs[0]?.key;

  return (
    <div className="flex flex-col gap-4 min-h-full" dir="rtl">
      <div>
        <h1 className="text-[20px] font-extrabold text-[#0E1F18] dark:text-white">المرتجعات</h1>
        <p className="mt-1 text-[12.5px] text-[#6B7570] dark:text-white/50">
          الاسترجاع يُنفَّذ من صفحة الطلب ← «استرجاع المبلغ» (كلي/جزئي) عبر بوابة Moyasar.
        </p>
      </div>
      {tabs.length > 1 ? (
        <div role="tablist" className="inline-flex w-fit rounded-xl border border-brand-line bg-white p-1 dark:bg-white/[0.04] dark:border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-9 px-4 rounded-lg text-[13px] font-bold",
                active === t.key ? "bg-brand-deep text-white" : "text-[#4B5753] dark:text-white/60"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
      {active === "refunds" ? <RefundsList /> : active === "requests" ? <ReturnOrdersWrapper /> : null}
    </div>
  );
}
