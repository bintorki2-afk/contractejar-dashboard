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
