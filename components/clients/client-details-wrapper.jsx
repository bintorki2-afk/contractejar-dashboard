"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";
import { cn, safeInternalPath } from "@/lib/utils";
import Loader from "@/components/home/loader";
import { useClientDetail, useBlockClient, useDeleteClient } from "@/src/hooks/use-clients";
import { formatJoinedLabel } from "./client-details/client-details-format";
import ClientHeaderActions from "./client-details/client-header-actions";
import ClientProfileCard from "./client-details/client-profile-card";
import ClientStatsGrid from "./client-details/client-stats-grid";
import ClientOrdersSection from "./client-details/client-orders-section";

export default function ClientDetailsWrapper() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params?.userId;
  const from = searchParams.get("from") || "/home/clients";
  const backUrl = safeInternalPath(from, "/home/clients");

  const { client, isLoading, isError } = useClientDetail(clientId);
  const { mutate: toggleBlock, isPending: isBlocking } = useBlockClient();
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();

  const handleBlock = () => {
    if (!clientId) return;
    toggleBlock(clientId);
  };

  const handleDelete = () => {
    if (!clientId) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    deleteClient(clientId, {
      onSuccess: () => router.push(backUrl),
    });
  };

  const handleDiscount = () => {
    router.push(
      `/home/users/${clientId}/discount?from=${encodeURIComponent(
        `/home/users/${clientId}?from=${encodeURIComponent(backUrl)}`
      )}`
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col gap-4 min-h-full" dir="rtl">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-status-neutral dark:text-white/50 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
        >
          <ChevronLeft className="size-4 shrink-0" />
          رجوع للعملاء
        </button>
        <div className="rounded-2xl border border-[#E8EEEC] bg-white dark:bg-[#0F1C16] dark:border-white/[0.08] p-10 text-center text-[#FA5252] text-15 font-medium">
          تعذر تحميل ملف العميل من الخادم
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 min-h-full transition-colors" dir="rtl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-status-neutral dark:text-white/50 hover:text-brand-dark dark:hover:text-emerald-300 transition-colors"
          >
            <ChevronLeft className="size-4 shrink-0" />
            رجوع للعملاء
          </button>
          <div>
            <h1 className="text-[20px] sm:text-22 font-bold text-gray-900 dark:text-white leading-tight">
              ملف العميل – {client.name}
            </h1>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/45 font-medium tabular-nums">
              {client.clientCode} · انضم {formatJoinedLabel(client.joinedAt)}
            </p>
          </div>
        </div>

        <ClientHeaderActions
          client={client}
          isBlocking={isBlocking}
          isDeleting={isDeleting}
          onBlock={handleBlock}
          onDelete={handleDelete}
          onDiscount={handleDiscount}
        />
      </div>

      <ClientProfileCard client={client} />

      <ClientStatsGrid client={client} />

      <ClientOrdersSection clientId={clientId} userId={client.id} backUrl={backUrl} />

      <section className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2">
          <Home className="size-4 text-brand-dark dark:text-emerald-300 shrink-0" />
          <h3 className="text-15 font-bold text-gray-900 dark:text-white">عقارات العميل ووحداته</h3>
        </div>
        <Link
          href={`/home/users/${clientId}/properties?from=${encodeURIComponent(
            `/home/users/${clientId}?from=${encodeURIComponent(backUrl)}`
          )}`}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2.5 h-12 px-4 rounded-xl text-13 font-bold transition-colors",
            "bg-[#E8F5F1] text-brand-dark hover:bg-[#D5EFE8]",
            "dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
          )}
        >
          <Home className="size-4 shrink-0" />
          فتح عقارات ووحدات العميل ({client.properties} عقار – {client.units} وحدة)
        </Link>
      </section>
    </div>
  );
}
