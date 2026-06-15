import { NOTE_LABELS, PITCH_CLASSES } from "@/data/notes";
import type { PitchClass } from "@/types/quiz";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_PITCH_INDEX: Record<(typeof LETTERS)[number], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function transpose(root: PitchClass, semitones: number): PitchClass {
  const index = PITCH_CLASSES.indexOf(root);
  return PITCH_CLASSES[(index + semitones + 120) % 12];
}

export function notesFromFormula(root: PitchClass, formula: number[]): PitchClass[] {
  return formula.map((step) => transpose(root, step));
}

export function scaleNotesFromFormula(root: PitchClass, formula: number[]): PitchClass[] {
  return [...notesFromFormula(root, formula), root];
}

export function scaleNoteLabelsFromFormula(root: PitchClass, formula: number[]): string[] {
  const rootLetter = root[0] as (typeof LETTERS)[number];
  const rootLetterIndex = LETTERS.indexOf(rootLetter);

  return [...formula, 12].map((step, scaleDegree) => {
    const letter = LETTERS[(rootLetterIndex + scaleDegree) % LETTERS.length];
    const pitchIndex = PITCH_CLASSES.indexOf(transpose(root, step));
    const naturalIndex = NATURAL_PITCH_INDEX[letter];
    let accidentalOffset = pitchIndex - naturalIndex;
    if (accidentalOffset > 6) accidentalOffset -= 12;
    if (accidentalOffset < -6) accidentalOffset += 12;
    const accidental =
      accidentalOffset > 0 ? "#".repeat(accidentalOffset) : "b".repeat(Math.abs(accidentalOffset));
    return `${letter}${accidental}`;
  });
}

export function noteSetKey(notes: PitchClass[]) {
  return [...new Set(notes)].sort((a, b) => PITCH_CLASSES.indexOf(a) - PITCH_CLASSES.indexOf(b)).join("-");
}

export function noteListLabel(notes: PitchClass[]) {
  return notes.map((note) => NOTE_LABELS[note]).join(" ");
}
