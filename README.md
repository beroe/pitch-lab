# Violin Pitch Lab

A browser prototype that listens to the microphone and shows which note is being played, how in tune it
is, and when it started. It is the audio test bed for a violin sight-reading practice game for iPad.

- `game.html`: the game prototype (scrolling staff, scales/arpeggios/note reading, wait or tempo mode, lenient scoring, auto-play demo)
- `pitch-lab.html`: the test page (tuner, staff, timing test, note log with CSV download, synthetic demo)
- `pitch.js`: pitch detection (McLeod Pitch Method; McLeod & Wyvill, ICMC 2005), note-start detection
  and note helpers, with no dependencies
- `test-pitch.js`: unit tests, run with `node test-pitch.js`
- `songs/`: the songs (MusicXML), the menu list `songs.json`, and typed sources; see `songs/README.md` for how to add one

The microphone only works over `https://` or on `http://localhost`. To run locally:
`python3 -m http.server 8000`, then open `http://localhost:8000/pitch-lab.html`.

Music notation in the game uses the [Bravura](https://github.com/steinbergmedia/bravura) font by Steinberg Media Technologies, licensed under the SIL Open Font License 1.1 (see `Bravura-OFL.txt`).
