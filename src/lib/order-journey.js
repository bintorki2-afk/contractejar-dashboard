/**
 * رحلة الطلب في تفاصيل الطلب (دفعة هـ — 3 خطوات فقط):
 *   قيد المراجعة → مستلم من الموظف → تم التوثيق
 * حالات جانبية تُعرض بدل الرحلة: ملغي / مسترجع (ومعلق / بانتظار المشرف كبيانات قديمة).
 *
 * المصدر الأول: `journey[]` + `journey_side_state` من الخادم (GET /admin/orders/{id} أو /stages).
 * عند غيابهما (بيانات قديمة) تُبنى الخطوات من `status_key` + `status_timeline[]` + `activities[]`.
 * كل خطوة: { key, label, done, current, at, who, note }.
 */

export const JOURNEY_STEPS = [
  { key: "under_review", label: "قيد المراجعة" },
  { key: "received_by_employee", label: "مستلم من الموظف" },
  { key: "ejar_authenticated", label: "تم التوثيق" },
];

/** ترتيب مفاتيح الحالات على الرحلة (لمعرفة ما اكتمل ضمنياً). */
const STATUS_RANK = {
  new: 0,
  paid: 1,
  under_review: 1,
  received: 2,
  received_by_employee: 2,
  whatsapp_draft: 2, // مفتاح قديم — يُعامل كمستلم
  ejar_authenticated: 3,
  completed: 3,
};

export const SIDE_STATE_LABELS = {
  cancelled: "ملغي",
  on_hold: "معلق",
  refunded: "مسترجع",
  waiting_supervisor: "بانتظار المشرف",
};

/** لون الحالة الجانبية: الإلغاء أحمر، الاسترجاع رمادي/بنفسجي، غير ذلك كهرماني. */
export const SIDE_STATE_TONES = {
  cancelled: "danger",
  refunded: "neutral",
  on_hold: "warning",
  waiting_supervisor: "warning",
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

function finish(steps, sideState, sideStateLabel, sideStateAt = null) {
  const currentKey = sideState ? null : (steps.find((s) => !s.done)?.key ?? null);
  steps.forEach((s) => {
    s.current = s.key === currentKey;
  });
  const doneCount = steps.filter((s) => s.done).length;
  return {
    steps,
    currentKey,
    sideState,
    sideStateLabel,
    sideStateTone: sideState ? SIDE_STATE_TONES[sideState] ?? "warning" : null,
    sideStateAt,
    progress: Math.round((doneCount / steps.length) * 100),
    allDone: doneCount === steps.length,
  };
}

/** الخطوات من `journey[]` الخادم (3 خطوات {key,label,done,current,at,by}). */
function fromServer(order) {
  const serverSteps = list(order.journey).filter((s) => s && s.key);
  if (!serverSteps.length) return null;
  const steps = JOURNEY_STEPS.map((def) => {
    const s = serverSteps.find((x) => x.key === def.key) ?? {};
    return {
      key: def.key,
      label: s.label || def.label,
      description: s.description ?? null,
      done: Boolean(s.done),
      at: s.at ?? null,
      who: s.by ?? null,
      note: null,
    };
  });
  // الخطوة الأولى تتم بالدفع — لا تحمل منفّذاً؛ نعرض «بعد الدفع» بدل الاسم.
  if (steps[0].done && !steps[0].who) steps[0].who = "بعد الدفع";
  if (steps[2].done && order.deed_number) steps[2].note = `رقم الصك ${order.deed_number}`;
  const side = order.journey_side_state;
  const sideKey = side?.key ?? (SIDE_STATE_LABELS[order.status_key] ? order.status_key : null);
  const sideLabel = side?.label ?? (sideKey ? SIDE_STATE_LABELS[sideKey] : null);
  return finish(steps, sideKey, sideLabel, side?.at ?? null);
}

/**
 * يبني خطوات الرحلة. `order` = بيانات `GET /admin/orders/{id}` الخام.
 */
export function buildOrderJourney(order = {}) {
  const server = fromServer(order);
  if (server) return server;

  const activities = list(order.activities)
    .slice()
    .sort((a, b) => String(a?.at ?? "").localeCompare(String(b?.at ?? "")));
  const timeline = list(order.status_timeline);
  const payments = list(order.payments).filter((p) => p?.status === "success" || p?.status === "paid");
  const statusKey = order.status_key ?? null;
  const isPaid = Boolean(
    order.payment_state?.is_paid ||
      order.is_paid ||
      order.is_completed === true ||
      order.is_completed === 1 ||
      payments.length
  );
  const isReceived = Boolean(order.is_received || order.received_contract);
  const rank = STATUS_RANK[statusKey] ?? (isPaid ? 1 : 0);

  const paymentActivity = findActivity(activities, ["payment", "bank_transfer_recorded"]);
  const paidTimeline = timelineEntry(timeline, "paid");
  const reviewTimeline = timelineEntry(timeline, "under_review");
  const receivedActivity =
    findActivity(activities, ["stage_received", "received", "assigned"]) ??
    statusActivity(activities, ["received_by_employee", "received"]);
  const receivedTimeline = timelineEntry(timeline, ["received_by_employee", "received"]);
  const notarizedActivity =
    findActivity(activities, "stage_notarized") ?? statusActivity(activities, ["ejar_authenticated", "completed"]);
  const notarizedTimeline = timelineEntry(timeline, ["ejar_authenticated", "completed"]);

  const raw = {
    under_review: {
      done: isPaid || rank >= 1,
      at: reviewTimeline?.created_at ?? paymentActivity?.at ?? firstAt(payments) ?? paidTimeline?.created_at ?? null,
      who: isPaid || rank >= 1 ? "بعد الدفع" : null,
    },
    received_by_employee: {
      done: isReceived || rank >= 2,
      at: receivedActivity?.at ?? receivedTimeline?.created_at ?? order.received_at ?? null,
      who: who(receivedActivity, order.received_contract?.employee?.name ?? order.employee_name ?? null),
    },
    ejar_authenticated: {
      done: rank >= 3 || Boolean(notarizedActivity),
      at: notarizedActivity?.at ?? notarizedTimeline?.created_at ?? null,
      who: who(notarizedActivity),
      note: order.deed_number ? `رقم الصك ${order.deed_number}` : null,
    },
  };

  const steps = JOURNEY_STEPS.map((step) => {
    const info = raw[step.key];
    return { ...step, done: Boolean(info.done), at: info.at, who: info.who, note: info.note ?? null };
  });
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (steps[i].done) {
      for (let j = 0; j < i; j += 1) steps[j].done = true;
      break;
    }
  }
  const sideState = SIDE_STATE_LABELS[statusKey] ? statusKey : null;
  return finish(steps, sideState, sideState ? SIDE_STATE_LABELS[sideState] : null);
}

/** وقت مختصر «09/10/2026 · 13:05» بأرقام لاتينية (dir=ltr عند العرض). */
export function formatJourneyTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

/** تاريخ ووقت منفصلان للعرض تحت كل خطوة: «09/10 · 10:05». */
export function formatJourneyShort(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}
