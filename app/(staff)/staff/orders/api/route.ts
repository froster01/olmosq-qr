import { getCurrentShiftOrderSummaries } from "@/lib/orders/order-realtime-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCurrentShiftOrderSummaries());
}
