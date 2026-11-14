'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const cam={x:0,y:(24+24)*8-40,s:2,yaw:0,tilt:0};
const HH=()=>cam.tilt?14:8; // half height of a ground diamond: 8 is the 2:1 view, 14 the raised one [slop]
function toV(x,y){switch(cam.yaw){case 1:return[H-1-y,x];case 2:return[W-1-x,H-1-y];case 3:return[y,W-1-x];}return[x,y];}
function toW(vx,vy){switch(cam.yaw){case 1:return[vy,H-1-vx];case 2:return[W-1-vx,H-1-vy];case 3:return[W-1-vy,vx];}return[vx,vy];}
function setView(yaw,tilt){const hh=HH(),w=toW((cam.x/16+cam.y/hh)/2,(cam.y/hh-cam.x/16)/2);
 cam.yaw=(yaw+4)%4;cam.tilt=tilt;const v=toV(w[0],w[1]);cam.x=(v[0]-v[1])*16;cam.y=(v[0]+v[1])*HH();redraw();}
function lookAt(x,y){const v=toV(x,y);cam.x=(v[0]-v[1])*16;cam.y=(v[0]+v[1])*HH()-G.hgt[I(x,y)]*16;redraw();}
const SPR={8:[],14:[]};
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
 return'rgb('+c(n>>16)+','+c(n>>8&255)+','+c(n&255)+')';}
function mkBlock(m,hh){const c=document.createElement('canvas');c.width=32;c.height=hh*2+17;const g=c.getContext('2d'),col=M[m].c;
 for(let py=0;py<hh*2+17;py++)for(let px=0;px<32;px++){
  let f=0;const mx=px<16?px:31-px,y0=hh+Math.floor(mx*hh/16);
  if(Math.abs(px-15.5)/16+Math.abs(py-(hh-.5))/hh<=1)f=1.12;else if(py>=y0&&py<y0+17)f=px<16?.8:.58;
  if(!f)continue;if(m!==18&&hash2(px,py,m)<.14)f*=.88;
  g.fillStyle=shade(col,f);g.fillRect(px,py,1,1);}
 return c;}
for(const hh of[8,14])for(let m=1;m<M.length;m++)SPR[hh][m]=mkBlock(m,hh);
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
 if(t.card){rc(x,y-2,5,7,'#e8e0c8');rc(x+1,y,3,3,'#a03030');return;}
 if(t.corpse){rc(x-2,y+2,10,3,'#d8d0b8');rc(x+7,y+1,3,3,'#c9a183');return;}
 const c=M[t.m].c;
 if(t.it){rc(x,y,6,6,'#1c1c22');rc(x+1,y+1,4,4,c);rc(x+2,y+2,2,2,'#f4f0e0');return;}
 rc(x,y,6,6,shade(c,.55));rc(x,y,6,4,c);rc(x,y,6,1,shade(c,1.3));
}
function held(it,x,b){if(!it)return;const c=M[it.m].c,w='#6a4c30';
 switch(it.it){
 case'pick':rc(x,b-22,1,12,w);rc(x-2,b-23,5,2,c);break;
 case'axe':rc(x,b-22,1,12,w);rc(x,b-23,3,4,c);break;
 case'knife':rc(x,b-17,1,5,c);break;
 case'club':rc(x,b-22,2,10,c);rc(x-1,b-23,4,4,c);break;
 case'blade':rc(x,b-25,1,12,c);rc(x-1,b-14,3,1,w);break;
 case'shield':rc(x-2,b-20,5,8,c);rc(x-1,b-17,3,2,shade(c,1.4));break;}
}
function facing(c){const d=[[1,0],[0,1],[-1,0],[0,-1]][c.face||0];let vx=d[0],vy=d[1];
 if(cam.yaw===1){vx=-d[1];vy=d[0];}else if(cam.yaw===2){vx=-d[0];vy=-d[1];}else if(cam.yaw===3){vx=d[1];vy=-d[0];}
 return{f:vx>0||vy<0?1:-1,back:vx<0||vy<0};}
function leg(hx,hy,fx,fy,col,fc){for(let i=0;i<8;i++){const t=i/7;rc(Math.round(hx+(fx-hx)*t)-1,Math.round(hy+(fy-2-hy)*t),3,1,col);}rc(Math.round(fx)-1,Math.round(fy)-2,3,2,fc);}
// mv: null when standing, else {x0,y0,x1,y1,p}: screen anchors of the tile left and the tile entered, and progress 0..1
function charSpr(c,ax,ay,mv){
 const skin='#c9a183',rag='#5e574c',hair='#2a2420',mc=it=>it?M[it.m].c:null,w=c.worn;
 if(c.down||c.asleep){const b=ay+2;
  if(c.id===G.sel){ctx.strokeStyle='#f0c040';ctx.beginPath();ctx.ellipse(ax,ay+1,11,4,0,0,7);ctx.stroke();}
  rc(ax-9,b-5,14,5,mc(w[1])||rag);rc(ax-9,b-5,5,5,mc(w[2])||rag);rc(ax+5,b-6,5,5,skin);if(w[0])rc(ax+8,b-7,3,6,mc(w[0]));
  if(c.down){rc(ax-2,b-4,3,2,'#c02020');}else{rc(ax+9,b-12,3,1,'#ccd');rc(ax+10,b-11,1,1,'#ccd');rc(ax+9,b-10,3,1,'#ccd');}return;}
 // feet: two half-steps per tile. The stance foot stays where it was put down; the other swings past it.
 let fl,fr;
 if(mv){const p=mv.p,k=p<.5?0:1,q=(p-k/2)*2,at=t=>[mv.x0+(mv.x1-mv.x0)*t,mv.y0+(mv.y1-mv.y0)*t+2];
  const st=at(k/2+.25),sw=at(k/2-.25+q);sw[1]-=3*Math.sin(Math.PI*q);
  fl=k?sw:st;fr=k?st:sw;ax=Math.round(mv.x0+(mv.x1-mv.x0)*p);ay=Math.round(mv.y0+(mv.y1-mv.y0)*p-Math.abs(Math.sin(2*Math.PI*p)));
 }else{fl=[ax-2,ay+2];fr=[ax+3,ay+2];}
 const b=ay+2,F=facing(c),X=(x,ww)=>F.f>0?ax+x:ax-x-ww,r=(x,y,ww,h,col)=>rc(X(x,ww),y,ww,h,col);
 if(c.id===G.sel){ctx.strokeStyle='#f0c040';ctx.beginPath();ctx.ellipse(ax,ay+1,9,4,0,0,7);ctx.stroke();}
 const m=w[5],tc=mc(w[1])||rag,lc=mc(w[2])||rag,fc=mc(w[3])||skin,hc=mc(w[4])||skin;
 const legs=()=>{leg(ax-2,b-10,fl[0],fl[1],shade(lc,.85),fc);leg(ax+2,b-10,fr[0],fr[1],lc,fc);};
 const cap=()=>{if(w[0])r(-4,b-31,8,3,mc(w[0]));};
 // arms swing against the leg on the same side
 const swL=mv?Math.round(-(fl[0]-(ax-2))*.5):0,swR=mv?Math.round(-(fr[0]-(ax+2))*.5):0,sw=x=>X(x,2)<ax?swL:swR;
 const arm=(x,col)=>{const s=sw(x),x0=X(x,2);for(let i=0;i<8;i++)rc(x0+Math.round(s*i/7),b-21+i,2,1,col);rc(x0+s,b-13,2,2,hc);};
 if(!F.back){ // facing the viewer; +x is the side the character faces
  if(m&&m.it==='cloak')r(-7,b-23,11,17,shade(M[m.m].c,.7));
  if(m&&m.it==='pack'){r(-9,b-22,5,10,M[m.m].c);r(-9,b-22,5,1,shade(M[m.m].c,1.3));}
  held(c.hands[1],X(-7,1)+sw(-6),b);arm(-6,shade(tc,.7));
  legs();
  r(-4,b-22,8,12,tc);r(-4,b-22,2,12,shade(tc,.85));
  r(-3,b-29,6,7,skin);r(-3,b-30,6,2,hair);r(-3,b-29,1,5,hair);r(0,b-26,1,1,'#221');r(2,b-26,1,1,'#221');cap();
  if(c.scars.length)r(1,b-28,1,4,'#802020');
  arm(3,shade(tc,.9));held(c.hands[0],X(5,1)+sw(3),b);
 }else{ // seen from behind
  held(c.hands[0],X(5,1)+sw(3),b);arm(3,shade(tc,.7));
  legs();
  r(-4,b-22,8,12,shade(tc,.9));
  r(-3,b-29,6,7,skin);r(-3,b-30,5,7,hair);r(-3,b-30,6,3,hair);cap();
  if(m&&m.it==='cloak')r(-5,b-23,10,17,shade(M[m.m].c,.8));
  if(m&&m.it==='pack'){r(-4,b-22,7,10,M[m.m].c);r(-4,b-22,7,1,shade(M[m.m].c,1.3));r(-1,b-18,1,4,shade(M[m.m].c,.6));}
  arm(-6,shade(tc,.8));held(c.hands[1],X(-7,1)+sw(-6),b);
 }
 const wp=[[0,-27],[0,-17],[-3,-7],[-3,-1],[-6,-13],[-5,-21]];
 for(let i=0;i<6;i++)if(c.wd[i])r(wp[i][0],b+wp[i][1],2,2,'#d02020');
 for(let i=0;i<c.carry.length;i++)tokSpr(c.carry[i],X(-13-(i>2?6:0),6),b-16-(i%3)*6);
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
 for(const f of G.feats)if(f.left>0||f.k==='hearth'||f.k==='bench')put(fm,f);
 const al=G.speed>0&&G._tickAt?Math.min(1,(performance.now()-G._tickAt)*G.speed/1000):1,hh0=HH();
 const anc=(x,y)=>{const v=toV(x,y);return[(v[0]-v[1])*16,(v[0]+v[1])*hh0-G.hgt[I(x,y)]*16+hh0];};
 const mover=o=>{if(o._mv!==G.t||al>=1)return null;const a=anc(o._px,o._py),b=anc(o.x,o.y);return{x0:a[0],y0:a[1],x1:b[0],y1:b[1],p:al};};
 const putM=(m,o)=>{let x=o.x,y=o.y;if(o._mv===G.t&&al<1){const a=toV(o._px,o._py),b=toV(x,y);if(a[0]+a[1]>b[0]+b[1]){x=o._px;y=o._py;}}
  const i=I(x,y);if(m.has(i))m.get(i).push(o);else m.set(i,[o]);};
 for(const c of G.cols)if(c.by==null)putM(cm,c);for(const e of G.crit)putM(em,e);for(const q of G.sites)put(sm,q);for(const f of G.fx)put(xm,f);
 const hh=HH(),VW=cam.yaw&1?H:W,VH=cam.yaw&1?W:H,S=SPR[hh];
 for(let dg=0;dg<VW+VH-1;dg++)for(let vx=Math.max(0,dg-VH+1);vx<=Math.min(VW-1,dg);vx++){
  const vy=dg-vx,sx=(vx-vy)*16,sy=dg*hh;if(sx<vx0||sx>vx1||sy<vy0||sy>vy1)continue;
  const wp_=toW(vx,vy),x=wp_[0],y=wp_[1],i=I(x,y),h=G.hgt[i],fog=x>=PW&&!G.rev[i];
  let hE=0,hS=0;if(vx+1<VW){const n=toW(vx+1,vy);hE=G.hgt[I(n[0],n[1])];}if(vy+1<VH){const n=toW(vx,vy+1);hS=G.hgt[I(n[0],n[1])];}
  const z0=Math.max(0,Math.min(h-1,hE,hS));
  for(let z=z0;z<h;z++)ctx.drawImage(S[fog?18:G.vox[VI(x,y,z)]],sx-16,sy-(z+1)*16);
  if(fog)continue;
  const ty=sy-h*16,ay=ty+hh,k=K(x,y);
  if(G.stock[k])diamond(sx,ty,'rgba(240,192,64,.5)');
  if(G.digs[k])diamond(sx,ty,'rgba(220,60,60,.45)',1);
  if(x===47&&y===24&&!G.gateOpen){rc(sx-8,ay-22,16,24,'#3a2c20');rc(sx-8,ay-12,16,2,'#aab3bd');}
  const ss=sm.get(i);if(ss)for(const q of ss){diamond(sx,ty,'rgba(120,200,255,.8)');for(let n=0;n<q.need;n++)rc(sx-6+n*5,ay-2,4,4,n<q.have?'#7fd0ff':'#234');}
  const ff=fm.get(i);if(ff)for(const f of ff)featSpr(f,sx,ay);
  const tk=G.tok[k];if(tk)for(let n=0;n<tk.length;n++)tokSpr(tk[n],sx-10+(n%3)*7,ay-1-Math.floor(n/3)*7+(ff?4:0));
  const ee=em.get(i);if(ee)for(const e of ee){const mv=mover(e),ex=mv?Math.round(mv.x0+(mv.x1-mv.x0)*mv.p):anc(e.x,e.y)[0],ey=mv?Math.round(mv.y0+(mv.y1-mv.y0)*mv.p-(mv.p*4%2<1?1:0)):anc(e.x,e.y)[1],f=facing(e).f;
   rc(ex-5,ey-5,9,5,'#6a5548');rc(f>0?ex+3:ex-7,ey-7,4,4,'#6a5548');rc(f>0?ex+5:ex-6,ey-6,1,1,'#f04040');rc(f>0?ex-8:ex+5,ey-2,3,1,'#9a8070');if(wounds(e))rc(ex-2,ey-4,2,2,'#d02020');}
  const cc=cm.get(i);if(cc)for(let n=0;n<cc.length;n++){const c=cc[n],mv=mover(c),o=n*5-(cc.length-1)*2;if(mv){mv.x0+=o;mv.x1+=o;charSpr(c,0,0,mv);}else{const a=anc(c.x,c.y);charSpr(c,a[0]+o,a[1],null);}}
  const xx=xm.get(i);if(xx){let row=0;for(const f of xx){const w=f.dice.length*8;for(let n=0;n<f.dice.length;n++)dieSpr(sx-w/2+n*8,ay-44-row*9,f.dice[n],f.dice[n]>=f.tgt);row++;}}
 }
 ctx.setTransform(1,0,0,1,0,0);
 const t=tod(),a=t>=180?.42:t>=160?(t-160)/20*.42:t<10?(10-t)/10*.42:0;if(a)rc(0,0,cw,ch,'rgba(8,10,44,'+a+')');
}
function pick(px,py){
 const d=cv._d||1,s=cam.s*d,wx=(px*d-cv.width/2)/s+cam.x,wy=(py*d-cv.height/2)/s+cam.y;
 const hh=HH(),VW=cam.yaw&1?H:W,VH=cam.yaw&1?W:H;
 for(let dg=VW+VH-2;dg>=0;dg--)for(let vx=Math.max(0,dg-VH+1);vx<=Math.min(VW-1,dg);vx++){
  const w=toW(vx,dg-vx),sx=(vx-(dg-vx))*16,cy=dg*hh-G.hgt[I(w[0],w[1])]*16+hh;
  if(Math.abs(wx-sx)/16+Math.abs(wy-cy)/hh<=1)return{x:w[0],y:w[1]};}
 return null;
}
