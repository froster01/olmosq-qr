import { getOrderRealtimeEvent } from "@/lib/orders/order-realtime-data";
import {
  parseOrderEventJobData,
  type OrderEventJobData,
} from "@/lib/realtime/order-events";
import { publishOrderRealtimeEvent } from "@/lib/realtime/order-pubsub";

export async function processOrderEventJob(data: OrderEventJobData) {
  const job = parseOrderEventJobData(data);
  const event = await getOrderRealtimeEvent({
    kind: job.kind,
    orderId: job.orderId,
  });

  if (!event) {
    return { published: false };
  }

  await publishOrderRealtimeEvent(event);
  return { published: true };
}
