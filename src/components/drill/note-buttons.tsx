"use client";

import { ANSWER_LABELS } from "@/data/notes";
import { cn } from "@/lib/utils";

type Props = {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
  correctAnswer?: string;
};

export function NoteButtons({ onAnswer, disabled, selectedAnswer, correctAnswer }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
      {ANSWER_LABELS.map((label) => (
        <button
          key={label}
          type="button"
          data-answer-choice="true"
          disabled={disabled}
          onClick={() => onAnswer(label)}
          className={cn(
            "rounded-md border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-semibold text-zinc-100 transition hover:border-amber-400 hover:bg-zinc-850 disabled:cursor-default",
            selectedAnswer === label && "border-red-400 bg-red-950/40",
            correctAnswer === label && "border-emerald-400 bg-emerald-950/50 text-emerald-100",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
