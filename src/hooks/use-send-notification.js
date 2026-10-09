"use client";

import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { toast } from "sonner";

/** نوع إشعار العميل اليدوي (ف8) — يُخزَّن في صندوق إشعارات العميل. */
export const CUSTOMER_NOTIFICATION_KINDS = [
  { value: "offer", label: "عرض" },
  { value: "announcement", label: "إعلان" },
];

export const NOTIFICATION_TARGETS = {
  user: {
    value: "user",
    label: "مستخدم محدد",
    endpoint: "/admin/notifications/user",
    isCustomer: true,
    needsUser: true,
    needsEmployee: false,
  },
  "custom-user": {
    value: "custom-user",
    label: "رسالة مخصصة لمستخدم",
    endpoint: "/admin/notifications/custom-user",
    isCustomer: true,
    needsUser: true,
    needsEmployee: false,
  },
  employee: {
    value: "employee",
    label: "موظف محدد",
    endpoint: "/admin/notifications/employee",
    needsUser: false,
    needsEmployee: true,
  },
  "all-users": {
    value: "all-users",
    label: "جميع المستخدمين",
    endpoint: "/admin/notifications/all-users",
    isCustomer: true,
    needsUser: false,
    needsEmployee: false,
  },
  "all-employees": {
    value: "all-employees",
    label: "جميع الموظفين",
    endpoint: "/admin/notifications/all-employees",
    needsUser: false,
    needsEmployee: false,
  },
};

function buildPayload(target, form) {
  const config = NOTIFICATION_TARGETS[target];
  if (!config) throw new Error("نوع الإشعار غير صالح");

  const payload = {
    title: form.title.trim(),
    body: form.body.trim(),
  };

  if (config.needsUser) {
    payload.user_id = Number(form.userId) || form.userId;
  }

  if (config.isCustomer) {
    payload.kind = form.kind || "offer";
    const url = String(form.url ?? "").trim();
    if (url) payload.url = url;
    // د24: كوبون اختياري + صلاحيته (يظهر للعميل مع زر نسخ في الموقع/التطبيق).
    const coupon = String(form.couponCode ?? "").trim();
    if (coupon) payload.coupon_code = coupon;
    if (form.validUntil) payload.valid_until = form.validUntil;
  }

  // د24: شريحة البث لـ «جميع المستخدمين»: all | has_active_contract | city (+ city_id).
  if (target === "all-users") {
    payload.segment = form.segment || "all";
    if (payload.segment === "city" && form.cityId) payload.city_id = Number(form.cityId) || form.cityId;
  }

  if (config.needsEmployee) {
    payload.employee_id = Number(form.employeeId) || form.employeeId;
  }

  return { endpoint: config.endpoint, payload };
}

export function useSendNotification({ onSuccess } = {}) {
  return useMutation({
    mutationFn: async ({ target, form }) => {
      const { endpoint, payload } = buildPayload(target, form);
      const res = await axiosInstance.post(endpoint, payload);
      return res?.data;
    },
    onSuccess: (res) => {
      toast.success(res?.message || "تم إرسال الإشعار بنجاح");
      onSuccess?.(res);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "فشل إرسال الإشعار");
    },
  });
}

export const BROADCAST_SEGMENTS = [
  { value: "all", label: "كل العملاء" },
  { value: "has_active_contract", label: "عملاء لديهم عقد مدفوع نشط" },
  { value: "city", label: "عملاء مدينة محددة" },
];

/** POST /admin/notifications/broadcast/preview — عدد المستلمين + شكل الإشعار. */
export async function previewBroadcast(form) {
  const body = {
    segment: form.segment || "all",
    title: form.title || undefined,
    body: form.body || undefined,
    kind: form.kind || "offer",
    coupon_code: form.couponCode || undefined,
    valid_until: form.validUntil || undefined,
  };
  if (body.segment === "city" && form.cityId) body.city_id = Number(form.cityId) || form.cityId;
  const res = await axiosInstance.post("/admin/notifications/broadcast/preview", body);
  return res?.data?.data ?? null;
}

export { buildPayload as buildNotificationPayload };
