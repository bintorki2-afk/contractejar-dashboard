# Deploying the Aqdi (عقدي) Admin Dashboard

Next.js 16 (App Router, Turbopack). The dashboard is a pure frontend that reads a
Laravel backend API. It has **no database of its own** — everything comes from the
API you point it at.

---

## 1. Environment variables (fill these first)

Copy `.env.example` and provide real values. The table below lists everything.

| Variable | Required? | What it is / where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | **Yes** | Production Laravel API base **including `/api`** (صقر ١ on Railway: `https://aqdi-new-backend-main-production.up.railway.app/api` — never another project's server). Used by the server-side (SSR) axios client. |
| `API_PROXY_TARGET` | Recommended | Server-only rewrite target for `/api/*` — this is what the **browser** effectively talks to in production (see `next.config.mjs`). Set it to the same value as `NEXT_PUBLIC_BASE_URL`. If omitted it defaults to the صقر ١ Railway backend (see `next.config.mjs`). **Not** `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Optional* | Firebase console → Project settings → General → Your apps (Web). |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Optional* | Same place (e.g. `your-project.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Optional* | Firebase project id. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Optional* | e.g. `your-project.appspot.com`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Optional* | Cloud Messaging sender id (numeric). |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Optional* | Web app id (`1:...:web:...`). |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Analytics id (`G-XXXX`), if used. |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Optional* | Cloud Messaging → Web configuration → Web Push certificates. |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Optional | Realtime Database URL — enables the live SEO-crawl progress feature. |

\* **The Firebase group is only needed for web-push notifications.** Leave the whole
group blank and the dashboard runs fine with push disabled (the build generates a
placeholder service worker and the feature is gated by `isFirebaseConfigured()`).

**Minimum to go live:** `NEXT_PUBLIC_BASE_URL` (+ `API_PROXY_TARGET` set to the same
value). Everything else is optional.

---

## 2. Deploy to Vercel (recommended)

1. Push this repo to GitHub/GitLab/Bitbucket and **Import Project** in Vercel.
2. Framework preset: **Next.js** (auto-detected; `vercel.json` also pins it).
3. **Build command:** `npm run build` (already set — it runs the firebase-sw
   generator then `next build`). **Output:** default (`.next`). **Install:** `npm install`.
4. **Node.js version:** set to **22.x** in Project Settings → General → Node.js
   Version (build/CI verified on Node 22; Node ≥ 18.18 is the framework floor).
5. **Environment Variables** (Project Settings → Environment Variables), for the
   **Production** (and Preview) environments — add at minimum:
   - `NEXT_PUBLIC_BASE_URL` = your production API base with `/api`
   - `API_PROXY_TARGET` = same value as above
   - the `NEXT_PUBLIC_FIREBASE_*` group only if you want web push.
6. **Deploy.** Vercel runs `npm run build` and serves the app. `server.js` is **not**
   used on Vercel (that file is only for cPanel/Passenger — see below).

> Note: the `regions` in `vercel.json` is set to `fra1` (Frankfurt) for proximity to
> the KSA API. Change it to your preferred region if desired.

---

## 3. Deploy without Vercel (self-hosted: Node / cPanel / VPS)

Any Node 22 host works. Two options:

### a) Plain Node
```bash
npm install
npm run build          # generates firebase-sw + next build
npm start              # runs `next start` (defaults to port 3000)
```
Set the env vars in the shell/host env (or an `.env.local`) before building. Put a
reverse proxy (Nginx/Apache) in front for TLS.

### b) cPanel / Passenger (Node.js Selector)
This repo ships a custom server for exactly this case:
1. Upload the built app (run `npm install && npm run build` on the server, or build
   locally and upload `.next` + `node_modules` + source).
2. In cPanel → Setup Node.js App: set **Application startup file** to `server.js`,
   **Application mode** to `production`, and Node version to **22**.
3. Add the environment variables in the cPanel app's "Environment variables" panel.
4. Start/Restart the app. `server.js` listens on `process.env.PORT` (default 3001).

---

## 4. What the owner must fill in

- **`NEXT_PUBLIC_BASE_URL`** and **`API_PROXY_TARGET`** — the production Laravel API
  base URL (with `/api`). This is the only thing strictly required to run.
- **Firebase web-push keys** (the `NEXT_PUBLIC_FIREBASE_*` group) — only if push
  notifications are wanted. Get them from the Firebase console for the project.
- **`NEXT_PUBLIC_FIREBASE_DATABASE_URL`** — only if the live SEO-crawl progress
  feature is wanted.

---

## 5. Build note

`npm run build` reaches out to Google Fonts (Tajawal) at build time. On a machine
with no outbound network to `fonts.googleapis.com` the build fails **only** on that
font fetch — this is environmental, not a code error. Vercel and normal hosts have
network access, so this does not occur there. To build fully offline, self-host the
font via `next/font/local`.
