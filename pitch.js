// Pitch detection and note helpers for the Violin Pitch Lab.
//
// detectPitch() implements the McLeod Pitch Method (McLeod & Wyvill, "A Smarter Way
// to Find Pitch", ICMC 2005): a normalized square difference function (NSDF), then
// "key maxima" peak picking and parabolic interpolation. It is written without any
// browser APIs so it can be unit-tested in Node and ported directly to Swift.
(function (root) {
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  // Pitch class -> [letter index (C=0 … B=6), sharp?]. Sharps only for the prototype;
  // the game will spell notes from the key signature.
  const SPELLING = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];

  function detectPitch(buf, sampleRate, opts) {
    const minFreq = opts.minFreq;
    const maxFreq = opts.maxFreq;
    const k = opts.k ?? 0.9; // pick the first key maximum within 90% of the highest one
    const n = buf.length;
    const maxLag = Math.min(Math.floor(sampleRate / minFreq), Math.floor(n / 2));
    const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));

    // NSDF: n'(tau) = 2 * r(tau) / m(tau), in [-1, 1]; 1 means a perfect repeat at lag tau.
    const nsdf = new Float32Array(maxLag + 2);
    for (let tau = 0; tau <= maxLag + 1; tau++) {
      let acf = 0;
      let m = 0;
      for (let j = 0, end = n - tau; j < end; j++) {
        const a = buf[j];
        const b = buf[j + tau];
        acf += a * b;
        m += a * a + b * b;
      }
      nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
    }

    // Key maxima: the highest point of each positive lobe after the first zero crossing.
    const peaks = [];
    let tau = 1;
    while (tau <= maxLag && nsdf[tau] > 0) tau++;
    while (tau <= maxLag) {
      while (tau <= maxLag && nsdf[tau] <= 0) tau++;
      let best = -1;
      while (tau <= maxLag && nsdf[tau] > 0) {
        if (best < 0 || nsdf[tau] > nsdf[best]) best = tau;
        tau++;
      }
      // Must be a true local maximum (a lobe cut off at maxLag may still be rising).
      if (best >= minLag && nsdf[best] >= nsdf[best + 1]) peaks.push(best);
    }
    if (!peaks.length) return null;

    let highest = 0;
    for (const p of peaks) highest = Math.max(highest, nsdf[p]);
    const pick = peaks.find((p) => nsdf[p] >= k * highest);

    // Parabolic interpolation through the peak and its neighbours.
    const a = nsdf[pick - 1];
    const b = nsdf[pick];
    const c = nsdf[pick + 1];
    const denom = a - 2 * b + c;
    const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
    const period = pick + shift;
    const clarity = Math.min(1, b - 0.25 * (a - c) * shift);
    return { freq: sampleRate / period, clarity };
  }

  // Spectral flux in dB: average rise across bins since the previous frame. Spikes when a
  // note starts, even while another note is still ringing.
  function spectralFlux(prevDb, curDb, lo, hi) {
    let sum = 0;
    for (let i = lo; i < hi; i++) {
      const d = curDb[i] - prevDb[i];
      if (d > 0) sum += d;
    }
    return sum / Math.max(1, hi - lo);
  }

  // Which note's harmonic series best explains a magnitude spectrum. Used on the energy
  // that appeared since a note onset, so a note still ringing from before is subtracted out.
  function harmonicNote(mag, sampleRate, fftSize, opts) {
    const binHz = sampleRate / fftSize;
    const a4 = opts.a4 ?? 440;
    const maxHz = opts.maxHz ?? 5000;
    let best = null;
    for (let midi = opts.minMidi; midi <= opts.maxMidi; midi++) {
      const f0 = a4 * Math.pow(2, (midi - 69) / 12);
      // A real new note has energy at its fundamental or first overtone.
      const at = (f) => { const i = Math.floor(f / binHz); return i + 1 < mag.length ? Math.max(mag[i], mag[i + 1]) : 0; };
      if (at(f0) <= 0 && at(2 * f0) <= 0) continue;
      let score = 0;
      for (let h = 1; h * f0 < maxHz; h++) {
        const i = Math.floor((h * f0) / binHz);
        if (i + 1 >= mag.length) break;
        score += Math.max(mag[i], mag[i + 1]) / Math.sqrt(h);
      }
      if (!best || score > best.score) best = { midi, score };
    }
    return best && best.score > 0 ? best : null;
  }

  function rms(buf) {
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  function toDb(level) {
    return 20 * Math.log10(Math.max(level, 1e-9));
  }

  function freqToNote(freq, a4 = 440) {
    const midiFloat = 69 + 12 * Math.log2(freq / a4);
    const midi = Math.round(midiFloat);
    return {
      midi,
      midiFloat,
      cents: Math.round((midiFloat - midi) * 100),
      name: noteName(midi),
    };
  }

  function noteName(midi) {
    return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
  }

  // Diatonic staff step (C4 = 28, D4 = 29, …) and whether a sharp is needed.
  function spell(midi) {
    const [letter, sharp] = SPELLING[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return { step: octave * 7 + letter, sharp: !!sharp };
  }

  const api = { detectPitch, spectralFlux, harmonicNote, rms, toDb, freqToNote, noteName, spell };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PitchLab = api;
})(typeof window !== 'undefined' ? window : globalThis);
