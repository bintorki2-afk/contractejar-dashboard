"use client";

import { toast } from "sonner";
import { Check, Copy, Wallet, X } from "lucide-react";
import { ContractStepEditor } from "../contract-edit/contract-step-editor";
import {
  LEASE_RENEWAL_CONTRACT_DATE_FIELDS,
  LEASE_RENEWAL_FINANCIAL_FIELDS,
} from "../contract-edit/contract-field-schemas";
import {
  formatDisplayValue,
  isEmptyDisplayValue,
} from "../contract-summary-view";

const MoneyCard = ({ label, value, accent = "border-brand-accent" }) => {
  const empty = isEmptyDisplayValue(value);
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border-r-[3px] ${accent} ${
        empty ? "opacity-45" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Wallet className={`size-5 shrink-0 ${empty ? "text-[#BDBDBD]" : "text-[#3B82F6]"}`} />
        <div className="text-right flex-1 min-w-0">
          <p className="text-11 text-[#9E9E9E] mb-0.5">{label}</p>
          <p
            className={`text-15 font-black ${
              empty ? "text-ink-placeholder" : "text-black"
            }`}
          >
            {formatDisplayValue(value)}
          </p>
        </div>
      </div>
    </div>
  );
};

const InactiveCard = ({ label }) => (
  <div className="bg-[#ECECEC] rounded-2xl p-4 opacity-70 border-r-[3px] border-r-[#BDBDBD]">
    <div className="flex items-center justify-between gap-2">
      <X className="size-5 text-status-danger shrink-0" />
      <p className="text-13 font-bold text-[#9E9E9E] text-right flex-1">{label}</p>
    </div>
  </div>
);

const PermissionCard = ({ label, active }) =>
  active ? (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-r-[3px] border-r-[#9C27B0]">
      <div className="flex items-center justify-between gap-2">
        <Check className="size-5 text-brand-accent shrink-0" />
        <p className="text-13 font-bold text-black text-right flex-1">{label}</p>
      </div>
    </div>
  ) : (
    <InactiveCard label={label} />
  );

export default function LeaseRenewalFinancialTab({ orderData }) {
  const step4 = orderData?.step4 ?? {};
  const step2 = orderData?.step2 ?? {};

  const totalValue =
    step4.contract_term_in_years?.price ||
    step4.annual_rent_amount_for_the_unit ||
    null;

  const electricityMeter =
    step2.electricity_meter_number || step2.electricity_meter || null;
  const waterMeter = step2.water_meter_number || step2.water_meter || null;
  const startDate = step4.contract_starting_date || null;
  const dateType =
    step4.type_contract_starting_date === "hijri"
      ? "هجري"
      : step4.type_contract_starting_date === "gregorian"
        ? "ميلادي"
        : step4.type_contract_starting_date || "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0">
      <div className="bg-[#F4F4F4] rounded-20 p-4 min-w-0 overflow-hidden">
        <ContractStepEditor
          title="البيانات المالية"
          step="step4"
          fields={LEASE_RENEWAL_FINANCIAL_FIELDS}
        >
          <div className="space-y-3">
            <MoneyCard label="إجمالي قيمة العقد" value={totalValue} accent="border-brand-accent" />
            <MoneyCard
              label="طريقة الدفعات"
              value={step4.payment_type_name || "—"}
              accent="border-[#BDBDBD]"
            />
            {electricityMeter ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border-r-[3px] border-r-brand-accent">
                <div className="flex items-start justify-between gap-2">
                  <Check className="size-5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-11 text-[#9E9E9E] mb-1">عداد الكهرباء</p>
                    <div className="flex items-center gap-2 justify-end min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(String(electricityMeter));
                          toast.success("تم النسخ");
                        }}
                        className="text-ink-placeholder hover:text-brand-main shrink-0"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <p className="text-11 font-mono text-black break-all" dir="ltr">
                        {electricityMeter}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InactiveCard label="عداد الكهرباء" />
            )}
            {waterMeter ? (
              <MoneyCard label="عداد المياه" value={waterMeter} accent="border-[#3B82F6]" />
            ) : (
              <InactiveCard label="عداد المياه" />
            )}
          </div>
        </ContractStepEditor>
      </div>

      <div className="bg-[#F4F4F4] rounded-20 p-4 min-w-0 overflow-hidden">
        <ContractStepEditor
          title="مدة العقد"
          step="step4"
          fields={LEASE_RENEWAL_CONTRACT_DATE_FIELDS}
        >
          <div className="space-y-3">
            <MoneyCard label="تاريخ بداية العقد" value={startDate} accent="border-brand-accent" />
            <MoneyCard label="نوع التاريخ" value={dateType} accent="border-[#3B82F6]" />
            <MoneyCard
              label="الغرامة اليومية"
              value={step4.daily_fine || "—"}
              accent="border-[#EF4444]"
            />
          </div>
        </ContractStepEditor>
      </div>

      <div className="bg-[#F4F4F4] rounded-20 p-4 min-w-0 overflow-hidden">
        <ContractStepEditor title="الصلاحيات" step="step4" fields={[]} showEdit={false}>
          <div className="space-y-3">
            <PermissionCard label="التأجير من الباطن" active={Boolean(step4.other_conditions)} />
            <PermissionCard
              label="الترميمات والتحسينات"
              active={Boolean(step4.text_additional_terms)}
            />
            <PermissionCard label="مراجعة الجهات الحكومية" active={false} />
            <PermissionCard label="تعديل الوحدة الإيجارية" active={false} />
          </div>
        </ContractStepEditor>
      </div>

    </div>
  );
}
