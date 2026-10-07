// make-posters.js — BLA match posters in the house pattern (castle artwork, Kanit/Sarabun,
// white logo tiles, orange VS disc, age-group chips + parent-division banner).
// Builds one HTML page per match from posters.json, then renders each with headless Edge
// at 2x (2160x2700) for smooth type and shadows.
//   node make-posters.js            -> all matches
//   node make-posters.js 1          -> match 1 only
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const OUT_HTML = path.join(DIR, 'out');
const OUT_IMG = path.join(DIR, '..', 'assets', 'img', 'round-posters');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

// keep logo assets in sync from the site
fs.mkdirSync(path.join(DIR,"teams"),{recursive:true});
for (const f of fs.readdirSync(path.join(DIR,"..","assets","img","teams"))) { const src=path.join(DIR,"..","assets","img","teams",f); if (fs.statSync(src).isFile()) fs.copyFileSync(src,path.join(DIR,"teams",f)); }
fs.copyFileSync(path.join(DIR,"..","assets","img","bla-league.png"),path.join(DIR,"bla-league.png"));
const data = JSON.parse(fs.readFileSync(path.join(DIR, process.env.POSTERS_JSON || 'posters.json'), 'utf8'));
const AGE_COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function teamBlock(slug, pillText, pillStyle) {
  const t = data.teams[slug];
  return `
    <div class="team">
      <div class="tile"><img src="teams/${slug}.png"></div>
      <div class="tname">${esc(t.th)}</div>
      <div class="ten">${esc(t.en)}</div>
      <div class="pill" style="${pillStyle}">${esc(pillText)}</div>
    </div>`;
}

function matchHtml(m) {
  const chips = m.slots.map(s => `
      <div class="chip">
        <div class="age" style="color:${AGE_COLOR[s.age] || '#4DA3FF'}">${esc(s.age)}</div>
        ${s.field ? `<div class="field">${esc(s.field)}</div>` : ''}
        <div class="time">เริ่ม ${esc(s.time)} น.</div>
      </div>`).join('');
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800;900&family=Sarabun:wght@400;500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1350px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;display:flex;flex-direction:column;padding:56px 64px 44px;color:#EAF1FB;font-family:'Sarabun',sans-serif}
.castle{position:absolute;left:50%;top:-40px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.62;z-index:0}
.fade1{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(180deg,rgba(7,20,49,.38) 0%,rgba(7,20,49,.5) 28%,rgba(10,27,61,.78) 55%,#0A1B3D 82%,#0A1B3D 100%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:860px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.brand .th{font-family:'Kanit';font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.brand .en{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C4D2EA}
.badge{display:inline-flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:700;letter-spacing:.12em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.45);border-radius:999px;padding:8px 16px;background:rgba(7,20,49,.55)}
.badge i{width:7px;height:7px;border-radius:50%;background:#F2B807;box-shadow:0 0 10px #F2B807}
.hero{text-align:center;margin-top:200px}
.md{display:inline-flex;align-items:center;gap:10px;font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;text-transform:uppercase;color:#FFD86A;text-shadow:0 2px 14px rgba(0,0,0,.85)}
.md i{width:22px;height:1.5px;background:#FFD86A;opacity:.8}
.h1{font-family:'Kanit';font-weight:900;font-size:60px;line-height:1.08;color:#fff;margin-top:14px;letter-spacing:-.01em;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}
.h1 span{color:#FFD86A}
.place{font-family:'Saira Condensed';font-weight:700;font-size:14px;letter-spacing:.22em;color:#EAF1FB;margin-top:14px;text-shadow:0 2px 12px rgba(0,0,0,.85)}
.card{margin-top:30px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015));border:1px solid rgba(180,205,245,.24);border-radius:28px;padding:40px 32px;display:flex;flex-direction:column;align-items:center;gap:24px}
.vsrow{display:flex;align-items:center;justify-content:center;gap:30px;width:100%}
.team{display:flex;flex-direction:column;align-items:center;gap:14px;flex:1}
.tile{width:148px;height:148px;border-radius:30px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.7)}
.tile img{width:76%;height:76%;object-fit:contain}
.tname{font-family:'Kanit';font-weight:800;font-size:24px;color:#fff;text-align:center;line-height:1.2;max-width:300px}
.ten{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#93A7CB;text-align:center}
.pill{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.14em;border-radius:999px;padding:5px 14px}
.vs{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#F2791E,#F2B807);display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px -10px rgba(242,121,30,.55);flex:none}
.vs span{font-family:'Kanit';font-weight:900;font-size:32px;color:#0A1B3D}
.rule{width:100%;height:1px;background:rgba(180,205,245,.16)}
.when{display:flex;flex-direction:column;align-items:center;gap:4px}
.when .d{font-family:'Kanit';font-weight:700;font-size:20px;color:#fff}
.when .v{font-family:'Sarabun';font-weight:600;font-size:16px;color:#C4D2EA}
.when .n{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.06em;color:#FFD86A;margin-top:2px}
.chips{margin-top:24px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.chip{background:rgba(255,255,255,.045);border:1px solid rgba(180,205,245,.16);border-radius:16px;padding:16px 8px;display:flex;flex-direction:column;align-items:center;gap:3px}
.chip .age{font-family:'Kanit';font-weight:800;font-size:22px}
.chip .field{font-family:'Saira Condensed';font-weight:600;font-size:11px;letter-spacing:.06em;color:#93A7CB}
.chip .time{font-family:'Saira Condensed';font-weight:700;font-size:13px;color:#C4D2EA}
.parent{margin-top:12px;background:linear-gradient(135deg,rgba(242,184,7,.14),rgba(242,121,30,.08));border:1px solid rgba(242,184,7,.35);border-radius:16px;padding:14px 20px;display:flex;align-items:center;justify-content:center;gap:10px}
.parent .l{font-family:'Kanit';font-weight:700;font-size:15px;color:#FFD86A}
.parent i{width:4px;height:4px;border-radius:50%;background:#FFD86A}
.parent .r{font-family:'Saira Condensed';font-weight:700;font-size:14px;color:#EAF1FB}
.foot{margin-top:auto;padding-top:26px}
.foot .row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.foot .rules{font-family:'Saira Condensed';font-size:12px;letter-spacing:.04em;color:#6E82A6;max-width:620px}
.foot .fb{display:flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.08em;color:#93A7CB}
.foot .fb i{width:6px;height:6px;border-radius:50%;background:#F2B807}
</style></head><body>
<div class="poster">
  <img class="castle" src="castle-bg.jpg">
  <div class="fade1"></div><div class="fade2"></div>
  <div class="wrap">
    <div class="top">
      <div class="brand"><img src="bla-league.png"><div style="display:flex;flex-direction:column;line-height:1.15">
        <span class="th">บุรีรัมย์ลีก อคาเดมี่</span><span class="en">Buriram League Academy · Season 2026</span></div></div>
      <div class="badge"><i></i>${esc(data.badge)}</div>
    </div>
    <div class="hero">
      <div class="md"><i></i>${esc(data.matchdayLine)}<i></i></div>
      <div class="h1">${esc(data.headline1)}<br><span>${esc(data.headline2)}</span></div>
      <div class="place">${esc(data.placeLine)}</div>
    </div>
    <div class="card">
      <div class="vsrow">
        ${teamBlock(m.home, 'เจ้าบ้าน', 'color:#4DA3FF;background:rgba(47,128,237,.16);border:1px solid rgba(47,128,237,.35)')}
        <div class="vs"><span>VS</span></div>
        ${teamBlock(m.away, 'ทีมเยือน', 'color:#FFA457;background:rgba(242,121,30,.14);border:1px solid rgba(242,121,30,.35)')}
      </div>
      <div class="rule"></div>
      <div class="when">
        <div class="d">${esc(m.dateLong || data.dateLong)}</div>
        <div class="v">${esc(m.venue)}</div>
        ${m.venueNote ? `<div class="n">${esc(m.venueNote)}</div>` : ''}
      </div>
    </div>
    <div class="chips">${chips}</div>
    <div class="parent"><span class="l">${esc(m.parent.label)}</span><i></i><span class="r">${esc(m.parent.detail)}</span></div>
    <div class="foot"><div class="rule" style="margin-bottom:18px"></div><div class="row">
      <div class="rules">${esc(data.footerRules)}</div>
      <div class="fb"><i></i>${esc(data.footerFb)}</div></div></div>
  </div>
</div></body></html>`;
}

fs.mkdirSync(OUT_HTML, { recursive: true });
fs.mkdirSync(OUT_IMG, { recursive: true });
const only = process.argv[2] ? Number(process.argv[2]) : null;

data.matches.forEach((m, i) => {
  const n = i + 1;
  if (only !== null && only !== n) return;
  const htmlPath = path.join(DIR, `match${n}.html`);   // beside the assets so relative src works
  fs.writeFileSync(htmlPath, matchHtml(m), 'utf8');
  const png = path.join(OUT_HTML, `match${n}.png`);
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
    '--window-size=1080,1350', '--virtual-time-budget=8000', `--screenshot=${png}`,
    'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
  const jpg = path.join(OUT_IMG, `round${data.round}-match${n}.jpg`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
  console.log('wrote', jpg);
});

if ((only === null || only === 0) && !process.env.POSTERS_JSON) {
  const summaryHtml = require('./summary-part.js');
  const htmlPath = path.join(DIR, 'summary.html');
  fs.writeFileSync(htmlPath, summaryHtml(data, esc), 'utf8');
  const png = path.join(OUT_HTML, 'summary.png');
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1200', '--virtual-time-budget=8000', '--screenshot=' + png, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
  const jpg = path.join(OUT_IMG, 'round' + data.round + '-summary.jpg');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
  console.log('wrote', jpg);
}
