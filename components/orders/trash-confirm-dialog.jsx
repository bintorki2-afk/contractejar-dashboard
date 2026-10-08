"use client";

import ConfirmDialog from "@/components/shared/confirm-dialog";

/** تأكيد «نقل إلى السلة» (د12) — مع خيار force لمدير النظام عند الطلبات المدفوعة. */
export default function TrashConfirmDialog({ vm }) {
  return (
    <ConfirmDialog
      open={vm.deleteDialogOpen}
      onOpenChange={vm.setDeleteDialogOpen}
      title={vm.deleteCount > 1 ? "نقل الطلبات إلى السلة" : "نقل الطلب إلى السلة"}
      description={
        <span className="flex flex-col gap-2">
          <span>
            سيُنقل {vm.deleteLabel ?? "الطلب"} إلى «السلة» ويختفي من القوائم والتقارير، ويمكن استعادته خلال 30 يوماً.
          </span>
          {vm.canForceDelete ? (
            <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#9A6100]">
              <input
                type="checkbox"
                checked={Boolean(vm.deleteForce)}
                onChange={(e) => vm.setDeleteForce?.(e.target.checked)}
                className="size-4 accent-[#B42318]"
              />
              الطلب مدفوع؟ نقله رغم ذلك (مدير النظام فقط — المدفوعات لا تُحذف)
            </label>
          ) : null}
        </span>
      }
      confirmLabel="نقل إلى السلة"
      cancelLabel="إلغاء"
      destructive
      isPending={vm.isDeletingOrder}
      onConfirm={vm.confirmDeleteOrder}
    />
  );
}
