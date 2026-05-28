export interface CartItem {
  itemId: string;
  itemName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  modifierIds: string[];
  modifierNames: string[];
  notes?: string;
  unitPrice: number;
}
