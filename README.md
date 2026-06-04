# Piano Reflex

Piano Reflex is a focused piano theory reaction trainer built for adult beginner practice. It helps with keyboard note recognition, staff notation, major/minor triads, common scale patterns, circle of fifths relationships, and essential piano/music vocabulary.

The product direction is deliberately restrained: dark studio/trainer aesthetic, custom piano keyboard UI, fast feedback, local progress, and no backend complexity.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- VexFlow for staff notation rendering
- Local browser storage for progress and weak areas
- Vercel-friendly static/client-first architecture

No Supabase, no backend, no auth, no Web MIDI, and no audio playback.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production checks:

```bash
npm run typecheck
npm run build
```

## Main Features

- Dashboard with Today&apos;s Progress, headline performance metrics, module cards, and weak areas.
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
