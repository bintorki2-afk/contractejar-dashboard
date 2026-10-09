"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  ArrowUpLeft,
  BadgeCheck,
  CheckCircle2,
  Hand,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdersAttention } from "@/src/hooks/use-orders-attention";
import { useRunOrderStage } from "@/src/hooks/use-order-stage";
import { useConfirm } from "@/components/shared/confirm-provider";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";
import { formatDurationMinutes } from "@/src/lib/format-duration";

/**
 * «عليك الحين» (د11) — أهم شيء في الرئيسية: ما يحتاج تنفيذ الآن، الأقدم أولاً.
 * المصدر: GET /admin/orders/attention (يُحسب حيّاً في الخادم كل طلب).
 */
const LANES = [
  {
    key: "awaiting_receive",
    title: "بانتظار الاستلام",
    hint: "مدفوعة ولم يستلمها أحد",
    icon: Hand,
    tone: "brand",
    action: "received",
    actionLabel: "استلمت",
    viewAll: "/home/realtime-orders",
  },
  {
    key: "awaiting_notarize",
    title: "بانتظار التوثيق",
    hint: "مستلمة — وثّق في إيجار",
    icon: BadgeCheck,
    tone: "violet",
    viewAll: "/home/orders?tab=received_by_employee",
  },
  {
    key: "delayed",
    title: "متأخرة",
    hint: "تجاوزت المدة المحددة",
    icon: AlarmClock,
    tone: "danger",
    viewAll: "/home/orders",
  },
];

const TONES = {
  brand: { chip: "bg-brand-mint text-brand-deep dark:bg-emerald-500/15 dark:text-emerald-300", ring: "border-brand-line" },
  info: { chip: "bg-[#E8F0FE] text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-300", ring: "border-brand-line" },
  violet: { chip: "bg-[#EFEAFD] text-[#5B35C9] dark:bg-violet-500/15 dark:text-violet-300", ring: "border-brand-line" },
  danger: { chip: "bg-[#FDECEC] text-[#B42318] dark:bg-red-500/15 dark:text-red-300", ring: "border-[#F5C9C6] dark:border-red-500/30" },
};

const LIST_LIMIT = 10;

function typeLabel(key) {
  if (key === "commercial") return "تجاري";
  if (key === "housing") return "سكني";
  return key || "";
}

function AttentionItem({ item, lane, onAction, pendingId }) {
  const router = useRouter();
  const open = () => router.push(`/home/orders/${item.id}?from=${encodeURIComponent("/home")}`);
  const busy = pendingId === item.id;
  const canReceive = lane.action === "received" || (lane.key === "delayed" && item.bucket === "awaiting_receive");
  const name = item.customer_name?.trim();
  return (
    <li
      className={cn(
        "group rounded-xl border bg-white px-3 py-2.5 transition-colors hover:border-brand-green/40 dark:bg-white/[0.03] dark:border-white/10",
        item.is_delayed ? "border-[#F5C9C6] dark:border-red-500/30" : "border-brand-line"
      )}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={open} className="min-w-0 flex-1 text-start" title="فتح الطلب">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-[13px] text-brand-deep dark:text-emerald-300 tabular-nums">#{item.uuid}</span>
            <span className="text-[11px] font-bold text-[#6B7570] dark:text-white/50">{typeLabel(item.contract_type)}</span>
            {item.is_delayed ? (
              <span
                title={(item.delay_labels || []).join(" · ")}
                className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-[#FDECEC] text-[#B42318] text-[10.5px] font-extrabold dark:bg-red-500/15 dark:text-red-300"
              >
                <AlarmClock className="size-3" />
                متأخر
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-[#33403B] dark:text-white/70">
            {name || "عميل"}
            {item.customer_mobile ? (
              <span className="text-[#8A958F] dark:text-white/40">
                {" · "}
                <span dir="ltr" className="tabular-nums">{formatSaudiMobileDisplay(item.customer_mobile)}</span>
              </span>
            ) : null}
            {lane.key !== "awaiting_receive" && item.employee_name ? (
              <span className="text-[#8A958F] dark:text-white/40"> · {item.employee_name}</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#8A958F] dark:text-white/40">
            منذ {formatDurationMinutes(item.age_minutes)}
            {item.delay_labels?.length ? <span className="text-[#B42318] dark:text-red-300"> · {item.delay_labels[0]}</span> : null}
          </p>
        </button>
        {canReceive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction(item, lane)}
            className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-brand-deep text-white text-[12px] font-bold hover:bg-brand-deep/90 disabled:opacity-60 dark:bg-emerald-500 dark:text-[#0B1411]"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Hand className="size-3.5" />}
            استلمت
          </button>
        ) : (
          <button
            type="button"
            onClick={open}
            aria-label="فتح الطلب"
            className="shrink-0 inline-flex items-center justify-center size-8 rounded-lg border border-brand-line text-brand-deep hover:bg-brand-mint dark:border-white/10 dark:text-emerald-300"
          >
            <ArrowUpLeft className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export default function AttentionBoard() {
  const router = useRouter();
  const confirm = useConfirm();
  const { data, counts, isLoading, isError, isFetching, refetch } = useOrdersAttention({ limit: 50 });
  const [pendingId, setPendingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const runStage = useRunOrderStage({
    onSuccess: (_d, vars) => {
      setPendingId(null);
      router.push(`/home/orders/${vars.orderId}?from=${encodeURIComponent("/home")}`);
    },
    onError: () => setPendingId(null),
  });

  const total = (counts.awaiting_receive ?? 0) + (counts.awaiting_notarize ?? 0);
  // الافتراضي: أول قسم فيه طلبات (بالترتيب: استلام ← توثيق ← متأخرة).
  const firstNonEmpty = LANES.find((l) => (counts?.[l.key] ?? 0) > 0)?.key ?? "awaiting_receive";
  const activeKey = selected ?? firstNonEmpty;
  const activeLane = LANES.find((l) => l.key === activeKey) ?? LANES[0];
  const activeItems = data?.[activeLane.key] ?? [];
  const activeCount = counts?.[activeLane.key] ?? activeItems.length;

  const handleAction = async (item, lane) => {
    const canReceive = lane.action === "received" || (lane.key === "delayed" && item.bucket === "awaiting_receive");
    if (!canReceive) return;
    const ok = await confirm({
      title: "استلام الطلب",
      description: `استلام الطلب #${item.uuid} باسمك؟ سيُبلَّغ العميل أن موظفاً بدأ العمل على طلبه.`,
      confirmLabel: "استلمت",
    });
    if (!ok) return;
    setPendingId(item.id);
    runStage.mutate({ orderId: item.id, stage: "received", openWhatsApp: false });
  };

  return (
    <section aria-labelledby="attention-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="attention-title" className="text-[22px] font-extrabold text-[#0E1F18] dark:text-white leading-tight">
            عليك الحين
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7570] dark:text-white/50">
            {isLoading
              ? "جاري التحميل…"
              : total > 0
                ? `${total} طلب يحتاج إجراء — الأقدم أولاً`
                : "لا شيء متأخر — كل الطلبات في مسارها"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-brand-line bg-white text-[12px] font-bold text-[#33403B] hover:bg-brand-mint dark:bg-white/[0.04] dark:border-white/10 dark:text-white/70"
        >
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
          تحديث
        </button>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-brand-line bg-white p-6 text-center text-[13px] text-[#B42318] dark:bg-[#0F1C16] dark:border-white/10">
          تعذّر تحميل «عليك الحين».{" "}
          <button type="button" onClick={() => refetch()} className="underline font-bold">
            أعد المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* أربع خانات بالعدد — كل خانة تعرض قائمتها تحتها */}
          <div role="tablist" aria-label="أقسام عليك الحين" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {LANES.map((lane) => {
              const Icon = lane.icon;
              const tone = TONES[lane.tone];
              const count = counts?.[lane.key] ?? 0;
              const active = lane.key === activeKey;
              const danger = lane.key === "delayed" && count > 0;
              return (
                <button
                  key={lane.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(lane.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-start transition-all dark:bg-[#0F1C16]",
                    active
                      ? "border-brand-deep ring-2 ring-brand-deep/15 dark:border-emerald-400 dark:ring-emerald-400/20"
                      : danger
                        ? "border-[#F5C9C6] hover:border-[#B42318]/50 dark:border-red-500/30"
                        : "border-brand-line hover:border-brand-green/40 dark:border-white/10"
                  )}
                >
                  <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl", tone.chip)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-extrabold text-[#14231D] dark:text-white">{lane.title}</span>
                    <span className="block truncate text-[11px] text-[#8A958F] dark:text-white/40">{lane.hint}</span>
                  </span>
                  <span
                    className={cn(
                      "text-[30px] font-extrabold leading-none tabular-nums",
                      danger ? "text-[#B42318] dark:text-red-300" : count > 0 ? "text-[#0E1F18] dark:text-white" : "text-[#B5C0BB] dark:text-white/25"
                    )}
                  >
                    {isLoading ? "…" : count}
                  </span>
                </button>
              );
            })}
          </div>

          <div role="tabpanel" aria-label={activeLane.title} className="rounded-2xl border border-brand-line bg-[#FAFCFB] p-3 dark:bg-[#0F1C16] dark:border-white/10">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-[#8A958F]">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : activeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                <CheckCircle2 className="size-7 text-brand-green/70" />
                <p className="text-[13px] font-bold text-[#33403B] dark:text-white/60">لا يوجد شيء في «{activeLane.title}»</p>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                  {activeItems.slice(0, LIST_LIMIT).map((item) => (
                    <AttentionItem key={`${activeLane.key}-${item.id}`} item={item} lane={activeLane} onAction={handleAction} pendingId={pendingId} />
                  ))}
                </ul>
                {activeCount > LIST_LIMIT ? (
                  <div className="mt-2 flex justify-center">
                    <Link
                      href={activeLane.viewAll}
                      className="inline-flex items-center justify-center gap-1 h-9 px-4 rounded-lg text-[12.5px] font-bold text-brand-deep hover:bg-brand-mint dark:text-emerald-300"
                    >
                      عرض الكل ({activeCount})
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
