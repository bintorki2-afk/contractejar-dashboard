"use client";

import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import AvatarImage from "@/components/shared/avatar-image";
import { formatJoinedShort, whatsappHref } from "./client-details-format";
import { formatSaudiMobileDisplay } from "@/src/lib/format-phone";

export default function ClientProfileCard({ client }) {
  const wa = whatsappHref(client.mobile);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 sm:p-6",
        "border-[#E8EEEC] shadow-[0_1px_3px_rgba(11,83,69,0.04)]",
        "dark:bg-[#0F1C16] dark:border-white/[0.08] dark:shadow-none"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="size-16 sm:size-[72px] shrink-0 rounded-full bg-[#DBEAFE] dark:bg-sky-500/20 flex items-center justify-center text-[28px] font-bold text-[#1D4ED8] dark:text-sky-300 overflow-hidden">
          <AvatarImage
            src={client.photo}
            alt={client.name}
            fallback={(client.name || "؟").trim().charAt(0)}
            className="size-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{client.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-13 font-bold text-brand-dark dark:text-emerald-300 tabular-nums">
              {client.clientCode}
            </span>
            <span className="text-13 font-medium text-gray-700 dark:text-white/70 tabular-nums" dir="ltr">
              {formatSaudiMobileDisplay(client.mobile) || client.mobile}
            </span>
            {client.email ? (
              <span className="text-xs font-medium text-gray-400 dark:text-white/45">{client.email}</span>
            ) : null}
            {client.platformLabel ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-11 font-bold bg-[#DCFCE7] text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                {client.platformLabel}
              </span>
            ) : null}
            {client.blocked ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-11 font-bold bg-[#FEE2E2] text-red-600 dark:bg-rose-500/20 dark:text-rose-300">
                محظور
              </span>
            ) : null}
            <span className="text-xs font-medium text-gray-400 dark:text-white/45 tabular-nums">
              انضم {formatJoinedShort(client.joinedAt)}
            </span>
          </div>
        </div>

        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-13 font-bold text-white shrink-0 transition-colors",
              "bg-[#25D366] hover:bg-[#1EBE57]"
            )}
          >
            <FaWhatsapp className="size-4" />
            واتساب
          </a>
        ) : null}
      </div>
    </div>
  );
}
