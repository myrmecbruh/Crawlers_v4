// every top-level name declared in more than one script: a later script silently replaces an earlier one
const fs=require('fs'),files=['data','world','sim','art','render','sound','ui'],seen={};
for(const f of files){const s=fs.readFileSync((process.argv[2]||'.')+'/js/'+f+'.js','utf8');
 for(const m of s.matchAll(/^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm)){const n=m[1]||m[2];(seen[n]=seen[n]||[]).push(f);}
 for(const m of s.matchAll(/^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=[^;]*?,\s*([A-Za-z_$][\w$]*)\s*=/gm)){}}
const dup=Object.entries(seen).filter(([n,a])=>a.length>1);console.log(dup.length?dup.map(([n,a])=>n+': '+a.join(', ')).join('\n'):'no clashes');
