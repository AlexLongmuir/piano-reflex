"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NoteButtons } from "@/components/drill/note-buttons";
import { useProgress } from "@/components/drill/progress-context";
import { PianoKeyboard } from "@/components/piano/piano-keyboard";
import { StaffRenderer } from "@/components/staff/staff-renderer";
import { MODULES } from "@/data/modules";
import { NOTE_LABELS } from "@/data/notes";
import { noteSetKey } from "@/lib/music-theory";
import {
  createChordQuestion,
  createCircleQuestion,
  createKeyboardQuestion,
  createQuestion,
  createScaleQuestion,
  createStaffQuestion,
  createTermQuestion,
} from "@/lib/quiz-engine";
import { cn, formatMs, percent } from "@/lib/utils";
import type { ModuleId, PitchClass, QuizQuestion } from "@/types/quiz";

type KeyboardFilter = "mixed" | "white" | "black";
type KeyboardMode = "identify" | "reverse";
type StaffMode = "mixed" | "treble" | "bass";
type ChordMode = "mixed" | "build" | "name";
type SelectedKey = { keyId: string; pitch: PitchClass };

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
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<SelectedKey[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [responseMs, setResponseMs] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  const buildQuestion = useMemo(
    () => () => {
      if (moduleId === "keyboard-notes") return createKeyboardQuestion({ mode: keyboardMode, keyFilter: keyboardFilter });
      if (moduleId === "staff-notes") return createStaffQuestion(staffMode);
      if (moduleId === "chords") return createChordQuestion(chordMode === "mixed" ? (Math.random() > 0.5 ? "build" : "name") : chordMode);
      if (moduleId === "scales") return createScaleQuestion();
      if (moduleId === "circle-of-fifths") return createCircleQuestion();
      if (moduleId === "piano-terms") return createTermQuestion();
      return createQuestion(moduleId);
    },
    [moduleId, keyboardMode, keyboardFilter, staffMode, chordMode],
  );

  useEffect(() => {
    queueMicrotask(() => nextQuestion());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, keyboardMode, keyboardFilter, staffMode, chordMode]);

  function nextQuestion() {
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

  function toggleNote(key: { id: string; pitch: PitchClass }) {
    if (!question || correct !== null) return;
    if (question.mode === "keyboard-reverse") {
      setSelectedKeys([{ keyId: key.id, pitch: key.pitch }]);
      submit(NOTE_LABELS[key.pitch]);
      return;
    }
    if (question.mode !== "chord-build" && question.mode !== "scale-build") return;
    setSelectedKeys((current) => {
      const existing = current.find((item) => item.pitch === key.pitch);
      if (existing) return current.filter((item) => item.pitch !== key.pitch);
      if (question.mode === "scale-build") {
        return [...current, { keyId: key.id, pitch: key.pitch }];
      }
      return [...current, { keyId: key.id, pitch: key.pitch }];
    });
  }

  function submitSelectedNotes() {
    if (!question) return;
    const selectedNotes = selectedKeys.map((key) => key.pitch);
    if (question.mode === "scale-build") {
      submit(selectedNotes.join("-"));
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

  if (!question) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-amber-300">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <section className="mt-5 rounded-lg border border-zinc-850 bg-zinc-950/80 p-7 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300/80">{moduleInfo.title}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Loading drill...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-amber-300">
        <ArrowLeft size={16} />
        Dashboard
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="rounded-lg border border-zinc-850 bg-zinc-950/80 p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300/80">{moduleInfo.title}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{question.prompt}</h1>
            </div>
            <button
              type="button"
              onClick={nextQuestion}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-amber-400 hover:text-stone-100"
            >
              <RotateCcw size={16} />
              Skip
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
          />

          <div className="mt-8 space-y-6">
            {(moduleId === "keyboard-notes" || moduleId === "chords" || moduleId === "scales") && (
              <PianoKeyboard
                highlighted={highlighted}
                highlightedKeyIds={highlightedKeyIds}
                selected={selectedNotes}
                selectedKeyIds={selectedKeyIds}
                target={correct === false ? question.targetNotes : undefined}
                targetKeyIds={correct === false ? question.targetKeyIds : undefined}
                onPress={toggleNote}
                showLabels={question.mode !== "keyboard-identify"}
                disabled={correct !== null && question.mode !== "keyboard-reverse"}
              />
            )}

            {question.staff && <StaffRenderer clef={question.staff.clef} noteKey={question.staff.vexflowKey} />}

            {moduleId === "circle-of-fifths" && <CircleVisual />}

            {moduleId === "piano-terms" && (
              <div className="rounded-md border border-zinc-850 bg-black/30 p-5 text-xl font-medium leading-8 text-stone-100">
                {question.prompt}
              </div>
            )}

            {isBuildMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-zinc-500">
                  Selected:{" "}
                  <span className="font-semibold text-zinc-200">
                    {selectedNotes.length ? selectedNotes.map((note) => NOTE_LABELS[note]).join(" ") : "none"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={submitSelectedNotes}
                  disabled={!selectedNotes.length || correct !== null}
                  className="rounded-md bg-amber-300 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Submit notes
                </button>
              </div>
            ) : question.mode === "keyboard-reverse" ? (
              <p className="rounded-md border border-zinc-850 bg-black/30 p-4 text-sm text-zinc-400">
                Click the matching key on the piano. Labels are visible in reverse mode for a cleaner first version.
              </p>
            ) : (
              <ChoiceGrid question={question} submitted={submitted} correct={correct} onSubmit={submit} />
            )}

            {correct !== null && (
              <Feedback correct={correct} responseMs={responseMs} answer={question.answer} explanation={question.explanation} onNext={nextQuestion} />
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-850 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Session</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Streak" value={String(streak)} />
              <Stat label="Accuracy" value={percent(sessionCorrect, sessionAttempts)} />
              <Stat label="Reps" value={String(sessionAttempts)} />
              <Stat label="Last" value={formatMs(responseMs)} />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-850 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">All time</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-400">
              <Row label="Reps" value={String(stats.attempts)} />
              <Row label="Accuracy" value={percent(stats.correct, stats.attempts)} />
              <Row label="Avg response" value={formatMs(stats.attempts ? stats.totalResponseMs / stats.attempts : 0)} />
              <Row label="Best streak" value={String(stats.bestStreak)} />
            </div>
          </div>
        </aside>
      </div>
    </main>
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
}) {
  if (props.moduleId === "keyboard-notes") {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Segment value={props.keyboardMode} options={["identify", "reverse"]} onChange={(value) => props.setKeyboardMode(value as KeyboardMode)} />
        <Segment value={props.keyboardFilter} options={["mixed", "white", "black"]} onChange={(value) => props.setKeyboardFilter(value as KeyboardFilter)} />
      </div>
    );
  }
  if (props.moduleId === "staff-notes") {
    return <div className="mt-6"><Segment value={props.staffMode} options={["mixed", "treble", "bass"]} onChange={(value) => props.setStaffMode(value as StaffMode)} /></div>;
  }
  if (props.moduleId === "chords") {
    return <div className="mt-6"><Segment value={props.chordMode} options={["mixed", "build", "name"]} onChange={(value) => props.setChordMode(value as ChordMode)} /></div>;
  }
  return null;
}

function Segment({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-zinc-850 bg-black/30 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-semibold capitalize text-zinc-500 transition hover:text-zinc-100",
            value === option && "bg-zinc-800 text-amber-300",
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
    return <NoteButtons onAnswer={onSubmit} disabled={correct !== null} selectedAnswer={submitted ?? undefined} correctAnswer={correct !== null ? question.answer : undefined} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(question.choices ?? []).map((choice) => (
        <button
          key={choice}
          type="button"
          data-answer-choice="true"
          disabled={correct !== null}
          onClick={() => onSubmit(choice)}
          className={cn(
            "min-h-16 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm font-semibold leading-6 text-zinc-100 transition hover:border-amber-400 hover:bg-zinc-850 disabled:cursor-default",
            submitted === choice && "border-red-400 bg-red-950/40",
            correct !== null && choice === question.answer && "border-emerald-400 bg-emerald-950/50 text-emerald-100",
          )}
        >
          {choice}
        </button>
      ))}
    </div>
  );
}

function Feedback({ correct, responseMs, answer, explanation, onNext }: { correct: boolean; responseMs: number; answer: string; explanation?: string; onNext: () => void }) {
  return (
    <div className={cn("rounded-md border p-4", correct ? "border-emerald-400/50 bg-emerald-950/30" : "border-red-400/50 bg-red-950/25")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", correct ? "bg-emerald-400 text-zinc-950" : "bg-red-400 text-zinc-950")}>
            {correct ? <Check size={20} /> : <X size={20} />}
          </span>
          <div>
            <div className="font-semibold">{correct ? "Correct" : `Answer: ${answer}`}</div>
            <div className="text-sm text-zinc-400">{formatMs(responseMs)}{explanation ? ` · ${explanation}` : ""}</div>
          </div>
        </div>
        <button type="button" onClick={onNext} className="rounded-md bg-stone-100 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-200">
          Next
        </button>
      </div>
    </div>
  );
}

function CircleVisual() {
  const labels = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "A#/Bb", "D#/Eb", "G#/Ab"];
  return (
    <div className="mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-full border border-zinc-800 bg-black/30">
      <div className="grid aspect-square w-72 place-items-center rounded-full border border-amber-300/25">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-zinc-300">
          {labels.map((label) => (
            <span key={label} className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1">{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-850 bg-black/30 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-zinc-600">{label}</div>
      <div className="mt-2 text-xl font-semibold text-stone-100">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-stone-100">{value}</span>
    </div>
  );
}
