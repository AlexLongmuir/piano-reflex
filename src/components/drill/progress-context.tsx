"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultProgress, loadProgress, recordProgress } from "@/lib/storage";
import type { AnswerResult, ModuleId } from "@/types/quiz";
import type { ProgressState } from "@/types/progress";

type ProgressContextValue = {
  progress: ProgressState;
  record: (moduleId: ModuleId, result: AnswerResult, currentStreak: number) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => defaultProgress());

  useEffect(() => {
    queueMicrotask(() => setProgress(loadProgress()));
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      record(moduleId, result, currentStreak) {
        setProgress((current) => recordProgress(current, moduleId, result, currentStreak));
      },
    }),
    [progress],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
