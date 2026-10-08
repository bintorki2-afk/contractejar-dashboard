"use client";

import { useState } from "react";
import {
  Loader2,
  MessageSquareText,
  Phone,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/src/utils/axios";
import {
  getOrderSmsTemplates,
} from "@/components/orders/shared/order-sms-templates";
import { getOrderContractUuid } from "@/components/orders/messages/order-section-message-utils";

export const SMS_SEND_API = "/admin/sms/send";
export const SMS_MESSAGE_API = "/admin/sms/message";

function toPositiveId(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return null;
}

/** Resolve customer user_id from common order/refund/contract-paid shapes. */
export function resolveOrderSmsUserId(order) {
  if (!order) return null;

  const candidates = [
    order.user_id,
    order.userId,
    order.customer_id,
    order.customerId,
    order.customer_user_id,
    order.customerUserId,
    order.user?.id,
    order.user?.user_id,
    order.customer?.id,
    order.customer?.user_id,
    order.raw?.user_id,
    order.raw?.user?.id,
    order.raw?.customer_id,
    order.raw?.customer?.id,
    order.contract_summary?.user_id,
    order.contract_summary?.user?.id,
    order.contract?.user_id,
    order.contract?.user?.id,
    order.contract_paid?.user_id,
  ];

  for (const value of candidates) {
    const id = toPositiveId(value);
    if (id != null) return id;
  }

  return null;
}

export function resolveOrderSmsPhone(order) {
  if (!order) return "";
  const summary = order.contract_summary ?? {};
  const candidates = [
    order.user_mobile,
    order.customer_mobile,
    order.userMobile,
    order.customerMobile,
    order.user?.mobile,
    order.user?.phone,
    order.customer?.mobile,
    order.customer?.phone,
    order.phone,
    order.mobile,
    summary.property_owner_mobile,
    summary.user_mobile,
    summary.user?.mobile,
    summary.customer_mobile,
    order.raw?.customer_mobile,
    order.raw?.user_mobile,
    order.raw?.phone,
    order.raw?.mobile,
  ];

  for (const value of candidates) {
    if (value == null || value === "") continue;
    const phone = String(value).trim();
    if (phone) return phone;
  }

  return "";
}

const SMS_SEGMENT_LENGTH = 70;

export default function SendOrderSmsButton({
  order,
  employee = null,
  userId: userIdProp,
  employeeId: employeeIdProp,
  phone: phoneProp,
  endpoint = SMS_SEND_API,
  className = "",
  label = null,
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const employeeId = employeeIdProp ?? employee?.id ?? null;
  const isEmployeeMode = employeeId != null && employeeId !== "";
  const isMessageApi = endpoint === SMS_MESSAGE_API;
  const userId = isEmployeeMode
    ? null
    : toPositiveId(userIdProp) ?? resolveOrderSmsUserId(order);
  const phone =
    (phoneProp && String(phoneProp).trim()) ||
    employee?.phone ||
    employee?.mobile ||
    resolveOrderSmsPhone(order || employee) ||
    "";
  const canSend =
    isEmployeeMode
      ? toPositiveId(employeeId) != null
      : isMessageApi
        ? Boolean(phone)
        : userId != null || Boolean(phone);

  const orderUuid = getOrderContractUuid(order) || order?.uuid || "";
  const templates = !isEmployeeMode ? getOrderSmsTemplates(orderUuid) : [];
  const charCount = message.length;
  const segmentCount = Math.max(1, Math.ceil(charCount / SMS_SEGMENT_LENGTH));

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setMessage("");
      setActiveTemplateId(null);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const body = { message: message.trim() };
      if (isEmployeeMode) {
        body.employee_id = Number(employeeId);
      } else if (isMessageApi) {
        if (!phone) {
          throw new Error("تعذر تحديد رقم الجوال لإرسال الرسالة");
        }
        body.mobile = phone;
      } else if (userId != null) {
        body.user_id = Number(userId);
      } else if (phone) {
        body.mobile = phone;
      } else {
        throw new Error("تعذر تحديد المستلم لإرسال الرسالة");
      }
      return axiosInstance.post(endpoint, body);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم إرسال الرسالة بنجاح");
      setOpen(false);
      setMessage("");
      setActiveTemplateId(null);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء إرسال الرسالة"
      );
    },
  });

  const missingRecipientMessage = isEmployeeMode
    ? "تعذر تحديد الموظف لإرسال الرسالة"
    : isMessageApi
      ? "تعذر تحديد رقم الجوال لإرسال الرسالة"
      : "تعذر تحديد المستخدم أو رقم الجوال لإرسال الرسالة";

  const handleOpen = (e) => {
    e?.stopPropagation?.();
    if (!canSend) {
      toast.error(missingRecipientMessage);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!canSend) {
      toast.error(missingRecipientMessage);
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة نص الرسالة");
      return;
    }
    mutate();
  };

  const applyTemplate = (template) => {
    setMessage(template.body);
    setActiveTemplateId(template.id);
  };

  const triggerClassName = label
    ? `h-auto py-3 px-4 rounded-2xl bg-[#0019FF] hover:bg-[#0015CC] text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${className}`
    : `w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 text-ink-subtle hover:bg-brand-main hover:text-white transition-all shrink-0 ${className}`;

  const recipientLabel = isEmployeeMode
    ? "معرّف الموظف"
    : userId != null
      ? "معرّف المستخدم"
      : "الجوال";
  const recipientValue = isEmployeeMode
    ? toPositiveId(employeeId)
    : userId != null
      ? userId
      : phone;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={triggerClassName}
        aria-label="إرسال رسالة SMS"
        title="إرسال رسالة SMS"
      >
        <MessageSquareText className="size-4 shrink-0" />
        {label ? <span>{label}</span> : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir="rtl"
          closeButton={false}
          className="sm:max-w-[520px] rounded-[28px] border border-[#E8EEEC] dark:border-white/10 bg-white dark:bg-[#0F1C16] p-0 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-l from-[#E8F5F1] via-white to-white dark:from-[#0A4D33]/30 dark:via-[#0F1C16] dark:to-[#0F1C16] border-b border-[#EEF2F0] dark:border-white/5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-5 left-5 size-9 rounded-full flex items-center justify-center bg-white dark:bg-white/10 text-gray-400 hover:text-[#E24444] hover:bg-[#FFEBEB] dark:hover:bg-red-500/10 transition-all shadow-sm"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 pr-1">
              <div className="size-11 rounded-2xl bg-brand-dark text-white flex items-center justify-center shadow-[0_8px_20px_rgba(12,96,85,0.35)]">
                <MessageSquareText className="size-5" />
              </div>
              <div className="text-right">
                <DialogTitle className="text-[17px] font-black text-brand-dark dark:text-[#6EE7B7] m-0">
                  إرسال رسالة SMS
                </DialogTitle>
                <p className="text-12 text-gray-500 dark:text-white/50 mt-0.5">
                  أرسل رسالة مباشرة للعميل أو استخدم قالبًا جاهزًا
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {(phone || recipientValue) && (
              <div className="flex flex-wrap gap-2">
                {phone ? (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#F3F9F6] dark:bg-white/[0.06] text-[12.5px] font-bold text-brand-dark dark:text-[#6EE7B7]">
                    <Phone className="size-3.5 opacity-70" />
                    <span dir="ltr">{phone}</span>
                  </span>
                ) : null}
                {userId != null || isEmployeeMode ? (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#F3F4F6] dark:bg-white/[0.06] text-[12.5px] font-bold text-gray-600 dark:text-white/70">
                    <UserRound className="size-3.5 opacity-70" />
                    {recipientLabel}:{" "}
                    <span dir="ltr">{recipientValue}</span>
                  </span>
                ) : null}
                {orderUuid ? (
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#EEF2FF] dark:bg-indigo-500/10 text-[12.5px] font-bold text-[#4338CA] dark:text-indigo-300">
                    #{orderUuid}
                  </span>
                ) : null}
              </div>
            )}

            {templates.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-500 dark:text-white/50">
                  <Sparkles className="size-3.5" />
                  قوالب جاهزة
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        "h-8 px-3 rounded-full border text-[11.5px] font-bold transition-colors",
                        activeTemplateId === template.id
                          ? "border-brand-dark bg-brand-dark text-white"
                          : "border-[#E3E8E6] dark:border-white/10 text-gray-700 dark:text-white/80 hover:border-brand-dark/40 hover:bg-[#F3F9F6] dark:hover:bg-white/[0.06]"
                      )}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-gray-400 tabular-nums">
                  {charCount} حرف
                  {charCount > 0 ? ` · ≈ ${segmentCount} رسالة` : ""}
                </span>
                <label className="text-[13px] font-bold text-gray-800 dark:text-white/90">
                  نص الرسالة
                </label>
              </div>
              <Textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setActiveTemplateId(null);
                }}
                placeholder="اكتب نص الرسالة هنا أو اختر قالبًا جاهزًا..."
                className="min-h-[160px] rounded-2xl border-[#E3E8E6] dark:border-white/10 bg-[#F9FBFA] dark:bg-white/[0.03] px-4 py-3.5 text-[13.5px] leading-7 text-right resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-brand-dark"
                dir="rtl"
              />
            </div>

            <Button
              type="button"
              disabled={isPending || !message.trim()}
              onClick={handleSubmit}
              className="w-full h-12 rounded-full bg-brand-dark hover:bg-brand-dark/90 text-white font-bold gap-2 shadow-[0_10px_24px_rgba(12,96,85,0.28)]"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              إرسال الرسالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
