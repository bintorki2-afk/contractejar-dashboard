"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * اختصارات لوحة المفاتيح (د19):
 *  J / K  التالي / السابق   ·  Enter  فتح الطلب   ·  W  واتساب العميل
 *  S      نافذة المرحلة     ·  /      البحث        ·  ?  عرض/إخفاء المساعدة
 * لا تعمل أثناء الكتابة في حقل أو عند وجود نافذة مفتوحة، ولا مع Ctrl/Alt/⌘.
 * تعتمد على ترتيب الصفوف الظاهر في الصفحة ([data-row-id]) فتحترم الفرز.
 */
export const ORDER_SHORTCUTS = [
  { keys: ["J"], label: "الطلب التالي" },
  { keys: ["K"], label: "الطلب السابق" },
  { keys: ["Enter"], label: "فتح الطلب المحدد" },
  { keys: ["W"], label: "واتساب العميل" },
  { keys: ["S"], label: "نافذة المرحلة التالية (استلمت / وثّقت)" },
  { keys: ["/"], label: "البحث" },
  { keys: ["?"], label: "عرض هذه المساعدة" },
];

export function isTypingTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable === true;
}

/** المفتاح المنطقي من حدث لوحة المفاتيح (يدعم لوحة عربية: ت=J ن=K ص=W س=S ة=M ب=F لا=B). */
export function shortcutFromEvent(e) {
  if (!e || e.ctrlKey || e.metaKey || e.altKey) return null;
  const code = e.code || "";
  if (code === "KeyJ") return "next";
  if (code === "KeyK") return "prev";
  if (code === "KeyW") return "whatsapp";
  if (code === "KeyS") return "stage";
  // دفعة هـ — صفحة الطلب فقط: M مرفق ناقص · F إضافة رسوم · B حوالة بنكية.
  if (code === "KeyM") return "data_request";
  if (code === "KeyF") return "add_fee";
  if (code === "KeyB") return "bank_transfer";
  if (e.key === "Enter") return "open";
  if (e.key === "/" || code === "Slash") return e.shiftKey ? "help" : "search";
  if (e.key === "?" || e.key === "؟") return "help";
  return null;
}

function visibleRowIds() {
  if (typeof document === "undefined") return [];
  return Array.from(document.querySelectorAll("[data-row-id]"))
    .filter((el) => el.offsetParent !== null)
    .map((el) => el.getAttribute("data-row-id"));
}

export function useOrdersShortcuts({ rows = [], enabled = true, onOpen, onWhatsApp, onStage, onSearch } = {}) {
  const [activeId, setActiveId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const findRow = useCallback((id) => rows.find((r) => String(r?.id) === String(id)) ?? null, [rows]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return;
      const action = shortcutFromEvent(e);
      if (!action) return;
      if (action === "help") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (action === "data_request" || action === "add_fee" || action === "bank_transfer") return; // صفحة الطلب فقط
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      if (action === "search") {
        e.preventDefault();
        onSearch?.();
        return;
      }
      const ids = visibleRowIds();
      if (!ids.length) return;
      const idx = activeId != null ? ids.indexOf(String(activeId)) : -1;
      if (action === "next" || action === "prev") {
        e.preventDefault();
        const nextIdx = action === "next" ? Math.min(ids.length - 1, idx + 1) : Math.max(0, idx === -1 ? 0 : idx - 1);
        const id = ids[nextIdx];
        setActiveId(id);
        document.querySelector(`[data-row-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" });
        return;
      }
      const row = findRow(activeId ?? ids[0]);
      if (!row) return;
      e.preventDefault();
      if (action === "open") onOpen?.(row);
      if (action === "whatsapp") onWhatsApp?.(row);
      if (action === "stage") onStage?.(row);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, activeId, findRow, onOpen, onWhatsApp, onStage, onSearch]);

  return { activeId, setActiveId, helpOpen, setHelpOpen };
}

export const ORDER_DETAIL_SHORTCUTS = [
  { keys: ["S"], label: "تنفيذ المرحلة التالية (استلمت / وثّقت — يفتح التأكيد)" },
  { keys: ["W"], label: "واتساب العميل" },
  { keys: ["M"], label: "طلب مرفق ناقص / تصحيح بيانات" },
  { keys: ["F"], label: "إضافة رسوم (لمن لديه الصلاحية)" },
  { keys: ["B"], label: "تسجيل حوالة بنكية (لمن لديه الصلاحية)" },
  { keys: ["?"], label: "عرض هذه المساعدة" },
];

/** اختصارات صفحة تفاصيل الطلب: S المرحلة التالية، W واتساب، M مرفق ناقص، F رسوم، B حوالة، ? المساعدة. */
export function useOrderDetailShortcuts({ enabled = true, onStage, onWhatsApp, onDataRequest, onAddFee, onBankTransfer } = {}) {
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return;
      const action = shortcutFromEvent(e);
      if (!action) return;
      if (action === "help") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      if (action === "stage") {
        e.preventDefault();
        onStage?.();
      } else if (action === "whatsapp") {
        e.preventDefault();
        onWhatsApp?.();
      } else if (action === "data_request" && onDataRequest) {
        e.preventDefault();
        onDataRequest();
      } else if (action === "add_fee" && onAddFee) {
        e.preventDefault();
        onAddFee();
      } else if (action === "bank_transfer" && onBankTransfer) {
        e.preventDefault();
        onBankTransfer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onStage, onWhatsApp, onDataRequest, onAddFee, onBankTransfer]);
  return { helpOpen, setHelpOpen };
}
