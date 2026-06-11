"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NoteButtons } from "@/components/drill/note-buttons";
import { CircleOfFifths } from "@/components/drill/circle-of-fifths";
import { useProgress } from "@/components/drill/progress-context";
import { PianoKeyboard } from "@/components/piano/piano-keyboard";
import { StaffRenderer } from "@/components/staff/staff-renderer";
import { MODULES } from "@/data/modules";
import { NOTE_LABELS, normalizeAnswer, PITCH_CLASSES } from "@/data/notes";
import { playAscending, playCorrect, playTick, playWrong } from "@/lib/audio";
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
import { cn, formatMs, musicLabel, percent } from "@/lib/utils";
import type { ModuleId, PitchClass, QuizQuestion } from "@/types/quiz";

type KeyboardFilter = "mixed" | "white" | "black";
type KeyboardMode = "identify" | "reverse";
type StaffMode = "mixed" | "treble" | "bass";
type ChordMode = "mixed" | "build" | "name";
type SelectedKey = { keyId: string; pitch: PitchClass };

const AUTO_ADVANCE_MS = 1500;

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
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  function nextQuestion() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
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
        />

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
                    selectedNotes.map((note) => (
                      <span
                        key={note}
                        className="pop-in rounded-full border border-ivory/10 bg-ivory/6 px-2.5 py-1 text-xs font-semibold text-ivory"
                      >
                        {musicLabel(NOTE_LABELS[note]).split("/")[0]}
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
    return <div className="mt-5"><Segment value={props.chordMode} options={["mixed", "build", "name"]} onChange={(value) => props.setChordMode(value as ChordMode)} /></div>;
  }
  return null;
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
