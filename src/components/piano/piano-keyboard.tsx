"use client";

import { KEYBOARD_KEYS, NOTE_LABELS } from "@/data/notes";
import { cn } from "@/lib/utils";
import type { PitchClass } from "@/types/quiz";

type Props = {
  highlighted?: PitchClass[];
  highlightedKeyIds?: string[];
  selected?: PitchClass[];
  selectedKeyIds?: string[];
  target?: PitchClass[];
  targetKeyIds?: string[];
  onPress?: (key: { id: string; pitch: PitchClass }) => void;
  showLabels?: boolean;
  disabled?: boolean;
};

export function PianoKeyboard({
  highlighted = [],
  highlightedKeyIds = [],
  selected = [],
  selectedKeyIds = [],
  target = [],
  targetKeyIds = [],
  onPress,
  showLabels = false,
  disabled,
}: Props) {
  const whiteKeys = KEYBOARD_KEYS.filter((key) => key.type === "white");
  const blackKeys = KEYBOARD_KEYS.filter((key) => key.type === "black");

  return (
    <div className="relative mx-auto h-44 w-full max-w-3xl select-none rounded-b-lg border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
      <div className="grid h-full grid-cols-14 gap-1">
        {whiteKeys.map((key) => (
          <button
            key={key.id}
            type="button"
            data-key-id={key.id}
            data-key-pitch={key.pitch}
            data-highlighted={isActive(key.id, key.pitch, highlightedKeyIds, highlighted)}
            data-selected={isActive(key.id, key.pitch, selectedKeyIds, selected)}
            data-target={isActive(key.id, key.pitch, targetKeyIds, target)}
            disabled={disabled}
            onClick={() => onPress?.({ id: key.id, pitch: key.pitch })}
            className={cn(
              "relative rounded-b-md border border-zinc-300 bg-gradient-to-b from-stone-50 to-stone-200 text-xs font-semibold text-zinc-700 shadow-inner transition duration-150 hover:-translate-y-0.5 hover:from-white hover:to-amber-50 disabled:cursor-default",
              isActive(key.id, key.pitch, highlightedKeyIds, highlighted) && "border-amber-400 bg-gradient-to-b from-amber-100 to-amber-300 text-zinc-950 ring-2 ring-amber-400/40",
              isActive(key.id, key.pitch, selectedKeyIds, selected) && "border-emerald-400 bg-gradient-to-b from-emerald-100 to-emerald-300 text-zinc-950",
              isActive(key.id, key.pitch, targetKeyIds, target) && "outline outline-2 outline-emerald-400",
            )}
            aria-label={NOTE_LABELS[key.pitch]}
          >
            {showLabels && <span className="absolute bottom-3 left-0 right-0">{NOTE_LABELS[key.pitch]}</span>}
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute left-[6.2%] right-[6.2%] top-2 h-16">
        {blackKeys.map((key) => {
          const left = blackKeyLeft(key.pitch, key.octave);
          return (
            <button
              key={key.id}
              type="button"
              data-key-id={key.id}
              data-key-pitch={key.pitch}
              data-highlighted={isActive(key.id, key.pitch, highlightedKeyIds, highlighted)}
              data-selected={isActive(key.id, key.pitch, selectedKeyIds, selected)}
              data-target={isActive(key.id, key.pitch, targetKeyIds, target)}
              disabled={disabled}
              onClick={() => onPress?.({ id: key.id, pitch: key.pitch })}
              className={cn(
                "pointer-events-auto absolute top-0 h-16 w-[7.2%] rounded-b bg-gradient-to-b from-zinc-700 to-black text-[10px] font-semibold text-zinc-300 shadow-lg shadow-black/60 transition duration-150 hover:-translate-y-0.5 disabled:cursor-default",
                isActive(key.id, key.pitch, highlightedKeyIds, highlighted) && "from-amber-500 to-amber-700 text-black ring-2 ring-amber-300",
                isActive(key.id, key.pitch, selectedKeyIds, selected) && "from-emerald-500 to-emerald-700 text-black",
                isActive(key.id, key.pitch, targetKeyIds, target) && "outline outline-2 outline-emerald-300",
              )}
              style={{ left }}
              aria-label={NOTE_LABELS[key.pitch]}
            >
              {showLabels && <span className="absolute bottom-2 left-0 right-0">{NOTE_LABELS[key.pitch]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isActive(keyId: string, pitch: PitchClass, keyIds: string[], pitches: PitchClass[]) {
  return keyIds.length ? keyIds.includes(keyId) : pitches.includes(pitch);
}

function blackKeyLeft(note: PitchClass, octave: number) {
  const octaveOffset = octave === 3 ? 0 : 50;
  const positions: Partial<Record<PitchClass, number>> = {
    "C#": 7.8,
    "D#": 15.2,
    "F#": 29.4,
    "G#": 36.7,
    "A#": 44.0,
  };
  return `${octaveOffset + (positions[note] ?? 0)}%`;
}
