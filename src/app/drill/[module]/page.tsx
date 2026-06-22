"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, BookOpen, ListChecks, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHORD_QUALITIES, type ChordQuality } from "@/data/chords";
import { NoteButtons } from "@/components/drill/note-buttons";
import { CircleOfFifths } from "@/components/drill/circle-of-fifths";
import { useProgress } from "@/components/drill/progress-context";
import { PianoKeyboard } from "@/components/piano/piano-keyboard";
import { StaffRenderer } from "@/components/staff/staff-renderer";
import { MODULES } from "@/data/modules";
import { ANSWER_LABELS, NOTE_LABELS, normalizeAnswer, PITCH_CLASSES } from "@/data/notes";
import { SCALE_TYPES, type ScaleType } from "@/data/scales";
import {
  ALL_CHORD_PREFERENCES,
  ALL_SCALE_PREFERENCES,
  chordPreferenceKey,
  defaultDrillPreferences,
  loadDrillPreferences,
  saveDrillPreferences,
  scalePreferenceKey,
  type ChordPreference,
  type DrillPreferences,
  type ScalePreference,
} from "@/lib/drill-preferences";
import { playAscending, playCorrect, playTick, playWrong } from "@/lib/audio";
import { noteListLabel, notesFromFormula, noteSetKey, scaleNoteLabelsFromFormula } from "@/lib/music-theory";
import {
  createChordQuestion,
  createCircleQuestion,
  createKeyboardQuestion,
  createQuestion,
  createScaleQuestion,
  createStaffQuestion,
  createTermQuestion,
} from "@/lib/quiz-engine";
import { cn, formatMs, musicLabel, percent } from "@/lib/utils";
import type { ModuleId, PitchClass, QuizQuestion } from "@/types/quiz";

type KeyboardFilter = "mixed" | "white" | "black";
type KeyboardMode = "identify" | "reverse";
type StaffMode = "mixed" | "treble" | "bass";
type ChordMode = "mixed" | "build" | "name";
type SelectedKey = { keyId: string; pitch: PitchClass };
type OpenPanel = "content" | "cheat-sheet" | null;

const AUTO_ADVANCE_MS = 1500;
const TYPED_NOTE_TIMEOUT_MS = 650;

function normalizeTypedNote(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replaceAll("♯", "#")
    .replaceAll("♭", "b")
    .replace(/\s+/g, "")
    .replace("sharp", "#")
    .replace("flat", "b");
}

const TYPED_NOTE_ALIASES: Record<string, string> = {
  c: "C",
  "b#": "C",
  "c#": "C#/Db",
  db: "C#/Db",
  d: "D",
  "d#": "D#/Eb",
  eb: "D#/Eb",
  e: "E",
  fb: "E",
  "e#": "F",
  f: "F",
  "f#": "F#/Gb",
  gb: "F#/Gb",
  g: "G",
  "g#": "G#/Ab",
  ab: "G#/Ab",
  a: "A",
  "a#": "A#/Bb",
  bb: "A#/Bb",
  b: "B",
  cb: "B",
};

function typedNoteToAnswer(input: string) {
  return TYPED_NOTE_ALIASES[normalizeTypedNote(input)] ?? null;
}

function answerForTypedNote(question: QuizQuestion, input: string) {
  const noteAnswer = typedNoteToAnswer(input);
  if (!noteAnswer || !question.choices?.length) return null;
  if (question.choices.includes(noteAnswer)) return noteAnswer;
  return question.choices.find((choice) => choice.startsWith(`${noteAnswer} `)) ?? null;
}

function acceptsTypedNotes(question: QuizQuestion) {
  return question.choices?.some((choice) => ANSWER_LABELS.some((label) => choice === label || choice.startsWith(`${label} `))) ?? false;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
}

export default function DrillPage() {
  const params = useParams<{ module: ModuleId }>();
  const moduleId = params.module;
  const moduleInfo = MODULES.find((module) => module.id === moduleId);
  if (!moduleInfo) notFound();

  const { progress, record } = useProgress();
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("identify");
  const [keyboardFilter, setKeyboardFilter] = useState<KeyboardFilter>("mixed");
  const [staffMode, setStaffMode] = useState<StaffMode>("mixed");
  const [chordMode, setChordMode] = useState<ChordMode>("mixed");
  const [drillPreferences, setDrillPreferences] = useState<DrillPreferences>(() => defaultDrillPreferences());
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<SelectedKey[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [responseMs, setResponseMs] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typedNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typedNoteBuffer = useRef("");
  const submitRef = useRef<(answer: string) => void>(() => {});

  useEffect(() => {
    queueMicrotask(() => setDrillPreferences(loadDrillPreferences()));
  }, []);

  function updateDrillPreferences(next: DrillPreferences) {
    setDrillPreferences(next);
    saveDrillPreferences(next);
  }

  const selectedChordKeys = useMemo(() => new Set(drillPreferences.chords.map(chordPreferenceKey)), [drillPreferences.chords]);
  const selectedScaleKeys = useMemo(() => new Set(drillPreferences.scales.map(scalePreferenceKey)), [drillPreferences.scales]);
  const activeChordTargets = useMemo(
    () => ALL_CHORD_PREFERENCES.filter((item) => selectedChordKeys.has(chordPreferenceKey(item))),
    [selectedChordKeys],
  );
  const activeScaleTargets = useMemo(
    () => ALL_SCALE_PREFERENCES.filter((item) => selectedScaleKeys.has(scalePreferenceKey(item))),
    [selectedScaleKeys],
  );

  const buildQuestion = useMemo(
    () => () => {
      if (moduleId === "keyboard-notes") return createKeyboardQuestion({ mode: keyboardMode, keyFilter: keyboardFilter });
      if (moduleId === "staff-notes") return createStaffQuestion(staffMode);
      if (moduleId === "chords") return createChordQuestion(chordMode === "mixed" ? (Math.random() > 0.5 ? "build" : "name") : chordMode, activeChordTargets);
      if (moduleId === "scales") return createScaleQuestion(activeScaleTargets);
      if (moduleId === "circle-of-fifths") return createCircleQuestion();
      if (moduleId === "piano-terms") return createTermQuestion();
      return createQuestion(moduleId);
    },
    [moduleId, keyboardMode, keyboardFilter, staffMode, chordMode, activeChordTargets, activeScaleTargets],
  );

  useEffect(() => {
    queueMicrotask(() => nextQuestion());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, keyboardMode, keyboardFilter, staffMode, chordMode, activeChordTargets, activeScaleTargets]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (typedNoteTimer.current) clearTimeout(typedNoteTimer.current);
  }, []);

  useEffect(() => {
    function clearTypedNote() {
      typedNoteBuffer.current = "";
      if (typedNoteTimer.current) clearTimeout(typedNoteTimer.current);
      typedNoteTimer.current = null;
    }

    function submitTypedNote(input: string) {
      const answer = question ? answerForTypedNote(question, input) : null;
      clearTypedNote();
      if (answer) submitRef.current(answer);
    }

    function queueNaturalNote(input: string) {
      clearTypedNote();
      typedNoteBuffer.current = input;
      typedNoteTimer.current = setTimeout(() => submitTypedNote(input), TYPED_NOTE_TIMEOUT_MS);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!question || correct !== null || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        clearTypedNote();
        return;
      }

      if (event.key === "Enter" && typedNoteBuffer.current) {
        event.preventDefault();
        submitTypedNote(typedNoteBuffer.current);
        return;
      }

      const choiceIndex = Number(event.key) - 1;
      if (question.choices && Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < question.choices.length) {
        event.preventDefault();
        clearTypedNote();
        submitRef.current(question.choices[choiceIndex]);
        return;
      }

      if (!acceptsTypedNotes(question)) return;

      if ((event.key === "#" || event.key === "♯") && typedNoteBuffer.current) {
        event.preventDefault();
        submitTypedNote(`${typedNoteBuffer.current}#`);
        return;
      }

      if ((event.key === "b" || event.key === "♭") && typedNoteBuffer.current) {
        event.preventDefault();
        const flatAnswer = answerForTypedNote(question, `${typedNoteBuffer.current}b`);
        if (flatAnswer) submitTypedNote(`${typedNoteBuffer.current}b`);
        else queueNaturalNote("b");
        return;
      }

      if (/^[a-gA-G]$/.test(event.key)) {
        event.preventDefault();
        queueNaturalNote(event.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTypedNote();
    };
  }, [question, correct]);

  function nextQuestion() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (typedNoteTimer.current) clearTimeout(typedNoteTimer.current);
    typedNoteBuffer.current = "";
    setQuestion(buildQuestion());
    setStartedAt(performance.now());
    setSelectedKeys([]);
    setSubmitted(null);
    setCorrect(null);
    setResponseMs(0);
  }

  function submit(answer: string) {
    if (!question || correct !== null) return;
    const elapsed = performance.now() - startedAt;
    const isCorrect = answer === question.answer;
    const nextStreak = isCorrect ? streak + 1 : 0;
    setSubmitted(answer);
    setCorrect(isCorrect);
    setResponseMs(elapsed);
    setSessionAttempts((value) => value + 1);
    setSessionCorrect((value) => value + (isCorrect ? 1 : 0));
    setStreak(nextStreak);

    if (isCorrect) {
      if (question.targetNotes?.length) {
        playAscending(question.targetNotes, 3, question.mode === "scale-build" ? 0.085 : 0.03);
      } else {
        const pitch = normalizeAnswer(question.answer);
        playCorrect(PITCH_CLASSES.includes(pitch) ? pitch : undefined);
      }
      advanceTimer.current = setTimeout(nextQuestion, AUTO_ADVANCE_MS);
    } else {
      playWrong();
    }

    record(
      moduleId,
      {
        correct: isCorrect,
        responseMs: elapsed,
        submittedAnswer: answer,
        correctAnswer: question.answer,
        weakAreaTags: question.weakAreaTags,
      },
      nextStreak,
    );
  }

  submitRef.current = submit;

  function toggleNote(key: { id: string; pitch: PitchClass }) {
    if (!question || correct !== null) return;
    if (question.mode === "keyboard-reverse") {
      setSelectedKeys([{ keyId: key.id, pitch: key.pitch }]);
      submit(NOTE_LABELS[key.pitch]);
      return;
    }
    if (question.mode !== "chord-build" && question.mode !== "scale-build") return;
    setSelectedKeys((current) => {
      const existing = current.find((item) => item.keyId === key.id);
      if (existing) return current.filter((item) => item.keyId !== key.id);
      if (question.mode === "chord-build" && current.some((item) => item.pitch === key.pitch)) {
        return current.filter((item) => item.pitch !== key.pitch);
      }
      return [...current, { keyId: key.id, pitch: key.pitch }];
    });
  }

  function submitSelectedNotes() {
    if (!question) return;
    const selectedNotes = selectedKeys.map((key) => key.pitch);
    if (question.mode === "scale-build") {
      submit(selectedKeys.map((key) => key.keyId).join("-"));
      return;
    }
    submit(noteSetKey(selectedNotes));
  }

  const stats = progress.modules[moduleId];
  const isBuildMode = question?.mode === "chord-build" || question?.mode === "scale-build";
  const highlighted = question ? (correct === false && question.targetNotes ? question.targetNotes : question.highlightedNotes) : undefined;
  const highlightedKeyIds = question ? (correct === false && question.targetKeyIds ? question.targetKeyIds : question.highlightedKeyIds) : undefined;
  const selectedNotes = selectedKeys.map((key) => key.pitch);
  const selectedKeyIds = selectedKeys.map((key) => key.keyId);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-bone transition-colors hover:text-ivory"
        >
          <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          All drills
        </Link>
        <SessionStrip streak={streak} attempts={sessionAttempts} correctCount={sessionCorrect} lastMs={responseMs} />
      </div>

      <section className="surface mt-4 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps">{moduleInfo.title}</p>
            {question ? (
              <h1 key={question.id} className="q-enter mt-2.5 font-display text-[26px] font-medium leading-tight tracking-[-0.01em] text-ivory sm:text-[32px]">
                {musicLabel(question.prompt)}
              </h1>
            ) : (
              <div className="mt-3 h-9 w-56 animate-pulse rounded-lg bg-ivory/5" />
            )}
          </div>
          <button
            type="button"
            aria-label="Skip question"
            onClick={() => {
              playTick();
              nextQuestion();
            }}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bone transition-all duration-200 hover:bg-ivory/5 hover:text-ivory active:scale-90"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <Controls
          moduleId={moduleId}
          keyboardMode={keyboardMode}
          setKeyboardMode={setKeyboardMode}
          keyboardFilter={keyboardFilter}
          setKeyboardFilter={setKeyboardFilter}
          staffMode={staffMode}
          setStaffMode={setStaffMode}
          chordMode={chordMode}
          setChordMode={setChordMode}
          chordCount={activeChordTargets.length}
          scaleCount={activeScaleTargets.length}
          openPanel={openPanel}
          setOpenPanel={setOpenPanel}
        />

        {openPanel === "content" && (moduleId === "chords" || moduleId === "scales") && (
          <ContentSelector
            moduleId={moduleId}
            preferences={drillPreferences}
            onApply={updateDrillPreferences}
            onClose={() => setOpenPanel(null)}
          />
        )}

        {openPanel === "cheat-sheet" && (moduleId === "chords" || moduleId === "scales") && (
          <CheatSheet
            moduleId={moduleId}
            chordPreferences={activeChordTargets}
            scalePreferences={activeScaleTargets}
            onClose={() => setOpenPanel(null)}
          />
        )}

        {question && (
          <div key={`${question.id}-body`} className="q-enter mt-7 space-y-6">
            {(moduleId === "keyboard-notes" || moduleId === "chords" || moduleId === "scales") && (
              <div className="-mx-1 sm:mx-0">
                <PianoKeyboard
                  highlighted={highlighted}
                  highlightedKeyIds={highlightedKeyIds}
                  selected={selectedNotes}
                  selectedKeyIds={selectedKeyIds}
                  target={correct === false ? question.targetNotes : undefined}
                  targetKeyIds={correct === false ? question.targetKeyIds : undefined}
                  onPress={toggleNote}
                  showLabels={question.mode !== "keyboard-identify" && question.mode !== "keyboard-reverse"}
                  disabled={correct !== null && question.mode !== "keyboard-reverse"}
                />
              </div>
            )}

            {question.staff && <StaffRenderer clef={question.staff.clef} noteKey={question.staff.vexflowKey} />}

            {moduleId === "circle-of-fifths" && <CircleOfFifths prompt={question.prompt} revealed={correct !== null} />}

            {isBuildMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5">
                  {selectedNotes.length === 0 ? (
                    <span className="text-[13px] text-bone/70">Tap keys to build it</span>
                  ) : (
                    selectedKeys.map((key) => (
                      <span
                        key={key.keyId}
                        className="pop-in rounded-full border border-ivory/10 bg-ivory/6 px-2.5 py-1 text-xs font-semibold text-ivory"
                      >
                        {musicLabel(NOTE_LABELS[key.pitch]).split("/")[0]}
                      </span>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={submitSelectedNotes}
                  disabled={!selectedNotes.length || correct !== null}
                  className="rounded-full bg-ivory px-5 py-2.5 text-[13px] font-semibold text-ink transition-all duration-200 hover:bg-brass active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Check
                </button>
              </div>
            ) : question.mode === "keyboard-reverse" ? (
              <p className="text-center text-[13px] text-bone/70">Tap the matching key</p>
            ) : (
              <ChoiceGrid question={question} submitted={submitted} correct={correct} onSubmit={submit} />
            )}

            {correct !== null && (
              <Feedback
                correct={correct}
                responseMs={responseMs}
                answer={displayAnswer(question)}
                explanation={question.explanation}
                onNext={nextQuestion}
              />
            )}
          </div>
        )}
      </section>

      <p className="tnum mt-5 text-center text-xs text-bone/60">
        All time · {stats.attempts} reps · {percent(stats.correct, stats.attempts)} accuracy ·{" "}
        {formatMs(stats.attempts ? stats.totalResponseMs / stats.attempts : 0)} avg
        {stats.bestStreak > 0 ? ` · best streak ${stats.bestStreak}` : ""}
      </p>
    </main>
  );
}

function displayAnswer(question: QuizQuestion) {
  if (question.mode === "scale-build" && question.targetNoteLabels?.length) {
    return question.targetNoteLabels.map((note) => musicLabel(note)).join(" ");
  }
  if (question.mode === "chord-build" || question.mode === "scale-build") {
    return question.targetNotes?.map((note) => musicLabel(NOTE_LABELS[note]).split("/")[0]).join(" ") ?? question.answer;
  }
  return musicLabel(question.answer);
}

function SessionStrip({
  streak,
  attempts,
  correctCount,
  lastMs,
}: {
  streak: number;
  attempts: number;
  correctCount: number;
  lastMs: number;
}) {
  return (
    <div className="tnum flex items-center gap-4 text-xs text-bone">
      <span className={cn("flex items-center gap-1.5 transition-colors", streak > 2 && "text-brass")}>
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full bg-bone/40", streak > 0 && "bg-brass", streak > 2 && "animate-pulse")} />
        streak {streak}
      </span>
      <span className="hidden sm:inline">{percent(correctCount, attempts)} this session</span>
      <span>{attempts} reps</span>
      {lastMs > 0 && <span className="hidden sm:inline">{formatMs(lastMs)}</span>}
    </div>
  );
}

function Controls(props: {
  moduleId: ModuleId;
  keyboardMode: KeyboardMode;
  setKeyboardMode: (mode: KeyboardMode) => void;
  keyboardFilter: KeyboardFilter;
  setKeyboardFilter: (filter: KeyboardFilter) => void;
  staffMode: StaffMode;
  setStaffMode: (mode: StaffMode) => void;
  chordMode: ChordMode;
  setChordMode: (mode: ChordMode) => void;
  chordCount: number;
  scaleCount: number;
  openPanel: OpenPanel;
  setOpenPanel: (panel: OpenPanel) => void;
}) {
  if (props.moduleId === "keyboard-notes") {
    return (
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Segment value={props.keyboardMode} options={["identify", "reverse"]} onChange={(value) => props.setKeyboardMode(value as KeyboardMode)} />
        <Segment value={props.keyboardFilter} options={["mixed", "white", "black"]} onChange={(value) => props.setKeyboardFilter(value as KeyboardFilter)} />
      </div>
    );
  }
  if (props.moduleId === "staff-notes") {
    return <div className="mt-5"><Segment value={props.staffMode} options={["mixed", "treble", "bass"]} onChange={(value) => props.setStaffMode(value as StaffMode)} /></div>;
  }
  if (props.moduleId === "chords") {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Segment value={props.chordMode} options={["mixed", "build", "name"]} onChange={(value) => props.setChordMode(value as ChordMode)} />
        <DrillPanelButtons
          summary={props.chordCount === ALL_CHORD_PREFERENCES.length ? "Testing all chords" : `Testing ${props.chordCount} chords`}
          openPanel={props.openPanel}
          setOpenPanel={props.setOpenPanel}
        />
      </div>
    );
  }
  if (props.moduleId === "scales") {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <DrillPanelButtons
          summary={props.scaleCount === ALL_SCALE_PREFERENCES.length ? "Testing all scales" : `Testing ${props.scaleCount} scales`}
          openPanel={props.openPanel}
          setOpenPanel={props.setOpenPanel}
        />
      </div>
    );
  }
  return null;
}

function DrillPanelButtons({
  summary,
  openPanel,
  setOpenPanel,
}: {
  summary: string;
  openPanel: OpenPanel;
  setOpenPanel: (panel: OpenPanel) => void;
}) {
  return (
    <>
      <span className="rounded-full border border-ivory/8 bg-ink/40 px-3.5 py-2 text-xs font-semibold text-bone">{summary}</span>
      <button
        type="button"
        onClick={() => {
          playTick();
          setOpenPanel(openPanel === "content" ? null : "content");
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ivory/8 bg-ink/40 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:border-ivory/20 hover:text-ivory active:scale-95",
          openPanel === "content" && "border-brass/40 bg-brass/12 text-brass",
        )}
      >
        <ListChecks size={14} />
        Choose content
      </button>
      <button
        type="button"
        onClick={() => {
          playTick();
          setOpenPanel(openPanel === "cheat-sheet" ? null : "cheat-sheet");
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ivory/8 bg-ink/40 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:border-ivory/20 hover:text-ivory active:scale-95",
          openPanel === "cheat-sheet" && "border-brass/40 bg-brass/12 text-brass",
        )}
      >
        <BookOpen size={14} />
        Cheat sheet
      </button>
    </>
  );
}

function ContentSelector({
  moduleId,
  preferences,
  onApply,
  onClose,
}: {
  moduleId: ModuleId;
  preferences: DrillPreferences;
  onApply: (preferences: DrillPreferences) => void;
  onClose: () => void;
}) {
  const isChords = moduleId === "chords";
  const [draftChordKeys, setDraftChordKeys] = useState(() => new Set(preferences.chords.map(chordPreferenceKey)));
  const [draftScaleKeys, setDraftScaleKeys] = useState(() => new Set(preferences.scales.map(scalePreferenceKey)));
  const chordQualities = Object.keys(CHORD_QUALITIES) as ChordQuality[];
  const scaleTypes = Object.keys(SCALE_TYPES) as ScaleType[];
  const activeCount = isChords ? draftChordKeys.size : draftScaleKeys.size;

  useEffect(() => {
    queueMicrotask(() => {
      setDraftChordKeys(new Set(preferences.chords.map(chordPreferenceKey)));
      setDraftScaleKeys(new Set(preferences.scales.map(scalePreferenceKey)));
    });
  }, [preferences]);

  function apply() {
    if (activeCount === 0) return;
    onApply({
      version: 1,
      chords: ALL_CHORD_PREFERENCES.filter((item) => draftChordKeys.has(chordPreferenceKey(item))),
      scales: ALL_SCALE_PREFERENCES.filter((item) => draftScaleKeys.has(scalePreferenceKey(item))),
    });
    onClose();
  }

  function toggleChord(item: ChordPreference) {
    const key = chordPreferenceKey(item);
    setDraftChordKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleScale(item: ScalePreference) {
    const key = scalePreferenceKey(item);
    setDraftScaleKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-ivory/8 bg-ink/35 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-ivory">Choose content</h2>
          <p className="mt-1 text-[13px] text-bone/75">
            {activeCount ? `${activeCount} ${isChords ? "chord" : "scale"}${activeCount === 1 ? "" : "s"} selected` : "Select at least one item before applying."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              playTick();
              return isChords
                ? setDraftChordKeys(new Set(ALL_CHORD_PREFERENCES.map(chordPreferenceKey)))
                : setDraftScaleKeys(new Set(ALL_SCALE_PREFERENCES.map(scalePreferenceKey)));
            }}
            className="rounded-full border border-ivory/8 bg-ivory/4 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:border-ivory/20 hover:text-ivory active:scale-95"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              playTick();
              return isChords ? setDraftChordKeys(new Set()) : setDraftScaleKeys(new Set());
            }}
            className="rounded-full border border-ivory/8 bg-ivory/4 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:border-ivory/20 hover:text-ivory active:scale-95"
          >
            None
          </button>
          {!isChords && (
            <button
              type="button"
              onClick={() => {
                playTick();
                setDraftScaleKeys(
                  new Set(
                    (["natural minor", "harmonic minor", "melodic minor"] as ScaleType[]).map((type) =>
                      scalePreferenceKey({ root: "C#", type }),
                    ),
                  ),
                );
              }}
              className="rounded-full border border-ivory/8 bg-ivory/4 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:border-brass/35 hover:text-brass active:scale-95"
            >
              C# minor scales
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-96 overflow-auto rounded-2xl border border-ivory/8">
        <div className="min-w-[34rem] divide-y divide-ivory/6">
          {PITCH_CLASSES.map((root) => (
            <div key={root} className="grid grid-cols-[4rem_1fr] items-center gap-3 px-3 py-2">
              <div className="text-sm font-semibold text-brass">{musicLabel(NOTE_LABELS[root])}</div>
              <div className={cn("grid gap-2", isChords ? "grid-cols-2" : "grid-cols-4")}>
                {isChords
                  ? chordQualities.map((quality) => {
                      const item = { root, quality };
                      const selected = draftChordKeys.has(chordPreferenceKey(item));
                      return (
                        <SelectorToggle key={quality} selected={selected} label={quality} onClick={() => toggleChord(item)} />
                      );
                    })
                  : scaleTypes.map((type) => {
                      const item = { root, type };
                      const selected = draftScaleKeys.has(scalePreferenceKey(item));
                      return (
                        <SelectorToggle key={type} selected={selected} label={SCALE_TYPES[type].label} onClick={() => toggleScale(item)} />
                      );
                    })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-[13px]", activeCount ? "text-bone/70" : "text-felt")}>
          {activeCount ? "Changes apply to the next question." : "The current quiz pool stays unchanged until at least one item is selected."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            className="rounded-full border border-ivory/8 px-4 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:text-ivory active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              playTick();
              apply();
            }}
            disabled={!activeCount}
            className="rounded-full bg-ivory px-4 py-2 text-xs font-semibold text-ink transition-all duration-200 hover:bg-brass active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectorToggle({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        playTick();
        onClick();
      }}
      className={cn(
        "min-h-10 rounded-xl border px-3 py-2 text-left text-xs font-semibold capitalize transition-all duration-200 active:scale-[0.98]",
        selected ? "border-brass/45 bg-brass/16 text-brass" : "border-ivory/8 bg-ivory/4 text-bone hover:border-ivory/20 hover:text-ivory",
      )}
    >
      {label}
    </button>
  );
}

function CheatSheet({
  moduleId,
  chordPreferences,
  scalePreferences,
  onClose,
}: {
  moduleId: ModuleId;
  chordPreferences: ChordPreference[];
  scalePreferences: ScalePreference[];
  onClose: () => void;
}) {
  const isChords = moduleId === "chords";
  return (
    <div className="mt-5 rounded-2xl border border-ivory/8 bg-ink/35 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ivory">Cheat sheet</h2>
          <p className="mt-1 text-[13px] text-bone/75">
            {isChords ? "Major and minor triads from your active chord pool." : "Major, natural minor, harmonic minor, and melodic minor from your active scale pool."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            playTick();
            onClose();
          }}
          className="rounded-full border border-ivory/8 px-3.5 py-2 text-xs font-semibold text-bone transition-all duration-200 hover:text-ivory active:scale-95"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid max-h-96 gap-3 overflow-auto sm:grid-cols-2">
        {isChords
          ? chordPreferences.map((item) => {
              const chord = CHORD_QUALITIES[item.quality];
              const notes = notesFromFormula(item.root, chord.formula);
              return (
                <ReferenceCard
                  key={chordPreferenceKey(item)}
                  title={`${musicLabel(NOTE_LABELS[item.root])} ${chord.label}`}
                  formula={`Formula: ${chord.formula.join(" - ")}`}
                  notes={noteListLabel(notes)}
                />
              );
            })
          : scalePreferences.map((item) => {
              const scale = SCALE_TYPES[item.type];
              const notes = scaleNoteLabelsFromFormula(item.root, scale.formula).join(" ");
              return (
                <ReferenceCard
                  key={scalePreferenceKey(item)}
                  title={`${musicLabel(NOTE_LABELS[item.root])} ${scale.label}`}
                  formula={`Steps: ${scale.steps}`}
                  notes={notes}
                />
              );
            })}
      </div>
    </div>
  );
}

function ReferenceCard({ title, formula, notes }: { title: string; formula: string; notes: string }) {
  return (
    <div className="rounded-2xl border border-ivory/8 bg-ivory/4 p-4">
      <h3 className="font-semibold text-ivory">{title}</h3>
      <p className="mt-2 text-xs text-bone/70">{formula}</p>
      <p className="mt-3 text-[13px] font-semibold leading-6 text-brass">{musicLabel(notes)}</p>
    </div>
  );
}

function Segment({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="inline-flex rounded-full border border-ivory/8 bg-ink/40 p-1" role="tablist">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          onClick={() => {
            if (value !== option) playTick();
            onChange(option);
          }}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-250 ease-out",
            value === option ? "bg-ivory text-ink shadow-sm" : "text-bone hover:text-ivory",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ChoiceGrid({
  question,
  submitted,
  correct,
  onSubmit,
}: {
  question: QuizQuestion;
  submitted: string | null;
  correct: boolean | null;
  onSubmit: (answer: string) => void;
}) {
  if (question.moduleId === "keyboard-notes" || question.moduleId === "staff-notes") {
    return (
      <NoteButtons
        onAnswer={onSubmit}
        disabled={correct !== null}
        selectedAnswer={submitted ?? undefined}
        correctAnswer={correct !== null ? question.answer : undefined}
      />
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {(question.choices ?? []).map((choice) => {
        const isWrongPick = correct !== null && submitted === choice && choice !== question.answer;
        const isAnswer = correct !== null && choice === question.answer;
        return (
          <button
            key={choice}
            type="button"
            data-answer-choice="true"
            disabled={correct !== null}
            onClick={() => onSubmit(choice)}
            className={cn(
              "min-h-14 rounded-xl border border-ivory/8 bg-ivory/4 px-4 py-3 text-left text-[13.5px] font-medium leading-6 text-ivory transition-all duration-200 ease-out",
              correct === null && "hover:-translate-y-0.5 hover:border-ivory/20 hover:bg-ivory/8 active:translate-y-0 active:scale-[0.98]",
              isWrongPick && "shake-x border-felt/60 bg-felt/15",
              isAnswer && "border-moss/60 bg-moss/15 text-moss",
            )}
          >
            {musicLabel(choice)}
          </button>
        );
      })}
    </div>
  );
}

function Feedback({
  correct,
  responseMs,
  answer,
  explanation,
  onNext,
}: {
  correct: boolean;
  responseMs: number;
  answer: string;
  explanation?: string;
  onNext: () => void;
}) {
  return (
    <div
      className={cn(
        "pop-in flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 sm:px-5",
        correct ? "border-moss/25 bg-moss/8" : "border-felt/25 bg-felt/8",
      )}
      role="status"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {correct ? (
          <svg width="30" height="30" viewBox="0 0 30 30" className="shrink-0" aria-hidden>
            <circle cx="15" cy="15" r="14" fill="none" stroke="rgba(143,174,116,0.35)" />
            <path d="M9 15.5 L13.2 19.5 L21 10.5" fill="none" stroke="#8fae74" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 30 30" className="draw-cross shrink-0" aria-hidden>
            <circle cx="15" cy="15" r="14" fill="none" stroke="rgba(196,69,61,0.35)" />
            <line x1="10.5" y1="10.5" x2="19.5" y2="19.5" stroke="#c4453d" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="19.5" y1="10.5" x2="10.5" y2="19.5" stroke="#c4453d" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-ivory">
            {correct ? "Correct" : answer}
          </div>
          <div className="tnum truncate text-xs text-bone">
            {formatMs(responseMs)}
            {explanation ? ` · ${musicLabel(explanation)}` : ""}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className={cn(
          "relative flex shrink-0 items-center gap-2.5 rounded-full bg-ivory py-2 text-[13px] font-semibold text-ink transition-all duration-200 hover:bg-brass active:scale-95",
          correct ? "pl-4 pr-3" : "px-4",
        )}
      >
        Next
        {correct && (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <circle cx="9" cy="9" r="8" fill="none" stroke="rgba(11,11,13,0.15)" strokeWidth="2" />
            <circle cx="9" cy="9" r="8" stroke="rgba(11,11,13,0.6)" strokeWidth="2" className="auto-ring-progress" style={{ "--ring-ms": "1500ms" } as React.CSSProperties} />
          </svg>
        )}
      </button>
    </div>
  );
}
