import axios from "axios";
import { toast } from "sonner";

import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
  isAccessTokenExpired,
} from "@/src/lib/auth-session";
import { useUserStore } from "@/src/stores/user-store";
import { removeAuthCookie } from "@/src/app/actions/auth";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL;
}

// Relative to the client's baseURL — no API-version segment repeated here.
export const AUTH_ENDPOINTS = {
  login: '/admin/employees/login',
  refresh: '/admin/employees/refresh-token',
  logout: '/admin/employees/logout',
};

// Public endpoints never get an Authorization header and never trigger the
// refresh-on-401 flow — otherwise a failed login "refreshes", or a failed
// refresh tries to refresh itself. logout is intentionally NOT here: it still
// requires the bearer token.
export const PUBLIC_AUTH_ENDPOINTS = [AUTH_ENDPOINTS.login, AUTH_ENDPOINTS.refresh];

export const axiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Separate, interceptor-free client for the refresh call itself, so it never
// recurses back into the interceptors below.
const refreshClient = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

function isPublicAuthEndpoint(url = '') {
    return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function isLoginPage() {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
}

// Latches once the session is confirmed dead (refresh token rejected, or none
// left) so a burst of concurrent 401s — several polling hooks landing at once
// — triggers exactly one logout/redirect instead of one per request, and stops
// hammering the refresh endpoint with calls we already know will fail.
// Cleared on a fresh login via resetSessionGuard().
let sessionExpired = false;

export function resetSessionGuard() {
    sessionExpired = false;
}

async function forceLogout() {
    if (sessionExpired) return;
    sessionExpired = true;

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        // Best-effort server-side revocation — never block the redirect on it.
        refreshClient
            .post(
                AUTH_ENDPOINTS.logout,
                { refresh_token: refreshToken },
                { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }
            )
            .catch(() => {});
    }

    clearAuthSession();

    // Also clears the `token` cookie src/proxy.js reads for route protection —
    // without this, the redirect below bounces right back to /home (cookie
    // still says authenticated) which RoutePermissionGuard then bounces back
    // to /login (no client-side session), looping forever. Server Components
    // can't set/delete cookies outside an action/route handler, so this is
    // client-only, same as the redirect it precedes.
    if (typeof window !== "undefined") {
        await removeAuthCookie().catch(() => {});
    }

    if (typeof window !== "undefined" && !isLoginPage()) {
        toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
        // window.location.href is a hard reload — delay it slightly so the
        // toast (rendered via a portal that a hard nav would unmount instantly)
        // is actually visible before the page unloads.
        setTimeout(() => {
            window.location.href = "/login";
        }, 1200);
    }
}

// --- single-flight refresh queue ---
let isRefreshing = false;
let refreshQueue = []; // { resolve, reject }

function resolveQueue(token) {
    refreshQueue.forEach(({ resolve }) => resolve(token));
    refreshQueue = [];
}

function rejectQueue(error) {
    refreshQueue.forEach(({ reject }) => reject(error));
    refreshQueue = [];
}

/** Rejects any requests currently queued behind an in-flight refresh — call on manual logout mid-refresh. */
export function cancelQueuedRefreshes(reason = new Error('Logged out')) {
    isRefreshing = false;
    rejectQueue(reason);
}

/**
 * The actual refresh call — bare axios, no bearer token, no interceptors.
 * Validates the response shape strictly and fails safe: a malformed body
 * throws without touching the stored session, since it may still be valid.
 * Only a definitively dead refresh token (401/403/422) forces logout; any
 * other failure (network error, 429, 5xx, malformed body) leaves the session
 * intact so the next authenticated request retries the refresh naturally.
 */
async function performRefresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const res = await refreshClient.post(AUTH_ENDPOINTS.refresh, { refresh_token: refreshToken });
        const newToken = res.data?.data?.token;
        const newRefreshToken = res.data?.data?.refresh_token;

        if (typeof newToken !== 'string' || typeof newRefreshToken !== 'string') {
            throw new Error('Malformed refresh response');
        }

        const newUser = res.data?.data?.user;
        setAuthTokens(newToken, newRefreshToken, newUser);

        // Storage alone isn't reactive — push into the store too, so can()/the
        // sidebar/route guard see permission changes from this refresh immediately
        // instead of only after a full reload. Access tokens live ~15min, so a
        // role change can otherwise take up to that long to take visible effect.
        useUserStore.setState((state) => ({
            token: newToken,
            user: newUser ?? state.user,
            isAuthenticated: true,
        }));

        return newToken;
    } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 422) {
            forceLogout();
        }
        throw error;
    }
}

function runSingleFlightRefresh() {
    if (!isRefreshing) {
        isRefreshing = true;
        performRefresh()
            .then((token) => {
                isRefreshing = false;
                resolveQueue(token);
            })
            .catch((error) => {
                isRefreshing = false;
                rejectQueue(error);
            });
    }

    return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
    });
}

axiosInstance.interceptors.request.use((config) => {
    if (isPublicAuthEndpoint(config.url)) {
        return config;
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const SERVER_ERROR_MESSAGE = "حدث خطأ في الخادم، حاول مرة أخرى أو تواصل مع الدعم";

/**
 * أخطاء 5xx من الخادم قد تحمل نص الاستثناء الداخلي («حدث خطأ: SQLSTATE…»)، وكل
 * الشاشات تعرض `response.data.message` في التنبيه كما هو. نستبدله برسالة عامة
 * ونُبقي الأصل في `server_message` (للتشخيص فقط، لا يُعرض).
 */
export function sanitizeServerErrorMessage(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status >= 500 && data && typeof data === "object" && typeof data.message === "string") {
        if (data.server_message === undefined) data.server_message = data.message;
        data.message = SERVER_ERROR_MESSAGE;
    }
    return error;
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        sanitizeServerErrorMessage(error);
        const originalRequest = error.config;
        const status = error.response?.status;

        if (!originalRequest || isPublicAuthEndpoint(originalRequest.url) || status !== 401) {
            return Promise.reject(error);
        }

        if (sessionExpired) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            forceLogout();
            return Promise.reject(error);
        }

        if (!getRefreshToken()) {
            forceLogout();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newToken = await runSingleFlightRefresh();
            originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            return Promise.reject(error);
        }
    }
);

/**
 * Proactive refresh on app start, before protected routes render — so the
 * user doesn't eat an avoidable 401 on their first request. No-ops for
 * guests (no tokens at all). Refresh errors are swallowed here: they're
 * already handled by the logout-on-401/403/422 logic inside performRefresh.
 */
export async function bootstrapAuthSession() {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) return;

    if (!accessToken || isAccessTokenExpired()) {
        try {
            await runSingleFlightRefresh();
        } catch {
            // handled above
        }
    }
}
