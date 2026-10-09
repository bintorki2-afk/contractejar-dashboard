"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  ClipboardCopy,
  Hand,
  Keyboard,
  LayoutDashboard,
  RotateCcw,
  ShieldAlert,
  Undo2,
} from "lucide-react";

/**
 * «دليل الموظف» (د23): معالجة الطلب خطوة بخطوة، بلقطات من اللوحة نفسها
 * (أُخذت بـ Playwright من نسخة محلية ببيانات تجريبية — public/guide/*.webp).
 */
export const GUIDE_STEPS = [
  {
    id: "attention",
    icon: LayoutDashboard,
    title: "ابدأ من «عليك الحين»",
    image: "/guide/01-attention.webp",
    size: [1124, 662],
    points: [
      "الرئيسية تعرض خانات: بانتظار الاستلام، بانتظار التوثيق، متأخرة — مع العدد.",
      "اضغط الخانة لتظهر قائمتها مرتبة الأقدم أولاً. الشارة الحمراء «متأخر» تعني تجاوز المدة (ساعتان للاستلام، 24 ساعة للتوثيق).",
      "زر «استلمت» يستلم الطلب باسمك مباشرة ويفتح صفحته.",
    ],
  },
  {
    id: "receive",
    icon: Hand,
    title: "استلم الطلب",
    image: "/guide/02-stage-receive.webp",
    size: [1184, 560],
    points: [
      "في صفحة الطلب: شريط «الخطوة التالية» أعلى الصفحة يعرض الزر الكبير «استلمت».",
      "بعد التأكيد يُسجَّل الطلب باسمك، ويُبلَّغ العميل، وتُفتح رسالة واتساب جاهزة له.",
      "يمكنك الاستلام من قائمة «جميع الطلبات» أيضاً بزر الصف دون فتح الطلب.",
    ],
  },
  {
    id: "ejar",
    icon: ClipboardCopy,
    title: "انسخ بيانات إيجار",
    image: "/guide/03-ejar-copy.webp",
    size: [720, 792],
    points: [
      "«نسخ بيانات إيجار» ينسخ كل البيانات بترتيب إدخالها في منصة إيجار (المؤجر، المستأجر، العقار، الوحدات، المالية، التواريخ، العدادات).",
      "زر العين يعرضها حقلاً حقلاً مع زر نسخ لكل حقل، وزر «طباعة».",
      "لتصحيح رقم صغير (جوال، هوية، الحي…) اضغط القلم بجانب الحقل — يُحفظ ويُسجَّل في «سجل النشاط».",
    ],
  },
  {
    id: "notarize",
    icon: BadgeCheck,
    title: "وثّق العقد",
    image: "/guide/05-journey.webp",
    size: [1124, 161],
    points: [
      "بعد توثيق العقد في إيجار: اضغط «وثّقت» بجانب الخطوة، واختر نوع الصك وأدخل رقمه.",
      "«رحلة الطلب» تعرض كل خطوة: من نفّذها ومتى، والخطوة الحالية مميّزة.",
    ],
  },
  {
    id: "refund",
    icon: Undo2,
    title: "الاسترجاع (لمن لديه الصلاحية)",
    image: "/guide/06-refund.webp",
    size: [500, 480],
    points: [
      "«استرجاع المبلغ» في صفحة الطلب: كلي أو جزئي مع سبب إلزامي — يُنفَّذ فوراً عبر Moyasar.",
      "الاسترجاع الكامل يغيّر الحالة إلى «مسترجع» ويُبلغ العميل، وكل العمليات في صفحة «المرتجعات».",
    ],
  },
  {
    id: "history",
    icon: ShieldAlert,
    title: "السجل والإشعارات",
    image: "/guide/07-history.webp",
    size: [380, 1047],
    points: [
      "«سجل الطلب» بجانب البيانات: سجل النشاط (مع فلتر الموظف)، الإشعارات المرسلة ونتيجتها، المدفوعات والاسترجاع.",
      "«إشعار العميل ببيانات ناقصة» يرسل له رابط الخطوة المطلوبة مباشرة.",
    ],
  },
  {
    id: "trash",
    icon: RotateCcw,
    title: "الحذف والسلة",
    image: "/guide/08-trash.webp",
    size: [1184, 520],
    points: [
      "الحذف ينقل الطلب إلى «السلة» مع زر «تراجع» فوري، ويمكن استعادته من صفحة «السلة» خلال 30 يوماً.",
    ],
  },
  {
    id: "keyboard",
    icon: Keyboard,
    title: "أسرع بلوحة المفاتيح",
    image: "/guide/09-shortcuts.webp",
    size: [420, 426],
    points: [
      "في «جميع الطلبات»: J/K للتنقل، Enter للفتح، W واتساب، S المرحلة التالية، / البحث، ? المساعدة.",
      "في صفحة الطلب: S المرحلة التالية، W واتساب.",
    ],
  },
];

export default function EmployeeGuide() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6" dir="rtl">
      <header className="rounded-2xl border border-brand-line bg-white p-5 dark:bg-[#0F1C16] dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-mint text-brand-deep">
            <BookOpen className="size-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0E1F18] dark:text-white">دليل الموظف</h1>
            <p className="text-[13px] text-[#6B7570] dark:text-white/50">كيف تعالج الطلب من الدفع حتى التوثيق — خطوة بخطوة.</p>
          </div>
        </div>
        <ol className="mt-4 flex flex-wrap gap-2">
          {GUIDE_STEPS.map((s, i) => (
            <li key={s.id}>
              <Link href={`#${s.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-line px-3 text-[12px] font-bold text-[#33403B] hover:bg-brand-mint dark:border-white/10 dark:text-white/70">
                <span className="tabular-nums text-brand-deep">{i + 1}</span> {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </header>

      {GUIDE_STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <section id={step.id} key={step.id} className="scroll-mt-6 rounded-2xl border border-brand-line bg-white p-5 dark:bg-[#0F1C16] dark:border-white/10">
            <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-[#0E1F18] dark:text-white">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-deep text-[13px] font-extrabold text-white tabular-nums">{i + 1}</span>
              <Icon className="size-5 text-brand-deep dark:text-emerald-300" />
              {step.title}
            </h2>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 ps-5 text-[13.5px] leading-7 text-[#33403B] dark:text-white/75">
              {step.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {step.image ? (
              <figure className="mt-4 overflow-hidden rounded-xl border border-brand-line bg-[#F5F7F6] dark:border-white/10">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={step.size?.[0] ?? 1200}
                  height={step.size?.[1] ?? 700}
                  className="mx-auto h-auto max-w-full"
                  unoptimized
                />
              </figure>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
