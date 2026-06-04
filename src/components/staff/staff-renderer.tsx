"use client";

import { useEffect, useRef } from "react";
import { Formatter, Renderer, Stave, StaveNote, Voice } from "vexflow";

type Props = {
  clef: "treble" | "bass";
  noteKey: string;
};

export function StaffRenderer({ clef, noteKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const renderer = new Renderer(ref.current, Renderer.Backends.SVG);
    renderer.resize(360, 150);
    const context = renderer.getContext();
    context.setFillStyle("#f4efe5");
    context.setStrokeStyle("#f4efe5");

    const stave = new Stave(18, 28, 320);
    stave.addClef(clef).addTimeSignature("4/4");
    stave.setContext(context).draw();

    const note = new StaveNote({ clef, keys: [noteKey], duration: "q" });
    const voice = new Voice({ numBeats: 1, beatValue: 4 }).addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 180);
    voice.draw(context, stave);
  }, [clef, noteKey]);

  return <div ref={ref} className="flex min-h-36 items-center justify-center rounded-md bg-stone-950/70" />;
}
