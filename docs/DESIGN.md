# Piano Reflex — Design System

Concept: **the instrument is the interface.** Every color, texture, and motion
comes from the physical piano — no generic SaaS gradients.

## Materials (palette)

| Token    | Hex       | Source                                  |
| -------- | --------- | --------------------------------------- |
| `ink`    | `#0b0b0d` | ebony fallboard, page background         |
| `coal`   | `#141417` | raised surfaces (cards, keys' shadow)    |
| `ivory`  | `#f2eee3` | natural key material, primary text       |
| `bone`   | `#a8a394` | secondary text                           |
| `brass`  | `#d6a64e` | pedals & hinges — the single accent      |
| `felt`   | `#c4453d` | the red felt strip under the keys — error|
| `moss`   | `#8fae74` | muted sage — success                     |

Rules:
- Brass is rationed. It marks the live target and nothing else on a screen.
- Surfaces are flat with hairline (`1px`, low-alpha ivory) borders; depth comes
  from layered shadows + the grain overlay, never from big gradients.
- Film grain (`.grain` overlay) and the ambient WebGL canvas sit behind
  everything at very low opacity.

## Type

- Display: **Fraunces Variable** (`font-display`) — warm, optical-sized serif
  for prompts and headlines. Use `font-weight 500–620`, tight tracking.
- UI: **Instrument Sans Variable** (`font-sans`).
- Numbers in stats use `tabular-nums`.
- Small-caps labels: 11px, `letter-spacing 0.16em`, uppercase, `bone`.

Both are self-hosted via `@fontsource-variable/*` (no network fetch at build).

## Motion

- Springs over easings: `--ease-spring: cubic-bezier(.34,1.56,.64,1)` for
  entrances, `--ease-out-soft: cubic-bezier(.22,1,.36,1)` for everything else.
- Question changes: outgoing content is not animated (instant), incoming runs
  `q-enter` (6px rise + blur(6px)→0 + fade, 420ms).
- Page loads: `template.tsx` runs a single rise/fade. No route-out animation.
- Every animation must respect `prefers-reduced-motion` (handled globally in
  `globals.css`).

## The keyboard (`src/components/piano/piano-keyboard.tsx`)

Pure geometry — **all positions are % of container width** so white and black
keys can never drift apart on any viewport (this was the iPhone bug: black keys
used hardcoded % against a px-gapped grid).

- 14 white keys, each `100/14 %` wide, absolutely positioned.
- Black keys are `62%` of a white key wide, `60%` tall, centered on the white
  boundary with real-piano offsets (C♯ −0.14, D♯ +0.14, F♯ −0.17, A♯ +0.17 of
  a white width).
- Touch: a magnifier bubble (iOS-keyboard style) pops above the pressed key
  showing the note name.
- Sound: every press synthesizes the actual pitch (`src/lib/audio.ts`).
- Press physics: keys rotate around their top edge (perspective container).

## Sound (`src/lib/audio.ts`)

Synthesized, no samples: 3 detuned partials + lowpass + exponential decay.
UI feedback: correct = dyad chime of the answered pitch, wrong = low felt thud.
Mute toggle persisted to `localStorage` (`pr-muted`). AudioContext is created
lazily on first gesture.

## Auditing

`npm run audit:design` (scripts/audit-design.mjs) boots the dev server,
screenshots every route at iPhone 14 Pro (390×844 @3x) and desktop (1440×900)
into `.audit/`, including interaction states. Run it after any visual change.
