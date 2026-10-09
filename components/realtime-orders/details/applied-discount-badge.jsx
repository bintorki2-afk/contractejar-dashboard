"use client";

import { Tag } from "lucide-react";

/** «الخصم المطبّق» (د24): كوبون أو خصم مخصّص من applied_discount. */
export function AppliedDiscountBadge({ discount }) {
  if (!discount) return null;
  const amount = Number(discount.amount ?? 0);
  const label = discount.coupon_code ? `كوبون ${discount.coupon_code}` : discount.source_label || "خصم مطبّق";
  const title = [
    discount.source_label,
    discount.reason ? `السبب: ${discount.reason}` : null,
    discount.employee_name ? `بواسطة ${discount.employee_name}` : null,
    discount.total_before != null && discount.total_after != null ? `${discount.total_before} ← ${discount.total_after} ر.س` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      title={title || undefined}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#FFF4DE] px-3 text-[12.5px] font-bold text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300"
    >
      <Tag className="size-3.5" />
      الخصم المطبّق: {label}
      {amount > 0 ? (
        <bdi dir="ltr" className="tabular-nums">
          −{amount.toLocaleString("en-US")}
        </bdi>
      ) : null}
      {amount > 0 ? " ر.س" : null}
    </span>
  );
}
