"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SectionHeading,
  SettingsContentCard,
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsPagination,
  SettingsTable,
  SettingsTd,
  SettingsTableRow,
} from "@/components/system-settings/shared";
import { settingsFieldClass } from "@/components/system-settings/settings-form-dialog";
import { cn } from "@/lib/utils";
import { useNotificationDispatches } from "@/src/hooks/use-notification-dispatches";

const ALL_KINDS = "__all__";
const HEADERS = ["النوع", "العنوان", "المستلم", "رقم الطلب", "الرابط", "وقت الإرسال"];

function recipientLabel(row) {
  if (row.is_broadcast) {
    return row.recipients_count ? `جميع العملاء (${row.recipients_count})` : "جميع العملاء";
  }
  if (!row.user) return "—";
  return [row.user.name, row.user.mobile].filter(Boolean).join(" — ");
}

/** سجل إرسال إشعارات العملاء (ف8): الفورية والمجدولة واليدوية — يمنع الخادم تكرار نفس النوع لنفس الطلب. */
export default function NotificationDispatchLog() {
  const [kind, setKind] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const { items, kinds, lastRun, lastPage, total, isLoading, isFetching, isError, refetch } =
    useNotificationDispatches({ kind, date, page });

  return (
    <SettingsContentCard className="flex flex-col gap-4">
      <SectionHeading
        title="سجل الإرسال"
        description={
          lastRun?.at
            ? `آخر تشغيل للإشعارات المجدولة: ${new Date(lastRun.at).toLocaleString("ar-SA-u-nu-latn", {
                timeZone: "Asia/Riyadh",
                dateStyle: "medium",
                timeStyle: "short",
              })}${lastRun.dry_run ? " (معاينة فقط)" : ""}`
            : "كل إشعار أُرسل لعميل — فوري أو مجدول أو يدوي"
        }
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="mk-mini inline-flex items-center gap-1.5"
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            تحديث
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          dir="rtl"
          value={kind || ALL_KINDS}
          onValueChange={(value) => {
            setKind(value === ALL_KINDS ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className={cn(settingsFieldClass, "w-[220px]")}>
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value={ALL_KINDS}>كل الأنواع</SelectItem>
            {kinds.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className={cn(settingsFieldClass, "w-[180px]")}
          aria-label="تاريخ الإرسال"
        />
        {date ? (
          <button type="button" className="mk-mini" onClick={() => setDate("")}>
            مسح التاريخ
          </button>
        ) : null}
        <span className="text-[12px] font-bold text-[#8a978f] dark:text-white/45">
          الإجمالي: {total}
        </span>
      </div>

      <SettingsTable headers={HEADERS} minWidth="860px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={HEADERS.length} rows={5} />
        ) : isError ? (
          <SettingsEmptyRow colSpan={HEADERS.length} message="تعذر تحميل سجل الإرسال" />
        ) : items.length === 0 ? (
          <SettingsEmptyRow colSpan={HEADERS.length} message="لا توجد إشعارات مرسلة بهذه المعايير" />
        ) : (
          items.map((row) => (
            <SettingsTableRow key={row.id}>
              <SettingsTd className="whitespace-nowrap font-bold">{row.kind_label || row.kind}</SettingsTd>
              <SettingsTd>
                <div className="max-w-[260px]">
                  <p className="font-bold truncate">{row.title || "—"}</p>
                  {row.body ? (
                    <p className="text-[11px] text-[#8a978f] dark:text-white/45 line-clamp-2">{row.body}</p>
                  ) : null}
                </div>
              </SettingsTd>
              <SettingsTd className="whitespace-nowrap">{recipientLabel(row)}</SettingsTd>
              <SettingsTd className="tabular-nums">{row.order_number ? `#${row.order_number}` : "—"}</SettingsTd>
              <SettingsTd>
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="text-[#0E5F4E] underline truncate inline-block max-w-[180px]"
                  >
                    {row.url}
                  </a>
                ) : (
                  "—"
                )}
              </SettingsTd>
              <SettingsTd className="whitespace-nowrap tabular-nums" dir="ltr">
                {row.sent_at || row.created_at || "—"}
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>

      <SettingsPagination page={page} lastPage={lastPage} onPageChange={setPage} />
    </SettingsContentCard>
  );
}
