"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCw, Search } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/home/loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/system-settings/shared";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  resolveImageUrl,
  WEBSITE_IMAGE_SUMMARY_CARDS,
} from "@/src/lib/website-images";
import {
  useDeleteWebsiteImage,
  useSyncWebsiteImageDefaults,
  useUpdateWebsiteImage,
  useWebsiteImages,
} from "@/src/hooks/use-website-images";
import WebsiteImageFormDialog from "./website-image-form-dialog";
import "@/components/system-settings/settings-design.css";

const DASH = "—";
const ACTIVE_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "المفعّلة" },
  { value: "inactive", label: "غير المفعّلة" },
];

function errMsg(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function SummaryStrip({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {WEBSITE_IMAGE_SUMMARY_CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-[#e4ede9] bg-white px-3.5 py-3 text-center dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="text-[19px] font-black text-[#0B5A3C] dark:text-emerald-300">
            {summary?.[card.key] ?? 0}
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#8a978f] dark:text-white/45">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmDialog({ open, onOpenChange, item, isPending, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-[440px] rounded-2xl border-[#E6EBE9] text-right dark:border-white/10 dark:bg-card"
      >
        <DialogHeader className="space-y-1 text-right">
          <DialogTitle className="text-[16px] font-black text-[#111827] dark:text-white">
            حذف صورة من الفهرس
          </DialogTitle>
        </DialogHeader>
        <p className="text-[13px] leading-7 text-[#55625d] dark:text-white/60">
          سيتم حذف السجل{" "}
          <span className="font-bold text-[#111827] dark:text-white">
            {item?.label_ar || item?.key}
          </span>{" "}
          من فهرس صور الموقع. لن يُحذف ملف الصورة نفسه، وسيرجع الموقع إلى النص
          الافتراضي. يمكنك إعادة إنشائه لاحقًا عبر «مزامنة الافتراضيات».
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-10 flex-1 rounded-[10px] bg-[#c0392b] text-[13px] font-extrabold text-white hover:bg-[#a93226]"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "تأكيد الحذف"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 flex-1 rounded-[10px] border-0 bg-[#F2F6F4] text-[13px] font-extrabold text-[#55625D] hover:bg-[#E7EDE9] dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WebsiteImagesSection() {
  const { can, isReady } = usePermissions();
  const canEdit = isReady && can(PERMISSION_SECTIONS.website_images, "edit");
  const canDelete = isReady && can(PERMISSION_SECTIONS.website_images, "delete");
  const canCreate = isReady && can(PERMISSION_SECTIONS.website_images, "create");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [editing, setEditing] = useState(null); // selected row, or null when the editor is closed
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : null;

  const { items, summary, isLoading, isFetching, isError, error, refetch } =
    useWebsiteImages({ search, isActive });

  const updateMutation = useUpdateWebsiteImage();
  const deleteMutation = useDeleteWebsiteImage();
  const syncMutation = useSyncWebsiteImageDefaults();

  const handleSave = ({ form, imageFile }) => {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, form, imageFile },
      {
        onSuccess: (res) => {
          toast.success(res?.data?.message || "تم حفظ بيانات الصورة");
          setEditing(null);
        },
        onError: (e) => toast.error(errMsg(e, "تعذر حفظ بيانات الصورة")),
      }
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: (res) => {
        toast.success(res?.data?.message || "تم حذف السجل");
        setDeleting(null);
      },
      onError: (e) => toast.error(errMsg(e, "تعذر حذف السجل")),
    });
  };

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res?.data?.message || "تمت مزامنة الصور الافتراضية");
        refetch();
      },
      onError: (e) => toast.error(errMsg(e, "تعذر تنفيذ المزامنة")),
    });
  };

  const rows = items ?? [];

  return (
    <div className="set-page" dir="rtl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="cpf-sec-t !mb-1">صور الموقع و الـ SEO</div>
          <p className="text-[12px] font-medium text-[#8a978f] dark:text-white/45">
            حرّر النص البديل وعنوان ووصف الميتا لكل صورة تظهر في الموقع العام. ترك
            الحقل فارغًا يعني الرجوع للنص الافتراضي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="mk-mini"
            title="تحديث"
          >
            <RotateCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          {canCreate ? (
            <button
              type="button"
              onClick={handleSync}
              className="mk-mini"
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              مزامنة الافتراضيات
            </button>
          ) : null}
        </div>
      </div>

      <SummaryStrip summary={summary} />

      <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8a978f]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="بحث بالمفتاح أو التسمية..."
            className="mk-mini !justify-start pr-8"
            style={{ minWidth: 220, height: 34 }}
          />
        </div>
        <select
          className="mk-mini"
          dir="rtl"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          {ACTIVE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-[#f0d3cd] bg-[#fdf0ee] p-5 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-[13px] font-bold text-[#c0392b] dark:text-red-300">
            {errMsg(error, "تعذر تحميل فهرس صور الموقع")}
          </p>
          <button type="button" className="mk-mini mt-3" onClick={() => refetch()}>
            <RotateCw className="size-3.5" />
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="tblwrap">
          <table className="mkt-tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>التسمية</th>
                <th>المفتاح</th>
                <th>النص البديل</th>
                <th>عنوان الميتا</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[13px] font-bold text-[#8a978f] dark:text-white/45">
                    لا توجد صور مطابقة. جرّب «مزامنة الافتراضيات» لإنشاء الفهرس.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const url = resolveImageUrl(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="mx-auto size-11 overflow-hidden rounded-lg border border-[#e4ede9] bg-white dark:border-white/10 dark:bg-white/[0.04]">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt=""
                              loading="lazy"
                              className="size-full object-contain"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-[#2c3a34] dark:text-white">
                          {row.label_ar || DASH}
                        </div>
                        {row.label_en ? (
                          <div dir="ltr" className="text-[11px] text-[#8a978f] dark:text-white/45">
                            {row.label_en}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <code dir="ltr" className="rounded bg-[#eef5f1] px-1.5 py-0.5 text-[11.5px] font-bold text-[#0B5A3C] dark:bg-white/[0.06] dark:text-emerald-300">
                          {row.key}
                        </code>
                      </td>
                      <td className="max-w-[220px] truncate text-[12.5px]" title={row.alt_ar || ""}>
                        {row.alt_ar || (
                          <span className="text-[#b7c2bc] dark:text-white/30">{DASH}</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate text-[12.5px]" title={row.meta_title_ar || ""}>
                        {row.meta_title_ar || (
                          <span className="text-[#b7c2bc] dark:text-white/30">{DASH}</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge active={row.is_active !== false} />
                      </td>
                      <td>
                        <span className="hr-acts">
                          <button
                            type="button"
                            className="mk-mini"
                            onClick={() => setEditing(row)}
                          >
                            {canEdit ? "تعديل" : "عرض"}
                          </button>
                          {canDelete ? (
                            <button
                              type="button"
                              className="mk-mini hr-del"
                              onClick={() => setDeleting(row)}
                            >
                              حذف
                            </button>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null ? (
        <WebsiteImageFormDialog
          key={editing.id}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
          item={editing}
          onSubmit={handleSave}
          isPending={updateMutation.isPending}
          canEdit={canEdit}
        />
      ) : null}

      {deleting !== null ? (
        <DeleteConfirmDialog
          open
          onOpenChange={(v) => {
            if (!v) setDeleting(null);
          }}
          item={deleting}
          isPending={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
