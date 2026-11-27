/* Carregamento sob demanda do conteudo curado.
   O core (curated-core.js) traz protocolos e o mapa id->pacote; os pacotes
   (curated-pkg-N.js) trazem classes e farmacos. A escolha de condicao espera o
   pacote certo; em paralelo, todos os pacotes sao pre-carregados em segundo plano
   para que kits, templates e busca voltem ao comportamento completo em ~1 s. */
(function () {
  "use strict";
  var MAPA = window.PSX_BUCKET || {};
  var TOTAL = window.PSX_PKG_COUNT || 0;
  if (!TOTAL) return;
  var prontos = {}, fila = [], buscando = {};

  function marcar(n) { prontos[n] = 1; }
  window.PSX_PKG_DONE = marcar;

  function aviso(t) {
    if (window.PSAPP && window.PSAPP.toast) { try { window.PSAPP.toast(t); return; } catch (e) {} }
  }

  function baixar(n, cb) {
    if (prontos[n]) { cb && cb(null); return; }
    if (buscando[n]) { fila.push(cb); return; }
    buscando[n] = 1;
    fila.push(cb);
    var s = document.createElement("script");
    s.src = "curated-pkg-" + n + ".js";
    s.async = true;
    s.onload = function () {
      prontos[n] = 1; buscando[n] = 0;
      var f = fila; fila = [];
      f.forEach(function (fn) { fn && fn(null); });
    };
    s.onerror = function () {
      buscando[n] = 0;
      var f = fila; fila = [];
      f.forEach(function (fn) { fn && fn(new Error("pacote " + n)); });
    };
    document.head.appendChild(s);
  }

  function bucket(id) {
    var n = MAPA[id];
    return n == null ? null : n;
  }

  /* espera o pacote da condicao antes de renderizar */
  function instalar() {
    var pr = window.PSAPP && window.PSAPP.pr;
    if (!pr || !pr.choose || pr.choose.__psxPkg) return;
    var original = pr.choose;
    function escolher(id) {
      var n = bucket(id);
      if (n == null || prontos[n]) return original(id);
      aviso("Carregando base clínica…");
      baixar(n, function (err) {
        if (err) { aviso("Falha ao carregar a base — usando o que está em memória."); }
        original(id);
      });
    }
    escolher.__psxPkg = 1;
    pr.choose = escolher;
  }
  instalar();
  window.addEventListener("load", function () { instalar(); }, { once: true });

  /* pre-carga sequencial em segundo plano */
  var n = 0;
  function proximo() {
    if (n >= TOTAL) return;
    var atual = n++;
    if (prontos[atual]) { proximo(); return; }
    baixar(atual, function () { setTimeout(proximo, 40); });
  }
  if (window.requestIdleCallback) requestIdleCallback(proximo, { timeout: 1500 });
  else setTimeout(proximo, 300);
})();
