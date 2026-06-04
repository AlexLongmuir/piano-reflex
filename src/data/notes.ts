import type { PitchClass } from "@/types/quiz";

export const PITCH_CLASSES: PitchClass[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const NOTE_LABELS: Record<PitchClass, string> = {
  C: "C",
  "C#": "C#/Db",
  D: "D",
  "D#": "D#/Eb",
  E: "E",
  F: "F",
  "F#": "F#/Gb",
  G: "G",
  "G#": "G#/Ab",
  A: "A",
  "A#": "A#/Bb",
  B: "B",
};

export const ANSWER_LABELS = PITCH_CLASSES.map((note) => NOTE_LABELS[note]);

export const WHITE_KEYS: PitchClass[] = ["C", "D", "E", "F", "G", "A", "B"];
export const BLACK_KEYS: PitchClass[] = ["C#", "D#", "F#", "G#", "A#"];

export const KEYBOARD_KEYS: { id: string; pitch: PitchClass; octave: number; type: "white" | "black" }[] =
  [3, 4].flatMap((octave) =>
    PITCH_CLASSES.map((pitch) => ({
      id: `${pitch}${octave}`,
      pitch,
      octave,
      type: BLACK_KEYS.includes(pitch) ? "black" : "white",
    })),
  );

export function normalizeAnswer(label: string): PitchClass {
  const found = Object.entries(NOTE_LABELS).find(([, value]) => value === label || value === label.trim());
  return (found?.[0] as PitchClass | undefined) ?? (label as PitchClass);
}
