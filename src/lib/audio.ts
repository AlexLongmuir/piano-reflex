"use client";

import type { PitchClass } from "@/types/quiz";

const PC_INDEX: Record<PitchClass, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

if (typeof window !== "undefined") {
  muted = localStorage.getItem("pr-muted") === "1";
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const muteListeners = new Set<() => void>();

export function isMuted() {
  return muted;
}

export function subscribeMuted(listener: () => void) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function setMuted(value: boolean) {
  muted = value;
  localStorage.setItem("pr-muted", value ? "1" : "0");
  if (ctx && master) {
    master.gain.setTargetAtTime(value ? 0 : 0.9, ctx.currentTime, 0.02);
  }
  muteListeners.forEach((listener) => listener());
}

export function frequencyOf(pitch: PitchClass, octave: number): number {
  const midi = 12 * (octave + 1) + PC_INDEX[pitch];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * A small additive "felt piano" voice: three detuned partials through a
 * lowpass, with a fast attack and exponential decay.
 */
function voice(freq: number, when: number, velocity: number, duration: number) {
  if (!ctx || !master) return;
  const out = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(freq * 7, 9000), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 400), when + duration * 0.85);
  filter.Q.value = 0.4;
  out.connect(filter);
  filter.connect(master);

  const partials: [number, number, OscillatorType][] = [
    [1, 1, "triangle"],
    [2.001, 0.32, "sine"],
    [3.004, 0.12, "sine"],
  ];
  for (const [ratio, level, type] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq * ratio;
    osc.detune.value = (Math.random() - 0.5) * 4;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(velocity * level, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(out);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }
}

export function playNote(pitch: PitchClass, octave: number, velocity = 0.5) {
  const audio = ensureContext();
  if (!audio) return;
  voice(frequencyOf(pitch, octave), audio.currentTime, velocity, 1.4);
}

export function playChord(notes: { pitch: PitchClass; octave: number }[], velocity = 0.4) {
  const audio = ensureContext();
  if (!audio) return;
  notes.forEach((note, index) => {
    voice(frequencyOf(note.pitch, note.octave), audio.currentTime + index * 0.012, velocity, 1.6);
  });
}

/**
 * Plays pitch classes as an ascending line, bumping the octave whenever the
 * pitch index wraps (so A major runs A3 B3 C♯4 D4 … instead of jumping down).
 */
export function playAscending(pitches: PitchClass[], baseOctave = 3, stepSec = 0.085) {
  const audio = ensureContext();
  if (!audio || !pitches.length) return;
  let octave = baseOctave;
  let previous = -1;
  pitches.forEach((pitch, index) => {
    if (PC_INDEX[pitch] <= previous) octave += 1;
    previous = PC_INDEX[pitch];
    voice(frequencyOf(pitch, octave), audio.currentTime + index * stepSec, 0.34, 1.1);
  });
}

/** Soft rising dyad for a correct answer, rooted on the answered pitch. */
export function playCorrect(pitch?: PitchClass, octave = 4) {
  const audio = ensureContext();
  if (!audio) return;
  const root = pitch ? frequencyOf(pitch, octave) : 523.25;
  voice(root, audio.currentTime, 0.3, 0.9);
  voice(root * Math.pow(2, 4 / 12), audio.currentTime + 0.07, 0.26, 1.1);
}

/** Low felt thud for a wrong answer — muted, never harsh. */
export function playWrong() {
  const audio = ensureContext();
  if (!audio || !master) return;
  const when = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, when);
  osc.frequency.exponentialRampToValueAtTime(82, when + 0.18);
  filter.type = "lowpass";
  filter.frequency.value = 320;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.35, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(when);
  osc.stop(when + 0.35);
}

/** Tiny tick for UI interactions (segment switches, skips). */
export function playTick() {
  const audio = ensureContext();
  if (!audio || !master) return;
  const when = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.value = 1900;
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.08, when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  osc.connect(gain);
  gain.connect(master);
  osc.start(when);
  osc.stop(when + 0.08);
}
