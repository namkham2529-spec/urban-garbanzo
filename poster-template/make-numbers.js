// make-numbers.js — "ตัวเลขนัดที่ N" aggregate-stats poster (house pattern). AGGREGATES ONLY: no team is named next to a
// score or a lopsided result (user rule 2026-10-07: avoid embarrassing the team that lost).
//   node make-numbers.js results-round1.json [round]   -> assets/img/round-posters/numbers-roundN.jpg
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const DIR = __dirname;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const R = JSON.parse(fs.readFileSync(path.resolve(DIR, process.argv[2] || 'results-round1.json'), 'utf8'));
const N = Number(process.argv[3] || 1);
const AGES = ['U14', 'U12', 'U10', 'U8'], COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };
const by = {}; let goals = 0, games = 0;
AGES.forEach(a => by[a] = { g: 0, n: 0 });
for (const k in R) {
  if (k.split('|')[0] !== String(N)) continue;
  AGES.forEach(a => { const s = R[k][a]; if (s && s.h !== '' && s.a !== '') { const t = +s.h + +s.a; by[a].g += t; by[a].n++; goals += t; games++; } });
}
const avg = (goals / games).toFixed(2);
const top = AGES.reduce((m, a) => by[a].g > by[m].g ? a : m, AGES[0]);
const max = Math.max(...AGES.map(a => by[a].g));
const bars = AGES.map(a => `<div class="row ${a === top ? 'top' : ''}"><div class="age" style="color:${COLOR[a]}">${a}</div>
  <div class="track"><div class="fill" style="width:${Math.round(by[a].g / max * 100)}%;background:${a === top ? 'linear-gradient(90deg,#F2791E,#F2B807)' : 'linear-gradient(90deg,#2F80ED,#4DA3FF)'}"></div></div>
  <div class="val"><b>${by[a].g}</b> ประตู<small>เฉลี่ย ${(by[a].g / by[a].n).toFixed(1)}/เกม</small></div></div>`).join('');
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700;800;900&family=Sarabun:wght@500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1350px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;padding:56px 64px 44px;color:#EAF1FB;font-family:Sarabun,sans-serif;display:flex;flex-direction:column}
.castle{position:absolute;left:50%;top:-40px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.55;z-index:0}
.fade1{position:absolute;left:0;right:0;top:0;height:760px;background:linear-gradient(180deg,rgba(7,20,49,.4),rgba(7,20,49,.6) 40%,#0A1B3D 92%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:740px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}.brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.brand .th{font-family:Kanit;font-weight:800;font-size:20px;color:#fff}.brand .en{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C4D2EA}
.badge{font-family:'Saira Condensed';font-weight:700;letter-spacing:.12em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.45);border-radius:999px;padding:8px 16px;background:rgba(7,20,49,.55)}
.hero{text-align:center;margin-top:120px}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;color:#FFD86A;text-transform:uppercase}
.h1{font-family:Kanit;font-weight:900;font-size:64px;line-height:1.08;color:#fff;margin-top:12px;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}.h1 span{color:#FFD86A}
.big{margin-top:46px;display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:14px}
.k{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(180,205,245,.24);border-radius:24px;padding:34px 10px;text-align:center}
.k b{display:block;font-family:Kanit;font-weight:900;font-size:84px;line-height:1;color:#FFD86A;text-shadow:0 0 28px rgba(242,184,7,.35)}
.k.s b{font-size:64px;color:#fff;text-shadow:none}
.k span{display:block;font-family:Kanit;font-weight:600;font-size:20px;color:#C4D2EA;margin-top:6px}
.card{margin-top:34px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015));border:1px solid rgba(180,205,245,.24);border-radius:26px;padding:38px 34px}
.card h3{margin:0 0 14px;font-family:Kanit;font-weight:700;font-size:26px;color:#fff}
.row{display:grid;grid-template-columns:96px 1fr 210px;align-items:center;gap:16px;padding:18px 0}
.age{font-family:Kanit;font-weight:900;font-size:32px}
.track{height:40px;background:rgba(255,255,255,.07);border-radius:20px;overflow:hidden}.fill{height:100%;border-radius:20px}
.val{font-family:Kanit;font-weight:600;font-size:18px;color:#C4D2EA}.val b{font-weight:900;font-size:34px;color:#fff}.val small{display:block;font-family:Sarabun;font-size:13px;color:#93A7CB}
.row.top .val b{color:#FFD86A}
.cap{margin-top:22px;text-align:center;font-family:Kanit;font-weight:700;font-size:20px;color:#FFD86A}
.foot{margin-top:auto;padding-top:14px;border-top:1px solid rgba(180,205,245,.16);display:flex;justify-content:space-between;font-family:'Saira Condensed';font-weight:700;font-size:13px;letter-spacing:.06em;color:#93A7CB}
</style></head><body><div class="poster"><img class="castle" src="castle-bg.jpg"><div class="fade1"></div><div class="fade2"></div><div class="wrap">
<div class="top"><div class="brand"><img src="bla-league.png"><div><div class="th">บุรีรัมย์ลีก อคาเดมี่</div><div class="en">Buriram League Academy · Season 2026</div></div></div><div class="badge">นัดที่ ${N} · ฤดูกาล 2026</div></div>
<div class="hero"><div class="md">Matchday ${N} in numbers</div><div class="h1">ตัวเลข<span>นัดที่ ${N}</span></div></div>
<div class="big"><div class="k"><b>${goals}</b><span>ประตูทั้งหมด</span></div><div class="k s"><b>${games}</b><span>เกมที่แข่ง</span></div><div class="k s"><b>${avg}</b><span>ประตูต่อเกม</span></div></div>
<div class="card"><h3>ประตูรวมแยกตามรุ่นอายุ</h3>${bars}<div class="cap">รุ่น ${top} ยิงมากที่สุด ${by[top].g} ประตู</div></div>
<div class="foot"><span>ข้อมูลจากผลที่ 6 คู่ 4 รุ่นอายุรายงาน (ไม่รวมรุ่นผู้ปกครอง)</span><span>ติดตามผลที่ Facebook: Buriram League Academy</span></div>
</div></div></body></html>`;
const hp = path.join(DIR, 'numbers.html'); fs.writeFileSync(hp, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'numbers.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1350', '--virtual-time-budget=8000', '--screenshot=' + png, 'file:///' + hp.split('\\').join('/')], { stdio: 'ignore' });
const jpg = path.join(DIR, '..', 'assets', 'img', 'round-posters', `numbers-round${N}.jpg`);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg, { goals, games, avg, by });
