import { describe, expect, it } from "vitest";

import {
  SIDEBAR_NAV,
  canAccess,
  canAccessRoute,
  getFirstAllowedHref,
  isFeatureDisabled,
  isSuperAdmin,
  roleGrantsFullAccess,
} from "./permissions";

const employee = (permissions) => ({ id: 99, role_id: 6, is_system_admin: false, permissions });
const admin = { id: 1, role_id: 1, is_system_admin: true, permissions: [] };

function visibleSidebar(user) {
  return SIDEBAR_NAV.flatMap((group) => group.items)
    .filter((item) => !isFeatureDisabled(item.href))
    .filter((item) => canAccess(user.permissions, user, item.section, item.action ?? "view"))
    .map((item) => item.href);
}

describe("permissions — pages match what the server allows", () => {
  it("clients page needs users.view (server: GET /admin/users → users.view)", () => {
    const ordersOnly = employee(["all_requests.view"]);
    expect(canAccessRoute("/home/clients", ordersOnly.permissions, ordersOnly)).toBe(false);

    const withUsers = employee(["users.view"]);
    expect(canAccessRoute("/home/clients", withUsers.permissions, withUsers)).toBe(true);
    expect(canAccessRoute("/home/clients", admin.permissions, admin)).toBe(true);
  });

  it("orders-only employee sees only the order links in the sidebar", () => {
    const ordersOnly = employee(["all_requests.view"]);
    expect(visibleSidebar(ordersOnly)).toEqual(["/home/realtime-orders", "/home/orders"]);
  });

  it("marketing-only employee lands on marketing (not on a page that fails with 403)", () => {
    const marketing = employee([
      "blogs.view",
      "blogs.create",
      "app_content.view",
      "website_images.view",
      "seo_crawl.view",
      "faqs.view",
    ]);
    expect(visibleSidebar(marketing)).toEqual(["/home/marketing-and-content"]);
    expect(getFirstAllowedHref(marketing.permissions, marketing)).toBe("/home/marketing-and-content");
    expect(canAccessRoute("/home/clients", marketing.permissions, marketing)).toBe(false);
    expect(canAccessRoute("/home/settings", marketing.permissions, marketing)).toBe(false);
  });

  it("employee with no permissions falls back to /home only", () => {
    const none = employee([]);
    expect(visibleSidebar(none)).toEqual([]);
    expect(getFirstAllowedHref(none.permissions, none)).toBe("/home");
  });

  it("create/edit routes need the matching action, not just view", () => {
    const rolesViewer = employee(["roles.view", "roles.edit"]);
    expect(canAccessRoute("/home/roles-and-employees/roles/add", rolesViewer.permissions, rolesViewer)).toBe(false);
    expect(canAccessRoute("/home/roles-and-employees/roles/edit", rolesViewer.permissions, rolesViewer)).toBe(true);

    const blogViewer = employee(["blogs.view"]);
    expect(canAccessRoute("/home/settings/blogs/create", blogViewer.permissions, blogViewer)).toBe(false);
  });

  it("system admin = exact role name/title match, like the backend (no partial match)", () => {
    expect(isSuperAdmin({ role: "admin" })).toBe(true);
    expect(isSuperAdmin({ role: "Super-Admin" })).toBe(true);
    expect(isSuperAdmin({ role: "x", role_title: "مدير النظام" })).toBe(true);
    expect(isSuperAdmin({ role: "content_admin" })).toBe(false);
    expect(isSuperAdmin({ role: "x", role_title: "مساعد الأدمن" })).toBe(false);
    expect(isSuperAdmin({ role: "x", role_title: "Marketing Admin" })).toBe(false);
    expect(roleGrantsFullAccess("admin_assistant")).toBe(false);
  });

  it("is_system_admin from the API always wins when sent", () => {
    const fakeAdmin = { id: 5, role: "admin", role_title: "مدير النظام", is_system_admin: false, permissions: [] };
    expect(canAccessRoute("/home/settings", fakeAdmin.permissions, fakeAdmin)).toBe(false);
    expect(isSuperAdmin({ role: "manager", is_system_admin: true })).toBe(true);
  });

  it("hidden features stay closed even for the system admin", () => {
    expect(canAccessRoute("/home/invoices", admin.permissions, admin)).toBe(false);
  });

  it("«المرتجعات» is open again (Moyasar refunds) for payments.view or returned_request.view", () => {
    expect(canAccessRoute("/home/return-orders", admin.permissions, admin)).toBe(true);
    const payer = { is_system_admin: false };
    expect(canAccessRoute("/home/return-orders", ["payments.view"], payer)).toBe(true);
    expect(canAccessRoute("/home/return-orders", ["returned_request.view"], payer)).toBe(true);
    expect(canAccessRoute("/home/return-orders", ["all_requests.view"], payer)).toBe(false);
  });
});

describe("payments.refund (د9)", () => {
  it("refund is a payments-only action granted explicitly or to system admins", async () => {
    const { canAccess } = await import("./permissions");
    const employee = { is_system_admin: false };
    expect(canAccess(["payments.view"], employee, "payments", "refund")).toBe(false);
    expect(canAccess(["payments.view", "payments.refund"], employee, "payments", "refund")).toBe(true);
    expect(canAccess([], { is_system_admin: true }, "payments", "refund")).toBe(true);
  });
});

describe("«السلة» (د12)", () => {
  it("trash link shows only with a delete permission; route opens for order/lessor viewers", () => {
    const deleter = employee(["all_requests.view", "all_requests.delete"]);
    expect(visibleSidebar(deleter)).toContain("/home/trash");
    expect(visibleSidebar(employee(["all_requests.view"]))).not.toContain("/home/trash");
    expect(canAccessRoute("/home/trash", deleter.permissions, deleter)).toBe(true);
  });
});
