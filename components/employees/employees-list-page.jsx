"use client";

import { useConfirm } from "@/components/shared/confirm-provider";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AddNewEmployeeDialog from "@/components/employees/add-employee-dialog";
import DeleteEmployeeDialog from "@/components/employees/delete-employee-dialog";
import Loader from "@/components/home/loader";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import PermissionGate from "@/components/auth/permission-gate";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  EmployeeAvatar,
  OutlineActionButton,
  RoleBadge,
  TABLE_TH,
  TABLE_WRAPPER,
  TablePagination,
  WorkPeriodBadge,
  formatSalary,
} from "@/components/roles-and-employees/shared";

export default function EmployeesListPage() {
  const confirm = useConfirm();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const showActionsColumn = canAny(PERMISSION_SECTIONS.employees, ["view", "edit", "delete"]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [pageSearchQuery, setPageSearchQuery] = useState(debouncedSearchQuery);
  if (pageSearchQuery !== debouncedSearchQuery) {
    setPageSearchQuery(debouncedSearchQuery);
    setCurrentPage(1);
  }

  function getAllEmployees(page = 1, search = "") {
    let url = `/admin/employees?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return axiosInstance.get(url).then((res) => res?.data);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["allEmployees", currentPage, debouncedSearchQuery],
    queryFn: () => getAllEmployees(currentPage, debouncedSearchQuery),
  });

  const employees = data?.items || data?.data?.items;
  const pagination = data?.pagination || data?.data?.pagination;

  const { mutateAsync: changeStatus, isPending: isPendingChangeStatus } = useMutation({
    mutationFn: (id) =>
      axiosInstance.post(`/admin/employees/${id}/toggle-status`).then((res) => res?.data),
    onSuccess: (res) => {
      toast.success(res?.message || "تم تغيير حالة الموظف");
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeAnalytics"] });
    },
    onError: (err) => {
      toast.error(err?.message);
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex flex-wrap items-center gap-3">
        <PermissionGate section={PERMISSION_SECTIONS.employees} action="create">
          <AddNewEmployeeDialog triggerVariant="outline-add" />
        </PermissionGate>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 size-4 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد أو الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-white border border-[#E5E7EB] rounded-lg pr-11 pl-4 text-13 focus:outline-none focus:border-brand-dark transition-colors dark:bg-[#0F1C16] dark:border-white/10 dark:text-white dark:placeholder:text-white/35"
          />
        </div>
      </div>

      <div className={TABLE_WRAPPER}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TABLE_TH}>الاسم</th>
              <th className={TABLE_TH}>المسمى الوظيفي</th>
              <th className={TABLE_TH}>فترة العمل</th>
              <th className={TABLE_TH}>الراتب الأساسي</th>
              <th className={TABLE_TH}>رقم الجوال</th>
              <th className={TABLE_TH}>البريد الإلكتروني</th>
              <th className={TABLE_TH}>الحالة</th>
              {showActionsColumn && <th className={TABLE_TH}>الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {employees && employees.length > 0 ? (
              employees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className="border-b border-status-neutral-bg last:border-0 hover:bg-neutral-50 transition-colors dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <EmployeeAvatar name={employee.name} image={employee.profile_image} />
                      <span className="text-13 font-medium text-gray-900 dark:text-white">
                        {employee.name || "---"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge role={employee.role} colorIndex={index} />
                  </td>
                  <td className="px-4 py-3.5">
                    <WorkPeriodBadge workPeriod={employee.work_period} />
                  </td>
                  <td className="px-4 py-3.5">
                    {formatSalary(employee.base_salary) ? (
                      <span className="text-13 font-semibold text-gray-900 tabular-nums dark:text-white">
                        {formatSalary(employee.base_salary)} ريال
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-white/40">غير محدد</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-13 text-gray-700 tabular-nums dark:text-white/70" dir="ltr">
                      {employee.phone || "---"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-13 text-gray-700 dark:text-white/70">{employee.email || "---"}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <PermissionGate
                      section={PERMISSION_SECTIONS.employees}
                      action="edit"
                      fallback={<Switch dir="ltr" checked={employee.is_active} disabled />}
                    >
                      <Switch
                        dir="ltr"
                        checked={employee.is_active}
                        disabled={isPendingChangeStatus}
                        onCheckedChange={async () => {
                          const activating = !employee.is_active;
                          const ok = await confirm({
                            title: activating ? "تفعيل حساب الموظف" : "إيقاف حساب الموظف",
                            description: activating
                              ? `تفعيل حساب «${employee.name}»؟ سيتمكن من الدخول للوحة.`
                              : `إيقاف حساب «${employee.name}»؟ لن يتمكن من الدخول للوحة حتى يُعاد تفعيله.`,
                            confirmLabel: activating ? "تفعيل" : "إيقاف",
                            destructive: !activating,
                          });
                          if (ok) changeStatus(employee.id);
                        }}
                      />
                    </PermissionGate>
                  </td>
                  {showActionsColumn && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <PermissionGate section={PERMISSION_SECTIONS.employees} action="view">
                          <Link href={`/home/roles-and-employees/employees/${employee.id}`}>
                            <OutlineActionButton variant="view">عرض</OutlineActionButton>
                          </Link>
                        </PermissionGate>
                        <PermissionGate section={PERMISSION_SECTIONS.employees} action="edit">
                          <AddNewEmployeeDialog
                            isEdit
                            employee={employee}
                            table
                            triggerVariant="outline-edit"
                          />
                        </PermissionGate>
                        <PermissionGate section={PERMISSION_SECTIONS.employees} action="delete">
                          <DeleteEmployeeDialog employee={employee} triggerVariant="outline-delete" />
                        </PermissionGate>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-10 text-gray-400 text-sm">
                  لا يوجد موظفين حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        pagination={pagination}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
