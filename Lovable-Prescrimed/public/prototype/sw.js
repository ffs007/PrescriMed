/* PrescriMed — service worker offline-first (rede-primeiro, cache de reserva).
   Hospital com internet ruim: o app SEMPRE tenta a rede (nunca fica stale);
   se a rede falha, serve do cache instalado. Cache limpo a cada versão. */
var CACHE = "pm-proto-v1-2711";
var CORE = [
  "index.html",
  "app.js", "engine.js", "clin-data.js",
  "proto-data.js", "proto-data-2.js", "proto-data-3.js", "proto-data-4.js", "proto-data-5.js",
  "legacy-data.js", "expansion-data.js", "hosp-data.js", "hosp-expansion.js", "curated-data.js",
  "renal-data.js", "preg-data.js", "peds-anam.js", "sigtap-data.js",
  "scores-core.js", "scores-extra.js",
  "apac-pdf.js", "rx-pdf.js", "ctrl-pdf.js", "docs-pdf.js",
  "lovable-bridge.js", "lovable-search.js?v=2", "lovable-docstyle.js", "lovable-stamp.js",
  "lovable-custom.js", "lovable-catmap.js", "lovable-documents.js", "lovable-modules.js",
  "lovable-rxunified.js", "lovable-rxtaxonomy.js", "lovable-rxmodal.js", "lovable-curatedfocus.js",
  "lovable-alta.js", "lovable-extras.js", "lovable-homelayout.js", "lovable-safety.js",
  "lovable-decision.js", "lovable-nursing.js", "lovable-validate.js", "lovable-templates.js",
  "lovable-flowchart.js", "lovable-protocols.js", "lovable-protassist.js", "lovable-cdss.js",
  "lovable-emergency.js", "lovable-emergency-box.js", "procedures-data.js", "lovable-procedures.js",
  "lovable-polish.js", "lovable-casehygiene.js", "lovable-redesign.js", "lovable-analytics.js",
  "lovable-theme.js", "lovable-layout.js", "lovable-concepcao.js?v=1", "lovable-concepcao2.js?v=1",
  "sw.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; /* CDNs ficam de fora (offline só para o núcleo) */
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (resp && resp.ok) { var cl = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cl); }); }
      return resp;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: false }).then(function (r) { return r || caches.match(e.request, { ignoreSearch: true }); });
    })
  );
});
