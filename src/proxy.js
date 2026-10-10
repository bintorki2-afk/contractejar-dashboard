import { NextResponse } from 'next/server';
import { getSectionForPath, isFeatureDisabled } from '@/src/lib/permissions';
import {
  canAccessRouteFromSnapshot,
  getFirstAllowedHrefFromSnapshot,
  parseAuthSnapshot,
} from '@/src/lib/server-auth';

export function proxy(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  if (pathname.startsWith('/home')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const snapshot = parseAuthSnapshot(request.cookies.get('auth_snapshot')?.value);
    const section = getSectionForPath(pathname);

    // ميزات مُخفاة (عقدي): أعِد التوجيه دائمًا حتى لو كان القسم null أو المستخدم مسؤولًا.
    if (isFeatureDisabled(pathname)) {
      const fallback = getFirstAllowedHrefFromSnapshot(snapshot);
      const target = fallback && fallback !== pathname ? fallback : '/home';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (snapshot && section !== null && !canAccessRouteFromSnapshot(pathname, snapshot)) {
      const fallback = getFirstAllowedHrefFromSnapshot(snapshot);
      const target = fallback && fallback !== pathname ? fallback : '/home';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/home/:path*',
  ],
};
