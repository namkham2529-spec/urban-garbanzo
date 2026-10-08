// make-alpha-posters.js — re-render the generated poster HTML (match1..6.html, summary2.html) WITHOUT the castle/solid
// background (a light navy scrim only) as transparent PNGs, for compositing over video (build-hype3.js).
// Run the poster generators first (POSTERS_JSON=posters-round2.json node make-posters.js ; node make-summary2.js 2).
//   node make-alpha-posters.js  -> out/alpha/match1..6.png , out/alpha/summary.png  (2x)
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const DIR = __dirname, EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(DIR, 'out', 'alpha'); fs.mkdirSync(OUT, { recursive: true });
const fileUrl = p => 'file:///' + p.split('\\').join('/');
const jobs = [1, 2, 3, 4, 5, 6].map(k => ({ src: `match${k}.html`, out: `match${k}.png`, w: 1080, h: 1350 })).concat([{ src: 'summary2.html', out: 'summary.png', w: 1080, h: 1200 }]);
for (const j of jobs) {
  let h = fs.readFileSync(path.join(DIR, j.src), 'utf8');
  h = h.replace(/<img class="castle"[^>]*>/g, '').replace(/<div class="fade[12]?"><\/div>/g, '');
  h = h.replace('html,body{margin:0;background:#0A1B3D}', 'html,body{margin:0;background:transparent}');
  h = h.replace(/(\.poster\{[^}]*?)background:#0A1B3D;/, '$1background:linear-gradient(180deg,rgba(6,16,40,.58),rgba(6,16,40,.38) 50%,rgba(6,16,40,.58));border-radius:44px;');
  const tmp = path.join(DIR, 'alpha-' + j.src); fs.writeFileSync(tmp, h, 'utf8');
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', '--force-device-scale-factor=2',
    `--window-size=${j.w},${j.h}`, '--virtual-time-budget=8000', '--screenshot=' + path.join(OUT, j.out), fileUrl(tmp)], { stdio: 'ignore' });
  console.log('alpha', j.out);
}
