/**
 * Mock payload for GET /admin/home (or /admin/dashboard/home).
 * Shape matches docs/home-api-request.md — swap for live API when ready.
 */

export const HOME_MOCK = {
  motto: {
    title: 'الإتقــان طريــق الخلــود في الأثــر',
    body: 'الإتقان ليس في كثرة العمل، بل في صدق النية وجودة الأداء. من يعمل بضمير يترك أثراً لا يُمحى.',
    verse: '﴿لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا﴾',
    footnote: 'العبرة بمعيار الجودة والإحسان، لا بالكثرة والقلة.',
    brand_label: 'عقد إيجار · لوحة الموظفين',
  },

  summary: {
    pending_orders: 24,
    completed_today: 11,
    return_orders: 3,
    new_clients_this_week: 8,
    unreceived_realtime: 5,
    revenue_today: 18450,
    currency: 'SAR',
  },

  quick_actions: [
    {
      id: 'realtime-orders',
      label: 'الطلبات مباشر',
      href: '/home/realtime-orders',
      badge_count: 5,
    },
    {
      id: 'orders',
      label: 'جميع الطلبات',
      href: '/home/orders',
      badge_count: null,
    },
    {
      id: 'clients',
      label: 'العملاء',
      href: '/home/clients',
      badge_count: null,
    },
    {
      id: 'lessor-change',
      label: 'طلبات تغيير المؤجر',
      href: '/home/lessor-change',
      badge_count: null,
    },
    {
      id: 'return-orders',
      label: 'طلبات الاسترجاع',
      href: '/home/return-orders',
      badge_count: 3,
    },
    {
      id: 'reports',
      label: 'التقارير',
      href: '/home/reports',
      badge_count: null,
    },
    {
      id: 'invoices',
      label: 'الفواتير',
      href: '/home/invoices',
      badge_count: null,
    },
  ],

  recent_activity: [
    {
      id: 1,
      type: 'order_completed',
      title: 'اكتمل طلب عقد إيجار سكني',
      subtitle: 'طلب #4821 · العميل: سارة الحربي',
      href: '/home/orders/4821',
      created_at: '2026-08-25T09:42:00+03:00',
    },
    {
      id: 2,
      type: 'return_requested',
      title: 'طلب استرجاع جديد',
      subtitle: 'طلب #4790 · بانتظار المراجعة',
      href: '/home/return-orders',
      created_at: '2026-08-25T08:15:00+03:00',
    },
    {
      id: 3,
      type: 'client_registered',
      title: 'عميل جديد مسجّل',
      subtitle: 'فهد العتيبي · عبر تطبيق الجوال',
      href: '/home/users/312',
      created_at: '2026-08-24T21:03:00+03:00',
    },
    {
      id: 4,
      type: 'invoice_paid',
      title: 'تم سداد فاتورة',
      subtitle: 'فاتورة #1194 · 3,200 ر.س',
      href: '/home/invoices',
      created_at: '2026-08-24T18:40:00+03:00',
    },
  ],

  primary_cta: {
    label: 'ابدأ الآن',
    href: '/home/reports',
  },
}

/** Format SAR amounts for display (Arabic numerals locale). */
export function formatHomeCurrency(value, currency = 'SAR') {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const formatted = num.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return currency === 'SAR' ? `${formatted} ر.س` : `${formatted} ${currency}`
}

/** Relative Arabic time label from ISO string (mock-friendly, client-only). */
export function formatHomeRelativeTime(iso, now = new Date()) {
  if (!iso) return ''
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const diffMs = now.getTime() - then.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} د`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} س`
  const days = Math.floor(hours / 24)
  return `منذ ${days} ي`
}
