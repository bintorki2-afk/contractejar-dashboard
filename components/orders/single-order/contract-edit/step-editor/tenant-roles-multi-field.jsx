"use client";

import { Loader2 } from "lucide-react";
import parse from "html-react-parser";
import { sanitizeHtml } from "@/src/lib/sanitize-html";
import { getTenantRoleLabel, useTenantRoles } from "@/src/hooks/use-tenant-roles";
import { parseTenantRoleIds } from "@/src/lib/contract-update";
import { inputClass } from "./field-styles";

export default function TenantRolesMultiField({ formValues, onPatch, fieldErrors = {} }) {
  const { items: roles, isLoading } = useTenantRoles(true);
  const selectedIds = parseTenantRoleIds(formValues?.tenant_role_ids);
  const selectedSet = new Set(selectedIds.map(String));
  const values = formValues?.tenant_role_values || {};

  const emit = (ids, nextValues) => {
    onPatch({
      tenant_role_ids: ids,
      tenant_role_values: nextValues,
      tenant_roles: ids.length > 0 ? 1 : 0,
    });
  };

  const toggleRole = (roleId, checked) => {
    const idNum = Number(roleId);
    const nextIds = checked
      ? [...selectedIds.filter((id) => id !== idNum), idNum]
      : selectedIds.filter((id) => id !== idNum);
    const nextValues = { ...values };
    if (!checked) {
      delete nextValues[String(roleId)];
    }
    emit(nextIds, nextValues);
  };

  const setRoleValue = (roleId, value) => {
    emit(selectedIds, {
      ...values,
      [String(roleId)]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 text-sm text-ink-placeholder">
        <Loader2 className="size-4 animate-spin" />
        جاري تحميل صلاحيات المستأجر...
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div className="md:col-span-2 lg:col-span-3 text-sm text-ink-placeholder">
        لا توجد صلاحيات متاحة حالياً
      </div>
    );
  }

  return (
    <div className="md:col-span-2 lg:col-span-3 space-y-3">
      <p className="text-13 font-bold text-black dark:text-white text-right">صلاحيات المستأجر</p>
      <div className="space-y-3">
        {roles.map((role) => {
          const id = String(role.id);
          const checked = selectedSet.has(id);
          const valueError =
            fieldErrors[`tenant_role_values.${id}`] || fieldErrors[`tenant_role_values.${role.id}`];

          return (
            <div
              key={role.id}
              className={`rounded-2xl border p-4 ${
                checked
                  ? "border-brand-hover/40 bg-brand-hover/5 dark:bg-brand-hover/10"
                  : "border-surface-border dark:border-white/10 bg-white dark:bg-white/[0.03]"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--brand-hover,#0B5A3C)]"
                  checked={checked}
                  onChange={(e) => toggleRole(role.id, e.target.checked)}
                />
                <span className="min-w-0 flex-1 text-right">
                  <span className="block text-sm font-bold text-gray-800 dark:text-white">
                    {getTenantRoleLabel(role)}
                  </span>
                  {role.service_definition ? (
                    <div className="mt-1 text-xs text-neutral-500 dark:text-white/50 leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0 [&_*]:!text-xs [&_*]:!leading-relaxed">
                      {parse(sanitizeHtml(String(role.service_definition)))}
                    </div>
                  ) : null}
                </span>
              </label>

              {checked && role.has_user_input ? (
                <div className="mt-3 space-y-1.5 pr-7">
                  <label className="block text-xs font-medium text-gray-500 dark:text-white/50 text-right">
                    {role.input_field_label || "القيمة"}
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type={role.input_field_type === "number" ? "number" : "text"}
                    value={values[id] ?? ""}
                    onChange={(e) => setRoleValue(role.id, e.target.value)}
                    className={inputClass}
                    placeholder={role.input_field_label || ""}
                    dir="ltr"
                  />
                  {valueError ? <p className="text-xs text-[#E24444] text-right">{valueError}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {fieldErrors.tenant_role_ids ? (
        <p className="text-xs text-[#E24444] text-right">{fieldErrors.tenant_role_ids}</p>
      ) : null}
    </div>
  );
}
