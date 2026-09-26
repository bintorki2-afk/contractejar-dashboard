"use client";

import Link from "next/link";
import { AlignJustify, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Loader from "@/components/home/loader";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/src/utils/axios";
import {
  extractGeneralSettings,
  GENERAL_SETTINGS_API,
  GENERAL_SETTINGS_FIELDS,
  GENERAL_SETTINGS_QUERY_KEY,
  patchGeneralSettingsCache,
} from "@/src/lib/general-settings";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { SYSTEM_CATEGORIES } from "./mock-data";

// أيقونات غير مفعّلة لعقد إيجار (خاصة بالتطبيق/الدفع أو غير موصولة بالموقع بعد) → تعرض «قريبًا» ومعطّلة.
const COMING_SOON_CARDS = new Set([
  "property-types",
  "property-usage",
  "message-sections",
  "message-section-items",
  "customer-app-messages",
  "message-for-employee",
  "message-for-property",
  "blogs",
  "notifications",
  "payments",
]);
import "./settings-design.css";

function SiteSwitch({ checked, disabled, onCheckedChange }) {
  return (
    <label className="mkt-switch" style={{ marginInline: "auto" }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      <span />
    </label>
  );
}

export default function GeneralSettingsTab() {
  const queryClient = useQueryClient();
  const { can, isReady } = usePermissions();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [GENERAL_SETTINGS_QUERY_KEY],
    queryFn: () => axiosInstance.get(GENERAL_SETTINGS_API).then((res) => res?.data),
  });

  const toggles = extractGeneralSettings(data);

  const visibleCategories = isReady
    ? SYSTEM_CATEGORIES.filter((category) =>
        can(category.section ?? PERMISSION_SECTIONS.settings, "view")
      )
    : [];

  const { mutate, isPending, variables } = useMutation({
    mutationFn: ({ key, value }) =>
      axiosInstance
        .put(`${GENERAL_SETTINGS_API}/${key}`, { enabled: value })
        .then((res) => res?.data),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: [GENERAL_SETTINGS_QUERY_KEY] });
      const previous = queryClient.getQueryData([GENERAL_SETTINGS_QUERY_KEY]);
      queryClient.setQueryData([GENERAL_SETTINGS_QUERY_KEY], (current) =>
        patchGeneralSettingsCache(current, key, value)
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData([GENERAL_SETTINGS_QUERY_KEY], context.previous);
      }
      toast.error(
        err?.response?.data?.message || err?.message || "تعذر حفظ الإعداد"
      );
    },
    onSuccess: (response) => {
      toast.success(response?.message || "تم حفظ الإعداد بنجاح");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [GENERAL_SETTINGS_QUERY_KEY] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#FECACA] bg-[#FFF5F5] p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
        <p className="text-[15px] font-bold text-[#B91C1C] dark:text-red-300">تعذر تحميل الإعدادات العامة</p>
        <p className="mt-2 text-[13px] text-[#991B1B] dark:text-red-200/80">
          {error?.response?.data?.message || error?.message || "تأكد من توفر الـ API ثم أعد المحاولة"}
        </p>
      </div>
    );
  }

  return (
    <div className="set-page flex flex-col gap-6">
      <section>
        <div className="cpf-sec-t">إعدادات الموقع والتطبيق</div>
        <div className="set-sitegrid">
          {GENERAL_SETTINGS_FIELDS.map((item) => {
            const enabled = toggles[item.key];
            const isSaving = isPending && variables?.key === item.key;
            return (
              <div key={item.key} className="set-sitecard">
                <span className={cn("set-sitedot", enabled && "on")} />
                <div className="set-sitename">{item.label}</div>
                <div className={cn("set-sitestat", !enabled && "off")}>
                  {enabled ? "مُفعّل" : "مُعطّل"}
                </div>
                {isSaving ? (
                  <Loader2 className="mx-auto size-4 animate-spin text-[#0B7A4C]" />
                ) : (
                  <SiteSwitch
                    checked={enabled}
                    disabled={isPending}
                    onCheckedChange={(checked) => mutate({ key: item.key, value: checked })}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="cpf-sec-t">
          إعدادات النظام <span className="asg">({visibleCategories.length} فئة)</span>
        </div>
        <div className="set-catgrid">
          {visibleCategories.map((category) => {
            if (COMING_SOON_CARDS.has(category.id)) {
              return (
                <div
                  key={category.id}
                  className="set-catcard cursor-not-allowed opacity-60"
                  aria-disabled="true"
                  title="قريبًا"
                >
                  <span className="set-caticon">
                    <AlignJustify className="size-4" />
                  </span>
                  <span className="set-cattext">
                    <b>
                      {category.label}
                      <span className="mr-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                        قريبًا
                      </span>
                    </b>
                    <small>{category.subtitle}</small>
                  </span>
                </div>
              );
            }
            return (
              <Link key={category.id} href={category.href} className="set-catcard">
                <span className="set-caticon">
                  <AlignJustify className="size-4" />
                </span>
                <span className="set-cattext">
                  <b>{category.label}</b>
                  <small>{category.subtitle}</small>
                </span>
                <span className="set-catarrow">←</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
