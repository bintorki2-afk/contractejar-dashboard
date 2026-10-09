"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PERMISSION_ACTION_LABELS } from "@/src/lib/permissions";

const FIELD_LABEL =
  "block text-[12.5px] font-bold text-[#3a4b44] dark:text-[#bcd]";

const FIELD_INPUT =
  "w-full mt-1.5 border border-[#d5e3dc] dark:border-[#2c5648] rounded-[9px] px-[11px] py-[9px] text-[13.5px] bg-white dark:bg-[#0f241d] text-[#123] dark:text-[#e6f2ec] focus:outline-none focus:border-brand-main dark:focus:border-emerald-500 transition-colors disabled:opacity-60";

const FIELD_TEXTAREA = cn(FIELD_INPUT, "resize-none min-h-[72px]");

export function RoleFormPageHeader({
  title,
  backHref = "/home/roles-and-employees?tab=roles",
  onSave,
  isSaving = false,
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 flex-wrap mb-3.5">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1.5 bg-[#F4F6F5] dark:bg-white/[0.06] border-0 rounded-[9px] px-3 py-1.5 text-[11px] font-extrabold text-[#22302C] dark:text-white/75 hover:bg-[#EAEEEC] dark:hover:bg-white/[0.1] transition-colors"
      >
        <ChevronLeft className="size-3" />
        رجوع
      </button>

      <div className="min-w-0">
        <b className="block text-[17px] font-extrabold text-[#22302C] dark:text-white leading-tight">
          {title}
        </b>
        <small className="block text-[11px] text-[#8A8A84] dark:text-white/45 font-semibold mt-0.5">
          بيانات الدور والصلاحيات
        </small>
      </div>

      <div className="mr-auto flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#0F1C16] border-[1.5px] border-[#E3E8E6] dark:border-white/15 rounded-xl px-3.5 py-2 text-[11px] font-extrabold text-[#33403B] dark:text-white/80 hover:border-[#CDEBDF] dark:hover:border-emerald-500/40 hover:text-[#0B5A3C] dark:hover:text-emerald-300 transition-colors disabled:opacity-60 min-w-[110px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ البيانات"
          )}
        </button>
      </div>
    </div>
  );
}

export function RoleFormSection({ title, children, className }) {
  return (
    <section
      className={cn(
        "bg-white dark:bg-[#12241d] border border-[#ECEFED] dark:border-[#24463b] rounded-2xl p-3.5 sm:p-4 shadow-[0_3px_12px_rgba(11,33,28,0.04)] dark:shadow-none",
        className
      )}
    >
      {title ? (
        <div className="text-[13.5px] font-black text-[#0B5A3C] dark:text-[#5fd0a8] mb-2.5">
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function RoleFormFields({
  formData,
  onChange,
  nameReadOnly = false,
  disabled = false,
  extraFields = null,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
      <label className={FIELD_LABEL}>
        اللقب
        <input
          type="text"
          value={formData.title_ar}
          onChange={(e) => onChange("title_ar", e.target.value)}
          placeholder="مثال: موظف خدمة العملاء"
          disabled={disabled}
          className={FIELD_INPUT}
        />
      </label>

      <label className={FIELD_LABEL}>
        الاسم (مفتاح النظام)
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="customer_service"
          readOnly={nameReadOnly}
          disabled={disabled || nameReadOnly}
          dir="ltr"
          className={cn(
            FIELD_INPUT,
            nameReadOnly && "text-neutral-500 dark:text-white/50 bg-[#F8FAF9] dark:bg-white/[0.02]"
          )}
        />
      </label>

      <div className={cn(FIELD_LABEL, "sm:col-span-2")}>
        اللون المميّز
        <div className="mt-1.5 flex items-center gap-2.5">
          <input
            type="color"
            value={formData.color || "#0B5A3C"}
            onChange={(e) => onChange("color", e.target.value)}
            disabled={disabled}
            className="w-[46px] h-[38px] p-[3px] border border-[#d5e3dc] dark:border-[#2c5648] rounded-[9px] cursor-pointer bg-white dark:bg-[#0f241d] disabled:opacity-60"
          />
          <span className="text-xs text-[#8a978f] dark:text-white/45 font-normal">
            يُستخدم في شارة الدور داخل الجداول
          </span>
        </div>
      </div>

      <label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        الوصف
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="وصف اختياري للدور…"
          disabled={disabled}
          className={FIELD_TEXTAREA}
        />
      </label>

      {extraFields}
    </div>
  );
}

export function RoleActivateAllToggle({ checked, onChange, disabled = false }) {
  return (
    <label className="mt-3.5 flex items-center gap-2.5 bg-[#f4f9f7] dark:bg-[#12241d] border border-[#e0efe8] dark:border-[#24463b] rounded-[11px] px-3.5 py-2.5 text-[13px] font-bold text-[#3a4b44] dark:text-[#bcd] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="size-4 accent-[#0B5A3C] dark:accent-emerald-500"
      />
      تفعيل كافة الصلاحيات لهذا الدور
    </label>
  );
}

export function RolePermissionsSection({
  modules,
  selectedPermissionNames,
  onPermissionChange,
  onSelectAll,
  activateAllPermissions,
  isPending = false,
  isError = false,
}) {
  const totalPermissions = modules.reduce(
    (count, module) => count + (module.actions?.length || 0),
    0
  );

  return (
    <RoleFormSection className="mt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3.5">
        <div className="text-[13.5px] font-black text-[#0B5A3C] dark:text-[#5fd0a8]">
          صلاحيات النظام{" "}
          <span className="text-[#8a978f] dark:text-white/45 font-normal">
            ({totalPermissions} صلاحية · {modules.length} وحدة)
          </span>
        </div>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={isPending || modules.length === 0}
          className="border border-[#cfe3da] dark:border-[#2c5648] bg-white dark:bg-[#173029] text-[#0B5A3C] dark:text-[#5fd0a8] rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-[#eef8f3] dark:hover:bg-[#1c352d] transition-colors disabled:opacity-50"
        >
          تحديد الكل
        </button>
      </div>

      {isError ? (
        <p className="text-center text-status-danger dark:text-red-400 text-sm py-8">
          تعذر تحميل الصلاحيات. يرجى المحاولة مرة أخرى.
        </p>
      ) : modules.length === 0 ? (
        <p className="text-center text-ink-placeholder dark:text-white/45 text-sm py-8">
          لا توجد صلاحيات متاحة حالياً.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {modules.map((module) => (
            <div
              key={module.section_key}
              className="border border-[#e5eee9] dark:border-[#24463b] rounded-[13px] p-3 sm:px-[15px] bg-[#fbfdfc] dark:bg-[#12241d] transition-colors hover:border-[#cfe3da] dark:hover:border-[#356052] hover:shadow-[0_2px_10px_rgba(14,95,78,0.05)] dark:hover:shadow-none"
            >
              <div className="text-[13.5px] font-extrabold text-[#0B5A3C] dark:text-[#5fd0a8] border-b border-[#eef4f1] dark:border-[#24463b] pb-2 mb-2">
                {module.section_label_ar ?? module.section_key}
              </div>
              <div className="flex flex-col">
                {module.actions.map((action) => {
                  const checked =
                    activateAllPermissions ||
                    selectedPermissionNames.has(action.permission_name);

                  return (
                    <label
                      key={action.permission_name}
                      className="flex items-center gap-2 text-[12.5px] text-[#4a5b54] dark:text-[#bcd] px-2 py-1.5 -mx-2 rounded-lg cursor-pointer hover:bg-[#f2f8f5] dark:hover:bg-[#173a30] hover:text-[#0B5A3C] dark:hover:text-[#5fd0a8] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onPermissionChange(action.permission_name)}
                        disabled={isPending}
                        className="size-4 accent-[#0B5A3C] dark:accent-emerald-500 shrink-0"
                      />
                      {action.action_label_ar ?? PERMISSION_ACTION_LABELS[action.action] ?? action.action}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleFormSection>
  );
}
