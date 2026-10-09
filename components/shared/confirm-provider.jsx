"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "./confirm-dialog";

/**
 * تأكيد موحّد لكل إجراء حذف/تغيير حالة بضغطة واحدة (دفعة د — د7).
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "حذف الطلب", description: "…", destructive: true }))) return;
 *
 * بديل لـ window.confirm (نافذة المتصفح الإنجليزية) بنفس تصميم اللوحة وRTL.
 */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: options.title ?? "تأكيد الإجراء",
        description: options.description ?? null,
        confirmLabel: options.confirmLabel ?? "تأكيد",
        cancelLabel: options.cancelLabel ?? "إلغاء",
        destructive: Boolean(options.destructive),
      });
    });
  }, []);

  const settle = (value) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setState(null);
    resolve?.(value);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(state)}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={state?.title}
        description={state?.description}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        destructive={state?.destructive}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

/** يرجع دالة `confirm(options) → Promise<boolean>`؛ خارج المزوّد تعود لـ window.confirm. */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  return (
    ctx ??
    ((options = {}) =>
      Promise.resolve(
        typeof window !== "undefined"
          ? window.confirm([options.title, options.description].filter(Boolean).join("\n"))
          : false
      ))
  );
}
