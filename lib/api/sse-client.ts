const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface OrderData {
  id: string;
  status: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface SSEOrderUpdate {
  type: 'connected' | 'initial' | 'order-update';
  order?: OrderData;
  timestamp: string;
}

/**
 * Subscribe to real-time order updates via Server-Sent Events (SSE)
 * 
 * @param orderId - The order ID to subscribe to
 * @param onUpdate - Callback function when order updates are received
 * @returns Cleanup function to close the connection
 */
export function subscribeToOrderUpdates(
  orderId: string,
  onUpdate: (data: SSEOrderUpdate) => void
): () => void {
  const eventSource = new EventSource(
    `${API_BASE_URL}/customer/orders/${orderId}/stream`
  );

  eventSource.onmessage = (event) => {
    try {
      const data: SSEOrderUpdate = JSON.parse(event.data);
      onUpdate(data);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    // EventSource will automatically try to reconnect
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * React hook for subscribing to order updates
 * 
 * Usage:
 * ```tsx
 * const { order, status, isConnected } = useOrderUpdates(orderId);
 * ```
 */
export function useOrderUpdates(orderId: string) {
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [status, setStatus] = React.useState<string>('');
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!orderId) return;

    const unsubscribe = subscribeToOrderUpdates(orderId, (data) => {
      if (data.type === 'connected') {
        setIsConnected(true);
      } else if (data.type === 'initial' || data.type === 'order-update') {
        if (data.order) {
          setOrder(data.order);
          setStatus(data.order.status);
        }
      }
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [orderId]);

  return { order, status, isConnected };
}

// Note: Import React in the component that uses this hook
import * as React from 'react';
