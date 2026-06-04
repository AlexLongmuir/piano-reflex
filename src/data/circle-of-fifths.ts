import type { PitchClass } from "@/types/quiz";

export type KeyInfo = {
  major: PitchClass;
  minor: PitchClass;
  accidentals: number;
  signature: string;
};

export const CIRCLE_KEYS: KeyInfo[] = [
  { major: "C", minor: "A", accidentals: 0, signature: "0 sharps/flats" },
  { major: "G", minor: "E", accidentals: 1, signature: "1 sharp" },
  { major: "D", minor: "B", accidentals: 2, signature: "2 sharps" },
  { major: "A", minor: "F#", accidentals: 3, signature: "3 sharps" },
  { major: "E", minor: "C#", accidentals: 4, signature: "4 sharps" },
  { major: "B", minor: "G#", accidentals: 5, signature: "5 sharps" },
  { major: "F#", minor: "D#", accidentals: 6, signature: "6 sharps" },
  { major: "C#", minor: "A#", accidentals: 7, signature: "7 sharps" },
  { major: "G#", minor: "F", accidentals: -4, signature: "4 flats" },
  { major: "D#", minor: "C", accidentals: -3, signature: "3 flats" },
  { major: "A#", minor: "G", accidentals: -2, signature: "2 flats" },
  { major: "F", minor: "D", accidentals: -1, signature: "1 flat" },
];
