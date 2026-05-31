import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

import {
  ORDER_REALTIME_CHANNEL,
  type OrderRealtimeEvent,
} from "@/lib/realtime/order-events";
import {
  parseOrderSocketSubscription,
  shouldSendEventToSubscription,
  type OrderSocketSubscription,
} from "@/lib/realtime/order-websocket-routing";
import { createRedisConnection } from "@/lib/realtime/redis";

const websocketPath = "/ws/orders";

type UpgradeFallback = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
) => void | Promise<void>;

export function attachOrderWebSocketServer(
  server: HttpServer,
  fallbackUpgrade?: UpgradeFallback
) {
  const websocketServer = new WebSocketServer({ noServer: true });
  const clients = new Map<WebSocket, OrderSocketSubscription>();
  const redisSubscriber = createRedisConnection();

  redisSubscriber.on("error", (error) => {
    console.error("Order websocket Redis subscriber error", error);
  });

  redisSubscriber.subscribe(ORDER_REALTIME_CHANNEL).catch((error) => {
    console.error("Could not subscribe to order realtime channel", error);
  });

  redisSubscriber.on("message", (_channel, message) => {
    let event: OrderRealtimeEvent;
    try {
      event = JSON.parse(message) as OrderRealtimeEvent;
    } catch (error) {
      console.error("Invalid order realtime event payload", error);
      return;
    }

    for (const [client, subscription] of clients) {
      if (
        client.readyState === WebSocket.OPEN &&
        shouldSendEventToSubscription(subscription, event)
      ) {
        client.send(JSON.stringify(event));
      }
    }
  });

  websocketServer.on("connection", (socket, request) => {
    const subscription = getSubscriptionFromRequest(request);
    if (!subscription) {
      socket.close(1008, "Invalid subscription");
      return;
    }

    clients.set(socket, subscription);
    socket.send(JSON.stringify({ kind: "connected" }));

    socket.on("close", () => {
      clients.delete(socket);
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const url = getRequestUrl(request);
    if (!url || url.pathname !== websocketPath) {
      if (fallbackUpgrade) {
        void fallbackUpgrade(request, socket, head);
      }
      return;
    }

    if (!parseOrderSocketSubscription(url)) {
      rejectUpgrade(socket);
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  return websocketServer;
}

function getSubscriptionFromRequest(request: IncomingMessage) {
  const url = getRequestUrl(request);
  return url ? parseOrderSocketSubscription(url) : null;
}

function getRequestUrl(request: IncomingMessage) {
  const host = request.headers.host;
  if (!request.url || !host) {
    return null;
  }

  return new URL(request.url, `http://${host}`);
}

function rejectUpgrade(socket: Duplex) {
  socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
  socket.destroy();
}
