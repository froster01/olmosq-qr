import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getStaffSession } from "./session";

export const getCurrentStaffUser = cache(async () => {
  const session = await getStaffSession();
  if (!session) {
    return null;
  }

  return prisma.staffUser.findFirst({
    where: {
      id: session.staffUserId,
      username: session.username,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
    },
  });
});

export async function requireStaffPageUser() {
  const user = await getCurrentStaffUser();
  if (!user) {
    redirect("/staff/login");
  }
  return user;
}

export async function getUnauthorizedStaffActionResult() {
  return (await getCurrentStaffUser())
    ? null
    : ({ success: false as const, error: "Unauthorized" });
}
