import { NextResponse, type NextRequest } from "next/server";

import { isStaffCookieHeaderAuthenticated } from "@/lib/staff-auth/request";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = isStaffCookieHeaderAuthenticated(
    request.headers.get("cookie") ?? undefined
  );

  if (pathname === "/staff/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/staff/orders", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated && isStaffJsonEndpoint(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/staff/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/staff/:path*",
};

function isStaffJsonEndpoint(pathname: string) {
  return pathname === "/staff/orders/api" || pathname === "/staff/push-subscriptions";
}
