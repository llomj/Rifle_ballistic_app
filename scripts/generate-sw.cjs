/**
 * Run after vite build. Scans dist/ and writes dist/sw.js with a full precache
 * list so the app works offline on first load (SW install caches everything).
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const basePath = '/' + (process.env.VITE_BASE_REPO || 'Rifle_ballistic_app').replace(/^\/|\/$/g, '') + '/';

function listFiles(dir, prefix = '') {
  let out = [];
  const names = fs.readdirSync(dir);
  for (const name of names) {
    const full = path.join(dir, name);
    const rel = prefix ? prefix + '/' + name : name;
    if (fs.statSync(full).isDirectory()) {
      out = out.concat(listFiles(full, rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

const files = listFiles(distDir);
const precacheUrls = files.map((f) => {
  const url = basePath + f.replace(/\\/g, '/');
  return JSON.stringify(url);
});

const swContent = `const CACHE_NAME = 'rifle-ballistic-offline-v2';
const PRECACHE_URLS = [${precacheUrls.join(',\n  ')}];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE_URLS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      });
    })
  );
});
`;

fs.writeFileSync(path.join(distDir, 'sw.js'), swContent, 'utf8');
console.log('Generated sw.js with', precacheUrls.length, 'precache URLs');
