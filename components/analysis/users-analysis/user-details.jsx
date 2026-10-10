"use client";

import AvatarImage from "@/components/shared/avatar-image";
import {
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Mail,
  Phone,
  ShoppingBag,
  Wallet,
  XCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import BlockUserDialog from "./block-user-dialog";
import DeleteUserDialog from "./delete-user-dialog";
import SendOrderSmsButton from "@/components/orders/shared/send-order-sms-button";

export default function UserDetailsCard({ user, backUrl }) {
  const phone = user?.mobile || user?.phone;
  const isActive = user?.is_blocked != null ? !user.is_blocked : Boolean(user?.status);

  return (
    <div dir="rtl" className="text-right">
      <h2 className="text-lg font-bold">بيــانــات المستخدم :</h2>
      <div dir="rtl" className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <div className="relative size-28 rounded-full overflow-hidden border border-gray-200">
            <AvatarImage
              src={user?.photo_path}
              width={112}
              height={112}
              alt={user?.full_name || user?.name || "avatar"}
              className="size-full rounded-full object-cover"
            />
          </div>

          <h3 className="mt-3 font-bold text-lg">{user?.full_name || user?.name || "—"}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            {isActive ? (
              <>
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-green-600">نشط</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-red-500" />
                <span className="text-red-500">موقوف</span>
              </>
            )}
          </p>

          {user?.verified && (
            <span className="mt-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
              موثق
            </span>
          )}

          {phone && (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 bg-green-600 hover:bg-green-700 text-white rounded-full p-2.5 flex items-center justify-center transition-all"
            >
              <FaWhatsapp size={18} />
            </a>
          )}
        </div>

        <div dir="rtl" className="col-span-2 bg-gray-100 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex flex-wrap items-center gap-8 mt-2">
            <div className="flex items-center gap-3">
              <div className="bg-brand-hover text-white p-4 rounded-full">
                <Mail size={20} />
              </div>
              <div className="text-right">
                <p className="font-medium">{user?.email || "—"}</p>
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-brand-hover text-white p-4 rounded-full">
                <Phone size={20} />
              </div>
              <div className="text-right">
                <p className="font-medium">{phone || "—"}</p>
                <p className="text-sm text-muted-foreground">رقم الجوال</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            <StatItem icon={Building2} label="العقارات" value={user?.real_estate_count ?? user?.properties_count ?? 0} />
            <StatItem icon={Layers} label="الوحدات" value={user?.units_count ?? 0} />
            <StatItem icon={ShoppingBag} label="طلبات مكتملة" value={user?.completed_orders_count ?? 0} />
            <StatItem
              icon={ShoppingBag}
              label="طلبات غير مكتملة"
              value={user?.incomplete_orders_count ?? user?.uncompleted_orders_count ?? 0}
            />
            <StatItem
              icon={Wallet}
              label="إجمالي المدفوع"
              value={parseFloat(user?.total_paid_amount || 0).toLocaleString("ar-EG-u-nu-latn")}
            />
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-3 rounded-full">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.date_time || user?.created_at || "—"}</p>
                <p className="text-muted-foreground text-xs">تاريخ التسجيل</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end items-center">
            <SendOrderSmsButton
              userId={user?.id}
              order={{
                ...user,
                user_id: user?.id,
                user_mobile: phone,
              }}
            />
            <BlockUserDialog user={user} />
            <DeleteUserDialog user={user} redirectTo={backUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-white/60 rounded-xl p-3 border border-[#eee]">
      <div className="bg-white text-brand-hover p-2 rounded-full border border-[#eee]">
        <Icon size={16} />
      </div>
      <div>
        <p className="font-bold text-15 text-black">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
