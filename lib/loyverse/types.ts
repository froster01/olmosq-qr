export interface LoyverseCategory {
  id: string;
  name: string;
  color?: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface LoyverseItemVariant {
  variant_id: string;
  item_id: string;
  sku?: string;
  default_price: number;
  stores: Array<{
    store_id: string;
    pricing_type: string;
    price: number;
    available_for_sale: boolean;
  }>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LoyverseModifier {
  id: string;
  name: string;
  show_by_default: boolean;
  modifier_options: LoyverseModifierOption[];
}

export interface LoyverseModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface LoyverseItem {
  id: string;
  handle?: string;
  item_name: string;
  description?: string | null;
  sku?: string | null;
  image_url?: string | null;
  category_id: string;
  is_composite: boolean;
  modifier_ids?: string[];
  variants: LoyverseItemVariant[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LoyversePaymentType {
  id: string;
  name: string;
  type: string;
  stores?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LoyverseReceiptResponse {
  receipt_number: string;
  receipt_date: string;
  total_money: number;
}

export interface LoyverseShift {
  id: string;
  store_id: string;
  pos_device_id: string;
  opened_at: string;
  closed_at?: string | null;
  starting_cash: number;
  cash_payments: number;
  cash_refunds: number;
  paid_in: number;
  paid_out: number;
  expected_cash: number;
  actual_cash?: number | null;
}

export interface LoyversePaginatedResponse<T> {
  items?: T[];
  categories?: T[];
  payment_types?: T[];
  shifts?: T[];
  cursor?: string;
}
