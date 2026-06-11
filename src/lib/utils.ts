import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sample<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0.0s";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

/** Typographic accidentals: "C#/Db" → "C♯/D♭", "Bb minor" → "B♭ minor". */
export function musicLabel(label: string) {
  return label.replace(/([A-G])#/g, "$1♯").replace(/([A-G])b/g, "$1♭");
}
