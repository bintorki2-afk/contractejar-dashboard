"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

const TextEditor = dynamic(
  () => import("@/components/analysis/settings/terms/text-editor"),
  { ssr: false }
);

const blogSchema = z.object({
  title: z.string().min(2, "عنوان المقال مطلوب"),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_active: z.boolean().default(true),
  publishMode: z.enum(["now", "draft", "schedule"]),
  publish_at: z.string().optional(),
  image: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.publishMode === "schedule" && !data.publish_at) {
    ctx.addIssue({
      code: "custom",
      message: "تاريخ ووقت النشر مطلوب عند الجدولة",
      path: ["publish_at"],
    });
  }
});

const formatDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const toDateTimeLocalValue = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mapBlogToFormValues = (blog) => {
  const publishAt = blog?.publish_at || blog?.timePublish;
  let publishMode = "draft";
  let publish_at = "";

  if (blog?.status === "published") {
    if (publishAt) {
      publishMode = "schedule";
      publish_at = toDateTimeLocalValue(new Date(publishAt));
    } else {
      publishMode = "now";
    }
  }

  return {
    title: blog?.title || "",
    meta_title: blog?.meta_title || blog?.metaTitle || "",
    meta_description: blog?.meta_description || blog?.metaDescription || "",
    is_active: blog?.is_active === 1 || blog?.is_active === true || blog?.isActive === 1 || blog?.isActive === true,
    publishMode,
    publish_at,
    image: null,
  };
};

const buildFormData = (data, description) => {
  const formDataPayload = new FormData();
  formDataPayload.append("title", data.title);
  formDataPayload.append("description", description);
  formDataPayload.append("meta_title", data.meta_title || "");
  formDataPayload.append("meta_description", data.meta_description || "");
  formDataPayload.append("is_active", data.is_active ? "1" : "0");

  let status = "draft";
  let publishAt = "";

  if (data.publishMode === "now") {
    status = "published";
    publishAt = formatDateTime(new Date());
  } else if (data.publishMode === "draft") {
    status = "draft";
  } else if (data.publishMode === "schedule" && data.publish_at) {
    status = "published";
    publishAt = formatDateTime(new Date(data.publish_at));
  }

  formDataPayload.append("status", status);
  if (publishAt) {
    formDataPayload.append("publish_at", publishAt);
  }

  if (data.image?.[0]) {
    formDataPayload.append("image", data.image[0]);
  }

  return formDataPayload;
};

export default function BlogForm({ blogId = null, blog = null }) {
  const isEdit = Boolean(blogId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(blog?.description || "");
  const [preview, setPreview] = useState(blog?.image || null);
  const [editorKey, setEditorKey] = useState(blog?.id || "new");

  const form = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: mapBlogToFormValues(blog),
  });

  const publishMode = form.watch("publishMode");
  const imageFile = form.watch("image");

  useEffect(() => {
    if (!blog) return;
    form.reset(mapBlogToFormValues(blog));
    setDescription(blog.description || "");
    setPreview(blog.image || null);
    setEditorKey(String(blog.id));
  }, [blog, form]);

  useEffect(() => {
    if (imageFile?.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (!isEdit) {
      setPreview(null);
    } else if (blog?.image) {
      setPreview(blog.image);
    }
  }, [imageFile, isEdit, blog?.image]);

  const { mutate: saveBlog, isPending } = useMutation({
    mutationFn: (formDataPayload) => {
      if (isEdit) {
        // PHP لا يقرأ جسم multipart في طلب PUT، فكان الخادم يرد «تم التحديث بنجاح»
        // دون أن يتغير شيء. نرسل POST مع _method=PUT (Laravel يوجّهه لمسار التحديث).
        formDataPayload.append("_method", "PUT");
        return axiosInstance.post(`/admin/blogs/${blogId}`, formDataPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return axiosInstance.post("/admin/blogs", formDataPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || (isEdit ? "تم تحديث المقال بنجاح" : "تم إنشاء المقال بنجاح"));
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog", blogId] });
      router.push(isEdit ? `/home/settings/blogs/${blogId}` : "/home/settings/blogs");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || (isEdit ? "حدث خطأ أثناء تحديث المقال" : "حدث خطأ أثناء إنشاء المقال"));
    },
  });

  const onSubmit = (data) => {
    if (!description.trim() || description === "<p></p>") {
      toast.error("محتوى المقال مطلوب");
      return;
    }
    saveBlog(buildFormData(data, description));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold text-black dark:text-white">
                عنوان المقال <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="أدخل عنوان المقال"
                  className="h-13 rounded-14 border-surface-border bg-surface-input dark:border-white/10 dark:bg-white/[0.04]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && blog?.slug && (
          <div className="rounded-14 border border-surface-border bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs text-ink-placeholder mb-1 dark:text-white/40">الرابط المختصر</p>
            <p className="text-13 font-medium text-black dark:text-white" dir="ltr">{blog.slug}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-black dark:text-white block">
            محتوى المقال <span className="text-red-500">*</span>
          </label>
          <div className="min-h-[320px]">
            <TextEditor
              key={editorKey}
              initialContent={blog?.description || ""}
              onChange={(value) => setDescription(value?.html || "")}
            />
          </div>
        </div>

        <div className="rounded-20 border border-surface-border bg-neutral-50 p-5 space-y-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <p className="text-sm font-bold text-black dark:text-white">تحسين محركات البحث (SEO)</p>
            <p className="mt-1 text-xs text-ink-placeholder dark:text-white/40">
              عنوان ووصف الميتا لهذا المقال. اتركهما فارغين لاستخدام العنوان الافتراضي.
            </p>
          </div>
          <FormField
            control={form.control}
            name="meta_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-black dark:text-white">
                  عنوان الميتا
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="مثال: دليلك لتوثيق عقد الإيجار إلكترونيًا | عقدي"
                    className="h-13 rounded-14 border-surface-border bg-white dark:border-white/10 dark:bg-white/[0.04]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="meta_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-black dark:text-white">
                  وصف الميتا
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="وصف مختصر يظهر تحت العنوان في نتائج البحث (~160 حرفًا)"
                    className="min-h-[96px] rounded-14 border-surface-border bg-white resize-none dark:border-white/10 dark:bg-white/[0.04]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold text-black dark:text-white">صورة المقال</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center gap-2 h-13 px-6 rounded-14 border border-dashed border-[#D4D4D4] bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-all dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
                    <ImageUp className="size-5 text-ink-placeholder dark:text-white/40" />
                    <span className="text-13 font-medium text-[#616161] dark:text-white/60">اختر صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                    />
                  </label>
                  {preview && (
                    <div className="relative size-16 rounded-xl overflow-hidden border border-surface-border dark:border-white/10">
                      <Image src={preview} alt="preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border border-surface-border bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="space-y-1">
                <FormLabel className="text-sm font-bold text-black dark:text-white">نشط</FormLabel>
                <p className="text-xs text-ink-placeholder dark:text-white/40">تحديد ما إذا كان المقال نشطاً في المدونة</p>
              </div>
              <FormControl>
                <Switch
                  dir="ltr"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-brand-main"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="bg-neutral-50 rounded-20 border border-surface-border p-5 space-y-4 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm font-bold text-black dark:text-white">خيارات النشر</p>

          <FormField
            control={form.control}
            name="publishMode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: "now", label: "نشر فوري", desc: "نشر المقال الآن" },
                      { value: "schedule", label: "جدولة", desc: "تحديد وقت النشر" },
                      { value: "draft", label: "مسودة", desc: "حفظ بدون نشر" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex flex-col gap-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          field.value === option.value
                            ? "border-brand-main bg-brand-main/5"
                            : "border-surface-border bg-white hover:border-[#DDD] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          checked={field.value === option.value}
                          onChange={() => field.onChange(option.value)}
                          className="hidden"
                        />
                        <span className="text-sm font-bold text-black dark:text-white">{option.label}</span>
                        <span className="text-xs text-ink-placeholder dark:text-white/40">{option.desc}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {publishMode === "now" && (
            <p className="text-13 text-[#616161] dark:text-white/55">
              سيتم نشر المقال فوراً بتاريخ: <span className="font-bold text-black dark:text-white">{formatDateTime(new Date())}</span>
            </p>
          )}

          {publishMode === "schedule" && (
            <FormField
              control={form.control}
              name="publish_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-13 font-bold text-black dark:text-white">
                    تاريخ ووقت النشر <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="datetime-local"
                      className="h-13 rounded-14 border-surface-border bg-white dark:border-white/10 dark:bg-white/[0.04] dark:[color-scheme:dark]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {publishMode === "draft" && (
            <p className="text-13 text-[#616161] dark:text-white/55">سيتم حفظ المقال كمسودة بدون تاريخ نشر.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0F0F0] dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(isEdit ? `/home/settings/blogs/${blogId}` : "/home/settings/blogs")}
            className="h-12 px-6 rounded-full"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-brand-main hover:bg-brand-hover text-white h-12 px-8 rounded-full font-bold min-w-[160px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              isEdit ? "تحديث المقال" : "حفظ المقال"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
