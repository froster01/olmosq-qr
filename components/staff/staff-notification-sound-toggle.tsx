"use client";

import { useSyncExternalStore, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getStaffNotificationSound,
  readStaffNotificationSoundEnabled,
  STAFF_NOTIFICATION_SOUND_CHANGE_EVENT,
  writeStaffNotificationSoundEnabled,
} from "@/lib/notifications/staff-notification-sound";

function subscribeToSoundSetting(callback: () => void) {
  window.addEventListener(STAFF_NOTIFICATION_SOUND_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(STAFF_NOTIFICATION_SOUND_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSoundSettingSnapshot() {
  return readStaffNotificationSoundEnabled(window.localStorage);
}

export function StaffNotificationSoundToggle() {
  const [busy, setBusy] = useState(false);
  const enabled = useSyncExternalStore(
    subscribeToSoundSetting,
    getSoundSettingSnapshot,
    () => false
  );

  function notifySoundChange(nextEnabled: boolean) {
    window.dispatchEvent(
      new CustomEvent(STAFF_NOTIFICATION_SOUND_CHANGE_EVENT, {
        detail: { enabled: nextEnabled },
      })
    );
  }

  async function handleToggle() {
    if (enabled) {
      writeStaffNotificationSoundEnabled(false, window.localStorage);
      notifySoundChange(false);
      toast.success("Order sound off");
      return;
    }

    setBusy(true);
    const unlocked = await getStaffNotificationSound().play();
    setBusy(false);

    if (!unlocked) {
      toast.error("Could not play order sound");
      return;
    }

    writeStaffNotificationSoundEnabled(true, window.localStorage);
    notifySoundChange(true);
    toast.success("Order sound on");
  }

  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      disabled={busy}
      onClick={handleToggle}
      className="staff-sound-button"
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      {enabled ? "Sound on" : "Sound off"}
    </Button>
  );
}
