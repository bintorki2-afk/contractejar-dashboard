"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import Loader from "@/components/home/loader";

/**
 * د5: مصدر واحد للأسئلة الشائعة — الموقع يقرأ GET /common-questions (جدول questions) وهو نفس
 * /admin/faqs. محرّرها الوحيد صار «التسويق والمحتوى ← المحتوى ← الأسئلة الشائعة»؛ هذا المسار القديم يحوّل إليه.
 */
const FAQ_EDITOR_HREF = "/home/marketing-and-content?tab=content&view=faqs";

export default function FaqsRedirectPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  const router = useRouter();
  useEffect(() => {
    router.replace(FAQ_EDITOR_HREF);
  }, [router]);
  return <Loader />;
}
