"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";

export const MESSAGE_TEMPLATES_API = "/admin/message-templates";
export const MESSAGE_TEMPLATES_QUERY_KEY = "message-templates";

/** القائمة + الرموز المتاحة + القنوات (GET /admin/message-templates). */
export function useMessageTemplates() {
  return useQuery({
    queryKey: [MESSAGE_TEMPLATES_QUERY_KEY],
    queryFn: async () => (await axiosInstance.get(MESSAGE_TEMPLATES_API))?.data?.data ?? {},
  });
}

function firstError(err, fallback) {
  const data = err?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return data?.message || fallback;
}

export function useSaveMessageTemplate({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const url = id ? `${MESSAGE_TEMPLATES_API}/${id}` : MESSAGE_TEMPLATES_API;
      return (await axiosInstance.post(url, body))?.data;
    },
    onSuccess: (res, vars) => {
      toast.success(vars.id ? "تم حفظ القالب" : "تمت إضافة القالب");
      queryClient.invalidateQueries({ queryKey: [MESSAGE_TEMPLATES_QUERY_KEY] });
      onSuccess?.(res, vars);
    },
    onError: (err) => toast.error(firstError(err, "تعذر حفظ القالب")),
  });
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.post(`${MESSAGE_TEMPLATES_API}/${id}/delete`),
    onSuccess: () => {
      toast.success("تم حذف القالب");
      queryClient.invalidateQueries({ queryKey: [MESSAGE_TEMPLATES_QUERY_KEY] });
    },
    onError: (err) => toast.error(firstError(err, "تعذر حذف القالب")),
  });
}

export async function previewMessageTemplate({ body, title }) {
  return (await axiosInstance.post(`${MESSAGE_TEMPLATES_API}/preview`, { body, title }))?.data?.data ?? null;
}

/**
 * معاينة محلية فورية (احتياط/بلا انتظار) — نفس منطق الخادم: استبدال {token} بالقيمة.
 * الرمز غير المعروف يبقى كما هو ليظهر للموظف.
 */
export function renderTemplateLocally(text, vars = {}) {
  return String(text ?? "").replace(/\{([a-z_]+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
}

/** الرموز غير المعروفة في نص القالب (لتحذير الموظف). */
export function unknownPlaceholders(text, placeholders = []) {
  const known = new Set(placeholders.map((p) => String(p.token ?? p).replace(/[{}]/g, "")));
  const found = [...String(text ?? "").matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]);
  return [...new Set(found.filter((k) => !known.has(k)))];
}

export const SAMPLE_TEMPLATE_VARS = {
  order: "123456",
  name: "محمد",
  link: "https://contractejar.com/r/123456",
  amount: "249",
  draft_number: "0012345678",
  support: "0597500014",
};
