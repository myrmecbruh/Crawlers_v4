'use strict';
const $=id=>document.getElementById(id),panel=$('panel');
let tool='look',tab='colony',info=null,psel={},pgoal='ore',timer=null,askNew=false;
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pips=(n,m,ch)=>'<span class="pp">'+(ch||'●').repeat(n)+'</span><span class="po">'+'○'.repeat(Math.max(0,m-n))+'</span>';
const itn=t=>t?(t.card?'card':t.corpse?'body of '+t.corpse:(t.flawed?'flawed ':'')+M[t.m].n+(t.it?' '+ITEM[t.it].n.toLowerCase():'')):'–';
function jobName(c){if(c.down)return c.home?'down, mending':'DOWN';if(c.asleep)return'asleep';const j=c.job;if(!j)return'idle';
 const n={wait:'idle',fetch:{stock:'hauling',site:'supplying',fuel:'fuelling',cook:'cooking',wear:'gearing up',arm:'arming',keep:'looting'}[j.to],gather:'gathering',dig:'digging',make:'making',eat:'eating',sleep:'to bed',rescue:'rescuing',fight:'FIGHTING',home:'heading home',drop:'hauling'}[j.t]||j.t;
 return(c.party?'⚑ ':'')+n;}
function setSpeed(s){G.speed=s;clearInterval(timer);timer=null;if(s>0)timer=setInterval(step,1000/s);render();}
let animT=0;
// Walking is drawn between ticks at about 12 frames a second, and only while someone is moving at 1x or 4x. [slop]
function frame(){if(!timer||G.speed>4)return;redraw();if((performance.now()-G._tickAt)*G.speed/1000<1)animT=setTimeout(frame,80);}
function step(){tick();G._tickAt=performance.now();render();redraw();clearTimeout(animT);
 if(G.speed<=4&&(G.cols.some(c=>c._mv===G.t)||G.crit.some(e=>e._mv===G.t)))animT=setTimeout(frame,80);}
function tabColony(){
 let h='';const cd=G.card;
 h+='<div class="box"><b>Card of the day</b> '+(cd?'<span class="k-'+CARD[cd.k].kind+'">'+CARD[cd.k].n+'</span> '+(CARD[cd.k].pips?pips(cd.pips,CARD[cd.k].pips,'◆'):'')+'<br><i>'+CARD[cd.k].t+'</i>':'<i>none drawn yet</i>')+'</div>';
 const n=counts(),st=Object.keys(n.m).map(m=>'<span class="chip"><i style="background:'+M[m].c+'"></i>'+M[m].n+' '+n.m[m]+'</span>').join('');
 h+='<div class="box"><b>Tokens in the plot</b><br>'+(st||'<i>none</i>')+'</div>';
 for(const c of G.cols){const q=c.need;
  h+='<button class="row'+(c.id===G.sel?' on':'')+'" data-a="sel" data-v="'+c.id+'"><b>'+c.name+'</b> <span class="dim">'+jobName(c)+'</span><br>'+
   '<span class="nd">Hunger '+pips(q.hun,6)+'</span><span class="nd">Rest '+pips(q.rest,6)+'</span><span class="nd">Cold '+pips(q.temp,6)+'</span><span class="nd">Stress '+pips(q.str,6)+'</span><span class="nd">Wounds '+pips(wounds(c),3)+'</span></button>';
  if(c.id!==G.sel)continue;
  h+='<div class="box det">'+TRS.map((t,i)=>'<span class="chip'+(c.scars.includes(i)?' scar':'')+'">'+t+' '+c.tr[i]+(c.scars.includes(i)?' ✗6+':'')+'</span>').join('')+'<br>';
  const sk=Object.keys(Object.assign({},c.sk,c.mk)).filter(s=>c.sk[s]||c.mk[s]);
  h+='<b>Skills</b> '+(sk.length?sk.map(s=>'<span class="chip">'+s+' '+(c.sk[s]||0)+' <span class="dim">marks '+(c.mk[s]||0)+'/'+([2,4,6][c.sk[s]||0]||'–')+'</span></span>').join(''):'<i>none yet: skills come from failing</i>')+'<br>';
  h+='<table>'+AREA.map((a,i)=>'<tr><td>'+a+'</td><td>'+itn(c.worn[i])+'</td><td class="pp">'+'✚'.repeat(c.wd[i])+'</td></tr>').join('')+
   '<tr><td>Hands</td><td>'+itn(c.hands[0])+' / '+itn(c.hands[1])+'</td><td></td></tr><tr><td>Carrying</td><td>'+(c.carry.map(itn).join(', ')||'–')+' <span class="dim">('+c.carry.length+'/'+cap(c)+')</span></td><td></td></tr></table></div>';}
 if(G.over)h+='<div class="box k-bane"><b>No one is left.</b></div>';
 h+='<div class="box">'+(askNew?'<b class="k-bane">Abandon this settlement?</b> <button data-a="new">Yes, new world</button><button data-a="keep">Keep it</button>':'<button data-a="new">New world</button> <span class="dim">Autosaves in this browser.'+(window.VERSION?' Version '+window.VERSION+'.':'')+'</span>')+'</div>';
 return h;
}
function tabOrders(){
 const T=[['look','Look'],['dig','Dig'],['place','Place stone'],['stock','Stockpile'],['hearth','Hearth'],['bench','Workbench'],['cancel','Cancel']];
 const hint={look:'Tap a tile or a person to inspect.',dig:'Tap tiles inside the walls to mark the top voxel for digging.',place:'Tap a tile to have a stone token set on it as a voxel.',stock:'Tap tiles to add or remove stockpile ground.',hearth:'Tap a tile: needs 2 stone tokens. Burns wood for warmth and cooks.',bench:'Tap a tile: needs 2 wood tokens. Makes tools and gear.',cancel:'Tap a marked tile to clear the order.'};
 let h='<div class="box">'+T.map(t=>'<button class="tool'+(tool===t[0]?' on':'')+'" data-a="tool" data-v="'+t[0]+'">'+t[1]+'</button>').join('')+'<br><i>'+hint[tool]+'</i></div>';
 if(info)h+='<div class="box"><b>'+info.x+','+info.y+'</b> '+esc(info.t)+'</div>';
 const b=bench();
 if(!b)h+='<div class="box dim">Build a workbench to make things.</div>';
 else{const n=counts();h+='<div class="box"><b>Workbench</b> <span class="dim">tap to queue; uses that many tokens</span><br>';
  for(const k in ITEM){const it=ITEM[k],ms=Object.keys(n.m).filter(m=>it.fam.includes(M[m].f)&&+m!==19);
   h+='<div class="bill">'+it.n+' <span class="dim">×'+it.cost+'</span> '+(ms.length?ms.map(m=>'<button'+(n.m[m]<it.cost?' disabled':'')+' data-a="bill" data-v="'+k+':'+m+'"><i style="background:'+M[m].c+'"></i>'+M[m].n+'</button>').join(''):'<span class="dim">no '+it.fam.join('/')+'</span>')+'</div>';}
  h+='</div>';}
 if(G.sites.length)h+='<div class="box"><b>Pending</b><br>'+G.sites.map(s=>'<span class="chip">'+(s.kind==='bill'?M[s.m].n+' '+ITEM[s.it].n:s.kind)+' '+s.have+'/'+s.need+' <a data-a="unsite" data-v="'+s.id+'">✕</a></span>').join('')+'</div>';
 return h;
}
function tabParty(){
 let h='';const e=G.exp;
 if(!e){h+='<div class="box"><b>Send a party through the gate</b><br>';
  for(const c of G.cols)h+='<button class="tool'+(psel[c.id]?' on':'')+'"'+(c.down?' disabled':'')+' data-a="psel" data-v="'+c.id+'">'+c.name+' <span class="dim">'+wounds(c)+' wd, carries '+cap(c)+'</span></button>';
  if(pgoal==='rescue'&&G.cols.length>=6)pgoal='ore';
  h+='<br><b>Goal</b><br>'+Object.keys(GOAL).map(k=>'<button class="tool'+(pgoal===k?' on':'')+'"'+(k==='rescue'&&G.cols.length>=6?' disabled':'')+' data-a="pgoal" data-v="'+k+'">'+GOAL[k].n+'</button>').join('')+'<br><i>'+GOAL[pgoal].t+'</i><br><button class="big" data-a="send"'+(G.cols.some(c=>psel[c.id]&&!c.down)?'':' disabled')+'>Send</button><br><i>They arm themselves from the stockpile, go out, and decide the rest. A weapon in the hand is a hand that carries nothing.</i></div>';}
 else{h+='<div class="box"><b>'+GOAL[e.goal].n+': party is '+(e.state==='return'?'coming home':'out')+'</b><br>';
  for(const c of G.cols)if(c.party)h+='<span class="chip">'+c.name+': '+jobName(c)+', '+c.carry.length+'/'+cap(c)+'</span>';
  h+='<br><button class="big" data-a="recall"'+(e.state==='return'?' disabled':'')+'>🔔 Recall bell</button></div>';}
 h+='<div class="box dim">Beyond the gate: '+(G.zone.on?'an open zone, '+G.crit.length+' creatures stirring.':'nothing you can see. A new place, with a new shape, is generated each time; it is forgotten when everyone is back inside.')+'</div>';
 return h;
}
function tabCards(){const f=d=>'<span class="chip k-'+CARD[d.k].kind+'">'+CARD[d.k].n+(CARD[d.k].pips?' '+pips(d.pips,CARD[d.k].pips,'◆'):'')+'</span>';
 return'<div class="box"><b>Draw pile</b> ('+G.deck.length+')<br>'+G.deck.map(f).join('')+'</div><div class="box"><b>Discard</b> ('+G.discard.length+')<br>'+G.discard.map(f).join('')+'</div><div class="box dim">One card is drawn each dawn [slop]. Caches beyond the gate hold new cards.</div>';}
function tabLog(){return'<div class="box log">'+G.log.slice().reverse().map(l=>'<div'+(/FAIL|DOWN|dies|wounded/.test(l)?' class="k-bane"':'')+'>'+esc(l)+'</div>').join('')+'</div>';}
function render(){
 $('date').textContent=SEASON[season()]+' '+(day()%6+1)+', year '+(Math.floor(day()/24)+1)+' · '+(night()?'night':tod()<60?'morning':tod()<120?'midday':'evening');
 $('tilt').classList.toggle('on',!!cam.tilt);
 document.querySelectorAll('#spd button').forEach(b=>b.classList.toggle('on',+b.dataset.v===G.speed));
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===tab));
 // Never rebuild the panel under a finger or mouse button: a button replaced between press and release gets no click.
 if(held_){pend=true;return;}
 const h={colony:tabColony,orders:tabOrders,party:tabParty,cards:tabCards,log:tabLog}[tab]();
 if(h===lastH)return;lastH=h;
 const st=panel.scrollTop;panel.innerHTML=h;panel.scrollTop=st;
}
function tap(p){
 const k=K(p.x,p.y),inner=p.x<PW&&G.mask[I(p.x,p.y)]===2&&!(p.x===47&&p.y===24);
 if(tool==='look'){const c=G.cols.find(c=>c.x===p.x&&c.y===p.y);if(c){G.sel=c.id;tab='colony';}
  const f=featAt(p.x,p.y),t=G.tok[k]||[],fog=p.x>=PW&&!G.rev[I(p.x,p.y)];
  info={x:p.x,y:p.y,t:fog?'Fog.':M[topMat(p.x,p.y)].n+' ('+M[topMat(p.x,p.y)].f+', hard '+M[topMat(p.x,p.y)].h+(M[topMat(p.x,p.y)].kw?', '+M[topMat(p.x,p.y)].kw:'')+'), height '+topZ(p.x,p.y)+(f?'. '+FEAT[f.k].n+(f.left>0?'':' (regrowing)'):'')+(t.length?'. Tokens: '+t.map(itn).join(', '):'')};}
 else if(!inner){info={x:p.x,y:p.y,t:'Orders only work inside the walls.'};}
 else if(tool==='dig'){if(G.digs[k])delete G.digs[k];else if(topZ(p.x,p.y)>1)G.digs[k]=1;}
 else if(tool==='stock'){if(G.stock[k])delete G.stock[k];else G.stock[k]=1;}
 else if(tool==='cancel'){delete G.digs[k];G.sites=G.sites.filter(s=>!(s.x===p.x&&s.y===p.y&&s.kind!=='bill'));}
 else if(!G.sites.some(s=>s.x===p.x&&s.y===p.y)&&!featAt(p.x,p.y)){
  if(tool==='place')G.sites.push({id:G.nid++,kind:'voxel',x:p.x,y:p.y,spec:{fam:'stone'},need:1,have:0,m:0});
  else if(!G.feats.some(f=>f.k===tool)&&!G.sites.some(s=>s.kind===tool))G.sites.push({id:G.nid++,kind:tool,x:p.x,y:p.y,spec:{fam:tool==='hearth'?'stone':'wood'},need:2,have:0,m:0});
  else info={x:p.x,y:p.y,t:'Only one '+tool+' in this prototype.'};}
 render();redraw();
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el||el.disabled)return;const a=el.dataset.a,v=el.dataset.v;
 if(a==='tab')tab=v;else if(a==='tool'){tool=v;info=null;}else if(a==='sel')G.sel=G.sel===+v?null:+v;
 else if(a==='speed')return setSpeed(+v);
 else if(a==='zoom'){cam.s=Math.max(1,Math.min(4,cam.s+ +v));}
 else if(a==='turn')setView(cam.yaw+ +v,cam.tilt);else if(a==='tilt')setView(cam.yaw,cam.tilt?0:1);
 else if(a==='psel')psel[v]=!psel[v];else if(a==='pgoal')pgoal=v;
 else if(a==='send'){const ids=G.cols.filter(c=>psel[c.id]&&!c.down).map(c=>c.id);if(ids.length){sendParty(ids,pgoal);psel={};}}
 else if(a==='recall')recall();
 else if(a==='bill'){const p=v.split(':'),b=bench();G.sites.push({id:G.nid++,kind:'bill',it:p[0],m:+p[1],x:b.x,y:b.y,spec:{m:+p[1]},need:ITEM[p[0]].cost,have:0});}
 else if(a==='unsite'){const s=G.sites.find(s=>s.id===+v);if(s){for(let i=0;i<s.have;i++)addTok(s.x,s.y,{m:s.m});G.sites=G.sites.filter(q=>q!==s);}}
 else if(a==='new'){if(askNew){askNew=false;newGame((Math.random()*1e9)|0);save();}else askNew=true;}
 else if(a==='keep')askNew=false;
 render();redraw();
});
let held_=false,pend=false,lastH='';
$('ui').addEventListener('pointerdown',()=>{held_=true;});
const rel=()=>{if(!held_)return;held_=false;setTimeout(()=>{if(pend){pend=false;render();}},0);};
window.addEventListener('pointerup',rel);window.addEventListener('pointercancel',rel);
let drag=null;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,mv:false};});
cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.mv&&Math.abs(dx)+Math.abs(dy)<8)return;drag.mv=true;cam.x=drag.cx-dx/cam.s;cam.y=drag.cy-dy/cam.s;redraw();});
cv.addEventListener('pointerup',e=>{if(drag&&!drag.mv){const r=cv.getBoundingClientRect(),p=pick(e.clientX-r.left,e.clientY-r.top);if(p)tap(p);}drag=null;});
cv.addEventListener('pointercancel',()=>{drag=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();cam.s=Math.max(1,Math.min(4,cam.s+(e.deltaY<0?1:-1)));redraw();},{passive:false});
window.addEventListener('resize',fit);
document.addEventListener('keydown',e=>{if(e.code==='KeyQ')setView(cam.yaw-1,cam.tilt);else if(e.code==='KeyE')setView(cam.yaw+1,cam.tilt);else if(e.code==='KeyR')setView(cam.yaw,cam.tilt?0:1);else if(e.code==='Space'){e.preventDefault();setSpeed(G.speed?0:1);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();clearInterval(timer);timer=null;}else{checkUpdate();if(G.speed>0&&!timer)setSpeed(G.speed);}});
// When a newer version has been published, save and reload onto it. Checked every two minutes and whenever the page is shown again.
function checkUpdate(){if(!window.VERSION)return;fetch('version.txt?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{t=t.trim();
 if(t&&t!==window.VERSION){save();location.replace(location.pathname+'?v='+encodeURIComponent(t));}}).catch(()=>{});}
setInterval(checkUpdate,120000);
if(!load())newGame((Math.random()*1e9)|0);
fit();setSpeed(G.speed||1);
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
