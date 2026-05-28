"use client";

import type { OrderStatus } from "@prisma/client";
import { OrderCard } from "./order-card";

interface OrderData {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number | null;
  tableCode: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface OrdersListProps {
  orders: OrderData[];
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="staff-empty-state py-12 text-center text-muted-foreground">
        No orders found.
      </div>
    );
  }

  return (
    <div className="staff-orders-list flex flex-col gap-2">
      {orders.map((order) => (
        <OrderCard key={order.id} {...order} />
      ))}
    </div>
  );
}
