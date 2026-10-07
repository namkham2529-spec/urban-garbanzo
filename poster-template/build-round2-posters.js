// build-round2-posters.js — writes posters-round2.json (per-match fixture posters for round 2) from data.js,
// then: POSTERS_JSON=posters-round2.json node make-posters.js   -> assets/img/round-posters/round2-matchK.jpg
// Kongfang's match is listed LAST (BLA page neutrality).
const fs = require('fs'), path = require('path'), vm = require('vm');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'posters.json'), 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'data.js'), 'utf8'), ctx);
const B = ctx.window.BLA, N = Number(process.argv[2] || 2), r = B.schedule.find(x => x.round === N);
const slugOf = n => B.teams.find(t => t.name === n).slug;
const longDate = d => d.replace(/^อาทิตย์ /, 'วันอาทิตย์ที่ ').replace(/^อังคาร /, 'วันอังคารที่ ').replace(' ต.ค. ', ' ตุลาคม ');
const isKf = m => [m.home, m.away].some(n => slugOf(n) === 'kongfang-united');
const order = r.matches.filter(m => !isKf(m)).concat(r.matches.filter(isKf));
const STD = { U14: '10:00', U12: '11:00', U10: '13:00', U8: '14:00' };
const out = JSON.parse(JSON.stringify(base));
out.round = N; out.badge = `นัดที่ ${N} · ฤดูกาล 2026`; out.matchdayLine = `Matchday · รอบที่ ${N}`;
out.headline1 = `โปรแกรมนัดที่ ${N}`; out.headline2 = '2026';
out.dateLong = longDate(r.date);
out.matches = order.map(m => {
  const t = m.times, special = !!t;
  const slots = ['U14', 'U12', 'U10', 'U8'].map(a => ({ age: a, time: special ? String(t[a]).slice(0, 5) : STD[a] }));
  const parentTime = special && t.parent ? String(t.parent).slice(0, 5) : null;
  return {
    home: slugOf(m.home), away: slugOf(m.away),
    dateLong: m.date ? longDate(m.date) : undefined,
    venue: (/^สนาม/.test(m.venue) ? '' : 'สนาม ') + m.venue,
    venueNote: special ? undefined : 'เวลาแข่งตามมาตรฐานลีก · ทีมเจ้าบ้านจะแจ้งเพิ่มหากปรับ',
    slots,
    parent: { label: 'รุ่นผู้ปกครอง', detail: parentTime ? `เริ่ม ${parentTime} น.` : 'แข่งช่วงระหว่างกลาง' }
  };
});
fs.writeFileSync(path.join(__dirname, `posters-round${N}.json`), JSON.stringify(out, null, 2), 'utf8');
console.log('matches:', out.matches.map(m => m.home + '-' + m.away).join(' | '));
