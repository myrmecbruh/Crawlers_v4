// Writes the game's data tables as spreadsheets (CSV) into docs/sheets/, so they can be read as tables on GitHub.
// Run: node tools/sheet.js
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.join(__dirname,'..'),ctx={console,Math};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/js/data.js','utf8')+';this.T={materials:M.slice(1),items:ITEM,features:FEAT,cards:CARD,goals:GOAL};',ctx);
const out=root+'/docs/sheets';fs.mkdirSync(out,{recursive:true});
const cell=v=>{if(v==null)return'';const s=typeof v==='object'?JSON.stringify(v):String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
for(const [name,t] of Object.entries(ctx.T)){const rows=Array.isArray(t)?t.map((r,i)=>Object.assign({id:i+1},r)):Object.entries(t).map(([k,r])=>Object.assign({id:k},r));
 const cols=[];for(const r of rows)for(const k in r)if(!cols.includes(k))cols.push(k);
 fs.writeFileSync(out+'/'+name+'.csv',[cols.join(','),...rows.map(r=>cols.map(c=>cell(r[c])).join(','))].join('\n')+'\n');}
console.log('wrote',Object.keys(ctx.T).map(n=>'docs/sheets/'+n+'.csv').join(' '));
