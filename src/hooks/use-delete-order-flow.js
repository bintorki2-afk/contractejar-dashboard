"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close";
import { usePermissions } from "@/src/hooks/use-permissions";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";
import { postOrderDelete } from "@/src/lib/order-delete-api";

/**
 * Shared "delete order(s)" flow for the order list pages
 * (الطلبات المباشرة / جميع الطلبات).
 *
 * Supports a single-order delete (from the row menu) and a bulk delete
 * (from the selection bar). Deletion is destructive and irreversible, so:
 *  - it is limited to admins (canDelete),
 *  - it always goes through a confirmation dialog,
 *  - the backend removes each order together with its related rows.
 */
export function useDeleteOrderFlow({ queryKey } = {}) {
  const { isAdmin } = usePermissions();
  const canDelete = Boolean(isAdmin);
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
    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await postOrderDelete(id);
        deleted += 1;
      } catch {
        failed += 1;
      }
    }
    invalidateOrdersCaches(queryClient, { queryKey });

    setIsDeletingOrder(false);
    setDeleteDialogOpen(false);
    setTarget(null);

    if (failed === 0) {
      toast.success(ids.length > 1 ? `تم حذف ${deleted} طلب` : "تم حذف الطلب");
    } else if (deleted === 0) {
      toast.error("تعذر حذف الطلبات، حاول مرة أخرى");
    } else {
      toast.error(`تم حذف ${deleted} طلب، وتعذر حذف ${failed}`);
    }
  };

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
  };
}
