import { getInstrumentTypeLabel, INSTRUMENT_TYPES } from "./instrument-types";

function firstArray(...candidates) {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeContractPeriods(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const payload = response?.data ?? response;

  return firstArray(
    payload?.items,
    payload?.data?.items,
    payload?.data?.data?.data,
    payload?.data?.data,
    payload?.data,
    payload
  );
}

export function getPeriodContractType(period, fallback = "housing") {
  const type = period?.contract_type;
  if (type === "commercial" || type === "housing") return type;
  return fallback;
}

export function groupContractPeriodsByContractType(periods = []) {
  const byType = { housing: [], commercial: [] };

  for (const period of periods) {
    const type = getPeriodContractType(period);
    byType[type].push(period);
  }

  return ["housing", "commercial"].map((type) => ({
    id: type,
    name: getContractTypeLabel(type),
    sections: groupContractPeriodsByInstrumentType(byType[type]),
  }));
}

export function formatContractPeriodPrice(price) {
  if (price === null || price === undefined || price === "") return null;
  const value = Number(price);
  if (!Number.isFinite(value)) return String(price);
  return `${value.toLocaleString("ar-SA-u-nu-latn")} ر.س`;
}

export function getContractPeriodLabel(period) {
  return period?.period || period?.note_trans || period?.note_ar || "—";
}

export function getContractTypeLabel(type) {
  if (type === "commercial") return "تجاري";
  if (type === "housing") return "سكني";
  return type || "—";
}

export function groupContractPeriodsByInstrumentType(periods = []) {
  const grouped = new Map();

  for (const period of periods) {
    const key = period?.instrument_type || "other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(period);
  }

  const orderedKeys = [
    ...INSTRUMENT_TYPES.filter((type) => grouped.has(type)),
    ...[...grouped.keys()].filter((key) => !INSTRUMENT_TYPES.includes(key)),
  ];

  return orderedKeys.map((instrumentType) => ({
    id: instrumentType,
    name: getInstrumentTypeLabel(instrumentType),
    items: grouped.get(instrumentType) ?? [],
  }));
}
