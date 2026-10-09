"use client"
import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import React from 'react'
import Header from '@/components/home/header';
import EmployeeDetailsCard from '@/components/employees/employee-details';
import SalaryTable from '@/components/employees/salary-table';
import NotesTable from '@/components/employees/notes-table';
import ContractEmployeeTable from '@/components/employees/contract-employee-table';
import Loader from '@/components/home/loader';
import { useParams, useSearchParams } from 'next/navigation';
import { axiosInstance } from '@/src/utils/axios';
import { useQuery } from '@tanstack/react-query';

export default function EmployeeDetailsPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  const { id } = useParams()
  const searchParams = useSearchParams()
  const isProfileView = searchParams.get('view') === 'profile'

  function getEmployeeById(id) {
    return axiosInstance.get(`/admin/employees/${id}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err;
      });
  }

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id
  });

  const employee = data?.data || data;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      <Header
        page='welcome'
        title={isProfileView ? "الملف الشخصي" : "الموظفين"}
        isMain={false}
        first="الرئيــسية"
        firstURL="/home"
        second={isProfileView ? "الملف الشخصي" : 'الموظفين والأدوار'}
        secondURL={isProfileView ? `/home/roles-and-employees/employees/${id}?view=profile` : "/home/roles-and-employees?tab=employees"}
        third={isProfileView ? undefined : 'تفاصيل الموظف'}
        thirdURL={isProfileView ? undefined : `/home/roles-and-employees/employees/${id}`}
      />
      <EmployeeDetailsCard employee={employee} readOnly={isProfileView} />
      {!isProfileView && (
        <>
          <SalaryTable salaries={employee?.salaries} />
          <NotesTable notes={employee?.notes} />
          <ContractEmployeeTable receivedContracts={employee?.received_contracts} refundableContracts={employee?.refundable_contracts} />
        </>
      )}
    </div>
  )
}
