// synth-hype.js — cinematic sports-trailer track synthesised in pure JS (no samples, no licensed music):
// A-minor epic progression (Am-F-C-G), swelling detuned-saw string pad, plucked arpeggio, sub bass,
// kick/snare/hats that enter in stages, taiko-style impacts + riser on every cut, snare roll before the end,
// Schroeder reverb, light crowd ambience.  render(total, hits, wavPath)
const fs = require('fs');
const SR = 44100, TAU = Math.PI * 2;
const hz = n => 440 * Math.pow(2, (n - 69) / 12);          // MIDI note -> Hz
const CH = [                                                // [bass, triad...] MIDI
  { b: 45, n: [57, 60, 64] },   // Am
  { b: 41, n: [53, 57, 60] },   // F
  { b: 48, n: [55, 60, 64] },   // C
  { b: 43, n: [55, 59, 62] }    // G
];
function render(total, hits, wavPath, bpm = 128) {
  const N = Math.ceil(total * SR);
  const dL = new Float32Array(N), dR = new Float32Array(N), sd = new Float32Array(N);   // dry L/R, reverb send (mono)
  const beat = 60 / bpm, bar = beat * 4;
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 * 2 - 1;
  const add = (i, l, r, s) => { if (i >= 0 && i < N) { dL[i] += l; dR[i] += r; sd[i] += s; } };
  const prog = t => Math.min(1, t / total);

  // ---- pad (detuned saws, filter + volume swell) ----
  for (let t0 = 0, c = 0; t0 < total; t0 += bar, c++) {
    const ch = CH[c % 4];
    for (const note of ch.n.concat([ch.n[0] + 12])) {
      for (const det of [-0.006, 0.0, 0.006]) {
        const f = hz(note) * (1 + det); let ph = Math.random(), lp = 0;
        const i0 = Math.floor(t0 * SR), len = Math.floor((bar + 0.6) * SR);
        for (let k = 0; k < len; k++) {
          const t = t0 + k / SR, i = i0 + k; if (i >= N) break;
          ph += f / SR; if (ph >= 1) ph -= 1;
          const saw = ph * 2 - 1;
          const fc = 500 + 3200 * Math.pow(prog(t), 1.4);
          lp += (1 - Math.exp(-TAU * fc / SR)) * (saw - lp);
          const env = Math.min(1, k / (0.35 * SR)) * Math.min(1, (len - k) / (0.5 * SR));
          const g = 0.020 * (0.35 + 0.9 * Math.pow(prog(t), 0.8)) * env;
          const pan = det * 40;           // slight stereo spread
          add(i, lp * g * (0.7 - pan), lp * g * (0.7 + pan), lp * g * 0.5);
        }
      }
    }
  }
  // ---- arpeggio pluck (8ths) from 1.2 s ----
  const pat = [0, 1, 2, 1, 2, 1, 0, 1];
  for (let t = 1.2, s = 0; t < total - 0.8; t += beat / 2, s++) {
    const ch = CH[Math.floor(t / bar) % 4], note = ch.n[pat[s % 8] % 3] + 12;
    const f = hz(note), i0 = Math.floor(t * SR), len = Math.floor(0.4 * SR); let ph = 0, lp = 0;
    for (let k = 0; k < len; k++) {
      const i = i0 + k; if (i >= N) break;
      ph += f / SR; if (ph >= 1) ph -= 1;
      const x = ph * 2 - 1, e = Math.exp(-k / (0.11 * SR));
      lp += (1 - Math.exp(-TAU * (700 + 3800 * e) / SR)) * (x - lp);
      const g = 0.075 * e * (0.5 + 0.7 * prog(t));
      const p = ((s % 2) ? 0.3 : -0.3);
      add(i, lp * g * (0.7 - p * 0.5), lp * g * (0.7 + p * 0.5), lp * g * 0.45);
    }
  }
  // ---- sub bass on beats (from 1.9 s) ----
  for (let t = 1.9; t < total - 0.5; t += beat / 2) {
    const ch = CH[Math.floor(t / bar) % 4], f = hz(ch.b), i0 = Math.floor(t * SR), len = Math.floor(0.25 * SR);
    for (let k = 0; k < len; k++) {
      const i = i0 + k; if (i >= N) break;
      const x = Math.sin(TAU * f * k / SR) + 0.35 * Math.sin(TAU * 2 * f * k / SR), e = Math.exp(-k / (0.14 * SR));
      add(i, x * 0.16 * e, x * 0.16 * e, 0);
    }
  }
  // ---- drums ----
  const kick = t => { const i0 = Math.floor(t * SR), len = Math.floor(0.4 * SR); let ph = 0;
    for (let k = 0; k < len; k++) { const i = i0 + k; if (i >= N) break; const tt = k / SR;
      ph += (46 + 130 * Math.exp(-38 * tt)) / SR; const x = Math.sin(TAU * ph) * Math.exp(-7 * tt) + (k < 60 ? rnd() * 0.3 : 0);
      add(i, x * 0.62, x * 0.62, 0); } };
  const snare = (t, g = 1) => { const i0 = Math.floor(t * SR), len = Math.floor(0.35 * SR); let lp = 0;
    for (let k = 0; k < len; k++) { const i = i0 + k; if (i >= N) break; const tt = k / SR;
      const n = rnd(); lp += 0.55 * (n - lp); const x = (n - lp) * Math.exp(-16 * tt) * 0.55 + Math.sin(TAU * 185 * tt) * Math.exp(-26 * tt) * 0.35;
      add(i, x * 0.5 * g, x * 0.5 * g, x * 0.45 * g); } };
  const hat = (t, g = 1) => { const i0 = Math.floor(t * SR), len = Math.floor(0.08 * SR); let pv = 0;
    for (let k = 0; k < len; k++) { const i = i0 + k; if (i >= N) break; const n = rnd(); const x = (n - pv) * Math.exp(-k / (0.014 * SR)); pv = n;
      add(i, x * 0.07 * g, x * 0.07 * g, x * 0.01 * g); } };
  const impact = t => { const i0 = Math.floor(t * SR), len = Math.floor(1.6 * SR); let ph = 0, lp = 0;
    for (let k = 0; k < len; k++) { const i = i0 + k; if (i >= N) break; const tt = k / SR;
      ph += (36 + 70 * Math.exp(-6 * tt)) / SR; const boom = Math.sin(TAU * ph) * Math.exp(-3.2 * tt);
      const n = rnd(); lp += 0.08 * (n - lp); const crash = lp * Math.exp(-4.5 * tt) * 0.9;
      const x = boom * 0.55 + crash * 0.5; add(i, x, x, x * 0.7); } };
  const riser = (tEnd, d = 0.45) => { const i0 = Math.floor((tEnd - d) * SR), len = Math.floor(d * SR); let pv = 0;
    for (let k = 0; k < len; k++) { const i = i0 + k; if (i < 0 || i >= N) continue; const a = k / len; const n = rnd(); const x = (n - pv) * a * a * 0.26; pv = n * 0.6; add(i, x, x, x * 0.6); } };
  for (let t = 1.9; t < total - 0.6; t += beat) kick(t);
  for (let t = 2.6 + beat; t < total - 0.9; t += beat * 2) snare(t);        // 2 & 4 once the posters start
  for (let t = 2.6; t < total - 0.9; t += beat / 2) hat(t + beat / 4, 0.8);
  // snare roll into the closing card
  const rollStart = total - 3.2; for (let t = rollStart, d = beat / 2; t < total - 0.8 && d > 0.03; t += d, d *= 0.86) snare(t, 0.5 + 0.7 * Math.min(1, (t - rollStart) / 1.6));
  for (const h of hits) { riser(h); impact(h); }
  // ---- crowd ambience (band-limited noise swell) ----
  { let lp1 = 0, lp2 = 0; for (let i = 0; i < N; i++) { const t = i / SR, n = rnd(); lp1 += 0.12 * (n - lp1); lp2 += 0.012 * (lp1 - lp2);
      const x = (lp1 - lp2) * 0.9 * (0.25 + 0.75 * Math.pow(prog(t), 1.2)) * 0.14; add(i, x, x * 0.9, x * 0.4); } }

  // ---- Schroeder reverb on send ----
  const comb = (src, d, g) => { const o = new Float32Array(N), buf = new Float32Array(d); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; lp += 0.35 * (y - lp); buf[p] = src[i] + lp * g; o[i] = y; p = (p + 1) % d; } return o; };
  const ap = (src, d, g) => { const o = new Float32Array(N), buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const b = buf[p], y = -g * src[i] + b; buf[p] = src[i] + g * y; o[i] = y; p = (p + 1) % d; } return o; };
  let rv = new Float32Array(N); for (const [d, g] of [[1687, 0.84], [1601, 0.83], [2053, 0.82], [2251, 0.81]]) { const c = comb(sd, d, g); for (let i = 0; i < N; i++) rv[i] += c[i] * 0.25; }
  rv = ap(ap(rv, 556, 0.5), 441, 0.5);

  // ---- master ----
  const out = Buffer.alloc(44 + N * 4); let peak = 0;
  const mL = new Float32Array(N), mR = new Float32Array(N);
  for (let i = 0; i < N; i++) { mL[i] = dL[i] + rv[i] * 0.55; mR[i] = dR[i] + rv[(i + 211) % N] * 0.55; peak = Math.max(peak, Math.abs(mL[i]), Math.abs(mR[i])); }
  const gain = 0.82 / Math.max(peak, 1e-6);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    const t = i / SR, f = Math.min(1, t / 0.4) * Math.min(1, (total - t) / 0.9);
    const l = Math.tanh(mL[i] * gain * 1.25) * f * 0.92, r = Math.tanh(mR[i] * gain * 1.25) * f * 0.92;
    out.writeInt16LE(Math.round(l * 32767), 44 + i * 4); out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  fs.writeFileSync(wavPath, out);
}
module.exports = { render };
