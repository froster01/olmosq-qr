"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMissingTableCreateInputs } from "@/lib/tables/table-generation";

const generateTablesSchema = z.object({
  count: z.number().int().min(1).max(200),
});

export async function generateTablesForQrAction(input: { count: number }) {
  const parsed = generateTablesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a whole number from 1 to 200.",
    };
  }

  try {
    const existingTables = await prisma.table.findMany({
      select: { code: true, number: true },
    });
    const missingTables = getMissingTableCreateInputs(
      existingTables,
      parsed.data.count
    );

    if (missingTables.length > 0) {
      await prisma.table.createMany({
        data: missingTables,
      });
    }

    revalidatePath("/staff/tables");
    revalidatePath("/table/[tableCode]", "page");

    return {
      success: true,
      data: {
        createdCount: missingTables.length,
        desiredTotal: parsed.data.count,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Could not generate table QR codes. Please try again.",
    };
  }
}
