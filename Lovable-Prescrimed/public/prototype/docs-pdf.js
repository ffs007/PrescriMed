/* Documentos do PS em PDF (jsPDF): prescrição médica hospitalar, encaminhamento, relatório de transferência e evolução.
   window.DocPDF.build({kind, title, pac, sections, items, cfg, data, extraHeader}) -> {doc, pages} */
(function () {
  "use strict";
  var W = 210, H = 297, L = 14, R = W - 14;
  function clean(s) {
    return String(s == null ? "" : s).replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[−‐‑]/g, "-")
      .replace(/µ/g, "mc").replace(/₂/g, "2").replace(/³/g, "3").replace(/⁸/g, "8").replace(/¹/g, "1").replace(/⁰/g, "0").replace(/→/g, "->").replace(/×/g, "x").replace(/÷/g, "/")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—…•°ºª]/g, "").trim();
  }
  function build(o) {
    var jsPDF = window.jspdf.jsPDF, doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    var E = (o.cfg && o.cfg.estab) || {}, S = (o.cfg && o.cfg.sol) || {}, P = o.pac || {};
    doc.setProperties({ title: clean(o.title + " - " + (P.nome || "")), creator: "PrescriMed" });
    var y = 0, page = 1;
    function f(st, sz) { doc.setFont("helvetica", st); doc.setFontSize(sz); }
    function header() {
      f("bold", 10.5); doc.text(clean(E.nome || ""), L, 14); f("normal", 8); doc.text(clean([E.cnes ? "CNES " + E.cnes : "", E.endereco, E.cidade].filter(Boolean).join("  ·  ")), L, 18.5);
      f("bold", 13); doc.text(clean(o.title), R, 14, { align: "right" }); f("normal", 8); doc.text(clean(o.data || ""), R, 18.5, { align: "right" });
      doc.setLineWidth(0.4); doc.line(L, 21, R, 21);
      f("normal", 8.5);
      var row1 = [["Paciente", P.nome], ["Idade", P.idade], ["Sexo", P.sexo]], row2 = [["Peso", P.peso ? P.peso + " kg" : ""], ["CNS", P.cns], ["Leito/setor", P.leito || ""], ["Alergias", P.alergias || "NEGA (confirmar)"]];
      var x = L; y = 26.5;
      row1.forEach(function (c, i) { f("bold", 7); doc.text(c[0].toUpperCase(), x, y - 3.2); f(i === 0 ? "bold" : "normal", 10); doc.text(clean(c[1] || "—"), x, y + 1); x += i === 0 ? 120 : 30; });
      x = L; y = 34.5;
      row2.forEach(function (c, i) { f("bold", 7); doc.text(c[0].toUpperCase(), x, y - 3.2); f(c[0] === "Alergias" && P.alergias ? "bold" : "normal", 9); var t = doc.splitTextToSize(clean(c[1] || "—"), i === 3 ? R - x : 40); doc.text(t[0], x, y + 1); x += [22, 48, 30, 0][i]; });
      if (o.extraHeader) { f("normal", 8.5); doc.text(doc.splitTextToSize(clean(o.extraHeader), R - L), L, 41.5); y = 47; } else y = 42;
      doc.setLineWidth(0.2); doc.line(L, y - 2, R, y - 2);
    }
    function footer() {
      doc.setLineWidth(0.2); doc.line(W / 2 + 6, H - 24, R, H - 24);
      f("bold", 9); doc.text(clean(S.nome || ""), (W / 2 + 6 + R) / 2, H - 20, { align: "center" }); f("normal", 8.5); doc.text(clean(S.conselho || ""), (W / 2 + 6 + R) / 2, H - 16.5, { align: "center" });
      f("normal", 7); doc.text("Página " + page, L, H - 10); doc.text("Gerado no PrescriMed — conferir antes de assinar", R, H - 10, { align: "right" });
    }
    function need(h) { if (y + h > H - 30) { footer(); doc.addPage(); page++; header(); } }
    header();
    if (o.items) {
      f("bold", 8); doc.text("Nº", L, y + 2); doc.text("PRESCRIÇÃO", L + 9, y + 2); if (o.horario !== false) doc.text("HORÁRIOS / CHECAGEM", R - 2, y + 2, { align: "right" });
      y += 5; doc.setLineWidth(0.15); doc.line(L, y - 1.5, R, y - 1.5);
      var colW = o.horario === false ? R - L - 10 : R - L - 52;
      o.items.forEach(function (it, i) {
        if (it.sec) { need(9); f("bold", 8.2); doc.setTextColor(90); doc.text(clean(it.sec).toUpperCase(), L, y + 3); doc.setTextColor(0); y += 6; return; }
        f("normal", 9.6); var ls = doc.splitTextToSize(clean(it.text), colW); var h = ls.length * 4.3 + 3;
        need(h); f("bold", 9.6); doc.text(String(it.n) + ".", L + 1, y + 3); f("normal", 9.6); doc.text(ls, L + 9, y + 3);
        if (o.horario !== false) { doc.setDrawColor(170); doc.rect(R - 50, y - 0.5, 50, Math.max(h - 1, 6)); doc.setDrawColor(0); }
        y += h; doc.setLineWidth(0.1); doc.setDrawColor(210); doc.line(L, y - 1, o.horario === false ? R : R - 51, y - 1); doc.setDrawColor(0);
      });
      y += 3;
    }
    (o.sections || []).forEach(function (sx) {
      if (!sx || (!sx.text && !(sx.list && sx.list.length))) return;
      need(12); f("bold", 9); doc.text(clean(sx.h).toUpperCase(), L, y + 3); y += 6.5;
      var body = sx.list ? sx.list.map(function (l) { return "• " + l; }).join("\n") : sx.text;
      f("normal", 10); clean(body).split("\n").forEach(function (para) {
        var ls = doc.splitTextToSize(para, R - L); ls.forEach(function (ln) { need(5); doc.text(ln, L, y + 3); y += 4.6; });
      });
      y += 3;
    });
    footer();
    return { doc: doc, pages: page };
  }
  window.DocPDF = { build: build, clean: clean };
})();
