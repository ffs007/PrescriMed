/* Checagem de enfermagem com horários aprazados, a partir da prescrição hospitalar (PSAPP.test.hospItems).
   Extensão aditiva carregada depois de app.js. Horário-base em psx.cfg.aprazBase (padrão 6). */
(function () {
  "use strict";
  var T = window.PSAPP && window.PSAPP.test; if (!T) return;
  function el(tag, a) { var n = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") n.textContent = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return n; }
  function cfg() { try { return JSON.parse(localStorage.getItem("psx.cfg") || "{}") || {}; } catch (_) { return {}; } }
  function base() { var b = parseInt(cfg().aprazBase, 10); return b >= 0 && b < 24 ? b : 6; }
  function hh(n) { n = ((n % 24) + 24) % 24; return (n === 0 ? 24 : n) < 10 ? "0" + (n === 0 ? 24 : n) : String(n === 0 ? 24 : n); }

  /* Frequência → horários. Retorna {tipo: "fixo"|"sn"|"cont"|"turno", h: ["06", ...]} */
  function sched(text) {
    var t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), b = base(), m;
    if (/\b(se necessario|s\/n|\bsn\b|acm|a criterio)/.test(t)) return { tipo: "sn", h: [] };
    if ((m = t.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*h/)) && m[1] === m[2]) return fixed(+m[1]);
    if ((m = t.match(/a cada\s*(\d{1,2})\s*h/))) return fixed(+m[1]);
    if ((m = t.match(/(\d)\s*[x×]\s*\/?\s*(ao )?dia/))) return fixed(24 / +m[1]);
    if (/dose unica|agora|imediat/.test(t)) return { tipo: "fixo", h: [hh(new Date().getHours())], once: true };
    if (/bomba|infusao continua|continu|ml\/h|\bbic\b|soro|sf 0,9|sg 5|ringer/.test(t)) return { tipo: "cont", h: [] };
    if (/^dieta|cabeceira|sinais vitais|controle|precau|repouso|oximetria|curativo|decubito|acesso|comunicar|escala|prevenc|jejum|o2|contenc|profilaxia mecan/.test(t)) return { tipo: "turno", h: [] };
    return { tipo: "sn", h: [] };
    function fixed(iv) {
      if (!(iv > 0 && iv <= 24)) return { tipo: "sn", h: [] };
      var start = iv === 12 ? 8 : iv === 24 ? 8 : b, out = [];
      for (var k = 0; k < 24 / iv; k++) out.push(hh(start + k * iv));
      return { tipo: "fixo", h: out };
    }
  }
  window.PSX_APRAZ = sched;

  function openNursing() {
    var items = T.hospItems(); if (!items.length) { alert("Prescreva ao menos um item."); return; }
    var C = T.C(), rows = items.map(function (x) { var s = sched(x.text); return { n: x.n, text: x.text, s: s, hrs: s.h.join(" ") }; });
    var ov = el("div", { class: "psx-nurse-ov", style: "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:grid;place-items:center;padding:12px" });
    var box = el("div", { class: "box", style: "max-width:760px;width:100%;max-height:90vh;overflow:auto;background:var(--bg,#fff)" });
    var leito = el("input", { class: "in", placeholder: "ex.: Obs 3", value: C.pac.leito || "" });
    var bIn = el("input", { class: "in mono", type: "number", min: "0", max: "23", value: String(base()) });
    var list = el("div");
    function draw() {
      list.textContent = "";
      rows.forEach(function (r) {
        var lbl = r.s.tipo === "sn" ? "se necessário" : r.s.tipo === "cont" ? "contínuo" : r.s.tipo === "turno" ? "por turno" : "";
        var inp = el("input", { class: "in mono", value: r.hrs, placeholder: lbl || "06 12 18 24", oninput: function (e) { r.hrs = e.target.value; } });
        list.appendChild(el("div", { style: "display:grid;grid-template-columns:1fr 170px;gap:8px;align-items:center;margin:6px 0" }, el("div", { class: "note", text: r.n + ". " + r.text }), inp));
      });
    }
    bIn.addEventListener("change", function () { var c = cfg(); c.aprazBase = parseInt(bIn.value, 10) || 0; localStorage.setItem("psx.cfg", JSON.stringify(c)); rows.forEach(function (r) { r.s = sched(r.text); r.hrs = r.s.h.join(" "); }); draw(); });
    draw();
    var chk = el("input", { type: "checkbox" }), st = el("div", { class: "status" });
    var gen = el("button", { class: "btn", type: "button", text: "Baixar PDF da checagem", disabled: "disabled" });
    chk.addEventListener("change", function () { if (chk.checked) gen.removeAttribute("disabled"); else gen.setAttribute("disabled", "disabled"); });
    gen.addEventListener("click", function () { try { C.pac.leito = leito.value; build(rows, leito.value); st.textContent = "PDF gerado."; st.className = "status ok"; } catch (e) { st.textContent = "Erro: " + e.message; st.className = "status err"; } });
    box.append(
      el("h3", { text: "Checagem de enfermagem — horários aprazados" }),
      el("div", { class: "grid" }, el("label", { class: "f" }, el("span", { text: "Leito" }), leito), el("label", { class: "f" }, el("span", { text: "Horário-base da unidade (h)" }), bIn)),
      el("p", { class: "note", text: "Ajuste os horários de cada item (separados por espaço). Em branco: sem horário fixo (se necessário, contínuo ou por turno)." }),
      list,
      el("label", { style: "display:flex;gap:8px;align-items:center;margin:10px 0" }, chk, "Revisei este documento"),
      el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, gen, el("button", { class: "btn ghost", type: "button", text: "Fechar", onclick: function () { ov.remove(); } })), st);
    ov.appendChild(box); ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    (document.querySelector("dialog[open]") || document.body).appendChild(ov);
  }

  function build(rows, leito) {
    var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4" }), C = T.C(), p = C.pac;
    var W = 210, M = 10, y = 14, cfgU = cfg();
    var hours = []; for (var k = 0; k < 24; k++) hours.push(hh(base() + k));
    var used = {}; rows.forEach(function (r) { r.hrs.split(/[\s,;-]+/).filter(Boolean).forEach(function (x) { used[("0" + parseInt(x, 10)).slice(-2) === "00" ? "24" : ("0" + parseInt(x, 10)).slice(-2)] = 1; }); });
    function header() {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("CHECAGEM DE ENFERMAGEM — HORÁRIOS APRAZADOS", W / 2, y, { align: "center" }); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      doc.text((cfgU.unidade || "") + "   Data: " + new Date().toLocaleDateString("pt-BR") + "   Leito: " + (leito || "____"), M, y); y += 4.5;
      doc.text("Paciente: " + (p.nome || "________________") + "   Idade: " + (p.idade || "—") + (p.idUn === "meses" ? " meses" : " anos") + "   Peso: " + (p.peso ? p.peso + " kg" : "—"), M, y); y += 4.5;
      doc.setFont("helvetica", "bold"); doc.text("ALERGIAS: " + (p.alergias || "nega alergias"), M, y); doc.setFont("helvetica", "normal"); y += 5;
      doc.setFontSize(7); doc.text("Marcar: rubrica no horário administrado · círculo = não administrado (registrar motivo) · SN = se necessário", M, y); y += 4;
    }
    header();
    var colItem = 74, colH = (W - 2 * M - colItem) / 8;
    function row(r) {
      doc.setFontSize(7.5);
      var lines = doc.splitTextToSize(r.n + ". " + r.text.replace(/₂/g, "2").replace(/₃/g, "3").replace(/≥/g, ">=").replace(/≤/g, "<="), colItem - 2), hgt = Math.max(9, lines.length * 3.2 + 4);
      var hrs = r.hrs.split(/[\s,;-]+/).filter(Boolean).map(function (x) { var n = parseInt(x, 10); return isNaN(n) ? x : hh(n); });
      var cells = hrs.length ? hrs : [r.s.tipo === "cont" ? "Contínuo" : r.s.tipo === "turno" ? "M" : "SN"];
      if (!hrs.length && r.s.tipo === "turno") cells = ["M", "T", "N"];
      if (!hrs.length && r.s.tipo === "sn") cells = ["SN", "SN", "SN", "SN"];
      var perRow = 8, nRows = Math.ceil(cells.length / perRow), total = Math.max(hgt, nRows * 9), ch = total / nRows;
      if (y + total > 270) { doc.addPage(); y = 14; header(); }
      doc.rect(M, y, colItem, total); doc.text(lines, M + 1, y + 4);
      for (var i = 0; i < Math.max(cells.length, 8); i++) {
        var cx = M + colItem + (i % perRow) * colH, cy = y + Math.floor(i / perRow) * ch;
        if (Math.floor(i / perRow) >= nRows) break;
        doc.rect(cx, cy, colH, ch);
        if (cells[i]) { doc.setFont("helvetica", "bold"); doc.text(cells[i], cx + 1, cy + 3.2); doc.setFont("helvetica", "normal"); }
      }
      y += total;
    }
    rows.forEach(row);
    y += 6; if (y > 255) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    ["Manhã", "Tarde", "Noite"].forEach(function (t, i) { var x = M + i * ((W - 2 * M) / 3); doc.line(x + 2, y + 10, x + 58, y + 10); doc.text("Enfermagem — " + t, x + 2, y + 14); });
    y += 22; doc.line(M + 2, y, M + 80, y); doc.text("Médico prescritor (carimbo e CRM)", M + 2, y + 4);
    void used;
    doc.save("CHECAGEM_" + (p.nome || "PACIENTE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").toUpperCase() + ".pdf");
  }
  window.PSX_NURSING = { open: openNursing };

  /* Botão no rodapé da Prescrição hospitalar */
  function inject() {
    [].slice.call(document.querySelectorAll("button")).forEach(function (b) {
      if (b.textContent !== "Revisar com Assistente" || b.getAttribute("data-psxn")) return;
      var root = b, ok = false; for (var i = 0; i < 8 && root; i++) { root = root.parentElement; if (root && /Prescrição hospitalar/.test(root.textContent.slice(0, 400))) { ok = true; break; } }
      if (!ok) return;
      b.setAttribute("data-psxn", "1");
      b.parentNode.insertBefore(el("button", { class: "btn ghost", type: "button", text: "Checagem de enfermagem (PDF)", onclick: openNursing }), b.nextSibling);
    });
  }
  var pend = false; new MutationObserver(function () { if (pend) return; pend = true; setTimeout(function () { pend = false; inject(); }, 120); }).observe(document.body, { childList: true, subtree: true });
})();
