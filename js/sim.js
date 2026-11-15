'use strict';
const hearth=()=>G.feats.find(f=>f.k==='hearth'), bench=()=>G.feats.find(f=>f.k==='bench');
const col=id=>G.cols.find(c=>c.id===id);
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cap=c=>(c.hands[0]?0:1)+(c.hands[1]?0:1)+(c.worn[5]&&ITEM[c.worn[5].it].pack||0);
const wounds=w=>w.wd.reduce((a,b)=>a+b,0);
const rsv=k=>G.res[k]!=null;
function nearFire(c){const h=hearth();return h&&h.fuel>0&&md(h,c)<=3;}
function mark(c,s){c.mk[s]=(c.mk[s]||0)+1;const lv=c.sk[s]||0;
 if(lv<3&&c.mk[s]>=[2,4,6][lv]){c.sk[s]=lv+1;c.mk[s]=0;log(c.name+' learns from failure: '+s+' '+(lv+1)+'.');}}
function roll(w,tr,skill,diff,bonus,label){
 const n=Math.max(1,w.tr[tr]+(skill?(w.sk[skill]||0):0)+(bonus||0)-(w.pen||0)-(w.wd[4]>0?1:0));
 const tgt=w.scars&&w.scars.includes(tr)?6:5,dice=[];let s=0;
 for(let i=0;i<n;i++){const d=1+ri(6);dice.push(d);if(d>=tgt)s++;}
 const ok=s>=diff;G.fx.push({x:w.x,y:w.y,dice,tgt,ttl:5});
 if(w.name)log(w.name+' '+label+': '+TRS[tr]+(skill?'+'+skill:'')+' ['+dice.join(' ')+'] '+(diff?s+'/'+diff+(ok?'':' FAIL'):s));
 if(diff&&!ok&&skill&&w.name)mark(w,skill);
 return{s,ok};
}
function match(t,s){
 if(s.it)return t.it===s.it;
 if(s.wpn)return!!(t.it&&ITEM[t.it].wpn);
 if(s.tool)return!!(t.it&&ITEM[t.it].tool);
 if(s.worn!=null)return!!(t.it&&ITEM[t.it].slot===s.worn);
 if(s.any)return!t.corpse;
 if(s.card)return!!t.card;
 if(t.it||t.card||t.corpse)return false;
 if(s.m)return t.m===s.m;
 if(s.fam)return M[t.m].f===s.fam&&t.m!==19;
 if(s.food)return!!M[t.m].eat;
 if(s.raw)return!!M[t.m].raw;
 return false;
}
function counts(){if(G._cnt)return G._cnt;const c={fam:{},m:{},meal:0,food:0};
 for(const k in G.tok){if(+k.split(',')[0]>=PW)continue;for(const t of G.tok[k]){if(t.it||t.card||t.corpse)continue;
  const f=M[t.m].f;c.fam[f]=(c.fam[f]||0)+1;c.m[t.m]=(c.m[t.m]||0)+1;if(M[t.m].eat)c.food++;if(t.m===20)c.meal++;}}
 return G._cnt=c;}
function passable(x,y,nx,ny){
 if(nx<0||ny<0||nx>=W||ny>=H||!G.hgt[ny*W+nx])return false;
 if(Math.abs(topZ(nx,ny)-topZ(x,y))>1)return false;
 if(nx===47&&ny===24&&!G.gateOpen)return false;
 return true;
}
function flood(c){
 const s=I(c.x,c.y);if(c._f&&c._ft===G.t&&c._fi===s)return c._f;
 const dist=new Int16Array(W*H).fill(-1),prev=new Int32Array(W*H),q=new Int32Array(W*H);let qh=0,qt=0;
 dist[s]=0;q[qt++]=s;
 while(qh<qt){const i=q[qh++],x=i%W,y=(i-x)/W,d=dist[i]+1;
  if(x+1<W&&dist[i+1]<0&&passable(x,y,x+1,y)){dist[i+1]=d;prev[i+1]=i;q[qt++]=i+1;}
  if(x>0&&dist[i-1]<0&&passable(x,y,x-1,y)){dist[i-1]=d;prev[i-1]=i;q[qt++]=i-1;}
  if(y+1<H&&dist[i+W]<0&&passable(x,y,x,y+1)){dist[i+W]=d;prev[i+W]=i;q[qt++]=i+W;}
  if(y>0&&dist[i-W]<0&&passable(x,y,x,y-1)){dist[i-W]=d;prev[i-W]=i;q[qt++]=i-W;}}
 c._f={dist,prev};c._ft=G.t;c._fi=s;return c._f;
}
function reachD(f,x,y,adj){let b=-1;const t=(tx,ty)=>{if(tx<0||ty<0||tx>=W||ty>=H)return;const d=f.dist[I(tx,ty)];if(d>=0&&(b<0||d<b))b=d;};
 if(adj){t(x+1,y);t(x-1,y);t(x,y+1);t(x,y-1);}else t(x,y);return b;}
function goTo(c,x,y,adj){
 const f=flood(c);let best=-1,bd=1e9;
 const t=(tx,ty)=>{if(tx<0||ty<0||tx>=W||ty>=H)return;const d=f.dist[I(tx,ty)];if(d>=0&&d<bd){bd=d;best=I(tx,ty);}};
 if(adj){t(x+1,y);t(x-1,y);t(x,y+1);t(x,y-1);}else t(x,y);
 if(best<0)return false;
 const p=[],s=I(c.x,c.y);let i=best;while(i!==s){p.push(i);i=f.prev[i];}
 c.path=p.reverse();return true;
}
const dirOf=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx>=0?0:2):(dy>0?1:3);
function setJob(c,j,x,y,adj){if(!goTo(c,x,y,adj))return false;if(adj){j.tx=x;j.ty=y;}c.job=j;for(const k of j.res||[])G.res[k]=c.id;return true;}
function endJob(c){if(c.job)for(const k of c.job.res||[])if(G.res[k]===c.id)delete G.res[k];c.job=null;c.path=[];c.asleep=false;}
// nearest reachable token tile matching spec. o.zone: look beyond the gate; o.loose: not in stockpile
function findTok(c,spec,o){o=o||{};const f=flood(c);let best=null,bd=1e9;
 for(const k in G.tok){const a=G.tok[k];if(!a.length||rsv('t'+k))continue;const p=k.split(','),x=+p[0],y=+p[1];
  if(o.zone?(x<PW||!G.rev[I(x,y)]):x>=PW)continue;if(o.loose&&G.stock[k])continue;if(o.ok&&!o.ok(x,y))continue;
  if(!a.some(t=>match(t,spec)))continue;const d=f.dist[I(x,y)];if(d>=0&&d<bd){bd=d;best={x,y,k};}}
 return best;}
function takeTok(x,y,spec){const a=G.tok[K(x,y)];if(!a)return null;const i=a.findIndex(t=>match(t,spec));if(i<0)return null;
 const t=a.splice(i,1)[0];if(!a.length)delete G.tok[K(x,y)];return t;}
function stockSpot(c){const f=flood(c);let best=null,bd=1e9;
 for(const k in G.stock){if((G.tok[k]||[]).length>=6)continue;const p=k.split(','),d=f.dist[I(+p[0],+p[1])];if(d>=0&&d<bd){bd=d;best={x:+p[0],y:+p[1]};}}
 return best;}
function isHome(c){if(c.x>=PW)return false;for(const k in G.stock){const p=k.split(',');if(Math.abs(p[0]-c.x)+Math.abs(p[1]-c.y)<=4)return true;}return false;}
function fetchJob(c,spec,to,extra,o){
 if(cap(c)<=c.carry.length)return false;const t=findTok(c,spec,o);if(!t)return false;
 return setJob(c,Object.assign({t:'fetch',s:0,spec,to,x:t.x,y:t.y,res:['t'+t.k].concat(extra&&extra.res||[])},extra,{res:['t'+t.k].concat(extra&&extra.res||[])}),t.x,t.y,false);
}
// ---- colony jobs, tried in order
function jRescue(c){const d=G.cols.find(d=>d.down&&!d.home&&d.by==null&&!rsv('c'+d.id));if(!d)return false;
 return setJob(c,{t:'rescue',s:0,id:d.id,res:['c'+d.id]},d.x,d.y,true);}
function jEat(c){if(c.need.hun<3)return false;const t=findTok(c,{m:20})||findTok(c,{food:1});if(!t)return false;
 return setJob(c,{t:'eat',res:['t'+t.k]},t.x,t.y,false);}
function jSleep(c){if(!(c.need.rest>=5||(night()&&c.need.rest>=2)))return false;const h=hearth();
 if(h&&c.x<PW&&setJob(c,{t:'sleep'},h.x,h.y,true))return true;c.job={t:'sleep'};return true;}
function jWarm(c){const h=hearth();if(c.need.temp<4||!h||h.fuel<=0||nearFire(c))return false;return setJob(c,{t:'wait',n:20},h.x,h.y,true);}
function jFuel(c){const h=hearth();if(!h||h.fuel>=30||rsv('fuel'))return false;
 if(!(tod()>=150||season()===3||G.cols.some(d=>d.need.temp>=3)))return false;
 return fetchJob(c,{fam:'wood'},'fuel',{res:['fuel']});}
function jCook(c){const h=hearth();if(!h||h.fuel<20||rsv('cook')||counts().meal>=4)return false;return fetchJob(c,{raw:1},'cook',{res:['cook']});}
function jSupply(c){for(const s of G.sites){if(s.have>=s.need||rsv('s'+s.id))continue;if(fetchJob(c,s.spec,'site',{sid:s.id,res:['s'+s.id]}))return true;}return false;}
function jMake(c){for(const s of G.sites){if(s.have<s.need||rsv('s'+s.id))continue;if(setJob(c,{t:'make',sid:s.id,res:['s'+s.id]},s.x,s.y,true))return true;}return false;}
function jDig(c){const f=flood(c);let b=null,bd=1e9;for(const k in G.digs){if(rsv('d'+k))continue;const p=k.split(','),d=reachD(f,+p[0],+p[1],true);if(d>=0&&d<bd){bd=d;b={x:+p[0],y:+p[1],k};}}
 return b?setJob(c,{t:'dig',x:b.x,y:b.y,res:['d'+b.k]},b.x,b.y,true):false;}
function jEquip(c){for(let s=0;s<6;s++)if(!c.worn[s]&&fetchJob(c,{worn:s},'wear'))return true;
 if(!c.hands[0]&&c.carry.length===0&&fetchJob(c,{tool:1},'wear'))return true;return false;}
function jHaul(c){if(!stockSpot(c))return false;return fetchJob(c,{any:1},'stock',null,{loose:1});}
function jGather(c){const n=counts(),want=[];
 if(n.food<8)want.push('moss','tuber');if((n.fam.wood||0)<8)want.push('tree');if((n.fam.metal||0)<6)want.push('scrap');if((n.fam.fiber||0)<4)want.push('reed');
 if(!want.length)return false;const f=flood(c);let b=null,bd=1e9;
 for(const ft of G.feats){if(ft.x>=PW||ft.left<=0||!want.includes(ft.k)||rsv('f'+ft.id))continue;
  const d=reachD(f,ft.x,ft.y,true)+want.indexOf(ft.k)*3;if(d>=0&&reachD(f,ft.x,ft.y,true)>=0&&d<bd){bd=d;b=ft;}}
 return b?setJob(c,{t:'gather',f:b.id,res:['f'+b.id]},b.x,b.y,true):false;}
function jDrop(c){if(!c.carry.length)return false;const s=stockSpot(c);if(!s)return false;return setJob(c,{t:'drop'},s.x,s.y,false);}
function jIdle(c){const x=24+ri(9)-4,y=24+ri(9)-4;if(!setJob(c,{t:'wait',n:6+ri(8)},x,y,false))c.job={t:'wait',n:5};return true;}
function pickJob(c){
 if(c.party)return partyJob(c);
 if(c.hands[1]&&!rsv('x')){addTok(c.x,c.y,c.hands[1]);c.hands[1]=null;}
 jRescue(c)||jEat(c)||jSleep(c)||jWarm(c)||jDrop(c)||jFuel(c)||jCook(c)||jMake(c)||jSupply(c)||jDig(c)||jEquip(c)||jHaul(c)||jGather(c)||jIdle(c);
}
// ---- expedition
function enemyNear(c,r){let b=null,bd=r+1;for(const e of G.crit){const d=md(e,c);if(d<bd){bd=d;b=e;}}return b;}
const isWood=t=>!t.it&&!t.card&&!t.corpse&&M[t.m].f==='wood';
function nearCrit(c){const f=flood(c);let b=null,bd=1e9;for(const e of G.crit){if(!G.rev[I(e.x,e.y)])continue;const d=reachD(f,e.x,e.y,true);if(d>=0&&d<bd){bd=d;b=e;}}return b;}
// true while the leader should stand and let stragglers catch up. It gives way for 15 ticks in every 60, so a member who
// cannot reach the leader never freezes the party.
function partyHold(c){if(G.t%60>=45)return false;const mem=G.cols.filter(d=>d.party&&!d.down);
 return mem[0]===c&&mem.some(d=>md(d,c)>6&&!(d.job&&d.job.t==='rescue'));}
function partyJob(c){
 const e=G.exp;if(!e){c.party=false;return;}
 const go=GOAL[e.goal];
 if(!c.armed){if(!c.hands[1]&&fetchJob2(c,{wpn:1}))return;
  if(e.goal==='reclaim'&&!c.carry.some(isWood)&&cap(c)>c.carry.length){
   if(fetchJob(c,{fam:'wood'},'keep'))return;
   // the wood may be on a tile someone else is at right now: wait for them, then try again
   if(G.cols.some(d=>d!==c&&d.party&&!d.armed&&d.job&&d.job.t==='fetch')){c.job={t:'wait',n:2};return;}}
  c.armed=true;}
 // The party keeps together. The first able member leads: the rest stay within a few tiles of them, work only what is near
 // them, and everyone turns on an enemy that comes near any one of them. [slop] distances
 const mem=G.cols.filter(d=>d.party&&!d.down),lead=mem[0],isLead=c===lead;
 const near=(x,y)=>isLead||Math.abs(x-lead.x)+Math.abs(y-lead.y)<=5;
 let en=enemyNear(c,7);for(const d of mem)if(!en)en=enemyNear(d,7);
 if(!en&&e.goal==='nest'&&isLead)en=nearCrit(c);
 if(en&&setJob(c,{t:'fight',id:en.id},en.x,en.y,true))return;
 if(jRescue(c))return;
 if(c.x<PW&&e.state!=='return'&&mem.some(d=>!d.armed)){c.job={t:'wait',n:2};return;}          // leave together
 if(!isLead&&md(c,lead)>4&&setJob(c,{t:'wait',n:1},lead.x,lead.y,true))return;                 // catch up
 if(partyHold(c)){c.job={t:'wait',n:2};return;}                                                // wait for stragglers
 if(e.state==='return')return goHome(c);
 const f=flood(c);
 const done=why=>{e.state='return';log('The party '+why+' and turns for home.');goHome(c);};
 let loose=0;if(go.loot)for(const k in G.tok){const p=k.split(',');if(+p[0]>=PW&&G.rev[I(+p[0],+p[1])])loose+=G.tok[k].filter(t=>match(t,go.loot)).length;}
 if(loose>0&&cap(c)>c.carry.length&&fetchJob(c,go.loot,'keep',null,{zone:1,ok:near}))return;
 if(e.goal==='card'&&mem.some(d=>d.carry.some(t=>t.card)))return done('has what it came for');
 if(e.goal==='reclaim'){
  if(c.carry.some(isWood)){let bi=-1,bd=1e9;
   for(let y=2;y<H-2;y++)for(let x=PW+1;x<W-2;x++){const i=I(x,y);if(G.keep[i]||(x+y*2)%5||f.dist[i]<0||f.dist[i]>=bd||!near(x,y)||featAt(x,y))continue;bd=f.dist[i];bi=i;}
   if(bi>=0&&setJob(c,{t:'brazier'},bi%W,Math.floor(bi/W),false))return;}
  else if(isLead&&mem.some(d=>d.carry.some(isWood))){let bi=-1,bd=1e9;
   for(let y=2;y<H-2;y++)for(let x=PW+1;x<W-2;x++){const i=I(x,y);if(G.keep[i]||(x+y*2)%5||f.dist[i]<0||f.dist[i]>=bd||featAt(x,y))continue;bd=f.dist[i];bi=i;}
   if(bi>=0&&bd>1&&setJob(c,{t:'wait',n:2},bi%W,Math.floor(bi/W),true))return;}
  if(mem.some(d=>!d.armed)){c.job={t:'wait',n:2};return;}
  if(!mem.some(d=>d.carry.some(isWood)))return done(G.feats.some(q=>q.k==='brazier')?'has lit what it carried':'has no wood to carry');
  c.job={t:'wait',n:3};return;}
 const freeT=mem.reduce((a,d)=>a+cap(d)-d.carry.length,0);
 if(e.goal==='ore'&&freeT<=loose){if(loose===0||freeT===0)return done('is laden');c.job={t:'wait',n:3};return;}
 let b=null,bd=1e9;
 for(const ft of G.feats){if(ft.x<PW||ft.left<=0||!go.feats.includes(ft.k)||!G.rev[I(ft.x,ft.y)]||!near(ft.x,ft.y)||rsv('f'+ft.id))continue;const d=reachD(f,ft.x,ft.y,true);if(d>=0&&d<bd){bd=d;b=ft;}}
 if(b&&setJob(c,{t:'gather',f:b.id,res:['f'+b.id]},b.x,b.y,true))return;
 if(!isLead){c.job={t:'wait',n:2};return;} // only the leader explores and decides when to go home
 let bi=-1;bd=1e9;for(let y=1;y<H-1;y++)for(let x=PW;x<W-1;x++){const i=I(x,y);if(!G.rev[i]&&f.dist[i]>=0&&f.dist[i]<bd){bd=f.dist[i];bi=i;}}
 if(bi>=0&&setJob(c,{t:'wait',n:1},bi%W,Math.floor(bi/W),false))return;
 if(!G.feats.some(ft=>ft.x>=PW&&ft.left>0&&go.feats.includes(ft.k)&&rsv('f'+ft.id))&&(loose===0||freeT===0)){
  if(e.goal==='map')e.mapped=true;
  return done(e.goal==='map'?'has walked it all':'finds nothing more');}
 c.job={t:'wait',n:3};
}
function fetchJob2(c,spec){const t=findTok(c,spec);if(!t)return false;return setJob(c,{t:'fetch',s:0,spec,to:'arm',x:t.x,y:t.y,res:['t'+t.k]},t.x,t.y,false);}
function goHome(c){const s=stockSpot(c)||{x:24,y:24};if(!setJob(c,{t:'home'},s.x,s.y,false)){c.job={t:'wait',n:3};}}
function sendParty(ids,goal){
 goal=goal||'ore';if(goal==='rescue'&&G.cols.length>=6)goal='ore';
 G.exp={m:ids,goal,state:'out'};G.gateOpen=true;if(!G.zone.on)genZone();
 for(const k of GOAL[goal].feats)if((k==='nest'||k==='cage')&&!G.feats.some(f=>f.k===k)){scatter(k,1,70,93,4,43);if(!G.feats.some(f=>f.k===k))scatter(k,1,56,93,2,45);
  if(k==='nest'){const n=G.feats.find(f=>f.k==='nest');for(let i=0;i<3;i++)mkRat(n.x,n.y);}}
 if(G.card&&G.card.k==='chart'){for(let y=0;y<H;y++)for(let x=PW;x<W;x++)G.rev[I(x,y)]=1;log('The chart shows the whole zone.');}
 for(const id of ids){const c=col(id);endJob(c);c.party=true;c.armed=false;}
 log('A party of '+ids.length+' goes out through the gate: '+GOAL[goal].n.toLowerCase()+'.');
}
function recall(){if(G.exp&&G.exp.state!=='return'){G.exp.state='return';for(const c of G.cols)if(c.party&&!(c.job&&c.job.t==='rescue'))endJob(c);log('The recall bell rings.');}}
// ---- arriving at a job's place
function arrive(c){
 const j=c.job;
 switch(j.t){
 case'wait':if(--j.n<=0)endJob(c);break;
 case'eat':{const t=takeTok(c.x,c.y,{m:20})||takeTok(c.x,c.y,{food:1});
  if(t){c.need.hun=Math.max(0,c.need.hun-M[t.m].eat);if(t.m===20)c.need.str=Math.max(0,c.need.str-1);
   else if(M[t.m].raw&&!roll(c,2,null,1,0,'eats raw '+M[t.m].n).ok){c.need.str=Math.min(6,c.need.str+1);log(c.name+' is sickened by raw food.');}}
  endJob(c);break;}
 case'sleep':c.asleep=true;if(c.need.rest<=0||(!night()&&c.need.rest<=1)){if(nearFire(c))c.need.str=Math.max(0,c.need.str-1);endJob(c);}break;
 case'drop':for(const t of c.carry)addTok(c.x,c.y,t,1);c.carry=[];endJob(c);break;
 case'home':for(const t of c.carry){if(t.card){G.discard.push({k:t.card,pips:CARD[t.card].pips||0});log(c.name+' brings home a card: '+CARD[t.card].n+'.');}else addTok(c.x,c.y,t,1);}
  c.carry=[];if(c.hands[1]){addTok(c.x,c.y,c.hands[1],1);c.hands[1]=null;}c.party=false;c.armed=false;log(c.name+' is home.');
  {const e=G.exp;if(e&&e.goal==='map'&&e.mapped&&!e.paid){e.paid=true;G.discard.push({k:'chart',pips:2});log('The map is drawn up: a Chart card joins the deck.');}}
  endJob(c);break;
 case'brazier':{const i=c.carry.findIndex(isWood);if(i>=0&&!featAt(c.x,c.y)&&c.x>=PW){c.carry.splice(i,1);
   G.feats.push({id:G.nid++,k:'brazier',x:c.x,y:c.y,life:6,left:1,grow:0});recomputeKeep();log(c.name+' lights a brazier. The ground around it is held.');}
  endJob(c);break;}
 case'rescue':{const d=col(j.id);if(!d||!d.down){endJob(c);break;}
  if(j.s===0){d.by=c.id;j.s=1;const s=stockSpot(c)||{x:24,y:24};if(!goTo(c,s.x,s.y,false)){d.by=null;endJob(c);}}
  else{d.by=null;d.home=true;d.downT=0;d.x=c.x;d.y=c.y;log(c.name+' carries '+d.name+' home.');
   if(d.captive){d.captive=false;d.down=false;log(d.name+' is freed and stays.');}endJob(c);}break;}
 case'fight':{const e=G.crit.find(e=>e.id===j.id);if(!e){endJob(c);break;}
  if(md(e,c)>1){if(!goTo(c,e.x,e.y,true))endJob(c);break;}
  attack(c,e);c.cd=1;break;}
 case'dig':{if(!j.w){j.w=1;c.cd=8;break;}
  const x=j.x,y=j.y,h=topZ(x,y);delete G.digs[K(x,y)];
  if(h>1){const m=topMat(x,y),tool=c.hands[0]&&c.hands[0].it==='pick'?1:0,seam=seamDie();
   const r=roll(c,0,SKILL[M[m].f],M[m].h>=3?2:1,tool+seam,'digs '+M[m].n);
   G.vox[VI(x,y,h-1)]=0;let nh=h-1;while(nh>0&&!G.vox[VI(x,y,nh-1)])nh--;G.hgt[I(x,y)]=nh; // there may be a hollow underneath
   const ft=featAt(x,y);if(ft)G.feats=G.feats.filter(q=>q!==ft);
   if(m!==19){if(r.ok)addTok(x,y,{m});else log('The '+M[m].n+' shatters to nothing.');}}
  endJob(c);break;}
 case'gather':{const ft=G.feats.find(q=>q.id===j.f);if(!ft||ft.left<=0){endJob(c);break;}const F=FEAT[ft.k];
  if(!j.w){j.w=1;c.cd=F.dur;break;}
  const tool=c.hands[0]&&c.hands[0].it===F.tool?1:0,seam=F.tool==='pick'?seamDie():0;
  const r=roll(c,F.tr,F.sk||SKILL[M[F.m].f],F.d,tool+seam,'works '+F.n);
  if(F.card){const ks=['seam','dry','wander','seam','dry'];addTok(ft.x,ft.y,{card:ks[ri(ks.length)]});}
  else if(F.cage){if(G.cols.length<6){const d=mkCol(ft.x,ft.y);d.down=true;d.home=false;d.captive=true;d.need.hun=4;log('The cage opens. '+d.name+' cannot walk and must be carried.');}
   if(G.exp)G.exp.state='return';}
  else addTok(ft.x,ft.y,{m:F.m});
  ft.left--;if(ft.left<=0){if(F.grow)ft.grow=DAY*2;else G.feats=G.feats.filter(q=>q!==ft);}
  if(!r.ok){c.cd=8;j.w=0;if(ft.left>0)break;}else if(ft.left>0&&(c.party||ft.k==='tree'||ft.k==='scrap')){j.w=0;break;}
  endJob(c);if(!r.ok)c.cd=8;break;}
 case'make':{const s=G.sites.find(q=>q.id===j.sid);if(!s){endJob(c);break;}
  if(!j.w){j.w=1;c.cd=8;break;}
  const sk=s.kind==='bill'?SKILL[M[s.m].f]:s.kind==='bench'?'Wood':'Stone',tr=s.kind==='bill'||s.kind==='bench'?1:0;
  const d=s.kind==='bill'&&M[s.m].f==='metal'?2:1;
  const r=roll(c,tr,sk,d,0,s.kind==='bill'?'makes '+ITEM[s.it].n:'builds');
  G.sites=G.sites.filter(q=>q!==s);
  if(s.kind==='hearth'||s.kind==='bench'){G.feats.push({id:G.nid++,k:s.kind,x:s.x,y:s.y,m:s.m,fuel:0,left:1,grow:0});log('A '+FEAT[s.kind].n+' stands.');}
  else if(s.kind==='voxel'){const h=topZ(s.x,s.y);if(h<Z-2){G.vox[VI(s.x,s.y,h)]=s.m;G.hgt[I(s.x,s.y)]=h+1;}}
  else{const it={it:s.it,m:s.m};if(!r.ok){it.flawed=1;log('The '+ITEM[s.it].n+' comes out flawed.');}addTok(s.x,s.y,it);}
  endJob(c);if(!r.ok)c.cd=6;break;}
 case'fetch':{
  if(j.s===0){let n=0;const max=j.to==='stock'||j.to==='keep'?cap(c)-c.carry.length:1;
   if(j.to==='wear'||j.to==='arm'){const t=takeTok(c.x,c.y,j.spec);if(t){const I_=ITEM[t.it];
     if(I_.slot!=null)c.worn[I_.slot]=t;else if(I_.wpn)c.hands[1]=t;else c.hands[0]=t;log(c.name+' takes up a '+M[t.m].n+' '+I_.n+'.');}
    endJob(c);break;}
   while(n<max){const t=takeTok(c.x,c.y,j.spec);if(!t)break;c.carry.push(t);n++;}
   if(!n||j.to==='keep'){endJob(c);break;}
   j.s=1;let ok;
   if(j.to==='stock'){const s=stockSpot(c);ok=s&&goTo(c,s.x,s.y,false);}
   else if(j.to==='site'){const s=G.sites.find(q=>q.id===j.sid);ok=s&&goTo(c,s.x,s.y,true);}
   else{const h=hearth();ok=h&&goTo(c,h.x,h.y,true);}
   if(!ok)endJob(c);break;}
  if(j.to==='stock'){for(const t of c.carry)addTok(c.x,c.y,t,1);c.carry=[];}
  else if(j.to==='site'){const s=G.sites.find(q=>q.id===j.sid),t=c.carry.pop();if(s&&t){s.have++;if(s.kind!=='bill')s.m=t.m;}else if(t)addTok(c.x,c.y,t);}
  else if(j.to==='fuel'){c.carry.pop();hearth().fuel+=G.card&&G.card.k==='dry'?180:120;}
  else if(j.to==='cook'){if(!j.w){j.w=1;c.cd=6;break;}const t=c.carry.pop();
   const r=roll(c,1,SKILL[M[t.m].f],1,c.hands[0]&&c.hands[0].it==='knife'?1:0,'cooks '+M[t.m].n);addTok(c.x,c.y,{m:20},1);if(!r.ok)c.cd=8;}
  endJob(c);break;}
 }
}
function seamDie(){if(G.card&&G.card.k==='seam'&&!G.seam){G.seam=true;return 1;}return 0;}
// ---- fighting
function attack(a,d){
 const wi=a.hands&&a.hands[1],ws=a.name?(wi?ITEM[wi.it].wpn:null):'Bite';
 const ar=roll(a,a.name?0:1,ws,0,wi?1:0,'strikes at '+(d.name||d.k));
 const sh=d.hands&&d.hands[0]&&ITEM[d.hands[0].it].shield;
 const dr=roll(d,1,sh?'Shield':null,0,sh?1:0,'defends');
 const mg=ar.s-dr.s;
 if(mg<=0){if(a.name&&ws)mark(a,ws);return;}
 if(d.name&&sh)mark(d,'Shield');
 for(let n=mg>=2?2:1;n>0;n--){const ai=ri(6),w=d.worn&&d.worn[ai];
  if(w){let s=0;for(let i=M[w.m].h-(w.flawed?1:0);i>0;i--)if(1+ri(6)>=5)s++;if(s){log((d.name||d.k)+"'s "+ITEM[w.it].n+' turns the blow.');continue;}}
  d.wd[ai]++;log((d.name||d.k)+' is wounded: '+AREA[ai]+'.');}
 if(d.name){if(wounds(d)>=3&&!d.down)goDown(d);}
 else if(wounds(d)>=2){G.crit=G.crit.filter(e=>e!==d);addTok(d.x,d.y,{m:16});if(ri(2))addTok(d.x,d.y,{m:11});log('The '+d.k+' dies.');}
}
function goDown(c){
 endJob(c);for(const t of c.carry)addTok(c.x,c.y,t);c.carry=[];
 for(const o of G.cols){if(o.by===c.id)o.by=null;if(o!==c)o.need.str=Math.min(6,o.need.str+1);}
 c.down=true;c.downT=0;c.party=false;c.armed=false;c.home=isHome(c);log(c.name+' is DOWN.');
}
function die(c){
 log(c.name+' dies, abandoned.');addTok(c.x,c.y,{corpse:c.name});
 for(const t of c.worn.concat(c.hands))if(t)addTok(c.x,c.y,t);
 G.cols=G.cols.filter(o=>o!==c);for(const o of G.cols)o.need.str=Math.min(6,o.need.str+2);
 for(const k in G.res)if(G.res[k]===c.id)delete G.res[k];
 if(G.sel===c.id)G.sel=G.cols.length?G.cols[0].id:null;
 if(!G.cols.length){G.over=true;log('No one is left. The ruin keeps what it was given.');}
}
// ---- per tick
function tickCol(c){
 const t=G.t,n=c.need;
 if(t%60===0)n.hun=Math.min(6,n.hun+1);
 if(c.asleep||c.down){if(t%8===0)n.rest=Math.max(0,n.rest-1);}else if(t%40===0)n.rest=Math.min(6,n.rest+1);
 if(t%20===0){const cold=(night()?1:0)+(season()===3?1:0)+(season()===2&&night()?1:0)+(G.card&&G.card.k==='cold'?1:0)-(nearFire(c)?3:0)-(c.worn[1]?1:0)-(c.worn[5]&&c.worn[5].it==='cloak'?1:0);
  n.temp=Math.max(0,Math.min(6,n.temp+(cold>0?1:-1)));}
 if(c.down){
  if(c.by!=null){const b=col(c.by);if(b){c.x=b.x;c.y=b.y;}else c.by=null;return;}
  if(++c.downT>=DAY){if(!c.home)return die(c);
   c.down=false;c.downT=0;c.wd=[0,0,0,0,0,0];c.wd[1]=1;const s=ri(6);if(!c.scars.includes(s))c.scars.push(s);
   log(c.name+' rises, scarred: '+TR[s]+' rolls now need a 6.');}
  return;}
 if(c.cd>0){c.cd--;return;}
 if(c.job&&c.x>=PW&&c.job.t!=='fight'&&c.job.t!=='rescue'&&(enemyNear(c,3)||(c.party&&G.cols.some(d=>d.party&&d.job&&d.job.t==='fight'))))endJob(c);
 if(!c.job)pickJob(c);
 if(!c.job)return;
 if(c.path.length){
  if((c.wd[2]||c.wd[3])&&t%2)return;
  if(c.party&&c.x>=PW-1&&c.job.t!=='fight'&&c.job.t!=='rescue'&&partyHold(c))return;
  const i=c.path.shift(),x=i%W,y=(i-x)/W;
  if(!passable(c.x,c.y,x,y)){endJob(c);return;}
  c._px=c.x;c._py=c.y;c._mv=G.t;c.face=dirOf(x-c.x,y-c.y);c.x=x;c.y=y;return;}
 const j=c.job;if(j.t==='fight'){const e=G.crit.find(e=>e.id===j.id);if(e)c.face=dirOf(e.x-c.x,e.y-c.y);}
 else if(j.tx!=null&&(j.tx!==c.x||j.ty!==c.y)&&!(j.t==='rescue'&&j.s)&&!(j.t==='fetch'&&j.s===0))c.face=dirOf(j.tx-c.x,j.ty-c.y);
 arrive(c);
}
function tickCrit(e){
 if(e.cd>0){e.cd--;return;}
 let b=null,bd=7;for(const c of G.cols){if(c.down||c.x<PW)continue;const d=md(c,e);if(d<bd){bd=d;b=c;}}
 if(b&&bd<=1){e.face=dirOf(b.x-e.x,b.y-e.y);attack(e,b);e.cd=2;return;}
 if(!b&&ri(4))return;
 const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>({x:e.x+d[0],y:e.y+d[1]})).filter(p=>p.x>=PW&&passable(e.x,e.y,p.x,p.y)&&!G.crit.some(o=>o.x===p.x&&o.y===p.y));
 if(!opts.length)return;
 const p=b?opts.sort((p,q)=>md(p,b)-md(q,b))[0]:opts[ri(opts.length)];
 if(!b||md(p,b)<bd){e._px=e.x;e._py=e.y;e._mv=G.t;e.face=dirOf(p.x-e.x,p.y-e.y);e.x=p.x;e.y=p.y;}
}
function dawn(){
 G.seam=false;
 const res=[['hun',0,'hunger'],['temp',1,'cold'],['rest',4,'weariness'],['str',5,'dread']];
 for(const c of G.cols){c.pen=0;if(c.down)continue;
  for(const r of res)if(c.need[r[0]]>=6&&!roll(c,r[1],null,1,0,'resists '+r[2]).ok){c.pen=1;if(r[0]!=='str')c.need.str=Math.min(6,c.need.str+1);}
  if(wounds(c)>=2&&!roll(c,2,null,1,0,'bears wounds').ok)c.pen=1;
  if(wounds(c)&&isHome(c)){const i=c.wd.findIndex(w=>w>0);c.wd[i]--;}}
 let lost=false;for(const f of G.feats)if(f.k==='brazier'&&--f.life<=0)lost=true;
 if(lost){G.feats=G.feats.filter(f=>!(f.k==='brazier'&&f.life<=0));recomputeKeep();log('A brazier burns out. The fog creeps back over that ground.');
  if(!G.zone.on)forgetZone();}
 if(G.card){const d=G.card;if(CARD[d.k].pips){d.pips--;if(d.pips<=0)log(CARD[d.k].n+' is spent and leaves the deck.');else G.discard.push(d);}else G.discard.push(d);}
 if(!G.deck.length){G.deck=G.discard;G.discard=[];}
 G.card=G.deck.length?G.deck.splice(ri(G.deck.length),1)[0]:null;
 if(G.card){const k=G.card.k;log('Dawn, '+SEASON[season()]+' day '+(day()%6+1)+'. Card: '+CARD[k].n+'. '+CARD[k].t);
  if(k==='vermin'){const t=findAnyFood();if(t)log('Vermin spoil a '+M[t.m].n+'.');}
  if(k==='wander'&&G.cols.length<6){const c=mkCol(46,24);log(c.name+' comes in from the road and stays.');}}
}
function findAnyFood(){for(const k in G.tok){const p=k.split(',');if(+p[0]>=PW)continue;const t=takeTok(+p[0],+p[1],{food:1});if(t)return t;}return null;}
function tick(){
 if(G.over)return;
 G.fx=G.fx.filter(f=>--f.ttl>0);
 G.t++;G._cnt=null;
 if(G.t%DAY===0)dawn();
 const h=hearth();if(h&&h.fuel>0)h.fuel--;
 if(season()!==3)for(const f of G.feats)if(f.grow>0&&--f.grow===0)f.left=FEAT[f.k].uses;
 if(G.t%150===0&&G.crit.length<8){const n=G.feats.find(f=>f.k==='nest');if(n)mkRat(n.x,n.y);}
 for(const c of G.cols.slice())tickCol(c);
 for(const e of G.crit.slice())tickCrit(e);
 for(const c of G.cols)if(c.x>=PW-1)for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=c.x+dx,y=c.y+dy;if(x>=PW&&x<W&&y>=0&&y<H&&dx*dx+dy*dy<=27)G.rev[I(x,y)]=1;}
 if(G.exp&&!G.cols.some(c=>c.party))G.exp=null;
 if(G.zone.on&&!G.exp&&!G.cols.some(c=>c.x>=PW))forgetZone();
 if(G.t%60===0)save();
}
