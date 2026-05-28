import { prisma } from "@/lib/db";
import { fetchAllPages } from "./client";
import type { LoyversePaymentType } from "./types";

export async function syncPaymentTypes(): Promise<number> {
  const paymentTypes = await fetchAllPages<LoyversePaymentType>(
    "/payment_types",
    "payment_types"
  );

  let count = 0;
  for (const pt of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { loyverseId: pt.id },
      update: {
        name: pt.name,
      },
      create: {
        loyverseId: pt.id,
        name: pt.name,
      },
    });
    count++;
  }
  return count;
}
