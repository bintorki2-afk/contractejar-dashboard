import { useMemo } from "react";
import { colorize, durTxt, money, pick } from "../../shared/report-format";

const PERIOD_LABELS = {
  all: "كل الفترات",
  last_30_days: "هذا الشهر",
  month: "هذا الشهر",
  last_7_days: "آخر ٧ أيام",
  week: "آخر ٧ أيام",
  today: "اليوم",
  custom: "مدة محددة",
};

function formatRateValue(row) {
  if (row.value_display != null) return row.value_display;
  if (typeof row.value === "string") return row.value;
  if (row.suffix) return `${row.value}${row.suffix}`;
  if (row.is_percent === false) return row.value;
  return `${row.value ?? 0}%`;
}

function buildKpis(k) {
  return [
    ["total", "إجمالي الطلبات", pick(k, "total_count", "total"), "file"],
    ["done", "موثّقة", pick(k, "documented_count", "done_count", "completed_count"), "checkCircle"],
    ["working", "قيد العمل", pick(k, "working_count", "active_count"), "activity", "warning"],
    ["canceled", "ملغاة", pick(k, "canceled_count", "cancelled_count"), "xCircle", "danger"],
    // الخادم (متابعة 1): refunded_orders/refunded_count = الطلبات المسترجعة فعلاً (حالة «مسترجع» أو
    // استرجاع Moyasar ناجح) — نفس رقم «مسترجعة» في تبويب الطلبات. طلبات الاسترجاع القديمة المؤكدة
    // صارت مفتاحاً مستقلاً refund_requests_confirmed.
    ["refunded", "مسترجعة", pick(k, "refunded_orders", "refunded_count"), "undo", "muted"],
    ["revenue", "الإيرادات (ريال)", pick(k, "revenue", "revenue_total"), "wallet"],
    // دفعة هـ (E5): رسوم إضافية · فروقات السعر · استرجاعات · الصافي — نفس أرقام الخادم في كل مكان.
    ["extra_fees", "رسوم إضافية (ريال)", pick(k, "extra_fees"), "filePlus", "warning"],
    ["price_differences", "فروقات السعر (ريال)", pick(k, "price_differences"), "layers", "warning"],
    ["refunds", "استرجاعات (ريال)", pick(k, "refunds"), "undo", "muted"],
    ["net_revenue", "صافي الإيراد (ريال)", pick(k, "net_revenue"), "banknote"],
  ].map(([key, label, value, icon, tone]) => ({ key, label, value: value ?? 0, icon, tone }));
}

function buildConversionRateItems(data) {
  const conversionRates = (Array.isArray(data?.conversion_rates) ? data.conversion_rates : []).map((row) => ({
    label: row.label,
    value: formatRateValue(row),
    tone: row.tone,
  }));
  if (conversionRates.length) return conversionRates;

  const rateObj =
    (!Array.isArray(data?.conversion_rates) && data?.conversion_rates) || data?.conversion_rates_map || data?.rates;
  if (!rateObj) return [];

  return [
    { label: "نسبة عدم الإكمال (تسرّب)", value: `${rateObj.incomplete_percent ?? 0}%`, tone: "gold" },
    { label: "تحويل المسودة إلى دفع", value: `${rateObj.draft_to_paid_percent ?? 0}%`, tone: "green" },
    { label: "نسبة المُستلمة (بدأ العمل)", value: `${rateObj.claimed_percent ?? 0}%` },
    { label: "معدّل التوثيق", value: `${rateObj.documented_percent ?? 0}%` },
    { label: "معدّل الإلغاء", value: `${rateObj.cancel_percent ?? 0}%`, tone: "red" },
    { label: "معدّل الاسترجاع (من المدفوع)", value: `${rateObj.refund_percent ?? 0}%`, tone: "muted" },
  ];
}

function buildOperationalItems(operational) {
  return [
    {
      label: "عدد الطلبات المنتظرة",
      value: `${pick(operational, "waiting_count", "pending_count", "total_orders") ?? 0} طلب`,
    },
    {
      label: "متوسط زمن الانتظار",
      value: durTxt(pick(operational, "avg_wait_seconds", "avg_receive_seconds")),
    },
    {
      label: "أطول انتظار حالي",
      value: durTxt(pick(operational, "longest_wait_seconds", "max_wait_seconds")),
      tone: Number(pick(operational, "longest_wait_seconds", "max_wait_seconds")) > 1800 ? "red" : undefined,
    },
    {
      label: "متأخرة أكثر من 15 دقيقة",
      value: `${pick(operational, "late_over_15m", "late_over_15_count") ?? 0} طلب`,
      tone: Number(pick(operational, "late_over_15m", "late_over_15_count")) > 0 ? "gold" : undefined,
    },
    {
      label: "متأخرة أكثر من 30 دقيقة",
      value: `${pick(operational, "late_over_30m", "late_over_30_count") ?? 0} طلب`,
      tone: Number(pick(operational, "late_over_30m", "late_over_30_count")) > 0 ? "red" : undefined,
    },
    (() => {
      // د3: لا استلامات ⇒ الخادم يرسل null ⇒ «—» (كانت تظهر 100% أو 0% مضلِّلة).
      const sla = pick(operational, "sla_percent", "sla_15m_percent");
      return {
        label: "نسبة الالتزام (خلال 15 دقيقة)",
        value: sla == null ? "—" : `${sla}%`,
        tone: sla == null ? undefined : Number(sla) >= 80 ? "green" : "gold",
      };
    })(),
    {
      label: "مرّات التراجع عن الاستلام",
      value: `${pick(operational, "unclaim_count", "unreceive_count") ?? 0} مرة`,
    },
  ];
}

function buildPnl(data) {
  return (data?.pnl ?? data?.income_statement ?? []).map((row) => ({
    label: row.label,
    value: row.value_display ?? money(row.value),
    tone: row.tone ?? (Number(row.value) < 0 ? "red" : row.is_total || row.is_subtotal ? "green" : undefined),
    bold: row.is_total || row.is_subtotal || row.bold,
    separator: row.is_subtotal || row.separator,
  }));
}

function buildFinancialSummary(data) {
  return (data?.financial_summary ?? data?.revenue_by_source ?? []).map((row) => ({
    label: row.label,
    value: row.value_display ?? money(row.value),
    tone: row.tone,
    bold: row.is_total || row.bold,
    separator: row.is_total || row.separator,
  }));
}

/** Shapes raw performance-report API/mock data into view-ready sections. */
export function usePerformanceReportViewModel(data, period) {
  return useMemo(() => {
    const k = data?.kpis ?? {};
    const operational = data?.operational_metrics ?? data?.receive_queue ?? {};

    // د3: funnel_summary من الخادم = المصدر الموحّد (بدأ − مدفوع = التسرّب).
    const fs = data?.funnel_summary;
    const leakage =
      (fs ? { count: fs.drop_off, percent: fs.drop_off_percent, started: fs.started, completed: fs.completed } : null) ??
      data?.conversion_leakage ??
      (data?.leakage
        ? { count: data.leakage.count ?? data.leakage.value, percent: data.leakage.percent ?? data.leakage.pct }
        : null);

    const byContract = colorize(
      (data?.by_contract_type ?? data?.contract_type_distribution ?? []).map((row) => ({
        ...row,
        detail: row.detail ?? (row.revenue != null ? `إيراد ${Number(row.revenue).toLocaleString("en-US")} ريال` : undefined),
      })),
      ["#0B5A3C", "#3A5F8A"]
    );

    const byDocType = colorize(
      (data?.by_document_type ?? []).map((row) => ({
        ...row,
        detail: row.detail ?? (row.revenue ? `إيراد ${Number(row.revenue).toLocaleString("en-US")}` : undefined),
      })),
      ["#5B7C99"]
    );

    const refundBars = colorize(data?.refund_requests_by_status ?? data?.refund_statuses ?? [], [
      "#A3781E",
      "#3A5F8A",
      "#0B7A4C",
      "#B3472A",
    ]);

    const dailyOrders = data?.daily_orders ?? [];
    const dailyTitleDays =
      dailyOrders.length || (period === "today" ? 3 : period === "last_7_days" || period === "week" ? 7 : 14);

    return {
      kpis: buildKpis(k),
      funnelRaw: data?.conversion_funnel ?? [],
      leakage,
      conversionRateItems: buildConversionRateItems(data),
      operationalItems: buildOperationalItems(operational),
      pnl: buildPnl(data),
      unitEconomics: data?.unit_economics ?? [],
      unitEconomicsNote: data?.unit_economics_note,
      financialSummary: buildFinancialSummary(data),
      ordersByStatus: colorize(data?.orders_by_status ?? []),
      byContract,
      byEmployee: colorize(data?.by_employee ?? data?.employee_performance ?? [], ["#1F9D8F"]),
      byDocType,
      correctionErrors: colorize(data?.correction_errors ?? data?.common_errors ?? [], ["#C08A2E"]),
      paymentMethods: colorize(data?.revenue_by_payment_method ?? [], ["#0B7A4C", "#A3781E", "#1F9D8F"]),
      refundBars,
      refundTotal: data?.refund_requests_total ?? data?.refunds_total_amount,
      dailyOrders,
      dailyTitleDays,
      periodLabel: data?.period_label ?? PERIOD_LABELS[period] ?? "الفترة",
    };
  }, [data, period]);
}
