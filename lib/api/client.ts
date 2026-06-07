const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CustomerMenuItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  variants: Array<{
    id: string;
    name: string;
    priceAdjustment: string;
  }>;
  modifiers: Array<{
    id: string;
    name: string;
    priceAdjustment: string;
  }>;
}

export interface CustomerMenuCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  asksTemperature: boolean;
  items: CustomerMenuItem[];
}

export interface MenuResponse {
  table: {
    code: string;
    number: number;
    name: string | null;
    isActive: boolean;
  };
  shift: {
    id: string;
    status: string;
    shiftNumber: number;
  } | null;
  menu: {
    categories: CustomerMenuCategory[];
  };
}

export interface OrderItem {
  itemId: string;
  variantId?: string;
  quantity: number;
  modifierIds: string[];
  notes?: string;
  temperature?: 'hot' | 'cold';
}

export interface CreateOrderRequest {
  tableCode: string;
  customerName: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: number;
  shiftOrderNumber: number;
  status: string;
}

export interface OrderDetails {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number;
  customerName: string;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  customerPaymentMethod: string;
  table: {
    code: string;
    number: number;
    name: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    notes: string | null;
    item: {
      id: string;
      name: string;
      description: string | null;
    };
    variant: {
      id: string;
      name: string;
    } | null;
    modifiers: Array<{
      id: string;
      name: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatus {
  id: string;
  status: string;
  updatedAt: string;
}

/**
 * Customer API Client
 */
export const customerApi = {
  /**
   * Get menu for a specific table
   */
  async getMenu(tableCode: string): Promise<MenuResponse> {
    const response = await fetch(`${API_BASE_URL}/customer/menu?tableCode=${tableCode}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch menu' }));
      throw new Error(error.error || 'Failed to fetch menu');
    }

    return response.json();
  },

  /**
   * Submit a new order
   */
  async submitOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/customer/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit order' }));
      throw new Error(error.error || 'Failed to submit order');
    }

    return response.json();
  },

  /**
   * Get order details by ID
   */
  async getOrderDetails(orderId: string): Promise<OrderDetails> {
    const response = await fetch(`${API_BASE_URL}/customer/orders/${orderId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Order not found' }));
      throw new Error(error.error || 'Order not found');
    }

    return response.json();
  },

  /**
   * Get order status (lightweight)
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await fetch(`${API_BASE_URL}/customer/orders/${orderId}/status`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Order not found' }));
      throw new Error(error.error || 'Order not found');
    }

    return response.json();
  },
};
