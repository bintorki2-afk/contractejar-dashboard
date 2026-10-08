import { describe, expect, it } from "vitest";

import {
  SIDEBAR_NAV,
  canAccess,
  canAccessRoute,
  getFirstAllowedHref,
  isFeatureDisabled,
} from "./permissions";

const employee = (permissions) => ({ id: 99, role_id: 6, is_system_admin: false, permissions });
const admin = { id: 1, role_id: 1, is_system_admin: true, permissions: [] };

function visibleSidebar(user) {
  return SIDEBAR_NAV.flatMap((group) => group.items)
    .filter((item) => !isFeatureDisabled(item.href))
    .filter((item) => canAccess(user.permissions, user, item.section, "view"))
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

  it("only is_system_admin grants blanket access — never a role title", () => {
    const fakeAdmin = { id: 5, role_id: 2, role_title: "مدير النظام", permissions: [] };
    expect(canAccessRoute("/home/settings", fakeAdmin.permissions, fakeAdmin)).toBe(false);
  });

  it("hidden features stay closed even for the system admin", () => {
    expect(canAccessRoute("/home/invoices", admin.permissions, admin)).toBe(false);
    expect(canAccessRoute("/home/return-orders", admin.permissions, admin)).toBe(false);
  });
});
