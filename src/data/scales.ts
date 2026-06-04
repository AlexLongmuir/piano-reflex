export type ScaleType = "major" | "natural minor" | "harmonic minor" | "melodic minor";

export const SCALE_TYPES: Record<ScaleType, { label: string; formula: number[]; steps: string }> = {
  major: { label: "major", formula: [0, 2, 4, 5, 7, 9, 11], steps: "W W H W W W H" },
  "natural minor": { label: "natural minor", formula: [0, 2, 3, 5, 7, 8, 10], steps: "W H W W H W W" },
  "harmonic minor": { label: "harmonic minor", formula: [0, 2, 3, 5, 7, 8, 11], steps: "W H W W H +3 H" },
  "melodic minor": { label: "melodic minor", formula: [0, 2, 3, 5, 7, 9, 11], steps: "W H W W W W H" },
};
