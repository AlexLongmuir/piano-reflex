import { CHORD_QUALITIES } from "@/data/chords";
import type { ChordQuality } from "@/data/chords";
import { CIRCLE_KEYS } from "@/data/circle-of-fifths";
import { KEYBOARD_KEYS, NOTE_LABELS, PITCH_CLASSES } from "@/data/notes";
import { SCALE_TYPES, type ScaleType } from "@/data/scales";
import { PIANO_TERMS } from "@/data/terms";
import {
  noteListLabel,
  notesFromFormula,
  noteSetKey,
  scaleNoteLabelsFromFormula,
  scaleNotesFromFormula,
} from "@/lib/music-theory";
import { sample, shuffle } from "@/lib/utils";
import type { ModuleId, PitchClass, QuizQuestion } from "@/types/quiz";

let sequence = 0;

function id(moduleId: ModuleId) {
  sequence += 1;
  return `${moduleId}-${Date.now()}-${sequence}`;
}

function noteChoices() {
  return PITCH_CLASSES.map((note) => NOTE_LABELS[note]);
}

function uniqueChoices(correct: string, distractors: string[], count = 4) {
  const unique = Array.from(new Set([correct, ...shuffle(distractors).filter((item) => item !== correct)]));
  return shuffle(unique.slice(0, count));
}

function keyboardKeyPool(filter: "mixed" | "white" | "black" = "mixed") {
  if (filter === "white") return KEYBOARD_KEYS.filter((key) => key.type === "white");
  if (filter === "black") return KEYBOARD_KEYS.filter((key) => key.type === "black");
  return KEYBOARD_KEYS;
}

function keyIdsForPitches(notes: PitchClass[]) {
  return notes
    .map((note) => KEYBOARD_KEYS.find((key) => key.pitch === note)?.id)
    .filter((keyId): keyId is string => Boolean(keyId));
}

export type ChordQuestionTarget = { root: PitchClass; quality: ChordQuality };
export type ScaleQuestionTarget = { root: PitchClass; type: ScaleType };

export function createKeyboardQuestion(options: {
  mode: "identify" | "reverse";
  keyFilter: "mixed" | "white" | "black";
}): QuizQuestion {
  const targetKey = sample(keyboardKeyPool(options.keyFilter));
  const target = targetKey.pitch;
  const answer = NOTE_LABELS[target];

  if (options.mode === "reverse") {
    return {
      id: id("keyboard-notes"),
      moduleId: "keyboard-notes",
      mode: "keyboard-reverse",
      prompt: `Find ${answer} on the keyboard`,
      answer,
      targetNotes: [target],
      targetKeyIds: [targetKey.id],
      weakAreaTags: [`keyboard:${answer}`],
    };
  }

  return {
    id: id("keyboard-notes"),
    moduleId: "keyboard-notes",
    mode: "keyboard-identify",
    prompt: "Name the highlighted key",
    answer,
    choices: noteChoices(),
    highlightedNotes: [target],
    highlightedKeyIds: [targetKey.id],
    weakAreaTags: [`keyboard:${answer}`],
  };
}

type StaffNoteOption = { vexflowKey: string; answer: PitchClass };

const TREBLE_NOTES: StaffNoteOption[] = [
  { vexflowKey: "c/4", answer: "C" },
  { vexflowKey: "d/4", answer: "D" },
  { vexflowKey: "e/4", answer: "E" },
  { vexflowKey: "f/4", answer: "F" },
  { vexflowKey: "g/4", answer: "G" },
  { vexflowKey: "a/4", answer: "A" },
  { vexflowKey: "b/4", answer: "B" },
  { vexflowKey: "c/5", answer: "C" },
] ;

const BASS_NOTES: StaffNoteOption[] = [
  { vexflowKey: "c/3", answer: "C" },
  { vexflowKey: "d/3", answer: "D" },
  { vexflowKey: "e/3", answer: "E" },
  { vexflowKey: "f/3", answer: "F" },
  { vexflowKey: "g/3", answer: "G" },
  { vexflowKey: "a/3", answer: "A" },
  { vexflowKey: "b/3", answer: "B" },
  { vexflowKey: "c/4", answer: "C" },
];

export function createStaffQuestion(clefMode: "mixed" | "treble" | "bass"): QuizQuestion {
  const clef = clefMode === "mixed" ? sample(["treble", "bass"] as const) : clefMode;
  const note = sample(clef === "treble" ? TREBLE_NOTES : BASS_NOTES);
  const answer = NOTE_LABELS[note.answer];

  return {
    id: id("staff-notes"),
    moduleId: "staff-notes",
    mode: "staff-note",
    prompt: `Identify the ${clef} clef note`,
    answer,
    choices: noteChoices(),
    staff: { clef, vexflowKey: note.vexflowKey, answer: note.answer },
    weakAreaTags: [`staff:${clef}`, `note:${answer}`],
  };
}

export function createChordQuestion(mode: "build" | "name", targets?: ChordQuestionTarget[]): QuizQuestion {
  const target = sample(targets?.length ? targets : PITCH_CLASSES.flatMap((root) => (Object.keys(CHORD_QUALITIES) as ChordQuality[]).map((quality) => ({ root, quality }))));
  const { root, quality } = target;
  const chord = CHORD_QUALITIES[quality];
  const notes = notesFromFormula(root, chord.formula);
  const answer = `${NOTE_LABELS[root]} ${chord.label}`;

  if (mode === "build") {
    return {
      id: id("chords"),
      moduleId: "chords",
      mode: "chord-build",
      prompt: `Build ${answer}`,
      answer: noteSetKey(notes),
      targetNotes: notes,
      targetKeyIds: keyIdsForPitches(notes),
      weakAreaTags: [`chord:${quality}`, `root:${NOTE_LABELS[root]}`],
      explanation: `${answer}: ${noteListLabel(notes)}`,
    };
  }

  return {
    id: id("chords"),
    moduleId: "chords",
    mode: "chord-name",
    prompt: "Name the highlighted chord",
    answer,
    choices: uniqueChoices(
      answer,
      PITCH_CLASSES.flatMap((note) => [`${NOTE_LABELS[note]} major`, `${NOTE_LABELS[note]} minor`]),
    ),
    highlightedNotes: notes,
    highlightedKeyIds: keyIdsForPitches(notes),
    targetNotes: notes,
    targetKeyIds: keyIdsForPitches(notes),
    weakAreaTags: [`chord:${quality}`, `root:${NOTE_LABELS[root]}`],
    explanation: `${answer}: ${noteListLabel(notes)}`,
  };
}

export function createScaleQuestion(targets?: ScaleQuestionTarget[]): QuizQuestion {
  const target = sample(targets?.length ? targets : PITCH_CLASSES.flatMap((root) => (Object.keys(SCALE_TYPES) as ScaleType[]).map((type) => ({ root, type }))));
  const { root, type } = target;
  const scale = SCALE_TYPES[type];
  const notes = notesFromFormula(root, scale.formula);
  const playableNotes = scaleNotesFromFormula(root, scale.formula);
  const playableLabels = scaleNoteLabelsFromFormula(root, scale.formula);
  const label = `${NOTE_LABELS[root]} ${scale.label}`;

  return {
    id: id("scales"),
    moduleId: "scales",
    mode: "scale-build",
    prompt: `Build ${label}`,
    answer: notes.join("-"),
    targetNotes: playableNotes,
    targetNoteLabels: playableLabels,
    targetKeyIds: keyIdsForPitches(playableNotes),
    weakAreaTags: [`scale:${type}`, `root:${NOTE_LABELS[root]}`],
    explanation: `${label}: ${playableLabels.join(" ")} · ${scale.steps}`,
  };
}

export function createCircleQuestion(): QuizQuestion {
  const key = sample(CIRCLE_KEYS);
  const questionType = sample(["clockwise", "anticlockwise", "signature", "relative"] as const);
  const index = CIRCLE_KEYS.findIndex((item) => item.major === key.major);
  const clockwise = CIRCLE_KEYS[(index + 1) % CIRCLE_KEYS.length];
  const anticlockwise = CIRCLE_KEYS[(index - 1 + CIRCLE_KEYS.length) % CIRCLE_KEYS.length];

  if (questionType === "clockwise") {
    return {
      id: id("circle-of-fifths"),
      moduleId: "circle-of-fifths",
      mode: "circle",
      prompt: `What is a fifth above ${NOTE_LABELS[key.major]} major?`,
      answer: NOTE_LABELS[clockwise.major],
      choices: uniqueChoices(NOTE_LABELS[clockwise.major], CIRCLE_KEYS.map((item) => NOTE_LABELS[item.major])),
      weakAreaTags: ["circle:fifth-above"],
    };
  }

  if (questionType === "anticlockwise") {
    return {
      id: id("circle-of-fifths"),
      moduleId: "circle-of-fifths",
      mode: "circle",
      prompt: `What is a fifth below ${NOTE_LABELS[key.major]} major?`,
      answer: NOTE_LABELS[anticlockwise.major],
      choices: uniqueChoices(NOTE_LABELS[anticlockwise.major], CIRCLE_KEYS.map((item) => NOTE_LABELS[item.major])),
      weakAreaTags: ["circle:fifth-below"],
    };
  }

  if (questionType === "relative") {
    return {
      id: id("circle-of-fifths"),
      moduleId: "circle-of-fifths",
      mode: "circle",
      prompt: `What is the relative minor of ${NOTE_LABELS[key.major]} major?`,
      answer: `${NOTE_LABELS[key.minor]} minor`,
      choices: uniqueChoices(`${NOTE_LABELS[key.minor]} minor`, CIRCLE_KEYS.map((item) => `${NOTE_LABELS[item.minor]} minor`)),
      weakAreaTags: ["circle:relative-minor"],
    };
  }

  return {
    id: id("circle-of-fifths"),
    moduleId: "circle-of-fifths",
    mode: "circle",
    prompt: `How many sharps/flats are in ${NOTE_LABELS[key.major]} major?`,
    answer: key.signature,
    choices: uniqueChoices(key.signature, ["0 sharps/flats", "1 sharp", "2 sharps", "3 sharps", "4 sharps", "1 flat", "2 flats", "3 flats"]),
    weakAreaTags: ["circle:key-signature"],
  };
}

export function createTermQuestion(): QuizQuestion {
  const term = sample(PIANO_TERMS);
  const reverse = Math.random() > 0.5;
  const choices = shuffle(PIANO_TERMS.filter((item) => item.category === term.category));

  return {
    id: id("piano-terms"),
    moduleId: "piano-terms",
    mode: "term",
    prompt: reverse ? term.definition : term.term,
    answer: reverse ? term.term : term.definition,
    choices: shuffle([term, ...choices.filter((item) => item.term !== term.term).slice(0, 3)]).map((item) => (reverse ? item.term : item.definition)),
    weakAreaTags: [`terms:${term.category}`, `term:${term.term}`],
  };
}

export function createQuestion(moduleId: ModuleId): QuizQuestion {
  switch (moduleId) {
    case "keyboard-notes":
      return createKeyboardQuestion({ mode: Math.random() > 0.5 ? "identify" : "reverse", keyFilter: "mixed" });
    case "staff-notes":
      return createStaffQuestion("mixed");
    case "chords":
      return createChordQuestion(Math.random() > 0.5 ? "build" : "name");
    case "scales":
      return createScaleQuestion();
    case "circle-of-fifths":
      return createCircleQuestion();
    case "piano-terms":
      return createTermQuestion();
  }
}
