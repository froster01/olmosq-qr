import { prisma } from "@/lib/db";
import { getStaffNotificationOrder } from "@/lib/orders/order-realtime-data";
import {
  notifyNewStaffOrder,
  notifyStaffPushSubscriptions,
} from "@/lib/push/staff-alerts";
import {
  parseStaffNotificationJobData,
  type StaffNotificationJobData,
} from "@/lib/realtime/order-events";

export async function processStaffNotificationJob(
  data: StaffNotificationJobData
) {
  const job = parseStaffNotificationJobData(data);
  const order = await getStaffNotificationOrder(job.orderId);

  if (!order) {
    return { skipped: true as const };
  }

  return notifyNewStaffOrder({
    order,
    loadSubscriptions: () =>
      prisma.staffPushSubscription.findMany({
        where: { enabled: true },
        select: { endpoint: true, p256dh: true, auth: true },
      }),
    notifySubscriptions: ({ subscriptions, payload }) =>
      notifyStaffPushSubscriptions({
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
