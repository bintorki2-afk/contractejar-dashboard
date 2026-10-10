"use client";

import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCheck, ListChecks, Loader2, MessageSquareReply, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import {
  useEmployeeNotifications,
  useMarkAllEmployeeNotificationsRead,
  useMarkEmployeeNotificationRead,
} from "@/src/hooks/use-employee-notifications";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  reply: MessageSquareReply,
  paid: BadgeCheck,
  edit: PencilLine,
  partial: ListChecks,
};

const TONE = {
  info: "bg-[#EAF2FF] text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-300",
  success: "bg-[#E4F3EC] text-[#0B7A4C] dark:bg-emerald-500/15 dark:text-emerald-300",
  neutral: "bg-[#F0F8F4] text-[#0B5A3C] dark:bg-[#1B3A2E] dark:text-emerald-300",
  warning: "bg-[#FFF4E0] text-[#9A6100] dark:bg-amber-500/15 dark:text-amber-300",
};

/**
 * دفعة هـ (D-1): «ردّ العملاء ودفعاتهم» — إشعارات الموظف من الخادم في لوحة الجرس:
 * النقر يضع الإشعار مقروءاً ويفتح صفحة الطلب؛ «قراءة الكل» تصفّر الشارة.
 */
export default function EmployeeNotificationList() {
  const router = useRouter();
  const { setDisplayedPart } = useSidebarStore();
  const { items, unreadCount, isLoading, isError } = useEmployeeNotifications();
  const markRead = useMarkEmployeeNotificationRead();
  const markAll = useMarkAllEmployeeNotificationsRead();

  const open = (n) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (!n.href) {
      toast.message("لا يوجد طلب مرتبط بهذا الإشعار");
      return;
    }
    setDisplayedPart("default");
    router.push(n.href);
  };

  const card = cn("rounded-2xl border", "bg-white border-[#ECECEA]", "dark:bg-[#13251E] dark:border-[#26473A]");

  return (
    <section aria-label="إشعارات الموظف" data-employee-notifications className="flex flex-col gap-2.5">
      <div className={cn(card, "p-4 flex items-center justify-between gap-3")}>
        <div className="min-w-0">
          <p className="text-13 font-bold text-gray-900 dark:text-[#D6E5DE]">ردّ العملاء ودفعاتهم</p>
          <p className="mt-1 text-11 text-[#98A39E] dark:text-[#9FC0B4]">
            {unreadCount > 0 ? `${unreadCount} غير مقروء` : "لا جديد — كل شيء مقروء"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className={cn(
                "h-8 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-60",
                "border-[#E3E8E6] bg-white text-[#33403B] hover:bg-[#F7FAF9]",
                "dark:border-[#2C5648] dark:bg-[#1B3A2E] dark:text-[#CDEBDD] dark:hover:bg-[#234B3C]"
              )}
            >
              {markAll.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              قراءة الكل
            </button>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-[13px] font-black tabular-nums",
              unreadCount > 0 ? "bg-[#E5484D] text-white" : "bg-[#F0F8F4] text-[#0B5A3C] dark:bg-[#1B3A2E] dark:text-emerald-300"
            )}
            data-employee-unread
          >
            {unreadCount}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className={cn(card, "py-6 flex items-center justify-center")}>
          <Loader2 className="animate-spin size-6 text-brand-accent" />
        </div>
      ) : isError ? (
        <p className={cn(card, "px-4 py-3 text-11 font-bold text-[#B3472A] dark:text-red-300")}>تعذّر جلب إشعارات الموظف.</p>
      ) : items.length === 0 ? (
        <p className={cn(card, "px-4 py-3 text-11 text-[#98A39E] dark:text-[#9FC0B4]")}>
          سيظهر هنا ردّ العميل على طلب مرفق ناقص ودفعه للرسوم أو فرق السعر.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const Icon = KIND_ICON[n.icon] ?? BadgeCheck;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  data-employee-notification={n.id}
                  data-unread={n.isRead ? undefined : "1"}
                  className={cn(
                    card,
                    "w-full text-start p-3 flex items-start gap-2.5 transition-colors hover:border-[#CDEBDF] dark:hover:border-emerald-500/40",
                    !n.isRead && "border-[#CDEBDF] bg-[#F7FCF9] dark:bg-[#15302A]"
                  )}
                >
                  <span className={cn("relative flex items-center justify-center size-8 rounded-full shrink-0", TONE[n.tone] ?? TONE.neutral)}>
                    <Icon className="size-4" strokeWidth={2.2} />
                    {!n.isRead ? (
                      <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#E5484D] ring-2 ring-white dark:ring-[#13251E]" aria-hidden />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-[12.5px] leading-tight truncate", n.isRead ? "font-bold text-[#33403B] dark:text-[#CDEBDD]" : "font-black text-gray-900 dark:text-white")}>
                        {n.title}
                      </span>
                      {n.orderNumber ? (
                        <span className="text-[10.5px] font-bold text-[#8A9490] dark:text-[#9FC0B4] tabular-nums shrink-0" dir="ltr">
                          #{n.orderNumber}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[11px] leading-snug text-[#5F6B66] dark:text-[#B5CBC2] line-clamp-3">{n.body}</span>
                    <span className="text-[10.5px] font-bold text-[#98A39E] dark:text-[#9FC0B4]">
                      {n.kindLabel} · {n.timeLabel}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
