export type StaffStatusAction = {
  label: string;
  nextStatus: string;
  variant?: "default" | "destructive";
};

export function getCheckoutOrderStatus(): "AWAITING_PAYMENT" {
  return "AWAITING_PAYMENT";
}

export function getPaidOrderStatus(): "PREPARING" {
  return "PREPARING";
}

export function getReceiptSyncFailedOrderStatus(): "PREPARING" {
  return "PREPARING";
}

export function getStaffStatusActions(status: string): StaffStatusAction[] {
  const actions: Record<string, StaffStatusAction[]> = {
    PENDING: [
      { label: "Accept", nextStatus: "ACCEPTED" },
      { label: "Cancel", nextStatus: "CANCELLED", variant: "destructive" },
    ],
    ACCEPTED: [
      { label: "Start Preparing", nextStatus: "PREPARING" },
      { label: "Cancel", nextStatus: "CANCELLED", variant: "destructive" },
    ],
    AWAITING_PAYMENT: [
      { label: "Collect Payment", nextStatus: "AWAITING_PAYMENT" },
      { label: "Cancel", nextStatus: "CANCELLED", variant: "destructive" },
    ],
    PREPARING: [{ label: "Mark Done", nextStatus: "DONE" }],
  };

  return actions[status] ?? [];
}
