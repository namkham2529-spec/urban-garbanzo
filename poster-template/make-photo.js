// make-photo.js — club photo post: the original photo, untouched, with ONLY the BLA logo tile top-left.
// No castle artwork, no text overlay (user rule, 2026-10-04). Details go in the caption.
//   node make-photo.js <photo> <out-name> [logo.png]   (default logo = BLA; pass a club crest for the club's own page)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FFMPEG = 'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const [photo, name, logoArg] = process.argv.slice(2);

fs.mkdirSync(path.join(DIR, 'teams-photo'), { recursive: true });
fs.copyFileSync(photo, path.join(DIR, 'teams-photo', name + '.jpg'));
fs.copyFileSync(logoArg || path.join(DIR, '..', 'assets', 'img', 'bla-league.png'), path.join(DIR, 'photo-logo.png'));

// probe size via ffmpeg stderr
let W = 1477, H = 1108;
try { execFileSync(FFMPEG, ['-i', photo], { stdio: 'pipe' }); } catch (e) {
  const m = /Stream #0.*?, (\d{2,5})x(\d{2,5})/.exec(String(e.stderr)); if (m) { W = +m[1]; H = +m[2]; }
}
const s = Math.round(Math.min(W, H) * 0.115);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000}
.p{position:relative;width:${W}px;height:${H}px}
.p img.ph{width:${W}px;height:${H}px;display:block}
.logo{position:absolute;left:${Math.round(s * .2)}px;top:${Math.round(s * .2)}px;width:${s}px;height:${s}px;border-radius:${Math.round(s * .24)}px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.logo img{width:80%;height:80%;object-fit:contain}
</style></head><body><div class="p"><img class="ph" src="teams-photo/${name}.jpg"><div class="logo"><img src="photo-logo.png"></div></div></body></html>`;
const htmlPath = path.join(DIR, 'photo-post.html');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
const png = path.join(DIR, 'out', 'photo-post.png');
execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--window-size=${W},${H}`, '--virtual-time-budget=4000', `--screenshot=${png}`, 'file:///' + htmlPath.replace(/\\/g, '/')], { stdio: 'ignore' });
const jpg = path.join(DIR, '..', 'assets', 'img', 'round-posters', name + '.jpg');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-q:v', '2', jpg]);
console.log('wrote', jpg, W + 'x' + H);
