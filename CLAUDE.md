> 📌 سياق المشروع الكامل (أعمال + حسابات + نشر): اقرأ **@AQDI-CONTEXT.md**

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next)
```

There is no test suite configured in this repo.

## Architecture

This is a Next.js 15 App Router admin dashboard (Aakdi/AQDI) for managing real-estate contracts, orders, employees, and site content. UI is RTL Arabic (`lang="ar" dir="rtl"` in [src/app/layout.js](src/app/layout.js)).

### Two parallel root directories via the same `@/*` alias

`tsconfig.json`/`jsconfig.json` map `@/*` to the repo root, and **both** `src/` and root-level `components/`/`lib/` exist side by side:

- `@/components/*` → root `components/` (feature UI + shadcn primitives in `components/ui/`)
- `@/lib/*` → root `lib/` (`lib/utils.js` — shadcn `cn()` helper, `lib/i18n.js`)
- `@/src/*` → `src/` (`stores`, `hooks`, `lib` (permissions/business logic), `Context`, `utils`)
- `@/app/*` → `src/app/` implicitly via the same alias (Next App Router lives at `src/app`)

Don't assume one `lib` or one `components` dir — check whether an import is `@/lib/...` (root) vs `@/src/lib/...` (src) before editing.

### Data fetching

- All HTTP calls go through `axiosInstance` in [src/utils/axios.js](src/utils/axios.js). It auto-attaches the Bearer token from `useUserStore`/localStorage and force-logs-out + redirects to `/login` on a 401.
- Client-side base URL is same-origin `/api`; `next.config.mjs` rewrites `/api/:path*` to `API_PROXY_TARGET` (defaults to the صقر ١ Railway backend `https://aqdi-new-backend-main-production.up.railway.app/api`; never `aqid.subcodeco.com`). Server-side (no `window`) falls back to `NEXT_PUBLIC_BASE_URL` from `.env`.
- Data fetching/mutations use TanStack React Query (`@tanstack/react-query`). The provider is `ReactQueryProvider` ([src/utils/providers/react-query-provider.jsx](src/utils/providers/react-query-provider.jsx)), wired in `src/app/layout.js`. Feature-specific query/mutation hooks live in `src/hooks/*` (e.g. `useGetHome.js`, `use-paperworks.js`).
- Prefer adding a `use*` hook in `src/hooks/` over calling `axiosInstance` directly from a component/page.

### Auth & permissions

- Auth state (`user`, `token`, `isAuthenticated`) lives in a persisted Zustand store: `src/stores/user-store.js` (localStorage-backed, `skipHydration: true`, hydrated manually — see `_hasHydrated`).
- `src/app/actions/auth.js` is a `'use server'` module that sets/removes an auth cookie (readable by middleware); the Zustand store is the client-side source of truth and stays in sync with it.
- Permission model lives entirely in [src/lib/permissions.js](src/lib/permissions.js): permissions are normalized to `"section.action"` strings (e.g. `orders.view`) from various API shapes (`permissions`, `permission_names`, `permission_matrix`, role-nested variants). `isSuperAdmin` is true only when the API sends `is_system_admin === true` (never inferred from a role name/title).
- `ROUTE_SECTION_RULES` maps URL prefixes to required permission sections (longest-prefix wins); `SIDEBAR_NAV` drives the sidebar and doubles as the permission-aware nav source. When adding a new `/home/*` route that needs gating, add both a `ROUTE_SECTION_RULES` entry and a `SIDEBAR_NAV` item.
- `src/hooks/use-permissions.js` is the main consumption point (`can()`, `canRoute()`, `isAdmin`, `firstAllowedHref`) and lazily fetches the user's role permissions via React Query if the login payload didn't include them.
- `components/auth/route-permission-guard.jsx` wraps protected pages: it waits for store hydration, redirects unauthenticated users to `/login`, and redirects unauthorized users to `firstAllowedHref` with a toast.

### Route structure

Feature pages live under `src/app/home/<feature>/page.jsx` (one directory per sidebar item — `orders`, `roles-and-employees`, `clients`, `realtime-orders`, `marketing-and-content`, `content`, `settings`, `reports`, `return-orders`, `invoices`), with `[id]/page.jsx` for detail views. Several of these are single routes with an internal `Tabs` UI that consolidates what used to be many separate pages (e.g. `/home/orders` hosts the former draft/completed/reliable/whatsapp/etc. order-status pages as `?tab=` panels; `/home/reports` hosts the former `*-analysis` pages the same way; `/home/content` hosts the public-site content editors as `?tab=home`/`?tab=about` panels, each with its own inner section `Tabs`). Corresponding non-page components (forms, tables, cards) live in root `components/<Feature>/...`, mirrored by feature name (e.g. `components/content/home/*-section-form.jsx` + `components/content/about/*-section-form.jsx` for the two panels of `/home/content`, driven by `components/content/ContentWrapper.jsx`).

### Forms

Forms use `react-hook-form` + `@hookform/resolvers` (zod) + shadcn `components/ui/form.jsx`. Content-admin forms (`components/content/**/*-form.jsx`) follow a pattern of: React Query fetch for initial data → populate the form → submit as `FormData` (for file/image uploads) via a mutation. Shared helpers for that flow (endpoint map, asset/preview shaping) are in `src/lib/content-admin.js`.

### Rich text & documents

TipTap (`@tiptap/*`) is used for rich-text editing; `jspdf`, `xlsx`, `html2canvas`/`dom-to-image` are used for exporting contracts/reports.

### UI kit

shadcn/ui ("new-york" style, `components.json`) generates into `components/ui/*`, aliased as `@/components/ui`. Icons: `lucide-react` (shadcn default) and `react-icons`/FontAwesome elsewhere in the app. Styling is Tailwind (`tailwind.config.js`) with `styled-components` and Bootstrap/`react-bootstrap` also present in some legacy areas — check the surrounding file before picking a styling approach.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
