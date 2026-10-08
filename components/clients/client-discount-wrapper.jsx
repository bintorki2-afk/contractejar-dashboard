"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Loader from "@/components/home/loader";
import { cn, safeInternalPath } from "@/lib/utils";
import { useClientDetail } from "@/src/hooks/use-clients";
import {
  useAssignClientCoupon,
  useClientCoupons,
  useDeactivateClientCoupon,
} from "@/src/hooks/use-client-discount";
import { DISCOUNT_TYPES, getDiscountPreviewRows } from "@/src/lib/client-discount";
import { usePublicPricing } from "@/src/hooks/use-public-pricing";
import ActiveDiscountBadge from "./active-discount-badge";
import ClientDiscountForm from "./client-discount-form";
import DiscountHistoryList from "./discount-history-list";
import DiscountImpactTable from "./discount-impact-table";

const PANEL_CLASS = cn(
  "rounded-2xl border bg-white p-5 sm:p-6",
  "border-panel-border shadow-sm",
  "dark:bg-panel-dark dark:border-white/[0.08] dark:shadow-none"
);

export default function ClientDiscountWrapper() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params?.userId;
  const from = searchParams.get("from") || `/home/users/${clientId}`;
  const backUrl = safeInternalPath(from, `/home/users/${clientId}`);

  const { client, isLoading: isClientLoading } = useClientDetail(clientId);
  const { coupons, activeCoupon, isLoading: isCouponsLoading } = useClientCoupons(clientId);
  const { mutate: assignCoupon, isPending: isAssigning } = useAssignClientCoupon(clientId);
  const { mutate: deactivateCoupon, isPending: isDeactivating } = useDeactivateClientCoupon(clientId);

  const [previewValues, setPreviewValues] = useState({
    type: DISCOUNT_TYPES.PERCENTAGE,
    value: "",
    appliesTo: "all",
  });

  const handleValuesChange = useCallback((values) => {
    setPreviewValues((prev) => {
      if (
        prev.type === values.type &&
        prev.value === values.value &&
        prev.appliesTo === values.appliesTo
      ) {
        return prev;
      }
      return { type: values.type, value: values.value, appliesTo: values.appliesTo };
    });
  }, []);

  // أساس المعاينة = سعر السنة الأولى الرسمي لكل نوع (لا 349 للنوعين).
  const { data: pricing } = usePublicPricing();
  const previewRows = getDiscountPreviewRows({
    ...previewValues,
    prices: {
      housing: pricing?.housing?.first_year,
      commercial: pricing?.commercial?.first_year,
    },
  });

  const handleDeactivate = (couponId) => {
    if (!couponId) return;
    if (!window.confirm("هل أنت متأكد من إلغاء تفعيل هذا الخصم؟")) return;
    deactivateCoupon(couponId);
  };

  if (isClientLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-5 min-h-full transition-colors" dir="rtl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
            <h1 className="text-xl sm:text-22 font-bold text-gray-900 dark:text-white leading-tight">
              خصم مخصّص – {client?.name || "..."}
            </h1>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/45 font-medium">
              يُطبَّق على رسوم السنة الأولى للطلبات القادمة فقط (المدفوع سابقًا لا يتأثر)
            </p>
          </div>
        </div>

        {isCouponsLoading ? (
          <Loader2 className="size-4 animate-spin text-brand-dark dark:text-emerald-300" />
        ) : (
          <ActiveDiscountBadge
            activeCoupon={activeCoupon}
            onDeactivate={handleDeactivate}
            isDeactivating={isDeactivating}
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">

        <section className={cn(PANEL_CLASS, "w-full lg:w-96 lg:shrink-0")}>
          <h3 className="text-15 font-bold text-gray-900 dark:text-white mb-4">إعداد الخصم</h3>
          <ClientDiscountForm
            onSubmit={(values) => assignCoupon(values)}
            isSubmitting={isAssigning}
            onValuesChange={handleValuesChange}
          />
        </section>

        <section className={cn(PANEL_CLASS, "flex-1 min-w-0 w-full grid gap-6")}>
          <div className="grid gap-4">
            <div>
              <h3 className="text-15 font-bold text-gray-900 dark:text-white">
                تقدير الأثر على الطلبات القادمة
              </h3>
              <p className="mt-1.5 text-xs font-medium text-gray-400 dark:text-white/45 leading-relaxed">
                الخصم يُطبَّق على{" "}
                <span className="font-bold text-gray-600 dark:text-white/60">
                  رسوم السنة الأولى
                </span>{" "}
                للطلبات القادمة فقط. السنوات الإضافية برسومها كاملة، والمدفوع سابقًا لا يتأثر. هذا
                تقدير توضيحي وليس مبنيًا على بيانات عقد حقيقي.
              </p>
            </div>
            <DiscountImpactTable rows={previewRows} />
          </div>

          <div className="grid gap-4 border-t border-panel-divider dark:border-white/[0.08] pt-6">
            <h3 className="text-15 font-bold text-gray-900 dark:text-white">سجل الخصومات</h3>
            <DiscountHistoryList
              coupons={coupons}
              onDeactivate={handleDeactivate}
              isDeactivating={isDeactivating}
              isLoading={isCouponsLoading}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
