"use client";

import { CIRCLE_KEYS } from "@/data/circle-of-fifths";
import { NOTE_LABELS } from "@/data/notes";
import { cn, musicLabel } from "@/lib/utils";

type Props = {
  /** The drill prompt, used to locate the key being asked about. */
  prompt: string;
  /** Labels are hidden until the question is answered, so the wheel teaches without telling. */
  revealed: boolean;
};

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_R = 132;
const INNER_R = 96;

function position(index: number, radius: number) {
  const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

export function CircleOfFifths({ prompt, revealed }: Props) {
  // Match the longest key label first so "C#" doesn't match the "C" segment.
  const focused = [...CIRCLE_KEYS]
    .sort((a, b) => NOTE_LABELS[b.major].length - NOTE_LABELS[a.major].length)
    .find((key) => prompt.includes(`${NOTE_LABELS[key.major]} major`));

  return (
    <div className="flex justify-center py-2">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[300px] sm:max-w-[320px]"
        role="img"
        aria-label="Circle of fifths"
      >
        <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="rgba(242,238,227,0.1)" />
        <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="none" stroke="rgba(242,238,227,0.06)" />

        {CIRCLE_KEYS.map((key, index) => {
          const outer = position(index, OUTER_R);
          const inner = position(index, INNER_R);
          const isFocus = focused?.major === key.major;
          return (
            <g key={key.major}>
              <circle
                cx={outer.x}
                cy={outer.y}
                r={isFocus ? 17 : 15}
                className={cn(
                  "transition-all duration-500",
                  isFocus ? "fill-brass/15 stroke-brass" : "fill-coal stroke-ivory/12",
                )}
                strokeWidth={isFocus ? 1.5 : 1}
              />
              <text
                x={outer.x}
                y={outer.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  "font-sans transition-all duration-500",
                  isFocus ? "fill-brass" : "fill-ivory",
                )}
                fontSize={11}
                fontWeight={600}
                opacity={revealed || isFocus ? 1 : 0.18}
              >
                {revealed || isFocus ? musicLabel(NOTE_LABELS[key.major]).split(" ")[0] : "·"}
              </text>
              <text
                x={inner.x}
                y={inner.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-bone transition-opacity duration-500"
                fontSize={9}
                fontWeight={500}
                opacity={revealed ? 0.85 : 0}
              >
                {musicLabel(NOTE_LABELS[key.minor]).split(" ")[0]}m
              </text>
            </g>
          );
        })}

        <text
          x={CENTER}
          y={CENTER - 7}
          textAnchor="middle"
          className="fill-bone"
          fontSize={9}
          letterSpacing="0.16em"
        >
          {revealed ? "MAJOR · minor" : "CIRCLE OF"}
        </text>
        {!revealed && (
          <text x={CENTER} y={CENTER + 9} textAnchor="middle" className="fill-bone" fontSize={9} letterSpacing="0.16em">
            FIFTHS
          </text>
        )}
      </svg>
    </div>
  );
}
