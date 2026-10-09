"use client";

import DeedAddressGroup from "./order-groups/deed-address-group";
import TenantFinancialGroup from "./order-groups/tenant-financial-group";
import UnitsGroup from "./order-groups/units-group";

export default function OrderGroupsLayout({ order, onEdit }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-[1900px]:grid-cols-3 gap-4" dir="rtl">
      <DeedAddressGroup order={order} onEdit={onEdit} />
      <TenantFinancialGroup order={order} onEdit={onEdit} />
      <UnitsGroup order={order} onEdit={onEdit} />
    </div>
  );
}
