"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  BadgeCheck,
  Bell,
  CreditCard,
  FileUp,
  Hand,
  History,
  ListChecks,
  MessageSquareText,
  Pencil,
  PencilLine,
  RotateCcw,
  Tag,
  Trash2,
  Undo2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJourneyTime } from "@/src/lib/order-journey";
import { fieldLabel } from "@/src/lib/field-labels";

const ACTION_ICONS = {
  payment: CreditCard,
  status_changed: Tag,
  received: Hand,
  stage_received: Hand,
  assigned: UserCheck,
  stage_notarized: BadgeCheck,
  edited: Pencil,
  cancelled: XCircle,
  refunded: Undo2,
  refund_failed: Undo2,
  discount_applied: Tag,
  note_added: MessageSquareText,
  deleted: Trash2,
  restored: RotateCcw,
  notification_sent: Bell,
  delay_flagged: AlarmClock,
  // دفعة و (W-10 / APP-6)
  customer_edited: PencilLine,
  data_request_progress: ListChecks,
  // دفعة و (D9)
  draft_document_uploaded: FileUp,
  draft_document_removed: Trash2,
};

/** تسميات احتياطية إن لم يرسل الخادم `action_label`. */
export const ACTION_LABELS = {
  customer_edited: "تعديل من العميل بعد الإرسال",
  data_request_progress: "العميل أرسل جزءاً من المطلوب",
  draft_document_uploaded: "رُفعت مسودة العقد للعميل",
  draft_document_removed: "حُذفت مسودة العقد",
};

export function activityLabel(a = {}) {
  return a.action_label || ACTION_LABELS[a.action] || a.action;
}

const ACTION_TONE = {
  refund_failed: "text-[#B42318] bg-[#FDECEC]",
  cancelled: "text-[#B42318] bg-[#FDECEC]",
  deleted: "text-[#B42318] bg-[#FDECEC]",
  delay_flagged: "text-[#B42318] bg-[#FDECEC]",
  refunded: "text-[#9A6100] bg-[#FFF4DE]",
  customer_edited: "text-[#9A6100] bg-[#FFF4DE]",
  data_request_progress: "text-[#1D4ED8] bg-[#EAF2FF]",
  draft_document_uploaded: "text-[#0B7A4C] bg-[#E3F4EA]",
};

function display(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** فروق قبل/بعد مقروءة: الحالة بالاسم، والحقول بتسمياتها العربية. */
export function activityChanges(activity) {
  const before = activity?.before ?? {};
  const after = activity?.after ?? {};
  if (activity?.action === "status_changed") {
    return [{ label: "الحالة", before: before.status_name ?? before.status_key, after: after.status_name ?? after.status_key }];
  }
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  return keys
    .filter((k) => !["contract_status_id", "status_key"].includes(k))
    .map((k) => {
      const b = before?.[k];
      const a = after?.[k];
      // شكل B17: { field: {label, before, after} } داخل after أحياناً
      if (a && typeof a === "object" && "before" in a && "after" in a) {
        return { label: a.label ?? fieldLabel(k), before: a.before, after: a.after };
      }
      return { label: fieldLabel(k), before: b, after: a };
    })
    .filter((c) => display(c.before) !== display(c.after));
}

/** «سجل النشاط» (د13): كل إجراء على الطلب — من ومتى وما الذي تغيّر — مع فلتر الموظف. */
export default function OrderActivityTab({ orderData }) {
  const activities = useMemo(
    () =>
      [...(orderData?.activities ?? [])].sort((a, b) => String(b?.at ?? "").localeCompare(String(a?.at ?? ""))),
    [orderData?.activities]
  );
  const actors = useMemo(() => {
    const map = new Map();
    activities.forEach((a) => {
      const key = a.actor_type === "employee" ? `e:${a.actor_id}` : a.actor_type;
      const name = a.actor_type === "employee" ? a.actor_name || `موظف #${a.actor_id}` : a.actor_type === "customer" ? "العميل" : "النظام";
      if (!map.has(key)) map.set(key, { key, name, count: 0 });
      map.get(key).count += 1;
    });
    return [...map.values()];
  }, [activities]);
  const [actor, setActor] = useState("all");
  const list = actor === "all"
    ? activities
    : activities.filter((a) => (a.actor_type === "employee" ? `e:${a.actor_id}` : a.actor_type) === actor);

  if (!activities.length) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-8 text-center">
        <History className="size-6 text-[#B5C0BB]" />
        <p className="text-[12.5px] font-bold text-[#6B7570]">لا يوجد نشاط مسجّل بعد</p>
        <p className="text-[11.5px] text-[#8A958F]">كل إجراء على الطلب (حالة، استلام، تعديل، استرجاع…) يظهر هنا.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {actors.length > 1 ? (
        <label className="flex items-center gap-2 text-[12px] font-bold text-[#6B7570] dark:text-white/50">
          المنفّذ
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-brand-line bg-white px-2 text-[12.5px] font-semibold text-[#14231D] dark:bg-white/[0.04] dark:border-white/10 dark:text-white"
          >
            <option value="all">الكل ({activities.length})</option>
            {actors.map((a) => (
              <option key={a.key} value={a.key}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <ol className="relative flex flex-col gap-3 before:absolute before:inset-y-1 before:start-[15px] before:w-px before:bg-brand-line dark:before:bg-white/10">
        {list.map((a) => {
          const Icon = ACTION_ICONS[a.action] ?? History;
          const changes = ["edited", "status_changed"].includes(a.action) ? activityChanges(a) : [];
          return (
            <li key={a.id} className="relative flex gap-3">
              <span
                className={cn(
                  "relative z-[1] inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                  ACTION_TONE[a.action] ?? "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300"
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[12.5px] font-extrabold text-[#14231D] dark:text-white">{activityLabel(a)}</p>
                <p className="text-[11px] text-[#8A958F] dark:text-white/45">
                  <span className="font-semibold">
                    {a.actor_type === "system" ? "النظام" : a.actor_type === "customer" ? "العميل" : a.actor_name || "موظف"}
                  </span>
                  {a.at ? <span dir="ltr" className="tabular-nums"> · {formatJourneyTime(a.at)}</span> : null}
                  {a.customer_visible ? <span className="text-brand-green"> · ظاهر للعميل</span> : null}
                </p>
                {changes.length ? (
                  <ul className="mt-1.5 flex flex-col gap-1 rounded-lg bg-[#F5F7F6] px-2.5 py-1.5 text-[11.5px] dark:bg-white/[0.04]">
                    {changes.map((c, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-1">
                        <span className="font-bold text-[#4B5753] dark:text-white/60">{c.label}:</span>
                        <span className="text-[#8A958F] line-through decoration-[#B42318]/50" dir="auto">{display(c.before)}</span>
                        <span aria-hidden>←</span>
                        <span className="font-bold text-[#14231D] dark:text-white" dir="auto">{display(c.after)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {a.note ? (
                  <p className="mt-1 rounded-lg bg-[#FFFBEB] px-2.5 py-1.5 text-[12px] text-[#5B4A16] dark:bg-amber-500/10 dark:text-amber-200">{a.note}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
