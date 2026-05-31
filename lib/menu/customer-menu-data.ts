import { unstable_cache } from "next/cache";

import { CUSTOMER_MENU_CACHE_TAG } from "@/lib/cache/revalidation";
import { shouldShowCategoryInCustomerMenu } from "@/lib/menu/category-visibility";

type DateLike = Date | string;
type MoneyLike = number | string | { toString(): string };

type RawCustomerMenuVariant = {
  id: string;
  loyverseId: string;
  itemId: string;
  name: string;
  priceAdjustment: MoneyLike;
  sortOrder: number;
  createdAt: DateLike;
  updatedAt: DateLike;
};

type RawCustomerMenuModifier = {
  id: string;
  loyverseId: string;
  itemId: string;
  name: string;
  priceAdjustment: MoneyLike;
  createdAt: DateLike;
  updatedAt: DateLike;
};

type RawCustomerMenuItem = {
  id: string;
  loyverseId: string;
  name: string;
  description: string | null;
  basePrice: MoneyLike;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: DateLike;
  updatedAt: DateLike;
  variants: RawCustomerMenuVariant[];
  modifiers: RawCustomerMenuModifier[];
};

type RawCustomerMenuCategory = {
  id: string;
  loyverseId: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  asksTemperature: boolean;
  isVisibleInMenu: boolean;
  createdAt: DateLike;
  updatedAt: DateLike;
  items: RawCustomerMenuItem[];
};

export type CustomerMenuVariant = Omit<
  RawCustomerMenuVariant,
  "priceAdjustment" | "createdAt" | "updatedAt"
> & {
  priceAdjustment: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMenuModifier = Omit<
  RawCustomerMenuModifier,
  "priceAdjustment" | "createdAt" | "updatedAt"
> & {
  priceAdjustment: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMenuItem = Omit<
  RawCustomerMenuItem,
  "basePrice" | "createdAt" | "updatedAt" | "variants" | "modifiers"
> & {
  basePrice: number;
  createdAt: string;
  updatedAt: string;
  variants: CustomerMenuVariant[];
  modifiers: CustomerMenuModifier[];
};

export type CustomerMenuCategory = Omit<
  RawCustomerMenuCategory,
  "createdAt" | "updatedAt" | "items"
> & {
  createdAt: string;
  updatedAt: string;
  items: CustomerMenuItem[];
};

function serializeDate(value: DateLike) {
  return value instanceof Date ? value.toISOString() : value;
}

function serializeMoney(value: MoneyLike) {
  return Number(value);
}

export function serializeCustomerMenuCategories(
  categories: RawCustomerMenuCategory[]
): CustomerMenuCategory[] {
  return categories
    .filter(shouldShowCategoryInCustomerMenu)
    .map((category) => {
      const items = category.items
        .filter((item) => item.isAvailable)
        .map((item) => ({
          ...item,
          basePrice: serializeMoney(item.basePrice),
          createdAt: serializeDate(item.createdAt),
          updatedAt: serializeDate(item.updatedAt),
          variants: item.variants.map((variant) => ({
            ...variant,
            priceAdjustment: serializeMoney(variant.priceAdjustment),
            createdAt: serializeDate(variant.createdAt),
            updatedAt: serializeDate(variant.updatedAt),
          })),
          modifiers: item.modifiers.map((modifier) => ({
            ...modifier,
            priceAdjustment: serializeMoney(modifier.priceAdjustment),
            createdAt: serializeDate(modifier.createdAt),
            updatedAt: serializeDate(modifier.updatedAt),
          })),
        }));

      return {
        ...category,
        createdAt: serializeDate(category.createdAt),
        updatedAt: serializeDate(category.updatedAt),
        items,
      };
    })
    .filter((category) => category.items.length > 0);
}

export const getCachedCustomerMenuCategories = unstable_cache(
  async () => {
    const { prisma } = await import("@/lib/db");
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { name: "asc" },
          include: {
            variants: { orderBy: { sortOrder: "asc" } },
            modifiers: { orderBy: { name: "asc" } },
          },
        },
      },
    });

    return serializeCustomerMenuCategories(categories);
  },
  ["customer-menu"],
  { tags: [CUSTOMER_MENU_CACHE_TAG] }
);
