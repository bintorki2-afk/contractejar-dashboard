'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/src/utils/axios';
import { isAllOrdersListPath } from '@/src/lib/order-routes';
import { useSidebarStore } from '@/src/stores/sidebar-store';

const POLL_INTERVAL = 30_000;

// دفعة د: «بانتظار الاستلام» = طلبات مدفوعة لم يستلمها موظف (لوحة الانتباه في الخادم)،
// لا «جديد» برقم حالة ثابت (كان يعدّ الطلبات غير المدفوعة أيضاً).
export const fetchUnreceivedOrdersTotal = async () => {
  try {
    const response = await axiosInstance.get('/admin/orders/attention', { params: { limit: 1 } });
    const count = response?.data?.data?.counts?.awaiting_receive;
    if (typeof count === 'number') return count;
  } catch {
    // احتياط لخادم أقدم بلا /attention
  }
  const response = await axiosInstance.get('/admin/orders?is_received=0&complete=1&per_page=1&page=1');
  return response?.data?.data?.pagination?.total ?? 0;
};

function openNotificationsSidebar({ queryClient, setDisplayedPart }) {
  queryClient.invalidateQueries({ queryKey: ['unReceivedOrders'] });
  setDisplayedPart('notification');
}

// Polls unreceived-orders count and opens the notification sidebar on the
// جميع الطلبات page (`/home/orders`) only when a NEW order arrives (count grows) —
// not on every visit (it used to cover the list on page load).
export function useUnreceivedOrdersWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setDisplayedPart } = useSidebarStore();
  const previousTotalRef = useRef(null);
  const tab = searchParams.get('tab');
  const isAllOrdersPage = isAllOrdersListPath(pathname) && (!tab || tab === 'all');

  const { data: total } = useQuery({
    queryKey: ['unReceivedOrdersTotal'],
    queryFn: fetchUnreceivedOrdersTotal,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (total === undefined) return;

    const previousTotal = previousTotalRef.current;
    if (
      isAllOrdersPage &&
      previousTotal !== null &&
      total > previousTotal
    ) {
      openNotificationsSidebar({ queryClient, setDisplayedPart });
    }
    previousTotalRef.current = total;
  }, [isAllOrdersPage, total, queryClient, setDisplayedPart]);

  return total ?? 0;
}
