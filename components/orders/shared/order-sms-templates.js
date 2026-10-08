"use client";

/**
 * Order SMS / WhatsApp copy templates used in the order details actions menu
 * and the SMS compose dialog.
 */

import { buildOrderSmartLink } from "@/src/lib/customer-site";

/**
 * رابط الطلب للعميل على موقع «عقد إيجار» (يتضمن «ادفع الآن» إن لم يُدفع).
 * كان سابقاً يشير خطأً إلى aqdi.sa (موقع آخر منفصل).
 */
export function buildOrderPaymentUrl(uuid) {
  return buildOrderSmartLink(uuid);
}

export function getOrderSmsTemplates(uuid) {
  const id = String(uuid ?? "").trim() || "—";
  const payUrl = buildOrderPaymentUrl(id);

  return [
    {
      id: "pay_reminder",
      label: "تذكير بسداد رسوم التوثيق",
      body: `مرحبًا، نذكركم بسداد رسوم توثيق العقد رقم ${id} لإتمام التوثيق في إيجار. رابط الدفع: ${payUrl}`,
    },
    {
      id: "missing_doc",
      label: "طلب إرفاق مستند ناقص",
      body: `مرحبًا، لإكمال طلبكم رقم ${id} نحتاج إرفاق المستند الناقص. يمكنكم الرفع من نفس رابط الطلب.`,
    },
    {
      id: "draft_ready",
      label: "مسودة العقد جاهزة للمراجعة",
      body: `مرحبًا، مسودة عقدكم رقم ${id} جاهزة وأرسلناها لكم عبر واتساب للاطلاع عليها. لن نوثّق العقد في إيجار إلا بعد اطلاعكم على المسودة.`,
    },
  ];
}
