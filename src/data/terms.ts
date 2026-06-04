export type PianoTerm = {
  term: string;
  definition: string;
  category: "notation" | "rhythm" | "expression" | "theory";
};

export const PIANO_TERMS: PianoTerm[] = [
  { term: "Staff/stave", definition: "The five-line grid used to write musical notes.", category: "notation" },
  { term: "Treble clef", definition: "The clef commonly used for higher notes and the right hand.", category: "notation" },
  { term: "Bass clef", definition: "The clef commonly used for lower notes and the left hand.", category: "notation" },
  { term: "Ledger line", definition: "A short extra line for notes above or below the staff.", category: "notation" },
  { term: "Bar/measure", definition: "A segment of music divided by bar lines.", category: "notation" },
  { term: "Time signature", definition: "The symbol showing beats per bar and note value per beat.", category: "notation" },
  { term: "Key signature", definition: "Sharps or flats at the start of a staff showing the key.", category: "notation" },
  { term: "Crotchet/quarter note", definition: "A note value usually worth one beat in common time.", category: "rhythm" },
  { term: "Minim/half note", definition: "A note value usually worth two beats in common time.", category: "rhythm" },
  { term: "Semibreve/whole note", definition: "A note value usually worth four beats in common time.", category: "rhythm" },
  { term: "Quaver/eighth note", definition: "A note value usually worth half a beat in common time.", category: "rhythm" },
  { term: "Rest", definition: "A written silence for a specific duration.", category: "rhythm" },
  { term: "Dotted note", definition: "A note extended by half of its original value.", category: "rhythm" },
  { term: "Triplet", definition: "Three notes played in the time normally occupied by two.", category: "rhythm" },
  { term: "Forte", definition: "Play loudly.", category: "expression" },
  { term: "Piano", definition: "Play softly.", category: "expression" },
  { term: "Crescendo", definition: "Gradually get louder.", category: "expression" },
  { term: "Diminuendo", definition: "Gradually get quieter.", category: "expression" },
  { term: "Legato", definition: "Play smoothly and connected.", category: "expression" },
  { term: "Staccato", definition: "Play short and detached.", category: "expression" },
  { term: "Accent", definition: "Emphasise a note.", category: "expression" },
  { term: "Semitone", definition: "The smallest step between adjacent piano keys.", category: "theory" },
  { term: "Tone/whole step", definition: "A distance of two semitones.", category: "theory" },
  { term: "Interval", definition: "The distance between two notes.", category: "theory" },
  { term: "Root", definition: "The note a chord or scale is built from.", category: "theory" },
  { term: "Triad", definition: "A three-note chord built from stacked thirds.", category: "theory" },
  { term: "Inversion", definition: "A chord with a note other than the root in the bass.", category: "theory" },
  { term: "Octave", definition: "The same note name higher or lower, 12 semitones apart.", category: "theory" },
  { term: "Relative minor", definition: "The minor key sharing the same key signature as a major key.", category: "theory" },
  { term: "Dominant", definition: "The fifth scale degree or chord built on it.", category: "theory" },
  { term: "Tonic", definition: "The first scale degree and home note of a key.", category: "theory" },
];
