export type ModuleId =
  | "keyboard-notes"
  | "staff-notes"
  | "chords"
  | "scales"
  | "circle-of-fifths"
  | "piano-terms";

export type PitchClass =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type QuestionMode =
  | "keyboard-identify"
  | "keyboard-reverse"
  | "staff-note"
  | "chord-build"
  | "chord-name"
  | "scale-build"
  | "circle"
  | "term";

export type QuizQuestion = {
  id: string;
  moduleId: ModuleId;
  mode: QuestionMode;
  prompt: string;
  answer: string;
  choices?: string[];
  targetNotes?: PitchClass[];
  highlightedNotes?: PitchClass[];
  targetKeyIds?: string[];
  highlightedKeyIds?: string[];
  staff?: {
    clef: "treble" | "bass";
    vexflowKey: string;
    answer: PitchClass;
  };
  weakAreaTags: string[];
  explanation?: string;
};

export type AnswerResult = {
  correct: boolean;
  responseMs: number;
  submittedAnswer: string;
  correctAnswer: string;
  weakAreaTags: string[];
};
