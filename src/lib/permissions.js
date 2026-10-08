/** Permission section keys (match API `section_key` / `permission_matrix` keys). */
export const PERMISSION_SECTIONS = {
  analytics: 'analytics',
  operating_expenses: 'operating_expenses',
  finance_expenses: 'finance_expenses',
  all_requests: 'all_requests',
  completed_request: 'completed_request',
  incomplete_request: 'incomplete_request',
  completed_whatsapp_request: 'completed_whatsapp_request',
  incomplete_whatsapp_request: 'incomplete_whatsapp_request',
  returned_request: 'returned_request',
  request_classification: 'request_classification',
  roles: 'roles',
  permissions: 'permissions',
  employees: 'employees',
  employee_salaries: 'employee_salaries',
  employee_kpis: 'employee_kpis',
  users: 'users',
  notifications: 'notifications',
  payments: 'payments',
  contract_payments: 'contract_payments',
  regions: 'regions',
  cities: 'cities',
  real_estates: 'real_estates',
  property_reference: 'property_reference',
  tenant_roles: 'tenant_roles',
  contract_statuses: 'contract_statuses',
  draft_contract_statuses: 'draft_contract_statuses',
  contract_periods: 'contract_periods',
  contract_whatsapp: 'contract_whatsapp',
  instrument_settings: 'instrument_settings',
  coupons: 'coupons',
  lessor_change: 'lessor_change',
  blogs: 'blogs',
  ads: 'ads',
  faqs: 'faqs',
  paperworks: 'paperworks',
  popup_contracts: 'popup_contracts',
  instruction_sections: 'instruction_sections',
  message_alerts: 'message_alerts',
  app_content: 'app_content',
  payment_messages: 'payment_messages',
  settings: 'settings',
  sms: 'sms',
  seo_crawl: 'seo_crawl',
  website_images: 'website_images',
};

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'retrieve', 'refund']; // refund: payments فقط (د9)

/**
 * أعلام الميزات (Feature flags) — عقد إيجار.
 * الميزات المُخفاة مؤقتًا (لا توجد بوابة دفع بعد). لا يتم حذف أي كود؛ فقط إخفاء.
 * الإخفاء يشمل: رابط القائمة الجانبية + بوابة المسار (منع الدخول المباشر عبر الرابط) + صفحة الهبوط الأولى.
 * لإعادة تفعيل ميزة مستقبلًا: احذف مسارها من DISABLED_FEATURE_PREFIXES فقط.
 */
export const DISABLED_FEATURE_PREFIXES = [
  '/home/invoices',      // الفواتير
  '/home/leads',         // العملاء المحتملون
];

/**
 * د4: سجل «صور الموقع (SEO)» يخص الموقع القديم (aqdi.sa) — موقع contractejar.com لا يقرأه
 * (صور المقالات والصفحات تُدار من محرراتها). الكود باقٍ؛ لإظهاره غيّر القيمة إلى true.
 */
export const WEBSITE_IMAGES_REGISTRY_ENABLED = false;

/** true إذا كان المسار (أو الـ href) يخص ميزة مُخفاة. */
export function isFeatureDisabled(pathOrHref = '') {
  if (!pathOrHref) return false;
  const path = String(pathOrHref).split('?')[0];
  return DISABLED_FEATURE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function matrixToPermissionNames(matrix) {
  if (!matrix || typeof matrix !== 'object') return [];

  return Object.entries(matrix).flatMap(([section, actions]) => {
    if (!Array.isArray(actions)) return [];
    return actions.map((action) => `${section}.${action}`);
  });
}

function extractNamesFromList(list) {
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item?.name) return item.name;
      if (item?.section && item?.action) return `${item.section}.${item.action}`;
      return null;
    })
    .filter(Boolean);
}

/**
 * Normalize a login/refresh/profile payload (or a role payload) into `section.action` strings.
 * `permissions` and `permission_names` are the same list from the API — prefer `permissions`,
 * fall back to `permission_names`, then derive from `permission_matrix`. Whichever source has
 * data wins outright (no merging across sources) so a fresh login/refresh always fully replaces
 * what was previously known, never adds to it.
 *
 * Also unwraps a nested `data.user` when the whole login `data` blob was stored as `user`
 * (legacy login shape: `{ token, user: { ... } }`).
 */
export function resolveAuthUser(user) {
  if (!user) return null;
  const nested = user.user;
  if (
    nested &&
    typeof nested === 'object' &&
    user.is_system_admin == null &&
    !user.permissions &&
    !user.permission_names &&
    !user.permission_matrix &&
    (user.token || user.refresh_token || user.role_id == null)
  ) {
    return nested;
  }
  return user;
}

export function normalizeUserPermissions(user) {
  const source = resolveAuthUser(user);
  if (!source) return [];

  const fromPermissions = extractNamesFromList(source.permissions);
  if (fromPermissions.length > 0) return fromPermissions;

  const fromNames = extractNamesFromList(source.permission_names);
  if (fromNames.length > 0) return fromNames;

  return matrixToPermissionNames(source.permission_matrix);
}

/**
 * Same rule as the backend (`Role::grantsFullAccess`, config/permissions.php): an EXACT
 * role name/title match only — never a partial match («content_admin», «مساعد الأدمن» are not admins).
 * `is_system_admin` from the API wins whenever it is sent (true or false).
 */
const FULL_ACCESS_ROLE_NAMES = ['admin', 'super_admin', 'superadmin', 'administrator', 'system_admin'];
const FULL_ACCESS_ROLE_TITLES = [
  'admin', 'administrator', 'system admin', 'super admin', 'superadmin',
  'أدمن', 'ادمن', 'الادمن', 'الأدمن', 'مدير النظام', 'مدير عام',
];

function normalizeRoleKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[-\s]+/g, '_').replace(/_+/g, '_');
}

function normalizeRoleTitle(value) {
  const v = String(value ?? '').trim();
  return /[A-Za-z]/.test(v) ? v.toLowerCase() : v;
}

export function roleGrantsFullAccess(name, ...titles) {
  const key = normalizeRoleKey(name);
  if (key && FULL_ACCESS_ROLE_NAMES.includes(key)) return true;
  return [name, ...titles]
    .map(normalizeRoleTitle)
    .some((t) => t !== '' && FULL_ACCESS_ROLE_TITLES.includes(t));
}

export function isSuperAdmin(user) {
  const source = resolveAuthUser(user);
  if (!source) return false;
  if (typeof source.is_system_admin === 'boolean') return source.is_system_admin;
  const roleName = typeof source.role === 'string' ? source.role : source.role?.name;
  return roleGrantsFullAccess(
    roleName ?? source.role_relation?.name,
    source.role_title,
    source.role_relation?.title_ar,
    source.role_relation?.title_en
  );
}

export function hasPermission(permissions, section, action = 'view') {
  if (!section) return true;
  const key = `${section}.${action}`;
  return permissions.includes(key) || permissions.includes(`${section}.*`);
}

/** `section` may be a single section key or an array of section keys (ANY-of / OR semantics). */
export function canAccess(permissions, user, section, action = 'view') {
  if (isSuperAdmin(user)) return true;
  if (Array.isArray(section)) return section.some((s) => hasPermission(permissions, s, action));
  return hasPermission(permissions, section, action);
}

/** True if the user has ANY of the given actions on one section (e.g. show an actions column if edit OR delete is granted). */
export function canAccessAny(permissions, user, section, actions = []) {
  return actions.some((action) => canAccess(permissions, user, section, action));
}

/** ANY-of section groups shared between `ROUTE_SECTION_RULES` (page-level gate) and `SIDEBAR_NAV` (link visibility). */
const ORDERS_SECTIONS = [
  PERMISSION_SECTIONS.all_requests,
  PERMISSION_SECTIONS.completed_request,
  PERMISSION_SECTIONS.incomplete_request,
  PERMISSION_SECTIONS.request_classification,
  PERMISSION_SECTIONS.completed_whatsapp_request,
  PERMISSION_SECTIONS.incomplete_whatsapp_request,
];

const REALTIME_ORDERS_SECTIONS = [
  ...ORDERS_SECTIONS,
  PERMISSION_SECTIONS.returned_request,
];

const ROLES_AND_EMPLOYEES_SECTIONS = [
  PERMISSION_SECTIONS.employees,
  PERMISSION_SECTIONS.roles,
  PERMISSION_SECTIONS.employee_salaries,
  PERMISSION_SECTIONS.employee_kpis,
];

/**
 * First matching rule wins, so more specific prefixes must be listed before broader ones
 * (e.g. `/home/settings/cities` before the generic `/home/settings` catch-all).
 * `section: null` = any authenticated user. `section` may also be an array of section keys —
 * access is granted if the user has `view` on ANY of them (used for merged pages that gate
 * individual tabs more narrowly than the page itself).
 */
const MARKETING_SECTIONS = [
  PERMISSION_SECTIONS.analytics,
  PERMISSION_SECTIONS.blogs,
  PERMISSION_SECTIONS.seo_crawl,
  PERMISSION_SECTIONS.app_content,
  PERMISSION_SECTIONS.website_images,
  PERMISSION_SECTIONS.faqs,
];

/** Former `/home/content` panels now live under marketing `?tab=content&view=`. */
const CONTENT_SECTIONS = [
  PERMISSION_SECTIONS.app_content,
  PERMISSION_SECTIONS.website_images,
];

export const ROUTE_SECTION_RULES = [
  { prefix: '/home/settings/unit-types', section: PERMISSION_SECTIONS.property_reference },
  { prefix: '/home/settings/unit-usage', section: PERMISSION_SECTIONS.property_reference },
  { prefix: '/home/settings/property-types', section: PERMISSION_SECTIONS.property_reference },
  { prefix: '/home/settings/property-usage', section: PERMISSION_SECTIONS.property_reference },
  { prefix: '/home/settings/regions', section: PERMISSION_SECTIONS.regions },
  { prefix: '/home/settings/cities', section: PERMISSION_SECTIONS.cities },
  { prefix: '/home/settings/order-duration', section: PERMISSION_SECTIONS.contract_periods },
  { prefix: '/home/settings/message-sections', section: PERMISSION_SECTIONS.message_alerts },
  { prefix: '/home/settings/message-section-items', section: PERMISSION_SECTIONS.message_alerts },
  { prefix: '/home/settings/message-for-employee', section: PERMISSION_SECTIONS.message_alerts },
  { prefix: '/home/settings/message-for-property', section: PERMISSION_SECTIONS.message_alerts },
  { prefix: '/home/settings/customer-app-messages', section: PERMISSION_SECTIONS.app_content },
  { prefix: '/home/settings/payment-types', section: PERMISSION_SECTIONS.app_content },
  { prefix: '/home/settings/terms', section: PERMISSION_SECTIONS.app_content },
  { prefix: '/home/settings/privacy', section: PERMISSION_SECTIONS.app_content },
  { prefix: '/home/settings/coupons', section: PERMISSION_SECTIONS.coupons },
  { prefix: '/home/settings/blogs', section: PERMISSION_SECTIONS.blogs },
  { prefix: '/home/settings/faqs', section: PERMISSION_SECTIONS.faqs },
  { prefix: '/home/settings/notifications', section: PERMISSION_SECTIONS.notifications },
  { prefix: '/home/settings/payments', section: PERMISSION_SECTIONS.payments },
  { prefix: '/home/settings/tenant-roles', section: PERMISSION_SECTIONS.tenant_roles },
  { prefix: '/home/settings/paperworks', section: PERMISSION_SECTIONS.paperworks },
  { prefix: '/home/contract-settings', section: PERMISSION_SECTIONS.settings },
  { prefix: '/home/settings', section: PERMISSION_SECTIONS.settings },
  { prefix: '/home/roles-and-employees', section: ROLES_AND_EMPLOYEES_SECTIONS },
  // د9: «المرتجعات» = عمليات استرجاع Moyasar (payments) + طلبات الاسترجاع القديمة (returned_request).
  { prefix: '/home/return-orders', section: [PERMISSION_SECTIONS.payments, PERMISSION_SECTIONS.returned_request] },
  { prefix: '/home/lessor-change', section: PERMISSION_SECTIONS.lessor_change },
  // د12: «السلة» — الطلبات وطلبات تغيير المؤجر المحذوفة (الاستعادة تتطلب صلاحية الحذف في الخادم).
  { prefix: '/home/trash', section: [PERMISSION_SECTIONS.all_requests, PERMISSION_SECTIONS.lessor_change] },
  { prefix: '/home/orders', section: ORDERS_SECTIONS },
  { prefix: '/home/reports', section: PERMISSION_SECTIONS.analytics },
  { prefix: '/home/users', section: PERMISSION_SECTIONS.users },
  { prefix: '/home/real-estates', section: PERMISSION_SECTIONS.real_estates },
  { prefix: '/home/marketing-and-content', section: MARKETING_SECTIONS },
  // العملاء/العملاء المحتملون: الخادم يطلب users.view لـ /admin/users و /admin/leads.
  { prefix: '/home/clients', section: PERMISSION_SECTIONS.users },
  { prefix: '/home/leads', section: PERMISSION_SECTIONS.users },
  { prefix: '/home/realtime-orders', section: REALTIME_ORDERS_SECTIONS },
  { prefix: '/home/invoices', section: null },
  // Legacy URL — page redirects into marketing content tab; keep gate for deep links.
  { prefix: '/home/content', section: CONTENT_SECTIONS },
  { prefix: '/home', section: null },
];

export function getSectionForPath(pathname = '') {
  const path = pathname.split('?')[0];

  for (const rule of ROUTE_SECTION_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.section;
    }
  }

  return null;
}

/** Stricter rules for create/edit routes (default is section `view`). */
export function getRouteActionRequirement(pathname = '') {
  const path = pathname.split('?')[0];

  if (path === '/home/roles-and-employees/roles/add') {
    return { section: PERMISSION_SECTIONS.roles, action: 'create' };
  }
  if (path.startsWith('/home/roles-and-employees/roles/edit')) {
    return { section: PERMISSION_SECTIONS.roles, action: 'edit' };
  }
  if (path === '/home/settings/blogs/create') {
    return { section: PERMISSION_SECTIONS.blogs, action: 'create' };
  }
  if (path.startsWith('/home/settings/blogs/') && path.endsWith('/edit')) {
    return { section: PERMISSION_SECTIONS.blogs, action: 'edit' };
  }

  return null;
}

export function canAccessRoute(pathname, permissions, user) {
  // ميزات مُخفاة: امنع الدخول حتى للمسؤول (super admin) — الإخفاء مقصود لا صلاحية.
  if (isFeatureDisabled(pathname)) return false;

  const actionReq = getRouteActionRequirement(pathname);
  if (actionReq) {
    return canAccess(permissions, user, actionReq.section, actionReq.action);
  }

  const section = getSectionForPath(pathname);
  if (section === null) return true;
  return canAccess(permissions, user, section, 'view');
}

export const SIDEBAR_NAV = [
  {
    group: 'main',
    items: [
      { label: 'الطلبات مباشر', href: '/home/realtime-orders', section: REALTIME_ORDERS_SECTIONS, badge: 'unreceived' },
      { label: 'العملاء', href: '/home/clients', section: PERMISSION_SECTIONS.users },
      { label: 'العملاء المحتملون', href: '/home/leads', section: PERMISSION_SECTIONS.users },
      { label: 'المرتجعات', href: '/home/return-orders', section: [PERMISSION_SECTIONS.payments, PERMISSION_SECTIONS.returned_request] },
      { label: 'الموظفون والأدوار', href: '/home/roles-and-employees', section: ROLES_AND_EMPLOYEES_SECTIONS },
      { label: 'التسويق والمحتوى', href: '/home/marketing-and-content', section: MARKETING_SECTIONS },
      { label: 'التقارير', href: '/home/reports', section: PERMISSION_SECTIONS.analytics },
      { label: 'إعدادات النظام', href: '/home/settings', section: PERMISSION_SECTIONS.settings },
    ],
  },
  {
    group: 'secondary',
    items: [
      { label: 'جميع الطلبات', href: '/home/orders', section: ORDERS_SECTIONS },
      { label: 'طلبات تغيير المؤجر', href: '/home/lessor-change', section: PERMISSION_SECTIONS.lessor_change },
      { label: 'السلة', href: '/home/trash', section: [PERMISSION_SECTIONS.all_requests, PERMISSION_SECTIONS.lessor_change], action: 'delete' },
      { label: 'الفواتير', href: '/home/invoices', section: null },
    ],
  },
];

export function getFirstAllowedHref(permissions, user) {
  for (const group of SIDEBAR_NAV) {
    for (const item of group.items) {
      if (isFeatureDisabled(item.href)) continue;
      if (canAccess(permissions, user, item.section, item.action ?? 'view')) {
        return item.href;
      }
    }
  }
  return '/home';
}

export function extractPermissionsFromRole(roleResponse) {
  const roleData = roleResponse?.data ?? roleResponse;
  if (!roleData) return [];

  return normalizeUserPermissions(roleData);
}
