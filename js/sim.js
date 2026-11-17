'use strict';
const hearth=()=>G.feats.find(f=>f.k==='hearth'), bench=()=>G.feats.find(f=>f.k==='bench');
const col=id=>G.cols.find(c=>c.id===id);
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cap=c=>(c.hands[0]?0:1)+(c.hands[1]?0:1)+(c.worn[5]&&ITEM[c.worn[5].it].pack||0);
const wounds=w=>w.wd.reduce((a,b)=>a+b,0);
const rsv=k=>G.res[k]!=null;
function nearFire(c){const h=hearth();return h&&h.fuel>0&&md(h,c)<=3;}
function mark(c,s){c.mk[s]=(c.mk[s]||0)+1;const lv=c.sk[s]||0;
 if(lv<3&&c.mk[s]>=[2,4,6][lv]){c.sk[s]=lv+1;c.mk[s]=0;log(c.name+' learns from failure: '+s+' '+(lv+1)+'.');pop(c.x,c.y,c.z,s+' '+(lv+1)+'!','#f0c040');emit('make');}}
function roll(w,tr,skill,diff,bonus,label){
 const n=Math.max(1,w.tr[tr]+(skill?(w.sk[skill]||0):0)+(bonus||0)-(w.pen||0)-(w.wd[4]>0?1:0)+(w.name?persDie(w,skill,label):0));
 const tgt=w.scars&&w.scars.includes(tr)?6:5,dice=[];let s=0;
 for(let i=0;i<n;i++){const d=1+ri(6);dice.push(d);if(d>=tgt)s++;}
 const ok=s>=diff;G.fx.push({x:w.x,y:w.y,dice,tgt,ttl:5});
 if(w.name)log(w.name+' '+label+': '+TRS[tr]+(skill?'+'+skill:'')+' ['+dice.join(' ')+'] '+(diff?s+'/'+diff+(ok?'':' FAIL'):s));
 if(diff&&!ok&&skill&&w.name)mark(w,skill);
 if(diff&&!ok&&w.name&&/^(digs|works)/.test(label)&&(G.noise||0)<1){G.noise=(G.noise||0)+.1;addThreat(.1,'noise');} // at most one threat a day from noise
 if(w.name)emit('roll',{ok:diff?ok:s>0});
 if(w.name&&diff)bondAfter(w,ok);
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
 for(const k in G.tok){if(tparse(k)[0]>=PW)continue;for(const t of G.tok[k]){if(t.it||t.card||t.corpse)continue;
  const f=M[t.m].f;c.fam[f]=(c.fam[f]||0)+1;c.m[t.m]=(c.m[t.m]||0)+1;if(M[t.m].eat)c.food++;if(t.m===20)c.meal++;}}
 return G._cnt=c;}
// ---- Movement in 3D. A standing spot is a tile and a floor height z: solid rock under it at z-1 and two voxels of room
// (a person is two voxels tall). A tile can have several spots, e.g. the floor under a ledge and the top of the ledge.
// Path nodes are N(x,y,z). A step goes to a side neighbour and up or down at most one voxel, with headroom for the climb.
const NN=W*H*(Z+1),N=(x,y,z)=>(z*H+y)*W+x;
const solid=(x,y,z)=>z>=0&&z<Z&&G.vox[(z*H+y)*W+x]!==0;
function spot(x,y,z){if(x<0||y<0||x>=W||y>=H||z<1||z>Z||!G.hgt[y*W+x])return false;
 if(!solid(x,y,z-1)||solid(x,y,z)||solid(x,y,z+1))return false;
 return!(x===47&&y===24&&!G.gateOpen&&!G.gateBroken);}
function canMove(x,y,z,nx,ny,nz){if(Math.abs(nz-z)>1||!spot(nx,ny,nz))return false;
 if(nz>z&&solid(x,y,z+2))return false;if(nz<z&&solid(nx,ny,z+1))return false;return true;}
// the floor height reached by stepping from (x,y,z) onto tile (nx,ny), or -1
function stepZ(x,y,z,nx,ny){for(const nz of[z,z+1,z-1])if(canMove(x,y,z,nx,ny,nz))return nz;return-1;}
const topN=(x,y)=>N(x,y,G.hgt[y*W+x]);
function flood(c){
 const s=N(c.x,c.y,c.z);if(c._f&&c._ft===G.t&&c._fi===s)return c._f;
 const dist=new Int16Array(NN).fill(-1),prev=new Int32Array(NN),q=new Int32Array(W*H*4);let qh=0,qt=0;
 dist[s]=0;q[qt++]=s;
 while(qh<qt){const i=q[qh++],x=i%W,r=(i/W)|0,y=r%H,z=(r/H)|0,d=dist[i]+1;
  for(let k=0;k<4;k++){const nx=x+(k===0?1:k===1?-1:0),ny=y+(k===2?1:k===3?-1:0);if(nx<0||ny<0||nx>=W||ny>=H)continue;
   const nz=stepZ(x,y,z,nx,ny);if(nz<0)continue;const j=N(nx,ny,nz);if(dist[j]>=0)continue;dist[j]=d;prev[j]=i;q[qt++]=j;}}
 c._f={dist,prev};c._ft=G.t;c._fi=s;return c._f;
}
// Targets. tz is the height of the thing being reached: by default the top of its tile. 'any' accepts any spot on the tile.
// adj: stand on a side neighbour within one voxel of tz.
function targets(x,y,adj,tz,fn){if(tz==null)tz=x>=0&&y>=0&&x<W&&y<H?G.hgt[y*W+x]:0;
 const col=(tx,ty)=>{if(tx<0||ty<0||tx>=W||ty>=H)return;
  if(adj)for(let z=tz-1;z<=tz+1;z++){if(z>=1&&z<=Z)fn(N(tx,ty,z));}
  else if(tz==='any'){for(let z=1;z<=Z;z++)fn(N(tx,ty,z));}else fn(N(tx,ty,tz));};
 if(adj){col(x+1,y);col(x-1,y);col(x,y+1);col(x,y-1);}else col(x,y);}
function reachD(f,x,y,adj,tz){let b=-1;targets(x,y,adj,tz,j=>{const d=f.dist[j];if(d>=0&&(b<0||d<b))b=d;});return b;}
function goTo(c,x,y,adj,tz){
 const f=flood(c);let best=-1,bd=1e9;
 targets(x,y,adj,tz,j=>{const d=f.dist[j];if(d>=0&&d<bd){bd=d;best=j;}});
 if(best<0)return false;
 const p=[],s=N(c.x,c.y,c.z);let i=best;while(i!==s){p.push(i);i=f.prev[i];}
 c.path=p.reverse();return true;
}
const dirOf=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx>=0?0:2):(dy>0?1:3);
function setJob(c,j,x,y,adj,tz){if(!goTo(c,x,y,adj,tz))return false;if(adj){j.tx=x;j.ty=y;}c.job=j;for(const k of j.res||[])G.res[k]=c.id;return true;}
function endJob(c){if(c.job)for(const k of c.job.res||[])if(G.res[k]===c.id)delete G.res[k];c.job=null;c.path=[];c.asleep=false;}
// nearest reachable token tile matching spec. o.zone: look beyond the gate; o.loose: not in stockpile
function findTok(c,spec,o){o=o||{};const f=flood(c);let best=null,bd=1e9;
 for(const k in G.tok){const a=G.tok[k];if(!a.length||rsv('t'+k))continue;const p=tparse(k),x=p[0],y=p[1],z=p[2];
  if(o.zone?(x<PW||!G.rev[I(x,y)]):x>=PW)continue;if(o.loose&&G.stock[K(x,y)]&&z===G.hgt[I(x,y)])continue;/* already on the stockpile */if(o.ok&&!o.ok(x,y))continue;
  if(!a.some(t=>match(t,spec)))continue;const d=f.dist[N(x,y,z)];if(d>=0&&d<bd){bd=d;best={x,y,z,k};}}
 return best;}
function takeTok(x,y,spec,z){const k=TK(x,y,z==null?G.hgt[I(x,y)]:z),a=G.tok[k];if(!a)return null;const i=a.findIndex(t=>match(t,spec));if(i<0)return null;
 const t=a.splice(i,1)[0];if(!a.length)delete G.tok[k];return t;}
function stockSpot(c){const f=flood(c);let best=null,bd=1e9;
 for(const k in G.stock){const p_=k.split(',');if((G.tok[TK(+p_[0],+p_[1],G.hgt[I(+p_[0],+p_[1])])]||[]).length>=6)continue;const p=k.split(','),d=f.dist[topN(+p[0],+p[1])];if(d>=0&&d<bd){bd=d;best={x:+p[0],y:+p[1]};}}
 return best;}
function isHome(c){if(c.x>=PW)return false;for(const k in G.stock){const p=k.split(',');if(Math.abs(p[0]-c.x)+Math.abs(p[1]-c.y)<=4)return true;}return false;}
function fetchJob(c,spec,to,extra,o){
 if(cap(c)<=c.carry.length)return false;const t=findTok(c,spec,o);if(!t)return false;
 return setJob(c,Object.assign({t:'fetch',s:0,spec,to,x:t.x,y:t.y,res:['t'+t.k].concat(extra&&extra.res||[])},extra,{res:['t'+t.k].concat(extra&&extra.res||[])}),t.x,t.y,false,t.z);
}
// ---- colony jobs, tried in order
function jRescue(c){const d=G.cols.find(d=>d.down&&!d.home&&d.by==null&&!rsv('c'+d.id));if(!d)return false;
 return setJob(c,{t:'rescue',s:0,id:d.id,res:['c'+d.id]},d.x,d.y,true,d.z);}
function jEat(c){if(c.need.hun<3)return false;const t=findTok(c,{m:20})||findTok(c,{food:1});if(!t)return false;
 return setJob(c,{t:'eat',res:['t'+t.k]},t.x,t.y,false,t.z);}
function jSleep(c){if(!(c.need.rest>=5||(night()&&c.need.rest>=2)))return false;const h=hearth();
 if(h&&c.x<PW&&setJob(c,{t:'sleep'},h.x,h.y,true))return true;c.job={t:'sleep'};return true;}
function jWarm(c){const h=hearth();if(c.need.temp<4||!h||h.fuel<=0||nearFire(c))return false;return setJob(c,{t:'wait',n:20},h.x,h.y,true);}
function jFuel(c){const h=hearth();if(!h||h.fuel>=30||rsv('fuel'))return false;
 if(!(tod()>=150||season()===3||G.cols.some(d=>d.need.temp>=3)))return false;
 return fetchJob(c,{fam:'wood'},'fuel',{res:['fuel']});}
function jCook(c){const h=hearth();if(!h||h.fuel<20||rsv('cook')||counts().meal>=4)return false;return fetchJob(c,{raw:1},'cook',{res:['cook']});}
function jSupply(c){for(const s of G.sites){if(s.have>=s.need||rsv('s'+s.id))continue;if(fetchJob(c,s.spec,'site',{sid:s.id,res:['s'+s.id]}))return true;}return false;}
function jMake(c){for(const s of G.sites){if(s.have<s.need||rsv('s'+s.id))continue;if(setJob(c,{t:'make',sid:s.id,res:['s'+s.id]},s.x,s.y,true))return true;}return false;}
// a voxel to dig is reached from a side neighbour standing within a voxel of its height
function jDig(c){const f=flood(c);let b=null,bd=1e9;for(const k in G.digs){if(rsv('d'+k))continue;const p=tparse(k),d=reachD(f,p[0],p[1],true,p[2]);if(d>=0&&d<bd){bd=d;b={x:p[0],y:p[1],z:p[2],k};}}
 return b?setJob(c,{t:'dig',x:b.x,y:b.y,z:b.z,res:['d'+b.k]},b.x,b.y,true,b.z):false;}
function jEquip(c){for(let s=0;s<6;s++)if(!c.worn[s]&&fetchJob(c,{worn:s},'wear'))return true;
 if(!c.hands[0]&&c.carry.length===0&&fetchJob(c,{tool:1},'wear'))return true;return false;}
function jHaul(c){if(!stockSpot(c))return false;return fetchJob(c,{any:1},'stock',null,{loose:1});}
function jGather(c){const n=counts(),want=[];
 if(n.food<8)want.push('crop','moss','tuber');if((n.fam.wood||0)<8)want.push('tree');if((n.fam.metal||0)<6)want.push('scrap');if((n.fam.fiber||0)<4)want.push('reed');
 if(!want.length)return false;const f=flood(c);let b=null,bd=1e9;
 for(const ft of G.feats){if(ft.x>=PW||ft.left<=0||!want.includes(ft.k)||rsv('f'+ft.id))continue;
  const d0=reachD(f,ft.x,ft.y,true,ft.z),d=d0+want.indexOf(ft.k)*3;if(d0>=0&&d<bd){bd=d;b=ft;}}
 return b?setJob(c,{t:'gather',f:b.id,res:['f'+b.id]},b.x,b.y,true,b.z):false;}
function jDrop(c){if(!c.carry.length)return false;const s=stockSpot(c);if(!s)return false;return setJob(c,{t:'drop'},s.x,s.y,false);}
function jIdle(c){const x=24+ri(9)-4,y=24+ri(9)-4;if(!setJob(c,{t:'wait',n:((c.pers||[]).includes('lazy')?14:6)+ri(8)},x,y,false,'any'))c.job={t:'wait',n:5};return true;}
function pickJob(c){
 if(c.party)return partyJob(c);
 if(c.hands[1]&&!rsv('x')){addTok(c.x,c.y,c.hands[1],0,c.z);c.hands[1]=null;}
 (c.wander>0&&!c.job)||jDefend(c)||jRescue(c)||jEat(c)||jSleep(c)||jWarm(c)||jDrop(c)||jFuel(c)||jCook(c)||jMake(c)||jSupply(c)||jFarm(c)||jDig(c)||jEquip(c)||jHaul(c)||jGather(c)||jIdle(c);
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
 if(en&&setJob(c,{t:'fight',id:en.id},en.x,en.y,true,en.z))return;
 if(jRescue(c))return;
 if(c.x<PW&&e.state!=='return'&&mem.some(d=>!d.armed)){c.job={t:'wait',n:2};return;}          // leave together
 if(!isLead&&md(c,lead)>4&&setJob(c,{t:'wait',n:1},lead.x,lead.y,true,lead.z))return;                 // catch up
 if(partyHold(c)){c.job={t:'wait',n:2};return;}                                                // wait for stragglers
 if(e.state==='return')return goHome(c);
 const f=flood(c);
 // a leader with no hands free walks the party to the nearest loot, so the others can pick it up
 const leadTo=()=>{if(!isLead||!go.loot)return false;const ff=flood(c);let b=null,bd=1e9;
  for(const k in G.tok){const p=tparse(k);if(p[0]<PW||!G.rev[I(p[0],p[1])]||!G.tok[k].some(t=>match(t,go.loot)))continue;const d=ff.dist[N(p[0],p[1],p[2])];if(d>=0&&d<bd){bd=d;b=p;}}
  return!!b&&bd>2&&setJob(c,{t:'wait',n:2},b[0],b[1],true,b[2]);};
 if(e.state!=='return'&&mem.some(d=>d.need.hun>=5||d.need.rest>=6)){e.state='return';log('The party is hungry and worn out and turns for home.');return goHome(c);}
 const done=why=>{e.state='return';log('The party '+why+' and turns for home.');goHome(c);};
 let loose=0;if(go.loot)for(const k in G.tok){const p=tparse(k);if(p[0]>=PW&&G.rev[I(p[0],p[1])]&&f.dist[N(p[0],p[1],p[2])]>=0)/* only loot someone can reach */loose+=G.tok[k].filter(t=>match(t,go.loot)).length;}
 if(loose>0&&cap(c)>c.carry.length&&fetchJob(c,go.loot,'keep',null,{zone:1,ok:near}))return;
 if(e.goal==='card'&&mem.some(d=>d.carry.some(t=>t.card)))return done('has what it came for');
 if(e.goal==='reclaim'){
  if(c.carry.some(isWood)){let bi=-1,bd=1e9;
   for(let y=2;y<H-2;y++)for(let x=PW+1;x<W-2;x++){const i=I(x,y),di=f.dist[topN(x,y)];if(G.keep[i]||(x+y*2)%5||di<0||di>=bd||!near(x,y)||featAt(x,y))continue;bd=di;bi=i;}
   if(bi>=0&&setJob(c,{t:'brazier'},bi%W,Math.floor(bi/W),false))return;}
  else if(isLead&&mem.some(d=>d.carry.some(isWood))){let bi=-1,bd=1e9;
   for(let y=2;y<H-2;y++)for(let x=PW+1;x<W-2;x++){const i=I(x,y),di=f.dist[topN(x,y)];if(G.keep[i]||(x+y*2)%5||di<0||di>=bd||featAt(x,y))continue;bd=di;bi=i;}
   if(bi>=0&&bd>1&&setJob(c,{t:'wait',n:2},bi%W,Math.floor(bi/W),true))return;}
  if(mem.some(d=>!d.armed)){c.job={t:'wait',n:2};return;}
  if(!mem.some(d=>d.carry.some(isWood)))return done(G.feats.some(q=>q.k==='brazier')?'has lit what it carried':'has no wood to carry');
  c.job={t:'wait',n:3};return;}
 const freeT=mem.reduce((a,d)=>a+Math.max(0,cap(d)-d.carry.length),0);
 if(e.goal==='ore'&&freeT<=loose){if(loose===0||freeT===0)return done('is laden');if(leadTo())return;c.job={t:'wait',n:3};return;}
 let b=null,bd=1e9;
 for(const ft of G.feats){if(ft.x<PW||ft.left<=0||!go.feats.includes(ft.k)||!G.rev[I(ft.x,ft.y)]||!near(ft.x,ft.y)||rsv('f'+ft.id))continue;const d=reachD(f,ft.x,ft.y,true,ft.z);if(d>=0&&d<bd){bd=d;b=ft;}}
 if(b&&setJob(c,{t:'gather',f:b.id,res:['f'+b.id]},b.x,b.y,true,b.z))return;
 if(!isLead){c.job={t:'wait',n:2};return;} // only the leader explores and decides when to go home
 let bi=-1;bd=1e9;for(let y=1;y<H-1;y++)for(let x=PW;x<W-1;x++){const i=I(x,y);if(G.rev[i])continue;const di=reachD(f,x,y,false,'any');if(di>=0&&di<bd){bd=di;bi=i;}}
 if(bi>=0&&setJob(c,{t:'wait',n:1},bi%W,Math.floor(bi/W),false,'any'))return;
 if(!G.feats.some(ft=>ft.x>=PW&&ft.left>0&&go.feats.includes(ft.k)&&rsv('f'+ft.id))&&(loose===0||freeT===0||(cap(c)<=c.carry.length&&!leadTo()))){ // a full leader cannot lead the others to more loot
  if(e.goal==='map')e.mapped=true;
  return done(e.goal==='map'?'has walked it all':'finds nothing more');}
 c.job={t:'wait',n:3};
}
function fetchJob2(c,spec){const t=findTok(c,spec);if(!t)return false;return setJob(c,{t:'fetch',s:0,spec,to:'arm',x:t.x,y:t.y,res:['t'+t.k]},t.x,t.y,false,t.z);}
function goHome(c){const s=stockSpot(c)||{x:24,y:24};if(!setJob(c,{t:'home'},s.x,s.y,false)){c.job={t:'wait',n:3};}}
function sendParty(ids,goal){
 goal=goal||'ore';if(goal==='rescue'&&G.cols.length>=6)goal='ore';
 G.exp={m:ids,goal,state:'out'};G.gateOpen=true;if(!G.zone.on){genZone();addThreat(1,'a new breach');}
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
 case'eat':{const t=takeTok(c.x,c.y,{m:20},c.z)||takeTok(c.x,c.y,{food:1},c.z);
  if(t){c.need.hun=Math.max(0,c.need.hun-M[t.m].eat);if(t.m===20)c.need.str=Math.max(0,c.need.str-1);
   else if(M[t.m].raw&&!roll(c,2,null,1,0,'eats raw '+M[t.m].n).ok){c.need.str=Math.min(6,c.need.str+1);log(c.name+' is sickened by raw food.');}}
  endJob(c);break;}
 case'sleep':c.asleep=true;if(c.need.rest<=0||(!night()&&c.need.rest<=1)){if(nearFire(c))c.need.str=Math.max(0,c.need.str-1);endJob(c);}break;
 case'drop':for(const t of c.carry)addTok(c.x,c.y,t,1,c.z);c.carry=[];endJob(c);break;
 case'home':for(const t of c.carry){if(!t.it&&!t.card&&!t.corpse&&M[t.m].f==='metal')G.stats.ore++;if(t.card){G.discard.push({k:t.card,pips:CARD[t.card].pips||0});log(c.name+' brings home a card: '+CARD[t.card].n+'.');}else addTok(c.x,c.y,t,1,c.z);}
  c.carry=[];if(c.hands[1]){addTok(c.x,c.y,c.hands[1],1,c.z);c.hands[1]=null;}c.party=false;c.armed=false;log(c.name+' is home.');
  {const e=G.exp;if(e&&e.goal==='map'&&e.mapped&&!e.paid){e.paid=true;G.discard.push({k:'chart',pips:2});G.stats.maps++;log('The map is drawn up: a Chart card joins the deck.');}}
  endJob(c);break;
 case'brazier':{const i=c.carry.findIndex(isWood);if(i>=0&&!featAt(c.x,c.y)&&c.x>=PW){c.carry.splice(i,1);
   G.feats.push({id:G.nid++,k:'brazier',x:c.x,y:c.y,life:6,left:1,grow:0});recomputeKeep();log(c.name+' lights a brazier. The ground around it is held.');}
  endJob(c);break;}
 case'rescue':{const d=col(j.id);if(!d||!d.down){endJob(c);break;}
  if(j.s===0){d.by=c.id;j.s=1;const s=stockSpot(c)||{x:24,y:24};if(!goTo(c,s.x,s.y,false)){d.by=null;endJob(c);}}
  else{d.by=null;d.home=true;d.downT=0;d.x=c.x;d.y=c.y;d.z=c.z;log(c.name+' carries '+d.name+' home.');
   if(d.captive){d.captive=false;d.down=false;log(d.name+' is freed and stays.');}endJob(c);}break;}
 case'fight':{const e=G.crit.find(e=>e.id===j.id);if(!e){endJob(c);break;}
  if(md(e,c)>1){if(!goTo(c,e.x,e.y,true,e.z))endJob(c);break;}
  attack(c,e);c.cd=1;break;}
 case'dig':{if(!j.w){j.w=1;c.cd=8;break;}
  const x=j.x,y=j.y,h=topZ(x,y),z=j.z!=null?j.z:h-1;delete G.digs[TK(x,y,z)];
  if(z>=1&&G.vox[VI(x,y,z)]){const m=G.vox[VI(x,y,z)],tool=c.hands[0]&&c.hands[0].it==='pick'?1:0,seam=seamDie();
   const r=roll(c,0,SKILL[M[m].f],M[m].h>=3?2:1,tool+seam,'digs '+M[m].n);
   G.vox[VI(x,y,z)]=0;touch(x,y);
   if(z===h-1){let nh=h-1;while(nh>0&&!G.vox[VI(x,y,nh-1)])nh--;G.hgt[I(x,y)]=nh; // there may be a hollow underneath
    const ft=featAt(x,y);if(ft&&ft.z==null)G.feats=G.feats.filter(q=>q!==ft);moveTop(x,y,h,nh);}
   emit('dig');if(m!==19){if(r.ok){addTok(c.x,c.y,{m},0,c.z);pop(x,y,z,'+'+M[m].n,M[m].c);}else log('The '+M[m].n+' shatters to nothing.');}}
  endJob(c);break;}
 case'gather':{const ft=G.feats.find(q=>q.id===j.f);if(!ft||ft.left<=0){endJob(c);break;}const F=FEAT[ft.k];
  if(!j.w){j.w=1;c.cd=F.dur;break;}
  const tool=c.hands[0]&&c.hands[0].it===F.tool?1:0,seam=F.tool==='pick'?seamDie():0;
  const r=roll(c,F.tr,F.sk||SKILL[M[F.m].f],F.d,tool+seam,'works '+F.n);
  if(F.card){const ks=['seam','dry','wander','seam','dry'];addTok(ft.x,ft.y,{card:ks[ri(ks.length)]},0,c.z);}
  else if(F.cage){if(G.cols.length<6){const d=mkCol(ft.x,ft.y);d.down=true;d.home=false;d.captive=true;d.need.hun=4;log('The cage opens. '+d.name+' cannot walk and must be carried.');}
   if(G.exp)G.exp.state='return';}
  else{addTok(ft.x,ft.y,{m:F.m},0,ft.z!=null?ft.z:G.hgt[I(ft.x,ft.y)]);if(r.ok)pop(ft.x,ft.y,ft.z!=null?ft.z:G.hgt[I(ft.x,ft.y)],'+'+M[F.m].n,M[F.m].c);}
  if(ft.k==='nest'&&ft.left<=1)G.stats.nests++;
  ft.left--;if(ft.left<=0){if(F.grow)ft.grow=DAY*2;else G.feats=G.feats.filter(q=>q!==ft);}
  if(!r.ok){c.cd=8;j.w=0;if(ft.left>0)break;}else if(ft.left>0&&(c.party||ft.k==='tree'||ft.k==='scrap')){j.w=0;break;}
  endJob(c);if(!r.ok)c.cd=8;break;}
 case'make':{const s=G.sites.find(q=>q.id===j.sid);if(!s){endJob(c);break;}
  if(!j.w){j.w=1;c.cd=8;break;}
  const sk=s.kind==='bill'?SKILL[M[s.m].f]:s.kind==='bench'?'Wood':s.kind==='trap'?'Metal':'Stone',tr=s.kind==='bill'||s.kind==='bench'||s.kind==='trap'?1:0;
  const d=s.kind==='bill'&&M[s.m].f==='metal'?2:1;
  const r=roll(c,tr,sk,d,0,s.kind==='bill'?'makes '+ITEM[s.it].n:'builds');
  G.sites=G.sites.filter(q=>q!==s);
  if(s.kind==='trap'){G.feats.push({id:G.nid++,k:'trap',x:s.x,y:s.y,m:s.m,left:1,grow:0});log('A trap is set.');pop(s.x,s.y,G.hgt[I(s.x,s.y)],'trap set');}
  else if(s.kind==='hearth'||s.kind==='bench'){G.feats.push({id:G.nid++,k:s.kind,x:s.x,y:s.y,m:s.m,fuel:0,left:1,grow:0});log('A '+FEAT[s.kind].n+' stands.');}
  else if(s.kind==='voxel'){const h=topZ(s.x,s.y);if(h<Z-2){G.vox[VI(s.x,s.y,h)]=s.m;G.hgt[I(s.x,s.y)]=h+1;touch(s.x,s.y);moveTop(s.x,s.y,h,h+1);}}
  else{const it={it:s.it,m:s.m};if(!r.ok){it.flawed=1;log('The '+ITEM[s.it].n+' comes out flawed.');}addTok(s.x,s.y,it);pop(s.x,s.y,G.hgt[I(s.x,s.y)],'+'+M[s.m].n+' '+ITEM[s.it].n.toLowerCase(),'#f0c040');emit('make');}
  endJob(c);if(!r.ok)c.cd=6;break;}
 case'fetch':{
  if(j.s===0){let n=0;const max=j.to==='stock'||j.to==='keep'?cap(c)-c.carry.length:1;
   if(j.to==='wear'||j.to==='arm'){const t=takeTok(c.x,c.y,j.spec,c.z);if(t){const I_=ITEM[t.it];
     if(I_.slot!=null)c.worn[I_.slot]=t;else if(I_.wpn)c.hands[1]=t;else c.hands[0]=t;log(c.name+' takes up a '+M[t.m].n+' '+I_.n+'.');}
    endJob(c);break;}
   while(n<max){const t=takeTok(c.x,c.y,j.spec,c.z);if(!t)break;c.carry.push(t);n++;}
   if(!n||j.to==='keep'){endJob(c);break;}
   j.s=1;let ok;
   if(j.to==='stock'){const s=stockSpot(c);ok=s&&goTo(c,s.x,s.y,false);}
   else if(j.to==='site'){const s=G.sites.find(q=>q.id===j.sid);ok=s&&goTo(c,s.x,s.y,true);}
   else if(j.to==='sow')ok=goTo(c,j.fx,j.fy,false);
   else{const h=hearth();ok=h&&goTo(c,h.x,h.y,true);}
   if(!ok)endJob(c);break;}
  if(j.to==='stock'){for(const t of c.carry)addTok(c.x,c.y,t,1,c.z);c.carry=[];}
  else if(j.to==='site'){const s=G.sites.find(q=>q.id===j.sid),t=c.carry.pop();if(s&&t){s.have++;if(s.kind!=='bill')s.m=t.m;}else if(t)addTok(c.x,c.y,t,0,c.z);}
  else if(j.to==='sow'){const t=c.carry.pop();if(G.fields&&G.fields[K(c.x,c.y)]&&!featAt(c.x,c.y)){G.feats.push({id:G.nid++,k:'crop',x:c.x,y:c.y,left:0,grow:DAY*1.5|0});log(c.name+' sows a field.');pop(c.x,c.y,c.z,'sown','#8fbf6a');}else if(t)addTok(c.x,c.y,t,0,c.z);}
  else if(j.to==='fuel'){c.carry.pop();hearth().fuel+=G.card&&G.card.k==='dry'?180:120;}
  else if(j.to==='cook'){if(!j.w){j.w=1;c.cd=6;break;}const t=c.carry.pop();
   const r=roll(c,1,SKILL[M[t.m].f],1,c.hands[0]&&c.hands[0].it==='knife'?1:0,'cooks '+M[t.m].n);addTok(c.x,c.y,{m:20},1,c.z);if(!r.ok)c.cd=8;}
  endJob(c);break;}
 }
}
function seamDie(){if(G.card&&G.card.k==='seam'&&!G.seam){G.seam=true;return 1;}return 0;}
// ---- fighting
function attack(a,d){
 const wi=a.hands&&a.hands[1],ws=a.hands?(wi?ITEM[wi.it].wpn:null):'Bite';
 const ar=roll(a,a.hands?0:1,ws,0,wi?1:0,'strikes at '+(d.name||d.k));emit('swing');
 const sh=d.hands&&d.hands[0]&&ITEM[d.hands[0].it].shield;
 const dr=roll(d,1,sh?'Shield':null,0,sh?1:0,'defends');
 const mg=ar.s-dr.s;
 if(mg<=0){if(a.name&&ws)mark(a,ws);return;}
 if(d.name&&sh)mark(d,'Shield');
 for(let n=mg>=2?2:1;n>0;n--){const ai=ri(6),w=d.worn&&d.worn[ai];
  if(w){let s=0;for(let i=M[w.m].h-(w.flawed?1:0);i>0;i--)if(1+ri(6)>=5)s++;if(s){log((d.name||d.k)+"'s "+ITEM[w.it].n+' turns the blow.');continue;}}
  d.wd[ai]++;log((d.name||d.k)+' is wounded: '+AREA[ai]+'.');pop(d.x,d.y,d.z,'✚','#e04040');emit('hit');}
 if(d.name){if(wounds(d)>=3&&!d.down)goDown(d);}
 else if(d.raider){if(wounds(d)>=3){G.crit=G.crit.filter(e=>e!==d);for(const t of d.carry.concat(d.hands,d.worn))if(t)addTok(d.x,d.y,t,0,d.z);log('A raider falls.');G.stats.kills++;emit('kill');}}
 else if(wounds(d)>=2){G.crit=G.crit.filter(e=>e!==d);addTok(d.x,d.y,{m:16},0,d.z);if(ri(2))addTok(d.x,d.y,{m:11},0,d.z);log('The '+d.k+' dies.');}
}
function goDown(c){
 endJob(c);for(const t of c.carry)addTok(c.x,c.y,t,0,c.z);c.carry=[];
 for(const o of G.cols){if(o.by===c.id)o.by=null;if(o!==c)o.need.str=Math.min(6,o.need.str+1);}
 c.down=true;c.downT=0;c.party=false;c.armed=false;c.home=isHome(c);log(c.name+' is DOWN.');emit('banner',{t:c.name+' is down!',k:'bad'});emit('down');
}
function die(c){
 log(c.name+' dies, abandoned.');addTok(c.x,c.y,{corpse:c.name},0,c.z);
 for(const t of c.worn.concat(c.hands))if(t)addTok(c.x,c.y,t,0,c.z);
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
  if(c.by!=null){const b=col(c.by);if(b){c.x=b.x;c.y=b.y;c.z=b.z;}else c.by=null;return;}
  if(++c.downT>=DAY){if(!c.home)return die(c);
   c.down=false;c.downT=0;c.wd=[0,0,0,0,0,0];c.wd[1]=1;const s=ri(6);if(!c.scars.includes(s))c.scars.push(s);
   log(c.name+' rises, scarred: '+TR[s]+' rolls now need a 6.');}
  return;}
 if(c.cd>0){c.cd--;return;}
 if(c.wander>0){c.wander--;if(!c.job){const x=4+ri(40),y=4+ri(40);if(!setJob(c,{t:'wait',n:4},x,y,false,'any'))c.job={t:'wait',n:4};}}
 // a raider close by: drop what you are doing
 if(c.job&&!c.party&&c.job.t!=='fight'&&c.job.t!=='rescue'&&!(c.job.t==='fetch'&&c.job.to==='arm')&&G.crit.some(e=>e.raider&&md(e,c)<=8))endJob(c);
 if(c.job&&c.x>=PW&&c.job.t!=='fight'&&c.job.t!=='rescue'&&(enemyNear(c,3)||(c.party&&G.cols.some(d=>d.party&&d.job&&d.job.t==='fight'))))endJob(c);
 if(!c.job)pickJob(c);
 if(!c.job)return;
 if(c.path.length){
  if((c.wd[2]||c.wd[3])&&t%2)return;
  if(c.party&&c.x>=PW-1&&c.job.t!=='fight'&&c.job.t!=='rescue'&&partyHold(c))return;
  const i=c.path.shift(),x=i%W,r=(i/W)|0,y=r%H,z=(r/H)|0;
  if(Math.abs(x-c.x)+Math.abs(y-c.y)!==1||!canMove(c.x,c.y,c.z,x,y,z)){endJob(c);return;}
  c._px=c.x;c._py=c.y;c._pz=c.z;c._mv=G.t;c.face=dirOf(x-c.x,y-c.y);c.x=x;c.y=y;c.z=z;return;}
 const j=c.job;if(j.t==='fight'){const e=G.crit.find(e=>e.id===j.id);if(e)c.face=dirOf(e.x-c.x,e.y-c.y);}
 else if(j.tx!=null&&(j.tx!==c.x||j.ty!==c.y)&&!(j.t==='rescue'&&j.s)&&!(j.t==='fetch'&&j.s===0))c.face=dirOf(j.tx-c.x,j.ty-c.y);
 arrive(c);
}
function tickCrit(e){
 if(e.cd>0){e.cd--;return;}
 let b=null,bd=7;for(const c of G.cols){if(c.down||c.x<PW)continue;const d=md(c,e);if(d<bd){bd=d;b=c;}}
 if(b&&bd<=1){e.face=dirOf(b.x-e.x,b.y-e.y);attack(e,b);e.cd=2;return;}
 if(!b&&ri(4))return;
 const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>({x:e.x+d[0],y:e.y+d[1]})).filter(p=>p.x>=PW&&(p.z=stepZ(e.x,e.y,e.z,p.x,p.y))>=0&&!G.crit.some(o=>o.x===p.x&&o.y===p.y));
 if(!opts.length)return;
 const p=b?opts.sort((p,q)=>md(p,b)-md(q,b))[0]:opts[ri(opts.length)];
 if(!b||md(p,b)<bd){e._px=e.x;e._py=e.y;e._pz=e.z;e._mv=G.t;e.face=dirOf(p.x-e.x,p.y-e.y);e.x=p.x;e.y=p.y;e.z=p.z;}
}
function dawn(){
 G.seam=false;emit('dawn');spoil();threatAtDawn();if(G.gateBroken&&!G.raid){G.gateBroken=false;log('The gate is mended and barred again.');}
 const res=[['hun',0,'hunger'],['temp',1,'cold'],['rest',4,'weariness'],['str',5,'dread']];
 for(const c of G.cols){c.pen=0;if(c.down)continue;
  const P=c.pers||[];if(P.includes('pious')&&nearFire(c))c.need.str=Math.max(0,c.need.str-1);
  if(near(c,3).some(o=>(o.pers||[]).includes('cheerful')&&bond(c,o)>=1))c.need.str=Math.max(0,c.need.str-1);
  for(const r of res)if(c.need[r[0]]>=6&&!roll(c,r[1],null,1,0,'resists '+r[2]).ok){if(r[0]==='str'){breakdown(c);continue;}c.pen=1;c.need.str=Math.min(6,c.need.str+(P.includes('grim')?.5:1));}
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
function findAnyFood(){for(const k in G.tok){const p=tparse(k);if(p[0]>=PW)continue;const t=takeTok(p[0],p[1],{food:1},p[2]);if(t)return t;}return null;}
function tick(){
 if(G.over)return;
 G.fx=G.fx.filter(f=>--f.ttl>0);if(G.pops)G.pops=G.pops.filter(p=>--p.ttl>0);
 G.t++;G._cnt=null;
 if(G.t%DAY===0)dawn();
 const h=hearth();if(h&&h.fuel>0)h.fuel--;
 if(season()!==3)for(const f of G.feats)if(f.grow>0&&--f.grow===0)f.left=FEAT[f.k].uses;
 if(G.t%150===0&&G.crit.length<8){const n=G.feats.find(f=>f.k==='nest');if(n)mkRat(n.x,n.y);}
 for(const c of G.cols.slice())tickCol(c);
 for(const e of G.crit.slice())if(e.raider)tickRaider(e);else tickCrit(e);
 tickRaidGate();if(G.t%10===0)checkGoals();
 for(const c of G.cols)if(c.x>=PW-1)for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=c.x+dx,y=c.y+dy;if(x>=PW&&x<W&&y>=0&&y<H&&dx*dx+dy*dy<=27)G.rev[I(x,y)]=1;}
 if(G.exp&&!G.cols.some(c=>c.party))G.exp=null;
 if(G.zone.on&&!G.exp&&!G.cols.some(c=>c.x>=PW))forgetZone();
 if(G.t%60===0)save();
}

// ---- Events for sound and screen effects. The simulation only announces them; ui.js listens. pop() floats a short
// label above a spot for a few ticks.
let emit=()=>{};
function pop(x,y,z,t,c){(G.pops=G.pops||[]).push({x,y,z,t,c:c||'#f0e6c8',ttl:4});if(G.pops.length>24)G.pops.shift();}

// ---- Threat and raids. A visible track of 12 threat tokens fills from time, noise, wealth and breaches. At the top,
// raiders come to the gate: a shut gate holds them for a while, then they break in, fight, and flee or die. [slop] numbers
const THREAT_MAX=12;
function addThreat(n,why){if(G.raid)return;const before=Math.floor(G.threat||0);G.threat=Math.min(THREAT_MAX,(G.threat||0)+n);
 if(Math.floor(G.threat)>before){log('Threat rises ('+why+'): '+Math.floor(G.threat)+'/'+THREAT_MAX+'.');emit('threat');}
 if(G.threat>=THREAT_MAX&&day()>=7)startRaid();} // the first week is quiet
function threatAtDawn(){G.noise=0;if(G.threat>=THREAT_MAX&&day()>=7)return startRaid();if(day()<2)return;let tok=0;for(const k in G.tok)if(tparse(k)[0]<PW)tok+=G.tok[k].length;
 addThreat(1,'time');if(tok>=12)addThreat(Math.floor(tok/12)*.5,'wealth');if(G.zone.on)addThreat(1,'the open breach');}
function startRaid(){G.raids=(G.raids||0)+1;const n=Math.min(5,1+Math.floor((G.raids-1)/2));G.threat=0;
 G.raid={n,hp:G.gateOpen?0:G.gateMax||6,spawned:false,t:G.t};
 log('RAID: '+n+' raiders come to the gate.');emit('banner',{t:'Raiders at the gate!',k:'bad'});emit('raid');}
const gateOpenTo=()=>G.gateOpen||G.gateBroken;
function mkRaider(x,y){const L={skin:SKIN[ri(SKIN.length)],hair:HAIR[ri(HAIR.length)],eye:EYE[ri(EYE.length)],style:ri(6),beard:ri(3)};
 const m=[[6,11],[7,11],[6,12],[2,11]][ri(4)],arm=G.raids>=3,e={id:G.nid++,k:'Raider',raider:true,x,y,z:G.hgt[I(x,y)],tr:[2,1,2,1,1,1],sk:{Haft:G.raids>=5?2:1},wd:[0,0,0,0,0,0],cd:2,
 worn:[arm?{it:'cap',m:m[0]}:null,arm?{it:'jerkin',m:m[1]}:null,null,null,null,{it:'cloak',m:16}],hands:[null,{it:'club',m:4}],carry:[],scars:[],look:L,face:2,path:[]};
 G.crit.push(e);return e;}
function tickRaidGate(){const R=G.raid;if(!R)return;
 if(!R.spawned){if(R.hp>0){if(G.t%5===0){R.hp--;emit('thud');log('The gate shudders under their blows: '+R.hp+' left.');if(R.hp<=0){G.gateBroken=true;log('The gate gives way!');emit('banner',{t:'The gate is broken!',k:'bad'});}}return;}
  const spots=[[46,24],[46,23],[46,25],[45,24],[45,23],[45,25]];for(let i=0;i<R.n;i++){const s=spots[i%spots.length];mkRaider(s[0],s[1]);}R.spawned=true;return;}
 if(!G.crit.some(e=>e.raider)){G.raid=null;G.stats.raids++;log('The raid is over.');emit('banner',{t:'The raid is over',k:'good'});emit('raidEnd');}}
function tickRaider(e){
 if(e.cd>0){e.cd--;return;}
 const flee=wounds(e)>=2||!G.cols.some(c=>!c.down&&c.x<PW);
 if(flee){if(e.x>=46&&Math.abs(e.y-24)<=1){G.crit=G.crit.filter(o=>o!==e);
   if(e.carry.length)log('A raider escapes with '+e.carry.length+' token'+(e.carry.length>1?'s':'')+'.');else log('A raider flees.');return;}
  if(!e.loot&&!e.carry.length){const t=findTok(e,{any:1});if(t&&md(t,e)<=1){const k=takeTok(t.x,t.y,{any:1},t.z);if(k)e.carry.push(k);e.loot=1;}
   else if(t&&!wounds(e)&&(!e.path.length||G.t%4===0))goTo(e,t.x,t.y,false,t.z);}
  if(e.loot||e.carry.length||wounds(e)>=2){if(!e.path.length||G.t%4===0)goTo(e,47,24,false,G.gateZ);}}
 else{let b=null,bd=1e9;for(const c of G.cols){if(c.down||c.x>=PW)continue;const d=md(c,e);if(d<bd){bd=d;b=c;}}
  if(b&&bd<=1){e.face=dirOf(b.x-e.x,b.y-e.y);attack(e,b);e.cd=2;return;}
  if(b&&(!e.path.length||G.t%3===0))goTo(e,b.x,b.y,true,b.z);}
 if(e.path.length){const i=e.path.shift(),x=i%W,r=(i/W)|0,y=r%H,z=(r/H)|0;
  if(Math.abs(x-e.x)+Math.abs(y-e.y)===1&&canMove(e.x,e.y,e.z,x,y,z)&&!G.crit.some(o=>o!==e&&o.x===x&&o.y===y)){
   e._px=e.x;e._py=e.y;e._pz=e.z;e._mv=G.t;e.face=dirOf(x-e.x,y-e.y);e.x=x;e.y=y;e.z=z;
   const tp=G.feats.find(f=>f.k==='trap'&&f.x===x&&f.y===y&&f.left>0);
   if(tp){tp.left=0;const r_=roll(e,1,null,2,0,'');log('A raider steps on a trap!');emit('hit');
    if(!r_.ok){e.wd[2]+=2;pop(x,y,z,'✚✚','#e04040');log('The trap bites deep.');if(wounds(e)>=3){G.crit=G.crit.filter(o=>o!==e);for(const t of e.carry.concat(e.hands,e.worn))if(t)addTok(x,y,t,0,z);log('The raider dies in the trap.');G.stats.kills++;emit('kill');G.feats=G.feats.filter(f=>f!==tp);return;}}
    G.feats=G.feats.filter(f=>f!==tp);}}
  else e.path=[];}
}
// colonists defend the plot: arm up if there is a weapon to hand, then go for the nearest raider
function jDefend(c){const rs=G.crit.filter(e=>e.raider&&e.x<PW+1);if(!rs.length||c.party)return false;
 let b=null,bd=1e9;for(const e of rs){const d=md(e,c);if(d<bd){bd=d;b=e;}}
 if(!c.hands[1]&&bd>2&&fetchJob2(c,{wpn:1}))return true;
 if(!c.hands[1]&&bd>2){const s=stockSpot(c)||{x:24,y:24};if(md(s,c)>1)return setJob(c,{t:'wait',n:3},s.x,s.y,false);c.job={t:'wait',n:3};return true;} // unarmed: shelter at the stockpile
 return setJob(c,{t:'fight',id:b.id},b.x,b.y,true,b.z);}

// ---- Goals: a fixed ladder of milestones. Three are shown at a time; each pays a reward and renown. [slop] list
const GOALS=[
 {n:'Light a hearth',t:'Build a hearth.',ok:()=>!!hearth(),r:'Dry wood card',rw:()=>addCard('dry')},
 {n:'Set up a workbench',t:'Build a workbench.',ok:()=>!!bench(),r:'+3 deadwood',rw:()=>{for(let i=0;i<3;i++)addTok(24,24,{m:4},1);}},
 {n:'Make a tool',t:'Make any pick, axe or knife.',ok:()=>['pick','axe','knife'].some(k=>owned(k)>1||(k!=='pick'&&owned(k)>0)),r:'Good seam card',rw:()=>addCard('seam')},
 {n:'Stock the larder',t:'Have 10 food tokens in the plot.',ok:()=>counts().food>=10,r:'2 meals',rw:()=>{for(let i=0;i<2;i++)addTok(24,24,{m:20},1);}},
 {n:'Bring home ore',t:'A party brings metal home.',ok:()=>G.stats.ore>0,r:'Chart card',rw:()=>addCard('chart')},
 {n:'Arm everyone',t:'Every colonist holds a weapon.',ok:()=>G.cols.length>0&&G.cols.every(c=>c.hands[1]),r:'+2 iron',rw:()=>{for(let i=0;i<2;i++)addTok(24,24,{m:7},1);}},
 {n:'Set a trap',t:'Build a trap.',ok:()=>G.feats.some(f=>f.k==='trap'),r:'Gate +3 strength',rw:()=>{G.gateMax=(G.gateMax||6)+3;}},
 {n:'Hold the gate',t:'Survive a raid.',ok:()=>G.stats.raids>0,r:'Wanderer card',rw:()=>addCard('wander')},
 {n:'Map a zone',t:'Bring a full map home.',ok:()=>G.discard.concat(G.deck,G.card?[G.card]:[]).some(d=>d.k==='chart')&&G.stats.maps>0,r:'Good seam card',rw:()=>addCard('seam')},
 {n:'Forge iron',t:'Make anything of iron.',ok:()=>Object.keys(ITEM).some(k=>ownedOf(k,7)>0),r:'Gate +3 strength',rw:()=>{G.gateMax=(G.gateMax||6)+3;}},
 {n:'Break a nest',t:'A party kills a nest.',ok:()=>G.stats.nests>0,r:'Dry wood card',rw:()=>addCard('dry')},
 {n:'Through the winter',t:'Reach year 2.',ok:()=>day()>=24,r:'Wanderer card',rw:()=>addCard('wander')},
 {n:'A full company',t:'Have six colonists.',ok:()=>G.cols.length>=6,r:'Renown x2',rw:()=>{G.renown*=2;}}];
function addCard(k){G.discard.push({k,pips:CARD[k].pips||0});}
function owned(k){let n=0;for(const q in G.tok)for(const t of G.tok[q])if(t.it===k)n++;for(const c of G.cols)for(const t of c.worn.concat(c.hands))if(t&&t.it===k)n++;return n;}
function ownedOf(k,m){let n=0;for(const q in G.tok)for(const t of G.tok[q])if(t.it===k&&t.m===m)n++;for(const c of G.cols)for(const t of c.worn.concat(c.hands))if(t&&t.it===k&&t.m===m)n++;return n;}
function checkGoals(){G.gdone=G.gdone||[];for(let i=0;i<GOALS.length;i++){if(G.gdone.includes(i))continue;if(!openGoals().includes(i))continue;
  if(GOALS[i].ok()){G.gdone.push(i);G.renown=(G.renown||0)+10*(1+Math.floor(i/3));GOALS[i].rw();log('Goal: '+GOALS[i].n+'. Reward: '+GOALS[i].r+'.');emit('banner',{t:'Goal: '+GOALS[i].n,s:GOALS[i].r,k:'goal'});emit('goal');}}}
// the three goals shown: the first three not yet done
const openGoals=()=>{const r=[];for(let i=0;i<GOALS.length&&r.length<3;i++)if(!(G.gdone||[]).includes(i))r.push(i);return r;};

// ---- Personality, bonds and breakdowns. Each colonist has two keywords. Working side by side builds a bond (shared
// success) or a grudge (shared failure); matching keywords warm a pair, clashing ones sour it. A close friend nearby adds
// a die, a grudge nearby takes one away. [slop] all amounts
const PERS={brave:'+1 die when fighting.',gentle:'+1 die cooking, -1 die fighting.',curious:'+1 die with relics; likes exploring.',
 cheerful:'Eases the stress of friends nearby at dawn.',grim:'Stress builds more slowly.',greedy:'Grudges come easily.',pious:'Calmed by the hearth at dawn.',lazy:'Rests longer between jobs.'};
const CLASH=[['greedy','gentle'],['cheerful','grim'],['brave','lazy'],['pious','greedy']];
const pairK=(a,b)=>a.id<b.id?a.id+'-'+b.id:b.id+'-'+a.id;
const bond=(a,b)=>(G.bonds&&G.bonds[pairK(a,b)])||0;
function near(c,r){return G.cols.filter(o=>o!==c&&!o.down&&md(o,c)<=r);}
function persDie(w,skill,label){const p=w.pers||[];let d=0;
 if(/^strikes/.test(label)){if(p.includes('brave'))d++;if(p.includes('gentle'))d--;}
 if(/^cooks/.test(label)&&p.includes('gentle'))d++;if(skill==='Relic'&&p.includes('curious'))d++;
 let f=0,g=0;for(const o of near(w,2)){const b=bond(w,o);if(b>=2)f=1;if(b<=-2)g=1;}return d+f-g;}
function bondAfter(w,ok){G.bonds=G.bonds||{};for(const o of near(w,2)){const k=pairK(w,o),p=(w.pers||[]).concat(o.pers||[]);
 let d=ok?.12:-.12;if((w.pers||[]).some(x=>(o.pers||[]).includes(x)))d+=.04;if(CLASH.some(c=>p.includes(c[0])&&p.includes(c[1])))d-=.06;
 if(p.includes('greedy')&&d<0)d*=1.5;const before=Math.trunc(G.bonds[k]||0);G.bonds[k]=Math.max(-3,Math.min(3,(G.bonds[k]||0)+d));const after=Math.trunc(G.bonds[k]);
 if(after!==before){if(after>before&&after>0){log(w.name+' and '+o.name+' grow closer.');pop(w.x,w.y,w.z,'♥','#e08aa0');}
  else if(after<before&&after<0){log(w.name+' and '+o.name+' grate on each other.');pop(w.x,w.y,w.z,'✗','#a0a0a0');}}}}
// a breakdown: what someone does when their stress tops out and they fail to hold it together
function breakdown(c){const kinds=['smash','wander','binge'];const foe=G.cols.find(o=>o!==c&&!o.down&&bond(c,o)<=-1);if(foe)kinds.push('brawl');
 const k=kinds[ri(kinds.length)];endJob(c);
 if(k==='smash'){const all=c.worn.map((t,i)=>t?['w',i]:null).concat(c.hands.map((t,i)=>t?['h',i]:null)).filter(Boolean);
  if(all.length){const q=all[ri(all.length)],t=q[0]==='w'?c.worn[q[1]]:c.hands[q[1]];if(q[0]==='w')c.worn[q[1]]=null;else c.hands[q[1]]=null;
   log(c.name+' breaks down and smashes their '+M[t.m].n+' '+ITEM[t.it].n.toLowerCase()+'.');emit('banner',{t:c.name+' breaks down',s:'smashes their '+ITEM[t.it].n.toLowerCase(),k:'bad'});}
  else{log(c.name+' breaks down, howling at the walls.');emit('banner',{t:c.name+' breaks down',s:'howls at the walls',k:'bad'});}}
 else if(k==='wander'){c.wander=DAY/2;log(c.name+' breaks down and wanders off, useless for half a day.');emit('banner',{t:c.name+' breaks down',s:'wanders off',k:'bad'});}
 else if(k==='binge'){let n=0;for(let i=0;i<3;i++){const t=findAnyFood();if(t)n++;}c.need.hun=0;log(c.name+' breaks down and gorges on '+n+' food.');emit('banner',{t:c.name+' breaks down',s:'gorges on '+n+' food',k:'bad'});}
 else{log(c.name+' breaks down and goes for '+foe.name+'.');emit('banner',{t:c.name+' breaks down',s:'attacks '+foe.name,k:'bad'});attack(c,foe);G.bonds[pairK(c,foe)]=-3;}
 c.need.str=3;emit('down');}

// ---- Farming and spoilage. A field tile grows a crop of tubers once someone sows a tuber on it; it ripens in a day and
// a half, can be picked three times, then grows again (not in winter). Food rots: meat in 3 days, meals in 4, moss in 5,
// tubers in 8. Nothing rots in winter, and food lying under rock (a cellar) rots at half speed. [slop] numbers
const ROT={16:3,20:4,14:5,15:8};
function spoil(){if(season()===3)return;for(const k in G.tok){const p=tparse(k),cellar=p[2]<G.hgt[I(p[0],p[1])],a=G.tok[k];
 for(let i=a.length-1;i>=0;i--){const t=a[i];if(t.it||t.card||t.corpse||!ROT[t.m])continue;t.age=(t.age||0)+(cellar?.5:1);
  if(t.age>=ROT[t.m]){a.splice(i,1);log('A '+M[t.m].n+' rots away'+(cellar?' even in the cellar':'')+'.');pop(p[0],p[1],p[2],'rots','#8a9a5a');}}
 if(!a.length)delete G.tok[k];}}
function jFarm(c){for(const k in G.fields||{}){const p=k.split(','),x=+p[0],y=+p[1];if(featAt(x,y)||rsv('fl'+k))continue;
  if(fetchJob(c,{m:15},'sow',{fx:x,fy:y,res:['fl'+k]}))return true;}return false;}
