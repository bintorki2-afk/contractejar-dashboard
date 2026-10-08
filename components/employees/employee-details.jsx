"use client";

import { roleLabelAr } from "@/src/lib/role-labels";
import { BriefcaseBusiness, CalendarDays, Mail, ShieldCheck, ShieldX, Wallet } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import AddNoteDialog from "./add-note-dialog";
import AddSalaryDialog from "./add-salary-dialog";
import AddNewEmployeeDialog from "./add-employee-dialog";
import BlockEmployeeDialog from "./block-employee-dialog";
import DeleteEmployeeDialog from "./delete-employee-dialog";
import SendOrderSmsButton from "@/components/orders/shared/send-order-sms-button";
import { WorkPeriodBadge, formatDateShort, formatSalary } from "@/components/roles-and-employees/shared";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, title, tint = "slate", accent = false }) {
  const tints = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {accent && (
        <span className="absolute right-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-brand-accent" />
      )}
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tints[tint] || tints.slate
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p
          className="truncate text-15 font-bold text-ink-heading"
          title={title ?? (typeof value === "string" ? value : undefined)}
        >
          {value}
        </p>
        <p className="mt-0.5 text-11 text-ink-placeholder">{label}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailsCard({ employee, readOnly = false }) {
  const phone = employee?.phone;
  const isActive =
    employee?.is_active != null
      ? Boolean(employee.is_active)
      : !employee?.is_blocked;
  const salary = formatSalary(employee?.base_salary);

  return (
    <div dir="rtl" className="text-right">
      {/* Actions bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {phone && (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="مراسلة عبر واتساب"
              className="me-auto flex size-9 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700"
            >
              <FaWhatsapp size={16} />
            </a>
          )}
          <PermissionGate section={PERMISSION_SECTIONS.employees} action="edit">
            <AddNoteDialog employee={employee} variant="outline" />
          </PermissionGate>
          <PermissionGate section={PERMISSION_SECTIONS.employee_salaries} action="create">
            <AddSalaryDialog employee={employee} variant="outline" />
          </PermissionGate>
          <PermissionGate section={PERMISSION_SECTIONS.employees} action="edit">
            <AddNewEmployeeDialog isEdit employee={employee} triggerVariant="outline-plain" />
          </PermissionGate>
          <PermissionGate section={PERMISSION_SECTIONS.employees} action="edit">
            <BlockEmployeeDialog employee={employee} />
          </PermissionGate>
          <PermissionGate section={PERMISSION_SECTIONS.employees} action="delete">
            <DeleteEmployeeDialog isSingle employee={employee} />
          </PermissionGate>
        </div>
      )}

      {/* Summary cards */}
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", !readOnly && "mt-4")}>
        <StatCard
          icon={CalendarDays}
          tint="slate"
          label="تاريخ الإنشاء"
          value={formatDateShort(employee?.created_at)}
        />
        <StatCard
          icon={isActive ? ShieldCheck : ShieldX}
          tint={isActive ? "green" : "red"}
          accent
          label="الحالة"
          value={
            <span className={isActive ? "text-emerald-600" : "text-red-500"}>
              {isActive ? "مُفعّل" : "محظور"}
            </span>
          }
        />
        <StatCard
          icon={Mail}
          tint="blue"
          accent
          label="البريد الإلكتروني"
          value={employee?.email || "---"}
        />
        <StatCard
          icon={Wallet}
          tint="green"
          accent
          label="الراتب الأساسي"
          value={
            salary ? (
              <span className="text-emerald-600">
                {salary} <span className="text-13 font-medium">ريال</span>
              </span>
            ) : (
              "---"
            )
          }
          title={salary || undefined}
        />
        <StatCard
          icon={BriefcaseBusiness}
          tint="amber"
          accent
          label="المسمى الوظيفي"
          value={roleLabelAr(employee) || "موظف"}
        />
      </div>

      {(employee?.work_period || !readOnly) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {employee?.work_period && <WorkPeriodBadge workPeriod={employee.work_period} />}
          {!readOnly && (
            <SendOrderSmsButton
              employee={employee}
              employeeId={employee?.id}
              label="إرسال رسالة"
            />
          )}
        </div>
      )}
    </div>
  );
}
