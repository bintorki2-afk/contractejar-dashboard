import { axiosInstance } from "@/src/utils/axios";

/**
 * دفعة د (د12): الحذف = نقل إلى السلة (قابل للاستعادة 30 يوماً).
 * Backend: DELETE /api/admin/orders/{id} (والقديم POST …/delete بنفس السلوك).
 * الطلب المدفوع يحتاج مدير النظام + force=1 (وإلا 422).
 */
export function orderDeleteUrl(orderId) {
  return `/admin/orders/${orderId}/delete`;
}

export function postOrderDelete(orderId, { force = false } = {}) {
  if (orderId == null || orderId === "") {
    return Promise.reject(new Error("تعذر تحديد الطلب للحذف"));
  }
  return axiosInstance.delete(`/admin/orders/${orderId}`, { params: force ? { force: 1 } : undefined });
}

export function restoreOrder(orderId) {
  return axiosInstance.post(`/admin/orders/${orderId}/restore`);
}

export function fetchOrdersTrash({ page = 1, perPage = 20, search = "" } = {}) {
  const params = { page, per_page: perPage };
  if (search) params.search = search;
  return axiosInstance.get("/admin/orders/trash", { params }).then((res) => res?.data?.data ?? {});
}
