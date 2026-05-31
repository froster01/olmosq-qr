import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createStaffNotificationSound,
  shouldPlayStaffNotificationSound,
} from "./staff-notification-sound";

test("shouldPlayStaffNotificationSound plays only visible created order events", () => {
  assert.equal(
    shouldPlayStaffNotificationSound({
      kind: "order.created",
      isDocumentVisible: true,
    }),
    true
  );
  assert.equal(
    shouldPlayStaffNotificationSound({
      kind: "order.updated",
      isDocumentVisible: true,
    }),
    false
  );
  assert.equal(
    shouldPlayStaffNotificationSound({
      kind: "order.created",
      isDocumentVisible: false,
    }),
    false
  );
});

test("createStaffNotificationSound returns false when playback fails", async () => {
  const sound = createStaffNotificationSound({
    src: "/sounds/new-order.mp3",
    createAudio: () => ({
      preload: "",
      currentTime: 0,
      volume: 1,
      muted: false,
      load: () => undefined,
      play: () => Promise.reject(new Error("blocked")),
      pause: () => undefined,
    }),
  });

  assert.equal(await sound.unlock(), false);
  assert.equal(await sound.play(), false);
});

test("createStaffNotificationSound unlocks and plays cloned audio", async () => {
  const played: string[] = [];
  const sound = createStaffNotificationSound({
    src: "/sounds/new-order.mp3",
    createAudio: (src) => ({
      preload: "",
      currentTime: 0,
      volume: 1,
      muted: false,
      load: () => undefined,
      play: () => {
        played.push(src);
        return Promise.resolve();
      },
      pause: () => undefined,
    }),
  });

  assert.equal(await sound.unlock(), true);
  assert.equal(await sound.play(), true);
  assert.deepEqual(played, ["/sounds/new-order.mp3", "/sounds/new-order.mp3"]);
});
