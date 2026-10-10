import { parseFirebasePayload } from "@/src/lib/firebase/push-payload";
import { shouldHandlePushPayload } from "@/src/lib/firebase/push-dedupe";
import { showFirebasePushToast } from "@/src/lib/firebase/show-firebase-push-toast";
import { invalidateOrdersCaches } from "@/src/lib/invalidate-orders-caches";

function runNotificationSideEffects(parsed, { queryClient, sidebarStore, router } = {}, { navigate = false } = {}) {
  if (!queryClient || !sidebarStore) return;

  const { isComment, isOrderNotification, orderId } = parsed;

  // دفعة هـ (D-1): أي دفعة Push للموظف (charge_paid / data_request_resolved…) تُحدّث عدّاد الجرس فوراً بدل انتظار الاستطلاع.
  queryClient.invalidateQueries({ queryKey: ["employee-notifications"] });

  if (isComment) {
    if (orderId) {
      sidebarStore.setOrderId(String(orderId));
      queryClient.invalidateQueries({
        queryKey: ["orderComments", String(orderId)],
      });
    }

    sidebarStore.setDisplayedPart("comments");

    if (navigate && orderId && router) {
      router.push(`/home/orders/${orderId}`);
    }
    return;
  }

  if (isOrderNotification) {
    invalidateOrdersCaches(queryClient, { orderId });
    sidebarStore.setDisplayedPart("notification");

    if (navigate && orderId && router) {
      router.push(`/home/orders/${orderId}`);
    }
  }
}

export function handleFirebasePushPayload(payload, deps = {}) {
  if (!shouldHandlePushPayload(payload)) return;

  const parsed = parseFirebasePayload(payload);

  showFirebasePushToast(payload, {
    onAction: () => runNotificationSideEffects(parsed, deps, { navigate: true }),
  });

  runNotificationSideEffects(parsed, deps, { navigate: false });
}
