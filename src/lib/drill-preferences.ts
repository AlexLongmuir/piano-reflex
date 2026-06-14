"use client";

import { CHORD_QUALITIES, type ChordQuality } from "@/data/chords";
import { PITCH_CLASSES } from "@/data/notes";
import { SCALE_TYPES, type ScaleType } from "@/data/scales";
import type { PitchClass } from "@/types/quiz";

const STORAGE_KEY = "piano-reflex:v1:drill-preferences";

export type ChordPreference = {
  root: PitchClass;
  quality: ChordQuality;
};

export type ScalePreference = {
  root: PitchClass;
  type: ScaleType;
};

export type DrillPreferences = {
  version: 1;
  chords: ChordPreference[];
  scales: ScalePreference[];
};

export const ALL_CHORD_PREFERENCES: ChordPreference[] = PITCH_CLASSES.flatMap((root) =>
  (Object.keys(CHORD_QUALITIES) as ChordQuality[]).map((quality) => ({ root, quality })),
);

export const ALL_SCALE_PREFERENCES: ScalePreference[] = PITCH_CLASSES.flatMap((root) =>
  (Object.keys(SCALE_TYPES) as ScaleType[]).map((type) => ({ root, type })),
);

export function chordPreferenceKey(item: ChordPreference) {
  return `${item.root}:${item.quality}`;
}

export function scalePreferenceKey(item: ScalePreference) {
  return `${item.root}:${item.type}`;
}

export function defaultDrillPreferences(): DrillPreferences {
  return {
    version: 1,
    chords: ALL_CHORD_PREFERENCES,
    scales: ALL_SCALE_PREFERENCES,
  };
}

export function loadDrillPreferences(): DrillPreferences {
  if (typeof window === "undefined") return defaultDrillPreferences();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDrillPreferences();

    const parsed = JSON.parse(raw) as Partial<DrillPreferences>;
    if (parsed.version !== 1) return defaultDrillPreferences();

    const validChordKeys = new Set(ALL_CHORD_PREFERENCES.map(chordPreferenceKey));
    const validScaleKeys = new Set(ALL_SCALE_PREFERENCES.map(scalePreferenceKey));
    const chords = (parsed.chords ?? []).filter(isChordPreference).filter((item) => validChordKeys.has(chordPreferenceKey(item)));
    const scales = (parsed.scales ?? []).filter(isScalePreference).filter((item) => validScaleKeys.has(scalePreferenceKey(item)));

    return {
      version: 1,
      chords: chords.length ? chords : ALL_CHORD_PREFERENCES,
      scales: scales.length ? scales : ALL_SCALE_PREFERENCES,
    };
  } catch {
    return defaultDrillPreferences();
  }
}

export function saveDrillPreferences(preferences: DrillPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function isPitchClass(value: unknown): value is PitchClass {
  return typeof value === "string" && (PITCH_CLASSES as string[]).includes(value);
}

function isChordQuality(value: unknown): value is ChordQuality {
  return typeof value === "string" && Object.keys(CHORD_QUALITIES).includes(value);
}

function isScaleType(value: unknown): value is ScaleType {
  return typeof value === "string" && Object.keys(SCALE_TYPES).includes(value);
}

function isChordPreference(value: unknown): value is ChordPreference {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ChordPreference>;
  return isPitchClass(item.root) && isChordQuality(item.quality);
}

function isScalePreference(value: unknown): value is ScalePreference {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ScalePreference>;
  return isPitchClass(item.root) && isScaleType(item.type);
}
