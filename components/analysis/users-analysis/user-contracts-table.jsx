"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import SendOrderSmsButton from "@/components/orders/shared/send-order-sms-button";
import {
  getDraftRowHighlightStyle,
  isDraftOrderRow,
} from "@/src/lib/draft-contract-statuses";

export default function UserContractsTable({ contracts = [], userId = null }) {
  const tableHeaders = [
    "رقم الطلب",
    "نوع العقد",
    "المبلغ",
    "حالة الدفع",
    "تاريخ الإنشاء",
    "الحالة",
    "الاستلام",
    "الإجراءات",
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("ar-EG-u-nu-latn", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold">طلبات المستخدم :</h2>
      <div className="w-full overflow-x-auto bg-white rounded-3xl border border-neutral-200 mt-4 shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              {tableHeaders.map((header, index) => (
                <th
                  key={index}
                  className="text-right p-[15px_20px] text-ink-placeholder text-13 font-medium border-b border-neutral-200 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contracts.length > 0 ? (
              contracts.map((contract) => {
                const isDraft = isDraftOrderRow(contract);
                const draftStyle = isDraft
                  ? getDraftRowHighlightStyle("#F59E0B")
                  : undefined;

                return (
                <tr
                  key={contract.id}
                  style={draftStyle}
                  className={`border-b border-neutral-100 last:border-0 transition-all ${
                    isDraft ? "hover:brightness-[0.98]" : "hover:bg-neutral-50"
                  }`}
                >
                  <td className="p-[15px_20px]">
                    <div className="flex flex-col items-start gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-black text-xs font-bold">{contract.uuid || "—"}</span>
                        {contract.uuid && (
                          <Copy
                            onClick={() => {
                              navigator.clipboard.writeText(String(contract.uuid));
                              toast.success("تم نسخ رقم الطلب");
                            }}
                            size={14}
                            className="text-ink-placeholder cursor-pointer hover:text-brand-main"
                          />
                        )}
                      </div>
                      {isDraft ? (
                        <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-10 font-bold text-[#B45309] ring-1 ring-[#F59E0B]/40">
                          مسودة
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-[15px_20px] text-black text-13">{contract.contract_type || "—"}</td>
                  <td className="p-[15px_20px] text-green-600 font-bold text-13">
                    {parseFloat(contract.amount_payment || 0).toLocaleString("ar-EG-u-nu-latn")}
                  </td>
                  <td className="p-[15px_20px]">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        contract.is_paid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {contract.payment_label_ar || "—"}
                    </span>
                  </td>
                  <td className="p-[15px_20px] text-[#616161] text-xs whitespace-nowrap">
                    {formatDate(contract.created_at)}
                  </td>
                  <td className="p-[15px_20px]">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${contract.status?.color || "#eee"}33`,
                        color: contract.status?.color || "#616161",
                      }}
                    >
                      {contract.status?.name || "—"}
                    </span>
                  </td>
                  <td className="p-[15px_20px] text-13 text-[#616161]">
                    {contract.employee_name || "—"}
                  </td>
                  <td className="p-[15px_20px]">
                    <div className="flex items-center gap-2 justify-center">
                      <SendOrderSmsButton
                        userId={userId ?? contract.user_id}
                        order={contract}
                      />
                      <Link
                        href={`/home/orders/${contract.id}`}
                        aria-label="عرض الطلب"
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 text-ink-subtle hover:bg-brand-main hover:text-white transition-all"
                      >
                        <i className="fa-regular fa-eye text-13" />
                      </Link>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="text-center p-8 text-ink-placeholder text-sm">
                  لا يوجد طلبات مرتبطة بهذا المستخدم حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
