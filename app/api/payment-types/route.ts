import { prisma } from "@/lib/db";
import { getCurrentStaffUser } from "@/lib/staff-auth/guards";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getCurrentStaffUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentTypes = await prisma.paymentType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  return NextResponse.json(paymentTypes);
}
