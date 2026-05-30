import { prisma } from "@/lib/db";
import { getStaffPushConfig } from "@/lib/push/staff-alerts";
import { getCurrentStaffUser } from "@/lib/staff-auth/guards";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

export async function GET() {
  if (!(await getCurrentStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getStaffPushConfig();
  return NextResponse.json({
    enabled: config.enabled,
    publicKey: config.publicKey,
  });
}

export async function POST(request: Request) {
  if (!(await getCurrentStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = pushSubscriptionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid push subscription" },
      { status: 400 }
    );
  }

  const userAgent = request.headers.get("user-agent");
  const { endpoint, keys } = parsed.data;

  await prisma.staffPushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      enabled: true,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      enabled: true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!(await getCurrentStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteSubscriptionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid push subscription" },
      { status: 400 }
    );
  }

  await prisma.staffPushSubscription
    .update({
      where: { endpoint: parsed.data.endpoint },
      data: { enabled: false },
    })
    .catch(() => null);

  return NextResponse.json({ success: true });
}
