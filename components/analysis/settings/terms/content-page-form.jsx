"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

const TextEditor = dynamic(
  () => import("@/components/analysis/settings/terms/text-editor"),
  { ssr: false }
);

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString("ar-EG-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export default function ContentPageForm({ content, saveEndpoint, queryKey }) {
  const queryClient = useQueryClient();
  const [descriptionAr, setDescriptionAr] = useState("");
  const [editorKey, setEditorKey] = useState(0);

  const [syncedContent, setSyncedContent] = useState(null);
  if (content && content !== syncedContent) {
    setSyncedContent(content);
    setDescriptionAr(content.description_ar || content.description || "");
    setEditorKey((prev) => prev + 1);
  }

  const { mutate: saveContent, isPending } = useMutation({
    mutationFn: (payload) => axiosInstance.post(saveEndpoint, payload),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم حفظ المحتوى بنجاح");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حفظ المحتوى");
    },
  });

  const handleSave = () => {
    saveContent({ description_ar: descriptionAr });
  };

  const updatedAt = formatDate(content?.updated_at);

  return (
    <div className="space-y-6">
      {updatedAt && (
        <p className="text-13 text-ink-placeholder dark:text-white/40">
          آخر تحديث: <span className="font-medium text-[#616161] dark:text-white/70">{updatedAt}</span>
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold text-black dark:text-white block">المحتوى</label>
        <div className="min-h-[420px]">
          <TextEditor
            key={editorKey}
            initialContent={content?.description_ar || content?.description || ""}
            onChange={(value) => setDescriptionAr(value?.html || "")}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-[#F0F0F0] dark:border-white/10">
        <PermissionGate section={PERMISSION_SECTIONS.app_content} action="edit">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-brand-main hover:bg-brand-hover text-white h-12 px-8 rounded-full font-bold min-w-[160px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              "حفظ المحتوى"
            )}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
