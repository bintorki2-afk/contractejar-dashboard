"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import LessorChangeWrapper from "@/components/lessor-change/lessor-change-wrapper";

export default function LessorChangePage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  return (
    <div className="flex flex-col gap-4 min-h-full" dir="rtl">
      <LessorChangeWrapper />
    </div>
  );
}
