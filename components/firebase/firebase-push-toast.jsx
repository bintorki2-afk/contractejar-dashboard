"use client";

import { Bell, MessageSquareText, Package, X } from "lucide-react";

const VARIANT_STYLES = {
  comment: {
    icon: MessageSquareText,
    accent: "border-[#A000F0]",
    iconBg: "bg-[#F6E8FF]",
    iconColor: "text-[#A000F0]",
    badge: "تعليق جديد",
    badgeClass: "bg-[#F6E8FF] text-[#A000F0]",
    actionClass: "bg-[#A000F0] hover:bg-[#8A00D1]",
  },
  order: {
    icon: Package,
    accent: "border-[#0004E2]",
    iconBg: "bg-[#EEF0FF]",
    iconColor: "text-[#0004E2]",
    badge: "طلب جديد",
    badgeClass: "bg-[#EEF0FF] text-[#0004E2]",
    actionClass: "bg-[#0004E2] hover:bg-[#0003c4]",
  },
  default: {
    icon: Bell,
    accent: "border-[#0B5A3C]",
    iconBg: "bg-[#E8F5F3]",
    iconColor: "text-[#0B5A3C]",
    badge: "إشعار",
    badgeClass: "bg-[#E8F5F3] text-[#0B5A3C]",
    actionClass: "bg-[#0B5A3C] hover:bg-[#0a4f47]",
  },
};

export default function FirebasePushToast({
  title,
  body,
  orderId,
  variant = "default",
  onDismiss,
  onAction,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const Icon = styles.icon;

  return (
    <div
      dir="rtl"
      className={`w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] border-r-4 ${styles.accent}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconColor}`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-10 font-bold ${styles.badgeClass}`}
              >
                {styles.badge}
              </span>
              <p className="text-15 font-bold leading-6 text-gray-900">{title}</p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-gray-400 transition-colors hover:bg-surface-border hover:text-[#4B5563]"
              aria-label="إغلاق الإشعار"
            >
              <X className="size-4" />
            </button>
          </div>

          {body ? (
            <p className="text-13 leading-6 text-status-neutral line-clamp-3">{body}</p>
          ) : null}

          {orderId ? (
            <p className="text-xs font-semibold text-gray-400" dir="ltr">
              #{orderId}
            </p>
          ) : null}

          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className={`mt-1 inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-bold text-white transition-colors ${styles.actionClass}`}
            >
              عرض التفاصيل
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
