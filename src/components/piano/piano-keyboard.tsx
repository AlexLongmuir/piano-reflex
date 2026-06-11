"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KEYBOARD_KEYS, NOTE_LABELS } from "@/data/notes";
import { playNote } from "@/lib/audio";
import { cn, musicLabel } from "@/lib/utils";
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

type KeyGeometry = {
  id: string;
  pitch: PitchClass;
  octave: number;
  type: "white" | "black";
  /** left edge as a fraction of total keyboard width */
  left: number;
  /** width as a fraction of total keyboard width */
  width: number;
};

// Black keys sit on the boundary after these white pitches, nudged toward the
// outside of each group like a real piano (fractions of one white-key width).
const BLACK_AFTER: Partial<Record<PitchClass, { black: PitchClass; nudge: number }>> = {
  C: { black: "C#", nudge: -0.14 },
  D: { black: "D#", nudge: 0.14 },
  F: { black: "F#", nudge: -0.17 },
  G: { black: "G#", nudge: 0 },
  A: { black: "A#", nudge: 0.17 },
};

const BLACK_WIDTH_RATIO = 0.62;

// All positions are fractions of total width, so white and black keys can
// never drift apart regardless of viewport — the layout is one coordinate
// system instead of a px-gapped grid plus a hardcoded overlay.
function buildGeometry(): KeyGeometry[] {
  const whites = KEYBOARD_KEYS.filter((key) => key.type === "white");
  const whiteWidth = 1 / whites.length;
  const geometry: KeyGeometry[] = [];

  whites.forEach((key, index) => {
    geometry.push({ ...key, left: index * whiteWidth, width: whiteWidth });
    const rule = BLACK_AFTER[key.pitch];
    if (!rule) return;
    const blackKey = KEYBOARD_KEYS.find(
      (candidate) => candidate.pitch === rule.black && candidate.octave === key.octave,
    );
    if (!blackKey) return;
    const boundary = (index + 1) * whiteWidth;
    const width = whiteWidth * BLACK_WIDTH_RATIO;
    geometry.push({
      ...blackKey,
      left: boundary - width / 2 + rule.nudge * whiteWidth,
      width,
    });
  });

  return geometry;
}

const GEOMETRY = buildGeometry();

type Bubble = { label: string; centerX: number; black: boolean };

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
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
  }, []);

  const press = useCallback(
    (key: KeyGeometry) => {
      if (disabled) return;
      playNote(key.pitch, key.octave, key.type === "black" ? 0.42 : 0.5);
      navigator.vibrate?.(8);
      setPressedId(key.id);
      setBubble({
        label: musicLabel(NOTE_LABELS[key.pitch]),
        centerX: key.left + key.width / 2,
        black: key.type === "black",
      });
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        setPressedId(null);
        setBubble(null);
      }, 520);
      onPress?.({ id: key.id, pitch: key.pitch });
    },
    [disabled, onPress],
  );

  return (
    // max-width keeps key proportions honest when max-height caps the aspect
    <div className="piano-frame relative mx-auto w-full max-w-[700px] select-none">
      {/* nameboard + red felt strip, like the real thing */}
      <div className="h-3 rounded-t-xl bg-[#16161a] shadow-[inset_0_1px_0_rgba(242,238,227,0.07)]" />
      <div className="h-[3px] bg-felt/80" />

      <div
        className="relative aspect-[14/6.5] max-h-[250px] w-full overflow-hidden rounded-b-xl bg-[#0e0e11] sm:aspect-[14/5]"
        style={{ perspective: 900 }}
      >
        {GEOMETRY.map((key) => {
          const isHighlighted = isActive(key.id, key.pitch, highlightedKeyIds, highlighted);
          const isSelected = isActive(key.id, key.pitch, selectedKeyIds, selected);
          const isTarget = isActive(key.id, key.pitch, targetKeyIds, target);
          const isBlack = key.type === "black";
          return (
            <button
              key={key.id}
              type="button"
              data-key-id={key.id}
              data-key-pitch={key.pitch}
              data-highlighted={isHighlighted || undefined}
              data-selected={isSelected || undefined}
              data-target={isTarget || undefined}
              disabled={disabled}
              aria-label={NOTE_LABELS[key.pitch]}
              onPointerDown={(event) => {
                if (event.button !== 0 && event.pointerType === "mouse") return;
                press(key);
              }}
              onClick={(event) => {
                // pointerdown handles real presses; only keyboard-initiated
                // clicks (detail === 0) reach here.
                if (event.detail === 0) press(key);
              }}
              className={cn(
                "absolute touch-manipulation outline-none",
                isBlack ? "piano-key-black z-10" : "piano-key-white",
                pressedId === key.id && "is-pressed",
                isHighlighted && "is-highlighted",
                isSelected && "is-selected",
                isTarget && "is-target",
              )}
              style={{
                left: `${key.left * 100}%`,
                width: `${key.width * 100}%`,
                top: 0,
                height: isBlack ? "60%" : "100%",
              }}
            >
              {showLabels && (
                <span
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[min(10px,1.6vw)] font-semibold tracking-tight",
                    isBlack ? "text-ivory/60" : "text-ink/45",
                  )}
                >
                  {musicLabel(NOTE_LABELS[key.pitch]).split("/")[0]}
                </span>
              )}
              {isTarget && <span className="key-target-pulse" aria-hidden />}
            </button>
          );
        })}

        {bubble && (
          <div
            aria-hidden
            className="key-bubble pointer-events-none absolute z-20"
            style={{ left: `${bubble.centerX * 100}%`, top: bubble.black ? "2%" : "8%" }}
          >
            {bubble.label}
          </div>
        )}
      </div>
    </div>
  );
}

function isActive(keyId: string, pitch: PitchClass, keyIds: string[], pitches: PitchClass[]) {
  return keyIds.length ? keyIds.includes(keyId) : pitches.includes(pitch);
}
