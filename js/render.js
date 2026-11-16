'use strict';
// ---- Renderer. The terrain is a real 3D mesh drawn with WebGL into a small canvas, one canvas pixel per game pixel, that
// the browser scales up with crisp pixels. Characters, tokens and features are the pixel sprites, stood upright in the
// 3D scene so rock in front of them hides them. Nothing is drawn unless something changed. [slop] all amounts
const cv=document.getElementById('cv');
const gl=cv.getContext('webgl2',{antialias:false,alpha:false,depth:true,premultipliedAlpha:false});
let ctx=null; // the 2D context the sprite art draws into: one of the sprite atlases
// The camera looks at a focus point. yaw is in quarter turns and can be any value; tilt 0 is the 2:1 view, 1 the raised one.
// s is how many screen pixels one game pixel takes.
const cam={fx:24.5,fy:24.5,fz:3,yaw:0,tilt:0,s:2};
const HH=()=>cam.tilt?14:8; // half the height of a ground tile in pixels: 8 is the 2:1 view, 14 the raised one [slop]
const RGB={},rgbOf=m=>RGB[m]||(RGB[m]=[parseInt(M[m].c.slice(1,3),16),parseInt(M[m].c.slice(3,5),16),parseInt(M[m].c.slice(5,7),16)]);
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
 return'rgb('+c(n>>16)+','+c(n>>8&255)+','+c(n&255)+')';}
// The projection, exactly the pixel scale of the art: a tile is 32 pixels wide, a voxel 16 pixels tall. rx,ry are the
// turned ground offsets from the focus; N is nearness to the viewer, used for depth.
function camK(){const hh=HH(),st=hh/16,ct=Math.sqrt(1-st*st),p=cam.yaw*Math.PI/2;
 return{hh,cs:Math.cos(p),sn:Math.sin(p),k1:ct/Math.SQRT2,k2:st/(Math.SQRT2*ct)};}
function proj(K,x,y,z){const dx=x-cam.fx,dy=y-cam.fy,dz=z-cam.fz,rx=dx*K.cs-dy*K.sn,ry=dx*K.sn+dy*K.cs;
 return[(rx-ry)*16,(rx+ry)*K.hh-dz*16,(rx+ry)*K.k1+dz*K.k2,rx+ry];}
// screen offset in game pixels (on the focus height) back to a ground offset in tiles
function unproj(K,sx,sy){const b=sx/16,a=sy/K.hh,rx=(a+b)/2,ry=(a-b)/2;return[rx*K.cs+ry*K.sn,-rx*K.sn+ry*K.cs];}
function setView(yaw,tilt){cam.yaw=((yaw%4)+4)%4;cam.tilt=tilt;redraw();}
// A quarter turn swings smoothly: it starts slowly, speeds up, and settles slowly (ease in and out) over 0.45 s. Frames are
// drawn only while it turns. A new turn while one is running carries on from where the view is.
let TURN=null;
function turnBy(q){const from=cam.yaw,goal=(TURN?TURN.goal:Math.round(cam.yaw))+q;TURN={from,goal,t0:performance.now()};requestAnimationFrame(turnStep);}
function turnStep(){if(!TURN)return;const p=Math.min(1,(performance.now()-TURN.t0)/450),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
 cam.yaw=TURN.from+(TURN.goal-TURN.from)*e;dirty=true;draw();
 if(p<1)requestAnimationFrame(turnStep);else{cam.yaw=((Math.round(TURN.goal)%4)+4)%4;TURN=null;dirty=true;draw();}}
function lookAt(x,y){cam.fx=x+.5;cam.fy=y+.5;cam.fz=G.hgt[I(x,y)]||cam.fz;redraw();}
function panBy(f0,dx,dy){const K=camK(),d=unproj(K,dx,dy);cam.fx=Math.max(1,Math.min(G&&G.zone.on?W-1:PW,f0[0]-d[0]));cam.fy=Math.max(1,Math.min(H-1,f0[1]-d[1]));redraw();}

// ---- Terrain mesh. The solid is a smooth field: every voxel adds a box whose faces fade over a width set by its
// material's style; where the field passes one half there is rock. It is sampled four times per voxel and turned into a
// mesh with surface nets, one chunk of 16 x 16 tiles at a time, rebuilt only when that chunk's voxels change.
// Styles (the geometry of each material):
//   p pillow (ash): wide rounding, so voxels slump into soft mounds    l lumpy (rubble): pushed into knobbly stones
//   b block (granite): firm blocks with small bevelled edges, shaded in flat planes    c crystal (slag-glass): flat tilted facets
//   h hard: a plain cube (anything else)
// Each voxel also varies: see 'Voxel variety' below.
const STYLE={1:'b',2:'l',3:'c',19:'p'},SW_={p:.4,l:.2,b:.14,c:.05,h:.05},RES=4,CH=16,PADS=3;
const styleOf=m=>STYLE[m]||'h';
function vsolid(i,j,k){if(k<0)return 1;if(i<0||j<0||i>=W||j>=H||k>=Z)return 0;return G.vox[(k*H+j)*W+i];}
// ---- Voxel variety. Every voxel has a variant (0-3) and a turn (0-3 quarter turns about the vertical), picked from a
// hash of its position. The variant sets how far each exposed face bulges out or sinks in, whether one exposed top corner
// is chipped off, and, turned by the turn, the pattern its surface is pushed into. Faces against another voxel never move,
// so neighbours always meet. [slop] all amounts
const VAR_OFF={p:.1,l:.11,b:.09,c:.09,h:.05},VAR_CHIP={p:.3,l:.34,b:.42,c:.46,h:.3};
let PC=null,PCo=null; // the current chunk's cache of voxel params, and its origin/size
function mkParams(i,j,k){const m=vsolid(i,j,k);if(!m||k<0)return m?{m,st:'h',w:.05,lo:[0,0,0],hi:[0,0,0],chip:null,r:0,v:0}:null;
 const st=styleOf(m),w=SW_[st],A=VAR_OFF[st],h=n=>hash3(i,j,k,n),v=Math.floor(h(11)*4),r=Math.floor(h(12)*4);
 const ex=[!vsolid(i-1,j,k),!vsolid(i,j-1,k),!vsolid(i,j,k-1)],ex2=[!vsolid(i+1,j,k),!vsolid(i,j+1,k),!vsolid(i,j,k+1)];
 const lo=[0,0,0],hi=[0,0,0];for(let a=0;a<3;a++){if(ex[a]&&a<2)lo[a]=(h(20+a)-.5)*2*A;if(ex2[a])hi[a]=(h(23+a)-.5)*2*A;}
 let chip=null;if(ex2[2]&&VAR_CHIP[st]&&h(30)<.75){const sx=v&1?1:-1,sy=v&2?1:-1;
  if((sx<0?ex[0]:ex2[0])&&(sy<0?ex[1]:ex2[1]))chip={sx,sy,c:VAR_CHIP[st]*(.6+.4*h(31))};}
 return{m,st,w,lo,hi,chip,r,v};}
function getP(i,j,k){if(PC){const a=i-PCo[0],b=j-PCo[1],c=k-PCo[2];if(a>=0&&b>=0&&c>=0&&a<PCo[3]&&b<PCo[3]&&c<PCo[4]){const q=(c*PCo[3]+b)*PCo[3]+a;
  let p=PC[q];if(p===undefined)p=PC[q]=mkParams(i,j,k);return p;}}return mkParams(i,j,k);}
// one voxel's share of the field at a point
function contribP(P,i,j,k,x,y,z){const w=P.w,d=[x-i-.5,y-j-.5,z-k-.5];let kk=1;
 for(let a=0;a<3;a++){const ad=Math.abs(d[a]),lim=.5+w+(d[a]<0?P.lo[a]:P.hi[a]);if(ad>=lim)return 0;if(ad>lim-2*w)kk*=(lim-ad)/(2*w);}
 if(P.chip){const s=P.chip.sx*d[0]+P.chip.sy*d[1]+d[2],cut=1.5-P.chip.c;if(s>cut-.08)kk*=Math.max(0,Math.min(1,(cut+.08-s)/.16));}
 return kk;}
function fieldAt(x,y,z,own){const i0=Math.floor(x),j0=Math.floor(y),k0=Math.floor(z);let f=0,best=0,bm=0;
 for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=i0+di,j=j0+dj,k=k0+dk,P=getP(i,j,k);if(!P)continue;
  const c=contribP(P,i,j,k,x,y,z);f+=c;if(c>best){best=c;bm=P.m;}}
 return own?bm:f;}
// repeating noise, so a pattern runs on unbroken from one voxel into the next
function hash3(x,y,z,s){return hash2(x,y*131+z*977,s);}
const WT=new Float32Array(6*6*6*3);for(let i=0;i<216;i++)for(let k=0;k<3;k++)WT[i*3+k]=hash2(i,k,808)-.5;
function warp(u,v,z,o,n){const X=u*n,Y=v*n,Q=z*n,xi=Math.floor(X),yi=Math.floor(Y),zi=Math.floor(Q),fx=X-xi,fy=Y-yi,fz=Q-zi,w=a=>((a%n)+n)%n;
 o[0]=o[1]=o[2]=0;for(let c=0;c<8;c++){const a=c&1,b=c>>1&1,d=c>>2,k=(w(xi+a)+n*w(yi+b)+n*n*w(zi+d))*3,f=(a?fx:1-fx)*(b?fy:1-fy)*(d?fz:1-fz);
  o[0]+=WT[k]*f;o[1]+=WT[k+1]*f;o[2]+=WT[k+2]*f;}}
const tri=x=>Math.abs(x-Math.floor(x)-.5)*2-.5;
// The pattern a voxel pushes its surface into, in its own turned frame (lx,ly,lz from its centre; v its variant):
// rubble into lumps, ash into a slump, granite into a few flat chips, glass into facets. o is the push.
function pattern(st,lx,ly,lz,v,o){const q=v*1.37;
 if(st==='l'){warp(lx+q,ly+q*.7,lz+q*.3,o,3);o[0]*=.42;o[1]*=.42;o[2]*=.42;}
 else if(st==='p'){warp(lx+q+3.7,ly+1.3,lz,o,2);o[0]*=.2;o[1]*=.2;o[2]=o[2]*.12-.06;}
 else if(st==='c'){o[0]=tri(2*ly+2*lz+.25+q)*.13;o[1]=tri(2*lx+2*lz+.6-q)*.13;o[2]=tri(2*lx-2*ly+.4+q)*.1;}
 else if(st==='b'){o[0]=tri(1.5*ly+lz+q)*.06;o[1]=tri(1.5*lx-lz+q*.5)*.06;o[2]=tri(lx+ly+q)*.05;}
 else o[0]=o[1]=o[2]=0;}
// A mesh corner's push blends the patterns of every voxel among the 26 neighbours (and itself) that reaches it, weighted by
// how much each reaches: deep in one voxel's face it is that voxel's pattern, at a shared edge the two blend, so the
// surface never tears where two different variants or turns meet.
const PB=[0,0,0];
function pushAt(x,y,z,o){const i0=Math.floor(x),j0=Math.floor(y),k0=Math.floor(z);let ws=0;o[0]=o[1]=o[2]=0;
 for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=i0+di,j=j0+dj,k=k0+dk,P=getP(i,j,k);if(!P)continue;
  const kw=contribP(P,i,j,k,x,y,z);if(kw<=0)continue;let lx=x-i-.5,ly=y-j-.5;const lz=z-k-.5;
  for(let t=0;t<P.r;t++){const a=lx;lx=-ly;ly=a;}                 // into the voxel's turned frame
  pattern(P.st,lx,ly,lz,P.v,PB);let px=PB[0],py=PB[1];
  for(let t=0;t<P.r;t++){const a=px;px=py;py=-a;}                 // and back
  o[0]+=kw*px;o[1]+=kw*py;o[2]+=kw*PB[2];ws+=kw;}
 if(ws>0){o[0]/=ws;o[1]/=ws;o[2]/=ws;}}
const EDGES=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
function buildChunk(cx,cy){
 const sx0=cx*CH*RES-PADS,sy0=cy*CH*RES-PADS,sz0=-PADS,nx=CH*RES+2*PADS+1,ny=nx,nz=Z*RES+2*PADS+1,T=.5;
 const F=new Float32Array(nx*ny*nz),at=(ix,iy,iz)=>(iz*ny+iy)*nx+ix;
 // a voxel whose 27-neighbourhood is all rock or all air needs no field: 2 all rock, 0 all air, 1 mixed
 const vx0=Math.floor((sx0+.5)/RES)-1,vy0=Math.floor((sy0+.5)/RES)-1,vz0=-3,vnx=CH+6,vnz=Z+6,U=new Int8Array(vnx*vnx*vnz).fill(-1);
 PC=new Array(vnx*vnx*vnz);PCo=[vx0-1,vy0-1,vz0-1,vnx+2,vnz+2];PC=new Array(PCo[3]*PCo[3]*PCo[4]);
 const uni=(i,j,k)=>{const q=((k-vz0)*vnx+(j-vy0))*vnx+(i-vx0);if(U[q]>=0)return U[q];let n=0;
  for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(vsolid(i+di,j+dj,k+dk))n++;return U[q]=n===27?2:n===0?0:1;};
 for(let iz=0;iz<nz;iz++){const z=(sz0+iz+.5)/RES,k=Math.floor(z);for(let iy=0;iy<ny;iy++){const y=(sy0+iy+.5)/RES,j=Math.floor(y);
  for(let ix=0;ix<nx;ix++){const x=(sx0+ix+.5)/RES,i=Math.floor(x),u=uni(i,j,k);F[at(ix,iy,iz)]=u===2?1.5:u===0?0:fieldAt(x,y,z);}}}
 const tri3=(x,y,z)=>{const X=Math.max(0,Math.min(nx-1.001,x*RES-.5-sx0)),Y=Math.max(0,Math.min(ny-1.001,y*RES-.5-sy0)),Q=Math.max(0,Math.min(nz-1.001,z*RES-.5-sz0));
  const xi=X|0,yi=Y|0,zi=Q|0,fx=X-xi,fy=Y-yi,fz=Q-zi;let r=0;
  for(let c=0;c<8;c++){const a=c&1,b=c>>1&1,d=c>>2;r+=F[at(xi+a,yi+b,zi+d)]*(a?fx:1-fx)*(b?fy:1-fy)*(d?fz:1-fz);}return r;};
 const VI_=new Int32Array(nx*ny*nz).fill(-1),vd=[],idx=[],o=[0,0,0];
 const cellVert=(cx_,cy_,cz_)=>{const q=at(cx_,cy_,cz_);if(VI_[q]>=0)return VI_[q];
  const v=[];for(let c=0;c<8;c++)v.push(F[at(cx_+(c&1),cy_+(c>>1&1),cz_+(c>>2))]);
  let px=0,py=0,pz=0,n=0;
  for(const e of EDGES){const a=v[e[0]],b=v[e[1]];if((a>T)===(b>T))continue;const t=(T-a)/(b-a);
   px+=(e[0]&1)+((e[1]&1)-(e[0]&1))*t;py+=(e[0]>>1&1)+((e[1]>>1&1)-(e[0]>>1&1))*t;pz+=(e[0]>>2)+((e[1]>>2)-(e[0]>>2))*t;n++;}
  px/=n;py/=n;pz/=n;
  let gx=0,gy=0,gz=0;for(let c=0;c<8;c++){gx+=(c&1?1:-1)*v[c];gy+=(c>>1&1?1:-1)*v[c];gz+=(c>>2?1:-1)*v[c];}
  const gl_=Math.hypot(gx,gy,gz)||1,nx_=-gx/gl_,ny_=-gy/gl_,nz_=-gz/gl_;
  let x=(sx0+cx_+.5+px)/RES,y=(sy0+cy_+.5+py)/RES,z=(sz0+cz_+.5+pz)/RES;
  const m=fieldAt(x-nx_*.08,y-ny_*.08,z-nz_*.08,true)||fieldAt(x,y,z,true)||1;
  const ao=1-.5*Math.min(1,1.5*Math.min(1,tri3(x+nx_*.3,y+ny_*.3,z+nz_*.3))+.8*Math.min(1,tri3(x+nx_*.6,y+ny_*.6,z+nz_*.6)));
  pushAt(x,y,z,o);x+=o[0];y+=o[1];z+=o[2];
  vd.push(x,y,z,m,ao);return VI_[q]=vd.length/5-1;};
 // a face for every sample edge, owned by this chunk, where rock meets air
 for(let iz=1;iz<nz-1;iz++)for(let iy=PADS;iy<PADS+CH*RES;iy++)for(let ix=PADS;ix<PADS+CH*RES;ix++){
  const s=F[at(ix,iy,iz)]>T;
  if(s!==(F[at(ix+1,iy,iz)]>T)){const a=cellVert(ix,iy-1,iz-1),b=cellVert(ix,iy,iz-1),c=cellVert(ix,iy,iz),d=cellVert(ix,iy-1,iz);idx.push(a,b,c,a,c,d);}
  if(s!==(F[at(ix,iy+1,iz)]>T)){const a=cellVert(ix-1,iy,iz-1),b=cellVert(ix,iy,iz-1),c=cellVert(ix,iy,iz),d=cellVert(ix-1,iy,iz);idx.push(a,b,c,a,c,d);}
  if(s!==(F[at(ix,iy,iz+1)]>T)){const a=cellVert(ix-1,iy-1,iz),b=cellVert(ix,iy-1,iz),c=cellVert(ix,iy,iz),d=cellVert(ix-1,iy,iz);idx.push(a,b,c,a,c,d);}}
 PC=null;
 return{v:new Float32Array(vd),i:new Uint32Array(idx)};
}

// Shadows under things, in the same colour and three bands as the ambient occlusion.
const SHAD={};
// While a sprite is painted, its shadows are noted rather than drawn (SHQ), and drawn on the ground with soft edges.
let SHQ=null;
function shadow(x,y,rx){if(SHQ){SHQ.push([x,y,rx]);return;}const hh=HH(),k=hh+'|'+rx;let c=SHAD[k];
 if(!c){const ry=Math.max(2,Math.round(rx*hh/16));c=SHAD[k]=document.createElement('canvas');c.width=rx*2+1;c.height=ry*2+1;const g=c.getContext('2d');
  for(let py=0;py<=ry*2;py++)for(let px=0;px<=rx*2;px++){const t=Math.hypot((px-rx)/rx,(py-ry)/ry),al=t<.5?.36:t<.78?.2:t<=1?.09:0;
   if(al){g.fillStyle='rgba(6,6,14,'+al+')';g.fillRect(px,py,1,1);}}}
 ctx.drawImage(c,Math.round(x)-(c.width>>1),Math.round(y)-(c.height>>1));}

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
// which way a figure faces on screen, for any camera turn: f is 1 when facing right, back when walking away
function facing(c){const d=[[1,0],[0,1],[-1,0],[0,-1]][c.face||0],p=cam.yaw*Math.PI/2,cs=Math.cos(p),sn=Math.sin(p);
 const rx=d[0]*cs-d[1]*sn,ry=d[0]*sn+d[1]*cs,sx=rx-ry,dp=rx+ry;
 return{f:sx>1e-6||(Math.abs(sx)<=1e-6&&dp<0)?1:-1,back:dp<-1e-6};}
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
 case'crop':if(f.left>0){for(const [dx,dy] of[[-6,-1],[0,-3],[5,0],[-2,2]]){rc(ax+dx,ay+dy-5,1,5,'#6a8a50');rc(ax+dx-1,ay+dy-7,3,2,'#7f9a6a');rc(ax+dx-1,ay+dy,3,2,'#b07a9a');}}
  else for(const [dx,dy] of[[-6,-1],[0,-3],[5,0],[-2,2]])rc(ax+dx,ay+dy-2,1,2,'#6a8a50');break;
 case'trap':rc(ax-7,ay-1,14,3,'#3a3a44');for(let i=-6;i<=5;i+=3){rc(ax+i,ay-5,1,4,'#aab3bd');rc(ax+i,ay-6,1,1,'#e8eef4');}break;
 case'hearth':{const c=M[f.m].c;rc(ax-8,ay-3,16,6,shade(c,.7));rc(ax-6,ay-5,12,3,c);
  if(f.fuel>0){rc(ax-3,ay-10,6,6,'#e07020');rc(ax-2,ay-13,3,4,'#f0c040');rc(ax+1,ay-11,2,2,'#f0c040');}else rc(ax-3,ay-6,6,2,'#222');break;}
 case'bench':{const c=M[f.m].c;rc(ax-9,ay-9,18,3,c);rc(ax-8,ay-6,2,8,shade(c,.7));rc(ax+6,ay-6,2,8,shade(c,.7));rc(ax-4,ay-11,4,2,'#aab3bd');break;}
 }
}

// ---- GL setup
const NCX=W/CH,NCY=H/CH,CHUNKS=[];
function mkProg(vs,fs){const p=gl.createProgram();for(const [t,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(t);
 gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
 const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name.replace('[0]','')]=gl.getUniformLocation(p,a.name);}
 return{p,u};}
const PROJ=`uniform vec3 uF;uniform vec4 uK;uniform float uK2;uniform vec2 uVP;uniform vec2 uSh;
vec4 pr(vec3 w,out float a,out float N){vec3 d=w-uF;float rx=d.x*uK.x-d.y*uK.y,ry=d.x*uK.y+d.y*uK.x;a=rx+ry;
 N=a*uK.w+d.z*uK2;return vec4((rx-ry)*16.+uSh.x,a*uK.z-d.z*16.+uSh.y,0.,0.);}`;
const LOOK=`uniform vec3 uFog;uniform float uNight;uniform float uHH;
// distance fog: haze starts 2 rows behind the point you look at and reaches 75% 14 rows further back
vec3 look(vec3 c,float a){float far=-a*uHH/8.,fa=clamp((far-2.)/12.*.75,0.,.75);c=mix(c,uFog,fa);return mix(c,vec3(8.,10.,44.)/255.,uNight);}`;
let TP,SP,DP,revTex;
function glInit(){
 TP=mkProg(`#version 300 es
precision highp float;layout(location=0)in vec3 aP;layout(location=1)in float aM;layout(location=2)in float aA;
${PROJ}
out vec3 vW;flat out int vM;out float vA;out float vR;
void main(){float a,N;vec4 s=pr(aP,a,N);gl_Position=vec4(s.x*2./uVP.x,-s.y*2./uVP.y,-N/256.,1.);vW=aP;vM=int(aM+.5);vA=aA;vR=a;}`,
 `#version 300 es
precision highp float;in vec3 vW;flat in int vM;in float vA;in float vR;
uniform vec4 uK;uniform float uK2;uniform vec3 uF;uniform vec3 uPal[24];uniform highp sampler2D uRev;
${LOOK}
out vec4 o;
float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float worley(vec3 p){vec3 i=floor(p),f=fract(p);float d1=9.,d2=9.;
 for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 g=vec3(x,y,z),c=g+.15+.7*vec3(h3(i+g),h3(i+g+31.),h3(i+g+57.))-f;float d=length(c);
  if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return d2-d1;}
void main(){
 vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
 vec3 r=vec3(n.x*uK.x-n.y*uK.y,n.x*uK.y+n.y*uK.x,n.z);
 if((r.x+r.y)*uK.w+r.z*uK2<0.){n=-n;r=-r;}
 ivec2 c=ivec2(floor(vW.xy-n.xy*.03));if(texelFetch(uRev,c,0).r<.5)discard;
 float wz=pow(max(r.z,0.),2.),wu=pow(max(r.x,0.),2.),wv=pow(max(r.y,0.),2.),sm=wz+wu+wv;
 float s=sm>1e-4?(1.12*wz+.58*wu+.8*wv)/sm:.5;
 vec3 q=floor(vW*16.);float sp=(h3(q)<.14?.88:1.)*(.93+.14*h3(floor(vW-n*.06)+.5)); // speckle, and each voxel's own tone
 if(vM==19)s=.82+(s-.82)*.55;
 else if(vM==2){float e=worley(vW*3.);s*=(e<.12?.62:1.)*(.86+.28*h3(floor(vW*3.)));}
 else if(vM==1)s*=.92+.14*h3(floor(vW*vec3(5.,5.,4.)));
 else if(vM==3){s*=1.08;if(h3(q+7.)<.008&&r.z>.5)s=1.6;}
 float lv=clamp(1.+.13*(vW.z-uF.z),.5,1.55); // height tint: 13% lighter per voxel above the height you look at, darker below
 vec3 col=uPal[vM]*s*lv*sp*vA;
 o=vec4(look(col,vR),1.);}`);
 SP=mkProg(`#version 300 es
precision highp float;layout(location=0)in vec3 aF;layout(location=1)in vec2 aO;layout(location=2)in vec2 aU;layout(location=3)in float aH;
${PROJ}
uniform vec2 uTS;uniform float uBias;
out vec2 vU;out float vR;
void main(){float a,N;vec4 s=pr(aF,a,N);vec2 P=floor(s.xy+uVP*.5+.5)+aO;
 N+=max(aH,0.)/16.*uK2+uBias;gl_Position=vec4(P.x/uVP.x*2.-1.,1.-P.y/uVP.y*2.,-N/256.,1.);vU=aU/uTS;vR=a;}`,
 `#version 300 es
precision highp float;in vec2 vU;in float vR;uniform sampler2D uT;uniform float uGhost;uniform int uMode;
${LOOK}
out vec4 o;
void main(){vec4 t=texture(uT,vU);
 if(uMode==2){if(t.a<.01)discard;o=vec4(look(t.rgb,vR),t.a);return;} // shadows: soft
 if(t.a<.5)discard;
 if(uMode==1){o=vec4(.86,.92,1.,uGhost);return;}
 o=vec4(look(t.rgb,vR),1.);}`);
 DP=mkProg(`#version 300 es
precision highp float;layout(location=0)in vec3 aP;layout(location=1)in vec4 aC;layout(location=2)in vec2 aL;
${PROJ}
out vec4 vC;out vec2 vL;out float vR;
void main(){float a,N;vec4 s=pr(aP,a,N);gl_Position=vec4(s.x*2./uVP.x,-s.y*2./uVP.y,-(N+.05)/256.,1.);vC=aC;vL=aL;vR=a;}`,
 `#version 300 es
precision highp float;in vec4 vC;in vec2 vL;in float vR;
${LOOK}
out vec4 o;
void main(){float e=min(min(vL.x,1.-vL.x),min(vL.y,1.-vL.y));if(vC.a>0.&&e>.07)discard; // outline, or fill when alpha is negative
 o=vec4(look(vC.rgb,vR),abs(vC.a));}`);
 revTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,revTex);
 for(const p of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST);
 gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
 for(let i=0;i<NCX*NCY;i++)CHUNKS.push({vao:gl.createVertexArray(),vb:gl.createBuffer(),ib:gl.createBuffer(),n:0});
 for(const A of[ATL,DYN]){A.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,A.tex);for(const p of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST);
  for(const p of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);}
 SB.vao=gl.createVertexArray();SB.vb=gl.createBuffer();DB.vao=gl.createVertexArray();DB.vb=gl.createBuffer();
 gl.bindVertexArray(SB.vao);gl.bindBuffer(gl.ARRAY_BUFFER,SB.vb);
 for(const [l,n,o] of[[0,3,0],[1,2,12],[2,2,20],[3,1,28]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,32,o);}
 gl.bindVertexArray(DB.vao);gl.bindBuffer(gl.ARRAY_BUFFER,DB.vb);
 for(const [l,n,o] of[[0,3,0],[1,4,12],[2,2,28]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,36,o);}
 gl.bindVertexArray(null);
}
function uploadChunk(k,m){const C=CHUNKS[k];C.n=m.i.length;gl.bindVertexArray(C.vao);
 gl.bindBuffer(gl.ARRAY_BUFFER,C.vb);gl.bufferData(gl.ARRAY_BUFFER,m.v,gl.STATIC_DRAW);
 for(const [l,n,o] of[[0,3,0],[1,1,12],[2,1,16]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,20,o);}
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,C.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.i,gl.STATIC_DRAW);gl.bindVertexArray(null);}
// chunks marked by world.js when their voxels change
function rebuildDirty(){for(const k of DIRTY){if(k<0||k>=NCX*NCY)continue;uploadChunk(k,buildChunk(k%NCX,(k/NCX)|0));}DIRTY.clear();}

// ---- Sprite atlases. Features and token stacks change rarely, so their pictures are kept (ATL); characters, rats, dice
// and markers are drawn fresh each frame (DYN).
const ATL={w:1024,h:1024,map:new Map(),sx:0,sy:0,sh:0,dirty:true},DYN={w:512,h:512,sx:0,sy:0,sh:0,dirty:true},SB={},DB={};
for(const A of[ATL,DYN]){A.cv=document.createElement('canvas');A.cv.width=A.w;A.cv.height=A.h;A.g=A.cv.getContext('2d');}
function cell(A,w,h){if(A.sx+w>A.w){A.sx=0;A.sy+=A.sh;A.sh=0;}if(A.sy+h>A.h)return null;const r={x:A.sx,y:A.sy};A.sx+=w+1;A.sh=Math.max(A.sh,h+1);return r;}
function resetAtlas(A){A.g.clearRect(0,0,A.w,A.h);A.sx=A.sy=A.sh=0;if(A.map)A.map.clear();A.dirty=true;}
// draw a picture into an atlas: fn draws with its anchor (the point that stands on the ground) at ax,ay
function paint(A,w,h,ax,ay,fn){let r=cell(A,w,h);if(!r){if(A===ATL){resetAtlas(A);r=cell(A,w,h);}else return null;}
 ctx=A.g;ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,w,h);ctx.clip();SHQ=[];fn(r.x+ax,r.y+ay);
 const sq=SHQ.map(q=>[q[0]-r.x-ax,q[1]-r.y-ay,q[2]]);SHQ=null;ctx.restore();A.dirty=true;return{x:r.x,y:r.y,w,h,ax,ay,sh:sq};}
function stat(key,w,h,ax,ay,fn){let e=ATL.map.get(key);if(!e){e=paint(ATL,w,h,ax,ay,fn);ATL.map.set(key,e);}return e;}
// one upright picture standing at world point (x,y,z); off shifts it sideways in pixels
function quad(out,e,x,y,z,off,offy){const x0=-e.ax+(off||0),y0=-e.ay+(offy||0),x1=x0+e.w,y1=y0+e.h;
 for(const [ox,oy,u,v] of[[x0,y0,e.x,e.y],[x1,y0,e.x+e.w,e.y],[x0,y1,e.x,e.y+e.h],[x1,y0,e.x+e.w,e.y],[x1,y1,e.x+e.w,e.y+e.h],[x0,y1,e.x,e.y+e.h]])
  out.push(x,y,z,ox,oy,u,v,-oy);
 if(e.sh&&SHL)for(const q of e.sh){const r=Math.round(q[2]),se=stat('sh'+HH()+'|'+r,r*2+3,r*2+3,r+1,r+1,(ax,ay)=>{SHQ=null;shadow(ax,ay,r);SHQ=[];});
  quad(SHL,se,x,y,z,(off||0)+Math.round(q[0]),Math.round(q[1]));}}
let SHL=null; // where shadow quads go while a frame is gathered
// a flat marker on a tile: outline, or fill when a is negative
function decal(out,x,y,z,r,g,b,a){const zz=z+.04;for(const [u,v] of[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])out.push(x+u,y+v,zz,r,g,b,a,u,v);}

// ---- Drawing a frame
let dirty=false; // true while a frame is already asked for
function redraw(){if(dirty)return;dirty=true;requestAnimationFrame(draw);}
function fit(){redraw();}
const FSH={crop:8,trap:7,tree:5,moss:6,tuber:5,reed:6,scrap:9,vein:9,glass:7,cache:8,nest:10,cage:8,hearth:10,bench:11,brazier:5};
function ratSpr(o,ex,ey){const f=facing(o).f;shadow(ex,ey,7);rc(ex-5,ey-5,9,5,'#6a5548');rc(f>0?ex+3:ex-7,ey-7,4,4,'#6a5548');rc(f>0?ex+5:ex-6,ey-6,1,1,'#f04040');rc(f>0?ex-8:ex+5,ey-2,3,1,'#9a8070');if(wounds(o))rc(ex-2,ey-4,2,2,'#d02020');}
const tkey=t=>t.card?'c'+t.card:t.corpse?'x':(t.it||'')+t.m+(t.flawed?'f':'');
const seenAt=(x,y)=>x<PW||G.rev[I(x,y)];
let PAL=null;
const SHIFT=[0,0];
// CSS pixels per game pixel, as actually drawn
const pxs=()=>Math.max(1,Math.round(cam.s*(window.devicePixelRatio||1)))/(window.devicePixelRatio||1);
// frames drawn in the last second and their average cost, for the counter on screen
const FPS={n:0,ms:0};
function draw(){const t0_=performance.now();try{draw_();}finally{FPS.n++;FPS.ms+=performance.now()-t0_;}}
function draw_(){
 dirty=false;if(!G)return;
 if(!gl){const g=cv.getContext&&null;return;}
 if(!TP)glInit();
 // Pixel perfect: one game pixel covers a whole number (k) of physical screen pixels, and the canvas is sized so the
 // browser scales it by exactly k.
 const r=cv.parentElement.getBoundingClientRect(),dpr=window.devicePixelRatio||1,k=Math.max(1,Math.round(cam.s*dpr));
 const vw=Math.max(1,Math.ceil(r.width*dpr/k)),vh=Math.max(1,Math.ceil(r.height*dpr/k));
 if(cv.width!==vw||cv.height!==vh){cv.width=vw;cv.height=vh;}
 const cssW=vw*k/dpr+'px',cssH=vh*k/dpr+'px';if(cv.style.width!==cssW){cv.style.width=cssW;cv.style.height=cssH;}
 // and the world is shifted by under a pixel so its grid lands on whole pixels wherever the camera stops
 {const K0=camK(),o=proj(K0,0,0,0);SHIFT[0]=Math.round(o[0]+vw/2)-(o[0]+vw/2);SHIFT[1]=Math.round(o[1]+vh/2)-(o[1]+vh/2);}
 rebuildDirty();
 if(!PAL){PAL=new Float32Array(72);for(let m=1;m<M.length&&m<24;m++){const c=rgbOf(m);PAL[m*3]=c[0]/255;PAL[m*3+1]=c[1]/255;PAL[m*3+2]=c[2]/255;}}
 // which ground has been seen: the plot always, the zone where a party has looked
 const rev=new Uint8Array(W*H);for(let i=0;i<W*H;i++)rev[i]=(i%W)<PW||G.rev[i]?255:0;
 gl.bindTexture(gl.TEXTURE_2D,revTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,W,H,0,gl.RED,gl.UNSIGNED_BYTE,rev);
 const K=camK(),t=tod(),night=t>=180?.42:t>=160?(t-160)/20*.42:t<10?(10-t)/10*.42:0;
 const common=P=>{gl.useProgram(P.p);gl.uniform3f(P.u.uF,cam.fx,cam.fy,cam.fz);gl.uniform4f(P.u.uK,K.cs,K.sn,K.hh,K.k1);gl.uniform1f(P.u.uK2,K.k2);
  gl.uniform2f(P.u.uVP,vw,vh);gl.uniform2f(P.u.uSh,SHIFT[0],SHIFT[1]);gl.uniform3f(P.u.uFog,38/255,42/255,54/255);gl.uniform1f(P.u.uNight,night);gl.uniform1f(P.u.uHH,K.hh);};
 gl.viewport(0,0,vw,vh);gl.clearColor(11/255,11/255,16/255,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
 // terrain
 common(TP);gl.uniform3fv(TP.u.uPal,PAL);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,revTex);gl.uniform1i(TP.u.uRev,0);
 for(const C of CHUNKS)if(C.n){gl.bindVertexArray(C.vao);gl.drawElements(gl.TRIANGLES,C.n,gl.UNSIGNED_INT,0);}
 // gather sprites and markers
 const st=[],dy=[],ov=[],gh=[],dc=[],shd=[];resetAtlas(DYN);SHL=shd;
 const al=G.speed>0&&G._tickAt?Math.min(1,(performance.now()-G._tickAt)*G.speed/1000):1;
 const top=(x,y)=>G.hgt[I(x,y)];
 for(const k in G.stock){const p=k.split(','),x=+p[0],y=+p[1];decal(dc,x,y,top(x,y),.94,.75,.25,.55);}
 for(const k in G.digs){const p=tparse(k),x=p[0],y=p[1],z=p[2];
  if(z===top(x,y)-1)decal(dc,x,y,top(x,y),.86,.24,.24,-.45);
  else{const e=paint(DYN,7,7,3,3,(ax,ay)=>{rc(ax-3,ay-3,7,7,'#5a1010');rc(ax-2,ay-2,5,5,'#e04040');rc(ax-1,ay-1,3,3,'#f0a0a0');});if(e)quad(ov,e,x+.5,y+.5,z+.5);}} // a voxel inside rock: a marker drawn over everything
 for(const q of G.sites){decal(dc,q.x,q.y,top(q.x,q.y),.47,.78,1,.85);
  const e=paint(DYN,q.need*5+2,6,1,1,(ax,ay)=>{for(let n=0;n<q.need;n++)rc(ax+n*5,ay,4,4,n<q.have?'#7fd0ff':'#234');});if(e)quad(dy,e,q.x+.5,q.y+.5,top(q.x,q.y),-(q.need*5)/2+1);}
 for(const k in G.fields||{}){const p=k.split(','),x=+p[0],y=+p[1];decal(dc,x,y,top(x,y),.45,.62,.3,.6);}
 for(const f of G.feats){if(!(f.left>0||f.k==='hearth'||f.k==='bench'||f.k==='brazier'||f.k==='crop')||!seenAt(f.x,f.y))continue;
  const key='f'+HH()+f.k+(f.m||'')+(f.k==='hearth'&&f.fuel>0?'l':'')+(f.k==='crop'&&f.left>0?'r':'');
  const e=stat(key,40,46,20,38,(ax,ay)=>{shadow(ax,ay+1,FSH[f.k]||6);featSpr(f,ax,ay);});quad(st,e,f.x+.5,f.y+.5,f.z!=null?f.z:top(f.x,f.y));}
 for(const k in G.tok){const p=tparse(k),x=p[0],y=p[1],z=p[2],a=G.tok[k];if(!a.length||!seenAt(x,y))continue;const ff=z===top(x,y)&&featAt(x,y)?4:0;
  const key='t'+HH()+ff+a.map(tkey).join(',');
  const e=stat(key,42,34,18,24,(ax,ay)=>{const nc=Math.min(3,a.length);shadow(ax-13+nc*4.5,ay+3+ff,3+nc*4);for(let n=0;n<a.length;n++)tokSpr(a[n],ax-13+(n%3)*9,ay-4-Math.floor(n/3)*8+ff);});
  quad(st,e,x+.5,y+.5,z);}
 if(!G.gateOpen&&!G.gateBroken&&G.gateZ!=null){const e=paint(DYN,18,26,9,24,(ax,ay)=>{rc(ax-8,ay-22,16,24,'#3a2c20');rc(ax-8,ay-12,16,2,'#aab3bd');});if(e)quad(dy,e,47.5,24.5,G.gateZ);}
 // moving things stand between the tile they left and the one they are entering
 const pos=o=>{if(o._mv===G.t&&al<1&&o._px!=null){const pz=o._pz!=null?o._pz:top(o._px,o._py),z=o.z!=null?o.z:top(o.x,o.y);
   return{x:o._px+.5+(o.x-o._px)*al,y:o._py+.5+(o.y-o._py)*al,z:pz+(z-pz)*al,a:proj(K,o._px+.5,o._py+.5,pz),b:proj(K,o.x+.5,o.y+.5,z),p:al};}
  return{x:o.x+.5,y:o.y+.5,z:o.z!=null?o.z:top(o.x,o.y)};};
 for(const e of G.crit){if(!seenAt(e.x,e.y))continue;const P=pos(e);
  if(e.raider){const s=paint(DYN,56,54,28,44,(ax,ay)=>{if(P.a){const dx=P.b[0]-P.a[0],dy_=P.b[1]-P.a[1],p=P.p;charSpr(e,0,0,{x0:ax-dx*p,y0:ay-dy_*p,x1:ax+dx*(1-p),y1:ay+dy_*(1-p),p});}else charSpr(e,ax,ay,null);});if(s)quad(dy,s,P.x,P.y,P.z);continue;}
  const s=paint(DYN,24,16,12,11,(ax,ay)=>{let ex=ax,ey=ay;if(P.a)ey-=(P.p*4%2<1?1:0);ratSpr(e,ex,ey);});if(s)quad(dy,s,P.x,P.y,P.z);}
 const groups={};for(const c of G.cols)if(c.by==null)(groups[K_(c.x,c.y)]=groups[K_(c.x,c.y)]||[]).push(c);
 for(const c of G.cols){if(c.by!=null)continue;const g=groups[K_(c.x,c.y)],n=g.indexOf(c),off=n*5-(g.length-1)*2,P=pos(c);
  const s=paint(DYN,56,54,28,44,(ax,ay)=>{if(P.a){const dx=P.b[0]-P.a[0],dy_=P.b[1]-P.a[1],p=P.p;charSpr(c,0,0,{x0:ax-dx*p,y0:ay-dy_*p,x1:ax+dx*(1-p),y1:ay+dy_*(1-p),p});}else charSpr(c,ax,ay,null);});
  if(s){quad(dy,s,P.x,P.y,P.z,off);const keep=SHL;SHL=null;quad(gh,s,P.x,P.y,P.z,off);SHL=keep;}}
 for(const q of G.pops||[]){if(!seenAt(q.x,q.y))continue;const w=Math.min(90,6+q.t.length*5),e=paint(DYN,w,10,0,0,(ax,ay)=>{ctx.font="8px 'Tiny5',monospace";ctx.textBaseline='top';ctx.fillStyle='#000';ctx.fillText(q.t,ax+1,ay+2);ctx.fillStyle=q.c;ctx.fillText(q.t,ax,ay+1);});
  if(e){e.ay=30+(4-q.ttl)*5;quad(ov,e,q.x+.5,q.y+.5,q.z,-w/2);}}
 for(const f of G.fx){const w=f.dice.length*8,e=paint(DYN,w,8,0,0,(ax,ay)=>{for(let n=0;n<f.dice.length;n++)dieSpr(ax+n*8,ay,f.dice[n],f.dice[n]>=f.tgt);});
  if(e){e.ay=44;quad(ov,e,f.x+.5,f.y+.5,top(f.x,f.y),-w/2);}}
 // markers on the ground
 if(dc.length){common(DP);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  gl.bindVertexArray(DB.vao);gl.bindBuffer(gl.ARRAY_BUFFER,DB.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dc),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,dc.length/9);
  gl.depthMask(true);gl.disable(gl.BLEND);}
 // sprites
 common(SP);gl.uniform1i(SP.u.uT,0);gl.activeTexture(gl.TEXTURE0);
 SHL=null;
 const sprites=(A,arr,ghost,bias,mode)=>{if(!arr.length)return;gl.bindTexture(gl.TEXTURE_2D,A.tex);gl.uniform1i(SP.u.uMode,mode||0);
  if(A.dirty){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,A.cv);A.dirty=false;}
  gl.uniform2f(SP.u.uTS,A.w,A.h);gl.uniform1f(SP.u.uGhost,ghost);gl.uniform1f(SP.u.uBias,bias);
  gl.bindVertexArray(SB.vao);gl.bindBuffer(gl.ARRAY_BUFFER,SB.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,arr.length/8);};
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);sprites(ATL,shd,0,.3,2);gl.depthMask(true);gl.disable(gl.BLEND);
 sprites(ATL,st,0,.3);sprites(DYN,dy,0,.3);
 // colonists hidden behind rock show through it as a pale outline, so they are never lost
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthFunc(gl.GREATER);gl.depthMask(false);sprites(DYN,gh,.35,.3,1);
 gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);
 gl.disable(gl.DEPTH_TEST);sprites(DYN,ov,0,0);gl.enable(gl.DEPTH_TEST);
 gl.bindVertexArray(null);
}
const K_=(x,y)=>x+','+y;
// what is under a point on the screen: a colonist if one is drawn there, else the first rock along the line of sight
function pick(px,py){
 const K=camK(),gx=px/pxs()-cv.width/2-SHIFT[0],gy=py/pxs()-cv.height/2-SHIFT[1];
 let bc=null,bd=1e9;for(const c of G.cols){if(c.by!=null)continue;const p=proj(K,c.x+.5,c.y+.5,c.z!=null?c.z:G.hgt[I(c.x,c.y)]);
  if(gx>p[0]-8&&gx<p[0]+8&&gy>p[1]-34&&gy<p[1]+3&&-p[2]<bd){bd=-p[2];bc=c;}}
 if(bc)return{x:bc.x,y:bc.y};
 const b=gx/16;for(let dz=Z+2-cam.fz;dz>-1-cam.fz;dz-=1/32){const a=(gy+dz*16)/K.hh,rx=(a+b)/2,ry=(a-b)/2;
  const x=cam.fx+rx*K.cs+ry*K.sn,y=cam.fy-rx*K.sn+ry*K.cs,z=cam.fz+dz,i=Math.floor(x),j=Math.floor(y),k=Math.floor(z);
  if(i<0||j<0||i>=W||j>=H||k<0||k>=Z)continue;if(!seenAt(i,j))continue;if(G.vox[(k*H+j)*W+i])return{x:i,y:j,z:k};}
 return null;
}
