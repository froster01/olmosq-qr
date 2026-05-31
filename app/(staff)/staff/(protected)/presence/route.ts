import { NextResponse, type NextRequest } from "next/server";

import { markStaffOrdersPageActive } from "@/lib/staff-presence/orders-page-presence";
import { isStaffCookieHeaderAuthenticated } from "@/lib/staff-auth/request";

export async function POST(request: NextRequest) {
  if (!isStaffCookieHeaderAuthenticated(request.headers.get("cookie") ?? "")) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  await markStaffOrdersPageActive();
  return NextResponse.json({ success: true });
}
