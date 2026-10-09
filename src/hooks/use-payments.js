"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";

export const PAYMENTS_API = "/admin/payments";
export const PAYMENTS_QUERY_KEY = "invoices-payments";

/** Confirmed shape: `{ data: { items, pagination } }` — see src/app/home/settings/payments/page.jsx. */
function normalizePaymentsResponse(response) {
  const body = response?.data ?? response;
  const payload = body?.data ?? body;
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const pagination = payload?.pagination ?? {};

  return {
    items,
    meta: {
      currentPage: pagination.current_page ?? 1,
      lastPage: pagination.last_page ?? 1,
      total: pagination.total ?? items.length,
      perPage: pagination.per_page ?? items.length,
    },
  };
}

const PAYMENT_METHOD_LABEL = {
  creditcard: "بطاقة ائتمان",
  moyasar: "ميسر",
  bank_transfer: "حوالة بنكية",
  mada: "مدى",
  apple_pay: "Apple Pay",
  stc_pay: "stc pay",
  test: "بوابة تجريبية",
};

/** نوع العملية (دفعة هـ — 2.7): أصلية / فرق سعر / رسوم إضافية / حوالة بنكية / استرجاع. */
export const PAYMENT_KIND_LABEL = {
  original: "الدفعة الأصلية",
  price_difference: "فرق سعر",
  extra_fee: "رسوم إضافية",
  bank_transfer: "حوالة بنكية",
  refund: "استرجاع",
};

function formatPaymentDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = String(dateStr).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

/** Maps a raw `/admin/payments` row to the invoices table row shape. */
export function mapPaymentToInvoiceRow(payment = {}) {
  const user = payment.user ?? null;

  return {
    id: payment.id,
    invoiceNo: `INV-${payment.id}`,
    orderNo: payment.contract_uuid || "—",
    customerName: user?.name?.trim() || null,
    mobile: payment.user_mobile || user?.mobile || "—",
    contractType: payment.contract_type || null,
    amount: Number(payment.amount) || 0,
    currency: payment.tran_currency || "SAR",
    source: PAYMENT_METHOD_LABEL[payment.payment_method] || payment.payment_method || "—",
    kind: payment.kind || "original",
    kindLabel: payment.kind_label || PAYMENT_KIND_LABEL[payment.kind || "original"] || payment.kind || "—",
    chargeId: payment.charge_id ?? null,
    contractId: payment.contract_id ?? null,
    reference: payment.reference ?? null,
    receiptUrl: payment.receipt_url ?? null,
    status: payment.status || "unknown",
    date: formatPaymentDate(payment.payment_date),
    referenceNo: payment.contract_uuid || String(payment.id),
    raw: payment,
  };
}

/**
 * Fetches the full payments list (not paginated) so search/status/type filters can
 * apply across every record. The backend caps `per_page` in practice around a few
 * hundred rows, which comfortably covers the invoices dataset; pagination in the UI
 * is then done client-side over the filtered rows.
 */
export function usePaymentsList({ perPage = 500, period } = {}) {
  const params = { page: 1, per_page: perPage };
  if (period) params.filter = period;

  const query = useQuery({
    queryKey: [PAYMENTS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get(PAYMENTS_API, { params });
      return normalizePaymentsResponse(res);
    },
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];

  return {
    rows: items.map(mapPaymentToInvoiceRow),
    total: query.data?.meta?.total ?? items.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
