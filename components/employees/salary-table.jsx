"use client";

import React from 'react'
import { Wallet } from 'lucide-react';
import { TablePagination, useClientPagination } from '@/components/roles-and-employees/shared';

export default function SalaryTable({ salaries }) {
  /*-------------------------------------------------------------------------------------*/
  // table headers
  const tableHeaders = [
    "تاريخ الإضافة",
    "تاريخ الاستحقاق",
    "الراتب الأساسي",
    "الخصم",
    "المكافأة",
    "المجموع",
  ];

  const rows = Array.isArray(salaries) ? salaries : [];
  const { pageItems, currentPage, setCurrentPage, pagination, total } =
    useClientPagination(rows, 8);

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-EG-u-nu-latn", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className='mt-4'>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-brand-main">سجل الرواتب والمكافآت</h2>
        {total > 0 && (
          <span className="rounded-full bg-brand-main/10 px-2 py-0.5 text-11 font-bold text-brand-main">
            {total}
          </span>
        )}
      </div>
      <div className="w-full overflow-x-auto bg-white rounded-3xl border border-neutral-200 mt-4 shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              {tableHeaders.map((header, index) => (
                <th key={index} className="text-right p-[15px_20px] text-ink-placeholder text-13 font-medium border-b border-neutral-200 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.length > 0 ? (
              pageItems.map((salary) => (
                <tr key={salary.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-all">
                  <td className="p-[15px_20px]">
                    <span className='text-black text-xs'>{formatDate(salary.addition_date)}</span>
                  </td>
                  <td className='p-[15px_20px]'>
                    <span className='text-black text-xs'>{formatDate(salary.due_date)}</span>
                  </td>
                  <td className="p-[15px_20px]">
                    <div className="flex items-center gap-1.5 text-brand-hover font-bold text-13">
                      <span>{parseFloat(salary.basic_salary || 0).toLocaleString('ar-EG-u-nu-latn')}</span>
                    </div>
                  </td>
                  <td className="p-[15px_20px]">
                    <div className="flex items-center gap-1.5 text-red-500 font-bold text-13">
                      <span>{parseFloat(salary.deduction || 0).toLocaleString('ar-EG-u-nu-latn')}</span>
                    </div>
                  </td>
                  <td className="p-[15px_20px]">
                    <div className="flex items-center gap-1.5 text-green-600 font-bold text-13">
                      <span>{parseFloat(salary.bonus || 0).toLocaleString('ar-EG-u-nu-latn')}</span>
                    </div>
                  </td>
                  <td className='p-[15px_20px]'>
                    <div className="flex items-center gap-1.5 text-brand-main font-bold text-13">
                      <span>{parseFloat(salary.total || 0).toLocaleString('ar-EG-u-nu-latn')}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-placeholder">
                    <Wallet className="size-7 opacity-40" />
                    <span className="text-sm">لا يوجد سجل رواتب للموظف حاليًا.</span>
                  </div>
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
  )
}
