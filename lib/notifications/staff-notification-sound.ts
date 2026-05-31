import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";

export const STAFF_NOTIFICATION_SOUND_SRC = "/sounds/new-order.mp3";
export const STAFF_NOTIFICATION_SOUND_STORAGE_KEY =
  "olmosq.staffNotificationSound";
export const STAFF_NOTIFICATION_SOUND_CHANGE_EVENT =
  "olmosq:staff-notification-sound-change";

type StaffNotificationSoundAudio = {
  currentTime: number;
  muted: boolean;
  preload: string;
  volume: number;
  load?: () => void;
  pause?: () => void;
  play: () => Promise<void> | void;
};

type StaffNotificationSoundFactoryOptions = {
  createAudio?: (src: string) => StaffNotificationSoundAudio;
  src?: string;
};

let sharedStaffNotificationSound:
  | ReturnType<typeof createStaffNotificationSound>
  | null = null;

export function shouldPlayStaffNotificationSound({
  enabled,
  eventKind,
  hasOpenShift,
}: {
  enabled: boolean;
  eventKind: OrderRealtimeEvent["kind"];
  hasOpenShift: boolean;
}) {
  return enabled && hasOpenShift && eventKind === "order.created";
}

export function shouldPlayStaffFallbackPush({
  hasActiveStaffOrdersPage,
}: {
  hasActiveStaffOrdersPage: boolean;
}) {
  return !hasActiveStaffOrdersPage;
}

export function readStaffNotificationSoundEnabled(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  return storage?.getItem(STAFF_NOTIFICATION_SOUND_STORAGE_KEY) === "enabled";
}

export function writeStaffNotificationSoundEnabled(
  enabled: boolean,
  storage: Pick<Storage, "setItem" | "removeItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  if (!storage) {
    return;
  }

  if (enabled) {
    storage.setItem(STAFF_NOTIFICATION_SOUND_STORAGE_KEY, "enabled");
    return;
  }

  storage.removeItem(STAFF_NOTIFICATION_SOUND_STORAGE_KEY);
}

export function createStaffNotificationSound({
  createAudio,
  src = STAFF_NOTIFICATION_SOUND_SRC,
}: StaffNotificationSoundFactoryOptions = {}) {
  let audio: StaffNotificationSoundAudio | null = null;

  function getAudio() {
    if (audio) {
      return audio;
    }

    if (createAudio) {
      audio = createAudio(src);
    } else if (typeof Audio !== "undefined") {
      audio = new Audio(src);
    } else {
      return null;
    }

    audio.preload = "auto";
    audio.volume = 1;
    audio.load?.();

    return audio;
  }

  async function playWithMutedState(muted: boolean) {
    const player = getAudio();
    if (!player) {
      return playFallbackTone(muted);
    }

    try {
      player.pause?.();
      player.currentTime = 0;
      player.muted = muted;
      await player.play();
      return true;
    } catch {
      return playFallbackTone(muted);
    }
  }

  return {
    unlock: () => playWithMutedState(true),
    play: () => playWithMutedState(false),
  };
}

async function playFallbackTone(muted: boolean) {
  if (muted) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return false;
  }

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);

    await context.resume();
    oscillator.start(now);
    oscillator.stop(now + 0.36);
    window.setTimeout(() => void context.close(), 500);
    return true;
  } catch {
    return false;
  }
}

export function getStaffNotificationSound() {
  if (!sharedStaffNotificationSound) {
    sharedStaffNotificationSound = createStaffNotificationSound();
  }

  return sharedStaffNotificationSound;
}
