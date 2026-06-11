"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/audio";

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      onClick={() => setMuted(!muted)}
      className="flex h-9 w-9 items-center justify-center rounded-full text-bone transition-colors duration-200 hover:bg-ivory/5 hover:text-ivory"
    >
      {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
    </button>
  );
}
