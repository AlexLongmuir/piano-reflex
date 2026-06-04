import type { PitchClass } from "@/types/quiz";

export type ChordQuality = "major" | "minor";

export const CHORD_QUALITIES: Record<ChordQuality, { label: string; formula: number[] }> = {
  major: { label: "major", formula: [0, 4, 7] },
  minor: { label: "minor", formula: [0, 3, 7] },
};

export type ChordDefinition = {
  root: PitchClass;
  quality: ChordQuality;
};
