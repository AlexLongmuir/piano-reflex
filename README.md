# Piano Reflex
Out of fear of my piano teacher, I built this website (https://piano-reflex.vercel.app/) to help practice reading, theory & vocabulary whilst on to go. 

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4 (design tokens via `@theme`)
- VexFlow for staff notation rendering
- Web Audio (synthesized — no samples) for key tones and feedback cues
- Self-hosted Fraunces + Instrument Sans via Fontsource
- Local browser storage for progress and weak areas
- Vercel-friendly static/client-first architecture

No Supabase, no backend, no auth, and no Web MIDI.

The design language is built from the instrument itself — ebony, ivory, brass, and the red felt strip — with a geometrically accurate piano, synthesized Web Audio key sounds, a WebGL ambient backdrop, and spring-based motion throughout. See [docs/DESIGN.md](docs/DESIGN.md) for the full system.

## Main Features

- Dashboard with Today's Progress, headline performance metrics, module cards, and weak areas.
- Keyboard Notes:
  - highlighted key to note-name answer
  - note-name prompt to actual piano key click
  - white keys, black keys, and mixed mode
- Staff Notes:
  - single-note treble and bass clef recognition
  - VexFlow-rendered staff
- Chords:
  - build major/minor triads on the piano UI
  - name highlighted major/minor triads
- Scales:
  - build major, natural minor, harmonic minor, and melodic minor scales
  - includes C# harmonic minor and C# melodic minor examples
- Circle of Fifths:
  - fifth above/below
  - key signatures
  - relative major/minor
- Piano Terms:
  - term to definition and definition to term quizzes
  - notation, rhythm, expression, and theory categories
- Local progress persistence:
  - attempts, accuracy, response time, best streak
  - daily progress
  - weak-area tags from missed or slow answers

## Future Roadmap

- Add inversions, diminished/augmented triads, and seventh chords.
- Expand staff notation beyond single notes.
- Add configurable drill lengths and review sessions.
- Add stricter enharmonic spelling for key-aware theory drills.
- Improve the circle of fifths visual into a fully interactive study surface.
- Add optional metronome/counting drills without making audio mandatory.
