import { getCurrentShiftOrderSummaries } from "@/lib/orders/order-realtime-data";
import { getCurrentStaffUser } from "@/lib/staff-auth/guards";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getCurrentShiftOrderSummaries());
}
