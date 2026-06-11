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
    renderer.resize(340, 140);
    const context = renderer.getContext();
    context.setFillStyle("#f2eee3");
    context.setStrokeStyle("#f2eee3");

    const stave = new Stave(10, 22, 320);
    stave.addClef(clef);
    stave.setStyle({ strokeStyle: "rgba(242,238,227,0.55)" });
    stave.setContext(context).draw();

    const note = new StaveNote({ clef, keys: [noteKey], duration: "q" });
    const voice = new Voice({ numBeats: 1, beatValue: 4 }).addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 200);
    voice.draw(context, stave);

    const svg = ref.current.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", "0 0 340 140");
      svg.setAttribute("width", "100%");
      svg.removeAttribute("height");
      svg.style.maxWidth = "340px";
    }
  }, [clef, noteKey]);

  return (
    <div className="flex min-h-36 items-center justify-center rounded-2xl border border-ivory/6 bg-ink/50 px-4 py-5">
      <div ref={ref} className="flex w-full justify-center" />
    </div>
  );
}
