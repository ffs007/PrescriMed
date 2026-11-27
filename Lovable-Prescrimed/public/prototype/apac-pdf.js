/* Laudo para Solicitação/Autorização de Procedimento Ambulatorial (APAC) — gerador vetorial.
   Reproduz a numeração de campos 1–55 do modelo oficial do Ministério da Saúde (fls. 1/2).
   Depende de window.jspdf (jsPDF 2.5.x). Exporta window.ApacPDF. */
(function () {
  "use strict";
  var L = 10, R = 200;

  // jsPDF/Helvetica usa WinAnsi: normaliza símbolos fora do conjunto
  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/[←]/g, "<-")
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[−‐‑]/g, "-").replace(/×/g, "x")
      .replace(/µ/g, "u").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—…•°ºª€]/g, "");
  }
  function up(s) { return clean(s).toUpperCase().replace(/\s+/g, " ").trim(); }
  function digits(s) { return String(s == null ? "" : s).replace(/\D/g, ""); }

  function Sheet(doc) { this.d = doc; }

  Sheet.prototype.font = function (style, size) { this.d.setFont("helvetica", style); this.d.setFontSize(size); };

  Sheet.prototype.bar = function (y, text) {
    var d = this.d;
    d.setFillColor(0, 0, 0); d.rect(L, y, R - L, 4.3, "F");
    d.setTextColor(255, 255, 255); this.font("bold", 7.6);
    d.text(text, (L + R) / 2, y + 3.1, { align: "center" });
    d.setTextColor(0, 0, 0);
  };

  Sheet.prototype.field = function (x1, y, x2, h, label) {
    var d = this.d;
    d.setDrawColor(0); d.setLineWidth(0.22);
    d.roundedRect(x1, y, x2 - x1, h, 1.1, 1.1, "S");
    if (label) {
      var ls = 4.6; this.font("normal", ls);
      while (d.getTextWidth(label) > x2 - x1 - 2.4 && ls > 3.4) { ls -= 0.2; d.setFontSize(ls); }
      d.text(label, x1 + 1.4, y + 2.1);
    }
  };

  // Texto ajustado à largura (reduz fonte; trunca se preciso)
  Sheet.prototype.fit = function (txt, x, y, maxW, size, opts) {
    var d = this.d, s = size, min = (opts && opts.min) || 5.5;
    txt = up(txt); if (!txt) return;
    this.font((opts && opts.style) || "normal", s);
    while (d.getTextWidth(txt) > maxW && s > min) { s -= 0.25; d.setFontSize(s); }
    while (d.getTextWidth(txt) > maxW && txt.length > 1) txt = txt.slice(0, -2) + "…";
    d.text(txt, x, y, opts && opts.align ? { align: opts.align } : undefined);
  };

  // Caixas de caracteres (CNES, CNS, código, CEP…)
  Sheet.prototype.boxes = function (x1, y, x2, h, n, value) {
    var d = this.d, w = (x2 - x1 - 2) / n, bx = x1 + 1, top = y + h * 0.42;
    d.setLineWidth(0.18);
    for (var i = 1; i < n; i++) d.line(bx + i * w, top, bx + i * w, y + h - 0.4);
    var v = String(value || "");
    this.font("normal", Math.min(9, w * 2.6));
    for (var j = 0; j < Math.min(n, v.length); j++) d.text(v[j], bx + j * w + w / 2, y + h - 1.7, { align: "center" });
  };

  Sheet.prototype.check = function (x, y, on) {
    var d = this.d; d.setLineWidth(0.2); d.rect(x, y, 2.6, 2.6, "S");
    if (on) { this.font("bold", 7.5); d.text("X", x + 1.3, y + 2.2, { align: "center" }); }
  };

  Sheet.prototype.multiline = function (txt, x1, y, x2, h, size) {
    var d = this.d, s = size, maxW = x2 - x1 - 3, lines;
    txt = clean(txt).replace(/\r/g, "").trim(); if (!txt) return;
    for (;;) {
      this.font("normal", s);
      lines = d.splitTextToSize(txt, maxW);
      var lh = s * 0.3528 * 1.18;
      if (lines.length * lh <= h - 4 || s <= 5.6) {
        var max = Math.floor((h - 4) / lh);
        if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = lines[max - 1].replace(/.{0,2}$/, "…"); }
        d.text(lines, x1 + 1.5, y + 4.6, { lineHeightFactor: 1.18 });
        return;
      }
      s -= 0.25;
    }
  };

  function header(S) {
    var d = S.d;
    d.setLineWidth(0.3); d.rect(L, 7, R - L, 14.5, "S");
    // bloco institucional (texto, sem logotipo)
    S.font("bold", 15); d.text("SUS", L + 3, 16.4);
    S.font("bold", 6.4);
    d.text(["Sistema", "Único de", "Saúde"], L + 18, 11.6, { lineHeightFactor: 1.15 });
    d.text(["Ministério", "da", "Saúde"], L + 33, 11.6, { lineHeightFactor: 1.15 });
    d.setLineWidth(0.22); d.line(L + 49, 7, L + 49, 21.5);
    S.font("bolditalic", 11.2);
    d.text("LAUDO PARA SOLICITAÇÃO/AUTORIZAÇÃO DE", 129, 13.2, { align: "center" });
    d.text("PROCEDIMENTO AMBULATORIAL", 129, 18.2, { align: "center" });
    S.font("bolditalic", 8.5); d.text("fls.1/2", R - 1.5, 10.2, { align: "right" });
  }

  function phone(S, x1, y, x2, h, tel) {
    var t = digits(tel), ddd = "", num = "";
    if (t.length >= 10) { ddd = t.slice(0, 2); num = t.slice(2); } else { num = t; }
    S.font("normal", 4.3); S.d.text("DDD", x1 + 1.5, y + 4.4); S.d.text("Nº DO TELEFONE", x1 + 26, y + 4.4);
    S.d.setLineWidth(0.18); S.d.line(x1 + 10, y + h * 0.5, x1 + 10, y + h - 0.4);
    S.fit(ddd, x1 + 3.2, y + h - 1.7, 6, 8.5);
    if (num.length > 5) num = num.slice(0, num.length - 4) + "-" + num.slice(-4);
    S.fit(num, x1 + 12, y + h - 1.7, x2 - x1 - 14, 8.5);
  }

  function dateBoxes(S, x1, y, x2, h, dt) {
    var p = String(dt || "").split("/");
    var w = (x2 - x1) / 3; S.font("normal", 8.5);
    S.d.text("/", x1 + w, y + h - 1.7, { align: "center" });
    S.d.text("/", x1 + 2 * w, y + h - 1.7, { align: "center" });
    if (p.length === 3) {
      S.d.text(p[0], x1 + w / 2, y + h - 1.7, { align: "center" });
      S.d.text(p[1], x1 + 1.5 * w, y + h - 1.7, { align: "center" });
      S.d.text(p[2], x1 + 2.5 * w, y + h - 1.7, { align: "center" });
    }
  }

  function drawSheet(S, r, procs) {
    var d = S.d, P = r.pac || {}, D = r.diag || {}, sol = r.sol || {}, E = r.estab || {}, X = r.exec || {};
    var y, h = 8.6, g = 1.15;
    header(S);

    y = 22.6; S.bar(y, "IDENTIFICAÇÃO DO ESTABELECIMENTO DE SAÚDE (SOLICITANTE)"); y += 5.2;
    S.field(L, y, 160, h, "1 - NOME DO ESTABELECIMENTO DE SAÚDE SOLICITANTE"); S.fit(E.nome, L + 1.6, y + h - 1.8, 146, 9);
    S.field(162, y, R, h, "2 - CNES"); S.boxes(162, y, R, h, 7, digits(E.cnes));
    y += h + 1.5;

    S.bar(y, "IDENTIFICAÇÃO DO PACIENTE"); y += 5.2;
    S.field(L, y, 165, h, "3 - NOME DO PACIENTE"); S.fit(P.nome, L + 1.6, y + h - 1.8, 151, 9.5, { style: "bold" });
    S.field(167, y, R, h, "4 - Nº DO PRONTUÁRIO"); S.fit(P.prontuario, 168.6, y + h - 1.8, 30, 8.5);
    y += h + g;
    S.field(L, y, 100, h, "5 - CARTÃO NACIONAL DE SAÚDE (CNS)"); S.boxes(L, y, 100, h, 15, digits(P.cns));
    S.field(102, y, 135, h, "6 - DATA DE NASCIMENTO"); dateBoxes(S, 103, y, 134, h, P.nasc);
    S.field(137, y, 170, h, "7 - SEXO");
    S.font("normal", 5.2); d.text("Masc.", 138.6, y + 6.9); d.text("Fem.", 154.6, y + 6.9);
    S.check(145.6, y + 4.6, /^M/i.test(P.sexo || "")); S.check(160.8, y + 4.6, /^F/i.test(P.sexo || ""));
    S.field(172, y, R, h, "8 - RAÇA/COR"); S.fit(P.raca, 173.4, y + h - 1.8, 25.5, 8);
    y += h + g;
    S.field(L, y, 140, h, "9 - NOME DA MÃE"); S.fit(P.mae, L + 1.6, y + h - 1.8, 126, 9);
    S.field(142, y, R, h, "10 - TELEFONE DE CONTATO"); phone(S, 142, y, R, h, P.tel);
    y += h + g;
    S.field(L, y, 140, h, "11 - NOME DO RESPONSÁVEL"); S.fit(P.resp, L + 1.6, y + h - 1.8, 126, 9);
    S.field(142, y, R, h, "12 - TELEFONE DE CONTATO"); phone(S, 142, y, R, h, P.telResp);
    y += h + g;
    S.field(L, y, R, h, "13 - ENDEREÇO (RUA, Nº, BAIRRO)"); S.fit(P.end, L + 1.6, y + h - 1.8, R - L - 4, 9);
    y += h + g;
    S.field(L, y, 118, h, "14 - MUNICÍPIO DE RESIDÊNCIA"); S.fit(P.mun, L + 1.6, y + h - 1.8, 104, 9);
    S.field(120, y, 152, h, "15 - CÓD. IBGE MUNICÍPIO"); S.boxes(120, y, 152, h, 7, digits(P.ibge));
    S.field(154, y, 168, h, "16 - UF"); S.boxes(154, y, 168, h, 2, up(P.uf).slice(0, 2));
    S.field(170, y, R, h, "17 - CEP"); S.boxes(170, y, R, h, 8, digits(P.cep));
    y += h + 1.5;

    S.bar(y, "PROCEDIMENTO SOLICITADO"); y += 5.2;
    var p0 = procs[0] || {};
    S.field(L, y, 72, h, "18 - CÓDIGO DO PROCEDIMENTO PRINCIPAL"); S.boxes(L, y, 72, h, 10, digits(p0.codigo));
    S.field(74, y, 182, h, "19 - NOME DO PROCEDIMENTO PRINCIPAL"); S.fit(p0.nome, 75.6, y + h - 1.8, 104.5, 8.8, { style: "bold" });
    S.field(184, y, R, h, "20 - QTDE."); S.fit(p0.nome ? String(p0.qtd || 1) : "", 192, y + h - 1.8, 13, 9, { align: "center" });
    y += h + 1.5;

    S.bar(y, "PROCEDIMENTO(S) SECUNDÁRIO(S)"); y += 5.2;
    var hs = 7.9;
    for (var i = 1; i <= 5; i++) {
      var p = procs[i] || {}, n = 21 + (i - 1) * 3;
      S.field(L, y, 72, hs, n + " - CÓDIGO DO PROCEDIMENTO SECUNDÁRIO"); S.boxes(L, y, 72, hs, 10, digits(p.codigo));
      S.field(74, y, 182, hs, (n + 1) + " - NOME DO PROCEDIMENTO SECUNDÁRIO"); S.fit(p.nome, 75.6, y + hs - 1.7, 104.5, 8.4);
      S.field(184, y, R, hs, (n + 2) + " - QTDE."); S.fit(p.nome ? String(p.qtd || 1) : "", 192, y + hs - 1.7, 13, 8.6, { align: "center" });
      y += hs + 0.9;
    }
    y += 0.6;

    S.bar(y, "JUSTIFICATIVA DO(S) PROCEDIMENTO(S) SOLICITADO(S)"); y += 5.2;
    var hj = 9.5;
    S.field(L, y, 125, hj, "36 - DESCRIÇÃO DO DIAGNÓSTICO"); S.fit(D.desc, L + 1.6, y + hj - 1.9, 111, 8.6);
    S.field(127, y, 151, hj, "37 - CID10 PRINCIPAL"); S.fit(cid(D.cidP), 139, y + hj - 1.9, 22, 9.5, { style: "bold", align: "center" });
    S.field(153, y, 176, hj, "38 - CID10 SECUNDÁRIO"); S.fit(cid(D.cidS), 164.5, y + hj - 1.9, 21, 9.5, { align: "center" });
    S.field(178, y, R, hj, "39 - CID10 CAUSAS ASSOCIADAS"); S.fit(cid(D.cidC), 189, y + hj - 1.9, 20, 9.5, { align: "center" });
    y += hj + g;
    var ho = 29;
    S.field(L, y, R, ho, "40 - OBSERVAÇÕES"); S.multiline(r.obsSheet != null ? r.obsSheet : r.obs, L, y + 0.6, R, ho, 8.2);
    y += ho + 1.5;

    S.bar(y, "SOLICITAÇÃO"); y += 5.2;
    var top = y;
    S.field(L, y, 108, h, "41 - NOME DO PROFISSIONAL SOLICITANTE"); S.fit(sol.nome, L + 1.6, y + h - 1.8, 94, 9);
    S.field(110, y, 140, h, "42 - DATA DA SOLICITAÇÃO"); dateBoxes(S, 111, y, 139, h, sol.data);
    y += h + g;
    S.field(L, y, 48, h, "43 - DOCUMENTO");
    S.font("normal", 5.6); d.text("CNS", 17.5, y + 6.8); d.text("CPF", 34.5, y + 6.8);
    S.check(13.4, y + 4.6, sol.docNum && sol.docTipo !== "CPF"); S.check(30.4, y + 4.6, sol.docNum && sol.docTipo === "CPF");
    S.field(50, y, 140, h, "44 - Nº DOCUMENTO (CNS/CPF) DO PROFISSIONAL SOLICITANTE");
    S.boxes(50, y, 140, h, sol.docTipo === "CPF" ? 11 : 15, digits(sol.docNum));
    S.field(142, top, R, y + h - top, "45 - ASSINATURA E CARIMBO (Nº REGISTRO DO CONSELHO)");
    if (sol.carimbo) {
      d.setLineWidth(0.15); d.line(147, y + h - 6.2, R - 5, y + h - 6.2);
      S.fit(sol.nome, (142 + R) / 2, y + h - 3.6, 54, 6.4, { align: "center", style: "bold" });
      S.fit(sol.conselho, (142 + R) / 2, y + h - 1.2, 54, 6.2, { align: "center" });
    }
    y += h + 1.5;

    S.bar(y, "AUTORIZAÇÃO"); y += 5.2;
    var at = y, ha = 8.2;
    S.field(L, y, 108, ha, "46 - NOME DO PROFISSIONAL AUTORIZADOR");
    S.field(110, y, 145, ha, "47 - CÓD. ÓRGÃO EMISSOR");
    y += ha + g;
    S.field(L, y, 48, ha, "48 - DOCUMENTO");
    S.font("normal", 5.6); d.text("CNS", 17.5, y + 6.5); d.text("CPF", 34.5, y + 6.5);
    S.check(13.4, y + 4.3, false); S.check(30.4, y + 4.3, false);
    S.field(50, y, 145, ha, "49 - Nº DOCUMENTO (CNS/CPF) DO PROFISSIONAL AUTORIZADOR");
    S.field(147, at, R, y + ha - at, "52 - Nº DA AUTORIZAÇÃO (APAC)");
    y += ha + g;
    S.field(L, y, 45, ha, "50 - DATA DA AUTORIZAÇÃO"); dateBoxes(S, 11, y, 44, ha, "");
    S.field(47, y, 145, ha, "51 - ASSINATURA E CARIMBO (Nº DO REGISTRO DO CONSELHO)");
    S.field(147, y, R, ha, "53 - PERÍODO DE VALIDADE DA APAC");
    S.font("normal", 7.5); d.text("/      /           a          /      /", 173.5, y + ha - 1.7, { align: "center" });
    y += ha + 1.5;

    S.bar(y, "IDENTIFICAÇÃO DO ESTABELECIMENTO DE SAÚDE (EXECUTANTE)"); y += 5.2;
    S.field(L, y, 160, h, "54 - NOME FANTASIA DO ESTABELECIMENTO DE SAÚDE EXECUTANTE"); S.fit(X.nome, L + 1.6, y + h - 1.8, 146, 9);
    S.field(162, y, R, h, "55 - CNES"); S.boxes(162, y, R, h, 7, digits(X.cnes));
    return y + h;
  }

  function cid(c) { return up(c).replace(/[^A-Z0-9]/g, "").slice(0, 4); }

  // Divide procedimentos em folhas: separar=true → 1 por folha; senão até 6 por folha (1 principal + 5 secundários)
  function sheetsOf(r) {
    var procs = (r.procs || []).filter(function (p) { return p && (p.codigo || p.nome); });
    if (!procs.length) return [[]];
    var out = [];
    if (r.separar) procs.forEach(function (p) { out.push([p]); });
    else for (var i = 0; i < procs.length; i += 6) out.push(procs.slice(i, i + 6));
    return out;
  }

  function build(r) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    doc.setProperties({ title: "APAC - " + up((r.pac || {}).nome), subject: "Laudo para Solicitação/Autorização de Procedimento Ambulatorial", creator: "Laudo APAC Express" });
    var sheets = sheetsOf(r), bottom = 0;
    sheets.forEach(function (procs, i) {
      if (i) doc.addPage("a4", "portrait");
      var rr = r;
      if (r.perProcObs && procs.length === 1 && procs[0].just) {
        rr = Object.assign({}, r, { obsSheet: (r.obs ? r.obs + " " : "") + "Justificativa do exame: " + procs[0].just });
      }
      bottom = drawSheet(new Sheet(doc), rr, procs);
    });
    return { doc: doc, sheets: sheets.length, bottom: bottom };
  }

  window.ApacPDF = { build: build, sheetsOf: sheetsOf };
})();
