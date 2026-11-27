/* Módulos da condição — decisões do Dr. Felipe (04/11/2026):
   1. "Controle especial" SAI da grade: o fluxo é automático dentro da Prescrição
      ambulatorial (rxunified): item de controle → receita própria (≤3 por receita,
      receitas extras automáticas, numeração RCE própria), itens simples → receita simples.
   2. "Relatório de alta" SAI da grade: vive DENTRO de "Evolução e resumo de alta".
   3. A ordem da grade é a definida em lovable-documents.js ORDER (já atualizada). */
(function () {
  "use strict";

  function el(t) {
    var n = document.createElement(t), a = arguments[1] || {};
    Object.keys(a).forEach(function (k) {
      if (k === "class") n.className = a[k];
      else if (k === "text") n.textContent = a[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), a[k]);
      else if (a[k] != null) n.setAttribute(k, a[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var x = arguments[i];
      if (x == null) continue;
      if (Array.isArray(x)) x.forEach(function (y) { if (y != null) n.appendChild(typeof y === "string" ? document.createTextNode(y) : y); });
      else n.appendChild(typeof x === "string" ? document.createTextNode(x) : x);
    }
    return n;
  }

  /* 1) remove o card de Controle especial da grade (o módulo RENDER.ctrl continua
        acessível internamente; o banner do lovable-extras segue funcional) */
  function stripCtrlCard() {
    var grid = document.querySelector(".mods"); if (!grid) return;
    Array.prototype.slice.call(grid.querySelectorAll(":scope > .mod")).forEach(function (b) {
      var label = b.querySelector("b");
      if (label && label.textContent.trim() === "Controle especial") b.remove();
    });
  }

  /* 2) injeta o box do Relatório de alta no modal de Evolução */
  function injectAltaIntoEvol() {
    var m = document.getElementById("modal"), t = document.getElementById("mTitle");
    if (!m || !m.open || !t) return;
    if (!/Evolução e resumo de alta/.test(t.textContent)) return;
    var body = m.querySelector(".mbody"); if (!body || document.getElementById("psxAltaBox")) return;
    var btn = el("button", { class: "btn sm primary", type: "button", text: "Abrir relatório de alta", onclick: function () { try { window.PSX_ALTA.open(); } catch (_) {} } });
    var box = el("div", { class: "box", id: "psxAltaBox" },
      el("h3", null, "Relatório de alta ", el("small", { text: "pré-preenchido pela condição · Ctrl+Shift+A" })),
      el("div", { class: "note", text: "Gera o relatório de alta completo (PDF) a partir da condição e do atendimento — revisão médica obrigatória antes de emitir." }),
      el("div", { class: "btns" }, btn));
    body.appendChild(box);
  }

  var queued = false;
  function sync() {
    if (queued) return; queued = true;
    setTimeout(function () { queued = false; try { stripCtrlCard(); } catch (_) {} try { injectAltaIntoEvol(); } catch (_) {} }, 0);
  }
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  setInterval(function () { try { stripCtrlCard(); } catch (_) {} try { injectAltaIntoEvol(); } catch (_) {} }, 800);
  sync();
})();
