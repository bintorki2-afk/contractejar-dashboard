"use client";

import SideData from "@/components/home/side-data";
import UtilitySidePanel from "@/components/home/utility-side-panel";
import RoutePermissionGuard from "@/components/auth/route-permission-guard";

export default function HomeLayoutShell({ children }) {
  return (
    <div className="relative flex bg-background dark:bg-[#0B1411]">
      <SideData />
      <div className="h-screen min-w-0 w-full flex-1 overflow-y-auto p-[45px] transition-all duration-300 max-[1700px]:p-[30px] max-md:p-4 bg-[#F4F6F5] dark:bg-[#0B1411]">
        <RoutePermissionGuard>{children}</RoutePermissionGuard>
      </div>
      <UtilitySidePanel />
    </div>
  );
}
