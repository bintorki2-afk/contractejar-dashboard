"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SettingsFormDialog, {
  SettingsFieldLabel,
  settingsFieldClass,
} from "@/components/system-settings/settings-form-dialog";
import { SETTINGS_EDIT_TRIGGER_CLASS, SettingsAddTrigger } from "@/components/system-settings/shared";
import { axiosInstance } from "@/src/utils/axios";
import {
  ADMIN_TENANT_ROLES_API,
  ADMIN_TENANT_ROLES_QUERY_KEY,
  buildTenantRolePayload,
} from "@/src/hooks/use-admin-tenant-roles";
import { TENANT_ROLES_QUERY_KEY } from "@/src/hooks/use-tenant-roles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const TextEditor = dynamic(
  () => import("@/components/analysis/settings/terms/text-editor"),
  { ssr: false }
);

const EMPTY_FORM = {
  text_of_reason: "",
  service_definition: "",
  hasUserInput: false,
  input_field_label: "",
  input_field_type: "text",
};

function roleToForm(role) {
  if (!role) return { ...EMPTY_FORM };
  const hasUserInput = Boolean(
    role.has_user_input || role.input_field_label || role.input_field_type
  );
  return {
    text_of_reason: role.text_of_reason || role.name || "",
    service_definition: role.service_definition || "",
    hasUserInput,
    input_field_label: role.input_field_label || "",
    input_field_type: role.input_field_type || "text",
  };
}

export default function TenantRoleFormDialog({ role = null }) {
  const isEdit = Boolean(role?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editorKey, setEditorKey] = useState(0);
  const queryClient = useQueryClient();

  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(isEdit ? roleToForm(role) : { ...EMPTY_FORM });
      setEditorKey((prev) => prev + 1);
    }
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = buildTenantRolePayload(form);
      if (isEdit) {
        return axiosInstance.post(`${ADMIN_TENANT_ROLES_API}/${role.id}`, payload);
      }
      return axiosInstance.post(ADMIN_TENANT_ROLES_API, payload);
    },
    onSuccess: (res) => {
      toast.success(
        res?.data?.message || (isEdit ? "تم تحديث الصلاحية بنجاح" : "تم إضافة الصلاحية بنجاح")
      );
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [ADMIN_TENANT_ROLES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TENANT_ROLES_QUERY_KEY] });
    },
    onError: (error) => {
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const first = Object.values(apiErrors)[0];
        toast.error(Array.isArray(first) ? first[0] : String(first));
        return;
      }
      toast.error(
        error?.response?.data?.message ||
          (isEdit ? "حدث خطأ أثناء التحديث" : "حدث خطأ أثناء الإضافة")
      );
    },
  });

  const handleSubmit = () => {
    if (!form.text_of_reason.trim()) {
      toast.error("عنوان الصلاحية مطلوب");
      return;
    }
    if (form.hasUserInput) {
      if (!form.input_field_label.trim()) {
        toast.error("اسم حقل الإدخال مطلوب");
        return;
      }
      if (!form.input_field_type) {
        toast.error("نوع حقل الإدخال مطلوب");
        return;
      }
    }
    mutate();
  };

  return (
    <SettingsFormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        isEdit ? (
          <button type="button" className={SETTINGS_EDIT_TRIGGER_CLASS}>
            تعديل
          </button>
        ) : (
          <SettingsAddTrigger />
        )
      }
      title={isEdit ? "تعديل العنصر" : "عنصر جديد"}
      onSubmit={handleSubmit}
      submitLabel="حفظ"
      isPending={isPending}
      maxWidthClass="sm:max-w-[640px]"
    >
      <label className="flex flex-col gap-1.5">
        <SettingsFieldLabel required>عنوان الصلاحية</SettingsFieldLabel>
        <Input
          placeholder="مثال: غرامة يومية لتأخير الإخلاء"
          value={form.text_of_reason}
          onChange={(e) => setField("text_of_reason", e.target.value)}
          className={settingsFieldClass}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <SettingsFieldLabel>تعريف الخدمة</SettingsFieldLabel>
        <div className="min-h-[220px]">
          <TextEditor
            key={editorKey}
            initialContent={form.service_definition || ""}
            placeholder="نص يظهر داخل المودال عند اختيار الصلاحية..."
            onChange={(value) => setField("service_definition", value?.html || "")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E6EBE9] bg-[#F8FAF9] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-[13px] font-bold text-[#111827]">حقل من المستخدم؟</p>
            <p className="text-[11px] font-medium text-[#6B7280]">
              يطلب إدخال قيمة (نص أو رقم) داخل المودال في التطبيق
            </p>
          </div>
          <Switch
            dir="ltr"
            checked={form.hasUserInput}
            onCheckedChange={(checked) => setField("hasUserInput", checked)}
            className="data-[state=checked]:bg-[#0B5A3C]"
          />
        </div>
      </div>

      {form.hasUserInput ? (
        <div className="flex flex-col gap-3.5 rounded-xl border border-[#0B5A3C]/15 bg-[#0B5A3C]/[0.04] p-3.5">
          <label className="flex flex-col gap-1.5">
            <SettingsFieldLabel required>اسم حقل الإدخال</SettingsFieldLabel>
            <Input
              placeholder="أدخل مبلغ الغرامة اليومية"
              value={form.input_field_label}
              onChange={(e) => setField("input_field_label", e.target.value)}
              className={settingsFieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <SettingsFieldLabel required>نوع الحقل</SettingsFieldLabel>
            <Select
              dir="rtl"
              value={form.input_field_type || "text"}
              onValueChange={(value) => setField("input_field_type", value)}
            >
              <SelectTrigger className={settingsFieldClass}>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="text">نص (text)</SelectItem>
                <SelectItem value="number">رقم (number)</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      ) : null}
    </SettingsFormDialog>
  );
}
