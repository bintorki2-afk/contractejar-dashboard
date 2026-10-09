import { isDraftOrderRow } from "@/src/lib/draft-contract-statuses";
import { toSaudiMobileDialDigits } from "@/src/lib/format-phone";

export const FILTER_TABS = [
  { id: "all", label: "الكل" },
  { id: "completed", label: "مكتمل" },
  { id: "draft", label: "مسودة" },
  { id: "returned", label: "مسترجع" },
  { id: "canceled", label: "ملغي" },
  { id: "processing", label: "قيد المعالجة" },
];

// دفعة د (د2): نفس نطاق «جميع الطلبات» — الطلبات = خطوة ≥ 4 غير محذوفة؛ مدفوع/غير مدفوع منها؛
// «مسودات غير مكتملة» = خطوة < 4 (تبويب «غير مكتمل»).
export const STAT_DEFS = [
  { key: "ordersCount", label: "الطلبات", bar: "#0B5A3C", barDark: "#34D399" },
  { key: "completed", label: "مدفوعة", bar: "#10B981", barDark: "#34D399" },
  { key: "incomplete", label: "غير مدفوعة", bar: "#F97316", barDark: "#FB923C" },
  { key: "incompleteDrafts", label: "مسودات غير مكتملة", bar: "#94A3B8", barDark: "#94A3B8" },
  { key: "properties", label: "عقارات", bar: "#0A4D33", barDark: "#34D399" },
  { key: "units", label: "وحدات", bar: "#0A4D33", barDark: "#6EE7B7" },
  {
    key: "refundedAmount",
    label: "مسترجع (ر.س)",
    bar: "#EF4444",
    barDark: "#F87171",
    money: true,
  },
  {
    key: "paid",
    label: "مدفوع (ر.س)",
    bar: "#14B8A6",
    barDark: "#2DD4BF",
    money: true,
  },
  {
    key: "net",
    label: "الصافي (ر.س)",
    bar: "#0D9488",
    barDark: "#5EEAD4",
    money: true,
  },
];

export function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-US");
}

export function formatJoinedLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const date = d.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

export function formatJoinedShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB").replace(/\//g, "-");
}

export function whatsappHref(phone) {
  const digits = toSaudiMobileDialDigits(phone);
  if (!digits) return null;
  const normalized = digits.startsWith("966") ? digits : `966${digits.replace(/^0/, "")}`;
  return `https://wa.me/${normalized}`;
}

/** Best-effort status bucket for the filter tabs — mirrors the substring conventions
 *  already used by src/lib/contract-statuses.js (no canonical status enum from the API). */
export function classifyOrderStatus(order = {}) {
  const statusName = order?.status?.name || order?.status_name || "";
  if (order?.return_contract === true || /مسترجع|استرجاع/.test(statusName)) {
    return "returned";
  }
  if (/ملغ/.test(statusName)) return "canceled";
  if (isDraftOrderRow(order)) return "draft";
  if (order?.is_completed) return "completed";
  return "processing";
}
