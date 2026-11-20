'use strict';
const $=id=>document.getElementById(id),panel=$('panel');
let tool='look',tab='colony',info=null,psel={},pgoal='ore',timer=null,askNew=false;
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pips=(n,m,ch)=>'<span class="pp">'+(ch||'●').repeat(n)+'</span><span class="po">'+'○'.repeat(Math.max(0,m-n))+'</span>';
const itn=t=>t?(t.card?'card':t.corpse?'body of '+t.corpse:(t.blight?'blighted ':'')+(t.flawed?'flawed ':'')+M[t.m].n+(t.it?' '+ITEM[t.it].n.toLowerCase():'')):'–';
function jobName(c){if(c.down)return c.home?'down, mending':'DOWN';if(c.asleep)return'asleep';const j=c.job;if(!j)return'idle';
 const n={wait:'idle',fetch:{stock:'hauling',site:'supplying',fuel:'fuelling',cook:'cooking',wear:'gearing up',arm:'arming',keep:'looting'}[j.to],gather:'gathering',dig:'digging',make:'making',eat:'eating',sleep:'to bed',rescue:'rescuing',fight:'FIGHTING',home:'heading home',drop:'hauling'}[j.t]||j.t;
 return(c.party?'⚑ ':'')+(c.sick?'sick, ':'')+n;}
function setSpeed(s){G.speed=s;clearInterval(timer);timer=null;if(s>0)timer=setInterval(step,1000/s);render();}
let animT=0;
// Walking is drawn between ticks at about 12 frames a second, and only while someone is moving at 1x or 4x. [slop]
function frame(){if(!timer||G.speed>4)return;redraw();if((performance.now()-G._tickAt)*G.speed/1000<1)animT=setTimeout(frame,80);}
function step(){tick();G._tickAt=performance.now();render();redraw();clearTimeout(animT);
 if(G.speed<=4&&(G.cols.some(c=>c._mv===G.t)||G.crit.some(e=>e._mv===G.t)))animT=setTimeout(frame,80);}
// ---- Panels. Every box, list and button has a locked size and place: text that changes is cut to fit, lists keep a
// slot for every possible entry, and buttons never appear, vanish or move; they are disabled instead.
const MAXC=6;
const box=(h,lines,cls)=>'<div class="box'+(cls?' '+cls:'')+'" style="height:'+lines+'"><div class="in">'+h+'</div></div>';
function tabColony(){
 let h='';const cd=G.card;
 h+=box('<b>Card of the day</b> '+(cd?'<span class="k-'+CARD[cd.k].kind+'">'+CARD[cd.k].n+'</span> '+(CARD[cd.k].pips?pips(cd.pips,CARD[cd.k].pips,'◆'):'')+'<br><i>'+CARD[cd.k].t+'</i>':'<i>none drawn yet</i>'),'58px','clip');
 const n=counts(),st=Object.keys(n.m).map(m=>'<span class="chip tk"><i style="background:'+M[m].c+'"></i>'+M[m].n+' <b>'+n.m[m]+'</b></span>').join('');
 const og=openGoals();let gh='<div class="line"><b>Goals</b> <span class="dim">'+(G.gdone||[]).length+'/'+GOALS.length+' done · renown '+(G.renown||0)+'</span></div>';
 for(let s_=0;s_<3;s_++){const i=og[s_];gh+='<div class="goal">'+(i==null?'<i>All goals done.</i>':'<b>'+GOALS[i].n+'</b> <span class="dim">'+GOALS[i].t+'</span><br><span class="pp">reward: '+GOALS[i].r+'</span>')+'</div>';}
 h+='<div class="box" style="height:174px">'+gh+'</div>';
 // colonist cards: six fixed slots in a grid, each need on its own line
 const need=(l,v,mx)=>'<span class="nl"><span class="nk">'+l+'</span><span class="npp">'+pips(v,mx)+'</span></span>';
 h+='<div class="cgrid">';
 for(let s_=0;s_<MAXC;s_++){const c=G.cols[s_];
  if(!c){h+='<button class="ccard" disabled><span class="dim">—</span></button>';continue;}const q=c.need;
  h+='<button class="ccard'+(c.id===G.sel?' on':'')+'" data-a="sel" data-v="'+c.id+'"><span class="cn1"><b>'+c.name+'</b></span><span class="cj dim">'+jobName(c)+'</span>'+
   need('Hunger',q.hun,6)+need('Rest',q.rest,6)+need('Cold',q.temp,6)+need('Stress',q.str,6)+need('Wounds',wounds(c),3)+'</button>';}
 h+='</div>';
 const c=G.cols.find(c=>c.id===G.sel);let d='';
 if(G.over)d='<b class="k-bane">No one is left.</b>';
 else if(!c)d='<i>Tap a colonist above to see their sheet.</i>';
 else{const fr=G.cols.filter(o=>o!==c).map(o=>({o,b:Math.trunc(bond(c,o))})).filter(x=>x.b);
  d='<b>'+c.name+'</b> <span class="dim">'+(c.pers||[]).map(p=>'<span title="'+PERS[p]+'">'+p+'</span>').join(', ')+'</span>'+(c.wander>0?' <span class="k-bane">wandering</span>':'')+'<br>'+
   '<span class="small2">'+(c.pers||[]).map(p=>p+': '+PERS[p]).join(' ')+'</span><br>'+
   (fr.length?fr.map(x=>'<span class="chip">'+x.o.name+' '+(x.b>0?'<span style="color:#e08aa0">'+'♥'.repeat(x.b)+'</span>':'<span class="k-bane">'+'✗'.repeat(-x.b)+'</span>')+'</span>').join(''):'<i>no friends or grudges yet</i>')+'<br>'+TRS.map((t,i)=>'<span class="chip'+(c.scars.includes(i)?' scar':'')+'">'+t+' '+c.tr[i]+(c.scars.includes(i)?' ✗6+':'')+'</span>').join('')+'<br>';
  const sk=Object.keys(Object.assign({},c.sk,c.mk)).filter(s=>c.sk[s]||c.mk[s]);
  d+='<b>Skills</b> '+(sk.length?sk.map(s=>'<span class="chip">'+s+' '+(c.sk[s]||0)+' <span class="dim">marks '+(c.mk[s]||0)+'/'+([2,4,6][c.sk[s]||0]||'–')+'</span></span>').join(''):'<i>none yet: skills come from failing</i>')+'<br>';
  d+='<table>'+AREA.map((a,i)=>'<tr><td>'+a+'</td><td>'+itn(c.worn[i])+'</td><td class="pp">'+'✚'.repeat(c.wd[i])+'</td></tr>').join('')+
   '<tr><td>Hands</td><td>'+itn(c.hands[0])+' / '+itn(c.hands[1])+'</td><td></td></tr><tr><td>Carrying</td><td>'+(c.carry.map(itn).join(', ')||'–')+' <span class="dim">('+c.carry.length+'/'+cap(c)+')</span></td><td></td></tr></table>';}
 h+=box(d,'250px','scroll');
 h+='<div class="box" style="height:52px"><div class="in">'+(askNew?'<button class="w14 bad" data-a="new">Yes, new world</button><button class="w10" data-a="keep">Keep it</button>':
  '<button class="w14" data-a="new">New world</button><button class="w10" disabled>Keep it</button>')+'<button class="w12" data-a="full">'+(document.fullscreenElement?'Windowed':'Fullscreen')+'</button>'+'</div></div>';
 // every material the plot could hold has room, so the box never cuts anything off
 h+='<div class="box" style="height:'+(34+Math.ceil(M.length/2)*34)+'px"><b>Tokens in the plot</b><div class="tgrid">'+(st||'<i>none</i>')+'</div></div>';
 h+='<div class="dim small">Every load and every update starts a new world.'+(window.VERSION?' Version '+window.VERSION+'.':'')+'</div>';
 return h;
}
const TOOLS=[['look','Look'],['dig','Dig'],['place','Place'],['stock','Stock'],['hearth','Hearth'],['bench','Bench'],['trap','Trap'],['field','Field'],['cancel','Cancel'],['brazier','Brazier']];
const HINT={brazier:'Brazier: tap a tile at the edge of the blight (or in it). Needs 1 wood. It burns for 6 days and drives the fog back 3 tiles; the fog cannot creep near it or near the hearth.',field:'Field: tap ground tiles to add or remove a field. Someone sows a tuber there; the crop ripens in a day and a half and keeps growing back, except in winter.',trap:'Trap: tap a tile. Needs 1 metal token. A raider stepping on it may be badly hurt; it is spent either way.',look:'Tap a tile or a person to inspect.',dig:'Tap any rock to mark that voxel for digging: the top of a tile, or the side of a wall or outcrop to tunnel into it. Tap again to unmark.',place:'Place stone: tap a tile to have a stone token set on it as a voxel.',stock:'Stockpile: tap tiles to add or remove stockpile ground.',hearth:'Hearth: tap a tile. Needs 2 stone tokens; burns wood for warmth and cooks.',bench:'Workbench: tap a tile. Needs 2 wood tokens; makes tools and gear.',cancel:'Tap a marked tile to clear the order.'};
// every material an item could be made of, whether or not there is any: the buttons stay put
const MATS=k=>{const r=[];for(let m=1;m<M.length;m++)if(ITEM[k].fam.includes(M[m].f)&&m!==18&&m!==19&&m!==20)r.push(m);return r;};
function tabOrders(){
 let h='<div class="box"><div class="grid4">'+TOOLS.map(t=>'<button class="tool'+(tool===t[0]?' on':'')+'" data-a="tool" data-v="'+t[0]+'">'+t[1]+'</button>').join('')+'</div></div>';
 h+=box('<i>'+HINT[tool]+'</i>','62px','clip');
 h+=box(info?'<b>'+info.x+','+info.y+'</b> '+esc(info.t):'<i>Tap the map to inspect a tile.</i>','62px','scroll');
 const b=bench(),n=counts();
 h+='<div class="box"><div class="line"><b>Workbench</b> <span class="dim">'+(b?'+queued · tokens you have':'build one to make things')+'</span></div>';
 for(const k in ITEM){const it=ITEM[k];
  const qn=G.sites.filter(s=>s.kind==='bill'&&s.it===k).length,hv=owned(k);
  h+='<div class="bill"><div class="bn"><span class="bnn">'+it.n+' <span class="dim">×'+it.cost+'</span></span><span class="bt">'+(qn?'<span class="pp">+'+qn+'</span> ':'')+'<b>'+hv+'</b> <span class="dim">made</span></span></div><div class="grid3">'+MATS(k).map(m=>{const q=G.sites.filter(s=>s.kind==='bill'&&s.it===k&&s.m===m).length;
   return'<button class="mat'+(b&&(n.m[m]||0)>=it.cost?' have':'')+'"'+(!b?' disabled':'')+' data-a="bill" data-v="'+k+':'+m+'"><i style="background:'+M[m].c+'"></i><span class="mn">'+M[m].n+'</span><span class="mq">'+(q?'+'+q:'')+'</span><span class="mh">'+(n.m[m]||0)+'</span></button>';}).join('')+'</div></div>';}
 h+='</div>';
 h+=box('<b>Pending</b><br>'+(G.sites.length?G.sites.map(s=>'<span class="chip pend">'+(s.kind==='bill'?M[s.m].n+' '+ITEM[s.it].n:s.kind)+' '+s.have+'/'+s.need+' <a data-a="unsite" data-v="'+s.id+'">✕</a></span>').join(''):'<i>nothing queued</i>'),'86px','scroll');
 return h;
}
function tabParty(){
 const e=G.exp,out=!!e;let h='<div class="box"><b>'+(out?GOAL[e.goal].n+': party is '+(e.state==='return'?'coming home':'out'):'Send a party through the gate')+'</b>';
 h+='<div class="grid3">';
 for(let s_=0;s_<MAXC;s_++){const c=G.cols[s_];
  if(!c){h+='<button class="mem" disabled>—</button>';continue;}
  const on=out?c.party:psel[c.id],sub=out?(c.party?jobName(c).replace('⚑ ','')+' '+c.carry.length+'/'+cap(c):'at home'):wounds(c)+' wd, cap '+cap(c);
  h+='<button class="mem'+(on?' on':'')+'"'+(out||c.down?' disabled':'')+' data-a="psel" data-v="'+c.id+'"><b>'+c.name+'</b><br><span class="dim">'+sub+'</span></button>';}
 h+='</div><b>Goal</b><div class="grid3">';
 if(pgoal==='rescue'&&G.cols.length>=6)pgoal='ore';const g=out?e.goal:pgoal;
 h+=Object.keys(GOAL).map(k=>'<button class="goal'+(g===k?' on':'')+'"'+(out||(k==='rescue'&&G.cols.length>=6)?' disabled':'')+' data-a="pgoal" data-v="'+k+'">'+GOAL[k].n+'</button>').join('');
 h+='</div><div class="txt2"><i>'+GOAL[g].t+'</i></div>';
 h+=out?'<button class="big" data-a="recall"'+(e.state==='return'?' disabled':'')+'>🔔 Recall bell</button>':'<button class="big" data-a="send"'+(G.cols.some(c=>psel[c.id]&&!c.down)?'':' disabled')+'>Send</button>';
 h+='<div class="txt2"><i>They arm themselves from the stockpile, go out, and decide the rest. A weapon in the hand is a hand that carries nothing.</i></div></div>';
 h+=box('Beyond the gate: '+(G.zone.on?'an open zone, '+G.crit.length+' creatures stirring.':'nothing you can see. A new place, with a new shape, is generated each time; it is forgotten when everyone is back inside.'),'62px','clip dim');
 return h;
}
// Every kind of card has its own fixed row: what it does, and how many are in the draw pile, the discard and in play today.
function tabCards(){
 const cnt=(arr,k)=>arr.filter(d=>d.k===k).length,today=G.card;
 let h='<div class="box"><div class="line"><b>The deck</b> <span class="dim">one card is drawn each dawn and acts until the next</span></div>';
 h+='<div class="crow hd"><span class="cn"></span><span class="cc">draw</span><span class="cc">disc</span><span class="cc">today</span></div>';
 for(const k in CARD){const C=CARD[k];
  h+='<div class="crow"><span class="cn k-'+C.kind+'"><b>'+C.n+'</b> <span class="dim">'+C.kind+(C.pips?', lasts '+C.pips+' draw'+(C.pips>1?'s':''):'')+'</span><br><i>'+C.t+'</i></span>'+
   '<span class="cc">'+cnt(G.deck,k)+'</span><span class="cc">'+cnt(G.discard,k)+'</span><span class="cc">'+(today&&today.k===k?'◆':'')+'</span></div>';}
 h+='</div>';
 h+=box('Cards wear out: each draw of a card with a lasting count uses one ◆, and at none it leaves the deck. Caches beyond the gate hold new cards; a mapped zone brings home a Chart.','62px','clip dim');
 return h;}
function tabLog(){return'<div class="box log">'+G.log.slice().reverse().map(l=>'<div'+(/FAIL|DOWN|dies|wounded/.test(l)?' class="k-bane"':'')+'>'+esc(l)+'</div>').join('')+'</div>';}
// ---- The dawn card choice. Ten seconds to pick one of three; then one is picked at random. [gospel]
// Each card is drawn as an illustrated card: a framed picture in pixel art that moves, the name, kind, uses and rule.
// They are dealt face down and turn over; they take taps only once dealt, and never move while they can be tapped.
const OFFER_S=10,DEAL_MS=900;let offerAt=0,offerKey='',offerShown=null,offerClose=0;
function cardArt(k,g,t){
 const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);},hs=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);},f=Math.floor(t*4);
 g.clearRect(0,0,48,36);
 if(k==='still'){R(0,0,48,9,'#33363f');R(0,9,48,8,'#3d404a');R(0,17,48,9,'#474a54');R(0,26,48,10,'#26241f');R(0,26,48,1,'#34312a');
  R(30,11,2,15,'#17130f');R(26,14,4,1,'#17130f');R(32,9,1,4,'#17130f');R(27,12,1,2,'#17130f');R(33,15,4,1,'#17130f');R(36,13,1,2,'#17130f');
  for(let i=0;i<4;i++){const x=((t*2.5+i*17)%70)-18;R(x,20+i*3,20,1,'#62656f');R(x+5,19+i*3,9,1,'#585b65');}
  for(let i=0;i<4;i++)R((hs(i)*48+t*(1+i*.3))%48,(hs(i+9)*20+Math.sin(t+i)*2+2),1,1,'#8a8d96');}
 else if(k==='cold'){R(0,0,48,27,'#121827');R(0,14,48,13,'#18203a');R(36,4,5,5,'#cfd8e8');R(37,5,2,2,'#e8eef8');
  R(0,27,48,9,'#c3ccd9');R(0,27,48,1,'#e8eef8');R(0,33,48,3,'#9aa6b8');
  R(7,19,15,8,'#3a2e24');for(let i=0;i<5;i++)R(6+i,18-i,17-2*i,1,i===0?'#e8eef8':'#5a463a');R(9,15,11,1,'#e8eef8');R(11,13,7,1,'#e8eef8');
  R(12,21,4,3,(f%5)?'#f0a040':'#d08030');R(19,22,2,5,'#1c1612');
  for(let i=0;i<26;i++){const x=(hs(i)*48+Math.sin(t*1.5+i)*1.5+48)%48,y=(hs(i+50)*36+t*(5+hs(i+9)*6))%36;R(x,y,1,1,'#eef3fa');}}
 else if(k==='vermin'){R(0,0,48,26,'#241e1a');for(let y=3;y<26;y+=5){R(0,y,48,1,'#1a1512');for(let x=(y%10?0:6);x<48;x+=12)R(x,y-4,1,4,'#1a1512');}
  R(0,26,48,10,'#16120e');R(3,17,11,10,'#7a6646');R(5,15,7,2,'#7a6646');R(7,14,3,1,'#5a4a30');R(4,19,2,6,'#8c7652');
  for(const [x,y] of[[16,24],[19,23],[22,24],[18,25],[21,25]])R(x,y,3,2,'#9a6a54');R(17,23,2,1,'#5a7a3a');R(21,22,2,1,'#5a7a3a');
  for(let i=0;i<3;i++)R(18+Math.sin(t*7+i*2)*3+i*2,18+Math.cos(t*9+i)*2,1,1,'#1e1e1e');
  const p=(Math.sin(t*1.1)+1)/2,x=26+p*14,face=Math.cos(t*1.1)>0?1:-1;R(x,27,7,3,'#6a5548');R(x+1,26,5,1,'#6a5548');
  R(face>0?x+7:x-3,26,3,3,'#6a5548');R(face>0?x+9:x-3,27,1,1,(f%7)?'#f04040':'#6a5548');R(face>0?x-4:x+7,29+((f%2)?0:-1),4,1,'#9a8070');R(x+1,30,1,1,'#3a2c24');R(x+5,30,1,1,'#3a2c24');}
 else if(k==='seam'){R(0,0,48,36,'#34343c');for(let i=0;i<14;i++)R(hs(i)*44,hs(i+3)*34,3+hs(i+7)*6,2,'#2a2a31');for(let i=0;i<10;i++)R(hs(i+20)*46,hs(i+30)*34,2,1,'#44444e');
  for(let i=0;i<26;i++){const x=3+i*1.5,y=30-i*.95+Math.sin(i*.9)*1.5;R(x,y,2,2,'#9a6030');R(x,y,1,1,'#e0a050');}
  for(let n=0;n<3;n++){const i=(n*9+f*2)%26,x=4+i*1.5,y=30-i*.95+Math.sin(i*.9)*1.5;R(x,y-1,1,3,'#fff4c0');R(x-1,y,3,1,'#fff4c0');}
  for(let i=0;i<10;i++)R(41-i*.7,27-i*1.6,2,2,'#6a4a2a');R(31,9,12,2,'#9aa0a8');R(30,10,2,2,'#7a8088');R(43,8,2,2,'#7a8088');R(32,9,10,1,'#c8ccd2');}
 else if(k==='dry'){R(0,0,48,36,'#16120e');R(0,28,48,8,'#221a12');const gl=.5+.5*Math.sin(t*6);R(22,27,22,1,gl>.5?'#5a2a10':'#4a2410');
  for(const [x,y] of[[3,24],[3,20],[8,22],[13,24],[13,20],[8,18]]){R(x,y,10,4,'#5a3e22');R(x,y,10,1,'#6e4e2c');R(x,y,2,4,'#a07850');R(x,y+1,1,2,'#7a5a3a');}
  R(28,26,12,2,'#3a2414');R(29,25,10,1,'#5a3a1e');
  for(let n=0;n<9;n++){const h=3+Math.round((Math.sin(t*9+n*1.7)+1)*3+(n>2&&n<6?4:0));R(29+n,25-h,1,h,n%2?'#f0a030':'#e06020');if(h>4)R(29+n,25-h+2,1,Math.max(1,h-5),'#ffe080');}
  for(let i=0;i<5;i++){const a=(t*.8+hs(i))%1;R(33+Math.sin(t*3+i*2)*3,20-a*18,1,1,a<.6?'#f08030':'#8a3a18');}}
 else if(k==='wander'){R(0,0,48,8,'#2a2232');R(0,8,48,8,'#3a2c3a');R(0,16,48,6,'#5a3a3a');R(0,22,48,14,'#221e1a');
  for(let y=22;y<36;y++){const w=2+(y-22)*2.2;R(24-w/2,y,w,1,'#4a4038');}R(0,9,7,27,'#2a2a30');R(41,9,7,27,'#2a2a30');R(0,8,8,2,'#3a3a42');R(40,8,8,2,'#3a3a42');
  const b=f%2;R(21,13,1,13,'#5a4630');R(22,15+b,5,8,'#3a3a2a');R(23,13+b,3,3,'#2a2a20');R(24,15+b,1,1,'#d0a080');
  R(22+(b?0:1),23,1,3,'#2a2a20');R(25-(b?0:1),23,1,3,'#2a2a20');const fl=(f%3)?'#f0c040':'#e0a030';R(27,19+b,2,2,fl);R(26,18+b,1,1,'#5a4a28');}
 else if(k==='chart'){R(0,0,48,36,'#a08c64');R(2,2,44,32,'#c8b48a');for(let i=0;i<9;i++)R(2+hs(i)*42,2+hs(i+5)*30,2,1,'#b8a47a');
  for(let i=0;i<14;i++)R(4+i*1.2,26+Math.sin(i)*2,1,1,'#5a4a30');for(let i=0;i<10;i++)R(30+Math.sin(i*1.3)*3,10+i*1.6,1,1,'#5a4a30');
  for(let i=0;i<22;i++){const x=6+i*1.45,y=28-i*.9-Math.sin(i*.4)*3;if(((i-t*6)%4+4)%4<2)R(x,y,1,1,'#7a2a1a');}
  if(f%4<3){R(37,6,1,1,'#a02020');R(39,6,1,1,'#a02020');R(38,7,1,1,'#a02020');R(37,8,1,1,'#a02020');R(39,8,1,1,'#a02020');}
  R(8,5,1,5,'#5a4a30');R(6,7,5,1,'#5a4a30');R(8,4,1,1,'#a02020');}
 else{R(0,0,48,36,'#2a2a30');R(20,14,8,8,'#f0c040');}
}
function offerHTML(){return '<div class="h">Dawn: keep one card</div><div class="cards">'+G.offer.map((c,i)=>{const C=CARD[c.k],u=c.pips||C.pips||0;
 return '<button class="card '+C.kind+'" style="--i:'+i+'" data-a="pick" data-v="'+i+'"><span class="in"><span class="f"><span class="cn">'+esc(C.n)+'</span>'+
  '<canvas class="art" width="48" height="36" data-k="'+c.k+'"></canvas><span class="ck">'+C.kind+(u?' <i>'+'●'.repeat(u)+'</i>':'')+'</span><span class="ct">'+esc(C.t)+'</span></span><span class="b"></span></span></button>';}).join('')+
 '</div><div class="bar"><i id="obar"></i></div>';}
// keep card i (or one at random); the kept card glows and the others dim for a moment before the box closes
function chooseCard(i){if(!G.offer)return;const was=G.offer;pickCard(i);const n=was.indexOf(G.card),o=$('offer');
 if(o){o.classList.add('done');o.querySelectorAll('.card').forEach((b,j)=>b.classList.add(j===n?'chosen':'gone'));}offerClose=performance.now()+800;}
function offerUI(){const o=$('offer');if(!o)return;const now=performance.now();
 if(!G.offer){if(offerKey&&now>=offerClose){offerKey='';o.className='';o.innerHTML='';}}
 else{const key=G.t+':'+G.offer.map(c=>c.k).join(',');
  if(key!==offerKey){offerKey=key;offerAt=now+DEAL_MS;o.innerHTML=offerHTML();o.className='on';setTimeout(()=>{if(offerKey===key)o.classList.add('ready');},DEAL_MS);}
  const left=Math.max(0,Math.min(1,1-(now-offerAt)/(OFFER_S*1000))),b=$('obar');if(b)b.style.width=(left*100).toFixed(1)+'%';
  if(left<=0){chooseCard(-1);render();redraw();}}
 if(offerKey)o.querySelectorAll('canvas.art').forEach(c=>cardArt(c.dataset.k,c.getContext('2d'),now/1000));}
setInterval(offerUI,100);
function render(){offerUI();
 $('thr').innerHTML='Threat '+Array.from({length:THREAT_MAX},(_,i)=>'<span class="t'+(i<Math.floor(G.threat||0)?' f':'')+'"></span>').join('')+' '+(G.raid?'<b style="color:#e04040">RAID</b>':Math.floor(G.threat||0)+'/'+THREAT_MAX)+' · renown '+(G.renown||0);
 $('snd').classList.toggle('on',SND.on&&!!SND.ctx&&SND.ctx.state==='running');$('snd').classList.toggle('wait',SND.on&&!(SND.ctx&&SND.ctx.state==='running'));
 $('dtxt').textContent=SEASON[season()]+' '+(day()%6+1)+', year '+(Math.floor(day()/24)+1)+' · '+(night()?'night':tod()<60?'morning':tod()<120?'midday':'evening');
 $('tilt').classList.toggle('on',!!tiltGoal());
 document.querySelectorAll('#spd button').forEach(b=>b.classList.toggle('on',+b.dataset.v===G.speed));
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===tab));
 // Never rebuild the panel under a finger or mouse button: a button replaced between press and release gets no click.
 if(held_){pend=true;return;}
 const h={colony:tabColony,orders:tabOrders,party:tabParty,cards:tabCards,log:tabLog}[tab]();
 if(h===lastH)return;lastH=h;
 const st=panel.scrollTop;panel.innerHTML=h;panel.scrollTop=st;
}
// A gathered plant is hidden while it regrows; an order on its tile clears it, so nothing unseen blocks a tap.
// Anything still drawn there blocks the order, and the info box says what. [slop]
const BUILT={hearth:1,bench:1,brazier:1,crop:1};
function blockAt(x,y){const f=featAt(x,y);if(!f)return null;if(!BUILT[f.k]&&!(f.left>0)){G.feats=G.feats.filter(q=>q!==f);return null;}return f;}
function tap(p){
 if(fogAt(p.x,p.y)&&tool!=='brazier'&&tool!=='cancel'&&!(tool==='look'&&G.cols.some(c=>c.x===p.x&&c.y===p.y))){info={x:p.x,y:p.y,t:tool==='look'?'Blight fog. Nothing can be seen in it.':'The blight hides this ground. Light a brazier at its edge first.'};render();return;}
 const k=K(p.x,p.y),inner=p.x<PW&&G.hgt[I(p.x,p.y)]>0&&!(p.x===47&&p.y===24)&&(G.mask[I(p.x,p.y)]===2||tool==='dig'||tool==='cancel');
 if(tool==='look'){const c=G.cols.find(c=>c.x===p.x&&c.y===p.y);if(c){G.sel=c.id;tab='colony';}
  const f=featAt(p.x,p.y),t=[].concat(...Object.keys(G.tok).filter(q=>q.startsWith(k+',')).map(q=>G.tok[q])),fog=p.x>=PW&&!G.rev[I(p.x,p.y)];
  info={x:p.x,y:p.y,t:fog?'Fog.':M[topMat(p.x,p.y)].n+' ('+M[topMat(p.x,p.y)].f+', hard '+M[topMat(p.x,p.y)].h+(M[topMat(p.x,p.y)].kw?', '+M[topMat(p.x,p.y)].kw:'')+'), height '+topZ(p.x,p.y)+(f?'. '+FEAT[f.k].n+(f.left>0?'':' (regrowing)'):'')+(t.length?'. Tokens: '+t.map(itn).join(', '):'')};}
 else if(!inner){info={x:p.x,y:p.y,t:'Orders only work inside the walls.'};}
 else if(tool==='dig'){const z=p.z!=null?p.z:topZ(p.x,p.y)-1,dk=TK(p.x,p.y,z);if(G.digs[dk])delete G.digs[dk];else if(z>=1&&G.vox[VI(p.x,p.y,z)])G.digs[dk]=1;}
 else if(tool==='stock'){if(G.stock[k])delete G.stock[k];else G.stock[k]=1;}
 else if(tool==='field'){G.fields=G.fields||{};if(G.fields[k]){delete G.fields[k];const f=featAt(p.x,p.y);if(f&&f.k==='crop')G.feats=G.feats.filter(q=>q!==f);}else{const f=blockAt(p.x,p.y);if(f)info={x:p.x,y:p.y,t:'Cannot farm here: '+FEAT[f.k].n+' is in the way.'};else G.fields[k]=1;}}
 else if(tool==='cancel'){for(const dk in G.digs)if(dk.startsWith(k+','))delete G.digs[dk];G.sites=G.sites.filter(s=>!(s.x===p.x&&s.y===p.y&&s.kind!=='bill'));}
 else if(tool==='brazier'&&fogAt(p.x,p.y)&&featAt(p.x,p.y)&&BUILT[featAt(p.x,p.y).k]==null&&featAt(p.x,p.y).left>0)info={x:p.x,y:p.y,t:'Something in the fog is in the way. Try the next tile.'};
 else if(!G.sites.some(s=>s.x===p.x&&s.y===p.y)&&!blockAt(p.x,p.y)){
  if(tool==='brazier')G.sites.push({id:G.nid++,kind:'brazier',x:p.x,y:p.y,spec:{fam:'wood'},need:1,have:0,m:0});
  else if(tool==='place')G.sites.push({id:G.nid++,kind:'voxel',x:p.x,y:p.y,spec:{fam:'stone'},need:1,have:0,m:0});
  else if(tool==='trap')G.sites.push({id:G.nid++,kind:'trap',x:p.x,y:p.y,spec:{fam:'metal'},need:1,have:0,m:0});
  else if(!G.feats.some(f=>f.k===tool)&&!G.sites.some(s=>s.kind===tool))G.sites.push({id:G.nid++,kind:tool,x:p.x,y:p.y,spec:{fam:tool==='hearth'?'stone':'wood'},need:2,have:0,m:0});
  else info={x:p.x,y:p.y,t:'Only one '+tool+' in this prototype.'};}
 render();redraw();
}
// A button acts the moment the finger or mouse button comes up on it, so a panel redrawn by a fast tick between press and
// release cannot swallow the tap. The browser's own click that follows is then ignored; a click with no press before it
// (a key press on a focused button) still works.
// No zooming the page on mobile: no double-tap zoom, no pinch zoom (iPhones ignore the viewport setting, so they are
// stopped here as well). Map zoom stays on the − and + buttons and the mouse wheel.
let lastTouch=0;
document.addEventListener('touchend',e=>{const n=performance.now();if(n-lastTouch<350)e.preventDefault();lastTouch=n;},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
for(const ev of['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches.length>1&&!e.target.closest('#cv'))e.preventDefault();},{passive:false});
// Fullscreen: Android and desktop browsers can do it on a tap. iPhones cannot for a web page; there the game must be added
// to the Home Screen, after which it opens without any browser bars.
function toggleFull(){const d=document,el=d.documentElement;
 if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;}
 const go=el.requestFullscreen||el.webkitRequestFullscreen;
 if(go&&(d.fullscreenEnabled||d.webkitFullscreenEnabled)){const r=go.call(el,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{});}
 else banner('Fullscreen on iPhone','Share, then Add to Home Screen, then open it from there','');}
document.addEventListener('fullscreenchange',()=>{lastH='';render();redraw();});
let press=null,skipClick=0;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-a]');press=el&&!el.disabled?{a:el.dataset.a,v:el.dataset.v,x:e.clientX,y:e.clientY}:null;if(press)el.classList.add('press');});
const unpress=()=>document.querySelectorAll('.press').forEach(b=>b.classList.remove('press'));
document.addEventListener('pointercancel',()=>{press=null;unpress();});
// flash the button that acted (found again by what it does, in case the panel was redrawn)
function flash(a,v){unpress();if(SFX&&SND.ctx)SFX.tap();const b=document.querySelector('[data-a="'+a+'"]'+(v!=null?'[data-v="'+v+'"]':''));if(!b)return;b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),260);}
document.addEventListener('pointerup',e=>{const p=press;press=null;if(!p||Math.hypot(e.clientX-p.x,e.clientY-p.y)>12){unpress();return;}
 const el=document.elementFromPoint(e.clientX,e.clientY),b=el&&el.closest('[data-a]');if(b&&(b.disabled||b.dataset.a!==p.a||b.dataset.v!==p.v))return;
 skipClick=performance.now()+600;act(p.a,p.v);setTimeout(()=>flash(p.a,p.v),15);}); // after the panel is redrawn
document.addEventListener('click',e=>{if(performance.now()<skipClick)return;
 const el=e.target.closest('[data-a]');if(!el||el.disabled)return;act(el.dataset.a,el.dataset.v);flash(el.dataset.a,el.dataset.v);});
function act(a,v){
 if(a==='tab')tab=v;else if(a==='tool'){tool=v;info=null;}else if(a==='sel')G.sel=G.sel===+v?null:+v;
 else if(a==='speed')return setSpeed(+v);
 else if(a==='zoom'){cam.s=Math.max(1,Math.min(4,cam.s+ +v));}
 else if(a==='full')toggleFull();
 else if(a==='home')goHomeView();else if(a==='sound'){if(SND.on&&!(SND.ctx&&SND.ctx.state==='running'))unlock();else sndToggle();}
 else if(a==='turn')turnBy(+v);else if(a==='tilt')tiltTo(tiltGoal()?0:1);
 else if(a==='psel')psel[v]=!psel[v];else if(a==='pgoal')pgoal=v;
 else if(a==='send'){const ids=G.cols.filter(c=>psel[c.id]&&!c.down).map(c=>c.id);if(ids.length){sendParty(ids,pgoal);psel={};}}
 else if(a==='recall')recall();
 else if(a==='pick'){chooseCard(+v);offerUI();}
 else if(a==='bill'){const p=v.split(':'),b=bench();G.sites.push({id:G.nid++,kind:'bill',it:p[0],m:+p[1],x:b.x,y:b.y,spec:{m:+p[1]},need:ITEM[p[0]].cost,have:0});}
 else if(a==='unsite'){const s=G.sites.find(s=>s.id===+v);if(s){for(let i=0;i<s.have;i++)addTok(s.x,s.y,{m:s.m});G.sites=G.sites.filter(q=>q!==s);}}
 else if(a==='new'){if(askNew){askNew=false;newGame((Math.random()*1e9)|0);save();goHomeView();}else askNew=true;}
 else if(a==='keep')askNew=false;
 render();redraw();
}
let held_=false,pend=false,lastH='';
$('ui').addEventListener('pointerdown',()=>{held_=true;});
const rel=()=>{if(!held_)return;held_=false;setTimeout(()=>{if(pend){pend=false;render();}},0);};
window.addEventListener('pointerup',rel);window.addEventListener('pointercancel',rel);
let drag=null;
// One finger or the left button pans. Two fingers twisting, the right button, or shift with the left button turns the view.
const ptrs=new Map();
cv.addEventListener('contextmenu',e=>e.preventDefault());
// A phone can lose a finger's lift (a system gesture, a call). The first finger of a new touch therefore clears every
// finger left over, or a stale one would turn each later one-finger drag into a two-finger twist.
cv.addEventListener('pointerdown',e=>{if(e.isPrimary){ptrs.clear();drag=null;}try{cv.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptrs.size===2){const p=[...ptrs.values()];drag={twist:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),yaw:cam.yaw,mv:true};return;}
 drag={x:e.clientX,y:e.clientY,f0:[cam.fx,cam.fy],yaw:cam.yaw,rot:e.button===2||e.shiftKey,mv:false};});
cv.addEventListener('pointermove',e=>{if(!drag||!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(drag.twist!=null){if(ptrs.size<2)return;const p=[...ptrs.values()],a=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x);setView(drag.yaw-(a-drag.twist)/(Math.PI/2),cam.tilt);return;}
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.mv&&Math.abs(dx)+Math.abs(dy)<8)return;drag.mv=true;
 if(drag.rot)setView(drag.yaw-dx/160,cam.tilt);else panBy(drag.f0,dx/pxs(),dy/pxs());});
const up=e=>{ptrs.delete(e.pointerId);if(drag&&!drag.mv&&e.type==='pointerup'){const r=cv.getBoundingClientRect(),p=pick(e.clientX-r.left,e.clientY-r.top);if(p)tap(p);}
 if(!ptrs.size)drag=null;
 // a twist ends when either finger lifts; the one left on the glass pans from where it is, without tapping
 else if(drag&&drag.twist!=null&&ptrs.size===1){const q=[...ptrs.values()][0];drag={x:q.x,y:q.y,f0:[cam.fx,cam.fy],yaw:cam.yaw,rot:false,mv:true};}};
cv.addEventListener('lostpointercapture',e=>{if(ptrs.has(e.pointerId))up(e);});
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();cam.s=Math.max(1,Math.min(4,cam.s+(e.deltaY<0?1:-1)));redraw();},{passive:false});
window.addEventListener('resize',fit);
// the view's box can change without a window resize (entering fullscreen, the browser's bars hiding): redraw at its new size
if(window.ResizeObserver)new ResizeObserver(()=>fit()).observe(document.getElementById('view'));
// WASD (or the arrow keys) slide the view while held, at a steady screen speed whatever the zoom.
const PANK={KeyW:[0,1],KeyS:[0,-1],KeyA:[1,0],KeyD:[-1,0],ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[1,0],ArrowRight:[-1,0]},panHeld=new Set();let panT=0;
function panLoop(t){if(!panHeld.size){panT=0;return;}const dt=panT?Math.min(.05,(t-panT)/1000):0;panT=t;let x=0,y=0;for(const c of panHeld){x+=PANK[c][0];y+=PANK[c][1];}
 const v=360/pxs()*dt;if(x||y)panBy([cam.fx,cam.fy],x*v,y*v);requestAnimationFrame(panLoop);}
document.addEventListener('keydown',e=>{if(!PANK[e.code]||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(!panHeld.size)requestAnimationFrame(panLoop);panHeld.add(e.code);});
document.addEventListener('keyup',e=>panHeld.delete(e.code));window.addEventListener('blur',()=>panHeld.clear());
document.addEventListener('keydown',e=>{if(e.code==='KeyQ')turnBy(-1);else if(e.code==='KeyE')turnBy(1);else if(e.code==='KeyR')tiltTo(tiltGoal()?0:1);else if(e.code==='Space'){e.preventDefault();setSpeed(G.speed?0:1);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();clearInterval(timer);timer=null;}else{checkUpdate();if(G.speed>0&&!timer)setSpeed(G.speed);}});
// When a newer version has been published, save and reload onto it. Checked every two minutes and whenever the page is shown again.
function checkUpdate(){if(!window.VERSION)return;fetch('version.txt?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{t=t.trim();
 if(t&&t!==window.VERSION){save();location.replace(location.pathname+'?v='+encodeURIComponent(t));}}).catch(()=>{});}
setInterval(checkUpdate,120000);
// The world is only drawn when something changes, so an idle game shows 0 fps.
if(window.VERSION)$('ver').textContent='v'+window.VERSION.slice(4,8)+'.'+window.VERSION.slice(9,13); // 20261118-172216 shows as v1118.1722
setInterval(()=>{$('fps').textContent=FPS.n+' fps'+(FPS.n?' · '+(FPS.ms/FPS.n).toFixed(1)+' ms':'');FPS.n=0;FPS.ms=0;},1000);
// Every load starts a new world: opening the link, refreshing, and the automatic reload after an update.
if(document.fonts&&document.fonts.load)document.fonts.load("8px 'Tiny5'").then(()=>{ATL.map.clear();redraw();}).catch(()=>{});
newGame((Math.random()*1e9)|0);
// the camera looks at the camp: the middle of the stockpile
function goHomeView(){const ks=Object.keys(G.stock);let x=24,y=24;if(ks.length){x=0;y=0;for(const k of ks){const p=k.split(',');x+=+p[0];y+=+p[1];}x=Math.round(x/ks.length);y=Math.round(y/ks.length);}lookAt(x,y);}
goHomeView();
fit();setSpeed(G.speed||1);
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
