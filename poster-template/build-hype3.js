// build-hype3.js — Round-N hype trailer: Gemini-made TEXT-FREE background plates (bgclips/*.mp4) + the REAL posters
// composited on top (so logos / Thai text / dates are always exact) + synthesised drum audio.
//   node build-hype3.js 2    -> assets/img/round-posters/hype-clip-round2-v3.mp4  (1080x1920, ~21s)
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const DIR = __dirname, N = Number(process.argv[2] || 2);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FF = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const POST = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const BG = { lights: path.join(DIR, 'bgclips', 'stadium-lights.mp4'), ball: path.join(DIR, 'bgclips', 'ball-grass.mp4'), temple: path.join(DIR, 'bgclips', 'temple-gold.mp4') };
const fileUrl = p => 'file:///' + p.split('\\').join('/');
const OUT = path.join(DIR, 'out'); fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));

// ---- transparent text cards (Edge renders real Thai type) ----
const head = '<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;800;900&family=Saira+Condensed:wght@700&display=swap" rel="stylesheet">';
const css = `html,body{margin:0;background:transparent}.p{width:1080px;height:1920px;position:relative;color:#fff;font-family:Kanit,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.f{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,rgba(6,16,40,.78),rgba(6,16,40,.25) 70%)}
.w{position:relative;z-index:2;padding:0 70px}
.logo{width:300px;height:300px;border-radius:70px;background:#fff;padding:34px;box-sizing:border-box;object-fit:contain;box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 70px rgba(242,184,7,.4)}
.k{font-family:'Saira Condensed';font-weight:700;letter-spacing:.42em;font-size:30px;color:#FFD86A;margin-top:60px}
h1{font-weight:900;font-size:150px;line-height:1.02;margin:18px 0 0;text-shadow:0 10px 40px rgba(0,0,0,.8)}h1 span{color:#FFD86A}
.s{font-weight:600;font-size:46px;color:#E3ECFA;margin-top:36px;line-height:1.35;text-shadow:0 4px 20px rgba(0,0,0,.8)}
.b{display:inline-block;margin-top:50px;font-weight:800;font-size:42px;color:#0A1B3D;background:linear-gradient(90deg,#F2791E,#F2B807);padding:20px 52px;border-radius:999px}`;
const intro = `${head}<style>${css}</style><div class="p"><div class="f"></div><div class="w"><img class="logo" src="bla-league.png"><div class="k">BURIRAM LEAGUE ACADEMY · 2026</div><h1>นัดที่ <span>${N}</span><br>กำลังมา!</h1><div class="s">เปิดโปรแกรมครบ 6 คู่<br>ฟุตบอลเยาวชนบุรีรัมย์</div></div></div>`;
const outro = `${head}<style>${css}</style><div class="p"><div class="f"></div><div class="w"><img class="logo" src="bla-league.png"><h1 style="font-size:104px;margin-top:50px">มาเชียร์<br>นักเตะตัวน้อย<br><span>กันครับ ⚽</span></h1><div class="s">ติดตามโปรแกรม สถิติ และผลการแข่งขัน<br>ที่เพจ Buriram League Academy</div><div class="b">buriram-league-academy.netlify.app</div></div></div>`;
const cards = {};
for (const [name, html] of [['h3-intro', intro], ['h3-outro', outro]]) {
  const hp = path.join(DIR, name + '.html'); fs.writeFileSync(hp, html, 'utf8');
  const png = path.join(OUT, name + '.png');
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', '--force-device-scale-factor=1', '--window-size=1080,1920', '--virtual-time-budget=8000', '--screenshot=' + png, fileUrl(hp)], { stdio: 'ignore' });
  cards[name] = png;
}

// ---- slide plan ----
const slides = [
  { bg: 'temple', ss: 0.0, d: 2.6, card: cards['h3-intro'] },
  ...[1, 2, 3].map(k => ({ bg: 'lights', ss: 0.5 + k * 1.2, d: 2.4, poster: path.join(POST, `round${N}-match${k}.jpg`) })),
  ...[4, 5, 6].map(k => ({ bg: 'ball', ss: (k - 4) * 2.2, d: 2.4, poster: path.join(POST, `round${N}-match${k}.jpg`) })),
  { bg: 'temple', ss: 3.4, d: 3.0, poster: path.join(POST, `round${N}-summary.jpg`) },
  { bg: 'lights', ss: 1.0, d: 2.8, card: cards['h3-outro'] }
];
const TD = 0.35, FPS = 30;
const trans = ['fade', 'slideleft', 'circleopen', 'wipeleft', 'slideright', 'zoomin', 'radial', 'fade'];
const inputs = [], g = []; let idx = 0;
slides.forEach((s, i) => {
  const dur = s.d + TD, frames = Math.round(dur * FPS);
  const bi = idx++; inputs.push('-ss', String(s.ss), '-t', String(dur), '-i', BG[s.bg]);
  g.push(`[${bi}:v]scale=-2:1920,crop=1080:1920,fps=${FPS},setsar=1,eq=brightness=-0.04:saturation=1.1,format=yuv420p[bg${i}]`);
  if (s.poster) {
    const pi = idx++; inputs.push('-loop', '1', '-t', String(dur), '-i', s.poster);
    const pw = 960, ph = s.poster.includes('summary') ? 1067 : 1200;
    g.push(`[${pi}:v]scale=2160:-2,setsar=1,zoompan=z='1+0.08*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${pw}x${ph}:fps=${FPS},format=rgba,fade=t=in:st=0:d=0.25:alpha=1[fg${i}]`);
    g.push(`[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2+10:format=auto,format=yuv420p,fps=${FPS},settb=1/${FPS},setpts=PTS-STARTPTS[v${i}]`);
  } else {
    const ci = idx++; inputs.push('-loop', '1', '-t', String(dur), '-i', s.card);
    g.push(`[${ci}:v]format=rgba,scale=2160:3840,zoompan=z='1+0.06*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS},format=rgba[fg${i}]`);
    g.push(`[bg${i}][fg${i}]overlay=0:0:format=auto,format=yuv420p,fps=${FPS},settb=1/${FPS},setpts=PTS-STARTPTS[v${i}]`);
  }
});
let total = slides[0].d; for (let i = 1; i < slides.length; i++) total += slides[i].d - TD;
let run = slides[0].d, last = 'v0'; const hits = [0];
for (let i = 1; i < slides.length; i++) {
  const off = +(run - TD).toFixed(3); hits.push(off + TD / 2);
  g.push(`[${last}][v${i}]xfade=transition=${trans[(i - 1) % trans.length]}:duration=${TD}:offset=${off}[x${i}]`);
  last = `x${i}`; run += slides[i].d - TD;
}
g.push(`[${last}]vignette=PI/6,fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.5).toFixed(2)}:d=0.5[vout]`);

// ---- audio ----
const bpm = 126, per = (60 / bpm).toFixed(4);
const kick = `0.85*exp(-9*mod(t,${per}))*sin(2*PI*(52+120*exp(-38*mod(t,${per})))*mod(t,${per}))`;
const hat = `0.10*(2*random(0)-1)*exp(-70*mod(t+${(per / 2).toFixed(4)},${per}))`;
const riser = `0.07*(2*random(1)-1)*pow(t/${total.toFixed(2)},3)`;
const imp = hits.map(h => `if(gt(t,${h.toFixed(3)}),0.8*exp(-7*(t-${h.toFixed(3)}))*sin(2*PI*46*(t-${h.toFixed(3)})),0)`).join('+');
const wav = path.join(OUT, 'hype3.wav');
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc='(${kick}+${hat}+${riser}+${imp})*0.6':s=44100:d=${total.toFixed(2)}`, '-af', `highpass=f=30,acompressor=threshold=-14dB:ratio=3,alimiter=limit=0.9,afade=t=in:d=0.3,afade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8`, wav]);

const mp4 = path.join(POST, `hype-clip-round${N}-v3.mp4`);
execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-i', wav, '-filter_complex', g.join(';'), '-map', '[vout]', '-map', `${idx}:a`,
  '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', mp4], { stdio: 'inherit' });
console.log('wrote', mp4, total.toFixed(1) + 's');
