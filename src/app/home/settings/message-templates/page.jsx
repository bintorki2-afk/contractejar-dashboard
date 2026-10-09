"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import MessageTemplatesPage from "@/components/system-settings/message-templates-page";

export default function Page(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  return <MessageTemplatesPage />;
}
