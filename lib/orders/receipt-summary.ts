export interface ReceiptSummaryItem {
  item: { name: string };
  variant: { name: string } | null;
  modifiers: Array<{ modifier: { name: string } }>;
}

export function buildReceiptItemDescription(item: ReceiptSummaryItem): string {
  const variant = item.variant ? ` (${item.variant.name})` : "";
  const modifiers =
    item.modifiers.length > 0
      ? ` + ${item.modifiers.map((m) => m.modifier.name).join(", ")}`
      : "";

  return `${item.item.name}${variant}${modifiers}`;
}

export function formatReceiptMoney(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}
