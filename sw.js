const CACHE='ielts-focus-shell-v2';
const SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './src/core-store.js',
  './src/material-library.js',
  './src/progress-engine.js',
  './src/cloud-materials-ui.js',
  './src/cloud-materials.css',
  './materials-manifest.json'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  const isCloudMaterial =
    url.hostname==='github.com' ||
    url.hostname.endsWith('githubusercontent.com') ||
    url.hostname.endsWith('githubassets.com');

  if(isCloudMaterial){
    event.respondWith(fetch(request));
    return;
  }

  const isShell =
    request.mode==='navigate' ||
    /\.(?:html|js|css|webmanifest|json)$/i.test(url.pathname);

  if(isShell){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(()=>caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit=>hit||fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }))
  );
});
