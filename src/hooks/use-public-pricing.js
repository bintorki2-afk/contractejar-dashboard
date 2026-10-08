"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";

/**
 * الأسعار الرسمية من الخادم (`GET /api/v2/pricing` — نفس مصدر الموقع والتطبيق).
 * عامة (بدون صلاحية) حتى تعمل لموظف المحتوى الذي لا يملك صلاحية الإعدادات.
 */
export function usePublicPricing() {
  return useQuery({
    queryKey: ["public-pricing"],
    queryFn: async () => {
      const res = await axiosInstance.get("/v2/pricing");
      return res?.data?.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** سعر السنة الأولى لبطاقة الأسعار حسب ترتيبها في الموقع (0 = سكني، 1 = تجاري). */
export function firstYearPriceForCard(pricing, cardIndex) {
  const key = cardIndex === 0 ? "housing" : cardIndex === 1 ? "commercial" : null;
  const value = key ? pricing?.[key]?.first_year : null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
