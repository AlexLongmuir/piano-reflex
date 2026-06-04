import type { ModuleId } from "./quiz";

export type ModuleProgress = {
  attempts: number;
  correct: number;
  totalResponseMs: number;
  bestStreak: number;
};

export type DailyProgress = {
  attempts: number;
  correct: number;
  totalResponseMs: number;
};

export type ProgressState = {
  version: 1;
  modules: Record<ModuleId, ModuleProgress>;
  weakAreas: Record<string, number>;
  daily: Record<string, DailyProgress>;
};
