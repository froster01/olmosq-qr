import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getStaffPushConfig } from "@/lib/push/staff-fallback-alerts";
import { isStaffCookieHeaderAuthenticated } from "@/lib/staff-auth/request";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const deleteSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function isAuthenticated(request: NextRequest) {
  return isStaffCookieHeaderAuthenticated(request.headers.get("cookie") ?? "");
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return unauthorized();
  }

  const config = getStaffPushConfig();
  return NextResponse.json(
    config.enabled
      ? { enabled: true, publicKey: config.publicKey }
      : { enabled: false, publicKey: config.publicKey }
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return unauthorized();
  }

  const parsed = pushSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid push subscription" },
      { status: 400 }
    );
  }

  await prisma.staffPushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: {
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      enabled: true,
      userAgent: request.headers.get("user-agent"),
    },
    create: {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return unauthorized();
  }

  const parsed = deleteSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid push subscription" },
      { status: 400 }
    );
  }

  await prisma.staffPushSubscription.updateMany({
    where: { endpoint: parsed.data.endpoint },
    data: { enabled: false },
  });

  return NextResponse.json({ success: true });
}
