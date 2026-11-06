// Run with: node prototype/test-pitch.js
// Synthesizes test tones and checks that detectPitch() names them correctly.
const P = require('./pitch.js');

const SR = 48000;
let failures = 0;

function tone(freq, n, { harmonics = [1], noise = 0, seed = 1 } = {}) {
  const buf = new Float32Array(n);
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < n; i++) {
    let v = 0;
    harmonics.forEach((amp, h) => (v += amp * Math.sin((2 * Math.PI * freq * (h + 1) * i) / SR)));
    buf[i] = 0.3 * v + noise * rand();
  }
  return buf;
}

function check(label, buf, expectMidi, opts = { minFreq: 170, maxFreq: 3600 }, expectCents = 0) {
  const p = P.detectPitch(buf, SR, opts);
  const note = p ? P.freqToNote(p.freq) : null;
  const ok = expectMidi === null ? !p || p.clarity < 0.9 : note && note.midi === expectMidi && Math.abs(note.cents - expectCents) <= 3;
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42)} ` +
      (p ? `${p.freq.toFixed(2).padStart(8)} Hz  ${note.name.padEnd(4)} ${String(note.cents).padStart(3)}¢  clarity ${p.clarity.toFixed(3)}` : 'no pitch')
  );
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// Bowed-string-like spectrum: strong upper harmonics, sometimes stronger than the fundamental.
const violinish = [1, 0.8, 0.6, 0.5, 0.35, 0.3, 0.2, 0.15];
const weakFundamental = [0.3, 1, 0.7, 0.5, 0.3];

for (const n of [1024, 2048, 4096]) {
  check(`G3 open string, sine, window ${n}`, tone(hz(55), n), 55);
  check(`G3 open string, violin-like, window ${n}`, tone(hz(55), n, { harmonics: violinish }), 55);
  check(`D4, weak fundamental, window ${n}`, tone(hz(62), n, { harmonics: weakFundamental }), 62);
  check(`A4 violin-like + noise, window ${n}`, tone(hz(69), n, { harmonics: violinish, noise: 0.05 }), 69);
  check(`E5 open string, window ${n}`, tone(hz(76), n, { harmonics: violinish }), 76);
  check(`E7 high position, sine, window ${n}`, tone(hz(100), n), 100);
}
check('A4 +20 cents', tone(440 * Math.pow(2, 20 / 1200), 2048, { harmonics: violinish }), 69, undefined, 20);
check('Cello C2 at window 4096 (cello preset)', tone(hz(36), 4096, { harmonics: violinish }), 36, { minFreq: 58, maxFreq: 1400 });
check('White noise should give no confident pitch', tone(0, 2048, { harmonics: [0], noise: 0.5 }), null);

const cents = P.freqToNote(440 * Math.pow(2, 20 / 1200)).cents;
if (cents !== 20) failures++;
console.log(`${cents === 20 ? 'PASS' : 'FAIL'}  freqToNote reports +20 cents (got ${cents})`);

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
