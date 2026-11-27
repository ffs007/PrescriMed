/* PrescriMed — telemetria para o Painel de Inteligência Prescritiva.
   Registra, sem alterar o motor, cada documento gerado (após as travas de revisão):
   condição, faixa etária, peso, contexto, medicamentos e tempo de montagem. Vai para safety_events (tipo emissao_documento). */
(function () {
  "use strict";
  var t0 = Date.now(), lastProto = null, usedTpl = false, last = 0;
  function A() { return window.PSAPP; }
  function C() { try { return A().test.C(); } catch (_) { return null; } }
  function D() { return window.PROTO_DB || {}; }
  setInterval(function () {
    var c = C(); if (!c) return;
    if (c.proto !== lastProto) { lastProto = c.proto; t0 = Date.now(); usedTpl = false; }
  }, 1000);
  function wrapTpl() {
    var T = window.PSX_TPL; if (!T || !T.applyTemplate || T.applyTemplate.__pm) return;
    var f = T.applyTemplate; T.applyTemplate = function () { usedTpl = true; return f.apply(this, arguments); }; T.applyTemplate.__pm = true;
  }
  setInterval(wrapTpl, 2000);
  function classOf(id) {
    var cl = D().classes || {};
    for (var k in cl) { var l = cl[k].d || cl[k].drugs || cl[k].items || []; if (Array.isArray(l) && l.indexOf(id) >= 0) return cl[k].n || k; }
    return null;
  }
  function meds(c) {
    var out = [], db = D().drugs || {};
    Object.keys(c.rxSel || {}).forEach(function (id) { if (c.rxSel[id] && c.rxSel[id].on && db[id]) out.push({ id: id, n: db[id].n, cls: classOf(id) }); });
    (c.rx && c.rx.itens || []).forEach(function (i) { if (i.med && !out.some(function (o) { return i.med.toLowerCase().indexOf(o.n.toLowerCase()) === 0; })) out.push({ id: null, n: String(i.med).split(/\s+—|\s+-\s|,/)[0].slice(0, 80), cls: null }); });
    (c.ctrl && c.ctrl.itens || []).forEach(function (i) { if (i.med) out.push({ id: null, n: String(i.med).slice(0, 80), cls: "Controle especial", ctrl: true }); });
    return out.slice(0, 30);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("button");
    if (!b || !/Gerar PDF|Imprimir|Gerar e imprimir/i.test(b.textContent || "")) return;
    setTimeout(function () {
      var c = C(); if (!c || Date.now() - last < 2500) return;
      var foot = b.parentElement, st = foot && foot.parentElement && foot.parentElement.querySelector(".status.err");
      if (st && st.textContent) return;
      last = Date.now();
      var p = A().pr.current(), m = A().pr.idadeM(), w = A().pr.peso();
      var mod = (document.getElementById("mTitle") || {}).textContent || "";
      var emerg = !!document.querySelector(".psxE-root:not([hidden]), .psxE-overlay");
      var hosp = /hospitalar|interna|AIH|checagem/i.test(mod);
      var ctx = emerg ? "emergencia" : hosp ? "internacao" : "ambulatorial";
      window.PSX_SAFE && window.PSX_SAFE.log({
        tipo: "emissao_documento", dominio: "analytics", medicamento: null,
        motivo: p ? p.n : "Sem condição", fonte: "PrescriMed",
        contexto: { modulo: mod.slice(0, 80), condicao: p ? p.n : null, cid: p && p.cid && p.cid[0] ? p.cid[0][0] : null,
          idade_meses: m, peso: w, contexto: ctx, protocolo: usedTpl, segundos: Math.round((Date.now() - t0) / 1000), meds: meds(c) }
      });
    }, 500);
  }, true);
})();
(function () {
  function add() {
    var cfg = document.getElementById("btnCfg"); if (!cfg || document.getElementById("btnIntel")) return;
    var b = document.createElement("button"); b.id = "btnIntel"; b.className = "iconbtn"; b.type = "button";
    b.title = "Meu painel de inteligência prescritiva"; b.setAttribute("aria-label", b.title);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>';
    b.onclick = function () { try { window.top.location.href = "/app/inteligencia"; } catch (_) { location.href = "/app/inteligencia"; } };
    cfg.parentNode.insertBefore(b, cfg);
  }
  add(); document.addEventListener("DOMContentLoaded", add); setTimeout(add, 1500);
})();
