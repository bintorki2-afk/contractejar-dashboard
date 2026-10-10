"use client";

import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import { useState } from "react";
import Link from "next/link";
import {
  SETTINGS_ADD_TRIGGER_CLASS,
  SETTINGS_EDIT_TRIGGER_CLASS,
  SETTINGS_VIEW_TRIGGER_CLASS,
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsPagination,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
  SettingsPageShell,
} from "@/components/system-settings/shared";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { axiosInstance } from "@/src/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const HEADERS = [
  "العنوان",
  "الوصف",
  { label: "الحالة", className: "text-center" },
  { label: "تاريخ النشر", className: "text-center" },
  { label: "نشط", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

const stripHtml = (html) => {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("ar-EG-u-nu-latn", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export default function BlogsPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  const [currentPage, setCurrentPage] = useState(1);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["blogs", currentPage],
    queryFn: () =>
      axiosInstance.get(`/admin/blogs?per_page=10&page=${currentPage}`).then((res) => res?.data),
  });

  const blogs = responseData?.data?.items ?? [];
  const pagination = responseData?.data?.pagination;

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="المدونة"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.blogs} action="create">
            <Link href="/home/settings/blogs/create" className={SETTINGS_ADD_TRIGGER_CLASS}>
              <Plus className="size-4" />
              إضافة
            </Link>
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="980px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={6} />
        ) : blogs.length === 0 ? (
          <SettingsEmptyRow colSpan={6} />
        ) : (
          blogs.map((blog) => (
            <SettingsTableRow key={blog.id}>
              <SettingsTd>
                <div>
                  <p className="font-bold">{blog.title}</p>
                  <p className="mt-0.5 text-11 text-gray-400">{blog.slug}</p>
                </div>
              </SettingsTd>
              <SettingsTd className="max-w-[320px]">
                <p className="line-clamp-2 text-[#4B5563]">{stripHtml(blog.description)}</p>
              </SettingsTd>
              <SettingsTd className="text-center">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-11 font-bold",
                    blog.status === "published"
                      ? "bg-[#E6F7EF] text-green-700"
                      : blog.status === "draft"
                        ? "bg-[#FFF7ED] text-[#C2410C]"
                        : "bg-status-neutral-bg text-status-neutral"
                  )}
                >
                  {blog.status === "published" ? "منشور" : blog.status === "draft" ? "مسودة" : blog.status || "—"}
                </span>
              </SettingsTd>
              <SettingsTd className="text-center whitespace-nowrap">
                {formatDate(blog.timePublish)}
              </SettingsTd>
              <SettingsTd className="text-center">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-11 font-bold",
                    blog.isActive ? "bg-[#E6F7EF] text-green-700" : "bg-status-neutral-bg text-status-neutral"
                  )}
                >
                  {blog.isActive ? "نشط" : "غير نشط"}
                </span>
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <PermissionGate section={PERMISSION_SECTIONS.blogs} action="view">
                    <Link href={`/home/settings/blogs/${blog.id}`} className={SETTINGS_VIEW_TRIGGER_CLASS}>
                      عرض
                    </Link>
                  </PermissionGate>
                  <PermissionGate section={PERMISSION_SECTIONS.blogs} action="edit">
                    <Link href={`/home/settings/blogs/${blog.id}/edit`} className={SETTINGS_EDIT_TRIGGER_CLASS}>
                      تعديل
                    </Link>
                  </PermissionGate>
                </div>
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>

      <SettingsPagination
        page={currentPage}
        lastPage={pagination?.last_page}
        onPageChange={setCurrentPage}
      />
    </SettingsPageShell>
  );
}
