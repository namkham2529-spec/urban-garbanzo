// apply-results.js — write a results-tool backup JSON into assets/js/data.js `results`.
//   node apply-results.js results-round1.json
const fs = require('fs');
const path = require('path');
const R = JSON.parse(fs.readFileSync(path.resolve(__dirname, process.argv[2] || 'results-round1.json'), 'utf8'));
const out = [];
for (const k in R) {
  const [r, h, a] = k.split('|');
  for (const g of ['U14', 'U12', 'U10', 'U8']) {
    const s = R[k][g];
    if (s && s.h !== '' && s.a !== '') out.push(`    { round:${r}, ageGroup:"${g}", home:"${h}", away:"${a}", hs:${+s.h}, as:${+s.a} }`);
  }
}
const file = path.join(__dirname, '..', 'assets', 'js', 'data.js');
let d = fs.readFileSync(file, 'utf8');
d = d.replace(/results: \[[\s\S]*?\n?\s*\]\s*\n\};/, 'results: [\n' + out.join(',\n') + '\n  ]\n};');
fs.writeFileSync(file, d, 'utf8');
console.log('results written:', out.length);
