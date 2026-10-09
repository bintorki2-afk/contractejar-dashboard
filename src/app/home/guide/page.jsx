"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import EmployeeGuide from "@/components/guide/employee-guide";

export default function Page(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  return <EmployeeGuide />;
}
