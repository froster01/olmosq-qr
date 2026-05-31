import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";

type AudioLike = {
  preload: string;
  currentTime: number;
  volume: number;
  muted: boolean;
  load: () => void;
  play: () => Promise<void>;
  pause: () => void;
};

type CreateAudio = (src: string) => AudioLike;

export function shouldPlayStaffNotificationSound({
  kind,
  isDocumentVisible,
}: {
  kind: OrderRealtimeEvent["kind"];
  isDocumentVisible: boolean;
}) {
  return kind === "order.created" && isDocumentVisible;
}

export function createStaffNotificationSound({
  src,
  createAudio = createBrowserAudio,
}: {
  src: string;
  createAudio?: CreateAudio;
}) {
  let unlocked = false;
  const preloadAudio = createAudio(src);
  preloadAudio.preload = "auto";
  preloadAudio.load();

  return {
    async unlock() {
      try {
        preloadAudio.currentTime = 0;
        preloadAudio.volume = 0;
        await preloadAudio.play();
        preloadAudio.pause();
        preloadAudio.currentTime = 0;
        preloadAudio.volume = 1;
        unlocked = true;
        return true;
      } catch {
        unlocked = false;
        return false;
      }
    },
    async play() {
      if (!unlocked) {
        return false;
      }

      try {
        const audio = createAudio(src);
        audio.preload = "auto";
        audio.currentTime = 0;
        audio.volume = 1;
        audio.muted = false;
        await audio.play();
        return true;
      } catch {
        return false;
      }
    },
  };
}

function createBrowserAudio(src: string): AudioLike {
  return new Audio(src);
}
