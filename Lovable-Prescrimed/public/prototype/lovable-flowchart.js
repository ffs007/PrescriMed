/* Gerador de fluxograma decisório (SVG/PNG) a partir de fluxo.nodes [{id,texto,conduta,opcoes:[{t,next}]}].
   Extensão aditiva: só desenha o que já está no protocolo; não cria conteúdo clínico. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", W = 230, PADX = 40, PADY = 70, LH = 15, FONT = "Inter, Arial, sans-serif";
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function wrap(t, max) {
    var out = [], line = "";
    String(t || "").split(/\s+/).forEach(function (w) { if ((line + " " + w).trim().length > max) { if (line) out.push(line); line = w; } else line = (line + " " + w).trim(); });
    if (line) out.push(line); return out.slice(0, 7);
  }
  function build(nodes, title) {
    nodes = (nodes || []).filter(function (n) { return n && n.id; });
    if (!nodes.length) return null;
    var by = {}; nodes.forEach(function (n) { by[n.id] = n; });
    var lvl = {}, q = [nodes[0].id]; lvl[nodes[0].id] = 0;
    while (q.length) { var id = q.shift(); (by[id].opcoes || []).forEach(function (o) { if (by[o.next] && lvl[o.next] == null) { lvl[o.next] = lvl[id] + 1; q.push(o.next); } }); }
    var maxL = 0; nodes.forEach(function (n) { if (lvl[n.id] == null) lvl[n.id] = -1; else maxL = Math.max(maxL, lvl[n.id]); });
    nodes.forEach(function (n) { if (lvl[n.id] < 0) lvl[n.id] = ++maxL; });
    var rows = []; nodes.forEach(function (n) { (rows[lvl[n.id]] = rows[lvl[n.id]] || []).push(n); });
    var box = {}, rowY = 70, width = 0;
    rows.forEach(function (r) { width = Math.max(width, r.length * (W + PADX) + PADX); });
    rows.forEach(function (r) {
      var hMax = 0, x0 = (width - r.length * (W + PADX) + PADX) / 2;
      r.forEach(function (n, i) { var lines = wrap(n.texto, 32), h = 30 + lines.length * LH + 10; hMax = Math.max(hMax, h); box[n.id] = { x: x0 + i * (W + PADX), y: rowY, h: h, lines: lines, n: n }; });
      rowY += hMax + PADY;
    });
    var H = rowY - PADY + 40, s = [];
    s.push('<svg xmlns="' + NS + '" width="' + width + '" height="' + H + '" viewBox="0 0 ' + width + " " + H + '" font-family="' + FONT + '">');
    s.push('<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#475467"/></marker></defs>');
    s.push('<rect width="100%" height="100%" fill="#FFFFFF"/>');
    s.push('<text x="' + width / 2 + '" y="34" text-anchor="middle" font-size="18" font-weight="700" fill="#0B1220">' + esc(title || "Fluxograma decisório") + "</text>");
    nodes.forEach(function (n) {
      var a = box[n.id];
      (n.opcoes || []).forEach(function (o) {
        var b = box[o.next]; if (!b) return;
        var x1 = a.x + W / 2, y1 = a.y + a.h, x2 = b.x + W / 2, y2 = b.y, my = b.y > a.y ? (y1 + y2) / 2 : y1 + 20;
        var d = b.y > a.y ? "M" + x1 + "," + y1 + " V" + my + " H" + x2 + " V" + (y2 - 2) : "M" + x1 + "," + y1 + " V" + my + " H" + (Math.max(a.x, b.x) + W + 16) + " V" + (b.y + b.h / 2) + " H" + (b.x + W + 2);
        s.push('<path d="' + d + '" fill="none" stroke="#475467" stroke-width="1.5" marker-end="url(#ar)"/>');
        var lx = (x1 + x2) / 2, lw = Math.min(140, 12 + String(o.t).length * 6.5);
        s.push('<rect x="' + (lx - lw / 2) + '" y="' + (my - 10) + '" width="' + lw + '" height="20" rx="10" fill="#F7FAFC" stroke="#D0D5DD"/>');
        s.push('<text x="' + lx + '" y="' + (my + 4) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#344054">' + esc(String(o.t).slice(0, 20)) + "</text>");
      });
    });
    nodes.forEach(function (n) {
      var a = box[n.id], c = n.conduta ? "#2D8A57" : "#005E8A", soft = n.conduta ? "#EAF5EE" : "#E4EFFD";
      s.push('<rect x="' + a.x + '" y="' + a.y + '" width="' + W + '" height="' + a.h + '" rx="10" fill="' + soft + '" stroke="' + c + '" stroke-width="2"/>');
      s.push('<text x="' + (a.x + 12) + '" y="' + (a.y + 20) + '" font-size="10" font-weight="700" fill="' + c + '" letter-spacing="1">' + (n.conduta ? "CONDUTA" : "DECISÃO") + " · " + esc(n.id) + "</text>");
      a.lines.forEach(function (l, i) { s.push('<text x="' + (a.x + 12) + '" y="' + (a.y + 40 + i * LH) + '" font-size="12.5" fill="#0B1220">' + esc(l) + "</text>"); });
    });
    s.push('<text x="' + (width - 12) + '" y="' + (H - 12) + '" text-anchor="end" font-size="10" fill="#667085">PrescriMed · conferir antes do uso clínico</text></svg>');
    return { svg: s.join(""), w: width, h: H };
  }
  function slug(t) { return String(t || "fluxograma").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50); }
  function dl(name, blob) { var u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
  function toPng(r) {
    return new Promise(function (res, rej) {
      var img = new Image(), k = 2; img.onload = function () { var c = document.createElement("canvas"); c.width = r.w * k; c.height = r.h * k; var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); c.toBlob(res, "image/png"); };
      img.onerror = rej; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(r.svg);
    });
  }
  function msg(t) { var x = document.createElement("div"); x.className = "toast"; x.textContent = t; document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3000); }
  function open(nodes, title) {
    var r = build(nodes, title);
    if (!r) return msg("Este protocolo não tem fluxograma. Preencha o fluxo no editor.");
    var d = document.getElementById("psxFlowDlg");
    if (!d) { d = document.createElement("dialog"); d.id = "psxFlowDlg"; d.className = "modal"; d.style.cssText = "max-width:1100px;width:96vw"; document.body.appendChild(d); }
    d.innerHTML = '<div class="mhead"><div><h2>Fluxograma decisório</h2><small>' + esc(title || "") + '</small></div><button class="x" type="button" aria-label="Fechar">×</button></div>' +
      '<div class="mbody"><div class="btns" style="margin-bottom:8px"><button class="btn sm" data-z="-">−</button><button class="btn sm" data-z="+">+</button><button class="btn sm" data-z="0">Ajustar</button></div><div id="psxFlowView" style="overflow:auto;border:1px solid var(--line);border-radius:8px;background:#fff;max-height:65vh"></div></div>' +
      '<div class="mfoot"><button class="btn sm primary" data-a="svg">Baixar SVG</button><button class="btn sm" data-a="png">Baixar PNG (alta resolução)</button><button class="btn sm" data-a="copy">Copiar imagem</button><button class="btn sm ghost" data-a="close">Fechar</button></div>';
    var v = d.querySelector("#psxFlowView"), z = 1; v.innerHTML = r.svg; var svg = v.querySelector("svg");
    function zoom(n) { z = n; svg.setAttribute("width", r.w * z); svg.setAttribute("height", r.h * z); }
    function fit() { zoom(Math.min(1, (v.clientWidth - 4) / r.w) || 1); }
    d.querySelector(".x").onclick = function () { d.close(); };
    d.querySelectorAll("[data-z]").forEach(function (b) { b.onclick = function () { var k = b.dataset.z; if (k === "0") fit(); else zoom(Math.max(0.2, Math.min(3, z + (k === "+" ? 0.2 : -0.2)))); }; });
    d.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = async function () {
      var a = b.dataset.a, nm = slug(title);
      try {
        if (a === "close") return d.close();
        if (a === "svg") return dl(nm + ".svg", new Blob([r.svg], { type: "image/svg+xml" }));
        var png = await toPng(r);
        if (a === "png") return dl(nm + ".png", png);
        await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]); msg("Imagem copiada. Cole com Ctrl+V.");
      } catch (e) { msg("Não foi possível concluir: " + (e && e.message || e)); }
    }; });
    if (!d.open) d.showModal(); setTimeout(fit, 30);
  }
  window.PSX_FLOW = { build: build, open: open, toPng: toPng };
})();
