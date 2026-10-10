import { isDraftOrderRow } from "@/src/lib/draft-contract-statuses";

export function getContractTypeKey(row = {}) {
  const explicit = row?.contract_type_key;
  if (explicit === "housing" || explicit === "commercial") return explicit;

  const type = String(row?.contract_type ?? row?.contract_type_trans ?? "")
    .trim()
    .toLowerCase();
  if (!type) return "";
  if (type.includes("سكن") || type === "housing") return "housing";
  if (type.includes("تجار") || type === "commercial") return "commercial";
  return "";
}

export function getWaitingMinutes(row = {}) {
  if (row?.waiting_minutes != null && row.waiting_minutes !== "") {
    const parsed = Number(row.waiting_minutes);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }

  const timestamp = row?.created_at || row?.updated_at;
  if (!timestamp) return 0;
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  return Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
}

export function mapRealtimeNewOrder(row = {}) {
  const isDraft = isDraftOrderRow(row);
  const statusName =
    row?.status?.name ||
    row?.contract_status_name ||
    row?.status_name ||
    "جديد";

  return {
    ...row,
    contract_type_key: getContractTypeKey(row),
    status_kind: isDraft ? "draft" : "new",
    status_label: isDraft ? "طلب مسودة" : "طلب جديد",
    waiting_minutes: getWaitingMinutes(row),
    status_id: row?.status?.id ?? row?.contract_status_id ?? row?.status_id,
    status_name: statusName,
  };
}

export function mapRealtimeTableOrder(row = {}) {
  const isDraft = isDraftOrderRow(row);

  return {
    ...row,
    contract_type_key: getContractTypeKey(row),
    is_draft: isDraft,
    user_mobile: row?.user_mobile || row?.user?.mobile || row?.phone,
    instrument_type:
      row?.instrument_type_trans ||
      row?.instrument_type ||
      row?.document_type ||
      row?.track ||
      null,
    employee_name: row?.employee_name || row?.employee?.name,
    // QA DASH-3: «مستلم منذ» فقط لما استُلم فعلاً — لا نستبدله بعمر الطلب.
    received_at: row?.received_at || row?.received_contract?.created_at || null,
    status_id: row?.status?.id ?? row?.contract_status_id ?? row?.status_id,
    status_name:
      row?.status?.name ||
      row?.contract_status_name ||
      row?.status_name ||
      "---",
    status_color:
      row?.status?.color || row?.contract_status_color || row?.status_color,
    status_color_text:
      row?.status?.color_text ||
      row?.contract_status_color_text ||
      row?.status_color_text,
  };
}
