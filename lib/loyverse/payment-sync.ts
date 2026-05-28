import { prisma } from "@/lib/db";
import { fetchAllPages } from "./client";
import type { LoyversePaymentType } from "./types";

export function mapLoyversePaymentTypeForUpsert(pt: LoyversePaymentType) {
  return {
    loyverseId: pt.id,
    name: pt.name,
    type: pt.type,
  };
}

export async function syncPaymentTypes(): Promise<number> {
  const paymentTypes = await fetchAllPages<LoyversePaymentType>(
    "/payment_types",
    "payment_types"
  );

  let count = 0;
  for (const pt of paymentTypes) {
    const paymentTypeData = mapLoyversePaymentTypeForUpsert(pt);
    await prisma.paymentType.upsert({
      where: { loyverseId: paymentTypeData.loyverseId },
      update: {
        name: paymentTypeData.name,
        type: paymentTypeData.type,
      },
      create: {
        loyverseId: paymentTypeData.loyverseId,
        name: paymentTypeData.name,
        type: paymentTypeData.type,
      },
    });
    count++;
  }
  return count;
}
