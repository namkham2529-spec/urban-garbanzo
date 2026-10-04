// make-standings.js — BLA standings poster (4 age tables) in the house pattern (castle artwork).
// Input = the backup JSON downloaded from results-tool.html ("ดาวน์โหลดสำรอง"), same shape as its localStorage.
//   node make-standings.js [path/to/bla-results-backup.json] [round]
// Default input: ~/Downloads/bla-results-backup.json (missing file -> all-zero tables).
// Output: assets/img/round-posters/standings-roundN.jpg
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const OUT_IMG = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const AGES = ['U14', 'U12', 'U10', 'U8'];
const AGE_COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inFile = process.argv[2] || path.join(os.homedir(), 'Downloads', 'bla-results-backup.json');
const upTo = process.argv[3] ? Number(process.argv[3]) : 1;
const R = fs.existsSync(inFile) ? JSON.parse(fs.readFileSync(inFile, 'utf8')) : {};
console.log(fs.existsSync(inFile) ? 'results: ' + inFile : 'no results file — all zeros');

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
function standings(age) {
  const S = {};
  BLA.teams.forEach(t => S[t.name] = { slug: t.slug, name: t.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  BLA.schedule.filter(r => r.round <= upTo).forEach(r => r.matches.forEach(m => {
    const s = (R[r.round + '|' + m.home + '|' + m.away] || {})[age];
    if (!has(s)) return;
    const h = +s.h, a = +s.a, H = S[m.home], A = S[m.away];
    if (!H || !A) return;
    H.p++; A.p++; H.gf += h; H.ga += a; A.gf += a; A.ga += h;
    if (h > a) { H.w++; H.pts += 3; A.l++; } else if (h < a) { A.w++; A.pts += 3; H.l++; } else { H.d++; A.d++; H.pts++; A.pts++; }
  }));
  return Object.values(S).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
}

function table(age) {
  const rows = standings(age).map((s, i) => {
    const gd = s.gf - s.ga;
    const nm = (posters.teams[s.slug] || {}).th || s.name;
    return `<tr class="${i < 1 && s.p ? 'lead' : ''}"><td class="rk">${i + 1}</td>
      <td class="tm"><span class="lg"><img src="teams/${s.slug}.png"></span><span class="nm">${esc(nm)}</span></td>
      <td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td><td>${gd > 0 ? '+' : ''}${gd}</td><td class="pt">${s.pts}</td></tr>`;
  }).join('');
  return `<div class="tb"><div class="th" style="border-color:${AGE_COLOR[age]}"><b style="color:${AGE_COLOR[age]}">${age}</b><span>ตารางคะแนน รุ่น ${age}</span></div>
    <table><tr class="hd"><td></td><td class="tm">ทีม</td><td>แข่ง</td><td>ชนะ</td><td>เสมอ</td><td>แพ้</td><td>+/-</td><td>แต้ม</td></tr>${rows}</table></div>`;
}

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700;800;900&family=Sarabun:wght@400;500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1640px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;padding:48px 44px 36px;color:#EAF1FB;font-family:'Sarabun',sans-serif}
.castle{position:absolute;left:50%;top:-40px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.5;z-index:0}
.fade1{position:absolute;left:0;right:0;top:0;height:700px;background:linear-gradient(180deg,rgba(7,20,49,.4) 0%,rgba(7,20,49,.6) 35%,#0A1B3D 90%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:680px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1}
.top{display:flex;align-items:center;gap:14px}
.top img{width:60px;height:60px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.top .th1{font-family:Kanit;font-weight:800;font-size:22px;color:#fff;line-height:1.15}
.top .en{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#C4D2EA}
.hero{text-align:center;margin:34px 0 26px}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;color:#FFD86A;text-transform:uppercase}
.h1{font-family:Kanit;font-weight:900;font-size:58px;line-height:1.1;color:#fff;margin-top:8px;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}
.h1 span{color:#FFD86A}
.sub{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.2em;color:#EAF1FB;margin-top:10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 20px}
.tb{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(180,205,245,.24);border-radius:20px;padding:14px 12px 10px}
.th{display:flex;align-items:center;gap:10px;border-left:5px solid;padding-left:10px;margin-bottom:8px}
.th b{font-family:Kanit;font-weight:900;font-size:28px}.th span{font-family:Kanit;font-weight:600;font-size:15px;color:#fff}
table{width:100%;border-collapse:collapse}
td{font-family:'Saira Condensed';font-weight:700;font-size:15px;text-align:center;color:#EAF1FB;height:40px;border-bottom:1px solid rgba(180,205,245,.1);padding:0 2px}
tr:last-child td{border-bottom:0}
tr.hd td{height:24px;font-family:Kanit;font-weight:500;font-size:11px;color:#93A7CB}
td.rk{width:24px;color:#FFD86A;font-size:16px}
td.tm{text-align:left;width:auto}
.tm{display:flex;align-items:center;gap:7px;border-bottom:0}
td.tm{display:table-cell;white-space:nowrap}
.lg{display:inline-flex;vertical-align:middle;width:28px;height:28px;border-radius:8px;background:#fff;align-items:center;justify-content:center;margin-right:7px}
.lg img{width:78%;height:78%;object-fit:contain}
.nm{font-family:Kanit;font-weight:600;font-size:13px;color:#fff;vertical-align:middle}
td.pt{font-size:19px;color:#FFD86A;width:34px}
tr.lead td{background:rgba(242,184,7,.1)}
.foot{margin-top:22px;display:flex;justify-content:space-between;font-family:'Saira Condensed';font-size:13px;letter-spacing:.06em;color:#93A7CB}
</style></head><body><div class="poster"><img class="castle" src="castle-bg.jpg"><div class="fade1"></div><div class="fade2"></div>
<div class="wrap">
 <div class="top"><img src="bla-league.png"><div><div class="th1">บุรีรัมย์ลีก อคาเดมี่</div><div class="en">Buriram League Academy · Season 2026</div></div></div>
 <div class="hero"><div class="md">Standings · หลังรอบที่ ${upTo}</div><div class="h1">ตารางคะแนน<br><span>ฤดูกาล 2026</span></div><div class="sub">ปราสาทหินพนมรุ้ง · บุรีรัมย์</div></div>
 <div class="grid">${AGES.map(table).join('')}</div>
 <div class="foot"><span>ชนะ 3 แต้ม · เสมอ 1 แต้ม · แพ้ 0 แต้ม · เรียงตาม แต้ม &gt; ผลต่างประตู &gt; ประตูได้</span><span>${esc(posters.footerFb)}</span></div>
</div></div></body></html>`;

const htmlPath = path.join(DIR, 'standings.html');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
fs.mkdirSync(OUT_IMG, { recursive: true });
const png = path.join(DIR, 'out', 'standings.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
  '--window-size=1080,1640', '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
const jpg = path.join(OUT_IMG, `standings-round${upTo}.jpg`);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg);
