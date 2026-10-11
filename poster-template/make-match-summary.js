// make-match-summary.js — "สรุปการแข่งขัน" poster for ONE match: real match photo on top + both teams + scores per age (house pattern).
//   node make-match-summary.js <photo.jpg> <round> <homeSlug> <awaySlug> <out-name> [results.json] [dateText] [venueText]
// e.g. node make-match-summary.js photo.jpg 2 chaikorn seven summary-r2-chaikorn-seven results-all.json "อาทิตย์ 11 ต.ค. 2569" "สนามเทศบาลนาโพธิ์ อ.พุทไธสง"
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const DIR = __dirname;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FF = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const [photo, round, hs, as, name, resFile = 'results-all.json', dateText = '', venueText = ''] = process.argv.slice(2);
const AGES = ['U14', 'U12', 'U10', 'U8'], COLOR = { U14: '#4DA3FF', U12: '#2F80ED', U10: '#F2791E', U8: '#F2B807' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = JSON.parse(fs.readFileSync(path.resolve(DIR, resFile), 'utf8'));
const posters = JSON.parse(fs.readFileSync(path.join(DIR, 'posters.json'), 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const nm = s => ctx.window.BLA.teams.find(t => t.slug === s).name;
const ent = R[`${round}|${nm(hs)}|${nm(as)}`];
if (!ent) throw new Error('no result for this match');
fs.copyFileSync(photo, path.join(DIR, 'teams-photo', name + '.jpg'));
for (const s of [hs, as]) fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'teams', s + '.png'), path.join(DIR, 'teams', s + '.png'));
fs.copyFileSync(path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'bla-league.png'));
let hw = 0, aw = 0, dr = 0;
const rows = AGES.filter(a => ent[a]).map(a => {
  const h = +ent[a].h, x = +ent[a].a; if (h > x) hw++; else if (h < x) aw++; else dr++;
  return `<div class="row"><div class="age" style="color:${COLOR[a]}">${a}</div><div class="sc"><span class="${h > x ? 'w' : h < x ? 'l' : 'd'}">${h}</span><i>–</i><span class="${x > h ? 'w' : x < h ? 'l' : 'd'}">${x}</span></div></div>`;
}).join('');
const P = ent.P ? `<div class="parent"><span class="l">รุ่นผู้ปกครอง</span><i></i><span class="r"><b class="${+ent.P.h > +ent.P.a ? 'w' : ''}">${ent.P.h}</b> – <b class="${+ent.P.a > +ent.P.h ? 'w' : ''}">${ent.P.a}</b></span></div>` : '';
const team = (s, pill) => `<div class="team"><div class="tile"><img src="teams/${s}.png"></div><div class="tname">${esc(posters.teams[s].th)}</div><div class="pill">${pill}</div></div>`;
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800;900&family=Sarabun:wght@500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1350px;position:relative;overflow:hidden;background:#0A1B3D;color:#EAF1FB;font-family:Sarabun,sans-serif}
.photo{position:absolute;left:0;top:0;width:1080px;height:700px;object-fit:cover;object-position:50% 64%}
.shade{position:absolute;left:0;right:0;top:0;height:720px;background:linear-gradient(180deg,rgba(7,20,49,.62) 0%,rgba(7,20,49,0) 24%,rgba(7,20,49,0) 50%,rgba(10,27,61,.92) 86%,#0A1B3D 100%)}
.castle{position:absolute;left:50%;bottom:-300px;width:1500px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.9);mix-blend-mode:screen;opacity:.28}
.top{position:absolute;left:56px;right:56px;top:44px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}.brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:6px;box-sizing:border-box}
.brand .th{font-family:Kanit;font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.7)}.brand .en{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#E3ECFA}
.badge{font-family:'Saira Condensed';font-weight:700;letter-spacing:.12em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.55);border-radius:999px;padding:8px 16px;background:rgba(7,20,49,.6)}
.title{position:absolute;left:0;right:0;top:560px;text-align:center}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;color:#FFD86A;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.9)}
.h1{font-family:Kanit;font-weight:900;font-size:64px;line-height:1.05;color:#fff;margin-top:6px;text-shadow:0 6px 10px rgba(0,0,0,.6),0 12px 34px rgba(0,0,0,.7)}.h1 span{color:#FFD86A}
.where{font-family:Sarabun;font-weight:600;font-size:16px;color:#E3ECFA;margin-top:8px;text-shadow:0 2px 10px rgba(0,0,0,.9)}
.card{position:absolute;left:56px;right:56px;top:742px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(180,205,245,.24);border-radius:26px;padding:22px 26px 18px}
.vs{display:flex;align-items:center;justify-content:space-between}
.team{display:flex;flex-direction:column;align-items:center;gap:6px;width:270px}.tile{width:104px;height:104px;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px -14px rgba(0,0,0,.6)}.tile img{width:76%;height:76%;object-fit:contain}
.tname{font-family:Kanit;font-weight:800;font-size:21px;color:#fff;text-align:center;line-height:1.15}.pill{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.12em;color:#FFD86A}
.mid{text-align:center}.mid .ft{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#F2791E,#F2B807)}.ft b{font-family:Kanit;font-weight:900;font-size:22px;color:#0A1B3D;line-height:1}.ft small{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.14em;color:#0A1B3D}
.rows{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}
.row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.045);border:1px solid rgba(180,205,245,.16);border-radius:14px;padding:6px 18px}
.age{font-family:Kanit;font-weight:900;font-size:26px}.sc{display:flex;align-items:center;gap:12px}.sc span{font-family:Kanit;font-weight:900;font-size:36px;line-height:1;min-width:34px;text-align:center}.sc i{font-style:normal;font-family:Kanit;font-weight:700;color:#6E82A6}
.sc .w{color:#FFD86A;text-shadow:0 0 14px rgba(242,184,7,.35)}.sc .l{color:#93A7CB}.sc .d{color:#fff}
.parent{margin-top:10px;background:linear-gradient(135deg,rgba(242,184,7,.14),rgba(242,121,30,.08));border:1px solid rgba(242,184,7,.35);border-radius:14px;padding:9px 18px;display:flex;align-items:center;justify-content:center;gap:12px}
.parent .l{font-family:Kanit;font-weight:700;font-size:17px;color:#FFD86A}.parent i{width:4px;height:4px;border-radius:50%;background:#FFD86A}.parent .r{font-family:Kanit;font-weight:800;font-size:22px;color:#fff}.parent .w{color:#FFD86A}
.msg{margin-top:12px;text-align:center;font-family:Kanit;font-weight:700;font-size:19px;color:#FFD86A}
.foot{position:absolute;left:56px;right:56px;bottom:30px;display:flex;justify-content:space-between;font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.06em;color:#93A7CB;border-top:1px solid rgba(180,205,245,.16);padding-top:12px}
</style></head><body><div class="poster"><img class="castle" src="castle-bg.jpg"><img class="photo" src="teams-photo/${name}.jpg"><div class="shade"></div>
<div class="top"><div class="brand"><img src="bla-league.png"><div><div class="th">บุรีรัมย์ลีก อคาเดมี่</div><div class="en">Buriram League Academy · Season 2026</div></div></div><div class="badge">นัดที่ ${round} · ฤดูกาล 2026</div></div>
<div class="title"><div class="md">Match Report · รอบที่ ${round}</div><div class="h1">สรุป<span>การแข่งขัน</span></div><div class="where">${esc(dateText)}${venueText ? ' · ' + esc(venueText) : ''}</div></div>
<div class="card"><div class="vs">${team(hs, 'เจ้าบ้าน · ชนะ ' + hw + ' รุ่น')}<div class="mid"><div class="ft"><b>FT</b><small>จบเกม</small></div></div>${team(as, 'ทีมเยือน · ชนะ ' + aw + ' รุ่น')}</div>
<div class="rows">${rows}</div>${P}<div class="msg">ขอบคุณทั้งสองทีม สนามเจ้าภาพ และผู้ปกครองทุกท่าน 🙏</div></div>
<div class="foot"><span>ผลและตารางคะแนนทุกคู่: buriram-league-academy.netlify.app</span><span>ติดตามผลที่ Facebook: Buriram League Academy</span></div>
</div></body></html>`;
const hp = path.join(DIR, 'match-summary.html'); fs.writeFileSync(hp, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'match-summary.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1350', '--virtual-time-budget=8000', '--screenshot=' + png, 'file:///' + hp.split('\\').join('/')], { stdio: 'ignore' });
const jpg = path.join(DIR, '..', 'assets', 'img', 'round-posters', name + '.jpg');
execFileSync(FF, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg);
