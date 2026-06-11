"use client";

import { ANSWER_LABELS } from "@/data/notes";
import { cn, musicLabel } from "@/lib/utils";

type Props = {
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
  correctAnswer?: string;
};

export function NoteButtons({ onAnswer, disabled, selectedAnswer, correctAnswer }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
      {ANSWER_LABELS.map((label) => {
        const isWrongPick = selectedAnswer === label && correctAnswer !== label;
        const isCorrect = correctAnswer === label;
        const [natural, enharmonic] = musicLabel(label).split("/");
        return (
          <button
            key={label}
            type="button"
            data-answer-choice="true"
            disabled={disabled}
            onClick={() => onAnswer(label)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center rounded-xl border border-ivory/8 bg-ivory/4 py-2 leading-none transition-all duration-200 ease-out",
              !disabled && "hover:-translate-y-0.5 hover:border-ivory/20 hover:bg-ivory/8 active:translate-y-0 active:scale-95",
              isWrongPick && "shake-x border-felt/60 bg-felt/15",
              isCorrect && "border-moss/60 bg-moss/15",
            )}
          >
            <span className={cn("text-[15px] font-semibold text-ivory", isCorrect && "text-moss", isWrongPick && "text-felt")}>
              {natural}
            </span>
            {enharmonic && <span className="mt-1 text-[10px] font-medium text-bone/70">{enharmonic}</span>}
          </button>
        );
      })}
    </div>
  );
}
