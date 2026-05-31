import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { markStaffAlertPresence } from "@/lib/push/staff-alert-presence";
import { isStaffCookieHeaderAuthenticated } from "@/lib/staff-auth/request";

const alertPresenceSchema = z.object({
  endpoint: z.string().url(),
});

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!isStaffCookieHeaderAuthenticated(request.headers.get("cookie") ?? "")) {
    return unauthorized();
  }

  const parsed = alertPresenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid alert presence" },
      { status: 400 }
    );
  }

  await markStaffAlertPresence(parsed.data.endpoint);

  return NextResponse.json({ success: true });
}
