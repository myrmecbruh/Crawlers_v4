'use strict';
// Crawlers v4 prototype (slice 1). Numbers not in docs/ are [slop].
const W=96,H=48,Z=12,PW=48,DAY=240;
const TR=['Might','Agility','Endurance','Presence','Intellect','Willpower'];
const TRS=['MGT','AGI','END','PRE','INT','WIL'];
const AREA=['Head','Torso','Legs','Feet','Hands','Mantle'];
const SEASON=['Spring','Summer','Autumn','Winter'];
// n name, f family, h hardness, w weight, v worth, c colour, eat food value, soft how far a voxel of it rounds off (0 = hard cube)
const M=[null,
 {n:'Granite',f:'stone',h:3,w:3,v:1,c:'#6b6e76',soft:.13},
 {n:'Rubble',f:'stone',h:1,w:3,v:1,c:'#857c70',kw:'brittle',soft:.2},
 {n:'Slag-glass',f:'stone',h:2,w:2,v:2,c:'#3f6e6c',kw:'brittle, sharp'},
 {n:'Deadwood',f:'wood',h:1,w:1,v:1,c:'#7a5a3a',kw:'flammable'},
 {n:'Ironbark',f:'wood',h:2,w:2,v:2,c:'#4a3524',kw:'flammable'},
 {n:'Scrap',f:'metal',h:2,w:2,v:1,c:'#9a5a3c',kw:'conductive, rusting'},
 {n:'Iron',f:'metal',h:3,w:3,v:2,c:'#aab3bd',kw:'conductive'},
 {n:'Old alloy',f:'metal',h:3,w:1,v:3,c:'#c9e0c0',kw:'conductive, relic'},
 {n:'Reed',f:'fiber',h:1,w:1,v:1,c:'#b5ad5e',kw:'flammable'},
 {n:'Sinew cord',f:'fiber',h:2,w:1,v:2,c:'#c9b39a'},
 {n:'Rawhide',f:'hide',h:1,w:1,v:1,c:'#9a7a55',kw:'rotting'},
 {n:'Chitin',f:'hide',h:2,w:1,v:2,c:'#5a4a6a',kw:'brittle'},
 {n:'Bone',f:'bone',h:2,w:1,v:1,c:'#d8d0b8',kw:'brittle'},
 {n:'Grey moss',f:'plant',h:1,w:1,v:1,c:'#7f9a6a',kw:'edible, flammable',eat:2},
 {n:'Tuber',f:'plant',h:1,w:2,v:1,c:'#b07a9a',kw:'edible',eat:3,raw:1},
 {n:'Meat',f:'flesh',h:1,w:2,v:1,c:'#b04848',kw:'edible, rotting',eat:3,raw:1},
 {n:'Cell',f:'relic',h:1,w:1,v:3,c:'#7fe0d0',kw:'conductive, relic, volatile'},
 {n:'Fog',f:'none',h:1,w:1,v:0,c:'#16161d'},
 {n:'Ash',f:'stone',h:1,w:1,v:0,c:'#56534f',kw:'loose',soft:.24},
 {n:'Meal',f:'food',h:1,w:1,v:2,c:'#e0b060',kw:'edible',eat:5}
];
const SKILL={stone:'Stone',wood:'Wood',metal:'Metal',fiber:'Fiber',hide:'Flesh',bone:'Flesh',flesh:'Flesh',plant:'Plant',relic:'Relic',food:'Plant'};
const ITEM={
 pick:{n:'Pick',tool:1,cost:2,fam:['metal','stone','bone']},
 axe:{n:'Axe',tool:1,cost:2,fam:['metal','stone']},
 knife:{n:'Knife',tool:1,cost:1,fam:['metal','stone','bone']},
 club:{n:'Club',wpn:'Haft',cost:1,fam:['wood','bone']},
 blade:{n:'Blade',wpn:'Blade',cost:2,fam:['metal']},
 shield:{n:'Shield',shield:1,cost:2,fam:['wood']},
 cap:{n:'Cap',slot:0,cost:1,fam:['hide','metal','fiber']},
 jerkin:{n:'Jerkin',slot:1,cost:2,fam:['hide','fiber','metal']},
 leggings:{n:'Leggings',slot:2,cost:2,fam:['hide','fiber']},
 boots:{n:'Boots',slot:3,cost:1,fam:['hide']},
 gloves:{n:'Gloves',slot:4,cost:1,fam:['hide','fiber']},
 cloak:{n:'Cloak',slot:5,cost:2,fam:['fiber','hide']},
 pack:{n:'Pack',slot:5,cost:2,pack:3,fam:['fiber','hide']}
};
// m yield material, tr trait, d difficulty, tool that adds a die, uses, dur ticks, grow regrows
const FEAT={
 tree:{n:'Dead tree',m:4,tr:0,d:1,tool:'axe',uses:2,dur:8},
 moss:{n:'Grey moss',m:14,tr:1,d:1,tool:'knife',uses:1,dur:5,grow:1},
 tuber:{n:'Tuber patch',m:15,tr:1,d:1,tool:'knife',uses:1,dur:5,grow:1},
 reed:{n:'Reeds',m:9,tr:1,d:1,tool:'knife',uses:2,dur:5,grow:1},
 scrap:{n:'Scrap heap',m:6,tr:0,d:1,tool:'pick',uses:3,dur:8},
 vein:{n:'Iron vein',m:7,tr:0,d:2,tool:'pick',uses:3,dur:10},
 glass:{n:'Slag-glass spur',m:3,tr:0,d:2,tool:'pick',uses:2,dur:10},
 cache:{n:'Sealed cache',m:17,tr:4,d:1,sk:'Relic',uses:1,dur:10,card:1},
 nest:{n:'Rat nest',m:13,tr:0,d:2,sk:'Flesh',uses:2,dur:10},
 cage:{n:'Caged figure',m:6,tr:1,d:1,sk:'Metal',uses:1,dur:10,cage:1},
 crop:{n:'Tuber crop',m:15,tr:1,d:1,tool:'knife',uses:3,dur:5,grow:1},
 hearth:{n:'Hearth'},bench:{n:'Workbench'},brazier:{n:'Brazier'},trap:{n:'Trap'}
};
const CARD={
 still:{n:'Still air',kind:'blank',t:'Nothing stirs.'},
 cold:{n:'Cold snap',kind:'bane',t:'Everyone chills one step faster.',pips:3},
 vermin:{n:'Vermin',kind:'bane',t:'One food token rots at dawn.',pips:3},
 seam:{n:'Good seam',kind:'boon',t:'First mining roll of the day gains a die.',pips:3},
 dry:{n:'Dry wood',kind:'boon',t:'Fuel burns half again as long.',pips:3},
 wander:{n:'Wanderer',kind:'arrival',t:'A stranger comes to the gate.',pips:1},
 chart:{n:'Chart',kind:'boon',t:'A party sent today sees the whole zone.',pips:2}
};
// feats: what the party works; loot: which tokens it picks up. All details [slop].
const GOAL={
 ore:{n:'Bring ore',t:'Mine, and carry home what hands and packs can hold.',feats:['vein','scrap','glass','cache'],loot:{any:1}},
 map:{n:'Map the zone',t:'Walk all of it. A full map comes home as a Chart card.',feats:[],loot:null},
 nest:{n:'Kill the nest',t:'Hunt every creature and break the nest. It breeds while it stands.',feats:['nest'],loot:{any:1}},
 rescue:{n:'Rescue',t:'Find the caged figure and carry them home to join you.',feats:['cage'],loot:null},
 reclaim:{n:'Reclaim tiles',t:'Carry wood out and light braziers. Lit ground is not forgotten. A brazier burns 6 days.',feats:[],loot:null},
 card:{n:'Find a card',t:'Find the sealed cache and bring back what is in it.',feats:['cache'],loot:{card:1}}
};
const SKIN=['#f0d2b6','#e0b592','#c9a183','#a97c5b','#85593c','#5f3d28','#b9a08e','#d8c7b4'];
const HAIR=['#2a2420','#4a3320','#7a5230','#b08840','#c8a050','#8a3a22','#9a9a98','#d8d4cc','#15131a'];
const EYE=['#221a14','#3a2a1a','#2f4a6a','#3a6a4a','#6a6a72','#7a5a20'];
const NAMES=['Odd','Mara','Juss','Kell','Vey','Harn','Isk','Dola','Pim','Rook','Sable','Tam'];
