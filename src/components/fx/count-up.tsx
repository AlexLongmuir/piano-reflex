"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  format?: (value: number) => string;
  durationMs?: number;
};

/** Animates a number toward `value` with an ease-out curve. */
export function CountUp({ value, format = (v) => String(Math.round(v)), durationMs = 750 }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const duration = reduced ? 0 : durationMs;
    const start = performance.now();
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, durationMs]);

  return <span className="tnum">{format(display)}</span>;
}
