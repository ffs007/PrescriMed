/* Prescrição ambulatorial unificada: receita comum (A4 retrato, até 10 itens por folha, numeração contínua)
   + Receita de Controle Especial (A4 paisagem, 1ª e 2ª via lado a lado, até 3 itens por folha) num ÚNICO PDF.
   Aditivo: envolve RxPDF.build e reaproveita CtrlPDF.build sem editar os geradores do protótipo. */
(function () {
  "use strict";
  if (!window.RxPDF || !window.CtrlPDF || window.RxPDF.__unified) return;
  var origRx = window.RxPDF.build, MAX_RX = 10;

  function api() { return window.PSAPP && window.PSAPP.test; }
  function C() { var a = api(); return a ? a.C() : null; }
  function persist() { try { window.PSAPP.pr.setScore("__psx_sync", null); } catch (_) {} }
  function cfg() { try { return JSON.parse(localStorage.getItem("psx.cfg") || "null") || {}; } catch (_) { return {}; } }
  function pad(n, l) { return String(n).padStart(l, "0"); }
  function nextRce() {
    var y = new Date().getFullYear(), s = {};
    try { s = JSON.parse(localStorage.getItem("psx.rce.seq") || "{}"); } catch (_) {}
    var n = (s.ano === y ? s.n : 0) + 1; localStorage.setItem("psx.rce.seq", JSON.stringify({ ano: y, n: n }));
    return "RCE-" + y + "/" + pad(n, 6);
  }
  function hasOri(rx) { return [rx.visto, rx.cuidados, rx.alarme, rx.retorno].some(function (x) { return String(x || "").trim(); }); }

  /* copia o conteúdo de uma página de outro jsPDF (mesmas fontes-padrão → mesmos /F#) */
  function copyPage(dst, src, i, orient) {
    dst.addPage("a4", orient || "p");
    var n = dst.getNumberOfPages(); dst.internal.pages[n] = src.internal.pages[i].slice();
  }
  function renumber(lines, offset) {
    if (!offset) return lines;
    return lines.map(function (l) { return typeof l === "string" ? l.replace(/\((\d+)\.  /g, function (m, d) { return "(" + (+d + offset) + ".  "; }) : l; });
  }

  function build(rx, conf) {
    var c = C(), K = (c && c.ctrl) || { itens: [] };
    var ctrlItens = (K.itens || []).filter(function (x) { return x && String(x.med || "").trim(); });
    var itens = (rx.itens || []).filter(function (x) { return x && String(x.med || "").trim(); });
    var withRx = itens.length || hasOri(rx) || String(rx.naoUsar || "").trim();
    if (ctrlItens.length && !K.semCpf && String(K.cpf || "").replace(/\D/g, "").length !== 11)
      throw new Error("receita de controle especial exige CPF do paciente (11 dígitos) ou marque “Não possui CPF”.");

    var master = null, offset = 0, folhasRx = 0;
    if (withRx) {
      var chunks = []; for (var i = 0; i < itens.length; i += MAX_RX) chunks.push(itens.slice(i, i + MAX_RX));
      if (!chunks.length) chunks.push([]);
      chunks.forEach(function (ch, k) {
        var last = k === chunks.length - 1;
        var part = Object.assign({}, rx, { itens: ch, naoUsar: last ? rx.naoUsar : "", visto: last ? rx.visto : "", cuidados: last ? rx.cuidados : "", alarme: last ? rx.alarme : "", retorno: last ? rx.retorno : "" });
        var out = origRx(part, conf), d = out.doc, np = d.getNumberOfPages();
        for (var p = 1; p <= np; p++) d.internal.pages[p] = renumber(d.internal.pages[p], offset);
        if (!master) master = d; else for (var q = 1; q <= np; q++) copyPage(master, d, q, "p");
        offset += ch.length; folhasRx++;
      });
    }

    var receitas = 0;
    if (ctrlItens.length) {
      var P = c.pac || {};
      var cd = window.CtrlPDF.build({ pac: { nome: (P.nome || "").toUpperCase(), end: K.end || [P.end, P.mun, P.uf].filter(Boolean).join(", "), cpf: K.cpf || P.cpf, semCpf: K.semCpf }, data: rx.data, itens: ctrlItens }, conf).doc;
      var jsPDF = window.jspdf.jsPDF;
      if (!master) { master = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true }); }
      var k = master.internal.scaleFactor, s = (210 / 297).toFixed(5), half = (148.5 * k).toFixed(3), np2 = cd.getNumberOfPages();
      receitas = np2 / 2;
      for (var r = 0; r < receitas; r++) {
        if (r > 0 || withRx) master.addPage("a4", "l");
        var n = master.getNumberOfPages();
        var v1 = cd.internal.pages[2 * r + 1], v2 = cd.internal.pages[2 * r + 2];
        master.internal.pages[n] = ["q " + s + " 0 0 " + s + " 0 0 cm"].concat(v1, ["Q", "q " + s + " 0 0 " + s + " " + half + " 0 cm"], v2, ["Q"]);
        master.setPage(n);
        var id = nextRce();
        master.setDrawColor(120); master.setLineWidth(0.3); master.setLineDashPattern([2, 1.6], 0); master.line(148.5, 4, 148.5, 206); master.setLineDashPattern([], 0); master.setDrawColor(0);
        master.setFont("helvetica", "normal"); master.setFontSize(7); master.setTextColor(60);
        [10, 158.5].forEach(function (x) { master.text(id + "  ·  Receita " + (r + 1) + " de " + receitas, x, 6); });
        master.setFontSize(6); master.text("- - corte aqui - -", 148.5, 208, { align: "center" }); master.setTextColor(0);
      }
    }
    if (!master) throw new Error("a receita está vazia.");
    master.setProperties({ title: "Prescrição ambulatorial - " + String((rx.pac || {}).nome || ""), creator: "PrescriMed" });
    var a = api(); if (a) try { window.PSX_SAFE && window.PSX_SAFE.log && window.PSX_SAFE.log({ tipo: "emissao_documento", dominio: "prescricao_ambulatorial", motivo: folhasRx + " folha(s) comum(ns); " + receitas + " receita(s) de controle especial" }); } catch (_) {}
    return { doc: master, pages: master.getNumberOfPages(), receitas: receitas };
  }
  window.RxPDF.build = build; window.RxPDF.__unified = true;

  /* ---------- bloco "Controle especial" dentro da prescrição ambulatorial ---------- */
  function el(t, a, kids) { var e = document.createElement(t); Object.keys(a || {}).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); }); (kids || []).forEach(function (x) { if (x) e.appendChild(x); }); return e; }
  function isRxModal() { var m = document.getElementById("modal"), t = document.getElementById("mTitle"); return m && m.open && t && /Prescrição ambulatorial|Receita de alta/.test(t.textContent); }
  function drawBlock() {
    if (!isRxModal()) return;
    var body = document.querySelector("#modal .mbody"), c = C(); if (!body || !c) return;
    var K = c.ctrl, old = document.getElementById("psxCtrlBlock");
    var sig = JSON.stringify([K.itens, K.semCpf]); if (old && old.dataset.sig === sig) return;
    var P = c.pac || {};
    if (!K.end && P.end) K.end = [P.end, P.mun, P.uf].filter(Boolean).join(", ");
    if (!K.cpf && P.cpf) K.cpf = P.cpf;
    var box = el("div", { class: "box", id: "psxCtrlBlock" });
    box.dataset.sig = sig;
    box.appendChild(el("h3", { text: "Controle especial (Portaria 344/98)" }));
    if (!K.itens.length) box.appendChild(el("div", { class: "note", text: "Nenhum medicamento controlado. Ao marcar um item com selo “controle especial”, ele entra aqui e sai em receita própria (paisagem, 2 vias lado a lado, até 3 por folha) no mesmo PDF." }));
    K.itens.forEach(function (it, i) {
      box.appendChild(el("div", { class: "rxitem" }, [el("span", { class: "n", text: (i + 1) + "." }), el("div", { class: "det", text: it.med + " · " + (it.qtd || "") + " · " + (it.pos || "") }),
        el("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { K.itens.splice(i, 1); persist(); drawBlock(); } })]));
    });
    if (K.itens.length) {
      var inp = function (lab, key, mono) { var x = el("input", { class: "in" + (mono ? " mono" : "") }); x.value = K[key] || ""; x.addEventListener("input", function () { K[key] = x.value; persist(); }); return el("label", { class: "f" }, [el("span", { text: lab }), x]); };
      var cb = el("input", { type: "checkbox" }); cb.checked = !!K.semCpf; cb.addEventListener("change", function () { K.semCpf = cb.checked; persist(); });
      box.appendChild(el("div", { class: "grid" }, [inp("Endereço completo do paciente", "end"), inp("CPF", "cpf", true), el("label", { class: "check" }, [cb, document.createTextNode("Não possui CPF")])]));
      box.appendChild(el("div", { class: "note", text: Math.ceil(K.itens.length / 3) + " receita(s) de controle especial serão incluídas no PDF." }));
    }
    if (old) old.replaceWith(box); else body.insertBefore(box, body.querySelector(".preview"));
  }
  // permite gerar quando só há itens controlados (o motor exige receita comum não vazia)
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#mFoot button");
    if (b && isRxModal() && b.textContent.trim() === "Gerar PDF") {
      var c = C(); if (c && !c.rx.itens.length && !c.rx.cuidados && c.ctrl.itens.length) { c.rx.cuidados = " "; setTimeout(function () { if (c.rx.cuidados === " ") c.rx.cuidados = ""; }, 0); }
    }
    setTimeout(drawBlock, 0);
  }, true);
  new MutationObserver(function () { drawBlock(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
})();
