"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { moveCategoryInOrder } from "@/lib/menu/category-sort";
import { getUnauthorizedStaffActionResult } from "@/lib/staff-auth/guards";
import { z } from "zod";

const updateCategoryTemperatureSchema = z.object({
  categoryId: z.string().min(1),
  asksTemperature: z.boolean(),
});

const updateCategoryVisibilitySchema = z.object({
  categoryId: z.string().min(1),
  isVisibleInMenu: z.boolean(),
});

const moveCategorySchema = z.object({
  categoryId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

async function normalizeCategorySortOrders() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, sortOrder: true },
  });

  const isNormalized = categories.every(
    (category, index) => category.sortOrder === index + 1
  );
  if (isNormalized) {
    return categories;
  }

  await prisma.$transaction(
    categories.map((category, index) =>
      prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: index + 1 },
      })
    )
  );

  return categories.map((category, index) => ({
    ...category,
    sortOrder: index + 1,
  }));
}

export async function updateCategoryTemperatureAction(input: {
  categoryId: string;
  asksTemperature: boolean;
}) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  const parsed = updateCategoryTemperatureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Choose a valid category setting." };
  }

  await prisma.category.update({
    where: { id: parsed.data.categoryId },
    data: { asksTemperature: parsed.data.asksTemperature },
  });

  revalidatePath("/staff/menu-settings");
  revalidatePath("/table/[tableCode]", "page");

  return { success: true };
}

export async function updateCategoryVisibilityAction(input: {
  categoryId: string;
  isVisibleInMenu: boolean;
}) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  const parsed = updateCategoryVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Choose a valid category setting." };
  }

  await prisma.category.update({
    where: { id: parsed.data.categoryId },
    data: { isVisibleInMenu: parsed.data.isVisibleInMenu },
  });

  revalidatePath("/staff/menu-settings");
  revalidatePath("/table/[tableCode]", "page");

  return { success: true };
}

export async function moveCategoryAction(input: {
  categoryId: string;
  direction: "up" | "down";
}) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  const parsed = moveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Choose a valid category order." };
  }

  const categories = await normalizeCategorySortOrders();
  const nextCategories = moveCategoryInOrder(
    categories,
    parsed.data.categoryId,
    parsed.data.direction
  );

  if (nextCategories === categories) {
    return { success: true };
  }

  await prisma.$transaction(
    nextCategories.map((category, index) =>
      prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: index + 1 },
      })
    )
  );

  revalidatePath("/staff/menu-settings");
  revalidatePath("/table/[tableCode]", "page");

  return { success: true };
}
