"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { normalizeAdminSearch } from "@/src/lib/search-term";

/**
 * طلبات تغيير المؤجر (لوحة التحكم).
 *
 * - `GET  /admin/lessor-change?status=&search=&page=&per_page=` → `{ items, meta, statuses, counts }`
 * - `GET  /admin/lessor-change/{id}` → الطلب مع روابط الصور الموقّعة
 * - `POST /admin/lessor-change/{id}/status { status, status_note }`
 * - `POST /admin/lessor-change/{id}/delete`
 */
export const LESSOR_CHANGE_API = "/admin/lessor-change";
export const LESSOR_CHANGE_LIST_KEY = "lessor-change-requests";
export const LESSOR_CHANGE_ITEM_KEY = "lessor-change-request";

/** ألوان الحالات الافتراضية (الخادم يرسل `color` لكل حالة؛ هذه للاحتياط فقط). */
export const LESSOR_CHANGE_STATUS_FALLBACK = [
  { value: "pending_payment", label: "بانتظار الدفع", color: "#D97706" },
  { value: "paid", label: "تم الدفع — بانتظار المعالجة", color: "#2563EB" },
  { value: "in_progress", label: "قيد التنفيذ", color: "#7C3AED" },
  { value: "completed", label: "مكتمل", color: "#16A34A" },
  { value: "rejected", label: "مرفوض", color: "#DC2626" },
  { value: "cancelled", label: "ملغي", color: "#6B7280" },
];

export const PLATFORM_LABELS = {
  web: "الموقع",
  app: "التطبيق",
  ios: "iOS",
  android: "Android",
};

function unwrapData(response) {
  const body = response?.data ?? response;
  return body?.data ?? body;
}

export function normalizeLessorChangeList(response) {
  const payload = unwrapData(response);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const meta = payload?.meta ?? {};
  const statuses =
    Array.isArray(payload?.statuses) && payload.statuses.length > 0
      ? payload.statuses
      : LESSOR_CHANGE_STATUS_FALLBACK;
  const rawCounts = payload?.counts;
  const counts =
    rawCounts && typeof rawCounts === "object" && !Array.isArray(rawCounts) ? rawCounts : {};

  return {
    items,
    statuses,
    counts,
    meta: {
      currentPage: Number(meta.current_page) || 1,
      lastPage: Number(meta.last_page) || 1,
      perPage: Number(meta.per_page) || items.length,
      total: Number(meta.total) || items.length,
    },
  };
}

export function useLessorChangeList({ page = 1, perPage = 20, status = "", search = "" } = {}) {
  const params = { page, per_page: perPage };
  if (status) params.status = status;
  const term = normalizeAdminSearch(search);
  if (term) params.search = term;

  const query = useQuery({
    queryKey: [LESSOR_CHANGE_LIST_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get(LESSOR_CHANGE_API, { params });
      return normalizeLessorChangeList(res);
    },
    placeholderData: keepPreviousData,
  });

  const data = query.data ?? normalizeLessorChangeList(null);

  return {
    ...query,
    items: data.items,
    statuses: data.statuses,
    counts: data.counts,
    meta: data.meta,
  };
}

export function useLessorChangeRequest(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: [LESSOR_CHANGE_ITEM_KEY, id],
    queryFn: async () => {
      const res = await axiosInstance.get(`${LESSOR_CHANGE_API}/${id}`);
      return unwrapData(res);
    },
    enabled: enabled && id != null && id !== "",
  });
}

export function useUpdateLessorChangeStatus(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ status, status_note }) =>
      axiosInstance
        .post(`${LESSOR_CHANGE_API}/${id}/status`, { status, status_note: status_note ?? "" })
        .then((res) => res?.data),
    onSuccess: (response) => {
      toast.success(response?.message || "تم تحديث حالة الطلب");
      const updated = response?.data;
      if (updated && typeof updated === "object") {
        queryClient.setQueryData([LESSOR_CHANGE_ITEM_KEY, id], updated);
      }
      queryClient.invalidateQueries({ queryKey: [LESSOR_CHANGE_ITEM_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [LESSOR_CHANGE_LIST_KEY] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "تعذر تحديث حالة الطلب");
    },
  });
}

export function useDeleteLessorChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    // د12: الحذف ينقل إلى السلة (30 يوماً) مع «تراجع».
    mutationFn: (id) => axiosInstance.delete(`${LESSOR_CHANGE_API}/${id}`).then((res) => res?.data),
    onSuccess: (_response, id) => {
      queryClient.invalidateQueries({ queryKey: [LESSOR_CHANGE_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: ["lessor-change-trash"] });
      toast.success("نُقل الطلب إلى السلة", {
        description: "يمكن استعادته خلال 30 يوماً من «السلة».",
        duration: 10000,
        action: {
          label: "تراجع",
          onClick: async () => {
            try {
              await axiosInstance.post(`${LESSOR_CHANGE_API}/${id}/restore`);
              queryClient.invalidateQueries({ queryKey: [LESSOR_CHANGE_LIST_KEY] });
              queryClient.invalidateQueries({ queryKey: ["lessor-change-trash"] });
              toast.success("تمت استعادة الطلب");
            } catch (e) {
              toast.error(e?.response?.data?.message || "تعذرت الاستعادة");
            }
          },
        },
      });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "تعذر حذف الطلب");
    },
  });
}
