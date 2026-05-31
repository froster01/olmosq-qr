import { prisma } from "@/lib/db";
import { getStaffNotificationOrder } from "@/lib/orders/order-realtime-data";
import { filterInactiveStaffPushSubscriptions } from "@/lib/push/staff-alert-presence";
import {
  notifyNewStaffOrder,
  notifyStaffPushSubscriptions,
  type StaffOrderPushAlertInput,
  type StaffPushSubscriptionInput,
} from "@/lib/push/staff-alerts";
import {
  parseStaffNotificationJobData,
  type StaffNotificationJobData,
} from "@/lib/realtime/order-events";

type StaffNotificationProcessorDependencies = {
  loadOrder: (orderId: string) => Promise<StaffOrderPushAlertInput | null>;
  loadSubscriptions: () => Promise<StaffPushSubscriptionInput[]>;
  filterInactiveSubscriptions: (
    subscriptions: StaffPushSubscriptionInput[]
  ) => Promise<StaffPushSubscriptionInput[]>;
  notifySubscriptions: typeof notifyStaffPushSubscriptions;
  disableExpiredSubscription: (
    subscription: StaffPushSubscriptionInput
  ) => Promise<void>;
};

const defaultDependencies: StaffNotificationProcessorDependencies = {
  loadOrder: getStaffNotificationOrder,
  loadSubscriptions: () =>
    prisma.staffPushSubscription.findMany({
      where: { enabled: true },
      select: { endpoint: true, p256dh: true, auth: true },
    }),
  filterInactiveSubscriptions: filterInactiveStaffPushSubscriptions,
  notifySubscriptions: notifyStaffPushSubscriptions,
  disableExpiredSubscription: async (subscription) => {
    await prisma.staffPushSubscription.update({
      where: { endpoint: subscription.endpoint },
      data: { enabled: false },
    });
  },
};

export async function processStaffNotificationJob(
  data: StaffNotificationJobData,
  dependencies: StaffNotificationProcessorDependencies = defaultDependencies
) {
  const job = parseStaffNotificationJobData(data);
  const order = await dependencies.loadOrder(job.orderId);

  if (!order) {
    return { skipped: true as const };
  }

  const subscriptions = await dependencies.loadSubscriptions();
  const inactiveSubscriptions =
    await dependencies.filterInactiveSubscriptions(subscriptions);

  if (subscriptions.length > 0 && inactiveSubscriptions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      skipped: true as const,
      reason: "active_staff_alerts" as const,
    };
  }

  return notifyNewStaffOrder({
    order,
    loadSubscriptions: async () => inactiveSubscriptions,
    notifySubscriptions: ({ subscriptions, payload }) =>
      dependencies.notifySubscriptions({
        subscriptions,
        payload,
        onExpired: async (subscription) => {
          await dependencies.disableExpiredSubscription(subscription);
        },
      }),
  });
}
