"use client";

import { useState } from "react";
import { ExternalLink, ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  LESSOR_CHANGE_STATUS_FALLBACK,
  useLessorChangeRequest,
  useUpdateLessorChangeStatus,
} from "@/src/hooks/use-lessor-change";
import {
  LessorChangeStatusBadge,
  formatDob,
  formatFee,
  platformLabel,
} from "./lessor-change-shared";

function Field({ label, value, dir, className }) {
  const hasValue = value != null && value !== "";
  return (
    <div className={cn("flex items-start justify-between gap-3 text-xs", className)}>
      <span className="shrink-0 font-medium text-status-neutral dark:text-white/50">{label}</span>
      <span
        dir={dir}
        className={cn(
          "min-w-0 text-left font-bold tabular-nums break-words",
          hasValue ? "text-gray-900 dark:text-white" : "text-[#D1D5DB] dark:text-white/25"
        )}
      >
        {hasValue ? value : "—"}
      </span>
    </div>
  );
}

function DeedImage({ title, url }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="rounded-2xl border border-[#E8EEEC] bg-[#F8FAF9] p-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-900 dark:text-white">{title}</span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-dark hover:underline dark:text-emerald-300"
          >
            <ExternalLink className="size-3" />
            فتح في تبويب جديد
          </a>
        ) : null}
      </div>
      {url && !failed ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* الصور موقّعة ومؤقتة (private disk) — لا نستخدم next/image حتى لا تُحجب عن طريق remotePatterns. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-h-[260px] w-full rounded-xl object-contain bg-white dark:bg-black/20"
          />
        </a>
      ) : (
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-xl bg-white text-[#9CA3AF] dark:bg-black/20 dark:text-white/35">
          <ImageOff className="size-5" />
          <span className="text-[11px] font-medium">{url ? "تعذر عرض الصورة" : "لا توجد صورة"}</span>
        </div>
      )}
    </div>
  );
}

function StatusUpdateForm({ request, statuses }) {
  const { can, isReady } = usePermissions();
  const canEdit = isReady && can(PERMISSION_SECTIONS.lessor_change, "edit");
  const mutation = useUpdateLessorChangeStatus(request?.id);

  const [status, setStatus] = useState(request?.status ?? "");
  const [note, setNote] = useState(request?.status_note ?? "");
  const [syncedId, setSyncedId] = useState(request?.id);
  const [syncedStatus, setSyncedStatus] = useState(request?.status);
  if (request?.id !== syncedId || request?.status !== syncedStatus) {
    setSyncedId(request?.id);
    setSyncedStatus(request?.status);
    setStatus(request?.status ?? "");
    setNote(request?.status_note ?? "");
  }

  if (!canEdit) return null;

  const options = statuses?.length ? statuses : LESSOR_CHANGE_STATUS_FALLBACK;
  const dirty = status !== (request?.status ?? "") || (note ?? "") !== (request?.status_note ?? "");

  return (
    <div className="rounded-2xl border border-dashed border-[#D7E3DE] bg-[#F7FAF8] p-3.5 dark:border-white/10 dark:bg-white/[0.02]">
      <p className="mb-3 text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">تحديث الحالة</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-white/80">الحالة</label>
          <Select value={status} onValueChange={setStatus} disabled={mutation.isPending}>
            <SelectTrigger
              className={cn(
                "h-11 rounded-xl border px-3 text-13 font-semibold shadow-none focus:ring-1 focus:ring-offset-0",
                "bg-white border-[#E5E7EB] text-gray-900 focus:border-brand-dark focus:ring-brand-dark/20",
                "dark:bg-[#0F1C16] dark:border-white/[0.1] dark:text-white"
              )}
            >
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent dir="rtl" className="dark:bg-[#0F1C16] dark:border-white/[0.1]">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-13 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} aria-hidden />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-white/80">ملاحظة الحالة (تظهر للعميل)</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={mutation.isPending}
            placeholder="مثال: تم نقل العقود إلى الصك الجديد."
            className="min-h-[72px] resize-none rounded-xl border-[#E5E7EB] bg-white text-13 dark:border-white/10 dark:bg-[#0F1C16]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!dirty || !status || mutation.isPending}
            onClick={() => mutation.mutate({ status, status_note: note })}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-13 font-bold text-white transition-colors",
              "bg-brand-main hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            حفظ الحالة
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LessorChangeDetailsDialog({ requestId, statuses, open, onOpenChange }) {
  const { data, isLoading, isError, error } = useLessorChangeRequest(requestId, { enabled: open });
  const request = data && typeof data === "object" ? data : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl p-5 text-right sm:p-6"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-black text-gray-900 dark:text-white">
            طلب تغيير المؤجر
            {request?.order_number ? (
              <span className="text-brand-dark tabular-nums dark:text-emerald-300">#{request.order_number}</span>
            ) : null}
            {request ? (
              <LessorChangeStatusBadge
                status={request.status}
                label={request.status_label}
                color={request.status_color}
              />
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-xs text-status-neutral dark:text-white/50">
            جميع العقود المرتبطة بالصك القديم تنتقل إلى الصك الجديد بعد اكتمال الطلب.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-brand-dark" />
          </div>
        ) : isError || !request ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF5F5] p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-sm font-bold text-[#B91C1C] dark:text-red-300">تعذر تحميل تفاصيل الطلب</p>
            <p className="mt-1 text-xs text-[#991B1B] dark:text-red-200/80">
              {error?.response?.data?.message || error?.message || ""}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-[#E8EEEC] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#0F1C16]">
                <p className="text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">بيانات الطلب</p>
                <Field label="رقم الطلب" value={request.order_number} dir="ltr" />
                <Field label="الجوال" value={formatSaudiMobileDisplay(request.mobile) || request.mobile} dir="ltr" />
                <Field label="الرسوم" value={formatFee(request.fee)} />
                <Field label="الدفع" value={request.is_paid ? "مدفوع" : "غير مدفوع"} />
                <Field label="تاريخ الدفع" value={request.paid_at} dir="ltr" />
                <Field label="المنصة" value={platformLabel(request.platform)} />
                <Field label="تاريخ الإنشاء" value={request.created_at} dir="ltr" />
                <Field label="آخر تحديث" value={request.updated_at} dir="ltr" />
                <Field label="الموظف المسؤول" value={request.employee?.name} />
              </div>

              <div className="space-y-2 rounded-2xl border border-[#E8EEEC] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#0F1C16]">
                <p className="text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">المالك الجديد</p>
                <Field label="رقم الهوية" value={request.new_owner_id_number} dir="ltr" />
                <Field label="تاريخ الميلاد" value={formatDob(request)} dir="ltr" />
                <p className="pt-2 text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">العميل</p>
                <Field label="الاسم" value={request.user?.name} />
                <Field
                  label="جوال الحساب"
                  value={formatSaudiMobileDisplay(request.user?.mobile) || request.user?.mobile}
                  dir="ltr"
                />
                {request.smart_link ? (
                  <Field
                    label="الرابط الذكي"
                    value={
                      <a
                        href={request.smart_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-dark hover:underline dark:text-emerald-300"
                      >
                        فتح
                      </a>
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DeedImage title="صورة الصك القديم" url={request.old_deed_image_url} />
              <DeedImage title="صورة الصك الجديد" url={request.new_deed_image_url} />
            </div>

            <div className="rounded-2xl border border-[#E8EEEC] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#0F1C16]">
              <p className="mb-1.5 text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">ملاحظات العميل</p>
              <p className="whitespace-pre-line text-xs font-medium leading-6 text-gray-700 dark:text-white/70">
                {request.notes || "لا توجد ملاحظات"}
              </p>
              {request.status_note ? (
                <>
                  <p className="mb-1.5 mt-3 text-[12.5px] font-black text-brand-dark dark:text-[#6EE7B7]">ملاحظة الحالة الحالية</p>
                  <p className="whitespace-pre-line text-xs font-medium leading-6 text-gray-700 dark:text-white/70">
                    {request.status_note}
                  </p>
                </>
              ) : null}
            </div>

            <StatusUpdateForm request={request} statuses={statuses} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
