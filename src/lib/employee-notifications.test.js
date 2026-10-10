import { describe, expect, it } from "vitest";
import {
  employeeNotificationHref,
  mapEmployeeNotification,
  markReadLocally,
  normalizeEmployeeNotifications,
  relativeTimeAr,
  unreadBadgeText,
} from "./employee-notifications";

const NOW = new Date("2026-10-10T02:00:00+03:00");

// شكل الاستجابة الحقيقي من GET /admin/employee-notifications (QA دفعة هـ).
const PAYLOAD = {
  unread_count: 2,
  items: [
    {
      id: 8,
      kind: "charge_paid",
      title: "تم دفع فرق سعر",
      body: "الطلب #920018: دفع العميل 75 ر.س (تغيير نوع المستند: إلكتروني → ورقي) — يمكنك إكمال التوثيق.",
      url: "/home/orders/308",
      contract_id: 308,
      order_number: "920018",
      data: { type: "charge_paid", contract_id: "308", contract_uuid: "920018", charge_id: "6" },
      is_read: false,
      read_at: null,
      created_at: "2026-10-10T01:47:59+03:00",
    },
    {
      id: 7,
      kind: "data_request_resolved",
      title: "العميل أرسل المطلوب",
      body: "الطلب #920016: أرسل العميل صورة الصك غير واضحة — راجعها وأكمل التوثيق.",
      url: "/home/orders/306",
      contract_id: 306,
      order_number: "920016",
      data: { type: "data_request_resolved", contract_id: "306", request_id: "3" },
      is_read: false,
      read_at: null,
      created_at: "2026-10-09T23:00:00+03:00",
    },
    {
      id: 1,
      kind: "charge_paid",
      title: "تم دفع رسوم إضافية",
      body: "…",
      url: "/home/orders/300",
      contract_id: 300,
      order_number: "920008",
      is_read: true,
      read_at: "2026-10-09T22:00:00+03:00",
      created_at: "2026-10-09T21:57:56+03:00",
    },
  ],
  pagination: { current_page: 1, last_page: 1, total: 3, per_page: 20 },
};

describe("employee notifications mapping (دفعة هـ — D-1)", () => {
  it("maps a server row to the card shape (kind label, href, unread, order number)", () => {
    const n = mapEmployeeNotification(PAYLOAD.items[0], NOW);
    expect(n).toMatchObject({
      id: 8,
      kind: "charge_paid",
      kindLabel: "دفع رسوم",
      tone: "success",
      href: "/home/orders/308",
      contractId: 308,
      orderNumber: "920018",
      isRead: false,
      timeLabel: "قبل 12 دقيقة",
    });
    const resolved = mapEmployeeNotification(PAYLOAD.items[1], NOW);
    expect(resolved.kindLabel).toBe("ردّ العميل");
    expect(resolved.tone).toBe("info");
    expect(resolved.timeLabel).toBe("قبل 3 ساعات");
  });

  it("treats read_at / is_read=1 as read and unknown kinds as generic", () => {
    expect(mapEmployeeNotification(PAYLOAD.items[2], NOW).isRead).toBe(true);
    expect(mapEmployeeNotification({ id: 9, kind: "charge_paid", is_read: 1 }, NOW).isRead).toBe(true);
    const other = mapEmployeeNotification({ id: 10, kind: "something_new", body: "x" }, NOW);
    expect(other.kindLabel).toBe("إشعار");
    expect(other.title).toBe("إشعار");
    expect(other.href).toBeNull();
  });

  it("builds the order href from url, else contract_id, never from an external url", () => {
    expect(employeeNotificationHref({ url: "/home/orders/12" })).toBe("/home/orders/12");
    expect(employeeNotificationHref({ url: "https://evil.example/x", contract_id: 12 })).toBe("/home/orders/12");
    expect(employeeNotificationHref({ data: { contract_id: "44" } })).toBe("/home/orders/44");
    expect(employeeNotificationHref({})).toBeNull();
  });

  it("normalizes the envelope: unread_count from server, pagination, fallback count when missing", () => {
    const data = normalizeEmployeeNotifications(PAYLOAD, NOW);
    expect(data.items).toHaveLength(3);
    expect(data.unreadCount).toBe(2);
    expect(data.total).toBe(3);
    expect(data.lastPage).toBe(1);

    const noCount = normalizeEmployeeNotifications({ items: PAYLOAD.items }, NOW);
    expect(noCount.unreadCount).toBe(2);
    expect(normalizeEmployeeNotifications(null).items).toEqual([]);
  });

  it("badge text: empty / number / 99+", () => {
    expect(unreadBadgeText(0)).toBe("");
    expect(unreadBadgeText(undefined)).toBe("");
    expect(unreadBadgeText(7)).toBe("7");
    expect(unreadBadgeText(140)).toBe("99+");
  });

  it("optimistic mark-read: one id or all, never negative", () => {
    const data = normalizeEmployeeNotifications(PAYLOAD, NOW);
    const one = markReadLocally(data, 8);
    expect(one.unreadCount).toBe(1);
    expect(one.items.find((n) => n.id === 8).isRead).toBe(true);
    expect(one.items.find((n) => n.id === 7).isRead).toBe(false);
    const all = markReadLocally(data, null);
    expect(all.unreadCount).toBe(0);
    expect(all.items.every((n) => n.isRead)).toBe(true);
    expect(markReadLocally(undefined, 1)).toBeUndefined();
  });

  it("relative time labels", () => {
    expect(relativeTimeAr("2026-10-10T01:59:40+03:00", NOW)).toBe("الآن");
    expect(relativeTimeAr("2026-10-10T01:58:00+03:00", NOW)).toBe("قبل دقيقتين");
    expect(relativeTimeAr("2026-10-10T00:00:00+03:00", NOW)).toBe("قبل ساعتين");
    expect(relativeTimeAr("2026-10-08T20:00:00+03:00", NOW)).toBe("أمس");
    expect(relativeTimeAr("2026-09-01T00:00:00+03:00", NOW)).toBe("01/09/2026");
    expect(relativeTimeAr(null, NOW)).toBe("");
    expect(relativeTimeAr("garbage", NOW)).toBe("");
  });
});

describe("دفعة و — أنواع إشعارات الموظف الجديدة", () => {
  it("customer_edited / data_request_progress بتسميات عربية ورابط الطلب", async () => {
    const { mapEmployeeNotification } = await import("./employee-notifications");
    const a = mapEmployeeNotification({ id: 1, kind: "customer_edited", title: "العميل عدّل بيانات الطلب", url: "/home/orders/140", contract_id: 140 });
    expect(a.kindLabel).toBe("تعديل من العميل");
    expect(a.icon).toBe("edit");
    expect(a.href).toBe("/home/orders/140");
    const b = mapEmployeeNotification({ id: 2, kind: "data_request_progress", data: { contract_id: "177" } });
    expect(b.kindLabel).toBe("ردّ جزئي من العميل");
    expect(b.href).toBe("/home/orders/177");
  });
});
