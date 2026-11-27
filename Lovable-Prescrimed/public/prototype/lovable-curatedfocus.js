/* Foco da condição CURADA no modal de medicações (v3 — 04/11/2026).
   v3: enforcement contínuo — detecta TROCA DE CONDIÇÃO COM O MODAL ABERTO
   (ex.: atalho "Abrir protocolo" dentro do próprio modal) e re-foca na queixa
   da nova condição. Só age em condições curadas (PSX_CURATED.ids); condições
   não curadas mantêm a experiência padrão. Após focar, permite navegação manual
   até a próxima troca de condição/abertura. */
(function () {
  "use strict";
  var enforcedProto = null; // id da condição já focada nesta "sessão" do modal

  function state() { try { return window.PSAPP && window.PSAPP.test && window.PSAPP.test.C(); } catch (_) { return null; } }
  function proto() {
    var C = state(); if (!C || !C.proto) return null;
    var D = window.PROTO_DB; if (!D) return null;
    return D.protocols.filter(function (p) { return p.id === C.proto; })[0] || null;
  }
  function isCurated(id) {
    try { return !!(window.PSX_CURATED && window.PSX_CURATED.ids && window.PSX_CURATED.ids.indexOf(id) >= 0); } catch (_) { return false; }
  }

  function focusCondition() {
    var dlg = document.querySelector("dialog.modal.rxm");
    if (!dlg || !dlg.open) { enforcedProto = null; return; } // fechou: próxima abertura re-foca
    var p = proto();
    if (!p) return;
    if (enforcedProto === p.id) return; // já focada nesta sessão: usuário pode navegar
    if (!p.cls || !p.cls.length) { enforcedProto = p.id; return; }

    var ok = (function () {
      var tabs = Array.prototype.slice.call(document.querySelectorAll(".rxm-tabs button"));
      var tabQ = tabs.filter(function (b) { return /por queixa/i.test(b.textContent); })[0];
      if (!tabQ) return false;
      if (!tabQ.classList.contains("on")) { tabQ.click(); return false; } // troca de aba; próximo ciclo continua

      var cats = Array.prototype.slice.call(document.querySelectorAll(".rxm-cat"));
      var hit = cats.filter(function (c) {
        var nm = c.querySelector(".nm");
        return nm && nm.textContent.trim() === p.n.trim();
      })[0];
      if (hit) {
        if (!hit.classList.contains("on")) hit.click();
        try { hit.scrollIntoView({ block: "nearest" }); } catch (_) {}
        return true;
      }
      return false; // sem queixa visível ainda (seção pode estar recolhida)
    })();
    if (ok) { enforcedProto = p.id; return; }

    // expansão ÚNICA de todas as seções recolhidas desta condição — depois para de procurar
    if (focusCondition._exp !== p.id) {
      focusCondition._exp = p.id;
      Array.prototype.slice.call(document.querySelectorAll(".rxm-sec")).forEach(function (s) {
        var b = s.querySelector("button");
        if (b && /▸/.test(b.textContent || "")) b.click(); // recolhida → expande
      });
      return; // próximo ciclo procura de novo com as seções abertas
    }
    enforcedProto = p.id; // procurou com tudo aberto e não existe queixa própria: default
  }

  setInterval(function () { try { focusCondition(); } catch (_) {} }, 500);
})();
