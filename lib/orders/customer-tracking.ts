export const customerTrackingSteps = [
  { key: "payment", label: "Payment" },
  { key: "preparing", label: "Preparing" },
  { key: "done", label: "Done" },
] as const;

export type CustomerTrackingStep = (typeof customerTrackingSteps)[number];
export type CustomerTrackingStepState = "complete" | "active" | "pending";
export type CustomerTrackingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "AWAITING_PAYMENT"
  | "PAID_SYNCING"
  | "PAID_SYNCED_TO_LOYVERSE"
  | "PAID_SYNC_FAILED"
  | "PREPARING"
  | "DONE"
  | "CANCELLED";

type CustomerTrackingCopy = {
  activeStep: number;
  headline: string;
  detail: string;
  signal: string;
  isFinal?: boolean;
  isCancelled?: boolean;
};

const trackingCopy: Record<CustomerTrackingStatus, CustomerTrackingCopy> = {
  PENDING: {
    activeStep: 0,
    headline: "Order received",
    detail: "Staff will confirm the ticket before payment.",
    signal: "Checking with staff",
  },
  ACCEPTED: {
    activeStep: 0,
    headline: "Ready for payment",
    detail: "Show this ticket at the counter when you are ready.",
    signal: "Counter pay",
  },
  AWAITING_PAYMENT: {
    activeStep: 0,
    headline: "Pay at counter",
    detail: "Show this ticket to the cashier. Preparation starts after payment.",
    signal: "Waiting for cashier",
  },
  PAID_SYNCING: {
    activeStep: 1,
    headline: "Payment recorded",
    detail: "We are syncing the receipt while the order moves forward.",
    signal: "Receipt syncing",
  },
  PAID_SYNCED_TO_LOYVERSE: {
    activeStep: 1,
    headline: "Payment complete",
    detail: "Your receipt is saved. Staff will start preparing the order.",
    signal: "Paid",
  },
  PAID_SYNC_FAILED: {
    activeStep: 1,
    headline: "Payment recorded",
    detail: "Receipt sync needs staff attention, but preparation can continue.",
    signal: "Paid",
  },
  PREPARING: {
    activeStep: 1,
    headline: "Preparing now",
    detail: "Your order is with the counter team.",
    signal: "In progress",
  },
  DONE: {
    activeStep: 2,
    headline: "Order ready",
    detail: "Please collect your order at the counter.",
    signal: "Ready",
    isFinal: true,
  },
  CANCELLED: {
    activeStep: 0,
    headline: "Order cancelled",
    detail: "Please speak with staff if you still need help.",
    signal: "Cancelled",
    isFinal: true,
    isCancelled: true,
  },
};

export function getCustomerTrackingState(status: string) {
  const copy = trackingCopy[status as CustomerTrackingStatus] ?? trackingCopy.PENDING;

  return {
    ...copy,
    steps: customerTrackingSteps.map((step, index) => ({
      ...step,
      state: getStepState({
        index,
        activeStep: copy.activeStep,
        isCancelled: copy.isCancelled,
        isFinal: copy.isFinal,
      }),
    })),
  };
}

function getStepState({
  index,
  activeStep,
  isCancelled,
  isFinal,
}: {
  index: number;
  activeStep: number;
  isCancelled?: boolean;
  isFinal?: boolean;
}): CustomerTrackingStepState {
  if (isCancelled) {
    return index === 0 ? "active" : "pending";
  }

  if (isFinal && index <= activeStep) {
    return "complete";
  }

  if (index < activeStep) {
    return "complete";
  }

  return index === activeStep ? "active" : "pending";
}
