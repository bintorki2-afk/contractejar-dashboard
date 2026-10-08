'use client';
import React from 'react'
import notificationIcon from '@/public/images/notificationIcon.svg'
import Link from 'next/link'
import Image from 'next/image'
import AvatarImage from '@/components/shared/avatar-image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from 'next/navigation'
import { isOrdersRelatedPath } from '@/src/lib/order-routes'
import OrderMessagesNav from '@/components/orders/messages/order-messages-nav'
import { useUserStore } from '@/src/stores/user-store'
import { useSidebarStore } from '@/src/stores/sidebar-store'
import { useLogout } from '@/src/hooks/use-logout'
import { usePermissions } from '@/src/hooks/use-permissions'
import { PERMISSION_SECTIONS } from '@/src/lib/permissions'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Loader2, PanelLeft } from 'lucide-react'
import { LuLogOut } from 'react-icons/lu'
import { cn } from '@/lib/utils'

export default function Header({
  orderId,
  isSingleOrder,
  title,
  isMain,
  first,
  firstURL,
  second,
  third,
  thirdURL,
  secondURL,
  showBack = !isMain,
  backHref,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const showOrderMessages = isOrdersRelatedPath(pathname);
    const { user } = useUserStore();
    const { setDisplayedPart, displayedPart, setOrderId, isSidebarOpen, toggleSidebar } = useSidebarStore();
    const { logout, logoutLoading } = useLogout();
    const { can } = usePermissions();

    const redirectToEmployeePage = (view) => {
        if (!user?.id) {
            toast.error('تعذر تحديد حساب المستخدم');
            return;
        }
        const url = view ? `/home/roles-and-employees/employees/${user.id}?view=${view}` : `/home/roles-and-employees/employees/${user.id}`;
        router.push(url);
    };

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
            return;
        }
        router.back();
    };

    const iconBtn = cn(
        "size-11 rounded-2xl border flex items-center justify-center transition-colors shrink-0",
        "border-[#E4EBE8] bg-white text-[#4B5563] hover:bg-[#E8F5F1] hover:text-brand-dark hover:border-[#CDEBDF]",
        "dark:border-white/10 dark:bg-[#0F1C16] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white"
    );

    return (
        <div className={`mb-6 transition-all duration-300 ${
            isSidebarOpen
              ? "max-w-[calc(100vw-256px)] max-[1200px]:max-w-[calc(100vw-60px)]"
              : "max-w-[calc(100vw-80px)] max-[1200px]:max-w-full"
          }`}>
        <div className={cn(
            "grid items-center gap-3",
            showOrderMessages ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto]"
        )}>
            <div className="flex items-center gap-2.5 min-w-0">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={isSidebarOpen ? 'طي القائمة الجانبية' : 'توسيع القائمة الجانبية'}
                    aria-expanded={isSidebarOpen}
                    className={iconBtn}
                >
                    <PanelLeft className="size-5" />
                </button>

                {showBack ? (
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="رجوع"
                        title="رجوع"
                        className={iconBtn}
                    >
                        <ChevronRight className="size-5" />
                    </button>
                ) : null}

                <div className="min-w-0">
                    {title ? (
                        <h2 className="text-[17px] font-bold text-[#22302C] leading-tight truncate dark:text-white">
                            {title}
                        </h2>
                    ) : null}
                    {(first || second || third) ? (
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap max-[992px]:hidden">
                            {first ? (
                                <Link
                                    href={firstURL || '#'}
                                    className="text-xs text-[#75827C] transition-colors hover:text-brand-main dark:text-white/50 dark:hover:text-emerald-300"
                                >
                                    {first}
                                </Link>
                            ) : null}
                            {second ? (
                                <>
                                    <span className="text-[#C5CEC9] dark:text-white/25 text-[10px]">/</span>
                                    <Link
                                        href={secondURL || '#'}
                                        className="text-xs text-[#75827C] transition-colors hover:text-brand-main dark:text-white/50 dark:hover:text-emerald-300"
                                    >
                                        {second}
                                    </Link>
                                </>
                            ) : null}
                            {third ? (
                                <>
                                    <span className="text-[#C5CEC9] dark:text-white/25 text-[10px]">/</span>
                                    <Link
                                        href={thirdURL || '#'}
                                        className="text-xs font-semibold text-[#33403B] dark:text-white/75"
                                    >
                                        {third}
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {showOrderMessages ? (
                <div className="justify-self-center max-[1100px]:hidden relative z-40 pointer-events-auto">
                    <OrderMessagesNav />
                </div>
            ) : null}

            <div className="flex items-center gap-2 justify-end min-w-0">
                {isSingleOrder ? (
                    <button
                        type="button"
                        onClick={() => {
                            setOrderId(orderId);
                            if (displayedPart === "comments") {
                              setDisplayedPart("default");
                              return;
                            }
                            setDisplayedPart("comments");
                        }}
                        className={cn(
                            iconBtn,
                            displayedPart === "comments" &&
                              "border-brand-main bg-brand-main text-white hover:bg-brand-main hover:text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-[#0B1411]"
                        )}
                        aria-label="تعليقات الطلب"
                    >
                        <i className={cn(
                            "fa-regular fa-comments text-base",
                            displayedPart === "comments" ? "text-white dark:text-[#0B1411]" : ""
                        )} />
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={() => {
                        if (displayedPart === "notification") {
                            setDisplayedPart("default");
                        } else {
                            setDisplayedPart("notification");
                        }
                    }}
                    className={cn(
                        iconBtn,
                        displayedPart === "notification" &&
                          "border-brand-main bg-brand-main text-white hover:bg-brand-main hover:text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-[#0B1411]"
                    )}
                    aria-label="الإشعارات"
                >
                    <Image
                        src={notificationIcon}
                        alt=""
                        className={cn(
                            "w-[18px] h-auto object-contain",
                            displayedPart === "notification"
                              ? "brightness-0 invert dark:invert-0"
                              : "dark:brightness-0 dark:invert"
                        )}
                    />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "h-11 max-w-full rounded-2xl border px-1.5 pe-3 flex items-center gap-2 transition-colors",
                                "border-[#E4EBE8] bg-white hover:bg-[#E8F5F1] hover:border-[#CDEBDF]",
                                "dark:border-white/10 dark:bg-[#0F1C16] dark:hover:bg-white/[0.08]",
                                "max-[992px]:size-11 max-[992px]:p-0 max-[992px]:justify-center max-[992px]:pe-0"
                            )}
                        >
                            <AvatarImage
                                src={user?.profile_image}
                                alt=""
                                width={36}
                                height={36}
                                className="size-9 object-cover rounded-xl overflow-hidden shrink-0"
                            />
                            <span className="min-w-0 text-start max-[992px]:hidden">
                                <span className="block truncate text-xs font-bold text-[#22302C] dark:text-white max-w-[140px]">
                                    {user?.name || 'مستخدم'}
                                </span>
                                <span className="block truncate text-[10px] text-[#75827C] dark:text-white/45 max-w-[140px]">
                                    {user?.role_relation?.name || user?.role?.name || '—'}
                                </span>
                            </span>
                            <ChevronDown className="size-4 shrink-0 text-[#75827C] dark:text-white/45 max-[992px]:hidden" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 text-right" align="start" dir="rtl">
                        <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => redirectToEmployeePage('profile')}>
                                الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => redirectToEmployeePage()}>
                                الفوترة
                            </DropdownMenuItem>
                            {can(PERMISSION_SECTIONS.settings, 'view') && (
                                <DropdownMenuItem onClick={() => router.push('/home/settings')}>
                                    الإعدادات
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                if (!logoutLoading) logout();
                            }}
                            disabled={logoutLoading}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            <span className="flex items-center justify-between w-full gap-2">
                                <span>تسجيل الخـــروج</span>
                                {logoutLoading ? (
                                    <Loader2 className="size-4 animate-spin shrink-0" />
                                ) : (
                                    <LuLogOut className="size-4 shrink-0" />
                                )}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {showOrderMessages ? (
            <div className="hidden max-[1100px]:flex justify-center mt-4 relative z-40 pointer-events-auto">
                <OrderMessagesNav />
            </div>
        ) : null}
        </div>
    )
}
