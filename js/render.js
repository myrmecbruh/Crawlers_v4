'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const cam={x:0,y:(24+24)*8-40,s:2,yaw:0,tilt:0};
const HH=()=>cam.tilt?14:8; // half height of a ground diamond: 8 is the 2:1 view, 14 the raised one [slop]
function toV(x,y){switch(cam.yaw){case 1:return[H-1-y,x];case 2:return[W-1-x,H-1-y];case 3:return[y,W-1-x];}return[x,y];}
function toW(vx,vy){switch(cam.yaw){case 1:return[vy,H-1-vx];case 2:return[W-1-vx,H-1-vy];case 3:return[W-1-vy,vx];}return[vx,vy];}
function setView(yaw,tilt){const hh=HH(),w=toW((cam.x/16+cam.y/hh)/2,(cam.y/hh-cam.x/16)/2);
 cam.yaw=(yaw+4)%4;cam.tilt=tilt;const v=toV(w[0],w[1]);cam.x=(v[0]-v[1])*16;cam.y=(v[0]+v[1])*HH();redraw();}
function lookAt(x,y){const v=toV(x,y);cam.x=(v[0]-v[1])*16;cam.y=(v[0]+v[1])*HH()-G.hgt[I(x,y)]*16;redraw();}
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
 return'rgb('+c(n>>16)+','+c(n>>8&255)+','+c(n&255)+')';}
// ---- Terrain. Each column of voxels is drawn from one cached picture. The picture is computed in 3D: the column's top
// surface is shaped by the columns around it (a rounded lip toward lower ground, a skirt piled against higher ground) and
// then projected and lit pixel by pixel. How far a material rounds off is its `soft` value in data.js; 0 is a hard cube.
// A flat core is always left in the middle of a voxel, so the grid stays readable. [slop] shape and light amounts
const COLS=new Map(),RGB={};
const rgbOf=m=>RGB[m]||(RGB[m]=[parseInt(M[m].c.slice(1,3),16),parseInt(M[m].c.slice(3,5),16),parseInt(M[m].c.slice(5,7),16)]);
const TM=6; // pixels of headroom above a column's flat top, for skirts
// sg: eight characters, each 0 lower, 1 level, 2 higher: neighbours at u=0, v=0, u=1, v=1, then corners (0,0) (1,0) (1,1) (0,1)
function colSpr(hh,mt,mb,h,span,sg){
 const key=hh+'|'+mt+'|'+mb+'|'+h+'|'+span+'|'+sg;let c=COLS.get(key);if(c)return c;
 const Hh=TM+hh*2+span*16+1,N=32;c=document.createElement('canvas');c.width=32;c.height=Hh;
 const g=c.getContext('2d'),img=g.createImageData(32,Hh),d=img.data;
 const soft=M[mt].soft||0,B=soft,Bf=soft*1.3,Rf=soft*.8,s=i=>+sg[i]-1,ct=rgbOf(mt),cb=rgbOf(mb);
 const put=(x,y,col,f)=>{if(y<0||y>=Hh)return;const i=(y*32+x)*4;d[i]=Math.min(255,col[0]*f);d[i+1]=Math.min(255,col[1]*f);d[i+2]=Math.min(255,col[2]*f);d[i+3]=255;};
 const qr=t=>1-Math.sqrt(1-Math.min(1,t)*Math.min(1,t)); // quarter-round profile
 const E=(u,v)=>{if(!soft)return 0;const cu=Math.max(0,Math.min(1,u)),cv=Math.max(0,Math.min(1,v));
  // lip toward lower neighbours
  let tu=Math.max(s(0)<0?1-cu/B:0,s(2)<0?1-(1-cu)/B:0,0),tv=Math.max(s(1)<0?1-cv/B:0,s(3)<0?1-(1-cv)/B:0,0),t=Math.hypot(tu,tv);
  if(s(4)<0&&s(0)>=0&&s(1)>=0)t=Math.max(t,1-Math.hypot(cu,cv)/B);if(s(5)<0&&s(2)>=0&&s(1)>=0)t=Math.max(t,1-Math.hypot(1-cu,cv)/B);
  if(s(6)<0&&s(2)>=0&&s(3)>=0)t=Math.max(t,1-Math.hypot(1-cu,1-cv)/B);if(s(7)<0&&s(0)>=0&&s(3)>=0)t=Math.max(t,1-Math.hypot(cu,1-cv)/B);
  // skirt against higher neighbours
  let r=Math.max(s(0)>0?1-cu/Bf:0,s(2)>0?1-(1-cu)/Bf:0,s(1)>0?1-cv/Bf:0,s(3)>0?1-(1-cv)/Bf:0,0);
  if(s(4)>0)r=Math.max(r,1-Math.hypot(cu,cv)/Bf);if(s(5)>0)r=Math.max(r,1-Math.hypot(1-cu,cv)/Bf);
  if(s(6)>0)r=Math.max(r,1-Math.hypot(1-cu,1-cv)/Bf);if(s(7)>0)r=Math.max(r,1-Math.hypot(cu,1-cv)/Bf);
  return Rf*qr(r)-soft*qr(t);};
 const lv=z=>.72+.02*Math.min(31,4+z*5); // higher is lighter
 for(let k=0;k<=2*N-2;k++)for(let iu=Math.max(0,k-N+1);iu<=Math.min(N-1,k);iu++){
  const iv=k-iu,u=(iu+.5)/N,v=(iv+.5)/N,e=E(u,v),x=Math.min(31,Math.floor(16+(u-v)*16)),yp=(u+v)*hh,y=TM+Math.floor(yp-e*16);
  let f=1.12*lv(h+e);
  if(soft){const du=Math.max(-1.2,Math.min(1.2,(E(u+.03,v)-E(u-.03,v))/.06)),dv=Math.max(-1.2,Math.min(1.2,(E(u,v+.03)-E(u,v-.03))/.06));f*=1+.09*du-.09*dv;}
  if(hash2(x,Math.floor(yp),mt)<.14)f*=.88;
  put(x,y,ct,f);put(x,y+1,ct,f);put(x,y+2,ct,f);
  if(iu===N-1||iv===N-1){const right=iu===N-1,base=TM+Math.floor(yp)+span*16;
   for(let yy=y+1;yy<=base;yy++){const dep=Math.max(0,(yy-TM-yp)/16),col=dep<1?ct:cb;
    let ff=(right?.58:.8)*lv(h-Math.floor(dep));if(hash2(x,yy,dep<1?mt:mb)<.14)ff*=.88;put(x,yy,col,ff);}}}
 g.putImageData(img,0,0);COLS.set(key,c);return c;
}
// ---- Voxel pictures: true 3D shaping. The solid is a smooth field: every voxel contributes a box whose faces fade over a
// width `w` (0.22 of a voxel for soft materials, almost nothing for hard ones). Where the field is above one half there is
// rock. A lone edge therefore rounds off, an inside corner fills in, and a flat face stays exactly where the grid puts it,
// so each voxel keeps its bulk. For one voxel and its 26 neighbours, a ray is cast through every pixel to find that surface,
// and the pixel is lit by the surface's direction and darkened where rock stands close in front of it (ambient occlusion).
// A shape depends only on the 27 occupancies, so it is ray-traced once and then tinted per material and height. [slop] amounts
const SHAPES=new Map(),VSPR=new Map(),SQ=[],SW=.25;
function buildShape(key){
 const hh=key.length>27?+key.slice(0,key.length-27):8,sig=key.slice(-27),hard=sig[13]==='1',cls=[],wd=[],acl=[],awd=[];
 // A hard voxel is shaped as a crisp cube among hard voxels only (soft neighbours are drawn over it where they cover it).
 // A soft voxel is shaped as if every neighbour were soft, so it piles smoothly against walls. Both see every neighbour for shading.
 for(let i=0;i<27;i++){const c=+sig[i];cls.push(hard?(c===1?1:0):c?2:0);wd.push(hard?.03:.22);acl.push(c);awd.push(c===2?.22:.03);}
 const ox=Math.ceil((1+2*SW)*16),oy=Math.ceil(2*SW*hh+(1+SW)*16)+1,w=ox*2,h=oy+Math.ceil((2+2*SW)*hh+SW*16)+1,sh=new Float32Array(w*h);
 // field value at a point, or (own=true) which voxel contributes most there
 const pad=hard?.03:0; // hard cubes are drawn a hair oversize so no pixel is lost where they meet soft ground
 const F=(u,v,z,own,C,Wd)=>{let f=0,bw=0,bi=-1;C=C||cls;Wd=Wd||wd;
  for(let c=0;c<27;c++){if(!C[c])continue;const ww=Wd[c],lim=.5+ww+pad;
   const du=Math.abs(u-(c%3)+.5);if(du>=lim)continue;const dv=Math.abs(v-((c/3|0)%3)+.5);if(dv>=lim)continue;const dz=Math.abs(z-(c/9|0)+.5);if(dz>=lim)continue;
   const k=(du<=lim-2*ww?1:(lim-du)/(2*ww))*(dv<=lim-2*ww?1:(lim-dv)/(2*ww))*(dz<=lim-2*ww?1:(lim-dz)/(2*ww));
   f+=k;if(k>bw){bw=k;bi=c;}}
  return own?bi:f;};
 const dz=hh/8,lo=-SW,hi=1+SW,ds=.05,e=.03;
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){
  const a=(py-oy+.5+16)/hh,b=(px-ox+.5)/16,u1=(a+b)/2,v1=(a-b)/2; // where this pixel's ray crosses the voxel's top plane
  const t1=Math.min(hi-u1,hi-v1,(hi-1)/dz),t0=Math.max(lo-u1,lo-v1,(lo-1)/dz);if(t1<=t0)continue;
  if(F(u1+t1,v1+t1,1+t1*dz)>=.5)continue; // the ray arrives already inside rock: a nearer voxel owns this pixel
  let t=t1,hit=false;while(t>t0){t-=ds;if(F(u1+t,v1+t,1+t*dz)>=.5){hit=true;break;}}
  if(!hit)continue;let ta=t+ds,tb=t;for(let i=0;i<5;i++){const tm=(ta+tb)/2;if(F(u1+tm,v1+tm,1+tm*dz)>=.5)tb=tm;else ta=tm;}
  const hu=u1+tb,hv=v1+tb,hz=1+tb*dz;if(F(hu,hv,hz,true)!==13)continue; // the surface here belongs to a neighbour
  const gu=F(hu+e,hv,hz)-F(hu-e,hv,hz),gv=F(hu,hv+e,hz)-F(hu,hv-e,hz),gz=F(hu,hv,hz+e)-F(hu,hv,hz-e),gl=Math.hypot(gu,gv,gz)||1;
  const nu=-gu/gl,nv=-gv/gl,nz=-gz/gl,wz=Math.max(0,nz)**2,wu=Math.max(0,nu)**2,wv=Math.max(0,nv)**2,sm=wz+wu+wv;
  let s=sm>1e-4?(1.12*wz+.58*wu+.8*wv)/sm:.5;
  s*=1-.5*Math.min(1,1.5*F(hu+nu*.3,hv+nv*.3,hz+nz*.3,false,acl,awd)+.8*F(hu+nu*.6,hv+nv*.6,hz+nz*.6,false,acl,awd));
  sh[py*w+px]=Math.max(.05,s);}
 SHAPES.set(key,{ox,oy,w,h,sh});
}
// build queued shapes for a few milliseconds, then ask for another frame until none are left
function buildSome(ms){const t=performance.now();let n=0;while(SQ.length&&performance.now()-t<ms){buildShape(SQ.shift());n++;}return n;}
function voxSpr(key,m,z){const k=key+'|'+m+'|'+z;let c=VSPR.get(k);if(c)return c;
 const sp=SHAPES.get(key),col=rgbOf(m),lv=.72+.02*Math.min(31,4+(z+1)*5);c=document.createElement('canvas');c.width=sp.w;c.height=sp.h;
 const g=c.getContext('2d'),img=g.createImageData(sp.w,sp.h),d=img.data,sh=sp.sh;
 for(let i=0;i<sh.length;i++){const s=sh[i];if(!s)continue;const f=s*lv*(hash2(i%sp.w,(i/sp.w)|0,m)<.14?.88:1),j=i*4;
  d[j]=Math.min(255,col[0]*f);d[j+1]=Math.min(255,col[1]*f);d[j+2]=Math.min(255,col[2]*f);d[j+3]=255;}
 g.putImageData(img,0,0);VSPR.set(k,c);return c;}
// the same picture as a flat silhouette in the fog colour
function fogOf(c){if(c._fog)return c._fog;const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const g=o.getContext('2d');
 g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=FOGC;g.fillRect(0,0,o.width,o.height);return c._fog=o;}
// Ambient occlusion: dark bands on ground next to taller voxels, and along the foot of side faces. [slop] strengths
const AO={8:{},14:{}};
function mkAO(hh,kind){const c=document.createElement('canvas');c.width=32;c.height=hh*2+17;const g=c.getContext('2d'),band=t=>t<.14?.36:t<.3?.2:t<.46?.09:0;
 for(let py=0;py<hh*2+17;py++)for(let px=0;px<32;px++){
  const a=(px-15.5)/16,b=(py-(hh-.5))/hh,mx=px<16?px:31-px,y0=hh+Math.floor(mx*hh/16);let al=0;
  if(Math.abs(a)+Math.abs(b)<=1){const u=(a+b+1)/2,v=(b-a+1)/2;
   al=kind==='e0'?band(u):kind==='e1'?band(v):kind==='e2'?band(1-u):kind==='e3'?band(1-v):
    kind==='c0'?band(Math.hypot(u,v)):kind==='c1'?band(Math.hypot(1-u,v)):kind==='c2'?band(Math.hypot(1-u,1-v)):kind==='c3'?band(Math.hypot(u,1-v)):0;}
  else if(py>=y0&&py<y0+17&&(kind==='sl'&&px<16||kind==='sr'&&px>=16)){const k=y0+17-py;al=k<=3?.32:k<=6?.18:k<=9?.08:0;}
  if(al){g.fillStyle='rgba(6,6,14,'+al+')';g.fillRect(px,py,1,1);}}
 return c;}
for(const hh of[8,14])for(const k of['e0','e1','e2','e3','c0','c1','c2','c3','sl','sr'])AO[hh][k]=mkAO(hh,k);
// Distance fog: ground further back than where you are looking fades into haze. [slop] colour, start and depth
const FOGC='#262a36',FOGB={}; // FOGB is no longer used for terrain
for(const hh of[8,14]){const c=document.createElement('canvas');c.width=32;c.height=hh*2+17;const g=c.getContext('2d');g.fillStyle=FOGC;
 for(let py=0;py<hh*2+17;py++)for(let px=0;px<32;px++){const mx=px<16?px:31-px,y0=hh+Math.floor(mx*hh/16);
  if(Math.abs(px-15.5)/16+Math.abs(py-(hh-.5))/hh<=1||(py>=y0&&py<y0+17))g.fillRect(px,py,1,1);}
 FOGB[hh]=c;}
// Shadows under things, in the same colour and three bands as the ambient occlusion.
const SHAD={};
function shadow(x,y,rx){const hh=HH(),k=hh+'|'+rx;let c=SHAD[k];
 if(!c){const ry=Math.max(2,Math.round(rx*hh/16));c=SHAD[k]=document.createElement('canvas');c.width=rx*2+1;c.height=ry*2+1;const g=c.getContext('2d');
  for(let py=0;py<=ry*2;py++)for(let px=0;px<=rx*2;px++){const t=Math.hypot((px-rx)/rx,(py-ry)/ry),al=t<.5?.36:t<.78?.2:t<=1?.09:0;
   if(al){g.fillStyle='rgba(6,6,14,'+al+')';g.fillRect(px,py,1,1);}}}
 ctx.drawImage(c,Math.round(x)-(c.width>>1),Math.round(y)-(c.height>>1));}
const FSH={tree:5,moss:6,tuber:5,reed:6,scrap:9,vein:9,glass:7,cache:8,nest:10,cage:8,hearth:10,bench:11,brazier:5};
let dirty=true;
function redraw(){if(dirty)return;dirty=true;requestAnimationFrame(draw);}
function fit(){const r=cv.parentElement.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);
 cv.width=Math.max(1,Math.floor(r.width*d));cv.height=Math.max(1,Math.floor(r.height*d));cv._d=d;dirty=false;redraw();}
const rc=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
function diamond(sx,ty,c,fill){const hh=HH();ctx.beginPath();ctx.moveTo(sx,ty+1);ctx.lineTo(sx+15,ty+hh);ctx.lineTo(sx,ty+hh*2-1);ctx.lineTo(sx-15,ty+hh);ctx.closePath();
 if(fill){ctx.fillStyle=c;ctx.fill();}else{ctx.strokeStyle=c;ctx.lineWidth=1;ctx.stroke();}}
const PIP=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
function dieSpr(x,y,v,hit){rc(x,y,7,7,hit?'#f0c040':'#d8d4c8');for(const p of PIP[v])rc(x+1+(p%3)*2,y+1+Math.floor(p/3)*2,1,1,'#1a1a1a');}
function tokSpr(t,x,y){
 if(t.card){rc(x+1,y,6,8,'#e8e0c8');rc(x+2,y+2,4,4,'#a03030');rc(x+3,y+3,2,2,'#e8e0c8');return;}
 if(t.corpse){rc(x-2,y+4,10,3,'#d8d0b8');rc(x+7,y+3,3,3,'#c9a183');return;}
 ctx.drawImage(iconFor(t),x,y);
}
function held(it,x,b){if(!it)return;const m=M[it.m],c=m.c,f=m.f,w='#6a4c30',hi=shade(c,1.35),cord='#c9b39a';
 switch(it.it){
 case'pick':rc(x,b-22,1,12,w);
  if(f==='metal'){rc(x-3,b-23,7,1,c);rc(x-4,b-22,1,1,c);rc(x+4,b-22,1,1,c);rc(x-2,b-24,5,1,hi);}
  else if(f==='stone'){rc(x-3,b-24,6,3,c);rc(x,b-21,1,1,cord);rc(x-2,b-24,2,1,hi);}
  else{rc(x-3,b-24,2,1,c);rc(x-2,b-23,5,1,c);rc(x+3,b-22,1,2,c);rc(x,b-22,1,1,cord);}break;
 case'axe':rc(x,b-22,1,12,w);
  if(f==='metal'){rc(x+1,b-24,3,5,c);rc(x+3,b-25,1,7,hi);}else{rc(x-2,b-24,5,4,c);rc(x,b-20,1,1,cord);rc(x-1,b-24,2,1,hi);}break;
 case'knife':rc(x,b-13,1,2,w);
  if(f==='metal'){rc(x,b-18,1,5,c);rc(x,b-18,1,1,hi);}else if(f==='stone'){rc(x-1,b-17,3,4,c);rc(x,b-18,1,1,c);}else{rc(x,b-17,1,4,c);rc(x+1,b-19,1,3,c);}break;
 case'club':
  if(f==='wood'){rc(x,b-20,2,9,c);rc(x-1,b-24,4,5,c);rc(x-1,b-24,1,2,hi);}else{rc(x,b-21,2,10,c);rc(x-1,b-24,2,2,c);rc(x+1,b-24,2,2,c);rc(x-1,b-12,4,2,c);}break;
 case'blade':rc(x,b-26,1,13,c);rc(x,b-26,1,4,hi);rc(x-1,b-14,3,1,'#1c1c22');rc(x,b-13,1,2,w);break;
 case'shield':rc(x-2,b-21,5,9,c);rc(x-2,b-21,5,1,hi);rc(x-1,b-18,3,3,'#1c1c22');rc(x,b-17,1,1,hi);break;}
}
function facing(c){const d=[[1,0],[0,1],[-1,0],[0,-1]][c.face||0];let vx=d[0],vy=d[1];
 if(cam.yaw===1){vx=-d[1];vy=d[0];}else if(cam.yaw===2){vx=-d[0];vy=-d[1];}else if(cam.yaw===3){vx=d[1];vy=-d[0];}
 return{f:vx>0||vy<0?1:-1,back:vx<0||vy<0};}
// one row per pixel of height, however far the foot is from the hip, so a long stride or a step down leaves no gaps
function leg(hx,hy,fx,fy,col,fc,boot){const y1=Math.round(fy)-2,n=Math.max(1,y1-hy);for(let y=hy;y<y1;y++){const t=(y-hy)/n;rc(Math.round(hx+(fx-hx)*t)-1,y,3,1,boot&&y>=y1-3?fc:col);}rc(Math.round(fx)-1,y1,3,2,fc);}
// mv: null when standing, else {x0,y0,x1,y1,p}: screen anchors of the tile left and the tile entered, and progress 0..1
function charSpr(c,ax,ay,mv){
 // colonists from older saves have no look: derive a steady one from their id
 const lk=c.look||{skin:SKIN[c.id%SKIN.length],hair:HAIR[c.id*7%HAIR.length],eye:EYE[c.id*3%EYE.length]};
 const hs=lk.style!=null?lk.style:c.id*5%6,bd=lk.beard!=null?lk.beard:[0,0,0,2,0,1,0,3,0,0][c.id%10];
 const skin=lk.skin,rag='#5e574c',hair=lk.hair,eye=lk.eye,mc=it=>it?M[it.m].c:null,w=c.worn;
 if(c.down||c.asleep){const b=ay+2;
  shadow(ax,ay+1,12);
  if(c.id===G.sel){ctx.strokeStyle='#f0c040';ctx.beginPath();ctx.ellipse(ax,ay+1,11,4,0,0,7);ctx.stroke();}
  rc(ax-9,b-5,14,5,mc(w[1])||rag);rc(ax-9,b-5,5,5,mc(w[2])||rag);rc(ax+5,b-6,5,5,skin);if(hs!==2)rc(ax+8,b-7,2,6,hair);if(w[0])rc(ax+8,b-7,3,6,mc(w[0]));
  if(c.down){rc(ax-2,b-4,3,2,'#c02020');}else{rc(ax+9,b-12,3,1,'#ccd');rc(ax+10,b-11,1,1,'#ccd');rc(ax+9,b-10,3,1,'#ccd');}return;}
 // feet: two half-steps per tile. The stance foot stays where it was put down; the other swings past it.
 let fl,fr;
 if(mv){const p=mv.p,k=p<.5?0:1,q=(p-k/2)*2,at=t=>[mv.x0+(mv.x1-mv.x0)*t,mv.y0+(mv.y1-mv.y0)*t+2];
  const st=at(k/2+.25),sw=at(k/2-.25+q);sw[1]-=3*Math.sin(Math.PI*q);
  fl=k?sw:st;fr=k?st:sw;ax=Math.round(mv.x0+(mv.x1-mv.x0)*p);ay=Math.round(mv.y0+(mv.y1-mv.y0)*p-Math.abs(Math.sin(2*Math.PI*p)));
 }else{fl=[ax-2,ay+2];fr=[ax+3,ay+2];}
 const b=ay+2,F=facing(c),X=(x,ww)=>F.f>0?ax+x:ax-x-ww,r=(x,y,ww,h,col)=>rc(X(x,ww),y,ww,h,col);
 shadow(ax,ay+2,8);
 if(c.id===G.sel){ctx.strokeStyle='#f0c040';ctx.beginPath();ctx.ellipse(ax,ay+1,9,4,0,0,7);ctx.stroke();}
 const m=w[5],tc=mc(w[1])||rag,lc=mc(w[2])||rag,fc=mc(w[3])||skin,hc=mc(w[4])||skin;
 const fam=it=>it?M[it.m].f:'';
 const T=(x,y,ww,h,it,f)=>ctx.drawImage(texFor(it.m,f),0,0,ww,h,X(x,ww),y,ww,h); // textured cloth
 const legs=()=>{rc(ax-3,b-11,7,2,shade(lc,.85));leg(ax-2,b-10,fl[0],fl[1],shade(lc,.85),fc,!!w[3]);leg(ax+2,b-10,fr[0],fr[1],lc,fc,!!w[3]);
  if(fam(w[2])==='fiber'){rc(ax-3,b-10,7,1,'#c9b39a');}else if(w[2]){rc(ax-3,b-7,1,1,shade(lc,.6));rc(ax+3,b-6,1,1,shade(lc,.6));}};
 const cap=()=>{const h=w[0];if(!h)return;const c=mc(h),k=fam(h);
  if(k==='metal'){r(-4,b-31,8,3,c);r(-3,b-32,6,1,shade(c,1.35));r(-4,b-28,8,1,shade(c,.7));if(!F.back)r(1,b-28,1,3,c);}
  else if(k==='fiber'){T(-3,b-31,6,3,h,1);r(-4,b-29,1,5,shade(c,.8));}
  else{T(-4,b-31,8,3,h,1);r(-4,b-28,1,6,shade(c,.85));r(-3,b-32,6,1,shade(c,.9));if(F.back)T(-3,b-29,6,7,h,.9);}};
 const torso=f=>{const j=w[1];if(!j){r(-4,b-22,8,12,shade(rag,f));return;}const k=fam(j),c=mc(j);T(-4,b-22,8,12,j,f);
  if(k==='metal'){r(-5,b-23,3,2,shade(c,1.3));r(2,b-23,3,2,shade(c,1.3));r(-4,b-18,8,1,shade(c,.6));r(-4,b-14,8,1,shade(c,.6));}
  else if(k==='fiber')r(-4,b-13,8,1,'#c9b39a');
  else if(!F.back)r(0,b-22,2,3,shade(c,.55));};
 const cloak=f=>{if(!m||m.it!=='cloak')return;const k=fam(m);
  if(F.back){T(-5,b-23,10,k==='hide'?13:17,m,f);if(k==='hide')r(-5,b-24,10,2,'#e8e0d0');}
  else{T(-7,b-23,11,k==='hide'?13:17,m,f);if(k==='hide')r(-6,b-24,10,2,'#e8e0d0');}};
 const pack=()=>{if(!m||m.it!=='pack')return;const k=fam(m),c=mc(m);
  if(F.back){T(-4,b-22,7,10,m,1);r(-4,b-22,7,1,shade(c,1.3));if(k==='hide'){r(-4,b-18,7,1,shade(c,.55));r(-1,b-17,1,2,'#1c1c22');}}
  else{T(-9,b-22,5,10,m,1);r(-9,b-22,5,1,shade(c,1.3));if(k==='hide')r(-9,b-18,5,1,shade(c,.55));}};
 const cuff=x=>{if(w[4])rc(X(x,2)+sw(x),b-14,2,1,fam(w[4])==='fiber'?'#c9b39a':shade(hc,.6));};
 // arms swing against the leg on the same side
 const swL=mv?Math.round(-(fl[0]-(ax-2))*.5):0,swR=mv?Math.round(-(fr[0]-(ax+2))*.5):0,sw=x=>X(x,2)<ax?swL:swR;
 const arm=(x,col)=>{const s=sw(x),x0=X(x,2);for(let i=0;i<8;i++)rc(x0+Math.round(s*i/7),b-21+i,2,1,col);rc(x0+s,b-13,2,2,hc);};
 if(!F.back){ // facing the viewer; +x is the side the character faces
  cloak(.7);pack();
  held(c.hands[1],X(-7,1)+sw(-6),b);arm(-6,shade(tc,.7));cuff(-6);
  legs();
  torso(1);
  r(-3,b-29,6,7,skin);
  // hairstyles: 0 cropped, 1 long, 2 bald, 3 topknot, 4 shaggy, 5 tail
  if(hs===0||hs===5){r(-3,b-30,6,2,hair);r(-3,b-29,1,5,hair);if(hs===5)r(-5,b-28,2,7,hair);}
  else if(hs===1){r(-3,b-30,6,2,hair);r(-4,b-29,2,10,hair);r(3,b-28,1,3,hair);}
  else if(hs===3){r(-2,b-30,4,1,hair);if(!w[0])r(-1,b-33,3,3,hair);}
  else if(hs===4){r(-4,b-31,8,3,hair);r(-4,b-28,1,4,hair);r(3,b-28,1,3,hair);}
  r(0,b-26,1,1,eye);r(2,b-26,1,1,eye);
  if(bd===1)r(-1,b-24,4,2,shade(skin,.78));else if(bd>=2){r(-2,b-24,5,3,hair);r(-2,b-25,1,1,hair);if(bd===3)r(-1,b-21,3,3,hair);}
  cap();
  if(c.scars.length)r(1,b-28,1,4,'#802020');
  arm(3,shade(tc,.9));cuff(3);held(c.hands[0],X(5,1)+sw(3),b);
 }else{ // seen from behind
  held(c.hands[0],X(5,1)+sw(3),b);arm(3,shade(tc,.7));cuff(3);
  legs();
  torso(.9);
  r(-3,b-29,6,7,skin);
  if(hs===0||hs===5){r(-3,b-30,5,7,hair);r(-3,b-30,6,3,hair);if(hs===5)r(-1,b-27,2,9,hair);}
  else if(hs===1)r(-4,b-30,7,12,hair);
  else if(hs===3){r(-2,b-30,4,2,hair);if(!w[0])r(-1,b-33,3,3,hair);}
  else if(hs===4)r(-4,b-31,8,9,hair);
  cap();
  cloak(.8);pack();
  arm(-6,shade(tc,.8));cuff(-6);held(c.hands[1],X(-7,1)+sw(-6),b);
 }
 const wp=[[0,-27],[0,-17],[-3,-7],[-3,-1],[-6,-13],[-5,-21]];
 for(let i=0;i<6;i++)if(c.wd[i])r(wp[i][0],b+wp[i][1],2,2,'#d02020');
 for(let i=0;i<c.carry.length;i++)tokSpr(c.carry[i],X(-15-(i>2?8:0),8),b-18-(i%3)*7);
}
function featSpr(f,ax,ay){
 switch(f.k){
 case'tree':rc(ax-1,ay-22,3,24,'#5a4630');rc(ax-6,ay-18,5,2,'#5a4630');rc(ax+2,ay-24,6,2,'#5a4630');rc(ax-7,ay-21,2,3,'#5a4630');rc(ax+7,ay-28,2,4,'#5a4630');break;
 case'moss':rc(ax-6,ay-1,5,3,'#7f9a6a');rc(ax,ay-3,6,4,'#8faa7a');rc(ax-2,ay+2,5,2,'#6f8a5a');break;
 case'tuber':rc(ax-3,ay-5,1,6,'#6a8a50');rc(ax,ay-7,1,8,'#6a8a50');rc(ax+3,ay-4,1,5,'#6a8a50');rc(ax-1,ay-8,3,2,'#b07a9a');break;
 case'reed':for(let i=-5;i<=5;i+=2)rc(ax+i,ay-10-(i&2)*2,1,12+(i&2)*2,'#b5ad5e');break;
 case'scrap':rc(ax-7,ay-4,14,6,'#7a4a34');rc(ax-4,ay-8,7,4,'#9a5a3c');rc(ax+2,ay-11,2,5,'#aab3bd');break;
 case'vein':rc(ax-6,ay-8,12,10,'#5a5d66');rc(ax-4,ay-6,3,2,'#c8d0da');rc(ax+1,ay-3,4,2,'#c8d0da');rc(ax-1,ay-9,2,2,'#c8d0da');break;
 case'glass':rc(ax-3,ay-12,3,14,'#3f6e6c');rc(ax,ay-8,4,10,'#5f9e9a');rc(ax-5,ay-5,2,7,'#5f9e9a');break;
 case'cache':rc(ax-6,ay-7,12,9,'#3a3a44');rc(ax-6,ay-7,12,2,'#7fe0d0');rc(ax-1,ay-3,2,2,'#7fe0d0');break;
 case'nest':rc(ax-8,ay-4,16,6,'#4a3c30');rc(ax-6,ay-7,12,4,'#5a4a3a');rc(ax-2,ay-5,5,3,'#15110e');rc(ax-7,ay-8,2,2,'#d8d0b8');rc(ax+4,ay-9,3,1,'#d8d0b8');rc(ax+6,ay-3,2,1,'#d8d0b8');break;
 case'cage':rc(ax-6,ay-20,12,2,'#7a4a34');rc(ax-6,ay,12,2,'#7a4a34');for(let i=-6;i<=5;i+=3)rc(ax+i,ay-18,1,18,'#9a5a3c');rc(ax-2,ay-6,5,5,'#5e574c');rc(ax-1,ay-10,3,4,'#c9a183');break;
 case'brazier':rc(ax-1,ay-6,2,8,'#3a3a44');rc(ax-4,ay-9,8,3,'#55555f');rc(ax-3,ay-13,6,4,'#e07020');rc(ax-2,ay-16,3,4,'#f0c040');rc(ax+1,ay-14,1,2,'#f0c040');break;
 case'hearth':{const c=M[f.m].c;rc(ax-8,ay-3,16,6,shade(c,.7));rc(ax-6,ay-5,12,3,c);
  if(f.fuel>0){rc(ax-3,ay-10,6,6,'#e07020');rc(ax-2,ay-13,3,4,'#f0c040');rc(ax+1,ay-11,2,2,'#f0c040');}else rc(ax-3,ay-6,6,2,'#222');break;}
 case'bench':{const c=M[f.m].c;rc(ax-9,ay-9,18,3,c);rc(ax-8,ay-6,2,8,shade(c,.7));rc(ax+6,ay-6,2,8,shade(c,.7));rc(ax-4,ay-11,4,2,'#aab3bd');break;}
 }
}
function draw(){
 dirty=false;if(!G)return;
 const d=cv._d||1,s=cam.s*d,cw=cv.width,ch=cv.height;
 ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;rc(0,0,cw,ch,'#0b0b10');
 ctx.setTransform(s,0,0,s,Math.round(cw/2-cam.x*s),Math.round(ch/2-cam.y*s));
 const vx0=cam.x-cw/2/s-20,vx1=cam.x+cw/2/s+20,vy0=cam.y-ch/2/s-20,vy1=cam.y+ch/2/s+Z*16+20;
 const fm=new Map(),cm=new Map(),em=new Map(),sm=new Map(),xm=new Map();
 const put=(m,o)=>{const i=I(o.x,o.y);if(m.has(i))m.get(i).push(o);else m.set(i,[o]);};
 for(const f of G.feats)if(f.left>0||f.k==='hearth'||f.k==='bench'||f.k==='brazier')put(fm,f);
 const al=G.speed>0&&G._tickAt?Math.min(1,(performance.now()-G._tickAt)*G.speed/1000):1,hh0=HH();
 const anc=(x,y)=>{const v=toV(x,y);return[(v[0]-v[1])*16,(v[0]+v[1])*hh0-G.hgt[I(x,y)]*16+hh0];};
 const mover=o=>{if(o._mv!==G.t||al>=1)return null;const a=anc(o._px,o._py),b=anc(o.x,o.y);return{x0:a[0],y0:a[1],x1:b[0],y1:b[1],p:al};};
 const putM=(m,o)=>{let x=o.x,y=o.y;if(o._mv===G.t&&al<1){const a=toV(o._px,o._py),b=toV(x,y);if(a[0]+a[1]>b[0]+b[1]){x=o._px;y=o._py;}}
  const i=I(x,y);if(m.has(i))m.get(i).push(o);else m.set(i,[o]);};
 for(const c of G.cols)if(c.by==null)putM(cm,c);for(const e of G.crit)putM(em,e);for(const q of G.sites)put(sm,q);for(const f of G.fx)put(xm,f);
 const hh=HH(),VW=cam.yaw&1?H:W,VH=cam.yaw&1?W:H,dgF=Math.round(cam.y/hh);
 for(let dg=0;dg<VW+VH-1;dg++)for(let vx=Math.max(0,dg-VH+1);vx<=Math.min(VW-1,dg);vx++){
  const vy=dg-vx,sx=(vx-vy)*16,sy=dg*hh;if(sx<vx0||sx>vx1||sy<vy0||sy>vy1)continue;
  const wp_=toW(vx,vy),x=wp_[0],y=wp_[1],i=I(x,y),h=G.hgt[i];
  if(!h||(x>=PW&&!G.rev[i]))continue; // void and unseen ground are not drawn at all
  const fog=false,seen=n=>n[0]>=PW&&!G.rev[I(n[0],n[1])]?0:G.hgt[I(n[0],n[1])];
  let hE=0,hS=0;if(vx+1<VW)hE=seen(toW(vx+1,vy));if(vy+1<VH)hS=seen(toW(vx,vy+1));
  const z0=Math.max(0,Math.min(h-1,hE,hS));
  const far=(dgF-dg)*hh/8,fa=far<=4?0:Math.min(.72,Math.round((far-4)/22*.72*12)/12);
  ctx.globalAlpha=1;
  // Every voxel with a face toward the viewer is drawn from a picture shaped by its 26 neighbours. Until those pictures
  // exist (they are built a few at a time), the column is drawn with the quicker column picture instead.
  const oc=(a,b,z)=>{if(z<0)return 2;if(z>=Z||a<0||b<0||a>=VW||b>=VH)return 0;const n=toW(a,b),j=I(n[0],n[1]);if(n[0]>=PW&&!G.rev[j])return 0;
   const m=G.vox[(z*H+n[1])*W+n[0]];return m?(M[m].soft?2:1):0;};
  let ready=true;const vl=[];
  for(let z=0;z<h;z++){const m=G.vox[VI(x,y,z)];if(!m)continue;const o1=oc(vx,vy,z+1),o2=oc(vx+1,vy,z),o3=oc(vx,vy+1,z);
   if(M[m].soft?(o1&&o2&&o3):(o1===1&&o2===1&&o3===1))continue; // nothing of it can be seen
   let sig='';for(let c=-1;c<=1;c++)for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)sig+=oc(vx+a,vy+b,z+c);
   const key=hh+sig,shp=SHAPES.get(key);
   if(!shp){ready=false;if(shp===undefined){SHAPES.set(key,null);SQ.push(key);}}else vl.push(z,m,key);}
  if(ready)for(let q=0;q<vl.length;q+=3){const cs=voxSpr(vl[q+2],vl[q+1],vl[q]),sp=SHAPES.get(vl[q+2]);
   ctx.drawImage(cs,sx-sp.ox,sy-vl[q]*16-sp.oy);if(fa){ctx.globalAlpha=fa;ctx.drawImage(fogOf(cs),sx-sp.ox,sy-vl[q]*16-sp.oy);ctx.globalAlpha=1;}}
  else{const sv=(a,b)=>a<0||b<0||a>=VW||b>=VH?0:seen(toW(a,b)),sn=n=>n<h?'0':n>h?'2':'1';
   const sg=sn(sv(vx-1,vy))+sn(sv(vx,vy-1))+sn(hE)+sn(hS)+sn(sv(vx-1,vy-1))+sn(sv(vx+1,vy-1))+sn(sv(vx+1,vy+1))+sn(sv(vx-1,vy+1));
   const mt=G.vox[VI(x,y,h-1)],cs=colSpr(hh,mt,(h>1&&G.vox[VI(x,y,h-2)])||mt,h,h-z0,sg);
   ctx.drawImage(cs,sx-16,sy-h*16-TM);
   if(fa){ctx.globalAlpha=fa;ctx.drawImage(fogOf(cs),sx-16,sy-h*16-TM);}}
  ctx.globalAlpha=1-fa;
  if(fog)continue;
  const ty=sy-h*16,ay=ty+hh,k=K(x,y);
  if(G.stock[k])diamond(sx,ty,'rgba(240,192,64,.5)');
  if(G.digs[k])diamond(sx,ty,'rgba(220,60,60,.45)',1);
  if(x===47&&y===24&&!G.gateOpen){rc(sx-8,ay-22,16,24,'#3a2c20');rc(sx-8,ay-12,16,2,'#aab3bd');}
  const ss=sm.get(i);if(ss)for(const q of ss){diamond(sx,ty,'rgba(120,200,255,.8)');for(let n=0;n<q.need;n++)rc(sx-6+n*5,ay-2,4,4,n<q.have?'#7fd0ff':'#234');}
  const ff=fm.get(i);if(ff)for(const f of ff){shadow(sx,ay+1,FSH[f.k]||6);featSpr(f,sx,ay);}
  const tk=G.tok[k];if(tk){const nc=Math.min(3,tk.length);shadow(sx-13+nc*4.5,ay+3+(ff?4:0),3+nc*4);}
  if(tk)for(let n=0;n<tk.length;n++)tokSpr(tk[n],sx-13+(n%3)*9,ay-4-Math.floor(n/3)*8+(ff?4:0));
  const ee=em.get(i);if(ee)for(const e of ee){const mv=mover(e),ex=mv?Math.round(mv.x0+(mv.x1-mv.x0)*mv.p):anc(e.x,e.y)[0],ey=mv?Math.round(mv.y0+(mv.y1-mv.y0)*mv.p-(mv.p*4%2<1?1:0)):anc(e.x,e.y)[1],f=facing(e).f;
   shadow(ex,ey,7);rc(ex-5,ey-5,9,5,'#6a5548');rc(f>0?ex+3:ex-7,ey-7,4,4,'#6a5548');rc(f>0?ex+5:ex-6,ey-6,1,1,'#f04040');rc(f>0?ex-8:ex+5,ey-2,3,1,'#9a8070');if(wounds(e))rc(ex-2,ey-4,2,2,'#d02020');}
  const cc=cm.get(i);if(cc)for(let n=0;n<cc.length;n++){const c=cc[n],mv=mover(c),o=n*5-(cc.length-1)*2;if(mv){mv.x0+=o;mv.x1+=o;charSpr(c,0,0,mv);}else{const a=anc(c.x,c.y);charSpr(c,a[0]+o,a[1],null);}}
  ctx.globalAlpha=1;
  const xx=xm.get(i);if(xx){let row=0;for(const f of xx){const w=f.dice.length*8;for(let n=0;n<f.dice.length;n++)dieSpr(sx-w/2+n*8,ay-44-row*9,f.dice[n],f.dice[n]>=f.tgt);row++;}}
 }
 ctx.globalAlpha=1;ctx.setTransform(1,0,0,1,0,0);
 if(SQ.length&&buildSome(14))redraw();
 const t=tod(),a=t>=180?.42:t>=160?(t-160)/20*.42:t<10?(10-t)/10*.42:0;if(a)rc(0,0,cw,ch,'rgba(8,10,44,'+a+')');
}
function pick(px,py){
 const d=cv._d||1,s=cam.s*d,wx=(px*d-cv.width/2)/s+cam.x,wy=(py*d-cv.height/2)/s+cam.y;
 const hh=HH(),VW=cam.yaw&1?H:W,VH=cam.yaw&1?W:H;
 for(let dg=VW+VH-2;dg>=0;dg--)for(let vx=Math.max(0,dg-VH+1);vx<=Math.min(VW-1,dg);vx++){
  const w=toW(vx,dg-vx),sx=(vx-(dg-vx))*16,cy=dg*hh-G.hgt[I(w[0],w[1])]*16+hh;
  if(!G.hgt[I(w[0],w[1])]||(w[0]>=PW&&!G.rev[I(w[0],w[1])]))continue;
  if(Math.abs(wx-sx)/16+Math.abs(wy-cy)/hh<=1)return{x:w[0],y:w[1]};}
 return null;
}
