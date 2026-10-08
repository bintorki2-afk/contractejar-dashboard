"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Link2,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  Paperclip,
  Phone,
  Printer,
  Send,
  Undo2,
  Upload,
  ZoomIn,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import waIcon from "@/public/images/waIcon.svg";
import { cn } from "@/lib/utils";
import { printOrderContract } from "@/components/orders/single-order/print-contract";
import SendOrderSmsButton from "@/components/orders/shared/send-order-sms-button";
import {
  buildOrderPaymentUrl,
  getOrderSmsTemplates,
} from "@/components/orders/shared/order-sms-templates";
import { getOrderContractUuid } from "@/components/orders/messages/order-section-message-utils";
import { fetchContractPaymentLink } from "@/components/orders/shared/payment-gateway";
import { getSendErrorTitle } from "@/components/orders/messages/order-send-error-utils";
import { DRAFT_RULE_HINT, statusRequiresDraftFirst } from "@/src/lib/draft-rule";

// د16: أزرار «إرسال المسودة عبر واتساب / تم التوثيق» السريعة استُبدلت بشريط «الخطوة التالية»
// (OrderStageBar) الذي يستدعي مراحل الخادم ويفتح واتساب برسالة القالب.

const ACTION_PILLS = [
  {
    id: "view_file",
    label: "عرض مكبّر",
    Icon: ZoomIn,
    className:
      "border-[#D1D5DB] text-[#6B7280] hover:bg-[#F9FAFB] dark:border-white/15 dark:text-white/70",
  },
  {
    id: "property_update",
    label: "رفع تحديث العقار",
    Icon: Upload,
    className:
      "border-[#3B82F6] text-[#2563EB] hover:bg-[#EFF6FF] dark:border-blue-400/50 dark:text-blue-300",
  },
  {
    id: "send_draft",
    label: "إرسال المسودة",
    Icon: Send,
    className:
      "border-[#D97706] text-[#B45309] hover:bg-[#FFFBEB] dark:border-amber-400/50 dark:text-amber-300",
  },
  {
    id: "missing_attachment",
    label: "طلب مرفق ناقص",
    Icon: Paperclip,
    className:
      "border-[#EF4444] text-[#DC2626] hover:bg-[#FEF2F2] dark:border-red-400/50 dark:text-red-300",
  },
  {
    id: "refund",
    label: "رفع طلب استرجاع",
    Icon: Undo2,
    className:
      "border-[#6B7280] text-[#4B5563] hover:bg-[#F9FAFB] dark:border-white/20 dark:text-white/70",
  },
  {
    id: "ejar_documentation",
    label: "موثق في إيجار",
    Icon: BadgeCheck,
    className:
      "border-[#16A34A] text-[#15803D] hover:bg-[#F0FDF4] dark:border-green-400/50 dark:text-green-300",
  },
  {
    id: "pay_link",
    label: "توليد رابط دفع",
    Icon: Link2,
    className:
      "border-[var(--main-color)] text-brand-dark hover:bg-[#F3F9F6] dark:border-[#6EE7B7]/50 dark:text-[#6EE7B7]",
  },
];

const SECTION_ERROR_CONTEXTS = [
  "owner",
  "agent",
  "propertyAddress",
  "contractTenant",
  "financialTerms",
  "unitDetails",
];

const pillBase =
  "h-7 px-3.5 rounded-lg border bg-white dark:bg-transparent text-[10px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap";

export default function OrderDetailsHeader({
  order,
  orderData,
  backHref = "/home/orders",
  backLabel = "الطلبات",
  onStatusChange,
  onOpenNotes,
  onPayLink,
  onRefund,
  onPropertyUpdate,
  onSendDraft,
  onMissingAttachment,
  onEjarDocumentation,
  onQuickSendDraft,
  onQuickNotarized,
  onSendSectionError,
  onViewExpanded,
  refundLabel,
  statuses = [],
  canChangeStatus = true,
  isStatusPending = false,
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopyingPayLink, setIsCopyingPayLink] = useState(false);
  const smsTriggerRef = useRef(null);

  const orderUuid =
    order?.uuid ||
    getOrderContractUuid(orderData) ||
    "";
  const smsTemplates = getOrderSmsTemplates(orderUuid);

  const stamp = order.received_at
    ? new Date(order.received_at)
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", " -")
    : new Date()
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", " -");

  const mobileDigits =
    order.user_mobile_dial ||
    (order.user_mobile ? String(order.user_mobile).replace(/\D/g, "") : "");
  const mobileDisplay = order.user_mobile || "";
  // زر واتساب يفتح رقم العميل صاحب الطلب إن عُرف، وإلا الجوال المعروض.
  const whatsappDigits = order.customer_whatsapp_dial || mobileDigits;

  const copyText = async (text, successMessage) => {
    if (!text?.trim()) {
      toast.error("لا يوجد نص للنسخ");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const handlePrint = () => {
    if (!orderData) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    setIsPrinting(true);
    try {
      const opened = printOrderContract(orderData);
      if (!opened) toast.error("تعذر فتح نافذة الطباعة");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSms = () => {
    if (!orderData) {
      toast.error("لا توجد بيانات لإرسال الرسالة");
      return;
    }
    smsTriggerRef.current?.querySelector("button")?.click();
  };

  const handleCopyPaymentLink = async () => {
    if (!orderUuid) {
      toast.error("رقم الطلب غير متوفر");
      return;
    }

    setIsCopyingPayLink(true);
    try {
      const result = await fetchContractPaymentLink(orderUuid);
      if (result.alreadyPaid) {
        toast.error(result.message || "هذا العقد مدفوع مسبقاً");
        return;
      }
      const url = result.paymentUrl || buildOrderPaymentUrl(orderUuid);
      await copyText(url, "تم نسخ رابط الدفع");
    } catch {
      const fallback = buildOrderPaymentUrl(orderUuid);
      await copyText(fallback, "تم نسخ رابط الدفع");
    } finally {
      setIsCopyingPayLink(false);
    }
  };

  const handleCopySmsTemplate = (template) => {
    copyText(template.body, `تم نسخ قالب: ${template.label}`);
  };

  const handlePill = (id) => {
    if (id === "view_file") {
      if (orderData) {
        onViewExpanded?.();
      } else {
        toast.error("لا توجد بيانات للعرض");
      }
      return;
    }
    if (id === "pay_link") {
      onPayLink?.();
      return;
    }
    if (id === "refund") {
      onRefund?.();
      return;
    }
    if (id === "property_update") {
      onPropertyUpdate?.();
      return;
    }
    if (id === "send_draft") {
      onSendDraft?.();
      return;
    }
    if (id === "missing_attachment") {
      onMissingAttachment?.();
      return;
    }
    if (id === "ejar_documentation") {
      onEjarDocumentation?.();
    }
  };

  return (
    <div
      className="space-y-3 my-2.5 py-2.5 px-5 rounded-[20px] bg-white dark:bg-[#0F1C16] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)]"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={backHref}
          className="h-7 px-2 rounded-xl border bg-gray-100 dark:bg-white/[0.06] border-surface-border-soft dark:border-white/10 text-xs font-bold  dark:text-white/60 inline-flex items-center gap-1.5 hover:border-brand-dark/30 hover:text-brand-dark"
        >
          <ChevronRight className="size-3.5" />
          {backLabel}
        </Link>

        <button
          type="button"
          onClick={() => copyText(String(order.uuid ?? ""), "تم نسخ رقم الطلب")}
          className="inline-flex items-center gap-1.5 group"
          title="نسخ رقم الطلب"
        >
          <span className="text-15 font-black text-brand-dark dark:text-[#6EE7B7] tabular-nums">
            #{order.uuid}
          </span>
          <Copy
            className="size-3.5 text-gray-400 group-hover:text-brand-dark dark:text-white/35 dark:group-hover:text-[#6EE7B7] transition-colors"
          />
        </button>

        <span className="conic-border-badge inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-green-700 dark:text-[#6EE7B7] text-[12.5px] font-bold">
          <FileText className="size-3.5" />
          عقد {order.contract_type} - {order.instrument_type} - وزارة العدل
        </span>

        <StatusSelect
          order={order}
          statuses={statuses}
          onStatusChange={onStatusChange}
          disabled={!canChangeStatus || isStatusPending}
        />

        <span className="h-7 px-3 rounded-full bg-[#EDE9FE] text-[#6D28D9] text-[12.5px] font-bold inline-flex items-center">
          المستلم: {order.employee_name || "—"}
        </span>

        {mobileDisplay ? (
          <a
            href={`tel:${mobileDigits.startsWith("966") ? "+" : ""}${mobileDigits}`}
            className="h-7 px-3 rounded-full border border-surface-border-soft dark:border-white/10 text-[12.5px] font-bold text-gray-700 dark:text-white/80 inline-flex items-center gap-1.5 tabular-nums hover:border-brand-dark/30"
            dir="ltr"
          >
            <Phone className="size-3.5 text-gray-400" />
            {mobileDisplay}
          </a>
        ) : null}

        {order.customer_whatsapp && order.customer_whatsapp !== mobileDisplay ? (
          <span
            className="h-7 px-3 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[12.5px] font-bold text-gray-700 dark:text-white/80 inline-flex items-center gap-1.5 tabular-nums"
            title="رقم واتساب العميل صاحب الطلب"
          >
            واتساب العميل: <span dir="ltr">{order.customer_whatsapp}</span>
          </span>
        ) : null}

        {whatsappDigits ? (
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noreferrer"
            aria-label="واتساب"
            className="size-9 rounded-full bg-[#25D366]/15 flex items-center justify-center hover:bg-[#25D366]/25"
          >
            <Image src={waIcon} alt="" width={16} height={16} />
          </a>
        ) : null}

        <span className="h-7 px-3 rounded-full border-2 border-[#1D4ED8] text-[#1D4ED8] text-[12.5px] font-bold inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {order.contract_type}
        </span>

        <span
          className={cn(
            "h-7 px-3 rounded-full border-2 text-[12.5px] font-black flex items-center",
            order.is_paid
              ? "border-green-700 text-green-700"
              : "border-[#EA580C] text-[#EA580C]"
          )}
        >
          {order.is_paid ? "مدفوع" : "غير مدفوع"}
        </span>

        <span className="h-7 px-3 rounded-full border border-surface-border-soft dark:border-white/10 text-[12.5px] font-bold text-gray-500 dark:text-white/60 inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {stamp}
        </span>

        <button
          type="button"
          onClick={onOpenNotes}
          className="h-7 px-3 rounded-full border border-surface-border-soft dark:border-white/10 text-[12.5px] font-bold text-gray-700 dark:text-white/80 inline-flex items-center gap-1.5 hover:border-brand-dark/30"
        >
          <MessageSquarePlus className="size-3.5" />
          إضافة ملاحظة
        </button>

        <DropdownMenu dir="rtl" modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-7 px-3.5 rounded-full border border-surface-border-soft dark:border-white/10 bg-white dark:bg-transparent text-[12.5px] font-bold text-gray-700 dark:text-white/80 inline-flex items-center gap-1.5 hover:border-brand-dark/30"
            >
              إجراءات
              <ChevronDown className="size-3.5 opacity-70" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-[300px] rounded-2xl border border-[#E8EEEC] dark:border-white/10 bg-white dark:bg-card p-1.5 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
          >
            <DropdownMenuItem
              onSelect={handlePrint}
              disabled={isPrinting}
              className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
            >
              {isPrinting ? (
                <Loader2 className="size-4 animate-spin text-status-neutral shrink-0" />
              ) : (
                <Printer className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
              )}
              <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                طباعة
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={handleSms}
              disabled={!orderData}
              className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
            >
              <MessageSquareText className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
              <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                رسالة SMS
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => {
                handleCopyPaymentLink();
              }}
              disabled={!orderUuid || isCopyingPayLink}
              className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
            >
              {isCopyingPayLink ? (
                <Loader2 className="size-4 animate-spin text-status-neutral shrink-0" />
              ) : (
                <Copy className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
              )}
              <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                نسخ رابط الدفع
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-surface-border dark:bg-white/10 my-1" />

            <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-bold text-gray-400">
              قوالب الرسائل
            </DropdownMenuLabel>

            {smsTemplates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onSelect={() => handleCopySmsTemplate(template)}
                className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
              >
                <Copy className="size-3.5 text-status-neutral dark:text-white/50 shrink-0" />
                <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right leading-snug">
                  {template.label}
                </span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-surface-border dark:bg-white/10 my-1" />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]">
                <Bell className="size-4 text-status-neutral dark:text-white/50 shrink-0" />
                <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                  إرسال خطأ للعميل
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[260px] rounded-2xl border border-[#E8EEEC] dark:border-white/10 bg-white dark:bg-card p-1.5 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
                {SECTION_ERROR_CONTEXTS.map((context) => (
                  <DropdownMenuItem
                    key={context}
                    onSelect={() => onSendSectionError?.(context)}
                    className="rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 focus:bg-[#F3F9F6] dark:focus:bg-white/[0.06]"
                  >
                    <span className="flex-1 text-13 font-bold text-gray-900 dark:text-white/90 text-right">
                      {getSendErrorTitle(context)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border-t border-[#EEF2F0] dark:border-white/5 pt-3 flex flex-wrap items-center gap-2">
        {ACTION_PILLS.map((pill) => {
          const Icon = pill.Icon;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handlePill(pill.id)}
              className={cn(pillBase, pill.className)}
            >
              <Icon className="size-3.5 shrink-0" />
              {pill.id === "refund" && refundLabel ? refundLabel : pill.label}
            </button>
          );
        })}
      </div>

      {order.banner ? (
        <div className="rounded-xl bg-[#FBF3E0] text-[#92400E] text-[12.5px] font-bold px-4 py-2.5">
          {order.banner}
        </div>
      ) : null}

      {orderData ? (
        <div ref={smsTriggerRef} className="hidden" aria-hidden>
          <SendOrderSmsButton order={orderData} label="رسالة" />
        </div>
      ) : null}
    </div>
  );
}

function StatusSelect({ order, statuses = [], onStatusChange, disabled }) {
  const [pendingStatus, setPendingStatus] = useState(null);

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="h-7 px-3 rounded-full border border-surface-border-soft dark:border-white/10 bg-[#F3F4F6] dark:bg-white/[0.06] text-[12.5px] font-bold text-gray-700 dark:text-white/80 inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {order.status_name}
            <ChevronDown className="size-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          dir="rtl"
          className="min-w-[220px] rounded-xl p-1 border-surface-border-soft max-h-[280px] overflow-y-auto text-right"
        >
          {statuses.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">لا توجد حالات</p>
          ) : (
            statuses.map((status) => {
              const label = status.name ?? status.label;
              const active =
                String(status.id) === String(order.status_id) ||
                label === order.status_name;
              return (
                <DropdownMenuItem
                  key={status.id}
                  disabled={disabled || active}
                  onSelect={() => {
                    if (active) return;
                    // Confirm before applying a status change (guards against misclicks).
                    setPendingStatus(status);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2.5 cursor-pointer text-13 font-bold text-right",
                    active
                      ? "bg-[#1D63D2] text-white focus:bg-[#1D63D2] focus:text-white"
                      : "text-gray-700 dark:text-white/80"
                  )}
                >
                  <span className="flex flex-col gap-0.5">
                    <span>{label}</span>
                    {statusRequiresDraftFirst(status) ? (
                      <span
                        className={cn(
                          "text-[10.5px] font-semibold",
                          active ? "text-white/80" : "text-[#B45309] dark:text-amber-300"
                        )}
                      >
                        {DRAFT_RULE_HINT}
                      </span>
                    ) : null}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(next) => {
          if (!next) setPendingStatus(null);
        }}
        title="تغيير حالة الطلب"
        description={
          pendingStatus
            ? `هل تريد تغيير حالة الطلب إلى «${
                pendingStatus.name ?? pendingStatus.label
              }»؟${
                statusRequiresDraftFirst(pendingStatus) ? ` (${DRAFT_RULE_HINT})` : ""
              }`
            : ""
        }
        confirmLabel="تغيير الحالة"
        onConfirm={() => {
          const status = pendingStatus;
          setPendingStatus(null);
          if (status) onStatusChange?.(order, status);
        }}
      />
    </>
  );
}
