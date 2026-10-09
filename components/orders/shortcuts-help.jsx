"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ORDER_SHORTCUTS } from "@/src/hooks/use-orders-shortcuts";

/** نافذة «اختصارات لوحة المفاتيح» (د19) — تُفتح بـ «?». */
export default function ShortcutsHelp({ open, onOpenChange, items = ORDER_SHORTCUTS }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="text-right sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-brand-deep" /> اختصارات لوحة المفاتيح
          </DialogTitle>
          <DialogDescription>تعمل خارج حقول الكتابة. تعمل أيضاً مع لوحة المفاتيح العربية.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y divide-brand-line dark:divide-white/10">
          {items.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
              <span className="text-[#33403B] dark:text-white/80">{s.label}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} dir="ltr" className="min-w-7 rounded-md border border-brand-line bg-[#F5F7F6] px-2 py-0.5 text-center text-[12px] font-bold shadow-[0_1px_0_#E3ECE8] dark:bg-white/10 dark:border-white/15">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
