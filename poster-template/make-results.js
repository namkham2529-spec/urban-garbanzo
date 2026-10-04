// make-results.js — per-match RESULT posters in the house pattern (castle artwork, white logo tiles,
// orange disc, age rows). Scores come from a results-tool backup JSON; teams/venues from posters.json.
//   node make-results.js results-round1.json        -> all matches of posters.json round
//   node make-results.js results-round1.json 3      -> match 3 only
// Output: assets/img/round-posters/roundN-result-matchK.jpg
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const OUT_IMG = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const AGES = ['U14', 'U12', 'U10', 'U8'];
const AGE_COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };
const AGE_TH = { U14: 'รุ่น 14 ปี', U12: 'รุ่น 12 ปี', U10: 'รุ่น 10 ปี', U8: 'รุ่น 8 ปี' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const R = JSON.parse(fs.readFileSync(path.resolve(DIR, process.argv[2] || 'results-round1.json'), 'utf8'));
const only = process.argv[3] ? Number(process.argv[3]) : null;
const data = JSON.parse(fs.readFileSync(path.join(DIR, 'posters.json'), 'utf8'));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const BLA = ctx.window.BLA;
const nameOf = slug => (BLA.teams.find(t => t.slug === slug) || {}).name;

fs.mkdirSync(path.join(DIR, 'teams'), { recursive: true });
for (const f of fs.readdirSync(path.join(DIR, '..', 'assets', 'img', 'teams'))) {
  const src = path.join(DIR, '..', 'assets', 'img', 'teams', f);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(DIR, 'teams', f));
}
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));

function teamBlock(slug, pill, pillStyle) {
  const t = data.teams[slug];
  return `<div class="team"><div class="tile"><img src="teams/${slug}.png"></div>
    <div class="tname">${esc(t.th)}</div><div class="ten">${esc(t.en)}</div>
    <div class="pill" style="${pillStyle}">${esc(pill)}</div></div>`;
}

function resultHtml(m, e) {
  let hw = 0, aw = 0, dr = 0;
  const rows = AGES.map(a => {
    const s = e[a];
    if (!s) return '';
    const h = +s.h, x = +s.a;
    if (h > x) hw++; else if (h < x) aw++; else dr++;
    const tag = h > x ? 'ชนะ' : h < x ? 'แพ้' : 'เสมอ';
    return `<div class="row">
      <div class="age"><b style="color:${AGE_COLOR[a]}">${a}</b><span>${AGE_TH[a]}</span></div>
      <div class="sc"><span class="${h > x ? 'w' : h < x ? 'l' : 'd'}">${h}</span><i>–</i><span class="${x > h ? 'w' : x < h ? 'l' : 'd'}">${x}</span></div>
      <div class="res ${h === x ? 'dd' : ''}">${h === x ? 'เสมอ' : (h > x ? '◀ ' : '') + (h > x ? 'เจ้าบ้านชนะ' : 'ทีมเยือนชนะ') + (h < x ? ' ▶' : '')}</div>
    </div>`;
  }).join('');
  const p = e.P;
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800;900&family=Sarabun:wght@400;500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1350px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;display:flex;flex-direction:column;padding:56px 64px 44px;color:#EAF1FB;font-family:'Sarabun',sans-serif}
.castle{position:absolute;left:50%;top:-40px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.62;z-index:0}
.fade1{position:absolute;left:0;right:0;top:0;height:800px;background:linear-gradient(180deg,rgba(7,20,49,.38) 0%,rgba(7,20,49,.5) 28%,rgba(10,27,61,.8) 55%,#0A1B3D 85%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:780px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.brand .th{font-family:'Kanit';font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.brand .en{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C4D2EA}
.badge{display:inline-flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:700;letter-spacing:.12em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.45);border-radius:999px;padding:8px 16px;background:rgba(7,20,49,.55)}
.badge i{width:7px;height:7px;border-radius:50%;background:#F2B807;box-shadow:0 0 10px #F2B807}
.hero{text-align:center;margin-top:150px}
.md{display:inline-flex;align-items:center;gap:10px;font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;text-transform:uppercase;color:#FFD86A;text-shadow:0 2px 14px rgba(0,0,0,.85)}
.md i{width:22px;height:1.5px;background:#FFD86A;opacity:.8}
.h1{font-family:'Kanit';font-weight:900;font-size:64px;line-height:1.08;color:#fff;margin-top:12px;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}
.h1 span{color:#FFD86A}
.card{margin-top:28px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015));border:1px solid rgba(180,205,245,.24);border-radius:28px;padding:32px 32px 26px;display:flex;flex-direction:column;align-items:center;gap:20px}
.vsrow{display:flex;align-items:center;justify-content:center;gap:24px;width:100%}
.team{display:flex;flex-direction:column;align-items:center;gap:12px;flex:1}
.tile{width:136px;height:136px;border-radius:28px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.7)}
.tile img{width:76%;height:76%;object-fit:contain}
.tname{font-family:'Kanit';font-weight:800;font-size:24px;color:#fff;text-align:center;line-height:1.2;max-width:300px}
.ten{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#93A7CB;text-align:center}
.pill{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.14em;border-radius:999px;padding:5px 14px}
.mid{display:flex;flex-direction:column;align-items:center;gap:10px;flex:none}
.ft{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#F2791E,#F2B807);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 14px 30px -10px rgba(242,121,30,.55)}
.ft span{font-family:'Kanit';font-weight:900;font-size:22px;color:#0A1B3D;line-height:1}
.ft small{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.14em;color:#0A1B3D}
.tally{font-family:'Saira Condensed';font-weight:700;font-size:13px;letter-spacing:.06em;color:#C4D2EA;text-align:center;line-height:1.35}
.tally b{color:#FFD86A;font-size:15px}
.rule{width:100%;height:1px;background:rgba(180,205,245,.16)}
.v{font-family:'Sarabun';font-weight:600;font-size:16px;color:#C4D2EA;text-align:center}
.v b{font-family:'Kanit';font-weight:700;color:#fff;font-size:18px;display:block}
.rows{margin-top:24px;display:flex;flex-direction:column;gap:12px}
.row{display:grid;grid-template-columns:200px 1fr 200px;align-items:center;background:rgba(255,255,255,.045);border:1px solid rgba(180,205,245,.16);border-radius:16px;padding:10px 22px}
.age{display:flex;align-items:baseline;gap:10px}
.age b{font-family:'Kanit';font-weight:900;font-size:30px}
.age span{font-family:'Kanit';font-weight:600;font-size:14px;color:#93A7CB}
.sc{display:flex;align-items:center;justify-content:center;gap:22px}
.sc span{font-family:'Kanit';font-weight:900;font-size:48px;line-height:1;min-width:64px;text-align:center}
.sc i{font-family:'Kanit';font-style:normal;font-weight:700;font-size:30px;color:#6E82A6}
.sc .w{color:#FFD86A;text-shadow:0 0 18px rgba(242,184,7,.35)}
.sc .l{color:#93A7CB}
.sc .d{color:#fff}
.res{font-family:'Kanit';font-weight:700;font-size:14px;color:#FFD86A;text-align:right}
.res.dd{color:#C4D2EA}
.parent{margin-top:10px;background:linear-gradient(135deg,rgba(242,184,7,.14),rgba(242,121,30,.08));border:1px solid rgba(242,184,7,.35);border-radius:16px;padding:12px 20px;display:flex;align-items:center;justify-content:center;gap:12px}
.parent .l{font-family:'Kanit';font-weight:700;font-size:16px;color:#FFD86A}
.parent i{width:4px;height:4px;border-radius:50%;background:#FFD86A}
.parent .r{font-family:'Kanit';font-weight:800;font-size:20px;color:#fff}
.foot{margin-top:auto;padding-top:20px}
.foot .fr{display:flex;align-items:center;justify-content:space-between;gap:12px}
.foot .rules{font-family:'Saira Condensed';font-size:12px;letter-spacing:.04em;color:#6E82A6;max-width:600px}
.foot .fb{display:flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.08em;color:#93A7CB}
.foot .fb i{width:6px;height:6px;border-radius:50%;background:#F2B807}
</style></head><body>
<div class="poster"><img class="castle" src="castle-bg.jpg"><div class="fade1"></div><div class="fade2"></div>
<div class="wrap">
  <div class="top">
    <div class="brand"><img src="bla-league.png"><div style="display:flex;flex-direction:column;line-height:1.15">
      <span class="th">บุรีรัมย์ลีก อคาเดมี่</span><span class="en">Buriram League Academy · Season 2026</span></div></div>
    <div class="badge"><i></i>${esc(data.badge)}</div>
  </div>
  <div class="hero">
    <div class="md"><i></i>Full Time · รอบที่ ${data.round}<i></i></div>
    <div class="h1">ผลการแข่งขัน<br><span>นัดที่ ${data.round}</span></div>
  </div>
  <div class="card">
    <div class="vsrow">
      ${teamBlock(m.home, 'เจ้าบ้าน', 'color:#4DA3FF;background:rgba(47,128,237,.16);border:1px solid rgba(47,128,237,.35)')}
      <div class="mid"><div class="ft"><span>FT</span><small>จบเกม</small></div>
        <div class="tally">ชนะ <b>${hw}</b> · เสมอ <b>${dr}</b> · ชนะ <b>${aw}</b><br>(เจ้าบ้าน · เสมอ · ทีมเยือน)</div></div>
      ${teamBlock(m.away, 'ทีมเยือน', 'color:#FFA457;background:rgba(242,121,30,.14);border:1px solid rgba(242,121,30,.35)')}
    </div>
    <div class="rule"></div>
    <div class="v"><b>${esc(data.dateLong)}</b>${esc(m.venue)}</div>
  </div>
  <div class="rows">${rows}</div>
  ${p ? `<div class="parent"><span class="l">รุ่นผู้ปกครอง (ไม่นับคะแนน)</span><i></i><span class="r">${esc(p.h)} – ${esc(p.a)}</span></div>` : ''}
  <div class="foot"><div class="rule" style="margin-bottom:16px"></div><div class="fr">
    <div class="rules">ตารางคะแนนรวมทุกรุ่น: buriram-league-academy.netlify.app</div>
    <div class="fb"><i></i>${esc(data.footerFb)}</div></div></div>
</div></div></body></html>`;
}

fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
fs.mkdirSync(OUT_IMG, { recursive: true });
data.matches.forEach((m, i) => {
  const n = i + 1;
  if (only !== null && only !== n) return;
  const e = R[data.round + '|' + nameOf(m.home) + '|' + nameOf(m.away)];
  if (!e) { console.log('no result for match', n); return; }
  const htmlPath = path.join(DIR, `result${n}.html`);
  fs.writeFileSync(htmlPath, resultHtml(m, e), 'utf8');
  const png = path.join(DIR, 'out', `result${n}.png`);
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    '--window-size=1080,1350', '--virtual-time-budget=8000', `--screenshot=${png}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
  const jpg = path.join(OUT_IMG, `round${data.round}-result-match${n}.jpg`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
  console.log('wrote', jpg);
});
