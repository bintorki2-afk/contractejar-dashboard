/**
 * رحلة الطلب في تفاصيل الطلب (دفعة د — د10).
 * تُبنى من بيانات الخادم فقط: `status_key` + `status_timeline[]` + `activities[]` + `payments[]`.
 * كل خطوة: { key, label, done, current, at, who, note }.
 */

export const JOURNEY_STEPS = [
  { key: "paid", label: "الدفع" },
  { key: "under_review", label: "قيد المراجعة" },
  { key: "received", label: "الاستلام" },
  { key: "draft_sent", label: "إرسال المسودة" },
  { key: "notarized", label: "التوثيق في إيجار" },
  { key: "completed", label: "مكتمل" },
];

/** ترتيب مفاتيح الحالات على الرحلة (لمعرفة ما اكتمل ضمنياً). */
const STATUS_RANK = {
  new: 0,
  paid: 1,
  under_review: 2,
  received: 3,
  received_by_employee: 3,
  whatsapp_draft: 4,
  ejar_authenticated: 5,
  completed: 6,
};

const STEP_RANK = {
  paid: 1,
  under_review: 2,
  received: 3,
  draft_sent: 4,
  notarized: 5,
  completed: 6,
};

export const SIDE_STATE_LABELS = {
  cancelled: "ملغى",
  on_hold: "معلق",
  refunded: "مسترجع",
  waiting_supervisor: "بانتظار المشرف",
};

function list(value) {
  return Array.isArray(value) ? value : [];
}

function firstAt(items) {
  const sorted = items
    .map((i) => i?.at ?? i?.created_at ?? i?.paid_at ?? null)
    .filter(Boolean)
    .sort();
  return sorted[0] ?? null;
}

function findActivity(activities, actions) {
  const wanted = Array.isArray(actions) ? actions : [actions];
  // أحدث نشاط مطابق (السجل قد يحوي تكراراً بعد تراجع).
  const matches = activities.filter((a) => wanted.includes(a?.action));
  return matches.length ? matches[matches.length - 1] : null;
}

function statusActivity(activities, statusKeys) {
  const keys = Array.isArray(statusKeys) ? statusKeys : [statusKeys];
  const matches = activities.filter(
    (a) => a?.action === "status_changed" && keys.includes(a?.after?.status_key)
  );
  return matches.length ? matches[matches.length - 1] : null;
}

function timelineEntry(timeline, statusKeys) {
  const keys = Array.isArray(statusKeys) ? statusKeys : [statusKeys];
  const matches = timeline.filter((t) => keys.includes(t?.status));
  return matches.length ? matches[matches.length - 1] : null;
}

function who(activity, fallback = null) {
  if (!activity) return fallback;
  if (activity.actor_type === "system") return "النظام";
  if (activity.actor_type === "customer") return "العميل";
  return activity.actor_name || fallback;
}

/**
 * يبني خطوات الرحلة. `order` = بيانات `GET /admin/orders/{id}` الخام.
 */
export function buildOrderJourney(order = {}) {
  const activities = list(order.activities)
    .slice()
    .sort((a, b) => String(a?.at ?? "").localeCompare(String(b?.at ?? "")));
  const timeline = list(order.status_timeline);
  const payments = list(order.payments).filter((p) => p?.status === "success" || p?.status === "paid");
  const statusKey = order.status_key ?? null;
  const isPaid = Boolean(order.is_paid || order.is_completed === true || order.is_completed === 1 || payments.length);
  const isReceived = Boolean(order.is_received || order.received_contract);
  const rank = STATUS_RANK[statusKey] ?? (isPaid ? 1 : 0);

  const paymentActivity = findActivity(activities, "payment");
  const paidTimeline = timelineEntry(timeline, "paid");
  const reviewTimeline = timelineEntry(timeline, "under_review");
  const receivedActivity =
    findActivity(activities, ["stage_received", "received", "assigned"]) ??
    statusActivity(activities, ["received_by_employee", "received"]);
  const receivedTimeline = timelineEntry(timeline, ["received_by_employee", "received"]);
  const draftActivity =
    findActivity(activities, "stage_draft_sent") ?? statusActivity(activities, "whatsapp_draft");
  const draftTimeline = timelineEntry(timeline, "whatsapp_draft");
  const notarizedActivity =
    findActivity(activities, "stage_notarized") ?? statusActivity(activities, "ejar_authenticated");
  const notarizedTimeline = timelineEntry(timeline, "ejar_authenticated");
  const completedActivity = statusActivity(activities, "completed");
  const completedTimeline = timelineEntry(timeline, "completed");

  const raw = {
    paid: {
      done: isPaid,
      at: paymentActivity?.at ?? firstAt(payments) ?? paidTimeline?.created_at ?? null,
      who: isPaid ? "العميل" : null,
    },
    // «قيد المراجعة» خطوة آلية بعد الدفع مباشرة (الخادم ينقل الطلب إليها) — تُعدّ منجزة متى دُفع الطلب.
    under_review: {
      done: Boolean(reviewTimeline) || rank >= 2 || isPaid,
      at: reviewTimeline?.created_at ?? (isPaid ? paymentActivity?.at ?? firstAt(payments) ?? paidTimeline?.created_at ?? null : null),
      who: reviewTimeline || isPaid ? "النظام" : null,
    },
    received: {
      done: isReceived || rank >= 3,
      at: receivedActivity?.at ?? receivedTimeline?.created_at ?? order.received_at ?? null,
      who: who(receivedActivity, order.received_contract?.employee?.name ?? order.employee_name ?? null),
    },
    draft_sent: {
      done: rank >= 4 || Boolean(draftActivity),
      at: draftActivity?.at ?? draftTimeline?.created_at ?? null,
      who: who(draftActivity),
      note: order.ejar_contract_draft_number ? `رقم المسودة ${order.ejar_contract_draft_number}` : null,
    },
    notarized: {
      done: rank >= 5 || Boolean(notarizedActivity),
      at: notarizedActivity?.at ?? notarizedTimeline?.created_at ?? null,
      who: who(notarizedActivity),
      note: order.deed_number ? `رقم الصك ${order.deed_number}` : null,
    },
    completed: {
      done: rank >= 6,
      at: completedActivity?.at ?? completedTimeline?.created_at ?? null,
      who: who(completedActivity),
    },
  };

  // التوثيق يُغلق الرحلة عملياً: «مكتمل» تُعدّ منجزة ضمنياً بعد التوثيق إن لم تُستخدم.
  let currentKey = null;
  const steps = JOURNEY_STEPS.map((step) => {
    const info = raw[step.key];
    return { ...step, done: Boolean(info.done), at: info.at, who: info.who, note: info.note ?? null };
  });
  // أي خطوة منجزة تعني أن ما قبلها منجز (بيانات قديمة بلا سجل).
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (steps[i].done) {
      for (let j = 0; j < i; j += 1) steps[j].done = true;
      break;
    }
  }
  const sideState = SIDE_STATE_LABELS[statusKey] ? statusKey : null;
  if (!sideState) {
    const next = steps.find((s) => !s.done);
    currentKey = next?.key ?? null;
  }
  steps.forEach((s) => {
    s.current = s.key === currentKey;
  });
  const doneCount = steps.filter((s) => s.done).length;

  return {
    steps,
    currentKey,
    sideState,
    sideStateLabel: sideState ? SIDE_STATE_LABELS[sideState] : null,
    progress: Math.round((doneCount / steps.length) * 100),
    rankOf: (key) => STEP_RANK[key] ?? 0,
  };
}

/** وقت مختصر «09/10 · 13:05» بأرقام لاتينية (dir=ltr عند العرض). */
export function formatJourneyTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}
