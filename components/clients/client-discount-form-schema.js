import * as z from "zod";
import { DISCOUNT_TYPES } from "@/src/lib/client-discount";

export const DEFAULT_DISCOUNT_FORM_VALUES = {
  type: DISCOUNT_TYPES.PERCENTAGE,
  value: "",
  appliesTo: "all",
  expiresAt: "",
  reason: "",
  notifyOnLogin: false,
  notificationMessage: "",
};

export const discountFormSchema = z
  .object({
    type: z.enum([DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FIXED]),
    value: z
      .string()
      .min(1, "القيمة مطلوبة")
      .refine((v) => Number(v) > 0, "القيمة يجب أن تكون أكبر من صفر"),
    appliesTo: z.enum(["all", "housing", "commercial"]),
    expiresAt: z.string().optional(),
    reason: z.string().trim().min(2, "السبب مطلوب"),
    notifyOnLogin: z.boolean(),
    notificationMessage: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.notifyOnLogin && !data.notificationMessage?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "نص الرسالة مطلوب عند تفعيل إشعار العميل",
        path: ["notificationMessage"],
      });
    }
  });
