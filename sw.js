const CACHE='ielts-focus-shell-v1', SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const DB='ielts-focus-local', STORE='files';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
function openDB(){return new Promise((ok,bad)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
async function getFile(k){const db=await openDB();return new Promise((ok,bad)=>{const t=db.transaction(STORE,'readonly'),r=t.objectStore(STORE).get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url), scope=new URL(self.registration.scope), prefix=scope.pathname+'local/';
  if(url.origin===location.origin && url.pathname.startsWith(prefix)){
    e.respondWith((async()=>{
      const key=decodeURIComponent(url.pathname.slice(prefix.length)), blob=await getFile(key);
      if(blob)return new Response(blob,{headers:{'Content-Type':blob.type||'application/octet-stream','Cache-Control':'no-store'}});
      return new Response('Local IELTS file not found: '+key,{status:404,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    })()); return;
  }
  if(e.request.method==='GET'){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match('./index.html'))));
  }
});