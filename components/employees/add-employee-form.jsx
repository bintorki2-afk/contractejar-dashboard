"use client";

import React, { useState, useEffect } from "react";
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
import AvatarImage from "@/components/shared/avatar-image";
import { ImageUp, Loader2 } from "lucide-react";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_INPUT =
  "h-11 border border-[#d5e3dc] dark:border-[#2c5648] rounded-[10px] bg-white dark:bg-[#0f241d] text-[13.5px] text-[#123] dark:text-[#e6f2ec] focus-visible:ring-0 focus-visible:border-brand-main dark:focus-visible:border-emerald-500 transition-colors";

const SELECT_TRIGGER = cn(FIELD_INPUT, "w-full");

const LABEL_CLASS = "text-[12.5px] font-bold text-[#3a4b44] dark:text-[#bcd]";

function FormSection({ title, children, className }) {
  return (
    <section
      className={cn(
        "bg-white dark:bg-[#12241d] border border-[#ECEFED] dark:border-[#24463b] rounded-2xl p-4 shadow-[0_3px_12px_rgba(11,33,28,0.04)] dark:shadow-none",
        className
      )}
    >
      {title ? (
        <div className="mb-3 text-[13.5px] font-black text-[#0B5F4C] dark:text-[#5fd0a8]">
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// Zod schema matching requested backend keys
const employeeSchema = (isEdit) =>
  z.object({
    firstName: z.string().min(2, "الإسم يجب أن يكون على الأقل حرفين"),
    lastName: z.string().min(2, "الاسم الأخير يجب أن يكون على الأقل حرفين"),
    // نفس شرط الخادم (min:8) حتى لا يُرفض الحفظ برسالة من الخادم.
    password: isEdit
      ? z
          .string()
          .optional()
          .refine((value) => !value || value.length >= 8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      : z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صحيح"),
    phone: z.string().min(10, "رقم الهاتف غير صحيح"),
    base_salary: z.string().min(1, "الراتب الأساسي مطلوب"),
    role_id: z.string().min(1, "الدور الوظيفي مطلوب"),
    is_active: z.string().optional().default("1"),
    work_period: z.enum(["morning", "evening"], {
      required_error: "فترة العمل مطلوبة",
    }),
    image: isEdit
      ? z.any().optional()
      : z.any().refine((files) => files?.length > 0, "الرجاء اختيار صورة"),
  });

export default function AddEmployeeForm({ isEdit = false, employee, onSuccess }) {
  const queryClient = useQueryClient();
  const nameParts = (employee?.name || "").trim().split(/\s+/);
  const employeeFirstName = nameParts[0] || "";
  const employeeLastName = nameParts.slice(1).join(" ") || "";

  // Get roles list dynamically for the dropdown selector
  const { data: rolesData } = useQuery({
    queryKey: ["roles-list"],
    queryFn: () => axiosInstance.get("/admin/roles").then((res) => res?.data),
  });

  const roles = rolesData?.data?.items || rolesData?.items || [];

  const form = useForm({
    resolver: zodResolver(employeeSchema(isEdit)),
    defaultValues: {
      firstName: isEdit ? employeeFirstName : "",
      lastName: isEdit ? employeeLastName : "",
      password: "",
      email: isEdit ? employee?.email || "" : "",
      phone: isEdit ? employee?.phone || "" : "",
      base_salary: isEdit ? String(parseFloat(employee?.base_salary || 0)) : "",
      role_id: isEdit ? String(employee?.role_id || "") : "",
      is_active: isEdit ? (employee?.is_active ? "1" : "0") : "1",
      work_period: isEdit ? employee?.work_period || "morning" : "morning",
      image: null,
    },
  });

  const [preview, setPreview] = useState(
    isEdit ? employee?.profile_image || "/images/defaultUser.jpg" : null
  );

  // Watch image changes for preview
  const imageFile = form.watch("image");

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (!isEdit) {
      setPreview(null);
    }
  }, [imageFile, isEdit]);

  const { mutate: saveEmployee, isPending } = useMutation({
    mutationFn: (formDataPayload) => {
      const url = isEdit ? `/admin/employees/${employee?.id}` : "/admin/employees";
      return axiosInstance.post(url, formDataPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          (isEdit ? "تم تعديل بيانات الموظف بنجاح" : "تم إضافة الموظف بنجاح")
      );
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", String(employee?.id)] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "حدث خطأ أثناء حفظ بيانات الموظف"
      );
    },
  });

  const onSubmit = (data) => {
    const formDataPayload = new FormData();
    formDataPayload.append("name", `${data.firstName} ${data.lastName}`);
    formDataPayload.append("email", data.email);
    if (!isEdit || data.password) {
      formDataPayload.append("password", data.password);
    }
    formDataPayload.append("phone", data.phone);
    formDataPayload.append("base_salary", String(data.base_salary));
    formDataPayload.append("role_id", String(data.role_id));
    formDataPayload.append("is_active", String(data.is_active));
    formDataPayload.append("work_period", data.work_period);

    if (data.image && data.image[0]) {
      formDataPayload.append("profile_image", data.image[0]);
    }

    saveEmployee(formDataPayload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Image Upload */}
        <FormSection title="الصورة الشخصية">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="cursor-pointer">
                  <div className="flex items-center gap-4 rounded-[13px] border border-dashed border-[#d5e3dc] dark:border-[#2c5648] bg-[#fbfdfc] dark:bg-[#0f241d] p-4 transition-colors hover:border-brand-main dark:hover:border-emerald-500">
                    {preview ? (
                      <AvatarImage
                        width={100}
                        height={100}
                        src={preview}
                        alt="preview"
                        className="size-16 shrink-0 rounded-full border border-[#e5eee9] object-cover dark:border-[#24463b]"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#12241d] border border-[#e5eee9] dark:border-[#24463b]">
                        <ImageUp className="size-7 text-ink-placeholder" />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-bold text-[#22302C] dark:text-white">
                        إضغط هنا لاختيار الصورة
                      </span>
                      <span className="text-[11.5px] text-[#8a978f] dark:text-white/45">
                        اسحب وأفلت ملفك أو تصفّح — PNG / JPEG
                      </span>
                    </div>
                  </div>
                </FormLabel>
                <FormControl>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => field.onChange(e.target.files)}
                    className="hidden"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Basic info */}
        <FormSection title="البيانات الأساسية">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>الإسم الأول</FormLabel>
                  <FormControl>
                    <Input className={FIELD_INPUT} placeholder="أكتب هنا ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>اسم العائلة / اللقب</FormLabel>
                  <FormControl>
                    <Input className={FIELD_INPUT} placeholder="أكتب هنا ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input className={FIELD_INPUT} dir="ltr" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input className={FIELD_INPUT} dir="ltr" placeholder="05xxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Account & role */}
        <FormSection title="بيانات الحساب والوظيفة">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className={LABEL_CLASS}>
                    كلمة المرور{" "}
                    {isEdit && (
                      <span className="text-[11px] font-normal text-gray-400">
                        (اتركها فارغة إذا لم تكن تريد تغييرها)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={FIELD_INPUT}
                      type="password"
                      placeholder="أكتب هنا ..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>الدور الوظيفي</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} dir="rtl">
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder="اختر الدور الوظيفي للموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.title_trans || role.title_ar || role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>الراتب الأساسي</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className={FIELD_INPUT}
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>فترة العمل</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} dir="rtl">
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder="اختر فترة العمل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">وردية الصباح</SelectItem>
                        <SelectItem value="evening">وردية المساء</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL_CLASS}>حالة الحساب</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} dir="rtl">
                      <SelectTrigger className={SELECT_TRIGGER}>
                        <SelectValue placeholder="اختر حالة الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">نشط / مفعل</SelectItem>
                        <SelectItem value="0">غير نشط</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => onSuccess?.()}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E3E8E6] bg-white px-5 text-[12.5px] font-extrabold text-[#33403B] transition-colors hover:bg-[#F4F6F5] disabled:opacity-60 dark:border-white/15 dark:bg-[#0F1C16] dark:text-white/80 dark:hover:bg-white/[0.06]"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-brand-hover px-6 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-hover/90 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ البيانات"
            )}
          </button>
        </div>
      </form>
    </Form>
  );
}
