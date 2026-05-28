export function getUniqueOrderItemIds(
  items: Array<{ itemId: string }>
): string[] {
  return Array.from(new Set(items.map((item) => item.itemId)));
}

export function hasAllRequestedItems({
  requestedItemIds,
  foundItemIds,
}: {
  requestedItemIds: string[];
  foundItemIds: string[];
}): boolean {
  const found = new Set(foundItemIds);
  return getUniqueOrderItemIds(
    requestedItemIds.map((itemId) => ({ itemId }))
  ).every((itemId) => found.has(itemId));
}
