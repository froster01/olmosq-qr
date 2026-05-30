"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSafeStaffNextPath } from "@/lib/staff-auth/paths";
import { verifyStaffPassword } from "@/lib/staff-auth/password";
import {
  clearStaffSessionCookie,
  setStaffSessionCookie,
} from "@/lib/staff-auth/session";

export type StaffLoginState = {
  error: string | null;
};

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function loginStaffAction(
  _state: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next")?.toString(),
  });

  if (!parsed.success) {
    return { error: "Enter your username and password." };
  }

  const user = await prisma.staffUser.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
    select: { id: true, username: true, passwordHash: true, isActive: true },
  });

  if (
    !user ||
    !user.isActive ||
    !(await verifyStaffPassword(parsed.data.password, user.passwordHash))
  ) {
    return { error: "Invalid username or password." };
  }

  try {
    await setStaffSessionCookie({
      staffUserId: user.id,
      username: user.username,
    });
  } catch {
    return { error: "Staff session is not configured." };
  }

  redirect(getSafeStaffNextPath(parsed.data.next ?? null));
}

export async function logoutStaffAction() {
  await clearStaffSessionCookie();
  redirect("/staff/login");
}
