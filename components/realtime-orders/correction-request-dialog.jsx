"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CreditCard, FileText, MapPin, UserRound } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import OrderActionDialogHeader from "@/components/shared/order-action-dialog-header";
import waIcon from "@/public/images/waIcon.svg";
import Image from "next/image";
import { useDialogFormSession } from "@/src/hooks/use-dialog-form-session";
import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";

const ERROR_TYPES = [
  { id: "national_address", label: "العنوان الوطني غير صحيح", icon: MapPin },
  { id: "deed_data", label: "بيانات الصك غير صحيحة", icon: FileText },
  { id: "tenant", label: "المستأجر خطأ", icon: UserRound },
  { id: "owner_id", label: "هوية المالك خطأ", icon: CreditCard },
];

function buildCorrectionMessage(order, selectedLabels) {
  return `عميلنا العزيز،

نأسف لإبلاغكم بوجود خطأ في البيانات التالية ضمن طلبكم رقم #${order?.uuid ?? "—"}:
${selectedLabels.map((label) => `- ${label}`).join("\n")}

يرجى التواصل معنا لتصحيح البيانات في أقرب وقت لإتمام إجراءات طلبكم.

شكراً لتفهمكم.`;
}

export default function CorrectionRequestDialog({ open, onOpenChange, order }) {
  const [selected, setSelected] = useState([]);

  const resetForm = useCallback(() => setSelected([]), []);
  const session = useDialogFormSession(open, resetForm);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedLabels = ERROR_TYPES.filter((type) => selected.includes(type.id)).map(
    (type) => type.label
  );
  const message = selectedLabels.length > 0 ? buildCorrectionMessage(order, selectedLabels) : "";

  // رقم واتساب العميل صاحب الطلب (نفس رقم رسائل المراحل)، وإلا جوال الطلب.
  const waDigits = order?.customer_whatsapp_dial || toSaudiMobileDialDigits(order?.user_mobile ?? "");
  const waHref = waDigits
    ? `https://wa.me/${waDigits}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    : null;

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={session}
        className="sm:max-w-[540px] p-8 rounded-32 border-0 gap-0 max-h-[90vh] overflow-y-auto no-scrollbar"
        dir="rtl"
        closeButton={false}
      >
        <OrderActionDialogHeader
          icon={AlertTriangle}
          iconClassName="bg-[#EA580C]"
          title="طلب تصحيح بيانات من العميل"
          onClose={handleClose}
        />

        <div className="flex flex-col gap-4">
          <p className="text-13 font-bold text-black text-right">
            اختر نوع الخطأ (أو أكثر) في بيانات العميل:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {ERROR_TYPES.map((type) => {
              const Icon = type.icon;
              const active = selected.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggle(type.id)}
                  className={`h-[80px] rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-bold text-center px-2 transition-all ${
                    active
                      ? "border-[#EA580C] bg-[#FFF7ED] text-[#C2410C]"
                      : "border-surface-border bg-surface-input text-ink-subtle hover:border-[#D0D5DD]"
                  }`}
                >
                  <Icon className="size-[18px]" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11.5px] text-ink-placeholder leading-relaxed px-1">
            اختر خطأً واحداً أو أكثر لتظهر رسالة التصحيح متضمنة البيانات المدخلة.
          </p>

          {message ? (
            <div className="rounded-20 bg-surface-input border border-[#F0F0F0] p-4 flex flex-col gap-3">
              <p className="whitespace-pre-line text-13 text-ink-subtle leading-relaxed">
                {message}
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#EBEBEB]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    toast.success("تم نسخ الرسالة");
                  }}
                  className="text-[12.5px] font-bold text-ink-subtle hover:text-brand-hover transition-colors inline-flex items-center gap-1.5"
                >
                  <i className="fa-regular fa-copy text-13" />
                  نسخ الرسالة
                </button>
                {waHref ? (
                  <Link
                    href={waHref}
                    target="_blank"
                    className="text-[12.5px] font-bold text-green-700 hover:opacity-80 transition-opacity inline-flex items-center gap-1.5"
                  >
                    <Image src={waIcon} alt="" width={16} height={16} />
                    إرسال عبر واتساب
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleClose}
            className="w-full h-13 rounded-2xl border border-surface-border text-ink-subtle font-bold text-15 hover:bg-neutral-100 transition-all mt-1"
          >
            إغلاق
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
