import {
  ORDER_REALTIME_CHANNEL,
  type OrderRealtimeEvent,
} from "@/lib/realtime/order-events";
import { getRedisPublisher } from "@/lib/realtime/redis";

export async function publishOrderRealtimeEvent(event: OrderRealtimeEvent) {
  await getRedisPublisher().publish(ORDER_REALTIME_CHANNEL, JSON.stringify(event));
}
