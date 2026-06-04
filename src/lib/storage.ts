"use client";

import { MODULES } from "@/data/modules";
import { todayKey } from "@/lib/utils";
import type { AnswerResult, ModuleId } from "@/types/quiz";
import type { ModuleProgress, ProgressState } from "@/types/progress";

const STORAGE_KEY = "piano-reflex:v1:progress";

function emptyModule(): ModuleProgress {
  return { attempts: 0, correct: 0, totalResponseMs: 0, bestStreak: 0 };
}

export function defaultProgress(): ProgressState {
  return {
    version: 1,
    modules: Object.fromEntries(MODULES.map((module) => [module.id, emptyModule()])) as Record<ModuleId, ModuleProgress>,
    weakAreas: {},
    daily: {},
  };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return defaultProgress();
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordProgress(
  progress: ProgressState,
  moduleId: ModuleId,
  result: AnswerResult,
  currentStreak: number,
): ProgressState {
  const next: ProgressState = structuredClone(progress);
  const moduleProgress = next.modules[moduleId] ?? emptyModule();
  moduleProgress.attempts += 1;
  moduleProgress.correct += result.correct ? 1 : 0;
  moduleProgress.totalResponseMs += result.responseMs;
  moduleProgress.bestStreak = Math.max(moduleProgress.bestStreak, currentStreak);
  next.modules[moduleId] = moduleProgress;

  const day = todayKey();
  next.daily[day] ??= { attempts: 0, correct: 0, totalResponseMs: 0 };
  next.daily[day].attempts += 1;
  next.daily[day].correct += result.correct ? 1 : 0;
  next.daily[day].totalResponseMs += result.responseMs;

  if (!result.correct || result.responseMs > 4500) {
    for (const tag of result.weakAreaTags) {
      next.weakAreas[tag] = (next.weakAreas[tag] ?? 0) + 1;
    }
  }

  saveProgress(next);
  return next;
}
