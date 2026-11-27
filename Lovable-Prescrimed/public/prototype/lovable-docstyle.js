/* Estilo dos documentos por médico (logo, margens, cabeçalho e rodapé) aplicado a todos os PDFs gerados pelo jsPDF,
   sem editar os geradores do protótipo: o conteúdo original de cada página é reduzido para caber nas margens escolhidas
   e o logo/cabeçalho/rodapé são desenhados por cima. Configuração em localStorage psx.docstyle (espelhada na conta). */
(function () {
  "use strict";
  var NS = window.jspdf; if (!NS || !NS.jsPDF || NS.jsPDF.__psxStyled) return;
  var Orig = NS.jsPDF;

  function style() { try { return JSON.parse(localStorage.getItem("psx.docstyle") || "null") || {}; } catch (_) { return {}; } }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) && n > 0 ? Math.min(n, 60) : 0; }
  function clean(s) { return String(s == null ? "" : s).replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—…•°ºª]/g, "").trim(); }
  function pageText(doc, i) { try { return (doc.internal.pages[i] || []).join("\n"); } catch (_) { return ""; } }

  function apply(doc) {
    var S = style(); if (S.ativo === false) return;
    var cab = clean(S.cabecalho).split(/\n+/).filter(Boolean), rod = clean(S.rodape).split(/\n+/).filter(Boolean);
    var logo = S.logo && /^data:image\/(png|jpe?g);base64,/.test(S.logo) ? S.logo : null;
    var mS = num(S.mSup), mI = num(S.mInf), mE = num(S.mEsq), mD = num(S.mDir);
    if (!logo && !cab.length && !rod.length && !mS && !mI && !mE && !mD) return;
    var k = doc.internal.scaleFactor, n = doc.getNumberOfPages();
    var lh = Math.max(8, Math.min(40, num(S.logoAlt) || 16)), ratio = parseFloat(S.logoRatio) || 1;
    var headH = (logo || cab.length) ? Math.max(logo ? lh : 0, cab.length * 3.8) + 4 : 0, footH = rod.length ? rod.length * 3.4 + 3 : 0;
    for (var i = 1; i <= n; i++) {
      var txt = pageText(doc, i);
      if (!S.oficiais && /APAC|CONTROLE ESPECIAL|NOTIFICA[CÇ]/.test(txt)) continue; // formulários oficiais mantêm o layout
      doc.setPage(i);
      var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
      var top = mS + headH, bot = mI + footH, aw = (W - mE - mD) * k, ah = (H - top - bot) * k;
      if (aw <= 0 || ah <= 0) continue;
      var s = Math.min(aw / (W * k), ah / (H * k), 1), tx = mE * k + (aw - W * k * s) / 2, ty = bot * k + ah - H * k * s;
      var pg = doc.internal.pages[i];
      if (s < 0.9999 || tx > 0.01 || ty > 0.01) { pg.splice(0, 0, "q " + s.toFixed(5) + " 0 0 " + s.toFixed(5) + " " + tx.toFixed(3) + " " + ty.toFixed(3) + " cm"); pg.push("Q"); }
      var y0 = mS + 2, L = Math.max(mE, 8), R = W - Math.max(mD, 8), pos = S.logoPos || "esq";
      try {
        if (logo) {
          var lw = Math.min(lh * ratio, (R - L) * 0.45), lx = pos === "dir" ? R - lw : pos === "centro" ? (W - lw) / 2 : L;
          doc.addImage(logo, /png/.test(logo.slice(0, 20)) ? "PNG" : "JPEG", lx, y0, lw, lw / ratio);
        }
        if (cab.length) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(70);
          var align = !logo ? "center" : pos === "dir" ? "left" : pos === "centro" ? "center" : "right", cx = align === "left" ? L : align === "right" ? R : W / 2;
          var cy = logo && pos === "centro" ? y0 + lh + 3 : y0 + 3.5;
          cab.forEach(function (l, j) { doc.text(l, cx, cy + j * 3.8, { align: align }); });
          doc.setTextColor(0);
        }
        if (headH) { doc.setDrawColor(180); doc.setLineWidth(0.25); doc.line(L, mS + headH - 1, R, mS + headH - 1); doc.setDrawColor(0); }
        if (rod.length) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(90);
          rod.forEach(function (l, j) { doc.text(l, W / 2, H - mI - footH + 3.5 + j * 3.4, { align: "center" }); });
          doc.setTextColor(0);
        }
      } catch (_) {}
    }
  }

  function Styled() {
    var args = Array.prototype.slice.call(arguments);
    var doc = new (Function.prototype.bind.apply(Orig, [null].concat(args)))();
    var done = false, guard = function () { if (!done) { done = true; try { apply(doc); } catch (_) {} } };
    ["output", "save"].forEach(function (m) { var f = doc[m]; if (typeof f === "function") doc[m] = function () { guard(); return f.apply(doc, arguments); }; });
    return doc;
  }
  Object.keys(Orig).forEach(function (key) { try { Styled[key] = Orig[key]; } catch (_) {} });
  Styled.prototype = Orig.prototype; Styled.API = Orig.API; Styled.__psxStyled = true;
  NS.jsPDF = Styled;
})();
