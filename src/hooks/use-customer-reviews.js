"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import {
  CUSTOMER_REVIEWS_API,
  CUSTOMER_REVIEWS_QUERY_KEY,
  CUSTOMER_REVIEWS_SETTINGS_API,
  CUSTOMER_REVIEWS_SETTINGS_QUERY_KEY,
  buildReviewPayload,
  extractCustomerReviews,
  extractReviewsSettings,
} from "@/src/lib/customer-reviews";

const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

/** GET /admin/customer-reviews?search=&visible= — customer_reviews.view */
export function useCustomerReviews({ search = "", visible = "" } = {}) {
  const params = {};
  if (search) params.search = search;
  if (visible === "1" || visible === "0") params.visible = visible;
  const query = useQuery({
    queryKey: [CUSTOMER_REVIEWS_QUERY_KEY, params],
    queryFn: () => axiosInstance.get(CUSTOMER_REVIEWS_API, { params }).then((res) => res?.data),
    placeholderData: keepPreviousData,
    retry: (count, err) => err?.response?.status !== 403 && count < 1,
  });
  return { ...query, ...extractCustomerReviews(query.data) };
}

/** GET /admin/customer-reviews/settings */
export function useCustomerReviewsSettings() {
  const query = useQuery({
    queryKey: [CUSTOMER_REVIEWS_SETTINGS_QUERY_KEY],
    queryFn: () => axiosInstance.get(CUSTOMER_REVIEWS_SETTINGS_API).then((res) => res?.data),
    retry: (count, err) => err?.response?.status !== 403 && count < 1,
  });
  return { ...query, settings: query.data ? extractReviewsSettings(query.data) : null };
}

function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [CUSTOMER_REVIEWS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [CUSTOMER_REVIEWS_SETTINGS_QUERY_KEY] });
  };
}

/** POST /admin/customer-reviews/settings {reviews_enabled?, reviews_average?, reviews_count?} */
export function useSaveCustomerReviewsSettings() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (values) => axiosInstance.post(CUSTOMER_REVIEWS_SETTINGS_API, values).then((res) => res?.data),
    onSuccess: (res) => {
      toast.success(res?.message || "تم حفظ إعدادات التقييمات — تظهر في الموقع والتطبيق خلال دقائق");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "تعذر حفظ إعدادات التقييمات")),
  });
}

/** إضافة (بلا id) أو تعديل (مع id): POST /admin/customer-reviews[/{id}] */
export function useSaveCustomerReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ id, values }) =>
      axiosInstance
        .post(id ? `${CUSTOMER_REVIEWS_API}/${id}` : CUSTOMER_REVIEWS_API, buildReviewPayload(values))
        .then((res) => res?.data),
    onSuccess: (res, { id }) => {
      toast.success(res?.message || (id ? "تم تعديل التقييم" : "تمت إضافة التقييم"));
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "تعذر حفظ التقييم")),
  });
}

/** إظهار/إخفاء سريع: POST /admin/customer-reviews/{id} {is_visible} */
export function useToggleCustomerReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ id, is_visible }) =>
      axiosInstance.post(`${CUSTOMER_REVIEWS_API}/${id}`, { is_visible }).then((res) => res?.data),
    onSuccess: (_res, { is_visible }) => {
      toast.success(is_visible ? "صار التقييم ظاهراً في الموقع والتطبيق" : "أُخفي التقييم من الموقع والتطبيق");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "تعذر تغيير ظهور التقييم")),
  });
}

/** POST /admin/customer-reviews/{id}/delete */
export function useDeleteCustomerReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (id) => axiosInstance.post(`${CUSTOMER_REVIEWS_API}/${id}/delete`).then((res) => res?.data),
    onSuccess: (res) => {
      toast.success(res?.message || "تم حذف التقييم");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "تعذر حذف التقييم")),
  });
}

/** POST /admin/customer-reviews/reorder {ids:[…]} */
export function useReorderCustomerReviews() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (ids) => axiosInstance.post(`${CUSTOMER_REVIEWS_API}/reorder`, { ids }).then((res) => res?.data),
    onSuccess: () => invalidate(),
    onError: (err) => {
      toast.error(errMsg(err, "تعذر حفظ الترتيب"));
      invalidate();
    },
  });
}
