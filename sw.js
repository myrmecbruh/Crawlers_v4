// Offline cache: network first, fall back to cache.
const C='crawlers4-v2',F=['./','index.html','js/data.js','js/world.js','js/sim.js','js/art.js','js/render.js','js/sound.js','js/ui.js','manifest.json','icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r;}).catch(()=>caches.match(e.request)));});
