/* Receita de Controle Especial — modelo físico vigente da Anvisa (Versão 2, RDC 1.000/2025, rev. 13/03/2026).
   Cada receita: até 3 medicamentos, impressa em 2 vias (1ª retenção pela farmácia, 2ª paciente).
   Exporta window.CtrlPDF.build(ctrl, cfg) e window.CtrlPDF.extenso / formatQtd. */
(function () {
  "use strict";
  var W = 210, H = 297, L = 15, R = W - 15;

  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/[−‐‑]/g, "-").replace(/µ/g, "mc").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—…•°ºª]/g, "").trim();
  }

  // ---------- número por extenso (pt-BR), 0–9999, com gênero ----------
  var U = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var T = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  function fem(w) { return w.replace(/^um$/, "uma").replace(/^dois$/, "duas").replace(/entos$/, "entas"); }
  function ate999(n, f) {
    if (n === 0) return "";
    if (n === 100) return "cem";
    var c = Math.floor(n / 100), r = n % 100, parts = [];
    if (c) parts.push(f ? fem(C[c]) : C[c]);
    if (r) {
      if (r < 20) parts.push(f ? fem(U[r]) : U[r]);
      else { var t = Math.floor(r / 10), u = r % 10; parts.push(T[t] + (u ? " e " + (f ? fem(U[u]) : U[u]) : "")); }
    }
    return parts.join(" e ");
  }
  function extenso(n, f) {
    n = Math.floor(Number(n)); if (!isFinite(n) || n < 0) return "";
    if (n === 0) return "zero";
    if (n > 9999) return String(n);
    var m = Math.floor(n / 1000), r = n % 1000, out = "";
    if (m) out = (m === 1 ? "mil" : ate999(m, f) + " mil");
    if (r) out += (out ? ((r < 100 || r % 100 === 0) ? " e " : " ") : "") + ate999(r, f);
    return out;
  }
  var FEM = /^(c[aá]psula|ampola|caixa|dr[aá]gea|gota|bisnaga|seringa|unidade|pastilha|bolsa|cartela|dose|solu[cç][aã]o|suspens[aã]o)/i;
  function formatQtd(q) {
    q = clean(q);
    if (!q || /\(\s*[a-zà-ú]/i.test(q)) return q;
    var m = /^\s*(\d+)\s*(.*)$/.exec(q); if (!m) return q;
    var n = parseInt(m[1], 10), unit = m[2].trim();
    return n + " (" + extenso(n, FEM.test(unit)) + ")" + (unit ? " " + unit : "");
  }

  function P(doc) { this.d = doc; }
  P.prototype.f = function (st, sz) { this.d.setFont("helvetica", st); this.d.setFontSize(sz); };
  P.prototype.wrap = function (t, x, y, w, sz, st, lead) {
    this.f(st || "normal", sz); lead = lead || sz * 0.3528 * 1.35;
    var ls = this.d.splitTextToSize(clean(t), w);
    for (var i = 0; i < ls.length; i++) { this.d.text(ls[i], x, y); y += lead; }
    return y;
  };
  P.prototype.bar = function (y, t) {
    var d = this.d; d.setLineWidth(0.3); d.rect(L + 5, y, R - L - 10, 5.2);
    this.f("bold", 8.5); d.text(t, W / 2, y + 3.7, { align: "center" });
    return y + 5.2;
  };
  P.prototype.label = function (lbl, val, x, y, w) {
    this.f("normal", 9); this.d.text(lbl, x, y);
    var lw = this.d.getTextWidth(lbl + " ");
    if (val) { this.f("bold", 10); var t = this.d.splitTextToSize(clean(val), w - lw); this.d.text(t[0] || "", x + lw, y); return t.length > 1 ? this.wrap(t.slice(1).join(" "), x + lw, y + 4.6, w - lw, 10, "bold", 4.6) : y + 6.2; }
    this.d.setLineWidth(0.15); this.d.line(x + lw, y + 0.8, x + w, y + 0.8); return y + 6.2;
  };

  function via(doc, c, cfg, itens, nVia, idx, total) {
    var p = new P(doc), d = doc, E = cfg.estab || {}, S = cfg.sol || {}, Pc = c.pac || {};
    p.f("bold", 14); d.text("RECEITA DE CONTROLE ESPECIAL", W / 2, 20, { align: "center" });
    p.f("bold", 8); d.text(nVia === 1 ? "1ª VIA" : "2ª VIA", R, 13, { align: "right" });
    if (total > 1) { p.f("normal", 7.5); d.text("Receita " + idx + " de " + total, L, 13); }

    var y = p.bar(26, "IDENTIFICAÇÃO DO EMITENTE") + 5.5;
    p.f("bold", 10.5); d.text(clean(E.nome || "").toUpperCase() + (E.cnes ? "  —  CNES " + E.cnes : ""), L, y); y += 5;
    p.f("normal", 9.5);
    var end = [E.endereco, E.cidade].filter(Boolean).map(clean).join("  —  ");
    y = p.wrap(end || "(endereço do estabelecimento não configurado)", L, y, R - L, 9.5) + 0.5;
    if (E.telefone) { d.text("Telefone: " + clean(E.telefone), L, y); y += 4.6; }

    y = p.bar(y + 2, "IDENTIFICAÇÃO DO PACIENTE") + 6;
    y = p.label("NOME COMPLETO:", clean(Pc.nome).toUpperCase(), L, y, R - L);
    y = p.label("ENDEREÇO COMPLETO:", clean(Pc.end).toUpperCase(), L, y, R - L);
    var cpf = Pc.semCpf ? "NÃO POSSUI" : String(Pc.cpf || "").replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    y = p.label("CPF ou, se estrangeiro, PASSAPORTE Nº:", cpf, L, y, R - L);

    y = p.bar(y + 1, "PRESCRIÇÃO") + 7;
    var boxTop = 186;
    itens.forEach(function (it, i) {
      var name = (i + 1) + ")  " + clean(it.med), q = formatQtd(it.qtd);
      p.f("bold", 11); var nl = d.splitTextToSize(name, R - L - 4 - (q ? Math.min(70, d.getTextWidth(q) + 6) : 0));
      d.text(nl, L + 2, y);
      if (q) { p.f("bold", 10.5); d.text(q, R - 2, y, { align: "right" }); }
      y += nl.length * 5;
      y = p.wrap(it.pos, L + 8, y + 0.6, R - L - 10, 10.5) + 4;
    });
    if (y > boxTop - 2) boxTop = Math.min(y + 2, 205);

    // data e prescritor
    d.setLineWidth(0.3); d.rect(L + 5, boxTop, R - L - 10, 25);
    p.f("bold", 9); d.text("DATA:", L + 7, boxTop + 5.5);
    p.f("normal", 10.5); d.text(clean(c.data), L + 19, boxTop + 5.5);
    p.f("bold", 9); d.text("IDENTIFICAÇÃO E ASSINATURA DO PRESCRITOR:", L + 7, boxTop + 11);
    d.setLineWidth(0.2); d.line(W / 2 - 10, boxTop + 17.5, R - 10, boxTop + 17.5);
    p.f("bold", 9.5); d.text(clean(S.nome).toUpperCase(), (W / 2 - 10 + R - 10) / 2, boxTop + 21, { align: "center" });
    p.f("normal", 9); d.text(clean(S.conselho), (W / 2 - 10 + R - 10) / 2, boxTop + 24.3, { align: "center" });

    // comprador (preenchimento opcional / carimbo da farmácia)
    y = p.bar(boxTop + 30, "IDENTIFICAÇÃO DO COMPRADOR");
    p.f("italic", 6.6);
    d.text("*IMPRESSÃO OPCIONAL - CONFORME PORTARIA Nº 6/99, ARTIGO 85, ALÍNEA C, ESSES DADOS PODEM SER APOSTOS MEDIANTE", L + 5, y + 2.6);
    d.text("CARIMBO PELA FARMÁCIA NO MOMENTO DA DISPENSAÇÃO.", L + 5, y + 5.2);
    y += 11;
    y = p.label("NOME COMPLETO:", "", L, y, R - L);
    y = p.label("CPF ou, se estrangeiro, PASSAPORTE Nº:", "", L, y, R - L);
    y = p.label("ENDEREÇO COMPLETO:", "", L, y, R - L);
    p.label("CIDADE:", "", L, y, 95); p.label("UF:", "", L + 100, y, 30); y += 6.2;
    p.label("TELEFONE:", "", L, y, 95);

    p.f("bolditalic", 9.5); d.text("1ª via - Retenção pela Farmácia / 2ª via - Paciente", R, H - 16, { align: "right" });
    p.f("italic", 6.8); d.text("DATA DE IMPRESSÃO DESTE RECEITUÁRIO: " + clean(c.impressao || c.data) + " (recomendável)", R, H - 11.5, { align: "right" });
  }

  function build(c, cfg) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    doc.setProperties({ title: "Receita de Controle Especial - " + clean((c.pac || {}).nome), creator: "Laudo APAC Express" });
    var itens = (c.itens || []).filter(function (i) { return i && clean(i.med); });
    var chunks = []; for (var i = 0; i < itens.length; i += 3) chunks.push(itens.slice(i, i + 3));
    var first = true;
    chunks.forEach(function (ch, k) {
      [1, 2].forEach(function (v) { if (!first) doc.addPage(); first = false; via(doc, c, cfg, ch, v, k + 1, chunks.length); });
    });
    return { doc: doc, receitas: chunks.length, pages: doc.getNumberOfPages() };
  }

  window.CtrlPDF = { build: build, extenso: extenso, formatQtd: formatQtd };
})();
