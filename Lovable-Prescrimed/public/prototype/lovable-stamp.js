/* Carimbo médico visual: desenha o carimbo (psx.stamp, espelhado em profiles.stamp_config) logo acima de cada
   linha de assinatura dos PDFs, sem editar os geradores. Detecta a assinatura como uma linha horizontal curta
   seguida, até 7 mm abaixo e centralizado nela, de um texto (nome do médico). */
(function () {
  "use strict";
  var NS = window.jspdf; if (!NS || !NS.jsPDF || NS.jsPDF.__psxStamp) return;
  var Orig = NS.jsPDF;

  function cfg() { try { return JSON.parse(localStorage.getItem("psx.stamp") || "null"); } catch (_) { return null; } }
  function clean(s) { return String(s == null ? "" : s).replace(/[^\x20-\x7E\xA0-\xFF·–—]/g, "").trim(); }
  function lines(c) {
    var l2 = c.crm ? "CRM-" + (c.uf || "") + " " + c.crm : "";
    var esp = [c.especialidade, c.rqe ? "RQE " + c.rqe : ""].filter(Boolean).join(" ");
    var l3 = [esp, c.cargo].filter(Boolean).join(" · ");
    return [clean(c.nome), clean(l2), clean(l3)].filter(Boolean);
  }

  function draw(doc, sig, L) {
    var w = Math.min(Math.max(sig.x2 - sig.x1, 50), 85), cx = (sig.x1 + sig.x2) / 2;
    var small = sig.x2 - sig.x1 < 60, fs = small ? 7.5 : 10, lh = fs * 0.42, pad = small ? 1.2 : 2;
    var h = L.length * lh + pad * 2, top = sig.y - 1.5 - h;
    doc.setPage(sig.page);
    doc.setDrawColor(0); doc.setTextColor(0); doc.setLineWidth(0.3);
    doc.rect(cx - w / 2, top, w, h);
    L.forEach(function (t, i) {
      doc.setFont("times", i === 0 ? "bold" : "normal");
      var size = i === 0 ? fs + 0.5 : fs;
      doc.setFontSize(size);
      while (size > 5 && doc.getTextWidth(t) > w - 3) { size -= 0.5; doc.setFontSize(size); }
      doc.text(t, cx, top + pad + lh * (i + 0.8), { align: "center" });
    });
  }

  function Stamped() {
    var args = Array.prototype.slice.call(arguments);
    var doc = new (Function.prototype.bind.apply(Orig, [null].concat(args)))();
    var segs = [], texts = [], done = false, drawing = false;
    var page = function () { try { return doc.internal.getCurrentPageInfo().pageNumber; } catch (_) { return 1; } };
    var oLine = doc.line, oText = doc.text;
    doc.line = function (x1, y1, x2, y2) {
      if (!drawing && Math.abs(y1 - y2) < 0.01) { var a = Math.min(x1, x2), b = Math.max(x1, x2); if (b - a >= 30 && b - a <= 120) segs.push({ x1: a, x2: b, y: y1, page: page() }); }
      return oLine.apply(doc, arguments);
    };
    doc.text = function (t, x, y, o) {
      if (!drawing && typeof x === "number" && typeof y === "number") texts.push({ x: x, y: y, page: page(), center: !!(o && o.align === "center"), s: String(Array.isArray(t) ? t[0] : t || "") });
      return oText.apply(doc, arguments);
    };
    var guard = function () {
      if (done) return; done = true;
      var c = cfg(); if (!c || c.ativo === false || !c.nome) return;
      var L = lines(c); if (!L.length) return;
      drawing = true;
      try {
        segs.forEach(function (sg) {
          var cx = (sg.x1 + sg.x2) / 2;
          var hit = texts.some(function (t) { return t.page === sg.page && t.center && t.s.trim() && t.y > sg.y && t.y - sg.y <= 7 && Math.abs(t.x - cx) < 3; });
          if (hit) draw(doc, sg, L);
        });
      } catch (_) {}
      drawing = false;
    };
    ["output", "save"].forEach(function (m) { var f = doc[m]; if (typeof f === "function") doc[m] = function () { guard(); return f.apply(doc, arguments); }; });
    return doc;
  }
  Object.keys(Orig).forEach(function (key) { try { Stamped[key] = Orig[key]; } catch (_) {} });
  Stamped.prototype = Orig.prototype; Stamped.API = Orig.API; Stamped.__psxStamp = true; Stamped.__psxStyled = true;
  NS.jsPDF = Stamped;
})();
