import { prisma } from "@/lib/db";
import { getStaffFallbackNotificationOrder } from "@/lib/orders/order-realtime-data";
import {
  notifyNewStaffFallbackOrder,
  notifyStaffFallbackSubscriptions,
} from "@/lib/push/staff-fallback-alerts";
import {
  parseStaffNotificationJobData,
  type StaffNotificationJobData,
} from "@/lib/realtime/order-events";
import { isStaffOrdersPageActive } from "@/lib/staff-presence/orders-page-presence";

export async function processStaffNotificationJob(
  data: StaffNotificationJobData
) {
  const job = parseStaffNotificationJobData(data);
  const order = await getStaffFallbackNotificationOrder(job.orderId);

  if (!order) {
    return { skipped: true as const };
  }

  return notifyNewStaffFallbackOrder({
    order,
    isStaffActive: isStaffOrdersPageActive,
    loadSubscriptions: () =>
      prisma.staffPushSubscription.findMany({
        where: { enabled: true },
        select: { endpoint: true, p256dh: true, auth: true },
      }),
    notifySubscriptions: ({ subscriptions, payload }) =>
      notifyStaffFallbackSubscriptions({
        subscriptions,
        payload,
        onExpired: async (subscription) => {
          await prisma.staffPushSubscription.update({
            where: { endpoint: subscription.endpoint },
            data: { enabled: false },
          });
        },
      }),
  });
}
