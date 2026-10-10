"use client";

import { Check, Copy, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'
import { toast } from 'sonner';
import { TablePagination, useClientPagination } from '@/components/roles-and-employees/shared';

export default function ContractEmployeeTable({ receivedContracts = [], refundableContracts = [] }) {
  const router = useRouter();
  /*-------------------------------------------------------------------------------------*/
  // table headers
  const tableHeaders = [
    "رقم العقد",
    "جوال العميل",
    "نوع العقد",
    "الدفع / المبلغ",
    "الحالة",
  ];

  const allContracts = [
    ...(receivedContracts || []).map(c => ({ ...c, kind: 'received' })),
    ...(refundableContracts || []).map(c => ({ ...c, kind: 'refundable' }))
  ];

  const { pageItems, currentPage, setCurrentPage, pagination, total } =
    useClientPagination(allContracts, 8);

  const getLinkId = (item) =>
    item.contract?.id ?? item.contract_id ?? item.id ?? null;

  const goToContract = (item) => {
    const linkId = getLinkId(item);
    if (linkId != null) router.push(`/home/orders/${linkId}`);
  };

  return (
    <div className='mt-4'>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-brand-main">العقود التي وثّقها الموظف</h2>
        <span className="rounded-full bg-brand-main/10 px-2 py-0.5 text-11 font-bold text-brand-main">
          {total}
        </span>
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
              pageItems.map((item, index) => {
                const contractId = item.contract_id || item.id || "---";
                const phone = item.contract?.user?.phone || item.user?.phone || "---";
                const typeLabel = item.kind === 'refundable' ? 'استرجاع طلب' : 'توثيق عقد';
                const amount = item.refund_amount || item.contract?.amount || "---";
                const statusLabel = item.admin_confirmed ? "تم التوكيد" : "قيد المعالجة";
                const linkId = getLinkId(item);
                const clickable = linkId != null;

                return (
                  <tr
                    key={index}
                    onClick={clickable ? () => goToContract(item) : undefined}
                    className={`border-b border-neutral-100 last:border-0 transition-all hover:bg-neutral-50 ${clickable ? 'cursor-pointer' : ''}`}
                  >
                    <td className="p-[15px_20px]">
                      <div className='flex items-center gap-2'>
                        <span className='text-black text-xs'>{contractId}</span>
                        {contractId !== "---" && (
                          <Copy onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(String(contractId))
                            toast.success("تم نسخ رقم العقد")
                          }} size={14} className='text-black cursor-pointer' />
                        )}
                      </div>
                    </td>
                    <td className='p-[15px_20px]'>
                      <div className='flex items-center gap-2'>
                        <span className='text-black text-xs' dir="ltr">{phone}</span>
                        {phone !== "---" && (
                          <Copy onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(phone)
                            toast.success("تم نسخ رقم الجوال")
                          }} size={14} className='text-black cursor-pointer' />
                        )}
                      </div>
                    </td>
                    <td className="p-[15px_20px]">
                      <div className="flex items-center gap-1.5 ">
                        <span className={`text-xs p-2 rounded ${item.kind === 'refundable' ? 'bg-amber-600/20 text-amber-700' : 'bg-blue-600/20 text-blue-600'}`}>
                          {typeLabel}
                        </span>
                      </div>
                    </td>
                    <td className="p-[15px_20px]">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-13">
                        <span>{amount !== "---" ? parseFloat(amount).toLocaleString('ar-EG-u-nu-latn') : "---"}</span>
                        {item.admin_confirmed && <Check size={14} className='text-green-600' />}
                      </div>
                    </td>
                    <td className='p-[15px_20px]'>
                      <div className="flex items-center gap-1.5 ">
                        <span className={`text-xs rounded p-2 ${item.admin_confirmed ? 'bg-green-600/20 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink-placeholder">
                    <FileText className="size-7 opacity-40" />
                    <span className="text-sm">لا عقود مرتبطة بهذا الموظف حاليًا.</span>
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
