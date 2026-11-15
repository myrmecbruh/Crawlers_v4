'use strict';
let G=null;
const I=(x,y)=>y*W+x, VI=(x,y,z)=>(z*H+y)*W+x, K=(x,y)=>x+','+y;
function R(){G.rs=(G.rs+0x6D2B79F5)|0;let t=Math.imul(G.rs^G.rs>>>15,1|G.rs);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const ri=n=>Math.floor(R()*n);
function hash2(x,y,s){let h=Math.imul((x*374761393+y*668265263+s*40503)|0,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return((h^h>>>16)>>>0)/4294967296;}
function noise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function setCol(x,y,h,base,top){for(let z=0;z<Z;z++)G.vox[VI(x,y,z)]=z<h?(z===h-1?top:base):0;G.hgt[I(x,y)]=h;}
const topZ=(x,y)=>G.hgt[I(x,y)];
const topMat=(x,y)=>{const h=topZ(x,y);return h?G.vox[VI(x,y,h-1)]:0;};
const day=()=>Math.floor(G.t/DAY), tod=()=>G.t%DAY, night=()=>tod()>=180, season=()=>Math.floor(day()/6)%4;
function featAt(x,y){return G.feats.find(f=>f.x===x&&f.y===y);}
// Region shapes. G.mask: 0 void, 1 wall, 2 ground. A region is a wobbly blob plus three lobes minus one cove,
// with a straight neck to the gate so the plot and the zone always meet at x=47/48. [slop]
function shapeRegion(x0,x1,cx,cy,R,s){
 const L=[];for(let i=0;i<3;i++){const a=hash2(i,7,s)*6.283,d=R*(.45+.2*hash2(i,8,s));L.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*.9,R*(.28+.14*hash2(i,9,s))]);}
 const ca=hash2(4,7,s)*6.283,cove=[cx+Math.cos(ca)*R*.8,cy+Math.sin(ca)*R*.8,R*(.22+.1*hash2(4,9,s))];
 const inS=(x,y)=>{
  if(y<0||y>=H)return false;
  if(x<x0)return x0===PW&&x===PW-1&&Math.abs(y-24)<=2?true:false;   // the zone sees the plot's gate wall as solid neighbour
  if(x>x1)return false;
  if(Math.abs(y-24)<=2&&(x0===0?x>=cx:x<=cx))return true;            // the neck
  if(x<=x0||x>=x1||y<=0||y>=H-1)return false;
  const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy),th=Math.atan2(dy,dx);
  if(d<R*.3)return true;
  if(Math.hypot(x-cove[0],y-cove[1])<cove[2])return false;
  if(d<R*(.55+.45*noise(Math.cos(th)*1.3+3,Math.sin(th)*1.3+3,s))+3*(noise(x/4,y/4,s+5)-.5))return true;
  for(const l of L)if(Math.hypot(x-l[0],y-l[1])<l[2])return true;
  return false;};
 for(let y=0;y<H;y++)for(let x=x0;x<=x1;x++){const i=I(x,y);if(G.keep[i])continue;
  if(!inS(x,y)){G.mask[i]=0;continue;}
  let wall=false;for(let dy=-1;dy<=1&&!wall;dy++)for(let dx=-1;dx<=1;dx++)if(!inS(x+dx,y+dy)&&!(x+dx>=x0&&x+dx<=x1&&G.keep[I(x+dx,Math.max(0,Math.min(H-1,y+dy)))])){wall=true;break;}
  G.mask[i]=wall?1:2;}
}
// make the neck walkable: along it, no step between neighbouring ground tiles is more than one voxel
function easeNeck(xa,xb){const d=xa<xb?1:-1;for(let x=xa+d;x!==xb+d;x+=d)for(let y=23;y<=25;y++){const i=I(x,y);if(G.mask[i]!==2||G.keep[i])continue;
  const p=G.hgt[I(x-d,24)],h=Math.max(p-1,Math.min(p+1,G.hgt[i]));if(h!==G.hgt[i])setCol(x,y,h,1,topMat(x,y)||1);}
 for(let x=Math.min(xa,xb);x<=Math.max(xa,xb);x++){const m=G.hgt[I(x,24)];for(const y of[23,25]){const i=I(x,y);if(G.mask[i]===2&&!G.keep[i]&&Math.abs(G.hgt[i]-m)>1)setCol(x,y,m,1,topMat(x,y)||1);}}}
function scatter(k,n,x0,x1,y0,y1,avoid){
 for(let i=0,g=0;i<n&&g<2000;g++){const x=x0+ri(x1-x0+1),y=y0+ri(y1-y0+1);
  if(G.mask[I(x,y)]!==2||featAt(x,y)||G.stock[K(x,y)])continue;
  if(avoid&&Math.abs(x-avoid[0])+Math.abs(y-avoid[1])<5)continue;
  G.feats.push({id:G.nid++,k,x,y,left:FEAT[k].uses,grow:0});i++;}
}
function mkCol(x,y){
 const tr=[];for(let i=0;i<6;i++){const r=R();tr.push(r<.3?1:r<.8?2:3);}
 const used=G.cols.map(c=>c.name),pool=NAMES.filter(n=>!used.includes(n));
 const c={id:G.nid++,name:pool[ri(pool.length)]||'Nameless',tr,sk:{},mk:{},need:{hun:0,rest:0,temp:0,str:0},
  wd:[0,0,0,0,0,0],worn:[null,null,null,null,null,null],hands:[null,null],carry:[],x,y,job:null,path:[],
  look:{skin:SKIN[ri(SKIN.length)],hair:HAIR[ri(HAIR.length)],eye:EYE[ri(EYE.length)]},
  down:false,downT:0,home:false,by:null,scars:[],party:false,armed:false,cd:0,pen:0,asleep:false};
 G.cols.push(c);return c;
}
function addTok(x,y,t,pref){
 const ok=(tx,ty)=>tx>=0&&ty>=0&&tx<W&&ty<H&&G.mask[I(tx,ty)]===2&&(G.tok[K(tx,ty)]||[]).length<6&&Math.abs(topZ(tx,ty)-topZ(x,y))<=2;
 for(let pass=pref?0:1;pass<2;pass++)for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tx=x+dx,ty=y+dy;
  if(!ok(tx,ty)||(pass===0&&!G.stock[K(tx,ty)]))continue;
  (G.tok[K(tx,ty)]=G.tok[K(tx,ty)]||[]).push(t);return;}
}
function newGame(seed){
 G={v:1,seed,rs:seed,t:60,speed:1,vox:new Uint8Array(W*H*Z),hgt:new Uint8Array(W*H),rev:new Uint8Array(W*H),keep:new Uint8Array(W*H),mask:new Uint8Array(W*H),
  feats:[],tok:{},stock:{},digs:{},sites:[],cols:[],crit:[],exp:null,zone:{n:0,on:false},gateOpen:false,gate:{x:47,y:24},
  deck:[],discard:[],card:null,log:[],fx:[],nid:1,sel:null,res:{},seam:false,over:false};
 shapeRegion(0,PW-1,24,24,21,seed+31);
 for(let y=0;y<H;y++)for(let x=0;x<PW;x++){
  const h=2+Math.floor(noise(x/9,y/9,seed)*3.2),mk=G.mask[I(x,y)];
  if(mk===0){setCol(x,y,0,0,0);continue;}
  if(mk===1){setCol(x,y,h+3,3,3);continue;}
  const n=noise(x/4,y/4,seed+7);setCol(x,y,h,1,n>.66?2:n>.56?1:19);
 }
 easeNeck(24,46);G.mask[I(47,24)]=2;setCol(47,24,topZ(46,24),1,19);
 for(let y=23;y<=25;y++)for(let x=23;x<=25;x++)G.stock[K(x,y)]=1;
 const a=[24,24];
 scatter('tree',34,2,45,2,45,a);scatter('moss',14,2,45,2,45,a);scatter('tuber',9,2,45,2,45,a);
 scatter('reed',8,2,45,2,45,a);scatter('scrap',5,2,45,2,45,a);
 mkCol(22,24);mkCol(24,22);mkCol(26,24);
 for(let i=0;i<3;i++)addTok(24,24,{m:6},1);
 for(let i=0;i<4;i++)addTok(24,24,{m:4},1);
 for(let i=0;i<5;i++)addTok(24,24,{m:15},1);
 addTok(24,24,{it:'pick',m:6},1);
 G.deck=['still','still','still','cold','vermin','wander'].map(k=>({k,pips:CARD[k].pips||0}));
 G.sel=G.cols[0].id;
 log('Squatters in the ruin: three people, a pick, and a wall with one gate.');
}
const mkRat=(x,y)=>G.crit.push({id:G.nid++,k:'Husk-rat',x,y,tr:[1,2,1,1,1,1],sk:{Bite:1},wd:[0,0,0,0,0,0],cd:0});
function genZone(){
 const z=G.zone;z.n++;z.on=true;const s=G.seed+z.n*977,gh=topZ(47,24);
 shapeRegion(PW,W-1,72,24,21,s+31);
 for(let y=0;y<H;y++)for(let x=PW;x<W;x++){
  if(G.keep[I(x,y)])continue;
  let h=2+Math.floor(noise((x-PW)/8,y/8,s)*4.2);const mk=G.mask[I(x,y)];
  if(mk===0){setCol(x,y,0,0,0);G.rev[I(x,y)]=0;continue;}
  if(mk===1){setCol(x,y,h+3,1,1);G.rev[I(x,y)]=0;continue;}
  if(x<=50&&y>=23&&y<=25)h=gh; else if(x<=52&&y>=22&&y<=26)h=Math.max(gh-1,Math.min(gh+1,h));
  const n=noise(x/5,y/5,s+3);setCol(x,y,h,1,n>.7?3:n>.45?2:1);G.rev[I(x,y)]=0;
 }
 easeNeck(47,72);
 scatter('vein',8,52,93,2,45);scatter('scrap',3,52,93,2,45);scatter('glass',3,52,93,2,45);
 const before=G.feats.length;scatter('cache',1,74,93,4,43);if(G.feats.length===before)scatter('cache',1,60,93,2,45);
 for(let i=0,g=0;i<5&&g<500;g++){const x=58+ri(34),y=3+ri(42);if(G.mask[I(x,y)]===2){mkRat(x,y);i++;}}
}
function forgetZone(){
 for(let y=0;y<H;y++)for(let x=PW;x<W;x++){if(G.keep[I(x,y)])continue;setCol(x,y,0,0,0);G.mask[I(x,y)]=0;G.rev[I(x,y)]=0;delete G.tok[K(x,y)];}
 G.feats=G.feats.filter(f=>f.x<PW||G.keep[I(f.x,f.y)]);G.crit=[];G.zone.on=false;
 log('The fog closes. What lay beyond the gate is forgotten.');
}
// ground lit by a brazier is kept when the zone is forgotten
function recomputeKeep(){G.keep.fill(0);for(const f of G.feats)if(f.k==='brazier')for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
 const x=f.x+dx,y=f.y+dy;if(x>=PW&&x<W-1&&y>0&&y<H-1&&dx*dx+dy*dy<=10&&G.mask[I(x,y)]){G.keep[I(x,y)]=1;G.rev[I(x,y)]=1;}}}
function log(s){G.log.push('D'+(day()+1)+' '+s);if(G.log.length>80)G.log.shift();}
function b64(a){let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function unb64(s){const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function save(){try{const o=Object.assign({},G,{vox:b64(G.vox),hgt:b64(G.hgt),rev:b64(G.rev),keep:b64(G.keep),mask:b64(G.mask),fx:[]});
 localStorage.setItem('crawlers4',JSON.stringify(o,(k,v)=>k[0]==='_'?undefined:v));}catch(e){}}
function load(){try{const s=localStorage.getItem('crawlers4');if(!s)return false;const o=JSON.parse(s);if(o.v!==1)return false;
 o.vox=unb64(o.vox);o.hgt=unb64(o.hgt);o.rev=unb64(o.rev);o.keep=o.keep?unb64(o.keep):new Uint8Array(W*H);
 if(o.mask)o.mask=unb64(o.mask);else{o.mask=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)o.mask[I(x,y)]=x<PW&&(x===0||y===0||y===H-1||(x===PW-1&&y!==24))?1:2;}
 G=o;return true;}catch(e){return false;}}
