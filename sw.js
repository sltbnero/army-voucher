// Network-first: always tries the latest version, falls back to cache when offline.
// Also caches the CDN libraries (xlsx, exceljs) and fonts so the app works offline.
const CACHE = "sltb-summary-v2";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&display=swap"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(FILES);
    await Promise.all(CDN.map(u => fetch(u, {mode: "no-cors"}).then(r => c.put(u, r)).catch(() => {})));
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = e.request.url;
  const ok = u.startsWith(self.location.origin) || u.startsWith("https://cdnjs.cloudflare.com/") || u.startsWith("https://fonts.googleapis.com/") || u.startsWith("https://fonts.gstatic.com/");
  if (!ok) return;
  e.respondWith(
    fetch(e.request, u.startsWith(self.location.origin) ? {cache: "reload"} : undefined).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
