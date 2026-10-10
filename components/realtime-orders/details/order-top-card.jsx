"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Banknote,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Copy,
  FileText,
  Link2,
  Loader2,
  MessageSquarePlus,
  MessageSquareText,
  Paperclip,
  Pencil,
  PlusCircle,
  Printer,
  Receipt,
  Tag,
  Undo2,
  Upload,
  XCircle,
  ZoomIn,
  BadgeCheck,
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
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { printOrderContract } from "@/components/orders/single-order/print-contract";
import SendOrderSmsButton from "@/components/orders/shared/send-order-sms-button";
import { buildOrderPaymentUrl, getOrderSmsTemplates } from "@/components/orders/shared/order-sms-templates";
import { fetchContractPaymentLink } from "@/components/orders/shared/payment-gateway";
import { getSendErrorTitle } from "@/components/orders/messages/order-send-error-utils";
import { DelayBadge, StatusPill } from "@/components/orders/status-pill";
import { formatSaudiMobileDisplay, toSaudiMobileDialDigits } from "@/src/lib/format-phone";
import { paymentBreakdown, sar } from "@/src/lib/payment-state";
import OrderJourney from "./order-journey";
import PaymentChip, { openInvoice } from "./payment-chip";
import PreviousOrdersChip from "./previous-orders-chip";
import { CopyBtn, copyText } from "./order-cells";
import { EjarCopyDialog } from "./ejar-copy";

const SECTION_ERROR_CONTEXTS = ["owner", "agent", "propertyAddress", "contractTenant", "financialTerms", "unitDetails"];
const EDIT_SECTIONS = [
  { key: "deed", label: "الصك والمالك" },
  { key: "address", label: "العقار والعنوان" },
  { key: "units", label: "الوحدات" },
  { key: "tenant", label: "المستأجر" },
  { key: "financial", label: "المالية والشروط" },
];

const item = "rounded-xl px-3 py-2.5 cursor-pointer gap-2.5 text-[13.5px] font-bold text-[#14231D] focus:bg-[#EEF5F0] dark:text-white/90 dark:focus:bg-white/[0.06]";
const sub = "w-[260px] rounded-2xl border border-[#DBE3DC] bg-white p-1.5 shadow-[0_8px_24px_rgba(20,40,30,.12)] dark:border-white/10 dark:bg-card";

function stamp(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function WhatsAppIcon({ className }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M21 12a9 9 0 0 1-13.2 7.9L3 21l1.1-4.6A9 9 0 1 1 21 12z" />
    </svg>
  );
}

/**
 * الرأس (دفعة هـ — E1): رقم الطلب + الطلبات السابقة + جوال منشئ الطلب + شارة الدفع + نوع العقد + التاريخ
 * + «إجراءات ▾» (كل ما كان في الرأس القديم)، ثم رحلة الطلب (3 خطوات) بزر الخطوة التالية.
 */
export default function OrderTopCard({
  orderData,
  view,
  orderId,
  backHref = "/home/orders",
  backLabel = "الطلبات",
  canEdit = true,
  isAdmin = false,
  canRefund = false,
  canRecordTransfer = false,
  canAddFee = false,
  statuses = [],
  canChangeStatus = false,
  isStatusPending = false,
  onStatusChange,
  onOpenNotes,
  onPayLink,
  onBankTransfer,
  onAddFee,
  onRefund,
  onPropertyUpdate,
  onRequestData,
  onEjarDocumentation,
  onSendSectionError,
  onViewExpanded,
  onEditSection,
  onShowHistory,
  badges = null,
  children,
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopyingPayLink, setIsCopyingPayLink] = useState(false);
  const [ejarCopyOpen, setEjarCopyOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const smsTriggerRef = useRef(null);

  const uuid = String(orderData?.uuid ?? view?.uuid ?? "");
  const smsTemplates = getOrderSmsTemplates(uuid);
  const creator = orderData?.creator_mobile ?? null;
  const creatorLocal = creator?.local ? formatSaudiMobileDisplay(creator.local) : view?.customer_whatsapp || view?.user_mobile || "";
  const creatorDial = creator?.dial || toSaudiMobileDialDigits(creatorLocal);
  const breakdown = paymentBreakdown(orderData);
  const contractType = view?.contract_type ?? orderData?.contract_type_trans ?? "";
  const createdAt = stamp(orderData?.created_at ?? view?.received_at);
  const cancelStatus = statuses.find((s) => s?.status_key === "cancelled") ?? null;

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      if (!printOrderContract(orderData)) toast.error("تعذر فتح نافذة الطباعة");
    } finally {
      setIsPrinting(false);
    }
  };
  const handleInvoice = () => {
    if (breakdown.invoice_url) openInvoice(breakdown.invoice_url);
    else handlePrint();
  };
  const handleCopyPaymentLink = async () => {
    if (!uuid) return toast.error("رقم الطلب غير متوفر");
    setIsCopyingPayLink(true);
    try {
      const result = await fetchContractPaymentLink(uuid);
      if (result.alreadyPaid) return toast.error(result.message || "هذا العقد مدفوع مسبقاً");
      await copyText(result.paymentUrl || buildOrderPaymentUrl(uuid), "تم نسخ رابط الدفع");
    } catch {
      await copyText(buildOrderPaymentUrl(uuid), "تم نسخ رابط الدفع");
    } finally {
      setIsCopyingPayLink(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border border-[#E3E8E3] bg-white px-4 py-3.5 sm:px-[18px] dark:border-white/10 dark:bg-[#0F1C16]" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* يمين: رقم الطلب والعميل */}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <Link href={backHref} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#6B7B71] hover:text-brand-deep dark:text-white/50">
            <ChevronRight className="size-4" />
            {backLabel}
          </Link>
          <span className="text-[22px] font-bold leading-none text-brand-deep tabular-nums dark:text-emerald-300">#{uuid}</span>
          <CopyBtn text={uuid} label="نسخ رقم الطلب" />
          <PreviousOrdersChip summary={orderData?.customer_orders_summary} mobile={creatorLocal} currentId={orderData?.id} />
          {creatorLocal ? (
            <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#E3E8E3] bg-[#FAFBF9] py-1 pe-1.5 ps-2.5 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="whitespace-nowrap text-[12px] text-[#6B7B71] dark:text-white/50">رقم جوال منشئ الطلب</span>
              <span dir="ltr" className="text-[16px] font-semibold tabular-nums tracking-[0.5px] text-[#14231D] dark:text-white">{creatorLocal}</span>
              <CopyBtn text={creatorLocal} label="نسخ جوال منشئ الطلب" />
              {creatorDial ? (
                <a
                  href={creator?.whatsapp_url || `https://wa.me/${creatorDial}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="واتساب منشئ الطلب"
                  title="واتساب منشئ الطلب"
                  className="inline-flex size-7 items-center justify-center rounded-[7px] bg-[#E3F3EA] text-brand-deep hover:bg-[#D3F2E6] dark:bg-emerald-500/15 dark:text-emerald-300"
                >
                  <WhatsAppIcon />
                </a>
              ) : null}
            </span>
          ) : null}
          <DelayBadge order={orderData} />
          {badges}
        </div>

        {/* يسار: الدفع · النوع · التاريخ · إجراءات */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PaymentChip orderData={orderData} appliedDiscount={orderData?.applied_discount ?? null} />
          {contractType ? (
            <span className="inline-flex h-8 items-center rounded-full bg-[#EEF2FF] px-3 text-[13px] font-semibold text-[#3B4FA0] dark:bg-blue-500/15 dark:text-blue-300">{contractType}</span>
          ) : null}
          {createdAt ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-[#6B7B71] tabular-nums dark:text-white/50" dir="ltr" title="تاريخ إنشاء الطلب">
              <CalendarDays className="size-3.5" />
              {createdAt}
            </span>
          ) : null}

          <DropdownMenu dir="rtl" modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#CFD9D1] bg-white px-4 text-[14px] font-semibold text-[#1C2A22] hover:bg-[#EEF5F0] dark:border-white/15 dark:bg-transparent dark:text-white"
              >
                إجراءات
                <ChevronDown className="size-4 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-[280px] rounded-2xl border border-[#DBE3DC] bg-white p-1.5 shadow-[0_8px_24px_rgba(20,40,30,.12)] dark:border-white/10 dark:bg-card">
              <DropdownMenuItem onSelect={() => setEjarCopyOpen(true)} className={item}>
                <ClipboardCopy className="size-4 text-[#6B7570]" /> نسخ كل بيانات إيجار
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onViewExpanded?.()} className={item}>
                <ZoomIn className="size-4 text-[#6B7570]" /> عرض مكبّر للطلب
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleInvoice} className={item}>
                <Receipt className="size-4 text-[#6B7570]" /> الفاتورة{breakdown.state.paid_total > 0 ? ` (${sar(breakdown.state.paid_total)})` : ""}
              </DropdownMenuItem>
              {onShowHistory ? (
                <DropdownMenuItem onSelect={() => onShowHistory()} className={item}>
                  <FileText className="size-4 text-[#6B7570]" /> سجل الطلب (نشاط · إشعارات · مدفوعات)
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator className="my-1 bg-[#EEF1F0] dark:bg-white/10" />
              <DropdownMenuItem onSelect={() => onRequestData?.(null)} className={item}>
                <Paperclip className="size-4 text-[#B25E00]" /> طلب مرفق ناقص من العميل
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPropertyUpdate?.()} className={item}>
                <Upload className="size-4 text-[#2563EB]" /> رفع تحديث العقار
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onOpenNotes?.()} className={item}>
                <MessageSquarePlus className="size-4 text-[#6B7570]" /> إضافة ملاحظة
              </DropdownMenuItem>
              {canEdit && onEditSection ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={item}>
                    <Pencil className="size-4 text-[#6B7570]" /> تعديل بيانات الطلب
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={sub}>
                    {EDIT_SECTIONS.map((s) => (
                      <DropdownMenuItem key={s.key} onSelect={() => onEditSection(s.key)} className={item}>
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              <DropdownMenuSeparator className="my-1 bg-[#EEF1F0] dark:bg-white/10" />
              <DropdownMenuLabel className="px-3 py-1 text-[11px] font-bold text-[#8A958F]">المدفوعات</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onPayLink?.()} className={item}>
                <Link2 className="size-4 text-brand-deep" /> توليد رابط دفع
              </DropdownMenuItem>
              {canRecordTransfer ? (
                <DropdownMenuItem onSelect={() => onBankTransfer?.()} className={item}>
                  <Banknote className="size-4 text-brand-deep" /> تسجيل حوالة بنكية + إيصال
                </DropdownMenuItem>
              ) : null}
              {canAddFee ? (
                <DropdownMenuItem onSelect={() => onAddFee?.()} className={item}>
                  <PlusCircle className="size-4 text-[#9A6100]" /> إضافة رسوم
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={handleCopyPaymentLink} disabled={!uuid || isCopyingPayLink} className={item}>
                {isCopyingPayLink ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4 text-[#6B7570]" />} نسخ رابط الدفع
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-[#EEF1F0] dark:bg-white/10" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={item}>
                  <MessageSquareText className="size-4 text-[#6B7570]" /> رسائل وأدوات أخرى
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className={sub}>
                  <DropdownMenuItem onSelect={handlePrint} disabled={isPrinting} className={item}>
                    <Printer className="size-4 text-[#6B7570]" /> طباعة بيانات الطلب
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => smsTriggerRef.current?.querySelector("button")?.click()} className={item}>
                    <MessageSquareText className="size-4 text-[#6B7570]" /> رسالة SMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onEjarDocumentation?.()} className={item}>
                    <BadgeCheck className="size-4 text-[#0B7A4C]" /> رقم عقد إيجار / ملاحظات التوثيق
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="px-3 py-1 text-[11px] font-bold text-[#8A958F]">قوالب الرسائل (نسخ)</DropdownMenuLabel>
                  {smsTemplates.map((t) => (
                    <DropdownMenuItem key={t.id} onSelect={() => copyText(t.body, `تم نسخ قالب: ${t.label}`)} className={item}>
                      <Copy className="size-3.5 text-[#6B7570]" /> {t.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuLabel className="px-3 py-1 text-[11px] font-bold text-[#8A958F]">إرسال خطأ للعميل (قديم)</DropdownMenuLabel>
                  {SECTION_ERROR_CONTEXTS.map((c) => (
                    <DropdownMenuItem key={c} onSelect={() => onSendSectionError?.(c)} className={item}>
                      <Bell className="size-3.5 text-[#6B7570]" /> {getSendErrorTitle(c)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {canChangeStatus && statuses.length ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={item}>
                    <Tag className="size-4 text-[#6B7570]" /> تغيير الحالة
                    <StatusPill statusKey={view?.status_key} label={view?.status_name} className="ms-auto" />
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className={cn(sub, "max-h-[320px] overflow-y-auto")}>
                    {statuses.map((status) => {
                      const label = status.name ?? status.label;
                      const active = String(status.id) === String(view?.status_id) || label === view?.status_name;
                      return (
                        <DropdownMenuItem key={status.id} disabled={isStatusPending || active} onSelect={() => setPendingStatus(status)} className={cn(item, active && "bg-brand-mint text-brand-deep")}>
                          {label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              <DropdownMenuSeparator className="my-1 bg-[#EEF1F0] dark:bg-white/10" />
              <DropdownMenuItem onSelect={() => onRefund?.()} className={cn(item, "text-[#B42318] dark:text-red-300")}>
                <Undo2 className="size-4" /> {canRefund ? "استرجاع المبلغ" : "رفع طلب استرجاع"}
              </DropdownMenuItem>
              {canChangeStatus && cancelStatus ? (
                <DropdownMenuItem onSelect={() => setPendingStatus(cancelStatus)} disabled={isStatusPending || view?.status_key === "cancelled"} className={cn(item, "text-[#B42318] dark:text-red-300")}>
                  <XCircle className="size-4" /> إلغاء الطلب
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {view?.banner ? <div className="rounded-xl bg-[#FBF3E0] px-4 py-2.5 text-[12.5px] font-bold text-[#92400E]">{view.banner}</div> : null}

      <div className="border-t border-[#EEF2F0] pt-3 dark:border-white/5">
        <OrderJourney orderData={orderData} orderId={orderId} canEdit={canEdit} canForce={isAdmin} />
      </div>

      {children}

      {orderData ? (
        <div ref={smsTriggerRef} className="hidden" aria-hidden>
          <SendOrderSmsButton order={orderData} label="رسالة" />
        </div>
      ) : null}

      <EjarCopyDialog orderId={orderId} open={ejarCopyOpen} onOpenChange={setEjarCopyOpen} />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(next) => {
          if (!next) setPendingStatus(null);
        }}
        title={pendingStatus?.status_key === "cancelled" ? "إلغاء الطلب" : "تغيير حالة الطلب"}
        description={pendingStatus ? `هل تريد تغيير حالة الطلب إلى «${pendingStatus.name ?? pendingStatus.label}»؟ سيُشعَر العميل بالتغيير.` : ""}
        confirmLabel={pendingStatus?.status_key === "cancelled" ? "إلغاء الطلب" : "تغيير الحالة"}
        destructive={pendingStatus?.status_key === "cancelled"}
        onConfirm={() => {
          const status = pendingStatus;
          setPendingStatus(null);
          if (status) onStatusChange?.(view, status);
        }}
      />
    </section>
  );
}
