"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Copy,
  Loader2,
  MoreVertical,
  Printer,
  Tag,
  Trash2,
} from "lucide-react";
import { isReturnContractStatus } from "@/components/analysis/returned/refund-contract-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import waIcon from "@/public/images/waIcon.svg";
import { cn } from "@/lib/utils";
import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { axiosInstance } from "@/src/utils/axios";
import { printOrderContract } from "@/components/orders/single-order/print-contract";
import { useConfirm } from "@/components/shared/confirm-provider";
import { statusRequiresExtraFields } from "@/components/realtime-orders/change-order-status-fields-dialog";
import { DRAFT_RULE_HINT, statusRequiresDraftFirst } from "@/src/lib/draft-rule";
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close";

export default function OrderActionsMenu({
  order,
  triggerClassName,
  statuses = [],
  onStatusChange,
  canChangeStatus = false,
  isStatusPending = false,
  onDelete,
  canDelete = false,
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const confirm = useConfirm();

  // د7: تغيير الحالة من «⋮» يتطلب تأكيداً (الحالات ذات الحقول الإضافية تفتح نموذجها وهو التأكيد).
  const requestStatusChange = (status) => {
    if (statusRequiresExtraFields(status)) {
      onStatusChange?.(order, status);
      return;
    }
    const label = status.name ?? status.label;
    openDialogAfterMenuClose(async () => {
      const ok = await confirm({
        title: "تغيير حالة الطلب",
        description: `تغيير حالة الطلب #${order?.uuid ?? ""} إلى «${label}»؟${
          statusRequiresDraftFirst(status) ? ` (${DRAFT_RULE_HINT})` : ""
        } سيُشعَر العميل بالتغيير.`,
        confirmLabel: "تغيير الحالة",
      });
      if (ok) onStatusChange?.(order, status);
    });
  };
  // حالات قابلة للتغيير من القائمة، مع استبعاد حالات الاسترجاع (معطّلة لعقد إيجار).
  const changeableStatuses = (statuses || []).filter(
    (status) => status && !isReturnContractStatus(status)
  );

  const copyUuid = () => {
    navigator.clipboard.writeText(String(order?.uuid ?? ""));
    toast.success("تم نسخ رقم الطلب");
  };

  const openWhatsApp = () => {
    const mobile = toSaudiMobileDialDigits(order?.user_mobile ?? "");
    if (!mobile) {
      toast.error("لا يوجد رقم جوال للعميل");
      return;
    }
    window.open(`https://wa.me/${mobile}`, "_blank", "noopener,noreferrer");
  };

  const printOrder = async () => {
    if (!order?.id) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    setIsPrinting(true);
    try {
      const res = await axiosInstance.get(`/admin/orders/${order.id}`);
      const orderData = res?.data?.data ?? res?.data;
      const opened = printOrderContract(orderData);
      if (!opened) toast.error("تعذر فتح نافذة الطباعة");
    } catch (error) {
      toast.error(error?.response?.data?.message || "تعذر تحميل بيانات الطباعة");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="المزيد"
          className={cn(
            "size-8 rounded-lg border flex items-center justify-center transition-colors",
            "border-surface-border-soft text-status-neutral hover:text-brand-dark hover:border-brand-dark/30",
            "dark:border-white/10 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white",
            triggerClassName
          )}
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[260px] rounded-2xl border p-0 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.12)]",
          "border-[#E8EEEC] bg-white dark:border-white/10 dark:bg-card"
        )}
      >
        <div className="p-1.5">
          <DropdownMenuItem
            onSelect={copyUuid}
            className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
          >
            <Copy className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
            <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
              نسخ رقم الطلب
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={openWhatsApp}
            className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
          >
            <Image src={waIcon} alt="" width={16} height={16} className="shrink-0" />
            <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
              تواصل واتساب مع العميل
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isPrinting}
            onSelect={(event) => {
              event.preventDefault();
              printOrder();
            }}
            className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
          >
            {isPrinting ? (
              <Loader2 className="size-4 animate-spin text-status-neutral dark:text-white/50 shrink-0" />
            ) : (
              <Printer className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
            )}
            <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
              طباعة الطلب
            </span>
          </DropdownMenuItem>

          {canChangeStatus && changeableStatuses.length > 0 && (
            <>
              <DropdownMenuSeparator className="my-1" />
              <div className="flex items-center gap-2 px-3 pt-1 pb-1.5">
                <Tag className="size-3.5 text-status-neutral dark:text-white/50 shrink-0" />
                <span className="text-11 font-bold text-status-neutral dark:text-white/50">
                  تغيير الحالة
                </span>
              </div>
              {changeableStatuses.map((status) => (
                <DropdownMenuItem
                  key={status.id}
                  disabled={isStatusPending}
                  onSelect={() => requestStatusChange(status)}
                  className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: status.color || "#9CA3AF" }}
                  />
                  <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                    {status.name ?? status.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete(order);
                }}
                className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-red-50 dark:focus:bg-red-500/10"
              >
                <Trash2 className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                <span className="flex-1 text-13 font-bold text-red-600 dark:text-red-400 text-right">
                  حذف الطلب
                </span>
              </DropdownMenuItem>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
