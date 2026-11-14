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
function scatter(k,n,x0,x1,y0,y1,avoid){
 for(let i=0,g=0;i<n&&g<2000;g++){const x=x0+ri(x1-x0+1),y=y0+ri(y1-y0+1);
  if(featAt(x,y)||G.stock[K(x,y)])continue;
  if(avoid&&Math.abs(x-avoid[0])+Math.abs(y-avoid[1])<5)continue;
  G.feats.push({id:G.nid++,k,x,y,left:FEAT[k].uses,grow:0});i++;}
}
function mkCol(x,y){
 const tr=[];for(let i=0;i<6;i++){const r=R();tr.push(r<.3?1:r<.8?2:3);}
 const used=G.cols.map(c=>c.name),pool=NAMES.filter(n=>!used.includes(n));
 const c={id:G.nid++,name:pool[ri(pool.length)]||'Nameless',tr,sk:{},mk:{},need:{hun:0,rest:0,temp:0,str:0},
  wd:[0,0,0,0,0,0],worn:[null,null,null,null,null,null],hands:[null,null],carry:[],x,y,job:null,path:[],
  down:false,downT:0,home:false,by:null,scars:[],party:false,armed:false,cd:0,pen:0,asleep:false};
 G.cols.push(c);return c;
}
function addTok(x,y,t,pref){
 const ok=(tx,ty)=>tx>=0&&ty>=0&&tx<W&&ty<H&&(G.tok[K(tx,ty)]||[]).length<6&&Math.abs(topZ(tx,ty)-topZ(x,y))<=2;
 for(let pass=pref?0:1;pass<2;pass++)for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tx=x+dx,ty=y+dy;
  if(!ok(tx,ty)||(pass===0&&!G.stock[K(tx,ty)]))continue;
  (G.tok[K(tx,ty)]=G.tok[K(tx,ty)]||[]).push(t);return;}
}
function newGame(seed){
 G={v:1,seed,rs:seed,t:60,speed:1,vox:new Uint8Array(W*H*Z),hgt:new Uint8Array(W*H),rev:new Uint8Array(W*H),
  feats:[],tok:{},stock:{},digs:{},sites:[],cols:[],crit:[],exp:null,zone:{n:0,on:false},gateOpen:false,gate:{x:47,y:24},
  deck:[],discard:[],card:null,log:[],fx:[],nid:1,sel:null,res:{},seam:false,over:false};
 for(let y=0;y<H;y++)for(let x=0;x<PW;x++){
  let h=2+Math.floor(noise(x/9,y/9,seed)*3.2);
  if(x===0||y===0||y===H-1||x===PW-1){setCol(x,y,h+3,3,3);continue;}
  const n=noise(x/4,y/4,seed+7);setCol(x,y,h,1,n>.66?2:n>.56?1:19);
 }
 setCol(47,24,topZ(46,24),1,19);
 for(let y=0;y<H;y++)for(let x=PW;x<W;x++)setCol(x,y,3,1,1);
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
function genZone(){
 const z=G.zone;z.n++;z.on=true;const s=G.seed+z.n*977,gh=topZ(47,24);
 for(let y=0;y<H;y++)for(let x=PW;x<W;x++){
  let h=2+Math.floor(noise((x-PW)/8,y/8,s)*4.2);
  if(y===0||y===H-1||x===W-1){setCol(x,y,h+3,1,1);continue;}
  if(x<=50&&y>=23&&y<=25)h=gh; else if(x<=52&&y>=22&&y<=26)h=Math.max(gh-1,Math.min(gh+1,h));
  const n=noise(x/5,y/5,s+3);setCol(x,y,h,1,n>.7?3:n>.45?2:1);G.rev[I(x,y)]=0;
 }
 scatter('vein',8,52,93,2,45);scatter('scrap',3,52,93,2,45);scatter('glass',3,52,93,2,45);scatter('cache',1,78,93,4,43);
 for(let i=0;i<5;i++){const x=58+ri(34),y=3+ri(42);
  G.crit.push({id:G.nid++,k:'Husk-rat',x,y,tr:[1,2,1,1,1,1],sk:{Bite:1},wd:[0,0,0,0,0,0],cd:0});}
}
function forgetZone(){
 for(let y=0;y<H;y++)for(let x=PW;x<W;x++){setCol(x,y,3,1,1);G.rev[I(x,y)]=0;delete G.tok[K(x,y)];}
 G.feats=G.feats.filter(f=>f.x<PW);G.crit=[];G.zone.on=false;
 log('The fog closes. What lay beyond the gate is forgotten.');
}
function log(s){G.log.push('D'+(day()+1)+' '+s);if(G.log.length>80)G.log.shift();}
function b64(a){let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function unb64(s){const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function save(){try{const o=Object.assign({},G,{vox:b64(G.vox),hgt:b64(G.hgt),rev:b64(G.rev),fx:[]});
 localStorage.setItem('crawlers4',JSON.stringify(o,(k,v)=>k[0]==='_'?undefined:v));}catch(e){}}
function load(){try{const s=localStorage.getItem('crawlers4');if(!s)return false;const o=JSON.parse(s);if(o.v!==1)return false;
 o.vox=unb64(o.vox);o.hgt=unb64(o.hgt);o.rev=unb64(o.rev);G=o;return true;}catch(e){return false;}}
