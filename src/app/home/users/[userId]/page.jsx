"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import ClientDetailsWrapper from "@/components/clients/client-details-wrapper";
import UserDetailsCard from "@/components/analysis/users-analysis/user-details";
import UserContractsTable from "@/components/analysis/users-analysis/user-contracts-table";
import Header from "@/components/home/header";
import Loader from "@/components/home/loader";
import { axiosInstance } from "@/src/utils/axios";
import { safeInternalPath } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";

function isClientFileRoute(userId, from) {
  if (typeof from === "string" && from.includes("/home/clients")) return true;
  return String(userId || "").startsWith("c-");
}

export default function UserDetailsPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);

  const { userId } = useParams();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/home/reports?tab=users";

  if (isClientFileRoute(userId, from)) {
    return <ClientDetailsWrapper />;
  }

  return <LegacyUserDetailsPage userId={userId} from={from} />;
}

function LegacyUserDetailsPage({ userId, from }) {
  const backUrl = safeInternalPath(
    from,
    `/home/reports?tab=users&segment=${encodeURIComponent(from)}`
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", String(userId)],
    queryFn: () =>
      axiosInstance.get(`/admin/users/${userId}`).then((res) => res?.data),
    enabled: !!userId,
  });

  const payload = data?.data ?? data;
  const user = payload?.user;
  const contracts = payload?.contracts ?? [];
  const userName = user?.full_name || user?.name || "تفاصيل المستخدم";

  if (isLoading) return <Loader />;

  if (isError || !user) {
    return (
      <div className="p-6 text-center text-[#FA5252] text-15" dir="rtl">
        حدث خطأ أثناء تحميل بيانات المستخدم
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen" dir="rtl">
      <Header
        page="welcome"
        title={userName}
        isMain={false}
        first="الرئيــسية"
        firstURL="/home"
        second="المستخدمين"
        secondURL={backUrl}
        third="تفاصيل المستخدم"
        thirdURL={`/home/users/${userId}?from=${encodeURIComponent(from)}`}
      />
      <UserDetailsCard user={user} backUrl={backUrl} />
      <UserContractsTable contracts={contracts} userId={user?.id ?? userId} />
    </div>
  );
}
