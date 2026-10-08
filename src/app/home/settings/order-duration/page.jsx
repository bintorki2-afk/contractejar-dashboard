"use client";

import {
  useUnwrapPageProps
} from "@/src/hooks/use-unwrap-page-props";
import AddNewDurationDialog from "@/components/analysis/settings/order-duration/add-new-duration-dialog";
import EditDurationDialog from "@/components/analysis/settings/order-duration/edit-duration-dialog";
import ViewDurationDialog from "@/components/analysis/settings/order-duration/view-duration-dialog";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  SettingsEmptyRow,
  SettingsLoadingRows,
  SettingsListHeader,
  SettingsTable,
  SettingsTableRow,
  SettingsTd,
  SettingsPageShell,
  StatusBadge,
} from "@/components/system-settings/shared";
import { fetchBothContractTypes } from "@/components/system-settings/settings-list/fetch-contract-type-lists";
import {
  formatContractPeriodPrice,
  getContractPeriodLabel,
  getContractTypeLabel,
  normalizeContractPeriods,
} from "@/src/lib/contract-period-utils";
import { getInstrumentTypeLabel } from "@/src/lib/instrument-types";
import { useQuery } from "@tanstack/react-query";

const HEADERS = [
  "الاسم",
  { label: "نوع العقد", className: "text-center" },
  { label: "تصنيف الوثيقة", className: "text-center" },
  { label: "المدة (شهر)", className: "text-center" },
  { label: "السعر", className: "text-center" },
  { label: "الحالة", className: "text-center" },
  { label: "الإجراءات", className: "text-left" },
];

const COLUMNS = HEADERS.length;

function isActivePeriod(item) {
  const value = item?.is_active;
  if (value === undefined || value === null) return true;
  return value === true || value === 1 || value === "1" || value === "true";
}

export default function OrderDurationPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  const { data = [], isLoading } = useQuery({
    queryKey: ["contract-periods"],
    queryFn: () =>
      fetchBothContractTypes("/admin/contract-periods", (res) =>
        normalizeContractPeriods(res?.data)
      ),
  });

  return (
    <SettingsPageShell>
      <SettingsListHeader
        title="مدة الطلب"
        action={
          <PermissionGate section={PERMISSION_SECTIONS.contract_periods} action="create">
            <AddNewDurationDialog />
          </PermissionGate>
        }
      />

      <SettingsTable headers={HEADERS} minWidth="980px">
        {isLoading ? (
          <SettingsLoadingRows colSpan={COLUMNS} />
        ) : data.length === 0 ? (
          <SettingsEmptyRow colSpan={COLUMNS} />
        ) : (
          data.map((item) => (
            <SettingsTableRow key={item.id}>
              <SettingsTd>{getContractPeriodLabel(item)}</SettingsTd>
              <SettingsTd className="text-center">
                {getContractTypeLabel(item.contract_type)}
              </SettingsTd>
              <SettingsTd className="text-center">
                {getInstrumentTypeLabel(item.instrument_type)}
              </SettingsTd>
              <SettingsTd className="text-center tabular-nums">
                {item?.months != null && item.months !== "" ? item.months : "—"}
              </SettingsTd>
              <SettingsTd className="text-center tabular-nums">
                {formatContractPeriodPrice(item?.price) || "—"}
              </SettingsTd>
              <SettingsTd className="text-center">
                <StatusBadge active={isActivePeriod(item)} />
              </SettingsTd>
              <SettingsTd>
                <div className="flex items-center justify-end gap-2">
                  <ViewDurationDialog duration={item} />
                  <PermissionGate section={PERMISSION_SECTIONS.contract_periods} action="edit">
                    <EditDurationDialog duration={item} />
                  </PermissionGate>
                </div>
              </SettingsTd>
            </SettingsTableRow>
          ))
        )}
      </SettingsTable>
    </SettingsPageShell>
  );
}
