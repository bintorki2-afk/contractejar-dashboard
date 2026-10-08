import { DRAFT_CONTRACT_STATUSES_QUERY_KEY } from "@/src/lib/draft-contract-statuses";
import { CONTRACT_STATUSES_ACTIVE_QUERY_KEY } from "@/src/lib/contract-statuses";

/** List / analysis query roots that can go stale after an order mutation. */
const ORDER_LIST_ROOTS = [
  "orders",
  "completedOrders",
  "receivedOrders",
  "canceledOrders",
  "reliableOrders",
  "draftCompletedOrders",
  "returnOrders",
  "contractPaidByEmployees",
  "inCompletedOrders",
  "orders-whatsapp-completed",
  "orders-whatsapp-incompleted",
  "realtime-new-orders",
  "realtime-orders",
  "all-orders",
  "client-orders",
];

function toKey(queryKey) {
  if (!queryKey) return null;
  return Array.isArray(queryKey) ? queryKey : [queryKey];
}

/**
 * Mark matching queries stale and refetch them — including inactive ones —
 * so navigating back to a page does not show a cached pre-mutation snapshot.
 */
function invalidate(queryClient, queryKey) {
  const key = toKey(queryKey);
  if (!key) return;
  queryClient.invalidateQueries({
    queryKey: key,
    refetchType: "all",
  });
}

function invalidateSingleOrder(queryClient, orderId) {
  if (orderId == null || orderId === "") return;
  invalidate(queryClient, ["single-order", orderId]);
  const asString = String(orderId);
  if (asString !== orderId) {
    invalidate(queryClient, ["single-order", asString]);
  }
}

/**
 * Refresh regular order lists, tab counts, and optional detail cache.
 * Call after contract-status change, delete, accept, etc.
 */
export function invalidateOrdersCaches(queryClient, { queryKey, orderId } = {}) {
  for (const root of ORDER_LIST_ROOTS) {
    invalidate(queryClient, [root]);
  }

  invalidate(queryClient, ["orders-all-total"]);
  invalidate(queryClient, ["order-status-count"]);
  invalidate(queryClient, ["unReceivedOrders"]);
  invalidate(queryClient, ["unReceivedOrdersTotal"]);
  invalidate(queryClient, ["orders-attention"]);
  invalidate(queryClient, ["orders-status-counts"]);
  invalidate(queryClient, ["dashboard-analytics-quick"]);

  invalidateSingleOrder(queryClient, orderId);
  invalidate(queryClient, queryKey);
}

/**
 * Refresh draft lists, draft tab counts, and optional status definitions.
 */
export function invalidateDraftOrdersCaches(
  queryClient,
  { queryKey, orderId, includeStatusDefinitions = false } = {}
) {
  invalidate(queryClient, ["draftContracts"]);
  invalidate(queryClient, ["draftCompletedOrders"]);
  invalidate(queryClient, ["draft-orders-all-total"]);
  invalidate(queryClient, ["draft-order-status-count"]);

  if (includeStatusDefinitions) {
    invalidate(queryClient, [DRAFT_CONTRACT_STATUSES_QUERY_KEY]);
    invalidate(queryClient, ["draft-contract-statuses-active"]);
  }

  invalidateSingleOrder(queryClient, orderId);
  invalidate(queryClient, queryKey);
}

/**
 * Refresh refund / return flows plus the underlying order caches.
 */
export function invalidateRefundCaches(queryClient, { queryKey, orderId } = {}) {
  invalidateOrdersCaches(queryClient, { queryKey, orderId });
  invalidate(queryClient, ["refundContracts"]);
  invalidate(queryClient, ["refundContractsLookup"]);
  invalidate(queryClient, ["returnedOrdersTotal"]);
  invalidate(queryClient, ["returnOrders"]);
  invalidate(queryClient, ["status"]);
}

/**
 * After creating/editing/deleting contract status definitions.
 * Status labels/colors appear on lists and count tabs.
 */
export function invalidateContractStatusCaches(queryClient) {
  invalidate(queryClient, ["status"]);
  invalidate(queryClient, [CONTRACT_STATUSES_ACTIVE_QUERY_KEY]);
  invalidateOrdersCaches(queryClient);
}

/**
 * Invalidate a settings/resource family by root key (all tabs/filters).
 * Prefer this over `["key", activeTab]` so sibling tabs stay fresh.
 */
export function invalidateQueryRoot(queryClient, root, extraKeys = []) {
  invalidate(queryClient, [root]);
  for (const key of extraKeys) {
    invalidate(queryClient, toKey(key));
  }
}
