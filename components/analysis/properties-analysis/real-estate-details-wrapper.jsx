"use client";

import { useParams } from "next/navigation";
import Header from "@/components/home/header";
import Loader from "@/components/home/loader";
import { axiosInstance } from "@/src/utils/axios";
import { useQuery } from "@tanstack/react-query";
import RealEstateDetailsContent from "./real-estate-details-content";

export default function RealEstateDetailsWrapper() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["real-estate", id],
    queryFn: () =>
      axiosInstance.get(`/admin/real-estates/${id}`).then((res) => res?.data),
  });

  const estate = data?.data;

  const pageTitle = estate?.name_real_estate || estate?.name_owner || `عقار #${id}`;

  if (isLoading) return <Loader />;

  if (error || !estate) {
    return (
      <div className="p-6 text-center text-ink-placeholder" dir="rtl">
        تعذر تحميل بيانات العقار
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen" dir="rtl">
      <Header
        page="welcome"
        title={pageTitle}
        isMain={false}
        first="الرئيــسية"
        firstURL="/home"
        second="التقارير"
        secondURL="/home/reports?tab=properties"
        third={pageTitle}
        thirdURL={`/home/real-estates/${id}`}
      />

      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex flex-col gap-1 text-right">
          <h2 className="text-22 font-black text-black">{pageTitle}</h2>
          <p className="text-13 text-gray-500">
            رقم العقار: <span className="font-bold text-black">{estate.id}</span>
          </p>
        </div>
        <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#3B82F6]">
          {estate.property_type_name || "عقار"}
        </span>
      </div>

      <RealEstateDetailsContent data={estate} />
    </div>
  );
}
