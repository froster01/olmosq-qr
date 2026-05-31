import webPush from "web-push";

type PushEnv = Record<string, string | undefined>;

export type StaffPushConfig =
  | {
      enabled: false;
      publicKey: string | null;
    }
  | {
      enabled: true;
      publicKey: string;
      privateKey: string;
      subject: string;
    };

export interface StaffPushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface StaffOrderFallbackAlertInput {
  orderId: string;
  displayNumber: string;
  tableCode: string;
  customerName: string;
  total: number;
  itemCount: number;
}

export interface StaffPushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface StaffPushLogger {
  error: (message: string, error: unknown) => void;
}

export function getStaffPushConfig(env: PushEnv = process.env): StaffPushConfig {
  const publicKey =
    env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
    env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
    null;
  const privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const contactEmail = env.WEB_PUSH_CONTACT_EMAIL?.trim();

  if (!publicKey || !privateKey || !contactEmail) {
    return { enabled: false, publicKey };
  }

  return {
    enabled: true,
    publicKey,
    privateKey,
    subject: contactEmail.startsWith("mailto:")
      ? contactEmail
      : `mailto:${contactEmail}`,
  };
}

export function buildNewOrderFallbackPushPayload(
  order: StaffOrderFallbackAlertInput
): StaffPushPayload {
  return {
    title: `New order ${order.displayNumber}`,
    body: `Table ${order.tableCode}, ${order.customerName}, ${
      order.itemCount
    } ${order.itemCount === 1 ? "item" : "items"}, RM ${order.total.toFixed(2)}`,
    url: `/staff/orders/${order.orderId}`,
    tag: `order-${order.orderId}`,
  };
}

export async function sendStaffFallbackPushNotification({
  subscription,
  payload,
  config = getStaffPushConfig(),
}: {
  subscription: StaffPushSubscriptionInput;
  payload: StaffPushPayload;
  config?: StaffPushConfig;
}) {
  if (!config.enabled) {
    return { success: false as const, skipped: true as const };
  }

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload)
  );

  return { success: true as const };
}

export function isExpiredPushSubscriptionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const statusCode = "statusCode" in error ? error.statusCode : null;
  return statusCode === 404 || statusCode === 410;
}

export async function notifyStaffFallbackSubscriptions({
  subscriptions,
  payload,
  onExpired,
}: {
  subscriptions: StaffPushSubscriptionInput[];
  payload: StaffPushPayload;
  onExpired?: (subscription: StaffPushSubscriptionInput) => Promise<void>;
}) {
  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        const result = await sendStaffFallbackPushNotification({
          subscription,
          payload,
        });
        return { success: result.success };
      } catch (error) {
        if (isExpiredPushSubscriptionError(error)) {
          await onExpired?.(subscription);
        }
        return { success: false, error };
      }
    })
  );

  return {
    sent: results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length,
    failed: results.filter(
      (result) => result.status === "rejected" || !result.value.success
    ).length,
  };
}

export async function notifyNewStaffFallbackOrder({
  order,
  isStaffActive,
  loadSubscriptions,
  notifySubscriptions = notifyStaffFallbackSubscriptions,
  logger = console,
}: {
  order: StaffOrderFallbackAlertInput;
  isStaffActive: () => Promise<boolean>;
  loadSubscriptions: () => Promise<StaffPushSubscriptionInput[]>;
  notifySubscriptions?: typeof notifyStaffFallbackSubscriptions;
  logger?: StaffPushLogger;
}) {
  try {
    if (await isStaffActive()) {
      return { sent: 0, failed: 0, skipped: true as const };
    }

    const subscriptions = await loadSubscriptions();

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, skipped: true as const };
    }

    return await notifySubscriptions({
      subscriptions,
      payload: buildNewOrderFallbackPushPayload(order),
    });
  } catch (error) {
    logger.error("Failed to send staff fallback push alert", error);
    return { sent: 0, failed: 0, skipped: true as const };
  }
}
