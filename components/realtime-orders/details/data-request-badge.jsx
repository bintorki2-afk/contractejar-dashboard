"use client";

import { Bell, CheckCircle2, ExternalLink, Loader2, Paperclip, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/shared/confirm-provider";
import { useCancelDataRequest, useRemindDataRequest, useResolveDataRequest } from "@/src/hooks/use-data-requests";
import { dataRequestBadgeLabel, hoursWaitingLabel, itemLabels, needsReminder } from "@/src/lib/data-requests";

const actionBtn = "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-bold transition-colors disabled:opacity-60";

/**
 * شارة «بانتظار العميل · …» في رأس الطلب (دفعة هـ — E4): الضغط يفتح الطلبات المعلّقة
 * مع «تذكير» (واتساب + إشعار) و«تم الحل يدوياً» و«إلغاء» وفتح الرابط المباشر.
 */
export default function DataRequestBadge({ orderData, canEdit = true, className }) {
  const confirm = useConfirm();
  const pending = Array.isArray(orderData?.pending_data_requests) ? orderData.pending_data_requests : [];
  const remind = useRemindDataRequest();
  const resolve = useResolveDataRequest();
  const cancel = useCancelDataRequest();
  if (!pending.length) return null;

  const orderId = orderData.id;
  const first = pending[0];
  const overdue = pending.some((r) => needsReminder(r));
  const label = pending.length === 1 ? dataRequestBadgeLabel(first) : `بانتظار العميل · ${pending.length} طلبات`;

  const onResolve = async (r) => {
    const ok = await confirm({
      title: "إغلاق طلب المرفق",
      description: `تأكيد أن العميل أرسل «${itemLabels(r.items).join(" · ")}» بطريقة أخرى؟ سيُسجَّل أنك حللته يدوياً.`,
      confirmLabel: "تم الحل",
    });
    if (ok) resolve.mutate({ orderId, requestId: r.id });
  };
  const onCancel = async (r) => {
    const ok = await confirm({
      title: "إلغاء طلب المرفق",
      description: "سيُلغى الطلب ولن تظهر شارة «بانتظار العميل». لن يُبلَّغ العميل.",
      confirmLabel: "إلغاء الطلب",
      destructive: true,
    });
    if (ok) cancel.mutate({ orderId, requestId: r.id });
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-data-request-badge={pending.length}
          className={cn(
            "inline-flex h-8 max-w-[360px] items-center gap-1.5 truncate rounded-full border px-3 text-[12.5px] font-bold transition-colors",
            overdue
              ? "border-[#F5C9C6] bg-[#FDECEC] text-[#B42318] hover:bg-[#FBDCDA] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              : "border-[#F1D59A] bg-[#FFF7E6] text-[#7A4B00] hover:bg-[#FFF0D1] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
            className
          )}
          title="طلبات المرفقات الناقصة المعلّقة"
        >
          <Paperclip className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-[420px] max-w-[94vw] rounded-2xl border border-[#DBE3DC] bg-white p-3 text-right shadow-[0_8px_24px_rgba(20,40,30,.12)] dark:border-white/10 dark:bg-card">
        <div className="mb-2 text-[13px] font-bold text-[#14231D] dark:text-white">طلبات مرفق ناقص بانتظار العميل</div>
        <ul className="flex flex-col gap-2">
          {pending.map((r) => {
            const busy =
              (remind.isPending && remind.variables?.requestId === r.id) ||
              (resolve.isPending && resolve.variables?.requestId === r.id) ||
              (cancel.isPending && cancel.variables?.requestId === r.id);
            const late = needsReminder(r);
            return (
              <li key={r.id} className="rounded-xl border border-[#E3E8E3] bg-[#FAFBF9] p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
                  <span className="font-bold text-[#7A4B00] dark:text-amber-300">{r.section_label}</span>
                  <span className={cn("text-[11.5px]", late ? "font-bold text-[#B42318] dark:text-red-300" : "text-[#6B7B71] dark:text-white/50")}>
                    {hoursWaitingLabel(r.hours_waiting)}
                    {r.reminded_at ? " · ذُكِّر" : ""}
                  </span>
                  {r.requested_by_name ? <span className="text-[11.5px] text-[#8A958F]">· طلبها {r.requested_by_name}</span> : null}
                </div>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {itemLabels(r.items).map((l) => (
                    <li key={l} className="rounded-full bg-[#FFF7E6] px-2 py-0.5 text-[12px] font-semibold text-[#7A4B00] dark:bg-amber-500/10 dark:text-amber-200">
                      {l}
                    </li>
                  ))}
                </ul>
                {r.note ? <p className="mt-1 text-[12px] text-[#2F4A3B] dark:text-white/70">ملاحظة: {r.note}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {canEdit ? (
                    <>
                      <button type="button" disabled={busy} onClick={() => remind.mutate({ orderId, requestId: r.id })} className={cn(actionBtn, "bg-[#128C7E] text-white hover:bg-[#0F7A6D]")} title="يرسل تذكيراً بالواتساب ويعيد الإشعار">
                        {busy && remind.variables?.requestId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
                        تذكير واتساب
                      </button>
                      <button type="button" disabled={busy} onClick={() => onResolve(r)} className={cn(actionBtn, "border border-brand-line bg-white text-brand-deep hover:bg-brand-mint dark:border-white/10 dark:bg-transparent dark:text-emerald-300")}>
                        <CheckCircle2 className="size-3.5" />
                        تم الحل يدوياً
                      </button>
                      <button type="button" disabled={busy} onClick={() => onCancel(r)} className={cn(actionBtn, "text-[#B42318] hover:bg-[#FDECEC] dark:text-red-300")}>
                        <XCircle className="size-3.5" />
                        إلغاء
                      </button>
                    </>
                  ) : null}
                  {r.deep_link ? (
                    <a href={r.deep_link} target="_blank" rel="noreferrer" className={cn(actionBtn, "ms-auto text-[#6B7B71] hover:text-brand-deep dark:text-white/50")} title="الرابط الذي يفتحه العميل">
                      <ExternalLink className="size-3.5" />
                      رابط العميل
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
