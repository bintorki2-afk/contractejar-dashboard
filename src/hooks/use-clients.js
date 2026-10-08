"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosInstance } from "@/src/utils/axios";
import { normalizeAdminSearch } from "@/src/lib/search-term";

export const CLIENTS_API = "/admin/users";
export const CLIENTS_QUERY_KEY = "clients";
export const CLIENT_QUERY_KEY = "client";

function unwrapData(response) {
  const body = response?.data ?? response;
  return body?.data ?? body;
}

/**
 * `/admin/users` reuses the "Users Analysis" endpoints (see
 * components/analysis/UsersAnalysis/*) — no dedicated `/admin/clients*` namespace exists.
 * Confirmed shape (2026-08-23, after the backend fix): `{ data: { summary, items, pagination } }`.
 */
export function normalizeClientsListResponse(response) {
  const payload = unwrapData(response);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const pagination = payload?.pagination ?? {};

  return {
    items,
    summary: payload?.summary ?? null,
    meta: {
      currentPage: pagination.current_page ?? 1,
      lastPage: pagination.last_page ?? 1,
      total: pagination.total ?? items.length,
      perPage: pagination.per_page ?? items.length,
    },
  };
}

/** Maps a raw `users` row (as returned by UserController@allusers/show) to the client table shape. */
export function mapUserToClientRow(user = {}) {
  const paid = Number(user.total_paid_amount ?? user.paid) || 0;
  const refunded = Number(user.refunded_amount ?? user.refunded) || 0;

  return {
    id: user.id,
    clientCode: user.customer_number || (user.id != null ? `#${user.id}` : "—"),
    name: user.full_name || user.name || "—",
    mobile: user.mobile || user.phone || "—",
    email: user.email || null,
    photo: user.photo_path || null,
    joinedAt: user.joined_at || user.created_at || null,
    platform: user.platform || null,
    platformLabel: user.platform_label || null,
    completed: user.completed_orders_count ?? user.completed ?? 0,
    draft: user.draft_orders_count ?? user.draft ?? 0,
    incomplete: user.incomplete_orders_count ?? user.uncompleted_orders_count ?? 0,
    // دفعة د (د2): نفس عدّادات GET /admin/orders?user_id= و status-counts?user_id=
    ordersCount: user.orders_count ?? (user.completed_orders_count ?? 0) + (user.incomplete_orders_count ?? 0),
    incompleteDrafts: user.incomplete_drafts_count ?? 0,
    properties: user.real_estate_count ?? user.properties_count ?? user.real_estates ?? 0,
    units: user.units_count ?? user.units ?? 0,
    refundedAmount: refunded,
    paid,
    net: Number(user.net_amount ?? user.net ?? paid - refunded) || 0,
    blocked: Boolean(user.is_banned),
    contracts: user.contracts ?? [],
    raw: user,
  };
}

export function useClientsList({ page = 1, perPage = 25, search = "" } = {}) {
  const params = { page, per_page: perPage };
  const term = normalizeAdminSearch(search);
  if (term) params.search = term;

  const query = useQuery({
    queryKey: [CLIENTS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await axiosInstance.get(CLIENTS_API, { params });
      return normalizeClientsListResponse(res);
    },
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];

  return {
    rows: items.map(mapUserToClientRow),
    meta: query.data?.meta ?? { currentPage: page, lastPage: 1, total: 0, perPage },
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** `GET /admin/users/{id}` — confirmed shape: `{ data: { user: { ...fields, contracts: [...] } } }`. */
export function useClientDetail(clientId) {
  const query = useQuery({
    queryKey: [CLIENT_QUERY_KEY, String(clientId)],
    queryFn: async () => {
      const res = await axiosInstance.get(`${CLIENTS_API}/${clientId}`);
      const payload = unwrapData(res);
      return payload?.user ?? payload;
    },
    enabled: clientId != null && clientId !== "",
  });

  const client = query.data ? mapUserToClientRow(query.data) : null;

  return {
    client,
    contracts: client?.contracts ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function mapRealEstateUnit(unit = {}) {
  return {
    id: unit.id,
    type: unit.unit_type_name || "—",
    number: unit.unit_number || "—",
    area: unit.unit_area || "—",
    floor: unit.floor_number || "—",
    rooms: unit.tootal_rooms || "—",
    usage: unit.unit_usage_name || "—",
  };
}

function mapRealEstateToProperty(realEstate = {}, units = []) {
  return {
    id: realEstate.id,
    title: realEstate.name_real_estate || `عقار #${realEstate.id}`,
    street: realEstate.street || null,
    buildingNumber: realEstate.building_number || null,
    addedAt: realEstate.date_first_registration || null,
    orderId: null,
    propertyName: realEstate.name_real_estate || null,
    documentType: realEstate.instrument_type || null,
    deedNumber: realEstate.instrument_number || null,
    region: null,
    city: realEstate.property_city_name || null,
    district: realEstate.property_place_name || null,
    ownerId: realEstate.national_num || null,
    ownerMobile: realEstate.mobile || null,
    units: units
      .filter((u) => u.real_estates_units_id === realEstate.id)
      .map(mapRealEstateUnit),
  };
}

/** Same `/admin/users/{id}` endpoint as `useClientDetail`, shares its cache — also
 *  exposes `real_estates_list`/`units_list` mapped into property cards. */
export function useClientProperties(clientId) {
  const query = useQuery({
    queryKey: [CLIENT_QUERY_KEY, String(clientId)],
    queryFn: async () => {
      const res = await axiosInstance.get(`${CLIENTS_API}/${clientId}`);
      const payload = unwrapData(res);
      return payload?.user ?? payload;
    },
    enabled: clientId != null && clientId !== "",
  });

  const user = query.data;
  const client = user ? mapUserToClientRow(user) : null;
  const realEstates = user?.real_estates_list ?? [];
  const units = user?.units_list ?? [];

  const properties = realEstates.map((re) => mapRealEstateToProperty(re, units));

  const unassignedUnits = units.filter(
    (u) => !realEstates.some((re) => re.id === u.real_estates_units_id)
  );
  if (unassignedUnits.length > 0) {
    properties.push({
      id: "unassigned",
      title: "وحدات غير مرتبطة بعقار",
      street: null,
      buildingNumber: null,
      addedAt: null,
      orderId: null,
      propertyName: null,
      documentType: null,
      deedNumber: null,
      region: null,
      city: null,
      district: null,
      ownerId: null,
      ownerMobile: null,
      units: unassignedUnits.map(mapRealEstateUnit),
    });
  }

  return {
    client,
    properties,
    totals: {
      properties: realEstates.length,
      units: units.length,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId) => axiosInstance.post(`${CLIENTS_API}/${clientId}/delete`),
    onSuccess: (res, clientId) => {
      toast.success(res?.data?.message || "تم حذف العميل بنجاح");
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
      queryClient.removeQueries({ queryKey: [CLIENT_QUERY_KEY, String(clientId)] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف العميل");
    },
  });
}

export function useBlockClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId) => axiosInstance.post(`${CLIENTS_API}/${clientId}/block`),
    onSuccess: (res, clientId) => {
      toast.success(res?.data?.message || "تم تحديث حالة العميل");
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENT_QUERY_KEY, String(clientId)] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء تحديث حالة العميل");
    },
  });
}
