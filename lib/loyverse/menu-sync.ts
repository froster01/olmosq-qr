import { prisma } from "@/lib/db";
import { fetchAllPages } from "./client";
import type { LoyverseCategory, LoyverseItem } from "./types";

export async function syncCategories(): Promise<number> {
  const categories = await fetchAllPages<LoyverseCategory>(
    "/categories",
    "categories"
  );

  let count = 0;
  for (const cat of categories) {
    if (cat.deleted_at) continue;

    await prisma.category.upsert({
      where: { loyverseId: cat.id },
      update: {
        name: cat.name,
      },
      create: {
        loyverseId: cat.id,
        name: cat.name,
      },
    });
    count++;
  }
  return count;
}

export async function syncItems(): Promise<number> {
  const items = await fetchAllPages<LoyverseItem>("/items", "items");
  let count = 0;

  for (const item of items) {
    if (item.deleted_at) continue;

    // Skip items with no category
    if (!item.category_id) {
      console.warn(`Skipping item ${item.item_name}: no category_id`);
      continue;
    }

    const category = await prisma.category.findUnique({
      where: { loyverseId: item.category_id },
    });
    if (!category) {
      console.warn(
        `Skipping item ${item.item_name}: category ${item.category_id} not found in DB (sync categories first)`
      );
      continue;
    }

    // Use first variant's price as base price
    const basePrice = item.variants?.[0]?.default_price ?? 0;

    await prisma.item.upsert({
      where: { loyverseId: item.id },
      update: {
        name: item.item_name,
        description: item.description,
        basePrice,
        categoryId: category.id,
        imageUrl: item.image_url,
        isAvailable: true,
      },
      create: {
        loyverseId: item.id,
        name: item.item_name,
        description: item.description,
        basePrice,
        categoryId: category.id,
        imageUrl: item.image_url,
      },
    });

    // Sync variants
    if (item.variants && item.variants.length > 0) {
      const dbItem = await prisma.item.findUnique({
        where: { loyverseId: item.id },
      });
      if (!dbItem) continue;

      for (const variant of item.variants) {
        if (variant.deleted_at) continue;

        // Price adjustment relative to base price
        const priceAdjustment = variant.default_price - basePrice;

        await prisma.variant.upsert({
          where: { loyverseId: variant.variant_id },
          update: {
            itemId: dbItem.id,
            name: variant.sku || `Default`,
            priceAdjustment,
          },
          create: {
            loyverseId: variant.variant_id,
            itemId: dbItem.id,
            name: variant.sku || `Default`,
            priceAdjustment,
          },
        });
      }
    }

    count++;
  }
  return count;
}

export async function syncFullMenu(): Promise<{
  categories: number;
  items: number;
}> {
  const categories = await syncCategories();
  const items = await syncItems();
  return { categories, items };
}
