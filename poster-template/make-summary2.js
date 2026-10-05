// make-summary2.js — round-N fixtures summary poster (all matches) from data.js + posters.json
//   node make-summary2.js 2      -> assets/img/round-posters/round2-summary.jpg
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');
const DIR = __dirname, N = Number(process.argv[2] || 2);
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fileUrl = p => 'file:///' + p.split('\\').join('/');
const base = JSON.parse(fs.readFileSync(path.join(DIR, 'posters.json'), 'utf8'));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const B = ctx.window.BLA, r = B.schedule.find(x => x.round === N);
const slugOf = n => B.teams.find(t => t.name === n).slug;
const dateTh = r.date.replace(/^อาทิตย์ /, 'วันอาทิตย์ที่ ');
const data = JSON.parse(JSON.stringify(base));
data.round = N;
data.badge = `นัดที่ ${N} · ฤดูกาล 2026`;
data.headline1 = 'โปรแกรมนัดที่';
data.headline2 = String(N);
data.matches = r.matches.map(m => ({ home: slugOf(m.home), away: slugOf(m.away) }));
data.summary = {
  matchday: `Matchday · รอบที่ ${N} · ครบ ${r.matches.length} คู่`,
  dateVenue: `${dateTh} · ปราสาทหินพนมรุ้ง · บุรีรัมย์`,
  captions: r.matches.map(m => `สนาม ${m.venue} · เจ้าบ้าน ${data.teams[slugOf(m.home)].th}`),
  agesLabel: 'เวลาแข่งขันมาตรฐานตามรุ่นอายุ:',
  ages: base.summary.ages,
  note: '* เวลาแข่งตามมาตรฐานลีก — สนามที่ปรับเวลา ทีมเจ้าบ้านจะแจ้งเพิ่มเติม · รุ่นผู้ปกครองคั่นระหว่างโปรแกรม'
};
const html = require('./summary-part.js')(data, esc);
const hp = path.join(DIR, 'summary2.html');
fs.writeFileSync(hp, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'summary2.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=1080,1200',
  '--virtual-time-budget=8000', '--screenshot=' + png, fileUrl(hp)], { stdio: 'ignore' });
const jpg = path.join(DIR, '..', 'assets', 'img', 'round-posters', `round${N}-summary.jpg`);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg);
