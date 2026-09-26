import { axiosInstance } from "@/src/utils/axios";

/** Backend: POST /api/admin/orders/{id}/delete — removes the order and its related rows. */
export function orderDeleteUrl(orderId) {
  return `/admin/orders/${orderId}/delete`;
}

export function postOrderDelete(orderId) {
  if (orderId == null || orderId === "") {
    return Promise.reject(new Error("تعذر تحديد الطلب للحذف"));
  }

  return axiosInstance.post(orderDeleteUrl(orderId));
}
