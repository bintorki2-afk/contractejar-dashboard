"use client";

import { useState } from "react";
import { BadgeCheck, Check, ExternalLink, Hand, Loader2, Lock, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/shared/confirm-provider";
import { buildOrderJourney, formatJourneyShort } from "@/src/lib/order-journey";
import { openStageWhatsApp, useOrderStages, useRunOrderStage } from "@/src/hooks/use-order-stage";
import NotarizeDialog from "./notarize-dialog";

const SIDE_TONE_CLASSES = {
  danger: "bg-[#FDECEC] text-[#B42318] border-[#F5C9C6] dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  neutral: "bg-[#EEF1F0] text-[#4B5753] border-[#D9E0DC] dark:bg-white/10 dark:text-white/70 dark:border-white/15",
  warning: "bg-[#FFF4DE] text-[#9A6100] border-[#F1D59A] dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
};

/** آخر ملاحظتين/نشاطين للموظفين — تُعرض صغيرة على يسار الرحلة. */
export function journeyNotes(orderData = {}, limit = 2) {
  const comments = (Array.isArray(orderData.comments) ? orderData.comments : []).map((c) => ({
    key: `c-${c.id}`,
    who: c.employee_name || "موظف",
    at: c.created_at,
    text: c.comment,
  }));
  const activities = (Array.isArray(orderData.activities) ? orderData.activities : [])
    .filter((a) => a?.note && a.actor_type !== "customer")
    .map((a) => ({
      key: `a-${a.id}`,
      who: a.actor_type === "system" ? "النظام" : a.actor_name || "موظف",
      at: a.at,
      text: a.note,
    }));
  return [...comments, ...activities]
    .filter((n) => n.text)
    .sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")))
    .slice(0, limit);
}

/**
 * رحلة الطلب (دفعة هـ — د8): 3 خطوات فقط — قيد المراجعة → مستلم من الموظف → تم التوثيق.
 * تحت كل خطوة: التاريخ · الوقت · الموظف. زر الخطوة التالية («استلمت» / «وثّقت») بجانب الخطوة الحالية؛
 * «وثّقت» يفتح بوب-أب (نوع الصك + رقمه) ويُقفل مع السبب إن كان الطلب غير مدفوع أو عليه رسوم معلّقة.
 * الحالات الجانبية (ملغي / مسترجع) تُعرض بلون مميّز بدل الخطوة الحالية.
 */
export default function OrderJourney({ orderData, orderId, canEdit = true, canForce = false, className, onNotarized }) {
  const confirm = useConfirm();
  const { data: stages } = useOrderStages(orderId);
  const journey = buildOrderJourney({ ...orderData, ...(stages?.journey ? { journey: stages.journey, journey_side_state: stages.journey_side_state } : {}) });
  const [notarizeOpen, setNotarizeOpen] = useState(false);
  const [lastWhatsApp, setLastWhatsApp] = useState(null);
  const notes = journeyNotes(orderData);

  const nextStage = stages?.next_stage ?? null;
  const locked = Boolean(stages?.next_stage_locked);
  const lockMessage = stages?.next_stage_lock_message || orderData?.payment_state?.notarize_block_message || null;
  const warnings = Array.isArray(stages?.warnings) ? stages.warnings : [];

  const receive = useRunOrderStage({
    onSuccess: (data) => setLastWhatsApp(data?.whatsapp ?? null),
  });

  const onReceive = async () => {
    const ok = await confirm({
      title: "تأكيد: استلمت",
      description: "سيُسجَّل الطلب باسمك ويُبلَّغ العميل، ثم تُفتح رسالة واتساب جاهزة.",
      confirmLabel: "استلمت",
    });
    if (!ok) return;
    receive.mutate({ orderId, stage: "received" });
  };

  // زر الخطوة التالية يظهر بجانب الخطوة الحالية فقط.
  const buttonForStep = (step) => {
    if (!step.current || journey.sideState || !nextStage) return null;
    const isReceive = nextStage === "received" && step.key === "received_by_employee";
    const isNotarize = nextStage === "notarized" && step.key === "ejar_authenticated";
    if (!isReceive && !isNotarize) return null;
    const Icon = isReceive ? Hand : BadgeCheck;
    const label = stages?.next_stage_label ?? (isReceive ? "استلمت" : "وثّقت");
    const isLocked = isNotarize && locked;
    return (
      <button
        type="button"
        data-next-stage={nextStage}
        onClick={() => (isReceive ? onReceive() : setNotarizeOpen(true))}
        disabled={!canEdit || receive.isPending}
        title={!canEdit ? "ليست لديك صلاحية تعديل الطلبات" : isLocked ? lockMessage ?? undefined : undefined}
        aria-describedby={isLocked ? "journey-lock-reason" : undefined}
        className={cn(
          "ms-1 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[14px] font-extrabold shadow-sm transition-colors disabled:opacity-60",
          isLocked
            ? "border border-[#F5C9C6] bg-[#FDECEC] text-[#B42318] hover:bg-[#FBDCDA] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            : "bg-brand-deep text-white hover:bg-brand-deep/90 dark:bg-emerald-500 dark:text-[#0B1411]"
        )}
      >
        {receive.isPending && isReceive ? <Loader2 className="size-4 animate-spin" /> : isLocked ? <Lock className="size-4" /> : <Icon className="size-4" />}
        {label}
      </button>
    );
  };

  return (
    <>
      <section aria-label="رحلة الطلب" className={cn("flex flex-wrap items-start gap-3", className)} dir="rtl">
        <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          {journey.steps.map((step, index) => {
            const last = index === journey.steps.length - 1;
            const time = formatJourneyShort(step.at);
            const showSide = journey.sideState && last;
            return (
              <li key={step.key} className="contents">
                <div className="flex items-center gap-2.5" aria-current={step.current ? "step" : undefined}>
                  <span
                    className={cn(
                      "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                      step.done && "bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]",
                      step.current && !journey.sideState && "border-[3px] border-brand-deep bg-white text-brand-deep dark:border-emerald-400 dark:bg-transparent dark:text-emerald-300",
                      !step.done && (!step.current || journey.sideState) && "border-2 border-[#DCE5E1] bg-white text-[#9AA6A1] dark:border-white/15 dark:bg-transparent dark:text-white/40"
                    )}
                  >
                    {step.done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p
                      className={cn(
                        "text-[14px] font-bold",
                        step.current && !journey.sideState
                          ? "text-brand-deep dark:text-emerald-300"
                          : step.done
                            ? "text-[#14231D] dark:text-white"
                            : "text-[#8A958F] dark:text-white/45"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#6B7570] dark:text-white/50">
                      {step.done ? (
                        <>
                          {time ? <span dir="ltr" className="tabular-nums">{time}</span> : null}
                          {time && step.who ? " · " : null}
                          {step.who ? <span className="font-semibold">{step.who}</span> : null}
                          {step.note ? <span className="text-[#8A958F]"> · {step.note}</span> : null}
                        </>
                      ) : step.current && !journey.sideState ? (
                        "الخطوة الحالية"
                      ) : (
                        "لم تبدأ"
                      )}
                    </p>
                  </div>
                  {buttonForStep(step)}
                  {showSide ? (
                    <span
                      className={cn(
                        "ms-1 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-extrabold",
                        SIDE_TONE_CLASSES[journey.sideStateTone] ?? SIDE_TONE_CLASSES.warning
                      )}
                      title={journey.sideStateAt ? formatJourneyShort(journey.sideStateAt) ?? undefined : undefined}
                    >
                      <PauseCircle className="size-4" />
                      الطلب {journey.sideStateLabel}
                    </span>
                  ) : null}
                </div>
                {!last ? (
                  <span
                    aria-hidden
                    className={cn(
                      "hidden h-[3px] min-w-[32px] flex-1 rounded-full sm:block",
                      step.done ? "bg-brand-deep dark:bg-emerald-400" : "bg-[#E6EBE6] dark:bg-white/10"
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        {notes.length ? (
          <aside
            aria-label="ملاحظات الموظفين"
            className="w-full max-w-[380px] border-brand-line text-[12px] text-[#6B7570] dark:border-white/10 dark:text-white/50 sm:w-auto sm:border-e-2 sm:pe-3"
          >
            {notes.map((n) => (
              <p key={n.key} className="truncate" title={n.text}>
                <b className="text-[#2F4A3B] dark:text-white/70">
                  {n.who}
                  {n.at ? <span dir="ltr" className="tabular-nums"> · {formatJourneyShort(n.at)}</span> : null}:
                </b>{" "}
                {n.text}
              </p>
            ))}
          </aside>
        ) : null}

        {(locked && nextStage === "notarized" && lockMessage) || warnings.length || lastWhatsApp?.url ? (
          <div className="flex w-full flex-wrap items-center gap-2">
            {locked && nextStage === "notarized" && lockMessage ? (
              <p id="journey-lock-reason" className="inline-flex items-center gap-1.5 rounded-lg bg-[#FDECEC] px-2.5 py-1 text-[12px] font-bold text-[#B42318] dark:bg-red-500/10 dark:text-red-300">
                <Lock className="size-3.5" />
                {lockMessage}
              </p>
            ) : null}
            {warnings.map((w) => (
              <p key={w.code ?? w.message} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF7E6] px-2.5 py-1 text-[12px] font-bold text-[#7A4B00] dark:bg-amber-500/10 dark:text-amber-300">
                ⚠ {w.message}
              </p>
            ))}
            {lastWhatsApp?.url ? (
              <button
                type="button"
                onClick={() => openStageWhatsApp(lastWhatsApp)}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-mint px-2.5 py-1 text-[12px] font-bold text-brand-deep underline underline-offset-2 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <ExternalLink className="size-3.5" />
                فتح رسالة واتساب مرة أخرى
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <NotarizeDialog
        open={notarizeOpen}
        onOpenChange={setNotarizeOpen}
        orderId={orderId}
        stages={stages}
        canForce={canForce}
        onDone={(data) => {
          setLastWhatsApp(data?.whatsapp ?? null);
          onNotarized?.(data);
        }}
      />

      {/* د14: شريط إجراء ثابت أسفل الشاشة على الجوال */}
      {nextStage && !journey.sideState ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden dark:bg-[#0F1C16]/95 dark:border-white/10" dir="rtl">
          <button
            type="button"
            onClick={() => (nextStage === "received" ? onReceive() : setNotarizeOpen(true))}
            disabled={!canEdit || receive.isPending}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold disabled:opacity-60",
              locked && nextStage === "notarized"
                ? "border border-[#F5C9C6] bg-[#FDECEC] text-[#B42318]"
                : "bg-brand-deep text-white dark:bg-emerald-500 dark:text-[#0B1411]"
            )}
          >
            {receive.isPending ? <Loader2 className="size-5 animate-spin" /> : locked && nextStage === "notarized" ? <Lock className="size-5" /> : nextStage === "received" ? <Hand className="size-5" /> : <BadgeCheck className="size-5" />}
            {stages?.next_stage_label ?? (nextStage === "received" ? "استلمت" : "وثّقت")}
          </button>
        </div>
      ) : null}
    </>
  );
}
