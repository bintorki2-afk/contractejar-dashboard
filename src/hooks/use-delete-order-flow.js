"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close";
import { usePermissions } from "@/src/hooks/use-permissions";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { postOrderDelete, restoreOrder } from "@/src/lib/order-delete-api";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

/**
 * Shared "delete order(s)" flow for the order list pages
 * (الطلبات المباشرة / جميع الطلبات).
 *
 * Supports a single-order delete (from the row menu) and a bulk delete
 * (from the selection bar). دفعة د (د12): الحذف ينقل الطلب إلى السلة (30 يوماً) مع «تراجع»:
 *  - it needs `all_requests.delete` (same as the server) or a system admin (canDelete),
 *  - paid orders are refused by the server (422) unless a system admin confirms force=1,
 *  - it always goes through a confirmation dialog,
 *  - success toast offers «تراجع» (POST /admin/orders/{id}/restore).
 */
export function useDeleteOrderFlow({ queryKey } = {}) {
  const { isAdmin, can } = usePermissions();
  const canDelete = Boolean(isAdmin || can(PERMISSION_SECTIONS.all_requests, "delete"));
  const queryClient = useQueryClient();

  // target = { ids: number[], label: string }
  const [target, setTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const requestDeleteOrder = (row) => {
    if (!canDelete) {
      toast.error("ليست لديك صلاحية حذف الطلب");
      return;
    }
    const id = row?.id;
    if (id == null || id === "") {
      toast.error("تعذر تحديد الطلب للحذف");
      return;
    }
    setTarget({ ids: [id], label: `الطلب رقم #${row?.uuid ?? id}` });
    openDialogAfterMenuClose(() => setDeleteDialogOpen(true));
  };

  const requestBulkDelete = (ids = []) => {
    if (!canDelete) {
      toast.error("ليست لديك صلاحية حذف الطلب");
      return;
    }
    const clean = Array.from(
      new Set((ids || []).filter((value) => value != null && value !== ""))
    );
    if (!clean.length) {
      toast.info("لم تحدد أي طلب للحذف");
      return;
    }
    setTarget({
      ids: clean,
      label: clean.length === 1 ? "الطلب المحدد" : `${clean.length} طلب محدد`,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    const ids = target?.ids ?? [];
    if (!ids.length) return;

    setIsDeletingOrder(true);
    const trashed = [];
    let failed = 0;
    let firstError = null;
    for (const id of ids) {
      try {
        await postOrderDelete(id, { force: Boolean(isAdmin && target?.force) });
        trashed.push(id);
      } catch (error) {
        failed += 1;
        // مثال: 422 «لا يمكن حذف طلب مدفوع» — نعرض سبب الخادم بدل رسالة عامة.
        if (!firstError) firstError = error?.response?.data?.message || null;
      }
    }
    invalidateOrdersCaches(queryClient, { queryKey });
    queryClient.invalidateQueries({ queryKey: ["orders-trash"] });

    setIsDeletingOrder(false);
    setDeleteDialogOpen(false);
    setTarget(null);

    const undo = async () => {
      let restored = 0;
      for (const id of trashed) {
        try {
          await restoreOrder(id);
          restored += 1;
        } catch {
          // يبقى في السلة
        }
      }
      invalidateOrdersCaches(queryClient, { queryKey });
      queryClient.invalidateQueries({ queryKey: ["orders-trash"] });
      if (restored) toast.success(restored > 1 ? `تمت استعادة ${restored} طلب` : "تمت استعادة الطلب");
      else toast.error("تعذرت الاستعادة — جرّب من «السلة»");
    };
    const undoAction = trashed.length ? { label: "تراجع", onClick: undo } : undefined;

    if (failed === 0) {
      toast.success(trashed.length > 1 ? `نُقل ${trashed.length} طلب إلى السلة` : "نُقل الطلب إلى السلة", {
        description: "يمكن استعادته خلال 30 يوماً من «السلة».",
        action: undoAction,
        duration: 10000,
      });
    } else if (trashed.length === 0) {
      toast.error(firstError || "تعذر نقل الطلبات إلى السلة، حاول مرة أخرى");
    } else {
      toast.error(
        `نُقل ${trashed.length} طلب إلى السلة، وتعذر نقل ${failed}${firstError ? ` — ${firstError}` : ""}`,
        { action: undoAction, duration: 10000 }
      );
    }
  };

  const setForce = (force) => setTarget((prev) => (prev ? { ...prev, force } : prev));

  return {
    canDelete,
    deleteLabel: target?.label ?? null,
    deleteCount: target?.ids?.length ?? 0,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeletingOrder,
    requestDeleteOrder,
    requestBulkDelete,
    confirmDeleteOrder,
    deleteForce: Boolean(target?.force),
    setDeleteForce: setForce,
    canForceDelete: Boolean(isAdmin),
  };
}
