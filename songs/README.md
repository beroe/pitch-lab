# Songs

Songs live in this folder: a MusicXML file per song and instrument, listed in `songs.json` (title,
file, default tempo, instrument, source), in the order they appear in the menu. There are two ways to make
the MusicXML file.

- **From Dorico** (or MuseScore): export the song as uncompressed MusicXML (`.musicxml` or `.xml`).
- **Typed as text**, one bar per line, in `src/<song>.txt`, then converted with the
  `melody-musicxml` skill's `text2xml.py` (Claude runs it; the typed files stay in `songs/src/` for corrections).

**The text format**

| Write | Means |
|---|---|
| `w` `h` `q` `e` `s` | whole, half, quarter, eighth, sixteenth note |
| `.` after the value (`q.`, `h.`) | dotted |
| `3` after the value (`e3`) | triplet (three `e3` notes fill one beat) |
| `~` at the end (`q~`) | tied to the next note |
| `r` instead of a pitch (`r:q`) | rest |

- Each note is `PITCH:VALUE`, e.g. `C#5:e` (an eighth-note C sharp) or `A4:h.` (a dotted half on A).
- Pitches are a letter and an octave number, with C4 = middle C. On the violin, `G3` is the open G string,
  `D4` the D, `A4` the A and `E5` the E. Add `#` or `b` for sharp or flat (`F#5`, `Bb4`). Write the sharp even
  when the key signature has it: the file spells the exact pitch, and the game decides which accidentals to show.
- Repeats: start a bar with `|:` and end one with `:|`; 1st and 2nd endings are marked `[1` … `1]` and `[2` … `2]`.
- Header lines: `title:`, `key:` (number of sharps, or a negative number for flats; A major = `3`),
  `time: 3/4`, `tempo: 80` (quarter notes per minute) and `clef: treble` or `bass`.
- A `#` with a space before it starts a comment (so `C#5` is a note, not a comment).

Example, the first two bars of May Song:

```text
title: May Song
key: 3
time: 4/4
tempo: 80
clef: treble
A4:q. C#5:e E5:q A5:q
F#5:q A5:e F#5:e E5:h
```

The converter checks that every bar adds up to the time signature and lists any that don't (a short first
bar is fine: it's a pickup). **Cello versions** are made from the same file, an octave and a fifth lower so the
same strings are used (`--transpose=-P12 --clef bass`). Public-domain LilyPond scores (e.g. from the Mutopia
Project) can be converted with the skill's `ly2xml.py`.

