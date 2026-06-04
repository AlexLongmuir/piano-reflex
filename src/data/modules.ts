import type { ModuleId } from "@/types/quiz";

export const MODULES: {
  id: ModuleId;
  title: string;
  shortTitle: string;
  description: string;
}[] = [
  {
    id: "keyboard-notes",
    title: "Keyboard Notes",
    shortTitle: "Keyboard",
    description: "React to highlighted keys or find notes directly on the piano.",
  },
  {
    id: "staff-notes",
    title: "Staff Notes",
    shortTitle: "Staff",
    description: "Identify single notes on treble and bass clefs.",
  },
  {
    id: "chords",
    title: "Chords",
    shortTitle: "Chords",
    description: "Build and name major/minor triads.",
  },
  {
    id: "scales",
    title: "Scales",
    shortTitle: "Scales",
    description: "Build major and minor scale patterns on the keyboard.",
  },
  {
    id: "circle-of-fifths",
    title: "Circle of Fifths",
    shortTitle: "Fifths",
    description: "Drill fifths, key signatures, and relative keys.",
  },
  {
    id: "piano-terms",
    title: "Piano Terms",
    shortTitle: "Terms",
    description: "Learn notation, rhythm, expression, and theory vocabulary.",
  },
];
