import { NOTE_LABELS, PITCH_CLASSES } from "@/data/notes";
import type { PitchClass } from "@/types/quiz";

export function transpose(root: PitchClass, semitones: number): PitchClass {
  const index = PITCH_CLASSES.indexOf(root);
  return PITCH_CLASSES[(index + semitones + 120) % 12];
}

export function notesFromFormula(root: PitchClass, formula: number[]): PitchClass[] {
  return formula.map((step) => transpose(root, step));
}

export function noteSetKey(notes: PitchClass[]) {
  return [...new Set(notes)].sort((a, b) => PITCH_CLASSES.indexOf(a) - PITCH_CLASSES.indexOf(b)).join("-");
}

export function noteListLabel(notes: PitchClass[]) {
  return notes.map((note) => NOTE_LABELS[note]).join(" ");
}
