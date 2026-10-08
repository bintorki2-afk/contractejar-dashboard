'use client'
import React, { useState, useEffect } from 'react'
import Header from './header'
import logo from '@/public/images/logo.svg'
import Image from 'next/image'
import AvatarImage from '@/components/shared/avatar-image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/src/stores/user-store'
import {
    ArrowUpLeft,
    CalendarDays,
    Clock3,
    ClipboardList,
    CheckCircle2,
    RotateCcw,
    UserPlus,
    Radio,
    Wallet,
    FileSignature,
    FileText,
    Users,
    BarChart3,
    Receipt,
    Bell,
    Loader2,
    ChevronLeft,
} from 'lucide-react'
import {
    HOME_MOCK,
    formatHomeCurrency,
    formatHomeRelativeTime,
} from '@/components/home/home-mock-data'
import { useHomeRecentActivity } from '@/src/hooks/use-home-recent-activity'
import { useHomeSummary } from '@/src/hooks/use-home-summary'
import { usePermissions } from '@/src/hooks/use-permissions'

const QUICK_ACTION_ICONS = {
    'realtime-orders': Radio,
    orders: ClipboardList,
    clients: Users,
    'return-orders': RotateCcw,
    'lessor-change': FileSignature,
    reports: BarChart3,
    invoices: Receipt,
}

const ACTIVITY_ICONS = {
    order_completed: CheckCircle2,
    return_requested: RotateCcw,
    client_registered: UserPlus,
    invoice_paid: Wallet,
    order_new: Bell,
}

function formatArabicTime(date) {
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const hour12 = hours % 12 || 12
    const period = hours < 12 ? 'صباحاً' : 'مساءً'
    return `${hour12}:${minutes} ${period}`
}

function formatArabicDate(date) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day} / ${month} / ${year}`
}

function getGreeting(date) {
    const hour = date.getHours()
    if (hour < 12) return 'صباح الخير'
    if (hour < 17) return 'مساء الخير'
    return 'مساء الخير'
}

// The header shows minute-precision time + a greeting that only flips on the
// hour, so a 30s tick is plenty. Kept in its own hook/components so the clock
// re-renders in isolation instead of re-rendering the whole dashboard (KPI
// cards, quick actions, activity list) once a second.
function useLiveDate(intervalMs = 30_000) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), intervalMs)
        return () => clearInterval(interval)
    }, [intervalMs])
    return now
}

function GreetingLabel() {
    const now = useLiveDate()
    return (
        <p className="mb-1 text-xs font-medium text-[#6B7571] dark:text-white/45">
            {getGreeting(now)}
        </p>
    )
}

function TimeDateCards() {
    const now = useLiveDate()
    return (
        <div className="mb-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#E8EEEC] bg-white px-4 py-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="mb-2 flex items-center gap-1.5 text-[#6B7571] dark:text-white/40">
                    <Clock3 className="size-3.5" strokeWidth={2} />
                    <span className="text-[11px] font-medium">الوقت الآن</span>
                </div>
                <p className="text-base font-semibold tabular-nums text-[#0A1A16] dark:text-white">
                    {formatArabicTime(now)}
                </p>
            </div>
            <div className="rounded-2xl border border-[#E8EEEC] bg-white px-4 py-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="mb-2 flex items-center gap-1.5 text-[#6B7571] dark:text-white/40">
                    <CalendarDays className="size-3.5" strokeWidth={2} />
                    <span className="text-[11px] font-medium">التاريخ</span>
                </div>
                <p className="text-base font-semibold tabular-nums text-[#0A1A16] dark:text-white">
                    {formatArabicDate(now)}
                </p>
            </div>
        </div>
    )
}

function getFirstName(fullName) {
    if (!fullName) return ''
    return fullName.trim().split(/\s+/)[0]
}

function SummaryCard({ label, value, icon: Icon, accent, href }) {
    const inner = (
        <>
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#6B7571] dark:text-white/45">
                    {label}
                </span>
                <span
                    className={`inline-flex size-7 items-center justify-center rounded-lg ${accent}`}
                >
                    <Icon className="size-3.5" strokeWidth={2} />
                </span>
            </div>
            <p className="text-xl font-bold tabular-nums text-[#0A1A16] dark:text-white">
                {value}
            </p>
        </>
    )

    const baseClass =
        'rounded-2xl border border-[#E8EEEC] bg-white px-4 py-3.5 dark:border-white/[0.06] dark:bg-[#0F1C16]'

    if (!href) {
        return <div className={baseClass}>{inner}</div>
    }

    return (
        <Link
            href={href}
            className={`group block text-right transition-colors hover:border-[#0c6055]/30 hover:bg-[#0c6055]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c6055]/40 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/[0.06] ${baseClass}`}
        >
            {inner}
        </Link>
    )
}

export default function HomeWelcomeWrapper() {
    const router = useRouter()
    const { user } = useUserStore()
    const firstName = getFirstName(user?.name)
    const roleLabel = user?.role_relation?.name ?? ''

    // Static copy still comes from the mock (motto + the quick-action link list).
    const { motto, quick_actions: quickActions, primary_cta: cta } = HOME_MOCK

    // Everything below is gated by the signed-in user's permissions.
    const { canRoute, firstAllowedHref } = usePermissions()

    const canOrders = canRoute('/home/orders')
    const canRealtime = canRoute('/home/realtime-orders')
    const canReturns = canRoute('/home/return-orders')
    const canClients = canRoute('/home/clients')
    const canAnalytics = canRoute('/home/reports')
    const canActivity = canOrders || canRealtime

    // Live KPI counters — /admin/reports/* (analytics) + unreceived-orders count.
    const { summary } = useHomeSummary({
        canAnalytics,
        canUnreceived: canActivity,
    })

    const formatCount = (value) =>
        value == null ? '—' : value.toLocaleString('ar-EG')

    // Only render cards the user can actually open.
    const kpiCards = [
        {
            key: 'pending',
            label: 'طلبات معلّقة',
            value: formatCount(summary.pending_orders),
            icon: ClipboardList,
            accent: 'bg-[#0c6055]/10 text-[#0c6055] dark:bg-emerald-400/10 dark:text-emerald-300',
            href: '/home/orders',
            show: canOrders,
        },
        {
            key: 'completed',
            label: 'مكتملة اليوم',
            value: formatCount(summary.completed_today),
            icon: CheckCircle2,
            accent: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
            href: '/home/orders',
            show: canOrders,
        },
        {
            key: 'returns',
            label: 'استرجاعات',
            value: formatCount(summary.return_orders),
            icon: RotateCcw,
            accent: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
            href: '/home/return-orders',
            show: canReturns,
        },
        {
            key: 'clients',
            label: 'عملاء جدد (أسبوع)',
            value: formatCount(summary.new_clients_this_week),
            icon: UserPlus,
            accent: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
            href: '/home/clients',
            show: canClients,
        },
        {
            key: 'realtime',
            label: 'طلبات مباشر',
            value: formatCount(summary.unreceived_realtime),
            icon: Radio,
            accent: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
            href: '/home/realtime-orders',
            show: canRealtime,
        },
        {
            key: 'revenue',
            label: 'إيراد اليوم',
            value: formatHomeCurrency(summary.revenue_today, summary.currency),
            icon: Wallet,
            accent: 'bg-[#0c6055]/10 text-[#0c6055] dark:bg-emerald-400/10 dark:text-emerald-300',
            href: '/home/reports',
            show: canAnalytics,
        },
    ].filter((card) => card.show)

    // Shortcuts + their live badge counts (only ones the user can open).
    const quickActionBadges = {
        'realtime-orders': summary.unreceived_realtime,
        'return-orders': summary.return_orders,
    }
    const visibleQuickActions = quickActions.filter((action) =>
        canRoute(action.href),
    )

    const ctaHref = firstAllowedHref || '/home'

    // "آخر النشاطات" is live — fed from the notification source (new orders
    // awaiting receipt), same as the header notification panel.
    const activityHrefBase = canOrders ? '/home/orders' : '/home/realtime-orders'
    const {
        activity,
        total: activityTotal,
        isLoading: activityLoading,
        isError: activityError,
    } = useHomeRecentActivity({
        enabled: canActivity,
        hrefBase: activityHrefBase,
    })

    const showSidePanels = visibleQuickActions.length > 0 || canActivity

    return (
        <>
            <Header page="welcome" title={null} isMain={true} />

            <div className="flex flex-col gap-5">
                <section className="relative isolate overflow-hidden rounded-[28px] border border-[#E8EEEC] bg-white dark:border-white/[0.08] dark:bg-[#0F1C16]">
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                        <div className="absolute -top-24 right-[-10%] h-[340px] w-[340px] rounded-full bg-[#0c6055]/[0.07] blur-3xl dark:bg-emerald-400/10" />
                        <div className="absolute bottom-[-20%] left-[-8%] h-[280px] w-[280px] rounded-full bg-[#10B981]/[0.06] blur-3xl dark:bg-teal-500/[0.08]" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#0c6055]/25 to-transparent dark:via-emerald-400/30" />
                    </div>

                    <div className="grid gap-10 p-8 max-[1100px]:gap-8 max-[1100px]:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:p-10 xl:p-12">
                        <div className="flex min-w-0 flex-col justify-center">
                            <div className="mb-5 flex items-center gap-3">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0c6055]/10 dark:bg-emerald-400/10">
                                    <Image
                                        src={logo}
                                        alt=""
                                        width={20}
                                        height={26}
                                        className="h-5 w-auto object-contain"
                                        aria-hidden
                                    />
                                </span>
                                <span className="text-xs font-semibold tracking-wide text-[#0c6055] dark:text-emerald-300">
                                    {motto.brand_label}
                                </span>
                            </div>

                            <h1 className="mb-5 max-w-xl text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-[1.35] text-[#0A1A16] dark:text-white">
                                {motto.title}
                            </h1>

                            <div className="relative max-w-xl pe-0 ps-5">
                                <span
                                    aria-hidden
                                    className="absolute inset-y-1 start-0 w-[3px] rounded-full bg-gradient-to-b from-[#0c6055] to-[#10B981] dark:from-emerald-400 dark:to-teal-600"
                                />
                                <p className="text-[15px] leading-8 text-[#4A5551] dark:text-white/65">
                                    {motto.body}
                                </p>
                                {motto.verse ? (
                                    <p className="mt-4 text-[15px] font-semibold leading-8 text-[#0c6055] dark:text-emerald-300">
                                        {motto.verse}
                                    </p>
                                ) : null}
                                {motto.footnote ? (
                                    <p className="mt-2 text-sm leading-7 text-[#6B7571] dark:text-white/45">
                                        {motto.footnote}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <aside className="flex min-w-0 flex-col justify-center">
                            <div className="rounded-3xl border border-[#E8EEEC] bg-[#F7FAF9]/80 p-7 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0B1411]/70 max-[640px]:p-5">
                                <div className="mb-7 flex items-start gap-4">
                                    <div className="relative shrink-0">
                                        <span
                                            aria-hidden
                                            className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#0c6055] to-[#10B981] opacity-90 dark:from-emerald-400 dark:to-teal-600"
                                        />
                                        <AvatarImage
                                            src={user?.profile_image}
                                            alt={user?.name ?? 'المستخدم'}
                                            width={72}
                                            height={72}
                                            className="relative h-[72px] w-[72px] rounded-full border-[3px] border-white object-cover dark:border-[#0F1C16]"
                                        />
                                    </div>
                                    <div className="min-w-0 pt-1">
                                        <GreetingLabel />
                                        <h2 className="truncate text-xl font-bold text-[#0A1A16] dark:text-white">
                                            مرحباً بعودتك{firstName ? `، ${firstName}` : ''}
                                        </h2>
                                        {roleLabel ? (
                                            <p className="mt-1 truncate text-sm text-[#5C6763] dark:text-white/55">
                                                {roleLabel}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <TimeDateCards />

                                <button
                                    type="button"
                                    className="group flex h-14 w-full items-center justify-between rounded-2xl bg-[#0c6055] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B5345] dark:bg-emerald-500 dark:text-[#0B1411] dark:hover:bg-emerald-400"
                                    onClick={() => router.push(ctaHref)}
                                >
                                    <span>{cta?.label || 'ابدأ الآن'}</span>
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-[#0B1411]/15">
                                        <ArrowUpLeft className="size-5" strokeWidth={2.25} />
                                    </span>
                                </button>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* Summary KPIs — live counts; only cards the user can open */}
                {kpiCards.length > 0 ? (
                    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        {kpiCards.map((card) => (
                            <SummaryCard
                                key={card.key}
                                label={card.label}
                                value={card.value}
                                icon={card.icon}
                                accent={card.accent}
                                href={card.href}
                            />
                        ))}
                    </section>
                ) : null}

                {showSidePanels ? (
                <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                    {/* Quick actions — links are static; badge counts are live */}
                    {visibleQuickActions.length > 0 ? (
                    <section className="rounded-[24px] border border-[#E8EEEC] bg-white p-5 dark:border-white/[0.08] dark:bg-[#0F1C16] sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-[#0A1A16] dark:text-white">
                                اختصارات سريعة
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {visibleQuickActions.map((action) => {
                                const Icon = QUICK_ACTION_ICONS[action.id] || FileText
                                const badgeCount =
                                    quickActionBadges[action.id] ?? action.badge_count
                                return (
                                    <button
                                        key={action.id}
                                        type="button"
                                        onClick={() => router.push(action.href)}
                                        className="group relative flex flex-col items-start gap-3 rounded-2xl border border-[#E8EEEC] bg-[#F7FAF9] p-4 text-right transition-colors hover:border-[#0c6055]/30 hover:bg-[#0c6055]/[0.04] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/[0.06]"
                                    >
                                        {badgeCount != null && badgeCount > 0 ? (
                                            <span className="absolute left-3 top-3 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0c6055] px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-emerald-400 dark:text-[#0B1411]">
                                                {badgeCount.toLocaleString('ar-EG')}
                                            </span>
                                        ) : null}
                                        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white text-[#0c6055] shadow-sm dark:bg-[#0B1411] dark:text-emerald-300">
                                            <Icon className="size-4" strokeWidth={2} />
                                        </span>
                                        <span className="text-13 font-semibold text-[#0A1A16] dark:text-white">
                                            {action.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                    ) : null}

                    {/* Recent activity — live: new orders awaiting receipt */}
                    {canActivity ? (
                    <section className="rounded-[24px] border border-[#E8EEEC] bg-white p-5 dark:border-white/[0.08] dark:bg-[#0F1C16] sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-[#0A1A16] dark:text-white">
                                آخر النشاطات
                            </h3>
                            <Link
                                href={activityHrefBase}
                                className="inline-flex items-center gap-1 rounded-full bg-[#0c6055]/10 px-2.5 py-1 text-[10px] font-semibold text-[#0c6055] transition-colors hover:bg-[#0c6055]/15 dark:bg-emerald-400/10 dark:text-emerald-300"
                            >
                                {activityTotal > 0
                                    ? `${activityTotal.toLocaleString('ar-EG')} طلب جديد`
                                    : 'عرض الكل'}
                                <ChevronLeft className="size-3" strokeWidth={2.5} />
                            </Link>
                        </div>

                        {activityLoading ? (
                            <div className="flex items-center justify-center py-10 text-[#8A9490] dark:text-white/35">
                                <Loader2 className="size-6 animate-spin" />
                            </div>
                        ) : activityError ? (
                            <p className="py-10 text-center text-13 text-[#8A9490] dark:text-white/40">
                                تعذّر تحميل النشاطات
                            </p>
                        ) : activity.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#0c6055]/10 text-[#0c6055] dark:bg-emerald-400/10 dark:text-emerald-300">
                                    <Bell className="size-4" strokeWidth={2} />
                                </span>
                                <p className="text-13 font-semibold text-[#33403B] dark:text-white/70">
                                    لا توجد طلبات جديدة الآن
                                </p>
                                <p className="text-11 text-[#8A9490] dark:text-white/35">
                                    سيظهر أي طلب جديد هنا فور وصوله
                                </p>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {activity.map((item) => {
                                    const Icon = ACTIVITY_ICONS[item.type] || FileText
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                href={item.href || activityHrefBase}
                                                className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-right transition-colors hover:bg-[#F7FAF9] dark:hover:bg-white/[0.04]"
                                            >
                                                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0c6055]/10 text-[#0c6055] dark:bg-emerald-400/10 dark:text-emerald-300">
                                                    <Icon className="size-4" strokeWidth={2} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-13 font-semibold text-[#0A1A16] dark:text-white">
                                                        {item.title}
                                                    </span>
                                                    {item.subtitle ? (
                                                        <span className="mt-0.5 block truncate text-xs text-[#6B7571] dark:text-white/45">
                                                            {item.subtitle}
                                                        </span>
                                                    ) : null}
                                                </span>
                                                <span className="shrink-0 pt-0.5 text-[11px] text-[#8A9490] dark:text-white/35">
                                                    {formatHomeRelativeTime(item.created_at)}
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </section>
                    ) : null}
                </div>
                ) : null}
            </div>
        </>
    )
}
