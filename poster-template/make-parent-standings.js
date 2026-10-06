// make-parent-standings.js — standings poster for the PARENTS division (รุ่นผู้ปกครอง), same style as make-standings.js.
// Rule (user, 2026-10-06): a match with no parent-division result reported counts as a 1-1 draw.
//   node make-parent-standings.js results-round1.json [round]   -> assets/img/round-posters/parent-standings-roundN.jpg
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const OUT_IMG = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fileUrl = p => 'file:///' + p.split('\\').join('/');

const R = JSON.parse(fs.readFileSync(path.resolve(DIR, process.argv[2] || 'results-round1.json'), 'utf8'));
const upTo = Number(process.argv[3] || 1);
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const BLA = ctx.window.BLA;
const posters = JSON.parse(fs.readFileSync(path.join(DIR, 'posters.json'), 'utf8'));

fs.mkdirSync(path.join(DIR, 'teams'), { recursive: true });
for (const f of fs.readdirSync(path.join(DIR, '..', 'assets', 'img', 'teams'))) {
  const src = path.join(DIR, '..', 'assets', 'img', 'teams', f);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(DIR, 'teams', f));
}
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));

const has = s => s && s.h !== '' && s.a !== '' && s.h != null && s.a != null;
const S = {};
BLA.teams.forEach(t => S[t.name] = { slug: t.slug, name: t.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, def: 0 });
let defaults = 0;
BLA.schedule.filter(r => r.round <= upTo).forEach(r => r.matches.forEach(m => {
  const H = S[m.home], A = S[m.away];
  if (!H || !A) return;
  let s = (R[r.round + '|' + m.home + '|' + m.away] || {}).P;
  let h, a;
  if (has(s)) { h = +s.h; a = +s.a; } else { h = 1; a = 1; H.def++; A.def++; defaults++; }   // not reported -> 1-1
  H.p++; A.p++; H.gf += h; H.ga += a; A.gf += a; A.ga += h;
  if (h > a) { H.w++; H.pts += 3; A.l++; } else if (h < a) { A.w++; A.pts += 3; H.l++; } else { H.d++; A.d++; H.pts++; A.pts++; }
}));
const rows = Object.values(S).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
  .map((s, i) => {
    const gd = s.gf - s.ga;
    const nm = (posters.teams[s.slug] || {}).th || s.name;
    return `<tr class="r${i + 1} z${i % 2}"><td class="rk"><b>${i + 1}</b></td>
      <td class="tm"><span class="lg"><img src="teams/${s.slug}.png"></span><span class="nm">${esc(nm)}${s.def ? ' <em>*</em>' : ''}</span></td>
      <td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td>${s.gf}</td><td>${s.ga}</td><td>${gd > 0 ? '+' : ''}${gd}</td><td class="pt">${s.pts}</td></tr>`;
  }).join('');

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700;800;900&family=Sarabun:wght@400;500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1340px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;padding:48px 52px 34px;color:#EAF1FB;font-family:'Sarabun',sans-serif}
.castle{position:absolute;left:50%;top:-40px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.5;z-index:0}
.fade1{position:absolute;left:0;right:0;top:0;height:640px;background:linear-gradient(180deg,rgba(7,20,49,.4) 0%,rgba(7,20,49,.6) 35%,#0A1B3D 92%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:620px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1}
.top{display:flex;align-items:center;gap:14px}
.top img{width:60px;height:60px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.top .th1{font-family:Kanit;font-weight:800;font-size:22px;color:#fff;line-height:1.15}
.top .en{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#C4D2EA}
.hero{text-align:center;margin:30px 0 24px}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;color:#FFD86A;text-transform:uppercase}
.h1{font-family:Kanit;font-weight:900;font-size:64px;line-height:1.1;color:#fff;margin-top:8px;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}
.h1 span{color:#FFD86A}
.sub{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.2em;color:#EAF1FB;margin-top:10px}
.tb{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 22px 50px -22px rgba(0,0,0,.7)}
.th{display:flex;align-items:center;gap:12px;border-left:8px solid #F2931E;padding:12px 22px;background:linear-gradient(90deg,#0C2556,#16397F)}
.th b{font-family:Kanit;font-weight:900;font-size:30px;color:#F2B807}.th span{font-family:Kanit;font-weight:600;font-size:20px;color:#fff}
table{width:100%;border-collapse:collapse}
td{font-family:'Saira Condensed';font-weight:700;font-size:20px;text-align:center;color:#12284B;height:52px;border-bottom:1px solid rgba(18,40,75,.08);padding:0 2px}
tr:last-child td{border-bottom:0}
tr.hd td{height:30px;font-family:Kanit;font-weight:600;font-size:14px;color:#fff;background:#12284B;border-bottom:0}
td.rk{width:50px;font-size:17px}
td.tm{text-align:left;white-space:nowrap}
.lg{display:inline-flex;vertical-align:middle;width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid rgba(18,40,75,.14);align-items:center;justify-content:center;margin-right:10px}
.lg img{width:78%;height:78%;object-fit:contain}
.nm{font-family:Kanit;font-weight:600;font-size:19px;color:#12284B;vertical-align:middle}
.nm em{font-style:normal;color:#E26F0A;font-weight:800}
td.pt{font-size:25px;color:#E26F0A;width:50px}
tr.z0 td{background:#FFFFFF}
tr.z1 td{background:#EEF2F9}
tr.r1 td{background:#FFD27A}
tr.r2 td{background:#FFE2A8}
tr.r3 td{background:#FFEFCB}
tr.r1 td.tm .nm,tr.r2 td.tm .nm,tr.r3 td.tm .nm{font-weight:800}
td.rk b{display:inline-flex;width:32px;height:32px;border-radius:50%;align-items:center;justify-content:center;font-family:Kanit;font-weight:800;font-size:16px;color:#E26F0A}
tr.r1 td.rk b{background:#F2931E;color:#fff}
tr.r2 td.rk b{background:#F7B24E;color:#12284B}
tr.r3 td.rk b{background:#FAD08A;color:#12284B}
.foot{margin-top:18px;font-family:'Saira Condensed';font-size:14px;letter-spacing:.04em;color:#93A7CB;line-height:1.5}
.foot b{color:#FFD86A}
</style></head><body><div class="poster"><img class="castle" src="castle-bg.jpg"><div class="fade1"></div><div class="fade2"></div>
<div class="wrap">
 <div class="top"><img src="bla-league.png"><div><div class="th1">บุรีรัมย์ลีก อคาเดมี่</div><div class="en">Buriram League Academy · Season 2026</div></div></div>
 <div class="hero"><div class="md">Parents Division · หลังรอบที่ ${upTo}</div><div class="h1">ตารางคะแนน<br><span>รุ่นผู้ปกครอง</span></div><div class="sub">ปราสาทหินพนมรุ้ง · บุรีรัมย์ · ฤดูกาล 2026</div></div>
 <div class="tb"><div class="th"><b>P</b><span>ตารางคะแนน รุ่นผู้ปกครอง</span></div>
  <table><tr class="hd"><td></td><td class="tm">ทีม</td><td>แข่ง</td><td>ชนะ</td><td>เสมอ</td><td>แพ้</td><td>ได้</td><td>เสีย</td><td>+/-</td><td>แต้ม</td></tr>${rows}</table></div>
 <div class="foot"><b>*</b> ทีมที่ไม่ได้ส่งผลรุ่นผู้ปกครองเข้ามา นับเป็นเสมอ 1-1 · ชนะ 3 แต้ม เสมอ 1 แต้ม แพ้ 0 แต้ม · เรียงตาม แต้ม &gt; ผลต่างประตู &gt; ประตูได้<br>ติดตามผลที่ Facebook: Buriram League Academy</div>
</div></div></body></html>`;

const htmlPath = path.join(DIR, 'parent-standings.html');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'parent-standings.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1340',
  '--virtual-time-budget=8000', `--screenshot=${png}`, fileUrl(htmlPath)], { stdio: 'ignore' });
const jpg = path.join(OUT_IMG, `parent-standings-round${upTo}.jpg`);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg, '· default 1-1 matches:', defaults);
