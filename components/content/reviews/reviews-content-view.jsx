"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, MessageSquareQuote, Pencil, Search, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SectionCard from "@/components/content/marketing/shared/section-card";
import { useConfirm } from "@/components/shared/confirm-provider";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import { contractTypeLabel, moveReviewIds } from "@/src/lib/customer-reviews";
import {
  useCustomerReviews,
  useDeleteCustomerReview,
  useReorderCustomerReviews,
  useToggleCustomerReview,
} from "@/src/hooks/use-customer-reviews";
import ReviewFormDialog from "./review-form-dialog";
import ReviewsSummaryCard from "./reviews-summary-card";

const FILTERS = [
  { value: "", label: "الكل" },
  { value: "1", label: "الظاهرة" },
  { value: "0", label: "المخفية" },
];

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= value ? "fill-[#F5B301] text-[#F5B301]" : "text-[#D4DCD8] dark:text-white/20")} />
      ))}
    </span>
  );
}

function ReviewRow({ review, index, total, canEdit, canDelete, canReorder, onEdit, onMove, isMoving }) {
  const confirm = useConfirm();
  const toggle = useToggleCustomerReview();
  const remove = useDeleteCustomerReview();
  const type = contractTypeLabel(review.contract_type);

  const handleDelete = async () => {
    const ok = await confirm({
      title: "حذف التقييم",
      description: `حذف تقييم «${review.name}» نهائياً؟ سيختفي من الموقع والتطبيق.`,
      confirmLabel: "حذف",
      destructive: true,
    });
    if (ok) remove.mutate(review.id);
  };

  return (
    <li
      className={cn(
        "flex gap-3 rounded-2xl border border-[#E6EFEA] bg-white p-3.5 transition-colors dark:border-white/10 dark:bg-white/[0.02]",
        !review.is_visible && "bg-[#FAFBFA] dark:bg-white/[0.01]"
      )}
    >
      {canReorder ? (
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <button
            type="button"
            aria-label="تحريك للأعلى"
            disabled={index === 0 || isMoving}
            onClick={() => onMove(review.id, "up")}
            className="mk-mini !h-7 !w-7 !p-0 inline-flex items-center justify-center disabled:opacity-30"
          >
            <ArrowUp className="size-3.5" />
          </button>
          <span className="text-[11px] font-black tabular-nums text-[#8A958F]">{index + 1}</span>
          <button
            type="button"
            aria-label="تحريك للأسفل"
            disabled={index === total - 1 || isMoving}
            onClick={() => onMove(review.id, "down")}
            className="mk-mini !h-7 !w-7 !p-0 inline-flex items-center justify-center disabled:opacity-30"
          >
            <ArrowDown className="size-3.5" />
          </button>
        </div>
      ) : null}

      <div className={cn("min-w-0 flex-1", !review.is_visible && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b className="text-[14px] font-extrabold text-[#14231D] dark:text-white">{review.name || "—"}</b>
          {review.city ? <span className="text-[12px] font-semibold text-[#6B7570] dark:text-white/50">· {review.city}</span> : null}
          <Stars value={review.rating} />
          {type && review.contract_type ? (
            <span className="inline-flex h-5 items-center rounded-full bg-[#EEF5F1] px-2 text-[10.5px] font-bold text-[#0B5A3C] dark:bg-emerald-500/10 dark:text-emerald-300">
              {type}
            </span>
          ) : null}
          {!review.is_visible ? (
            <span className="inline-flex h-5 items-center rounded-full bg-[#EEF1F0] px-2 text-[10.5px] font-bold text-[#4B5753] dark:bg-white/10 dark:text-white/60">
              مخفي
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-6 text-[#33403B] dark:text-white/75">{review.text}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {canEdit ? (
          toggle.isPending ? (
            <Loader2 className="size-4 animate-spin text-[#0B7A4C]" />
          ) : (
            <label className="mkt-switch" title={review.is_visible ? "إخفاء" : "إظهار"} aria-label={review.is_visible ? "إخفاء التقييم" : "إظهار التقييم"}>
              <input
                type="checkbox"
                checked={review.is_visible}
                onChange={(e) => toggle.mutate({ id: review.id, is_visible: e.target.checked })}
              />
              <span />
            </label>
          )
        ) : review.is_visible ? (
          <Eye className="size-4 text-[#0B7A4C]" />
        ) : (
          <EyeOff className="size-4 text-[#8A958F]" />
        )}
        <div className="flex items-center gap-1.5">
          {canEdit ? (
            <button type="button" className="mk-mini inline-flex items-center gap-1" onClick={() => onEdit(review)}>
              <Pencil className="size-3.5" />
              تعديل
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="mk-mini hr-del inline-flex items-center gap-1"
              disabled={remove.isPending}
              onClick={handleDelete}
              aria-label="حذف التقييم"
            >
              {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * «التقييمات» تحت «التسويق والمحتوى» (دفعة و — D7):
 * ملخص «4.7 من 3000» + إظهار/إخفاء، وقائمة التقييمات المعروضة (إضافة/تعديل/حذف/ترتيب/إظهار).
 * المصدر الوحيد: الخادم (`/admin/customer-reviews`) — الموقع والتطبيق يقرآن من `GET /reviews`.
 */
export default function ReviewsContentView() {
  const { can, isAdmin } = usePermissions();
  const section = PERMISSION_SECTIONS.customer_reviews;
  const canCreate = isAdmin || can(section, "create");
  const canEdit = isAdmin || can(section, "edit");
  const canDelete = isAdmin || can(section, "delete");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [visible, setVisible] = useState("");
  const [dialog, setDialog] = useState({ open: false, review: null });
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { reviews, isLoading, isError, error, isFetching } = useCustomerReviews({ search: debounced, visible });
  const reorder = useReorderCustomerReviews();
  // الترتيب يُحفظ على القائمة الكاملة فقط (لا مع بحث/فلتر حتى لا تضيع مواضع العناصر المخفية عن العرض).
  const filtered = Boolean(debounced) || visible !== "";
  const canReorder = canEdit && !filtered && reviews.length > 1;
  const visibleCount = reviews.filter((r) => r.is_visible).length;

  const onMove = (id, direction) => {
    const ids = moveReviewIds(reviews, id, direction);
    if (ids) reorder.mutate(ids);
  };

  if (isError && error?.response?.status === 403) {
    return (
      <SectionCard title="التقييمات">
        <p className="py-8 text-center text-[13px] text-[#6B7570]">ليست لديك صلاحية «تقييمات العملاء».</p>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ReviewsSummaryCard canEdit={canEdit} />

      <SectionCard
        title="آراء العملاء المعروضة"
        subtitle="تظهر في الموقع والتطبيق بنفس الترتيب هنا — الظاهرة فقط."
        action={
          canCreate ? (
            <button type="button" className="xbtn" onClick={() => setDialog({ open: true, review: null })}>
              + تقييم جديد
            </button>
          ) : null
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8A958F]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو المدينة أو النص"
              className="h-10 w-full rounded-xl border border-[#E6EBE9] bg-white pr-9 pl-3 text-[13px] dark:border-white/10 dark:bg-white/[0.04]"
            />
          </div>
          <div role="tablist" className="mkt-subtabs !mb-0">
            {FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                role="tab"
                aria-selected={visible === f.value}
                onClick={() => setVisible(f.value)}
                className={cn("mkt-subtab", visible === f.value && "on")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ms-auto text-[12px] font-bold text-[#6B7570] tabular-nums dark:text-white/50">
            {isFetching && !isLoading ? <Loader2 className="me-1 inline size-3.5 animate-spin" /> : null}
            {reviews.length} تقييم{!filtered ? ` · ${visibleCount} ظاهر` : ""}
          </span>
        </div>

        {filtered && canEdit && reviews.length > 1 ? (
          <p className="mb-2 text-[11.5px] font-semibold text-[#9A6100]">لتغيير الترتيب امسح البحث واختر «الكل».</p>
        ) : null}

        {isLoading ? (
          <p className="py-10 text-center text-[13px] text-[#8A958F]">جارٍ التحميل…</p>
        ) : isError ? (
          <p className="py-10 text-center text-[13px] font-bold text-[#B42318]">
            {error?.response?.data?.message || "تعذر تحميل التقييمات"}
          </p>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquareQuote className="mx-auto mb-2 size-7 text-[#B5C0BB]" />
            <p className="text-[13px] font-bold text-[#6B7570]">{filtered ? "لا نتائج مطابقة" : "لا توجد تقييمات بعد"}</p>
            {!filtered && canCreate ? (
              <p className="text-[12px] text-[#8A958F]">أضف أول تقييم ليظهر في الموقع والتطبيق.</p>
            ) : null}
          </div>
        ) : (
          <ol className={cn("flex flex-col gap-2", reorder.isPending && "pointer-events-none opacity-70")}>
            {reviews.map((review, index) => (
              <ReviewRow
                key={review.id}
                review={review}
                index={index}
                total={reviews.length}
                canEdit={canEdit}
                canDelete={canDelete}
                canReorder={canReorder}
                isMoving={reorder.isPending}
                onMove={onMove}
                onEdit={(r) => setDialog({ open: true, review: r })}
              />
            ))}
          </ol>
        )}
      </SectionCard>

      <ReviewFormDialog
        open={dialog.open}
        review={dialog.review}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  );
}
