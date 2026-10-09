"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import TrashPage from "@/components/orders/trash-page";

export default function Page(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  return <TrashPage />;
}
