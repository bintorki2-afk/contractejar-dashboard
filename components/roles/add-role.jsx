'use client'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { axiosInstance } from '@/src/utils/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Loader from '@/components/home/loader'
import {
    RoleActivateAllToggle,
    RoleFormFields,
    RoleFormPageHeader,
    RoleFormSection,
    RolePermissionsSection,
} from '@/components/roles/role-form-page'

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

export default function AddRole() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        title_ar: '',
        description: '',
        color: '#0B5A3C',
    });

    const [activateAllPermissions, setActivateAllPermissions] = useState(false);
    const [selectedPermissionNames, setSelectedPermissionNames] = useState(new Set());

    const { data, isLoading, isError } = useQuery({
        queryKey: ['roles-create'],
        queryFn: () =>
            axiosInstance.get('/admin/roles/create').then((res) => res?.data),
    });

    const modules = useMemo(() => data?.data?.permission_modules ?? [], [data?.data?.permission_modules]);

    const allPermissionNames = useMemo(
        () => modules.flatMap((module) => module.actions.map((action) => action.permission_name)),
        [modules]
    );

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

    const { mutate: saveRole, isPending } = useMutation({
        mutationFn: () => {
            const permission_matrix = activateAllPermissions
                ? buildPermissionMatrix(allPermissionNames)
                : buildPermissionMatrix(selectedPermissionNames);

            return axiosInstance.post('/admin/roles', {
                name: formData.name.trim(),
                title_ar: formData.title_ar.trim(),
                title_en: null,
                description: formData.description.trim() || null,
                is_active: true,
                employee_id: null,
                activate_all_permissions: activateAllPermissions,
                permission_matrix,
            });
        },
        onSuccess: (res) => {
            toast.success(res?.data?.message || 'تم إضافة الدور بنجاح');
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['roles-list'] });
            queryClient.invalidateQueries({ queryKey: ['roles-create'] });
            router.push('/home/roles-and-employees?tab=roles');
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                'حدث خطأ أثناء إضافة الدور'
            );
        },
    });

    const handleSubmit = () => {
        if (!formData.name.trim() || !formData.title_ar.trim()) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (!activateAllPermissions && selectedPermissionNames.size === 0) {
            toast.error('يرجى تحديد صلاحية واحدة على الأقل');
            return;
        }

        saveRole();
    };

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="flex flex-col gap-3 min-h-full dark:text-white" dir="rtl">
            <RoleFormPageHeader
                title="إضافة دور"
                onSave={handleSubmit}
                isSaving={isPending}
            />

            <RoleFormSection title="بيانات الدور">
                <RoleFormFields
                    formData={formData}
                    onChange={handleFieldChange}
                    disabled={isPending}
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
                isError={isError}
            />
        </div>
    )
}
