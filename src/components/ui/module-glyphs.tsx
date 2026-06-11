import type { ModuleId } from "@/types/quiz";

const STROKE = { stroke: "currentColor", strokeWidth: 1.1, fill: "none" } as const;

function KeyboardGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      <rect x="5" y="12" width="34" height="20" rx="2.5" {...STROKE} opacity="0.55" />
      {[12.6, 20.2, 27.8, 35.4].map((x, i) =>
        x < 39 ? <line key={i} x1={x} y1="12.5" x2={x} y2="31.5" {...STROKE} opacity="0.55" /> : null,
      )}
      <rect x="10.8" y="12.4" width="3.6" height="11" rx="0.8" fill="currentColor" />
      <rect x="25.9" y="12.4" width="3.6" height="11" rx="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function StaffGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      {[14, 18, 22, 26, 30].map((y) => (
        <line key={y} x1="6" y1={y} x2="38" y2={y} {...STROKE} opacity="0.45" />
      ))}
      <ellipse cx="27" cy="22" rx="3.4" ry="2.6" fill="currentColor" transform="rotate(-18 27 22)" />
      <line x1="30.2" y1="21" x2="30.2" y2="10" {...STROKE} strokeWidth="1.3" />
    </svg>
  );
}

function ChordGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      {[14, 18, 22, 26, 30].map((y) => (
        <line key={y} x1="6" y1={y} x2="38" y2={y} {...STROKE} opacity="0.45" />
      ))}
      {[28, 24, 20].map((cy, i) => (
        <ellipse key={cy} cx="23" cy={cy} rx="3.2" ry="2.4" fill="currentColor" opacity={1 - i * 0.22} transform={`rotate(-18 23 ${cy})`} />
      ))}
    </svg>
  );
}

function ScaleGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      {[
        [9, 31],
        [14.5, 28],
        [20, 25],
        [25.5, 22],
        [31, 19],
        [36.5, 16],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.1" fill="currentColor" opacity={0.4 + i * 0.12} />
      ))}
      <line x1="8" y1="35" x2="38" y2="35" {...STROKE} opacity="0.4" />
    </svg>
  );
}

function CircleGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      <circle cx="22" cy="22" r="13" {...STROKE} opacity="0.55" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 22 + Math.cos(angle) * 13;
        const y = 22 + Math.sin(angle) * 13;
        return <circle key={i} cx={x} cy={y} r={i === 0 ? 2.2 : 1.1} fill="currentColor" opacity={i === 0 ? 1 : 0.45} />;
      })}
    </svg>
  );
}

function TermsGlyph() {
  return (
    <svg viewBox="0 0 44 44" className="h-full w-full" aria-hidden>
      <text x="22" y="28" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="17" fill="currentColor">
        mf
      </text>
      <line x1="10" y1="33.5" x2="34" y2="33.5" {...STROKE} opacity="0.4" />
    </svg>
  );
}

export function ModuleGlyph({ id }: { id: ModuleId }) {
  switch (id) {
    case "keyboard-notes":
      return <KeyboardGlyph />;
    case "staff-notes":
      return <StaffGlyph />;
    case "chords":
      return <ChordGlyph />;
    case "scales":
      return <ScaleGlyph />;
    case "circle-of-fifths":
      return <CircleGlyph />;
    case "piano-terms":
      return <TermsGlyph />;
  }
}
