'use client'
import React, { useState, useEffect } from 'react'
import Header from './header'
import logo from '@/public/images/logo.svg'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/src/stores/user-store'
import {
    ArrowUpLeft,
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
} from 'lucide-react'
import { HOME_MOCK, formatHomeCurrency } from '@/components/home/home-mock-data'
import { useHomeSummary } from '@/src/hooks/use-home-summary'
import { usePermissions } from '@/src/hooks/use-permissions'
import { roleLabelAr } from '@/src/lib/role-labels'
import AttentionBoard from '@/components/home/attention-board'

/**
 * الرئيسية (دفعة د — د11): «عليك الحين» هو أكبر شيء في الشاشة.
 * أُزيلت لوحة الاقتباس الكبيرة؛ بقيت تحية مختصرة + أرقام سريعة صغيرة + اختصارات.
 */

const QUICK_ACTION_ICONS = {
    'realtime-orders': Radio,
    orders: ClipboardList,
    clients: Users,
    'return-orders': RotateCcw,
    'lessor-change': FileSignature,
    reports: BarChart3,
    invoices: Receipt,
}

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatArabicTime(date) {
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const hour12 = hours % 12 || 12
    const period = hours < 12 ? 'صباحاً' : 'مساءً'
    return `${hour12}:${minutes} ${period}`
}

function formatNumericDate(date) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${date.getFullYear()}`
}

function getGreeting(date) {
    return date.getHours() < 12 ? 'صباح الخير' : 'مساء الخير'
}

// The greeting shows minute precision, so a 30s tick is plenty.
function useLiveDate(intervalMs = 30_000) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), intervalMs)
        return () => clearInterval(interval)
    }, [intervalMs])
    return now
}

function GreetingRow({ firstName, roleLabel, brandLabel }) {
    const now = useLiveDate()
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#33403B] dark:text-white/70">
                    {getGreeting(now)}{firstName ? `، ${firstName}` : ''}
                    {roleLabel ? <span className="font-semibold text-[#8A958F] dark:text-white/40"> · {roleLabel}</span> : null}
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#8A958F] dark:text-white/40">
                    {WEEKDAYS_AR[now.getDay()]}{' '}
                    <span dir="ltr" className="tabular-nums">{formatNumericDate(now)}</span>
                    {' · '}
                    <span className="tabular-nums">{formatArabicTime(now)}</span>
                </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[12px] font-bold text-brand-deep dark:text-emerald-300">
                <Image src={logo} alt="" width={16} height={20} className="h-5 w-auto" aria-hidden />
                {brandLabel}
            </span>
        </div>
    )
}

function getFirstName(fullName) {
    if (!fullName) return ''
    return fullName.trim().split(/\s+/)[0]
}

function SummaryCard({ label, value, icon: Icon, accent, href }) {
    const inner = (
        <div className="flex items-center gap-2.5">
            <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                <Icon className="size-4" strokeWidth={2} />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold text-[#6B7570] dark:text-white/45">{label}</span>
                <span className="block text-[17px] font-extrabold leading-tight tabular-nums text-[#0E1F18] dark:text-white">{value}</span>
            </span>
        </div>
    )
    const baseClass = 'rounded-xl border border-brand-line bg-white px-3 py-2.5 dark:border-white/[0.08] dark:bg-[#0F1C16]'
    if (!href) return <div className={baseClass}>{inner}</div>
    return (
        <Link
            href={href}
            className={`block text-right transition-colors hover:border-brand-green/40 hover:bg-brand-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 dark:hover:bg-emerald-400/[0.06] ${baseClass}`}
        >
            {inner}
        </Link>
    )
}

export default function HomeWelcomeWrapper() {
    const router = useRouter()
    const { user } = useUserStore()
    const firstName = getFirstName(user?.name)
    const roleLabel = roleLabelAr(user)
    const { motto, quick_actions: quickActions, primary_cta: cta } = HOME_MOCK
    const { canRoute, firstAllowedHref } = usePermissions()

    const canOrders = canRoute('/home/orders')
    const canRealtime = canRoute('/home/realtime-orders')
    const canReturns = canRoute('/home/return-orders')
    const canClients = canRoute('/home/clients')
    const canAnalytics = canRoute('/home/reports')
    const canBoard = canOrders || canRealtime

    const { summary } = useHomeSummary({ canAnalytics, canUnreceived: canBoard })
    const formatCount = (value) => (value == null ? '—' : Number(value).toLocaleString('en-US'))

    const kpiCards = [
        // «غير مدفوعة» = kpis.incomplete و«مدفوعة اليوم» = kpis.paid (كانت تُسمّى «معلّقة/مكتملة» خطأً).
        { key: 'pending', label: 'غير مدفوعة', value: formatCount(summary.pending_orders), icon: ClipboardList, accent: 'bg-brand-mint text-brand-deep dark:bg-emerald-400/10 dark:text-emerald-300', href: '/home/orders', show: canOrders },
        { key: 'completed', label: 'مدفوعة اليوم', value: formatCount(summary.completed_today), icon: CheckCircle2, accent: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300', href: '/home/orders', show: canOrders },
        { key: 'returns', label: 'استرجاعات', value: formatCount(summary.return_orders), icon: RotateCcw, accent: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300', href: '/home/return-orders', show: canReturns },
        { key: 'clients', label: 'عملاء جدد (أسبوع)', value: formatCount(summary.new_clients_this_week), icon: UserPlus, accent: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300', href: '/home/clients', show: canClients },
        { key: 'realtime', label: 'بانتظار الاستلام', value: formatCount(summary.unreceived_realtime), icon: Radio, accent: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300', href: '/home/realtime-orders', show: canRealtime },
        { key: 'revenue', label: 'إيراد اليوم', value: formatHomeCurrency(summary.revenue_today, summary.currency), icon: Wallet, accent: 'bg-brand-mint text-brand-deep dark:bg-emerald-400/10 dark:text-emerald-300', href: '/home/reports', show: canAnalytics },
    ].filter((card) => card.show)

    const quickActionBadges = {
        'realtime-orders': summary.unreceived_realtime,
        'return-orders': summary.return_orders,
    }
    const visibleQuickActions = quickActions.filter((action) => canRoute(action.href))
    const ctaHref = firstAllowedHref || '/home'

    return (
        <>
            <Header page="welcome" title={null} isMain={true} />

            <div className="flex flex-col gap-6">
                <GreetingRow firstName={firstName} roleLabel={roleLabel} brandLabel={motto.brand_label} />

                {canBoard ? (
                    <AttentionBoard />
                ) : (
                    <button
                        type="button"
                        className="flex h-14 w-full max-w-md items-center justify-between rounded-2xl bg-brand-deep px-5 text-sm font-semibold text-white hover:bg-brand-deep/90"
                        onClick={() => router.push(ctaHref)}
                    >
                        <span>{cta?.label || 'ابدأ الآن'}</span>
                        <ArrowUpLeft className="size-5" strokeWidth={2.25} />
                    </button>
                )}

                {kpiCards.length > 0 ? (
                    <section aria-label="أرقام سريعة" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                        {kpiCards.map((card) => (
                            <SummaryCard key={card.key} label={card.label} value={card.value} icon={card.icon} accent={card.accent} href={card.href} />
                        ))}
                    </section>
                ) : null}

                {visibleQuickActions.length > 0 ? (
                    <section aria-label="اختصارات سريعة" className="flex flex-wrap gap-2">
                        {visibleQuickActions.map((action) => {
                            const Icon = QUICK_ACTION_ICONS[action.id] || FileText
                            const badgeCount = quickActionBadges[action.id] ?? null
                            return (
                                <Link
                                    key={action.id}
                                    href={action.href}
                                    className="inline-flex items-center gap-2 h-10 rounded-xl border border-brand-line bg-white px-3.5 text-[12.5px] font-bold text-[#22302C] hover:border-brand-green/40 hover:bg-brand-mint dark:border-white/10 dark:bg-white/[0.03] dark:text-white/80"
                                >
                                    <Icon className="size-4 text-brand-deep dark:text-emerald-300" strokeWidth={2} />
                                    {action.label}
                                    {badgeCount != null && badgeCount > 0 ? (
                                        <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-brand-deep px-1.5 text-[10.5px] font-bold text-white tabular-nums dark:bg-emerald-400 dark:text-[#0B1411]">
                                            {badgeCount}
                                        </span>
                                    ) : null}
                                </Link>
                            )
                        })}
                    </section>
                ) : null}
            </div>
        </>
    )
}
