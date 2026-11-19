// 只快取此 App 自己的靜態檔案；不處理其他請求，也不碰同網域其他專案的快取。
const CACHE = "notes-2026-calc-v2";
const LEGACY = ["calc-v1"]; // 此 App 舊版建立的快取
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];
const OURS = FILES.map(f => new URL(f, self.registration.scope).href);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && (LEGACY.includes(k) || k.startsWith("notes-2026-calc-"))).map(k => caches.delete(k))
  )));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url); u.search = ""; u.hash = "";
  if (!OURS.includes(u.href)) return; // 不屬於此 App 的請求，交還給瀏覽器
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok && r.type === "basic") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(u.href, copy)); }
      return r;
    }).catch(() => caches.match(u.href, { cacheName: CACHE }))
  );
});
