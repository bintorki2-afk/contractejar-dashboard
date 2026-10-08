"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import { useState } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import ContentPageSeoPanel from "@/components/content/content-page-seo-panel";
import {
  useServicePageMutations,
  useServicePages,
} from "@/src/hooks/use-marketing-content";
import SectionCard from "../shared/section-card";
import { StatCardRow } from "../shared/stat-card";
import { StatusPill } from "../shared/badges";
import { TrackingState, fmtInt } from "../shared/tracking-ui";

const PAGE_STATUS_OPTIONS = [
  { value: "published", label: "منشور" },
  { value: "draft", label: "مسودة" },
  { value: "archived", label: "مؤرشف" },
];

const EMPTY_FORM = {
  title: "",
  path: "",
  target_keyword: "",
  meta_title: "",
  meta_description: "",
  status: "draft",
};

export default function ServicePagesView() {
  const confirm = useConfirm();
  const { can } = usePermissions();
  const canCreate = can(PERMISSION_SECTIONS.analytics, "create");
  const canEdit = can(PERMISSION_SECTIONS.analytics, "edit");
  const canDelete = can(PERMISSION_SECTIONS.analytics, "delete");

  const { summary, items, isLoading, error, refetch } = useServicePages();
  const { create, update, remove } = useServicePageMutations();

  const [form, setForm] = useState(null); // null | {id?, ...fields}

  const cards = [
    { value: fmtInt(summary?.total ?? 0), label: "إجمالي الصفحات", tone: "b" },
    { value: fmtInt(summary?.published ?? 0), label: "منشورة", tone: "g" },
    { value: fmtInt(summary?.drafts ?? 0), label: "مسودات", tone: "y" },
  ];

  const submit = (e) => {
    e.preventDefault();
    const body = {
      title: form.title.trim(),
      path: form.path.trim(),
      target_keyword: form.target_keyword.trim(),
      meta_title: (form.meta_title || "").trim(),
      meta_description: (form.meta_description || "").trim(),
      status: form.status,
    };
    if (!body.title || !body.path) return;
    const mutation = form.id ? update : create;
    const payload = form.id ? { id: form.id, ...body } : body;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(form.id ? "تم تحديث الصفحة" : "تمت إضافة الصفحة");
        setForm(null);
      },
      onError: (err) =>
        toast.error(err?.response?.data?.message || "تعذّر حفظ الصفحة"),
    });
  };

  const handleDelete = async (row) => {
    const ok = await confirm({ title: "حذف الصفحة", description: `حذف «${row.title}»؟`, confirmLabel: "حذف", destructive: true });
    if (!ok) return;
    remove.mutate(row.id, {
      onSuccess: () => toast.success("تم حذف الصفحة"),
      onError: (err) =>
        toast.error(err?.response?.data?.message || "تعذّر الحذف"),
    });
  };

  return (
    <>
      <ContentPageSeoPanel
        pageKey="services"
        pageLabel="صفحة قائمة الخدمات"
        permissionSection={PERMISSION_SECTIONS.analytics}
      />

      <StatCardRow items={cards} />

      <SectionCard
        title="صفحات الخدمات والصفحات الثابتة للموقع"
        className="mt-3"
        action={
          canCreate ? (
            <button
              type="button"
              className="xbtn"
              onClick={() =>
                setForm((prev) =>
                  prev && !prev.id ? null : { ...EMPTY_FORM }
                )
              }
            >
              {form && !form.id ? "إغلاق" : "+ صفحة جديدة"}
            </button>
          ) : null
        }
      >
        {form ? (
          <form
            onSubmit={submit}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: 10,
              alignItems: "end",
              marginBottom: 14,
              padding: 12,
              background: "#f7fbf9",
              borderRadius: 12,
            }}
          >
            <FormField label="العنوان">
              <input
                className="mk-mini"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </FormField>
            <FormField label="الرابط (path)">
              <input
                className="mk-mini"
                dir="ltr"
                value={form.path}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, path: e.target.value }))
                }
                placeholder="/residential"
                required
              />
            </FormField>
            <FormField label="الكلمة المستهدفة">
              <input
                className="mk-mini"
                value={form.target_keyword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target_keyword: e.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="الحالة">
              <select
                className="mk-mini"
                dir="rtl"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {PAGE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 10,
                paddingTop: 4,
                borderTop: "1px dashed #d7e4de",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#0b5f4c",
                  margin: 0,
                }}
              >
                تحسين محركات البحث (SEO)
              </p>
              <FormField label="عنوان الميتا">
                <input
                  className="mk-mini"
                  style={{ width: "100%" }}
                  value={form.meta_title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      meta_title: e.target.value,
                    }))
                  }
                  placeholder="عنوان يظهر في نتائج البحث (~60 حرفًا)"
                />
              </FormField>
              <FormField label="وصف الميتا">
                <textarea
                  className="mk-mini"
                  style={{
                    width: "100%",
                    minHeight: 72,
                    height: "auto",
                    paddingTop: 10,
                    paddingBottom: 10,
                    resize: "vertical",
                  }}
                  value={form.meta_description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  placeholder="وصف مختصر يظهر تحت العنوان في نتائج البحث (~160 حرفًا)"
                />
              </FormField>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                className="xbtn"
                disabled={create.isPending || update.isPending}
              >
                {form.id ? "حفظ" : "إضافة"}
              </button>
              <button
                type="button"
                className="mk-mini"
                onClick={() => setForm(null)}
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : null}

        <TrackingState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && items.length === 0 && !form}
          onRetry={refetch}
          emptyText="لا توجد صفحات خدمات بعد."
        >
          {items.length ? (
            <div className="tblwrap">
              <table className="mkt-tbl">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>الرابط</th>
                    <th>الكلمة المستهدفة</th>
                    <th>عنوان الميتا</th>
                    <th>الحالة</th>
                    <th>آخر تحديث</th>
                    {(canEdit || canDelete) && <th />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="mkt-title">{row.title}</td>
                      <td>
                        {row.url ? (
                          <a
                            className="mkt-url"
                            style={{ display: "inline", margin: 0 }}
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.path}
                          </a>
                        ) : (
                          <span
                            className="mkt-url"
                            style={{ display: "inline", margin: 0 }}
                          >
                            {row.path}
                          </span>
                        )}
                      </td>
                      <td>{row.target_keyword || "—"}</td>
                      <td
                        className="max-w-[180px] truncate"
                        title={row.meta_title || ""}
                      >
                        {row.meta_title || "—"}
                      </td>
                      <td>
                        <StatusPill
                          status={row.status_label_ar || row.status}
                        />
                      </td>
                      <td>{row.updated_at || "–"}</td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              justifyContent: "center",
                            }}
                          >
                            {canEdit && (
                              <button
                                type="button"
                                className="mk-mini"
                                onClick={() =>
                                  setForm({
                                    id: row.id,
                                    title: row.title || "",
                                    path: row.path || "",
                                    target_keyword: row.target_keyword || "",
                                    meta_title: row.meta_title || "",
                                    meta_description:
                                      row.meta_description || "",
                                    status: row.status || "draft",
                                  })
                                }
                              >
                                تحرير
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="mk-mini"
                                onClick={() => handleDelete(row)}
                                disabled={remove.isPending}
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </TrackingState>
      </SectionCard>
    </>
  );
}

function FormField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#4a5b54" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
