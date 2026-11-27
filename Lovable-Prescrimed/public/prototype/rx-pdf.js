/* Receituário + Orientações de alta — gerador jsPDF (A4). Exporta window.RxPDF.build(rx, cfg). */
(function () {
  "use strict";
  var MM = 1, W = 210, H = 297, L = 18, R = W - 18;

  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/[−‐‑]/g, "-").replace(/×/g, "x").replace(/µ/g, "mc").replace(/³/g, "3").replace(/²/g, "2")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—…•°ºª€]/g, "").trim();
  }
  function lines(s) { return String(s || "").split(/\n+/).map(function (x) { return clean(x.replace(/^\s*[-•*]\s*/, "")); }).filter(Boolean); }

  function P(doc) { this.d = doc; }
  P.prototype.f = function (st, sz) { this.d.setFont("helvetica", st); this.d.setFontSize(sz); };
  P.prototype.wrap = function (txt, x, y, w, sz, st, lead) {
    this.f(st || "normal", sz); lead = lead || sz * 0.3528 * 1.38;
    var ls = this.d.splitTextToSize(clean(txt), w);
    for (var i = 0; i < ls.length; i++) { this.d.text(ls[i], x, y); y += lead; }
    return y;
  };
  P.prototype.measure = function (txt, w, sz, lead) {
    this.f("normal", sz); lead = lead || sz * 0.3528 * 1.38;
    return this.d.splitTextToSize(clean(txt), w).length * lead;
  };

  function header(p, cfg, rx, titulo, via) {
    var d = p.d, E = cfg.estab || {};
    p.f("bold", 13); d.text(clean(E.nome || "ESTABELECIMENTO DE SAÚDE").toUpperCase(), L, 20);
    p.f("normal", 8.5); d.setTextColor(85);
    d.text(clean([E.cidade, E.cnes ? "CNES " + E.cnes : "", "Sistema Único de Saúde"].filter(Boolean).join("  ·  ")), L, 25);
    if (via) { p.f("bold", 8.5); d.text(via, R, 20, { align: "right" }); }
    d.setTextColor(0); d.setLineWidth(0.45); d.line(L, 28, R, 28);
    p.f("bold", 15); d.text(titulo, W / 2, 38, { align: "center" });
    var y = 48, P_ = rx.pac || {};
    p.f("normal", 8.5); d.setTextColor(85); d.text("PACIENTE", L, y - 4.2); d.text("DATA", R - 45, y - 4.2); d.setTextColor(0);
    p.f("bold", 11.5); d.text(clean(P_.nome).toUpperCase() || " ", L, y);
    p.f("normal", 11); d.text(clean(rx.data) || " ", R - 45, y);
    var sub = [];
    if (P_.cns) sub.push("CNS " + String(P_.cns).replace(/\D/g, "").replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4"));
    if (P_.nasc) { var a = age(P_.nasc); sub.push("Nascimento " + P_.nasc + (a != null ? " (" + a + " anos)" : "")); }
    p.f("normal", 9.5); if (sub.length) d.text(clean(sub.join("   ·   ")), L, y + 5.5);
    d.setLineWidth(0.15); d.line(L, y + 9, R, y + 9);
    return y + 17;
  }
  function age(n) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(n || ""); if (!m) return null; var b = new Date(+m[3], +m[2] - 1, +m[1]), t = new Date(), a = t.getFullYear() - b.getFullYear(); if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--; return a >= 0 && a < 130 ? a : null; }

  function sign(p, cfg, y) {
    var d = p.d, S = cfg.sol || {};
    d.setLineWidth(0.25); d.line(W / 2 - 45, y, W / 2 + 45, y);
    p.f("bold", 10.5); d.text(clean(S.nome ? "Dr(a). " + titleCase(S.nome) : "Médico(a)"), W / 2, y + 5, { align: "center" });
    p.f("normal", 9.5); d.text(clean([S.conselho, "Médico(a)"].filter(Boolean).join("  ·  ")), W / 2, y + 10, { align: "center" });
  }
  function titleCase(s) { return String(s).toLowerCase().replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, function (x) { return x.toLowerCase(); }); }

  function receita(doc, rx, cfg, via) {
    var p = new P(doc), d = doc;
    var y = header(p, cfg, rx, "RECEITUÁRIO", via);
    var itens = (rx.itens || []).filter(function (i) { return i && clean(i.med); });
    var groups = [], idx = {};
    itens.forEach(function (it) { var v = clean(it.via || "Uso oral").toUpperCase(); if (!(v in idx)) { idx[v] = groups.length; groups.push({ via: v, itens: [] }); } groups[idx[v]].itens.push(it); });
    var n = 0, bottomLimit = H - 62;
    groups.forEach(function (g) {
      if (y > bottomLimit - 20) { sign(p, cfg, H - 42); d.addPage(); y = header(p, cfg, rx, "RECEITUÁRIO (continuação)", via); }
      p.f("bold", 11); d.text(g.via, L, y); y += 8.5;
      g.itens.forEach(function (it) {
        n++;
        var need = 7 + p.measure(it.pos, R - L - 7, 10.5) + 4;
        if (y + need > bottomLimit) { sign(p, cfg, H - 42); d.addPage(); y = header(p, cfg, rx, "RECEITUÁRIO (continuação)", via); }
        var name = n + ".  " + clean(it.med), qtd = clean(it.qtd);
        p.f("bold", 11.5); d.text(name, L, y);
        var nx = L + d.getTextWidth(name) + 3;
        p.f("normal", 10.5); var qx = R - (qtd ? d.getTextWidth(qtd) : 0) - 3;
        if (qtd) {
          d.setTextColor(120); var dw = d.getTextWidth("."), k = Math.max(0, Math.floor((qx - nx) / dw));
          if (k > 2) d.text(new Array(k + 1).join("."), nx, y);
          d.setTextColor(0); d.text(qtd, R, y, { align: "right" });
        }
        y = p.wrap(it.pos, L + 7, y + 5.8, R - L - 7, 10.5) + 4;
      });
      y += 2;
    });
    if (!itens.length) { p.f("italic", 10.5); d.setTextColor(120); d.text("(sem medicamentos prescritos)", L, y); d.setTextColor(0); y += 8; }
    if (clean(rx.naoUsar)) {
      var h = p.measure(rx.naoUsar, R - L - 8, 10) + 11;
      if (y + h > bottomLimit + 8) { sign(p, cfg, H - 42); d.addPage(); y = header(p, cfg, rx, "RECEITUÁRIO (continuação)", via); }
      d.setLineWidth(0.3); d.rect(L, y, R - L, h);
      p.f("bold", 10.5); d.text("NÃO USAR até a reavaliação médica:", L + 4, y + 6);
      p.wrap(rx.naoUsar, L + 4, y + 11.5, R - L - 8, 10);
    }
    sign(p, cfg, H - 42);
  }

  function orientacoes(doc, rx, cfg) {
    var p = new P(doc), d = doc;
    var y = header(p, cfg, rx, "ORIENTAÇÕES PARA CASA");
    var limit = H - 48;
    function newPage() { sign(p, cfg, H - 30); d.addPage(); y = header(p, cfg, rx, "ORIENTAÇÕES PARA CASA (continuação)"); }
    function section(title, items) {
      if (!items.length) return;
      if (y + 14 > limit) newPage();
      p.f("bold", 11.5); d.text(title, L, y); y += 6.5;
      items.forEach(function (t) {
        var hh = p.measure(t, R - L - 5, 10.5) + 1.5;
        if (y + hh > limit) newPage();
        p.f("normal", 10.5); d.text("•", L + 1, y);
        y = p.wrap(t, L + 5, y, R - L - 5, 10.5) + 1.5;
      });
      y += 4;
    }
    section("O QUE FOI VISTO HOJE", lines(rx.visto));
    section("COMO SE CUIDAR", lines(rx.cuidados));
    var al = lines(rx.alarme);
    if (al.length) {
      var heights = al.map(function (t) { return p.measure(t, R - L - 16, 11, 5.2); });
      var bh = heights.reduce(function (a, b) { return a + b + 0.9; }, 0) + 13;
      if (y + bh > limit) newPage();
      d.setFillColor(243, 243, 243); d.setLineWidth(0.5); d.rect(L, y - 4, R - L, bh, "FD");
      p.f("bold", 12.5); d.text("VOLTE IMEDIATAMENTE AO HOSPITAL SE TIVER:", L + 4, y + 2);
      var yy = y + 9.5;
      al.forEach(function (t, i) { p.f("bold", 11); d.text("!", L + 5, yy); yy = p.wrap(t, L + 10, yy, R - L - 16, 11, "normal", 5.2) + 0.9; });
      y = y - 4 + bh + 8;
    }
    if (clean(rx.retorno)) {
      var rh = p.measure(rx.retorno, R - L, 10.5) + 8;
      if (y + rh > limit) newPage();
      p.f("bold", 11.5); d.text("RETORNO PROGRAMADO", L, y); y += 6.5;
      y = p.wrap(rx.retorno, L, y, R - L, 10.5);
    }
    sign(p, cfg, H - 30);
  }

  function build(rx, cfg) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    doc.setProperties({ title: "Receita e orientações - " + clean((rx.pac || {}).nome), creator: "Laudo APAC Express" });
    var pages = 0;
    if (rx.duasVias) {
      receita(doc, rx, cfg, "1ª VIA — FARMÁCIA"); doc.addPage();
      receita(doc, rx, cfg, "2ª VIA — PACIENTE");
    } else receita(doc, rx, cfg, "");
    var hasOri = lines(rx.visto).length || lines(rx.cuidados).length || lines(rx.alarme).length || clean(rx.retorno);
    if (hasOri) { doc.addPage(); orientacoes(doc, rx, cfg); }
    return { doc: doc, pages: doc.getNumberOfPages() };
  }

  window.RxPDF = { build: build };
})();
