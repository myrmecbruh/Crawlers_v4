'use strict';
// ---- Sound: everything is synthesised with WebAudio, so nothing is downloaded. Effects for dice, blows, digging, the
// gate and goals; stingers for raids and falls; and a quiet generated mood track that darkens at night and in a raid.
// Browsers only allow sound after the first tap. [slop] all sounds
const SND={on:true,ctx:null,master:null,music:null,last:{},nextNote:0};
try{const v=localStorage.getItem('crawlers4-sound');if(v==='0')SND.on=false;}catch(e){}
function sndStart(){if(SND.ctx||!SND.on)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;SND.ctx=new C();
 SND.master=SND.ctx.createGain();SND.master.gain.value=.5;SND.master.connect(SND.ctx.destination);musicStart();}catch(e){SND.ctx=null;}}
function sndToggle(){SND.on=!SND.on;try{localStorage.setItem('crawlers4-sound',SND.on?'1':'0');}catch(e){}
 if(SND.on){if(!SND.ctx)sndStart();else SND.ctx.resume();}else if(SND.ctx)SND.ctx.suspend();}
document.addEventListener('pointerdown',()=>{if(SND.on&&!SND.ctx)sndStart();else if(SND.ctx&&SND.on&&SND.ctx.state==='suspended')SND.ctx.resume();},{capture:true});
// one shaped tone or noise burst
function tone(f,dur,type,vol,slide,delay){const C=SND.ctx;if(!C||!SND.on)return;const t=C.currentTime+(delay||0),o=C.createOscillator(),g=C.createGain();
 o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.2,t+.008);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g);g.connect(SND.master);o.start(t);o.stop(t+dur+.02);}
let NOISE=null;
function noise(dur,vol,freq,delay){const C=SND.ctx;if(!C||!SND.on)return;if(!NOISE){NOISE=C.createBuffer(1,C.sampleRate*.5,C.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 const t=C.currentTime+(delay||0),s=C.createBufferSource(),f=C.createBiquadFilter(),g=C.createGain();s.buffer=NOISE;f.type='bandpass';f.frequency.value=freq||1200;f.Q.value=1.2;
 g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(f);f.connect(g);g.connect(SND.master);s.start(t);s.stop(t+dur+.02);}
// at most a few of the same sound each second, so 16x speed does not turn into a roar
function limited(k,ms){const n=performance.now();if(SND.last[k]&&n-SND.last[k]<ms)return false;SND.last[k]=n;return true;}
const SFX={
 tap:()=>tone(1400,.03,'square',.04),
 roll:d=>{if(!limited('roll',220))return;for(let i=0;i<3;i++)noise(.035,.12,2600+i*500,i*.045);if(d&&d.ok)tone(880,.12,'triangle',.06,1,.14);},
 swing:()=>{if(limited('swing',200))noise(.09,.1,700);},
 hit:()=>{if(limited('hit',150))tone(160,.16,'sine',.35,.45);},
 dig:()=>{if(limited('dig',250)){noise(.12,.18,400);tone(90,.1,'sine',.2,.6);}},
 make:()=>{tone(1320,.25,'triangle',.12);tone(1980,.3,'sine',.06,1,.03);},
 thud:()=>{tone(70,.35,'sine',.5,.5);noise(.2,.2,250);},
 kill:()=>{tone(220,.3,'sawtooth',.08,.5);},
 down:()=>{tone(392,.4,'triangle',.15,.7);tone(311,.6,'triangle',.15,.7,.2);},
 raid:()=>{for(let i=0;i<3;i++)tone(110,.7,'sawtooth',.12,1.02,i*.5);noise(.5,.1,180);},
 raidEnd:()=>{[392,494,587].forEach((f,i)=>tone(f,.5,'triangle',.12,1,i*.12));},
 goal:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.35,'triangle',.13,1,i*.09));},
 dawn:()=>{tone(880,1.2,'sine',.06);tone(1320,1.4,'sine',.03,1,.05);},
 threat:()=>{if(limited('threat',800))tone(147,.5,'sine',.12,.9);}};
// the mood: a low drone and slow notes from a minor scale; lower and sparser at night, a pulse during a raid
function musicStart(){const C=SND.ctx;const g=C.createGain();g.gain.value=.05;g.connect(SND.master);SND.music=g;
 for(const f of[55,82.4]){const o=C.createOscillator(),lp=C.createBiquadFilter();o.type='sawtooth';o.frequency.value=f;o.detune.value=(Math.random()-.5)*8;lp.type='lowpass';lp.frequency.value=260;o.connect(lp);lp.connect(g);o.start();}
 setInterval(musicTick,500);}
const SCALE=[220,261.6,293.7,329.6,392,440,523.3];
function musicTick(){const C=SND.ctx;if(!C||!SND.on||!G)return;const t=C.currentTime,raid=!!(G.raid);
 SND.music.gain.setTargetAtTime(raid?.08:night()?.035:.05,t,1.5);
 if(raid&&G.speed>0){tone(73,.25,'sine',.25,.6);return;}
 if(t<SND.nextNote||G.speed===0)return;SND.nextNote=t+(night()?6:3.5)+Math.random()*4;
 const f=SCALE[Math.floor(Math.random()*SCALE.length)]*(night()?.5:1);tone(f,2.6,'triangle',.05);if(Math.random()<.4)tone(f*1.5,2.2,'sine',.025,1,.4);}
// the simulation's events
emit=function(t,d){if(t==='banner')return banner(d.t,d.s,d.k);const f=SFX[t];if(f)f(d);};
// a banner across the middle of the map; it never takes taps and never moves anything
let banT=0;
function banner(t,s,k){const b=document.getElementById('banner');if(!b)return;b.className='ban '+(k||'');b.innerHTML='<b>'+t+'</b>'+(s?'<br><span>'+s+'</span>':'');
 void b.offsetWidth;b.classList.add('show');clearTimeout(banT);banT=setTimeout(()=>b.classList.remove('show'),2600);}
