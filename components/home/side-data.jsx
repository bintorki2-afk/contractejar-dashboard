'use client'
import logo from "@/public/images/logo.svg";
import Image from "next/image";
import AvatarImage from "@/components/shared/avatar-image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useLogout } from "@/src/hooks/use-logout";
import { usePermissions } from "@/src/hooks/use-permissions";
import { SIDEBAR_NAV, isFeatureDisabled } from "@/src/lib/permissions";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileSignature,
  Loader2,
  Menu,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  Trash2,
  TrendingUp,
  Undo2,
  UserRound,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { useUserStore } from "@/src/stores/user-store";
import { roleLabelAr } from "@/src/lib/role-labels";
import { useUnreceivedOrdersWatcher } from "@/src/hooks/use-unreceived-orders-watcher";
import { useReturnedOrdersCount } from "@/src/hooks/use-returned-orders-count";
import { getWorkPeriodLabel } from "@/components/roles-and-employees/shared";
import { useIsDark, useToggleTheme } from "@/src/hooks/use-theme-mode";
import { toast } from "sonner";

const NAV_ICONS = {
  '/home/realtime-orders': Menu,
  '/home/clients': Users2,
  '/home/return-orders': Undo2,
  '/home/roles-and-employees': UserRound,
  '/home/marketing-and-content': TrendingUp,
  '/home/reports': BarChart3,
  '/home/settings': Settings,
  '/home/orders': ClipboardList,
  '/home/lessor-change': FileSignature,
  '/home/invoices': ReceiptText,
  '/home/trash': Trash2,
  '/home/guide': BookOpen,
};

const DESKTOP_MEDIA = '(min-width: 1201px)';
const EXPANDED_WIDTH = 'w-64';
const COLLAPSED_WIDTH = 'w-20';

function NavLink({ item, pathname, collapsed, badgeCount }) {
  const Icon = NAV_ICONS[item.href] ?? ClipboardList;
  const isActive =
    pathname === item.href ||
    (item.href !== '/home' && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex h-11 items-center rounded-xl text-sm transition-colors ${
        isActive
          ? 'bg-brand-mint font-bold text-brand-deep dark:bg-white/10 dark:text-brand-accent'
          : 'font-semibold text-[#33403B] hover:bg-[#F3F7F5] hover:text-brand-deep dark:text-sidebar-foreground/90 dark:hover:bg-white/[0.06] dark:hover:text-sidebar-foreground'
      } ${collapsed ? 'w-11 mx-auto justify-center px-0' : 'justify-between gap-2.5 px-3.5'}`}
    >
      <span className={`flex min-w-0 items-center gap-2.5 ${collapsed ? '' : 'flex-1'}`}>
        <Icon
          size={18}
          className={`size-[18px] shrink-0 ${
            isActive
              ? 'text-brand-deep dark:text-brand-accent'
              : 'text-[#6B7570] group-hover:text-brand-deep dark:text-brand-accent/80 dark:group-hover:text-brand-accent'
          }`}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </span>
      {!collapsed && typeof badgeCount === 'number' && badgeCount > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#E8923A] px-1.5 text-11 font-semibold leading-none text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
      {collapsed && typeof badgeCount === 'number' && badgeCount > 0 && (
        <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E8923A]" />
      )}
    </Link>
  );
}

export default function SideData() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, logoutLoading } = useLogout();
  const { isSidebarOpen, setSidebarOpen } = useSidebarStore();
  const { can, isReady } = usePermissions();
  const { user } = useUserStore();
  const unreceivedTotal = useUnreceivedOrdersWatcher();
  const returnedTotal = useReturnedOrdersCount();
  const isDark = useIsDark();
  const { toggleTheme } = useToggleTheme();

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const syncSidebarForViewport = () => {
      setSidebarOpen(media.matches);
    };

    syncSidebarForViewport();
    media.addEventListener("change", syncSidebarForViewport);
    return () => media.removeEventListener("change", syncSidebarForViewport);
  }, [setSidebarOpen]);

  const visibleNav = SIDEBAR_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !isFeatureDisabled(item.href) && isReady && can(item.section, item.action ?? 'view')
    ),
  })).filter((group) => group.items.length > 0);

  const isCollapsed = !isSidebarOpen;
  const panelWidth = EXPANDED_WIDTH;

  const userName = user?.name || 'مستخدم';
  const userRole = roleLabelAr(user) || '—';
  const userWorkPeriod = user?.work_period ? getWorkPeriodLabel(user.work_period) : null;
  const userInitial = userName.trim().charAt(0) || 'م';

  const openProfile = () => {
    if (!user?.id) {
      toast.error('تعذر تحديد حساب المستخدم');
      return;
    }
    router.push(`/home/roles-and-employees/employees/${user.id}?view=profile`);
  };

  return (
    <>
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[99] hidden bg-black/30 max-[1200px]:block"
          onClick={() => setSidebarOpen(false)}
          aria-label="إغلاق القائمة الجانبية"
        />
      )}

      <div
        id="side-data"
        className={`relative flex h-screen shrink-0 flex-col overflow-hidden border-e border-brand-line bg-white dark:border-white/10 dark:bg-gradient-to-b dark:from-sidebar dark:to-sidebar-dark transition-all duration-300 max-[1200px]:absolute max-[1200px]:inset-s-0 max-[1200px]:inset-y-0 max-[1200px]:z-[100] ${
          isSidebarOpen
            ? `${panelWidth} translate-x-0`
            : `${COLLAPSED_WIDTH} translate-x-0 max-[1200px]:w-0 max-[1200px]:!p-0 max-[1200px]:!overflow-hidden max-[1200px]:border-e-0 max-[1200px]:translate-x-full`
        }`}
      >
        <div className={`flex h-full min-h-0 flex-col ${isCollapsed ? 'px-2 py-4' : 'px-3.5 py-5'}`}>
            <div
              className={`relative mb-4 flex items-center gap-3 ${
                isCollapsed ? "flex-col justify-center gap-2" : "px-1"
              }`}
            >
              <Link
                href="/home"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mint ring-1 ring-brand-line dark:bg-brand-accent/15 dark:ring-brand-accent/25"
              >
                <Image
                  src={logo}
                  alt="عقد إيجار"
                  width={28}
                  height={36}
                  className="h-7 w-auto object-contain"
                />
              </Link>
              {!isCollapsed ? (
                <div className="min-w-0 flex-1 pe-10">
                  <h2 className="truncate text-15 font-extrabold leading-tight text-brand-deep dark:text-sidebar-foreground">
                    عقد إيجار
                  </h2>
                  <p className="mt-0.5 truncate text-11 font-semibold text-[#6B7570] dark:text-sidebar-foreground/55">
                    لوحة الموظفين
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
                aria-label={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7570] transition-colors hover:bg-brand-mint hover:text-brand-deep dark:text-sidebar-foreground/70 dark:hover:bg-white/10 dark:hover:text-sidebar-foreground ${
                  isCollapsed
                    ? "shrink-0"
                    : "absolute end-1 top-1"
                }`}
              >
                {isDark ? (
                  <Sun className="size-4 text-amber-300" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
            </div>

            <div className="mx-1 mb-3 h-px bg-brand-line dark:bg-white/10" />

            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
              {visibleNav.map((group, groupIndex) => (
                <div key={group.group}>
                  {groupIndex > 0 && <div className="mx-1 my-3 h-px bg-brand-line dark:bg-white/10" />}
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <div key={item.href} className="relative">
                        <NavLink
                          item={item}
                          pathname={pathname}
                          collapsed={isCollapsed}
                          badgeCount={
                            item.badge === 'unreceived'
                              ? unreceivedTotal
                              : item.badge === 'returned'
                                ? returnedTotal
                                : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-3 shrink-0 ${isCollapsed ? '' : 'px-0.5'}`}>
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={openProfile}
                    title={userName}
                    className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-mint text-sm font-bold text-brand-deep transition-colors ring-1 ring-brand-line dark:bg-white/10 dark:text-sidebar-foreground dark:hover:bg-white/[0.14] dark:ring-white/10"
                  >
                    <AvatarImage
                      src={user?.profile_image}
                      alt=""
                      width={44}
                      height={44}
                      fallback={userInitial}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    disabled={logoutLoading}
                    title="تسجيل الخروج"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7570] transition-colors hover:bg-brand-mint hover:text-brand-deep dark:text-sidebar-foreground/70 dark:hover:bg-white/10 dark:hover:text-sidebar-foreground"
                  >
                    {logoutLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LuLogOut className="size-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl bg-[#F5F7F6] p-2.5 pe-11 ring-1 ring-brand-line dark:bg-white/[0.08] dark:ring-white/10">
                  <button
                    type="button"
                    onClick={openProfile}
                    className="flex w-full min-w-0 items-center gap-2.5 rounded-xl p-1 -m-1 text-start transition-colors hover:bg-white dark:hover:bg-white/[0.06]"
                  >
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-mint text-sm font-bold text-brand-deep ring-2 ring-brand-line dark:bg-brand-accent/20 dark:text-brand-accent dark:ring-brand-accent/25">
                      <AvatarImage
                        src={user?.profile_image}
                        alt=""
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-13 font-bold text-[#14231D] dark:text-sidebar-foreground">
                          {userName}
                        </span>
                        {userRole && userRole !== '—' ? (
                          <span
                            title={userRole}
                            className="shrink-0 rounded-full bg-brand-mint px-1.5 py-px text-[9.5px] font-bold leading-tight text-brand-deep ring-1 ring-brand-line dark:bg-brand-accent/20 dark:text-brand-accent dark:ring-brand-accent/25"
                          >
                            {userRole}
                          </span>
                        ) : null}
                      </span>
                      {userWorkPeriod ? (
                        <span className="mt-0.5 block truncate text-11 leading-snug text-[#6B7570] dark:text-sidebar-foreground/55">
                          {userWorkPeriod}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    disabled={logoutLoading}
                    title="تسجيل الخروج"
                    aria-label="تسجيل الخروج"
                    className="absolute end-2.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#6B7570] transition-colors hover:bg-white hover:text-[#B42318] dark:text-sidebar-foreground/70 dark:hover:bg-white/10 dark:hover:text-sidebar-foreground disabled:opacity-60"
                  >
                    {logoutLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LuLogOut className="size-4 shrink-0" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
      </div>
    </>
  );
}
