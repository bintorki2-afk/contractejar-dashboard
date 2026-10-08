export function money(value) {
  return `${Number(value ?? 0).toLocaleString("en-US")} ريال`;
}

export function toArabicDigits(value) {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

export function durTxt(seconds) {
  const s = Math.round(Number(seconds) || 0);
  if (s < 60) return `${s} ثانية`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h} ساعة${mm ? ` و${mm} د` : ""}`;
}

/** Returns the first non-null value found under `keys` on `obj`. */
export function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj?.[key] != null) return obj[key];
  }
  return undefined;
}

export function colorize(items = [], palette = ["#0A4D33", "#1E40AF", "#CA8A04", "#DC2626", "#9CA3AF"]) {
  return items.map((item, index) => ({
    ...item,
    label: item.label ?? item.name ?? item.stage,
    value: Number(item.value ?? item.count ?? 0),
    color: item.color ?? palette[index % palette.length],
    suffix: item.suffix,
    detail: item.detail ?? item.sublabel,
  }));
}
