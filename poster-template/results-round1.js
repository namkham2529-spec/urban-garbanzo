// Round-1 scores as reported by clubs (2026-10-04) -> bla-results-backup format
const fs=require('fs'),path=require('path');
const m=(h,a,s)=>[h,a,s];
const rows=[
 ["กองฟาง ยูไนเต็ด","อีเลฟเว่น อะคาเดมี่",{U14:[1,2],U12:[9,0],U10:[5,2],U8:[3,5]}],
 ["เบส","บัวหลวง อะคาเดมี่",{U14:[3,3],U12:[1,3],U10:[3,2],U8:[4,3]}],
 ["แสงเพชร","ราชสีมา อะคาเดมี่",{U14:[4,5],U12:[1,4],U10:[3,3],U8:[3,10]}],
 ["ยูจิน x เอแมน","เกรียรัมย์",{U14:[2,0],U12:[11,1],U10:[1,5],U8:[0,7],P:[4,4]}],
 ["ชัยกร อะคาเดมี่","โซล",{U14:[3,2],U12:[0,0],U10:[1,3],U8:[5,1],P:[3,0]}],
 ["เซเว่น","ลำปลายมาศ",{U14:[4,0],U12:[1,2],U10:[0,1],U8:[2,3]}]];
const R={};
rows.forEach(([h,a,s])=>{R["1|"+h+"|"+a]={};for(const k in s)R["1|"+h+"|"+a][k]={h:String(s[k][0]),a:String(s[k][1])}});
fs.writeFileSync(path.join(__dirname,'results-round1.json'),JSON.stringify(R,null,1),'utf8');
