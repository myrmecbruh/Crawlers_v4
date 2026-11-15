'use strict';
// Procedural pixel art for tokens and items. Every item has one shape per material family it can be made of,
// and every material has its own texture. All of this art is [slop].
// Bitmap letters: M material (textured), h highlight, d shadow, w wooden haft, k dark, c cord, o pale.
const RES_ART={
 1:'..MMMM../.MhMMMM./MhMMMMMM/MMMMMMMd/MMMMMMdd/MMMMMddd/.MMdddd./........',
 2:'......../..MM..../.MhMM.M./.MMMdMhM/MM.dddMd/MhM.MMd./MMd.Mdd./.dd.....',
 3:'...h..../..hM..h./..MM.hM./.hMM.MM./.MMMhMM./.MMdMMd./MMMdMMd./.dd.dd..',
 4:'......../......../.MMMMMhh/MMMMMMhd/MMMMMMhd/dMMMMMdd/.dddddd./........',
 5:'......../MMMMMMMM/dddddddd/MMMMMMMM/dddddddd/MMMMMMMM/dddddddd/........',
 6:'......../.M..MM../MMM.MMM./MMMMMhMM/dMMhMMMd/.MMMMMd./..dMdd../........',
 7:'......../......../..hhhhh./.hMMMMMd/hMMMMMMd/MMMMMMMd/dddddddd/........',
 8:'......../......../hhhhhhhh/MMMoMMMM/MMMMMMMM/dddddddd/......../........',
 9:'.M.M.M../.M.M.M.M/.MhMhM.M/.cccccc./.MhMhMhM/.M.M.M.M/M..M.M.M/M..M..M.',
 10:'......../..MMMM../.Mh..MM./.M.MM.M./.M.Md.M./.MM..Md./..MMMd../........',
 11:'......../.MMMMMM./MhMMMMMd/MMMMMMkd/MhMMMkMd/MMMMMMkd/.dddddd./........',
 12:'......../..hhhh../.hMMMMd./hMMMMMMd/dddddddd/hMMMMMMd/.dMMMMd./..dddd..',
 13:'hM....../MMM...../.MMM..../..MMM.../...MMM../....MMMh/.....MMM/......Md',
 14:'......../..M..M../.MMhMMM./MMMMMhMM/MhMMMMMd/dMMdMMdd/.dd.dd../........',
 15:'...kk.../...k..../..MMMM../.MhMMMM./.MMMMMd./.MMMMdd./..Mddd../...d....',
 16:'......../.MMMM.../MMhMMM../MMMMMMo./MMMMMdoo/dMMMdd.o/.ddd..../........',
 17:'..kkkk../..MhhM../..MooM../..MooM../..MooM../..MhhM../..kkkk../........',
 19:'......../......../...MM.../..MhMM../.MMMMMd./MMMMMddd/......../........',
 20:'......../..o.o.../...o..../.MMMMMM./kMhMMMMk/kkkkkkkk/.kkkkkk./..kkkk..'
};
const ITEM_ART={
 pick:{metal:'.hMMMMd./h..w...d/...w..../...w..../...w..../...w..../...w..../...w....',
  stone:'.MMMMM../MMhcMMM./.MMcMd../...w..../...w..../...w..../...w..../...w....',
  bone:'h......./MM..M.../.MMMMMM./...wc.Md/...w..../...w..../...w..../...w....'},
 axe:{metal:'..hMM.../.hMMMw../hMMMMw../.dMMMw../..ddMw../.....w../.....w../.....w..',
  stone:'..MMM.../.MhMMcw./.MMMMcw./..dMMcw./......w./......w./......w./......w.'},
 knife:{metal:'......h./.....hM./....hMd./...hMd../..hMd.../..kk..../.ww...../ww......',
  stone:'....hM../...hMMM./...MMMd./...MMd../..cMd.../..cc..../.ww...../ww......',
  bone:'.....hM./......MM/......Md/.....MMd/....MMd./..cMMd../.ww...../ww......'},
 club:{wood:'....MMM./...MhMMM/...MMMMd/....MMd./...MMd../..MMd.../.MMd..../MMd.....',
  bone:'....hM.M/....MMMM/.....MMd/....MMd./...MMd../.MMMd.../MMMM..../M.Md....'},
 blade:{metal:'.......h/......hM/.....hMd/....hMd./...hMd../.k.Md.../..kk..../.w..k...'},
 shield:{wood:'.MMMMMM./MhMMMMMd/MMMkkMMd/MMkhhkMd/MMkhhkMd/MMMkkMMd/MMMMMMdd/.dddddd.'},
 cap:{hide:'......../..MMMM../.MhMMMM./MhMMMMMd/MMM..MMd/MM....Md/MM....Md/........',
  metal:'......../..hhhh../.hMMMMd./hMMMMMMd/MMMMMMMd/dd.MM.dd/...Md.../........',
  fiber:'......../......../.MhMhMh./MhMhMhMd/hMhMhMhd/.dMdMdM./......M./......d.'},
 jerkin:{hide:'MM.kk.MM/MMMkkMMM/hMMMMMMd/.MMkMMd./.MMMkMd./.MMkMMd./.MMMMMd./.dddddd.',
  fiber:'MM....MM/MMM..MMM/hMMMMMMd/.MMMMMd./.cccccc./.MMMMMd./.MMMMMd./.dddddd.',
  metal:'hh....hh/hMMhhMMd/hMMMMMMd/.dddddd./.hMMMMd./.dddddd./.hMMMMd./.dddddd.'},
 leggings:{hide:'MMMMMMMM/MhMMMMMd/MMM..MMd/MMk..MMd/MM...kMd/MMk..MMd/MM...MMd/dd...ddd',
  fiber:'cccccccc/MhMMMMMd/MMM..MMd/MM...MMd/MM...MMd/MM...MMd/cc...ccc/MM...MMd'},
 boots:{hide:'......../.MM..MM./.MM..MM./.Mh..Mh./.MM..MM./.MMM.MMM/.MMMdMMM/.kkkkkkk'},
 gloves:{hide:'......../.M.M.M../.M.M.M.M/.MhMhM.M/.MMMMMMM/.MMMMMMd/..MMMMd./..kkkk..',
  fiber:'......../..MMMM../.MhMMMM./.cccccc./.MMMMMM./.cccccc./..MMMMd./..MMMd..'},
 cloak:{fiber:'..MMMM../.MhMMMM./.MMMMMM./MhMMMMMd/MMMMMMMd/MMMMMMMd/MMdMMdMd/d.d.d.d.',
  hide:'.oooooo./oooooooo/.MhMMMM./MMMMMMMd/MMkMMMMd/MMMMMkMd/MMMMMMMd/.dddddd.'},
 pack:{fiber:'.c....c./.c....c./MhMhMhMh/hMhMhMhd/MhMhMhMd/hMhMhMhd/MhMhMhMd/dddddddd',
  hide:'..cccc../.c....c./MMMMMMMM/MhMMMMMd/ddddkddd/MMMkkMMd/MMMMMMMd/dddddddd'}
};
// brightness of pixel (x,y) of material m: this is what makes scrap look rusted and chitin look plated
function tex(m,x,y){
 const n=hash2(x,y,m*13+1);
 switch(m){
 case 1:return n<.2?.8:n>.92?1.2:1;
 case 2:return(x+y*2)%5===0?.7:n<.15?.88:1;
 case 3:return(x-y+16)%4===0?1.35:(x-y+16)%4===2?.9:1;
 case 4:return x%3===0?.8:n<.08?.65:1;
 case 5:return(x%2===0?.85:1)*(y%4===0?1.15:1);
 case 6:return hash2(x>>1,y>>1,77)<.32?.68:n>.94?1.5:1;
 case 7:return y%4===1?1.14:1;
 case 8:return y%5===2?.8:(x+y)%7===0?1.2:1;
 case 9:return(x+y)%2?.82:1.05;
 case 10:return(x+y)%3===0?.72:1;
 case 11:return y%4===3&&x%2===0?.6:hash2(x>>2,y>>2,5)<.3?.9:1;
 case 12:return y%3===0?.62:y%3===1&&x%4===1?1.4:1;
 case 13:return n<.1?.8:1;
 default:return n<.15?.88:1;}
}
const ICON={},TEXC={};
function iconFor(t){
 const key=t.it?t.it+'|'+t.m+(t.flawed?'f':''):'r|'+t.m;if(ICON[key])return ICON[key];
 const mat=M[t.m],art=t.it?(ITEM_ART[t.it][mat.f]||Object.values(ITEM_ART[t.it])[0]):(RES_ART[t.m]||RES_ART[1]);
 const c=document.createElement('canvas');c.width=8;c.height=8;const g=c.getContext('2d'),rows=art.split('/');
 const fix={w:'#6a4c30',k:'#1c1c22',c:'#c9b39a',o:'#f0ece0'};
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ch=rows[y][x];if(!ch||ch==='.')continue;
  g.fillStyle=fix[ch]||shade(mat.c,(ch==='h'?1.35:ch==='d'?.6:1)*tex(t.m,x,y));g.fillRect(x,y,1,1);}
 if(t.flawed){g.fillStyle='#d02020';g.fillRect(7,0,1,1);g.fillRect(6,1,1,1);}
 return ICON[key]=c;
}
// a 16 x 24 swatch of a material's texture, for clothing drawn on a character
function texFor(m,f){const key=m+'|'+f;if(TEXC[key])return TEXC[key];
 const c=document.createElement('canvas');c.width=16;c.height=24;const g=c.getContext('2d');
 for(let y=0;y<24;y++)for(let x=0;x<16;x++){g.fillStyle=shade(M[m].c,f*tex(m,x,y));g.fillRect(x,y,1,1);}
 return TEXC[key]=c;}
