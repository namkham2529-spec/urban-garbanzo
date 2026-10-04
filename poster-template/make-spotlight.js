// make-spotlight.js — "Team Spotlight" poster: club photo + round results chips in the house pattern.
//   node make-spotlight.js <slug> <photo> <results.json> [round]
// Output: assets/img/round-posters/spotlight-<slug>-roundN.jpg  (photo copied to poster-template/teams-photo/)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const [slug, photo, resFile, roundArg] = process.argv.slice(2);
const round = Number(roundArg || 1);
const AGES = ['U14', 'U12', 'U10', 'U8'];
const AGE_COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };

const posters = JSON.parse(fs.readFileSync(path.join(DIR, 'posters.json'), 'utf8'));
const R = JSON.parse(fs.readFileSync(path.resolve(DIR, resFile), 'utf8'));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const T = ctx.window.BLA.teams;
const me = T.find(t => t.slug === slug);
const th = posters.teams[slug];

// find this team's match + score from its own side
let opp, mine = {}, venue = '';
ctx.window.BLA.schedule.filter(r => r.round === round).forEach(r => r.matches.forEach(m => {
  const home = m.home === me.name, away = m.away === me.name;
  if (!home && !away) return;
  opp = home ? m.away : m.home;
  venue = m.venue || '';
  const e = R[round + '|' + m.home + '|' + m.away] || {};
  for (const k of AGES.concat('P')) if (e[k]) mine[k] = home ? [+e[k].h, +e[k].a] : [+e[k].a, +e[k].h];
}));
const oppT = T.find(t => t.name === opp);
const oppTh = posters.teams[oppT.slug];

fs.mkdirSync(path.join(DIR, 'teams-photo'), { recursive: true });
fs.copyFileSync(photo, path.join(DIR, 'teams-photo', slug + '.jpg'));
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'teams', slug + '.png'), path.join(DIR, 'teams', slug + '.png'));

const chips = AGES.filter(a => mine[a]).map(a => {
  const [f, g] = mine[a];
  const tag = f > g ? 'ชนะ' : f < g ? 'แพ้' : 'เสมอ';
  const cls = f > g ? 'w' : f < g ? 'l' : 'd';
  return `<div class="chip ${cls}"><div class="age" style="color:${AGE_COLOR[a]}">${a}</div><div class="sc">${f} – ${g}</div><div class="tag">${tag}</div></div>`;
}).join('');
const par = mine.P ? `<div class="parent"><span class="l">รุ่นผู้ปกครอง</span><i></i><span class="r">${mine.P[0]} – ${mine.P[1]}</span></div>` : '';

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800;900&family=Sarabun:wght@500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1350px;position:relative;overflow:hidden;background:#0A1B3D;color:#EAF1FB;font-family:'Sarabun',sans-serif}
.photo{position:absolute;left:0;top:0;width:1080px;height:820px;object-fit:cover;object-position:50% 55%}
.shade{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(180deg,rgba(7,20,49,.55) 0%,rgba(7,20,49,0) 22%,rgba(7,20,49,0) 48%,rgba(10,27,61,.9) 80%,#0A1B3D 98%)}
.castle{position:absolute;left:50%;bottom:-260px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.9);mix-blend-mode:screen;opacity:.3}
.wrap{position:absolute;inset:0;padding:48px 60px 40px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.brand .t{font-family:Kanit;font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.7);line-height:1.15}
.brand .e{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#E3ECFA}
.badge{font-family:'Saira Condensed';font-weight:700;letter-spacing:.14em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.55);border-radius:999px;padding:8px 16px;background:rgba(7,20,49,.6)}
.id{position:absolute;left:60px;right:60px;top:690px;display:flex;align-items:center;gap:22px}
.tile{width:130px;height:130px;border-radius:28px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -16px rgba(0,0,0,.7);flex:none}
.tile img{width:76%;height:76%;object-fit:contain}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.35em;color:#FFD86A;text-transform:uppercase}
.nm{font-family:Kanit;font-weight:900;font-size:58px;line-height:1.05;color:#fff;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}
.en{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.16em;color:#C4D2EA;text-transform:uppercase;margin-top:4px}
.lower{position:absolute;left:60px;right:60px;top:900px}
.vs{font-family:Kanit;font-weight:700;font-size:20px;color:#fff;text-align:center}
.vs span{color:#FFD86A}
.sub{font-family:Sarabun;font-weight:600;font-size:15px;color:#93A7CB;text-align:center;margin-top:4px}
.chips{margin-top:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.chip{background:rgba(255,255,255,.05);border:1px solid rgba(180,205,245,.2);border-radius:16px;padding:14px 8px;text-align:center}
.chip.w{border-color:rgba(242,184,7,.6);background:rgba(242,184,7,.1)}
.chip .age{font-family:Kanit;font-weight:900;font-size:22px}
.chip .sc{font-family:Kanit;font-weight:900;font-size:38px;color:#fff;line-height:1.1}
.chip .tag{font-family:Kanit;font-weight:700;font-size:14px;color:#93A7CB}
.chip.w .tag{color:#FFD86A}
.parent{margin-top:12px;background:linear-gradient(135deg,rgba(242,184,7,.14),rgba(242,121,30,.08));border:1px solid rgba(242,184,7,.35);border-radius:16px;padding:12px;display:flex;align-items:center;justify-content:center;gap:12px}
.parent .l{font-family:Kanit;font-weight:700;font-size:16px;color:#FFD86A}.parent i{width:4px;height:4px;border-radius:50%;background:#FFD86A}.parent .r{font-family:Kanit;font-weight:800;font-size:20px;color:#fff}
.foot{position:absolute;left:60px;right:60px;bottom:36px;display:flex;justify-content:space-between;font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.08em;color:#93A7CB;border-top:1px solid rgba(180,205,245,.16);padding-top:14px}
</style></head><body><div class="poster">
<img class="photo" src="teams-photo/${slug}.jpg"><div class="shade"></div><img class="castle" src="castle-bg.jpg">
<div class="wrap"><div class="top"><div class="brand"><img src="bla-league.png"><div><div class="t">บุรีรัมย์ลีก อคาเดมี่</div><div class="e">Buriram League Academy · Season 2026</div></div></div><div class="badge">TEAM SPOTLIGHT</div></div>
<div class="id"><div class="tile"><img src="teams/${slug}.png"></div><div><div class="md">Matchday ${round}</div><div class="nm">${esc(th.th)}</div><div class="en">${esc(th.en)} · ${esc(me.city)}</div></div></div></div>
<div class="lower"><div class="vs">นัดที่ ${round} พบ <span>${esc(oppTh.th)}</span></div><div class="sub">${esc(venue)}</div><div class="chips">${chips}</div>${par}</div>
<div class="foot"><span>ติดตามผลทุกสนาม: buriram-league-academy.netlify.app</span><span>Facebook: Buriram League Academy</span></div>
</div></body></html>`;

const htmlPath = path.join(DIR, 'spotlight.html');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'spotlight.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1350',
  '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
const jpg = path.join(DIR, '..', 'assets', 'img', 'round-posters', `spotlight-${slug}-round${round}.jpg`);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg);
