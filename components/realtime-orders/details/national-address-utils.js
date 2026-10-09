import { fieldLabel } from "@/src/lib/field-labels";
function pick(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    return value;
  }
  return null;
}

export function resolveImageUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    return value.url || value.path || value.full_url || value.src || null;
  }
  return null;
}

export function fileNameFromUrl(url) {
  if (!url) return null;
  try {
    const path = String(url).split("?")[0];
    const name = decodeURIComponent(path.split("/").pop() || "");
    if (!name) return null;
    // د6: الروابط الموقّعة تنتهي باسم الحقل (مثل image_instrument) — نعرض تسميته العربية.
    const known = fieldLabel(name);
    return known && known !== name ? known : name;
  } catch {
    return null;
  }
}

export function parseCoordinate(value) {
  if (value == null || value === "") return null;
  const num = Number(String(value).trim());
  return Number.isFinite(num) ? num : null;
}

/** Extract lat/lng from common Google Maps / geo URLs. */
export function parseCoordsFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const text = url.trim();
  if (!text) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
    /geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

export function isLikelyImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const path = url.split("?")[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|svg|pdf|heic|heif)$/i.test(path);
}

export function isMapsUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (parseCoordsFromUrl(url)) return true;

  const text = url.trim().toLowerCase();
  return (
    text.includes("google.com/maps") ||
    text.includes("maps.google") ||
    text.includes("goo.gl/maps") ||
    text.includes("maps.app.goo.gl") ||
    text.startsWith("geo:")
  );
}

function resolveNationalAddressType(step1 = {}, orderData = {}) {
  const source = String(step1.address_source ?? orderData.address_source ?? "").toLowerCase();
  const imageUrl = resolveImageUrl(pick(step1.image_address, orderData.image_address));
  const addressUrl = pick(step1.address_url, orderData.address_url);
  const lat = parseCoordinate(pick(step1.latitude, orderData.latitude));
  const lng = parseCoordinate(pick(step1.longitude, orderData.longitude));

  if (source.includes("صورة") || source.includes("image") || source.includes("img")) {
    return "img";
  }
  if (
    source.includes("خرائط") ||
    source.includes("map") ||
    source.includes("location") ||
    source.includes("موقع")
  ) {
    if (imageUrl || (addressUrl && isLikelyImageUrl(addressUrl))) return "img";
    if (lat != null && lng != null) return "location";
    if (addressUrl && isMapsUrl(addressUrl)) return "location";
    return "text";
  }

  if (imageUrl || (addressUrl && isLikelyImageUrl(addressUrl))) return "img";
  if (lat != null && lng != null) return "location";
  if (addressUrl && isMapsUrl(addressUrl)) return "location";
  return "text";
}

export function resolveNationalAddress(orderData = {}) {
  const step1 = orderData.step1 ?? {};
  const summary = orderData.contract_summary ?? {};
  const addressUrl = pick(step1.address_url, orderData.address_url);
  const imageUrl =
    resolveImageUrl(pick(step1.image_address, orderData.image_address)) ||
    (isLikelyImageUrl(addressUrl) ? addressUrl : null);

  const fromUrl = parseCoordsFromUrl(addressUrl);
  const lat = parseCoordinate(pick(step1.latitude, orderData.latitude)) ?? fromUrl?.lat ?? null;
  const lng = parseCoordinate(pick(step1.longitude, orderData.longitude)) ?? fromUrl?.lng ?? null;

  const type = resolveNationalAddressType(step1, orderData);

  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : addressUrl && isMapsUrl(addressUrl)
        ? addressUrl
        : null;

  const sourceLabels = {
    img: "صورة بطاقة العنوان",
    location: "رابط خرائط قوقل",
    text: pick(step1.address_source, "العنوان الوطني"),
  };

  return {
    type,
    source: sourceLabels[type] || pick(step1.address_source, "العنوان الوطني"),
    city: pick(summary.relation_labels?.property_city, step1.city_name, step1.property_city_name),
    district: pick(summary.neighborhood, step1.neighborhood),
    building: pick(summary.building_number, step1.building_number),
    street: pick(summary.street, step1.street),
    postal_code: pick(summary.postal_code, step1.postal_code),
    additional_number: pick(step1.additional_number, summary.additional_number),
    short_address: pick(step1.short_address, summary.short_address, step1.national_address),
    image_url: imageUrl,
    image_name: fileNameFromUrl(imageUrl),
    address_url: addressUrl,
    lat,
    lng,
    maps_url: mapsUrl,
    embed_url:
      lat != null && lng != null
        ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
        : fromUrl
          ? `https://maps.google.com/maps?q=${fromUrl.lat},${fromUrl.lng}&z=15&output=embed`
          : null,
  };
}
