'use client'
import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { axiosInstance } from '@/src/utils/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Loader from '@/components/home/loader'
import { cn } from '@/lib/utils'
import {
    RoleActivateAllToggle,
    RoleFormFields,
    RoleFormPageHeader,
    RoleFormSection,
    RolePermissionsSection,
} from '@/components/roles/role-form-page'

const FIELD_LABEL =
    "block text-[12.5px] font-bold text-[#3a4b44] dark:text-[#bcd]";

const SELECT_TRIGGER =
    "w-full mt-1.5 h-auto border border-[#d5e3dc] dark:border-[#2c5648] rounded-[9px] px-[11px] py-[9px] text-[13.5px] bg-white dark:bg-[#0f241d] text-[#123] dark:text-[#e6f2ec]";

function buildPermissionMatrix(selectedPermissionNames) {
    const matrix = {};

    selectedPermissionNames.forEach((name) => {
        const dotIndex = name.lastIndexOf('.');
        if (dotIndex === -1) return;
        const section = name.slice(0, dotIndex);
        const action = name.slice(dotIndex + 1);
        if (!matrix[section]) matrix[section] = [];
        matrix[section].push(action);
    });

    return matrix;
}

function permissionNamesFromMatrix(matrix) {
    if (!matrix || typeof matrix !== 'object') return new Set();

    const names = new Set();
    Object.entries(matrix).forEach(([section, actions]) => {
        if (!Array.isArray(actions)) return;
        actions.forEach((action) => names.add(`${section}.${action}`));
    });
    return names;
}

export default function EditRole() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const roleId = searchParams.get('id');

    const [formData, setFormData] = useState({
        name: '',
        title_ar: '',
        description: '',
        color: '#0B5A3C',
        is_active: true,
        employee_id: '',
    });

    const [activateAllPermissions, setActivateAllPermissions] = useState(false);
    const [selectedPermissionNames, setSelectedPermissionNames] = useState(new Set());
    const [formInitialized, setFormInitialized] = useState(false);

    const { data: roleRes, isLoading: roleLoading, isError: roleError } = useQuery({
        queryKey: ['role', roleId],
        queryFn: () => axiosInstance.get(`/admin/roles/${roleId}`).then((res) => res?.data),
        enabled: !!roleId,
    });

    const { data: createRes, isLoading: modulesLoading, isError: modulesError } = useQuery({
        queryKey: ['roles-create'],
        queryFn: () => axiosInstance.get('/admin/roles/create').then((res) => res?.data),
        enabled: !!roleId,
    });

    const { data: employeesRes } = useQuery({
        queryKey: ['employees-list-role'],
        queryFn: () =>
            axiosInstance.get('/admin/employees?per_page=200').then((res) => res?.data),
        enabled: !!roleId,
    });

    const role = roleRes?.data ?? roleRes;
    const modules = useMemo(() => createRes?.data?.permission_modules ?? [], [createRes?.data?.permission_modules]);
    const employees = employeesRes?.data?.items ?? employeesRes?.items ?? [];

    const allPermissionNames = useMemo(
        () => modules.flatMap((module) => module.actions.map((action) => action.permission_name)),
        [modules]
    );

    // Seed the form once, as soon as both the role and the permission modules are loaded.
    if (!formInitialized && roleId && role && modules.length) {
        const permissionNames = permissionNamesFromMatrix(role.permission_matrix);

        setSelectedPermissionNames(permissionNames);
        setActivateAllPermissions(
            role.is_full_access === true ||
            (allPermissionNames.length > 0 &&
                allPermissionNames.every((name) => permissionNames.has(name)))
        );
        setFormData({
            name: role.name || '',
            title_ar: role.title_ar || role.title_trans || '',
            description: role.description || '',
            color: role.color || '#0B5A3C',
            is_active: role.is_active ?? true,
            employee_id: role.employee_id ? String(role.employee_id) : '',
        });
        setFormInitialized(true);
    }

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleActivateAll = (checked) => {
        setActivateAllPermissions(checked);
        if (checked) {
            setSelectedPermissionNames(new Set(allPermissionNames));
            return;
        }
        setSelectedPermissionNames(new Set());
    };

    const handleSelectAll = () => {
        handleActivateAll(true);
    };

    const handlePermissionChange = (permissionName) => {
        setActivateAllPermissions(false);
        setSelectedPermissionNames((prev) => {
            const next = new Set(prev);
            if (next.has(permissionName)) {
                next.delete(permissionName);
            } else {
                next.add(permissionName);
            }
            return next;
        });
    };

    const { mutate: updateRole, isPending } = useMutation({
        mutationFn: () => {
            const permission_matrix = activateAllPermissions
                ? buildPermissionMatrix(allPermissionNames)
                : buildPermissionMatrix(selectedPermissionNames);

            return axiosInstance.post(`/admin/roles/${roleId}`, {
                title_ar: formData.title_ar.trim(),
                title_en: role?.title_en || null,
                description: formData.description.trim() || null,
                is_active: formData.is_active,
                employee_id: formData.employee_id ? Number(formData.employee_id) : null,
                activate_all_permissions: activateAllPermissions,
                permission_matrix,
            });
        },
        onSuccess: (res) => {
            toast.success(res?.data?.message || 'تم تعديل الدور بنجاح');
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['roles-list'] });
            queryClient.invalidateQueries({ queryKey: ['role', roleId] });
            queryClient.invalidateQueries({ queryKey: ['roles-create'] });
            router.push('/home/roles-and-employees?tab=roles');
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                'حدث خطأ أثناء تعديل الدور'
            );
        },
    });

    const handleSubmit = () => {
        if (!formData.title_ar.trim()) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!activateAllPermissions && selectedPermissionNames.size === 0) {
            toast.error('يرجى تحديد صلاحية واحدة على الأقل');
            return;
        }

        updateRole();
    };

    if (!roleId) {
        return (
            <div className="p-6 text-center text-status-danger dark:text-red-400" dir="rtl">
                معرف الدور غير موجود.
                <button
                    type="button"
                    onClick={() => router.push('/home/roles-and-employees?tab=roles')}
                    className="block mx-auto mt-4 text-brand-main font-bold dark:text-emerald-400"
                >
                    العودة للأدوار
                </button>
            </div>
        );
    }

    if (roleLoading || modulesLoading || !formInitialized) {
        return <Loader />;
    }

    if (roleError || modulesError) {
        return (
            <div className="p-6 text-center text-status-danger dark:text-red-400" dir="rtl">
                تعذر تحميل بيانات الدور.
                <button
                    type="button"
                    onClick={() => router.push('/home/roles-and-employees?tab=roles')}
                    className="block mx-auto mt-4 text-brand-main font-bold dark:text-emerald-400"
                >
                    العودة للأدوار
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 min-h-full dark:text-white" dir="rtl">
            <RoleFormPageHeader
                title="تعديل دور"
                onSave={handleSubmit}
                isSaving={isPending}
            />

            <RoleFormSection title="بيانات الدور">
                <RoleFormFields
                    formData={formData}
                    onChange={handleFieldChange}
                    nameReadOnly
                    disabled={isPending}
                    extraFields={
                        <>
                            <div className={FIELD_LABEL}>
                                الموظف المرتبط
                                <Select
                                    value={formData.employee_id || "none"}
                                    onValueChange={(value) =>
                                        handleFieldChange("employee_id", value === "none" ? "" : value)
                                    }
                                    disabled={isPending}
                                    dir="rtl"
                                >
                                    <SelectTrigger className={SELECT_TRIGGER}>
                                        <SelectValue placeholder="بدون موظف" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-[#0F1C16] dark:border-white/10">
                                        <SelectItem value="none">بدون موظف</SelectItem>
                                        {employees.map((employee) => (
                                            <SelectItem key={employee.id} value={String(employee.id)}>
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className={FIELD_LABEL}>
                                حالة الدور
                                <div className="mt-1.5 flex items-center justify-between border border-[#d5e3dc] dark:border-[#2c5648] rounded-[9px] px-[11px] py-[9px] bg-white dark:bg-[#0f241d]">
                                    <span className={cn(
                                        "text-[13px] font-bold",
                                        formData.is_active ? "text-green-700 dark:text-emerald-400" : "text-status-neutral dark:text-white/45"
                                    )}>
                                        {formData.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => handleFieldChange("is_active", checked)}
                                        disabled={isPending}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </>
                    }
                />
                <RoleActivateAllToggle
                    checked={activateAllPermissions}
                    onChange={handleActivateAll}
                    disabled={modules.length === 0 || isPending}
                />
            </RoleFormSection>

            <RolePermissionsSection
                modules={modules}
                selectedPermissionNames={selectedPermissionNames}
                onPermissionChange={handlePermissionChange}
                onSelectAll={handleSelectAll}
                activateAllPermissions={activateAllPermissions}
                isPending={isPending}
                isError={modulesError}
            />
        </div>
    )
}
