'use strict';
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const cam={x:0,y:(24+24)*8-40,s:2};
const SPR=[];
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*f)));
 return'rgb('+c(n>>16)+','+c(n>>8&255)+','+c(n&255)+')';}
function mkBlock(m){const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d'),col=M[m].c;
 for(let py=0;py<32;py++)for(let px=0;px<32;px++){
  let f=0;const mx=px<16?px:31-px,y0=8+(mx>>1);
  if(Math.abs(px-15.5)/16+Math.abs(py-7.5)/8<=1)f=1.12;else if(py>=y0&&py<y0+16)f=px<16?.8:.58;
  if(!f)continue;if(m!==18&&hash2(px,py,m)<.14)f*=.88;
  g.fillStyle=shade(col,f);g.fillRect(px,py,1,1);}
 return c;}
for(let m=1;m<M.length;m++)SPR[m]=mkBlock(m);
let dirty=true;
function redraw(){if(dirty)return;dirty=true;requestAnimationFrame(draw);}
function fit(){const r=cv.parentElement.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);
 cv.width=Math.max(1,Math.floor(r.width*d));cv.height=Math.max(1,Math.floor(r.height*d));cv._d=d;dirty=false;redraw();}
const rc=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
function diamond(sx,ty,c,fill){ctx.beginPath();ctx.moveTo(sx,ty+1);ctx.lineTo(sx+15,ty+8);ctx.lineTo(sx,ty+15);ctx.lineTo(sx-15,ty+8);ctx.closePath();
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
function charSpr(c,ax,ay){
 const skin='#c9a183',rag='#5e574c',mc=it=>it?M[it.m].c:null,b=ay+2,w=c.worn;
 if(c.id===G.sel){ctx.strokeStyle='#f0c040';ctx.beginPath();ctx.ellipse(ax,ay+1,9,4,0,0,7);ctx.stroke();}
 if(c.down||c.asleep){rc(ax-9,b-5,14,5,mc(w[1])||rag);rc(ax-9,b-5,5,5,mc(w[2])||rag);rc(ax+5,b-6,5,5,skin);if(w[0])rc(ax+8,b-7,3,6,mc(w[0]));
  if(c.down){rc(ax-2,b-4,3,2,'#c02020');}else{rc(ax+9,b-12,3,1,'#ccd');rc(ax+10,b-11,1,1,'#ccd');rc(ax+9,b-10,3,1,'#ccd');}return;}
 const m=w[5];
 if(m&&m.it==='cloak')rc(ax-6,b-23,12,17,shade(M[m.m].c,.7));
 if(m&&m.it==='pack'){rc(ax-9,b-22,4,10,M[m.m].c);rc(ax-9,b-22,4,1,shade(M[m.m].c,1.3));}
 rc(ax-4,b-10,3,8,mc(w[2])||rag);rc(ax+1,b-10,3,8,mc(w[2])||rag);
 rc(ax-4,b-2,3,2,mc(w[3])||skin);rc(ax+1,b-2,3,2,mc(w[3])||skin);
 const tc=mc(w[1])||rag;rc(ax-4,b-22,8,12,tc);rc(ax-6,b-21,2,8,shade(tc,.8));rc(ax+4,b-21,2,8,shade(tc,.8));
 rc(ax-6,b-13,2,2,mc(w[4])||skin);rc(ax+4,b-13,2,2,mc(w[4])||skin);
 rc(ax-3,b-29,6,7,skin);rc(ax-2,b-26,1,1,'#221');rc(ax+1,b-26,1,1,'#221');
 if(w[0])rc(ax-4,b-31,8,3,mc(w[0]));else rc(ax-3,b-30,6,2,'#2a2420');
 if(c.scars.length)rc(ax+2,b-28,1,4,'#802020');
 const wp=[[0,-27],[0,-17],[-3,-7],[-3,-1],[-6,-13],[-5,-21]];
 for(let i=0;i<6;i++)if(c.wd[i])rc(ax+wp[i][0],b+wp[i][1],2,2,'#d02020');
 held(c.hands[0],ax+6,b);held(c.hands[1],ax-7,b);
 for(let i=0;i<c.carry.length;i++)tokSpr(c.carry[i],ax-13+(i>2?-6:0),b-16-(i%3)*6);
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
 for(const c of G.cols)if(c.by==null)put(cm,c);for(const e of G.crit)put(em,e);for(const q of G.sites)put(sm,q);for(const f of G.fx)put(xm,f);
 for(let dg=0;dg<W+H-1;dg++)for(let x=Math.max(0,dg-H+1);x<=Math.min(W-1,dg);x++){
  const y=dg-x,sx=(x-y)*16,sy=(x+y)*8;if(sx<vx0||sx>vx1||sy<vy0||sy>vy1)continue;
  const i=I(x,y),h=G.hgt[i],fog=x>=PW&&!G.rev[i];
  const z0=Math.max(0,Math.min(h-1,x+1<W?G.hgt[i+1]:0,y+1<H?G.hgt[i+W]:0));
  for(let z=z0;z<h;z++)ctx.drawImage(SPR[fog?18:G.vox[VI(x,y,z)]],sx-16,sy-(z+1)*16);
  if(fog)continue;
  const ty=sy-h*16,ay=ty+8,k=K(x,y);
  if(G.stock[k])diamond(sx,ty,'rgba(240,192,64,.5)');
  if(G.digs[k])diamond(sx,ty,'rgba(220,60,60,.45)',1);
  if(x===47&&y===24&&!G.gateOpen){rc(sx-8,ay-22,16,24,'#3a2c20');rc(sx-8,ay-12,16,2,'#aab3bd');}
  const ss=sm.get(i);if(ss)for(const q of ss){diamond(sx,ty,'rgba(120,200,255,.8)');for(let n=0;n<q.need;n++)rc(sx-6+n*5,ay-2,4,4,n<q.have?'#7fd0ff':'#234');}
  const ff=fm.get(i);if(ff)for(const f of ff)featSpr(f,sx,ay);
  const tk=G.tok[k];if(tk)for(let n=0;n<tk.length;n++)tokSpr(tk[n],sx-10+(n%3)*7,ay-1-Math.floor(n/3)*7+(ff?4:0));
  const ee=em.get(i);if(ee)for(const e of ee){rc(sx-5,ay-5,9,5,'#6a5548');rc(sx+3,ay-7,4,4,'#6a5548');rc(sx+5,ay-6,1,1,'#f04040');rc(sx-8,ay-2,3,1,'#9a8070');if(wounds(e))rc(sx-2,ay-4,2,2,'#d02020');}
  const cc=cm.get(i);if(cc)for(let n=0;n<cc.length;n++)charSpr(cc[n],sx+n*5-(cc.length-1)*2,ay);
  const xx=xm.get(i);if(xx){let row=0;for(const f of xx){const w=f.dice.length*8;for(let n=0;n<f.dice.length;n++)dieSpr(sx-w/2+n*8,ay-44-row*9,f.dice[n],f.dice[n]>=f.tgt);row++;}}
 }
 ctx.setTransform(1,0,0,1,0,0);
 const t=tod(),a=t>=180?.42:t>=160?(t-160)/20*.42:t<10?(10-t)/10*.42:0;if(a)rc(0,0,cw,ch,'rgba(8,10,44,'+a+')');
}
function pick(px,py){
 const d=cv._d||1,s=cam.s*d,wx=(px*d-cv.width/2)/s+cam.x,wy=(py*d-cv.height/2)/s+cam.y;
 for(let dg=W+H-2;dg>=0;dg--)for(let x=Math.max(0,dg-H+1);x<=Math.min(W-1,dg);x++){
  const y=dg-x,sx=(x-y)*16,cy=(x+y)*8-G.hgt[I(x,y)]*16+8;
  if(Math.abs(wx-sx)/16+Math.abs(wy-cy)/8<=1)return{x,y};}
 return null;
}
