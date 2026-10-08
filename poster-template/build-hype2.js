// build-hype2.js — Round-N hype trailer built from the REAL posters (no AI redraw, so logos/Thai text stay exact).
// 1080x1920, ~19s: intro card -> 6 match posters (Kongfang last) -> summary -> outro card; zoom, blurred backdrop,
// transitions, vignette; self-synthesised drum/riser/impact audio (no licensed music).
//   node build-hype2.js 2     -> assets/img/round-posters/hype-clip-round2.mp4
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const DIR = __dirname, N = Number(process.argv[2] || 2);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FF = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const POST = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const fileUrl = p => 'file:///' + p.split('\\').join('/');
const OUT = path.join(DIR, 'out'); fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));

// ---- intro / outro cards (rendered by Edge so Thai text is real type) ----
const css = `html,body{margin:0;background:#0A1B3D}.p{width:1080px;height:1920px;position:relative;overflow:hidden;background:#0A1B3D;color:#fff;font-family:Kanit,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.c{position:absolute;left:50%;top:60px;width:2000px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95);mix-blend-mode:screen;opacity:.6}
.f{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(10,27,61,.25),rgba(10,27,61,.92) 78%)}
.w{position:relative;z-index:2;padding:0 70px}
.logo{width:300px;height:300px;border-radius:70px;background:#fff;padding:34px;box-sizing:border-box;object-fit:contain;box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 70px rgba(242,184,7,.35)}
.k{font-family:'Saira Condensed';font-weight:700;letter-spacing:.42em;font-size:30px;color:#FFD86A;margin-top:60px}
h1{font-weight:900;font-size:150px;line-height:1.02;margin:18px 0 0;text-shadow:0 10px 40px rgba(0,0,0,.7)}h1 span{color:#FFD86A}
.s{font-weight:600;font-size:46px;color:#E3ECFA;margin-top:36px;line-height:1.35}
.b{display:inline-block;margin-top:50px;font-weight:800;font-size:42px;color:#0A1B3D;background:linear-gradient(90deg,#F2791E,#F2B807);padding:20px 52px;border-radius:999px}`;
const head = '<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;800;900&family=Saira+Condensed:wght@700&display=swap" rel="stylesheet">';
const intro = `${head}<style>${css}</style><div class="p"><img class="c" src="castle-bg.jpg"><div class="f"></div><div class="w"><img class="logo" src="bla-league.png"><div class="k">BURIRAM LEAGUE ACADEMY · 2026</div><h1>นัดที่ <span>${N}</span><br>กำลังมา!</h1><div class="s">เปิดโปรแกรมครบ 6 คู่<br>ฟุตบอลเยาวชนบุรีรัมย์</div></div></div>`;
const outro = `${head}<style>${css}</style><div class="p"><img class="c" src="castle-bg.jpg"><div class="f"></div><div class="w"><img class="logo" src="bla-league.png"><h1 style="font-size:104px;margin-top:50px">มาเชียร์<br>นักเตะตัวน้อย<br><span>กันครับ ⚽</span></h1><div class="s">ติดตามโปรแกรม สถิติ และผลการแข่งขัน<br>ที่เพจ Buriram League Academy</div><div class="b">buriram-league-academy.netlify.app</div></div></div>`;
const bgHtml = `${head}<style>${css}</style><div class="p"><img class="c" src="castle-bg.jpg"><div class="f"></div></div>`;
const cards = {};
for (const [name, html] of [['hype-intro', intro], ['hype-outro', outro], ['hype-bg', bgHtml]]) {
  const hp = path.join(DIR, name + '.html'); fs.writeFileSync(hp, html, 'utf8');
  const png = path.join(OUT, name + '.png');
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1080,1920', '--virtual-time-budget=8000', '--screenshot=' + png, fileUrl(hp)], { stdio: 'ignore' });
  cards[name] = png;
}

// ---- slides ----
const slides = [
  { f: cards['hype-intro'], d: 2.2, full: true },
  ...[1, 2, 3, 4, 5, 6].map(k => ({ f: path.join(POST, `round${N}-match${k}.jpg`), d: 2.4 })),
  { f: path.join(POST, `round${N}-summary.jpg`), d: 3.0 },
  { f: cards['hype-outro'], d: 2.6, full: true }
];
const TD = 0.35, FPS = 30;
const trans = ['fade', 'slideleft', 'circleopen', 'wipeleft', 'slideright', 'zoomin', 'radial', 'fade'];
let inputs = [], g = [], idx = 0;
slides.forEach((s, i) => {
  const frames = Math.round((s.d + TD) * FPS);
  const pi = idx++;
  inputs.push('-loop', '1', '-t', String(s.d + TD), '-i', s.f);
  let bi = -1; if (!s.full) { bi = idx++; inputs.push('-loop', '1', '-t', String(s.d + TD), '-i', cards['hype-bg']); }
  const zoom = `zoompan=z='1+0.09*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=${FPS}`;
  if (s.full) {
    g.push(`[${pi}:v]scale=1080:1920,setsar=1,scale=2160:3840,${zoom}:s=1080x1920,format=yuv420p,fps=30,settb=1/30,setpts=PTS-STARTPTS[v${i}]`);
  } else {
    g.push(`[${bi}:v]scale=1080:1920,setsar=1,format=yuv420p,fps=30,settb=1/30[bg${i}]`);
    g.push(`[${pi}:v]scale=2160:-2,setsar=1,${zoom}:s=1080x1350,format=yuv420p[fg${i}]`);
    g.push(`[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2,format=yuv420p,fps=30,settb=1/30,setpts=PTS-STARTPTS[v${i}]`);
  }
});
let total = slides[0].d; for (let i = 1; i < slides.length; i++) total += slides[i].d - TD;
// offsets above must use running total: rebuild chain with correct offsets
let run = slides[0].d; last = 'v0'; const hits = [0];
for (let i = 1; i < slides.length; i++) {
  const off = +(run - TD).toFixed(3); hits.push(off + TD / 2);
  g.push(`[${last}][v${i}]xfade=transition=${trans[(i - 1) % trans.length]}:duration=${TD}:offset=${off}[x${i}]`);
  last = `x${i}`; run += slides[i].d - TD;
}
g.push(`[${last}]vignette=PI/5,fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.5).toFixed(2)}:d=0.5[vout]`);

// ---- audio: kick @ 126bpm + off-beat hat + riser + impact on every cut ----
const bpm = 126, per = (60 / bpm).toFixed(4);
const kick = `0.85*exp(-9*mod(t,${per}))*sin(2*PI*(52+120*exp(-38*mod(t,${per})))*mod(t,${per}))`;
const hat = `0.10*(2*random(0)-1)*exp(-70*mod(t+${(per / 2).toFixed(4)},${per}))`;
const riser = `0.07*(2*random(1)-1)*pow(t/${total.toFixed(2)},3)`;
const imp = hits.map(h => `if(gt(t,${h.toFixed(3)}),0.8*exp(-7*(t-${h.toFixed(3)}))*sin(2*PI*46*(t-${h.toFixed(3)})),0)`).join('+');
const aexpr = `(${kick}+${hat}+${riser}+${imp})*0.6`;
const wav = path.join(OUT, 'hype2.wav');
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc='${aexpr}':s=44100:d=${total.toFixed(2)}`, '-af', `highpass=f=30,acompressor=threshold=-14dB:ratio=3,alimiter=limit=0.9,afade=t=in:d=0.3,afade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8`, wav]);

const mp4 = path.join(POST, `hype-clip-round${N}.mp4`);
execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-i', wav, '-filter_complex', g.join(';'), '-map', '[vout]', '-map', `${idx}:a`,
  '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', mp4], { stdio: 'inherit' });
console.log('wrote', mp4, total.toFixed(1) + 's');
