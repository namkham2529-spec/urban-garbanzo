// summary poster (reference "00_สรุปครบ6คู่" layout) — required by make-posters.js
module.exports = function summaryHtml(data, esc) {
  const sm = data.summary;
  const rows = data.matches.map((m, i) => {
    const h = data.teams[m.home], a = data.teams[m.away];
    return `<div class="srow"><div class="sline">
      <div class="num">${i + 1}</div>
      <div class="stile"><img src="teams/${m.home}.png"></div>
      <div class="sn l">${esc(h.th)}</div>
      <div class="svs">VS</div>
      <div class="sn r">${esc(a.th)}</div>
      <div class="stile"><img src="teams/${m.away}.png"></div></div>
      <div class="scap">${esc(sm.captions[i])}</div></div>`;
  }).join('');
  const ages = sm.ages.map(x => `<span style="color:${x[2]}">${x[0]} <b>${x[1]}</b></span>`).join('');
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800;900&family=Sarabun:wght@400;500;600;700&family=Saira+Condensed:wght@600;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:#0A1B3D}
.poster{width:1080px;height:1200px;box-sizing:border-box;position:relative;overflow:hidden;background:#0A1B3D;padding:44px 52px 34px;color:#EAF1FB;font-family:'Sarabun',sans-serif;display:flex;flex-direction:column}
.castle{position:absolute;left:50%;top:-30px;width:1400px;max-width:none;transform:translateX(-50%);filter:invert(1) sepia(.55) saturate(4.5) hue-rotate(-10deg) brightness(.95) contrast(1.05);mix-blend-mode:screen;opacity:.55;z-index:0}
.fade{position:absolute;left:0;right:0;top:0;height:640px;background:linear-gradient(180deg,rgba(7,20,49,.35),rgba(10,27,61,.8) 60%,#0A1B3D 95%);z-index:0}
.fade2{position:absolute;left:0;right:0;top:620px;bottom:0;background:#0A1B3D;z-index:0}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:12px}.brand img{width:52px;height:52px;background:#fff;border-radius:13px;padding:5px;box-sizing:border-box;object-fit:contain}
.brand .th{font-family:Kanit;font-weight:800;font-size:19px;color:#fff;display:block}.brand .en{font-family:'Saira Condensed';font-weight:700;font-size:11px;letter-spacing:.18em;color:#C4D2EA;text-transform:uppercase}
.badge{display:inline-flex;align-items:center;gap:8px;font-family:'Saira Condensed';font-weight:700;letter-spacing:.12em;font-size:13px;color:#FFD86A;border:1px solid rgba(242,184,7,.45);border-radius:999px;padding:7px 15px;background:rgba(7,20,49,.55)}
.badge i{width:7px;height:7px;border-radius:50%;background:#F2B807;box-shadow:0 0 10px #F2B807}
.hero{text-align:center;margin-top:44px}
.md{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.4em;color:#FFD86A;text-transform:uppercase;text-shadow:0 2px 14px rgba(0,0,0,.85)}
.h1{font-family:Kanit;font-weight:900;font-size:56px;line-height:1.1;color:#fff;margin-top:8px;text-shadow:0 6px 10px rgba(0,0,0,.55),0 12px 34px rgba(0,0,0,.65)}.h1 span{color:#FFD86A}
.dv{font-family:'Saira Condensed';font-weight:700;font-size:15px;letter-spacing:.2em;color:#EAF1FB;margin-top:10px;text-shadow:0 2px 12px rgba(0,0,0,.85)}
.list{margin-top:26px;display:flex;flex-direction:column;gap:8px}
.srow{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(180,205,245,.24);border-radius:20px;padding:10px 20px 8px}
.sline{display:flex;align-items:center;gap:14px}
.num{width:34px;height:34px;border-radius:50%;background:rgba(242,184,7,.18);border:1px solid rgba(242,184,7,.55);color:#FFD86A;font-family:Kanit;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;flex:none}
.stile{width:58px;height:58px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 8px 18px -8px rgba(0,0,0,.6)}
.stile img{width:78%;height:78%;object-fit:contain}
.sn{font-family:Kanit;font-weight:700;font-size:22px;color:#fff;flex:1;white-space:nowrap}.sn.r{text-align:right}
.svs{font-family:Kanit;font-weight:900;font-size:18px;color:#F2B807;flex:none;width:44px;text-align:center}
.scap{text-align:center;font-family:'Saira Condensed';font-weight:600;font-size:14px;color:#93A7CB;margin-top:5px;letter-spacing:.03em}
.ages{margin-top:14px;border:1px solid rgba(180,205,245,.24);background:rgba(255,255,255,.04);border-radius:16px;padding:12px 18px;display:flex;align-items:center;justify-content:center;gap:22px;font-family:Kanit;font-weight:800;font-size:19px}
.ages .lb{font-family:Sarabun;font-weight:600;font-size:16px;color:#C4D2EA}.ages b{font-weight:700;font-family:'Saira Condensed';font-size:18px;color:#fff}
.note{margin-top:10px;text-align:center;font-family:Sarabun;font-size:13px;color:#93A7CB;line-height:1.45}
.foot{margin-top:auto;padding-top:14px;border-top:1px solid rgba(180,205,245,.16);display:flex;justify-content:space-between;align-items:center}
.foot .a{font-family:'Saira Condensed';font-size:12px;color:#6E82A6}.foot .b{font-family:'Saira Condensed';font-weight:700;font-size:12px;letter-spacing:.08em;color:#93A7CB}.foot .b i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#F2B807;margin-right:8px}
</style></head><body><div class="poster"><img class="castle" src="castle-bg.jpg"><div class="fade"></div><div class="fade2"></div>
<div class="wrap">
 <div class="top"><div class="brand"><img src="bla-league.png"><div><span class="th">บุรีรัมย์ลีก อคาเดมี่</span><span class="en">Buriram League Academy · Season 2026</span></div></div><div class="badge"><i></i>${esc(data.badge)}</div></div>
 <div class="hero"><div class="md">— ${esc(sm.matchday)} —</div><div class="h1">${esc(data.headline1)} <span>${esc(data.headline2)}</span></div><div class="dv">${esc(sm.dateVenue)}</div></div>
 <div class="list">${rows}</div>
 <div class="ages"><span class="lb">${esc(sm.agesLabel)}</span>${ages}</div>
 <div class="note">${esc(sm.note)}</div>
 <div class="foot"><div class="a">${esc(data.footerRules)}</div><div class="b"><i></i>${esc(data.footerFb)}</div></div>
</div></div></body></html>`;
};
