/**
 * Shared palette reconciled against design.html (client mockup, the visual
 * source of truth for the realtime-orders / orders / return-orders screens).
 * Keys are kept stable so existing call sites don't need to change; values
 * are the verified hex codes pulled from the mockup's <style> block.
 */
export const RT = {
  // Brand / surfaces — design.html .qsb/.fbtn active, .side gradient endpoints
  brand: "#0B5A3C",
  brandDeep: "#0B4F41",
  brandSoft: "#E8F5F1",
  pageBg: "#F4F5F4",
  pageBgDark: "#0B1411",
  cardDark: "#13241C",
  cardDarkAlt: "#0F1C16",
  // design.html uses #E3E8E6 for nearly every card/input/button border
  border: "#E3E8E6",
  borderDark: "rgba(255,255,255,0.08)",
  // design.html text tones: #33403B (body), #8A8A84 / #98A39E (muted)
  muted: "#8A8A84",
  mutedSoft: "#98A39E",
  mutedDark: "rgba(255,255,255,0.45)",
  text: "#22302C",
  textBody: "#33403B",
  textDark: "#F3F4F6",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  warningBar: "#F5C06A",
  warningNum: "#B45309",
  danger: "#B3472A",
  dangerBg: "#FBEEE9",
  dangerBar: "#F0A0A8",
  dangerNum: "#B3472A",
  success: "#0B7A4C",
  successBg: "#E4F3EC",
  // design.html #qb-refunded / .s-refunded — muted blue-gray
  refunded: "#557086",
  refundedBg: "#EEF2F6",
  info: "#3A5F8A",
  infoBg: "#EEF3F9",
  draftBg: "#F6E8CC",
  draftText: "#8A6414",
  newBg: "#DCFCE7",
  newText: "#0B7A4C",
  housingBg: "#F0EEF8",
  housingText: "#6B5CA8",
  commercialBg: "#EEF3F9",
  commercialText: "#3A5F8A",
  amberBadgeBg: "#FBF4E2",
  amberBadgeText: "#A3781E",
  viewBtnBg: "#F0F8F4",
  viewBtnText: "#0B5A3C",
  checkboxBlue: "#1F6FEB",
  // design.html .newstrip — gradient card housing the new-requests preview
  cardBorder: "#E8EEEC",
  stripBgFrom: "#EDF7F2",
  stripBgTo: "#F4FAF7",
  stripBorder: "#DAEAE2",
  mutedGray: "#9CA3AF",
  textSecondary: "#4B5563",
  white: "#FFFFFF",
  whiteMuted40: "rgba(255,255,255,0.4)",
  whiteMuted55: "rgba(255,255,255,0.55)",
  whiteMuted70: "rgba(255,255,255,0.7)",
  // Status-dot colors (design.html .s-new/.s-received/.s-raised/.s-draftrev/
  // .s-done/.s-refunded/.s-cancelled/.s-live) — used as the fallback badge
  // palette when an order status has no API-provided color.
  statusDot: {
    new: "#2B6CB0",
    received: "#6B5CA8",
    raised: "#A3781E",
    draftrev: "#B0682A",
    done: "#0B7A4C",
    refunded: "#557086",
    cancelled: "#B3472A",
    live: "#0B5A3C",
  },
  // Approval badge tones (design.html .ap-pend/.ap-appr/.ap-rej/.ap-proc)
  approval: {
    pending: { bg: "#FBEED2", text: "#8A5B10" },
    approved: { bg: "#E4F3EC", text: "#0B7A4C" },
    rejected: { bg: "#F7E1DE", text: "#B3472A" },
    processing: { bg: "#E7EEF7", text: "#3A5F8A" },
  },
};

/**
 * Exact pixel tokens pulled from design.html that fall outside Tailwind's
 * default scale (kept here instead of inline "magic numbers" in components).
 */
export const RT_SIZES = {
  stripRadius: 14,
  cardMinWidth: 188,
  cardSkeletonHeight: 132,
  fontHeading: 15,
  fontLabel: 12.5,
  fontEmpty: 13,
};
