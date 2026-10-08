"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import PermissionGate from "@/components/auth/permission-gate";
import ContentPageSeoPanel from "@/components/content/content-page-seo-panel";
import { useMarketingArticles } from "@/src/hooks/use-marketing-content";
import SectionCard from "../shared/section-card";
import { StatCardRow } from "../shared/stat-card";
import { StatusPill } from "../shared/badges";
import {
  PeriodFilterBar,
  TrackingState,
  fmtInt,
  fmtMoney,
} from "../shared/tracking-ui";

export default function ArticlesView() {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("");

  const {
    summary,
    categories,
    items,
    editorialQueue,
    periods,
    currencyLabel,
    isLoading,
    error,
    refetch,
  } = useMarketingArticles({ category, status });

  const cards = [
    { value: fmtInt(summary?.total ?? 0), label: "إجمالي المقالات", tone: "b" },
    { value: fmtInt(summary?.published ?? 0), label: "منشورة", tone: "g" },
    { value: fmtInt(summary?.scheduled ?? 0), label: "مجدولة", tone: "y" },
    { value: fmtInt(summary?.archived ?? 0), label: "مؤرشفة" },
    { value: fmtInt(summary?.views ?? 0), label: "مشاهدات" },
    {
      value: fmtMoney(summary?.attributed_revenue ?? 0, currencyLabel),
      label: "إيراد مُسنَد",
      tone: "g",
    },
  ];

  const catOptions = categories.length
    ? categories
    : [{ key: "all", label_ar: "الكل" }];

  return (
    <>
      <ContentPageSeoPanel
        pageKey="blogs"
        pageLabel="صفحة قائمة المقالات"
        permissionSection={PERMISSION_SECTIONS.blogs}
      />

      <PeriodFilterBar periods={periods} />

      <StatCardRow items={cards} />

      <div className="mkt-blogbar">
        <div className="mkt-cats">
          {catOptions.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn("mkt-catb", category === c.key && "on")}
            >
              {c.label_ar}
            </button>
          ))}
        </div>
        <div className="mkt-syncright">
          <select
            className="mk-mini"
            dir="rtl"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="scheduled">مجدول</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>
          <PermissionGate section={PERMISSION_SECTIONS.blogs} action="create">
            <Link href="/home/settings/blogs/create" className="xbtn">
              + مقال جديد
            </Link>
          </PermissionGate>
        </div>
      </div>

      <TrackingState
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && items.length === 0}
        onRetry={refetch}
        emptyText="لا توجد مقالات مطابقة."
      >
        <div className="tblwrap">
          <table className="mkt-tbl">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>عنوان الميتا</th>
                <th>التصنيف</th>
                <th>الكاتب</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>كلمات</th>
                <th>مشاهدات</th>
                <th>العملاء المحتملون</th>
                <th>إيراد</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="mkt-title">{row.title}</td>
                  <td
                    className="max-w-[160px] truncate"
                    title={row.meta_title || ""}
                  >
                    {row.meta_title || "—"}
                  </td>
                  <td>
                    {row.category_label_ar ? (
                      <span className="mkt-cat">{row.category_label_ar}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{row.author || "—"}</td>
                  <td>
                    <StatusPill status={row.status_label_ar || row.status} />
                  </td>
                  <td>{row.published_at || row.scheduled_at || "–"}</td>
                  <td>{fmtInt(row.words)}</td>
                  <td>{fmtInt(row.views)}</td>
                  <td>{fmtInt(row.leads)}</td>
                  <td>{fmtMoney(row.attributed_revenue, currencyLabel)}</td>
                  <td>
                    <PermissionGate
                      section={PERMISSION_SECTIONS.blogs}
                      action="edit"
                    >
                      <Link
                        href={`/home/settings/blogs/${row.id}/edit`}
                        className="mk-mini"
                      >
                        تحرير
                      </Link>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TrackingState>

      {editorialQueue.length > 0 ? (
        <SectionCard title="التقويم التحريري — قيد الإعداد" className="mt-[14px]">
          <div className="mkt-cal">
            {editorialQueue.map((item) => (
              <div key={item.id} className="mkt-calcard">
                <div className="mkt-caldate">
                  {item.scheduled_at || "غير مجدول"}
                </div>
                <div className="mkt-caltitle">{item.title}</div>
                <div>
                  <StatusPill status={item.status_label_ar || item.status} />{" "}
                  {item.category_label_ar ? (
                    <span className="mkt-cat">{item.category_label_ar}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
