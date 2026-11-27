/* Modo Emergência (aditivo). Tela cheia com 3 blocos: busca de quadro, ficha mínima e prescrição expressa.
   A prescrição usa a condição do PrescriMed (base institucional travada) e o motor de modelos para recalcular
   doses, trocar remédios por alergia e manter a revisão obrigatória antes do PDF. Cada receita emitida aqui
   gera um evento "emergencia_pendente" em safety_events para revisão posterior. Ctrl+Shift+E liga/desliga. */
(function () {
  "use strict";
  var D = window.PROTO_DB, T = window.PSAPP && window.PSAPP.test; if (!D || !T) return;
  var C = function () { return T.C(); };
  var fold = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var rd = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } };
  var wr = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  function el(tag, a) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); }); for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) e.append(arguments[i]); return e; }
  var toast = function (m) { var t = el("div", { class: "psxE-toast", role: "status", text: m }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); };

  /* ---------- estilo (usa as cores do PrescriMed) ---------- */
  document.head.appendChild(el("style", { text:
    "#psxEmerg{position:fixed;inset:0;z-index:50;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:auto}" +
    "#psxEmerg header{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line);background:var(--surface);flex-wrap:wrap}" +
    "#psxEmerg main{flex:1;display:grid;gap:14px;padding:14px;max-width:1100px;width:100%;margin:0 auto;grid-template-columns:1fr}" +
    "@media(min-width:900px){#psxEmerg main{grid-template-columns:1.2fr 1fr}#psxE-search{grid-column:1/-1}}" +
    ".psxE-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}" +
    ".psxE-card h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 8px}" +
    "#psxE-q{width:100%;font-size:26px;padding:14px 16px;border:2px solid var(--accent);border-radius:12px;background:var(--bg);color:var(--ink)}" +
    ".psxE-res{list-style:none;margin:6px 0 0;padding:0}.psxE-res li{padding:10px 12px;border-radius:10px;cursor:pointer;font-size:17px;display:flex;justify-content:space-between;gap:8px}" +
    ".psxE-res li[aria-selected=true],.psxE-res li:hover{background:var(--accent-soft)}.psxE-res small{color:var(--muted)}" +
    ".psxE-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.psxE-grid label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:2px}" +
    ".psxE-grid input{font-size:16px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}" +
    ".psxE-tag{display:inline-flex;gap:6px;align-items:center;background:#C62828;color:#fff;font-weight:700;font-size:16px;padding:6px 12px;border-radius:999px;margin:4px 4px 0 0}" +
    ".psxE-tag button{background:none;border:0;color:inherit;font-size:16px;cursor:pointer}" +
    ".psxE-warn{color:#B45309;font-size:13px;margin-top:4px}.psxE-crit{color:#C62828;font-weight:600}" +
    "#psxE-timer{font:700 22px ui-monospace,monospace;padding:4px 10px;border-radius:8px}" +
    "#psxE-timer.g{background:#DCFCE7;color:#166534}#psxE-timer.y{background:#FEF9C3;color:#854D0E}#psxE-timer.o{background:#FFEDD5;color:#9A3412}" +
    "#psxEmerg footer{padding:8px 14px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:10px;background:var(--surface)}" +
    "#psxEmerg kbd{border:1px solid var(--line);border-radius:4px;padding:0 4px;background:var(--bg);font-size:11px}" +
    ".psxE-log{font-size:13px;margin:6px 0;padding-left:18px}.psxE-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}" +
    ".psxE-toast{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);z-index:10000;background:var(--ink);color:var(--bg);padding:10px 14px;border-radius:10px;font-size:14px}" +
    "#psxE-toggle{border:2px solid #C62828;color:#C62828;font-weight:700}"
  }));

  /* ---------- busca: aproximada, iniciais, sintomas, ordenada por uso ---------- */
  var USE = "psx.emerg.uso", HIST = "psx.emerg.hist", PAC = "psx.emerg.pac";
  function lev(a, b) { var m = a.length, n = b.length, p = [], i, j; for (j = 0; j <= n; j++) p[j] = j; for (i = 1; i <= m; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= n; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return p[n]; }
  var skel = function (w) { return w[0] + w.slice(1).replace(/[aeiouy]/g, ""); };
  function tokScore(t, words, hay) {
    if (hay.indexOf(t) >= 0) return words.some(function (w) { return w.indexOf(t) === 0; }) ? 3 : 2;
    if (t.length <= 4 && words.some(function (w) { return w.length > t.length && skel(w).indexOf(t) === 0; })) return 1.5; // "pnm" → pneumonia
    var tol = t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0;
    return tol && words.some(function (w) { return Math.abs(w.length - t.length) <= tol && lev(t, w) <= tol || (w.length > t.length && lev(t, w.slice(0, t.length)) <= tol); }) ? 1 : 0;
  }
  function search(q) {
    var toks = fold(q).split(/[^a-z0-9]+/).filter(Boolean); if (!toks.length || fold(q).replace(/\s/g, "").length < 2) return [];
    var uso = rd(USE, {});
    return D.protocols.filter(function (p) { return p.id !== "__branco"; }).map(function (p) {
      var hay = fold(p.n + " " + (p.alias || "") + " " + p.cat + " " + (p.cid || []).map(function (c) { return c[0] + " " + c[1]; }).join(" "));
      var words = hay.split(/[^a-z0-9]+/).filter(Boolean), s = 0;
      for (var i = 0; i < toks.length; i++) { var v = tokScore(toks[i], words, hay); if (!v) return null; s += v; }
      if (fold(p.n).indexOf(fold(q)) === 0) s += 3;
      return { p: p, s: s + Math.min(3, Math.log2(1 + (uso[p.id] || 0))) };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (x) { return x.p; });
  }

  /* ---------- paciente ---------- */
  function idadeDe(nasc) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(nasc || ""); if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]), now = new Date(); if (isNaN(d) || d > now) return null;
    var meses = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth() - (now.getDate() < d.getDate() ? 1 : 0);
    return meses < 24 ? { v: meses, u: "meses", anos: meses / 12 } : { v: Math.floor(meses / 12), u: "anos", anos: meses / 12 };
  }
  function pesoAviso(peso, anos) {
    if (!peso) return ""; if (peso < 0.3 || peso > 400) return "Peso impossível — confira.";
    if (anos == null) return "";
    var ref = anos < 1 ? [2, 13] : anos < 5 ? [7, 28] : anos < 12 ? [14, 70] : anos < 18 ? [28, 130] : [35, 250];
    return peso < ref[0] || peso > ref[1] ? "Peso incomum para a idade (" + ref[0] + "–" + ref[1] + " kg) — confira." : "";
  }
  var pac = rd(PAC, null) || { nome: "", nasc: "", peso: "", alergias: [], renal: false, hepat: false, cardio: false };
  function pushPac() { // espelha no atendimento do PrescriMed
    var c = C(), a = idadeDe(pac.nasc);
    c.pac.nome = pac.nome; c.pac.nasc = pac.nasc; c.pac.peso = pac.peso;
    if (a) { c.pac.idade = String(a.v); c.pac.idUn = a.u; }
    c.pac.alergias = pac.alergias.join(", ");
    try { localStorage.setItem("psx.case", JSON.stringify(Object.assign({}, c, { docs: [] }))); } catch (_) {}
  }
  setInterval(function () { if (root) { wr(PAC, pac); pushPac(); } }, 5000);

  /* ---------- tela ---------- */
  var root = null, cur = null, sel = -1, started = 0, pausedAt = 0, paused = 0, tick = null, lastLog = [];
  function open() {
    if (root) return; started = rd("psx.emerg.t0", 0) || Date.now(); wr("psx.emerg.t0", started); pausedAt = 0;
    root = el("div", { id: "psxEmerg", role: "dialog", "aria-label": "Modo emergência" });
    root.innerHTML = '<header><strong style="color:#C62828">⚡ MODO EMERGÊNCIA</strong><span id="psxE-timer" class="g" title="Tempo do atendimento">00:00</span>' +
      '<button class="btn sm ghost" id="psxE-pause" type="button">Pausar</button><span style="flex:1"></span>' +
      '<button class="btn sm ghost" id="psxE-pend" type="button">Pendentes de revisão</button>' +
      '<button class="btn sm" id="psxE-exit" type="button" title="Ctrl+Shift+E">Sair do modo</button></header>' +
      '<main><section class="psxE-card" id="psxE-search"><h2>1 · Quadro clínico <kbd>Alt+B</kbd></h2>' +
      '<input id="psxE-q" autocomplete="off" placeholder="Digite o quadro ou sintoma (ex.: pnm, febre, crupe)" aria-label="Buscar quadro clínico" role="combobox" aria-controls="psxE-res" aria-expanded="false">' +
      '<ul class="psxE-res" id="psxE-res" role="listbox"></ul></section>' +
      '<section class="psxE-card" id="psxE-pac"><h2>2 · Paciente <kbd>Alt+P</kbd></h2></section>' +
      '<section class="psxE-card" id="psxE-rx"><h2>3 · Prescrição expressa <kbd>Alt+R</kbd></h2><p class="note">Escolha o quadro clínico acima.</p></section></main>' +
      '<footer>' + [["Alt+B", "busca"], ["Alt+P", "paciente"], ["Alt+R", "nova prescrição"], ["Alt+M", "remédio"], ["Alt+O", "orientação"], ["Alt+F", "finalizar"], ["Alt+I", "imprimir"], ["Alt+W", "WhatsApp"], ["Alt+N", "próximo paciente"], ["Esc", "cancelar"], ["Ctrl+S", "salvar"], ["Ctrl+Shift+E", "sair"]].map(function (k) { return "<span><kbd>" + k[0] + "</kbd> " + k[1] + "</span>"; }).join("") + "</footer>";
    document.body.appendChild(root);
    root.querySelector("#psxE-exit").onclick = close;
    root.querySelector("#psxE-pause").onclick = togglePause;
    root.querySelector("#psxE-pend").onclick = pendentes;
    var q = root.querySelector("#psxE-q");
    q.addEventListener("input", function () { sel = -1; drawRes(search(q.value)); });
    q.addEventListener("keydown", function (e) {
      var items = root.querySelectorAll("#psxE-res li");
      if (e.key === "ArrowDown") { e.preventDefault(); if (!items.length) { drawHist(); items = root.querySelectorAll("#psxE-res li"); } sel = Math.min(items.length - 1, sel + 1); mark(items); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); mark(items); }
      else if (e.key === "Enter" && items.length) { e.preventDefault(); items[Math.max(0, sel)].click(); }
    });
    drawPac(); tick = setInterval(drawTimer, 1000); drawTimer(); setTimeout(function () { q.focus(); }, 50);
    wr("psx.emerg.on", true);
  }
  function close() { if (!root) return; wr(PAC, pac); pushPac(); clearInterval(tick); root.remove(); root = null; wr("psx.emerg.on", false); }
  function mark(items) { items.forEach(function (li, i) { li.setAttribute("aria-selected", i === sel ? "true" : "false"); }); }
  function drawRes(list, label) {
    var ul = root.querySelector("#psxE-res"); ul.textContent = "";
    root.querySelector("#psxE-q").setAttribute("aria-expanded", list.length ? "true" : "false");
    if (label && list.length) ul.appendChild(el("li", { "aria-disabled": "true", style: "cursor:default;font-size:12px;color:var(--muted)", text: label }));
    list.forEach(function (p) { ul.appendChild(el("li", { role: "option", onclick: function () { choose(p); } }, el("span", { text: p.n }), el("small", { text: p.cat }))); });
  }
  function drawHist() { var h = rd(HIST, []).map(function (id) { return D.protocols.find(function (p) { return p.id === id; }); }).filter(Boolean); drawRes(h, "Recentes"); if (h.length) sel = 0; }
  function curElapsed() { return ((pausedAt || Date.now()) - started - paused) / 1000; }
  function drawTimer() {
    if (!root) return; var s = Math.max(0, Math.floor(curElapsed())), t = root.querySelector("#psxE-timer");
    t.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0") + (pausedAt ? " ⏸" : "");
    t.className = s < 300 ? "g" : s < 600 ? "y" : "o";
  }
  function togglePause() { if (pausedAt) { paused += Date.now() - pausedAt; pausedAt = 0; } else pausedAt = Date.now(); root.querySelector("#psxE-pause").textContent = pausedAt ? "Retomar" : "Pausar"; drawTimer(); }

  function drawPac() {
    var s = root.querySelector("#psxE-pac"); s.querySelectorAll(":scope > :not(h2)").forEach(function (n) { n.remove(); });
    var a = idadeDe(pac.nasc), av = pesoAviso(parseFloat(String(pac.peso).replace(",", ".")), a && a.anos);
    var inp = function (k, lab, attrs) { var i = el("input", Object.assign({ value: pac[k] || "", "aria-label": lab }, attrs || {})); i.addEventListener("change", function () { pac[k] = i.value.trim(); wr(PAC, pac); pushPac(); drawPac(); }); return el("label", {}, lab, i); };
    var nasc = el("input", { value: pac.nasc, placeholder: "dd/mm/aaaa", inputmode: "numeric", "aria-label": "Nascimento", maxlength: "10" });
    nasc.addEventListener("input", function () { var d = nasc.value.replace(/\D/g, "").slice(0, 8); nasc.value = d.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2"); });
    nasc.addEventListener("change", function () { pac.nasc = nasc.value; wr(PAC, pac); pushPac(); drawPac(); });
    var cal = el("input", { type: "date", "aria-label": "Escolher no calendário", style: "font-size:12px" });
    cal.addEventListener("change", function () { var p = cal.value.split("-"); if (p.length === 3) { pac.nasc = p[2] + "/" + p[1] + "/" + p[0]; wr(PAC, pac); pushPac(); drawPac(); } });
    var grid = el("div", { class: "psxE-grid" },
      inp("nome", "Nome ou iniciais *", { id: "psxE-nome" }),
      el("label", {}, "Nascimento " + (a ? "→ " + a.v + " " + a.u : ""), nasc, cal),
      inp("peso", "Peso (kg) *", { inputmode: "decimal" }));
    var al = el("input", { placeholder: "Alergia + Enter (ou \"nega\")", "aria-label": "Adicionar alergia" });
    al.addEventListener("keydown", function (e) { if (e.key === "Enter" && al.value.trim()) { e.preventDefault(); var v = al.value.trim(); if (/^neg/i.test(v)) pac.alergias = []; else if (pac.alergias.indexOf(v) < 0) pac.alergias.push(v); pac.alergiaRev = true; wr(PAC, pac); pushPac(); drawPac(); root.querySelector("#psxE-pac input[aria-label='Adicionar alergia']").focus(); } });
    grid.appendChild(el("label", {}, "Alergias medicamentosas", al));
    s.appendChild(grid);
    var tags = el("div", { "aria-live": "polite" }); pac.alergias.forEach(function (x, i) { tags.appendChild(el("span", { class: "psxE-tag" }, "⚠ " + x.toUpperCase(), el("button", { type: "button", "aria-label": "Remover " + x, text: "×", onclick: function () { pac.alergias.splice(i, 1); wr(PAC, pac); pushPac(); drawPac(); } }))); });
    if (!pac.alergias.length) tags.appendChild(el("span", { class: "note", text: pac.alergiaRev ? "Nega alergias." : "Alergias não perguntadas." }));
    s.appendChild(tags);
    var cb = el("div", { style: "display:flex;gap:12px;flex-wrap:wrap;margin-top:8px" });
    [["renal", "Insuf. renal"], ["hepat", "Insuf. hepática"], ["cardio", "Insuf. cardíaca"]].forEach(function (k) { var c = el("input", { type: "checkbox" }); c.checked = !!pac[k[0]]; c.onchange = function () { pac[k[0]] = c.checked; wr(PAC, pac); drawPac(); if (k[0] === "renal" && c.checked && window.PSX_SAFE && window.PSX_SAFE.openPanel) toast("Informe a creatinina no painel renal para ajustar as doses."); }; cb.appendChild(el("label", { style: "display:flex;gap:4px;align-items:center;font-size:14px" }, c, k[1])); });
    s.appendChild(cb);
    if (av) s.appendChild(el("div", { class: "psxE-warn", text: "⚠ " + av }));
    if (!pac.nome || !pac.peso) s.appendChild(el("div", { class: "psxE-warn psxE-crit", text: "Nome e peso são obrigatórios para a prescrição." }));
    if (pac.renal || pac.hepat || pac.cardio) s.appendChild(el("div", { class: "psxE-warn", text: "Comorbidade marcada: revise cada dose. " + (pac.renal ? "Ajuste renal pelo painel de função renal (creatinina). " : "") + (pac.hepat || pac.cardio ? "Ajustes hepáticos/cardíacos não são automáticos." : "") }));
  }

  /* ---------- prescrição expressa ---------- */
  function preset(p) { // 1º remédio de cada classe do protocolo (até 4); demais da classe = alternativas
    return (p.cls || []).slice(0, 4).map(function (k) { var d = ((D.classes[k] || {}).d || []).filter(function (id) { return D.drugs[id]; }); return d.length ? { drug: d[0], med: D.drugs[d[0]].n, essencial: true, alt: d.slice(1) } : null; }).filter(Boolean);
  }
  async function choose(p) {
    cur = p; var uso = rd(USE, {}); uso[p.id] = (uso[p.id] || 0) + 1; wr(USE, uso);
    wr(HIST, [p.id].concat(rd(HIST, []).filter(function (x) { return x !== p.id; })).slice(0, 10));
    root.querySelector("#psxE-q").value = p.n; drawRes([]);
    drawRx("Preparando…");
    if (!pac.nome || !pac.peso) { drawRx(); toast("Preencha nome e peso primeiro."); root.querySelector("#psxE-nome").focus(); return; }
    pushPac(); T.chooseProto(p.id);
    lastLog = ["Doses calculadas pelo motor para " + pac.peso + " kg."];
    drawRx();
  }
  function drawRx(msg) {
    var s = root.querySelector("#psxE-rx"); s.querySelectorAll(":scope > :not(h2)").forEach(function (n) { n.remove(); });
    if (!cur) { s.appendChild(el("p", { class: "note", text: "Escolha o quadro clínico acima." })); return; }
    s.appendChild(el("div", { style: "font-size:18px;font-weight:700", text: cur.n }));
    s.appendChild(el("div", { class: "note", text: "Base institucional travada · " + cur.cat }));
    if (msg) { s.appendChild(el("p", { text: msg })); return; }
    var pr = preset(cur), ul = el("ul", { class: "psxE-log" });
    pr.forEach(function (x) { ul.appendChild(el("li", { text: x.med + (x.alt.length ? " (alternativas: " + x.alt.slice(0, 3).map(function (a) { return D.drugs[a].n; }).join(", ") + ")" : "") })); });
    if (!pr.length) ul.appendChild(el("li", { text: "Sem remédios padrão para este quadro — adicione manualmente." }));
    s.appendChild(ul);
    if (lastLog.length) { var lg = el("ul", { class: "psxE-log" }); lastLog.forEach(function (t) { lg.appendChild(el("li", { text: t })); }); s.appendChild(lg); }
    var b = function (t, k, fn) { return el("button", { class: "btn" + (k === "F" ? " primary" : ""), type: "button", title: "Alt+" + k, onclick: fn }, t + " ", el("kbd", { text: "Alt+" + k })); };
    s.appendChild(el("div", { class: "psxE-acts" }, b("Gerar receita", "F", finalize), b("Adicionar remédio", "M", finalize), b("Orientação", "O", orient), b("Imprimir", "I", printNow), b("WhatsApp", "W", whats), b("Próximo paciente", "N", next)));
    s.appendChild(el("p", { class: "note", text: "A receita abre no editor do PrescriMed: confira, marque \"Revisei este documento\" e baixe. Trocar um remédio do protocolo pede justificativa." }));
  }
  var modal = function () { return document.querySelector("dialog#modal[open]"); };
  async function finalize() {
    if (!cur) { toast("Escolha o quadro clínico."); return; }
    if (!pac.nome || !pac.peso) { toast("Nome e peso são obrigatórios."); return; }
    if (!pac.alergiaRev && !pac.alergias.length) { toast("Pergunte sobre alergias (digite \"nega\" se não houver)."); return; }
    pushPac(); if (C().proto !== cur.id) T.chooseProto(cur.id);
    if (!window.PSX_TPL) { toast("Motor de receitas indisponível."); return; }
    var log = await window.PSX_TPL.applyTemplate({ id: "emerg:" + cur.id, nome: cur.n, meta: {} }, { id: "inst", conteudo: { proto: cur.id, mods: { amb: { itens: preset(cur), cuidados: "", alarme: "", retorno: "" } }, info: {} } }, { optional: false, track: false });
    lastLog = log || []; watchEdits(); drawRx();
  }
  function orient() { if (!modal()) { finalize().then(function () { setTimeout(orient, 400); }); return; } var t = modal().querySelector("textarea"); if (t) { t.scrollIntoView({ block: "center" }); t.focus(); } }
  function printNow() {
    var m = modal(); if (!m) { toast("Gere a receita primeiro (Alt+F)."); return; }
    var btn = Array.prototype.find.call(m.querySelectorAll("button"), function (x) { return /baixar|salvar pdf|imprimir/i.test(x.textContent); });
    if (!btn || btn.disabled) { toast("Marque \"Revisei este documento\" antes de imprimir."); var r = m.querySelector("input[type=checkbox]"); if (r) r.focus(); return; }
    btn.click();
  }
  function rxText() { var R = C().rx || {}; return (R.itens || []).map(function (x, i) { return (i + 1) + ". " + x.med + (x.qtd ? " — " + x.qtd : "") + "\n   " + (x.pos || ""); }).join("\n"); }
  function whats() {
    var t = rxText(); if (!t) { toast("A receita está vazia. Gere e revise antes (Alt+F)."); return; }
    if (!emitted) { toast("Baixe o PDF revisado antes de enviar."); return; }
    var cfg = rd("psx.cfg", {}) || {};
    window.open("https://wa.me/?text=" + encodeURIComponent("Receita — " + pac.nome + "\n" + new Date().toLocaleDateString("pt-BR") + "\n\n" + t + "\n\n" + (cfg.unidade || "") + "\nLeve o documento impresso/PDF à farmácia."), "_blank", "noopener");
  }
  // Justificativa ao desviar do protocolo (remover/trocar remédio na receita aberta).
  var watched = null;
  function watchEdits() {
    var m = modal(); if (!m || watched === m) return; watched = m;
    m.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("button"); if (!b || !root) return; if (/remover|excluir|×|trocar/i.test(b.textContent + (b.getAttribute("aria-label") || "")) && !b.closest("#psxE-just")) justify(); }, true);
  }
  function justify() {
    var m = modal(); if (!m || m.querySelector("#psxE-just")) return;
    var box = el("div", { id: "psxE-just", class: "psxE-card", style: "margin:8px 0" }, el("strong", { text: "Desvio do protocolo — motivo:" }));
    ["Alergia/intolerância", "Comorbidade", "Interação", "Indisponível", "Preferência do paciente"].concat(["Outro"]).forEach(function (r) {
      box.appendChild(el("button", { class: "btn sm", type: "button", style: "margin:4px", text: r, onclick: function () { var why = r === "Outro" ? (prompt("Descreva o motivo") || "") : r; if (!why) return; dev.push(why); if (window.PSX_SAFE) window.PSX_SAFE.log({ tipo: "desvio_protocolo", dominio: "emergencia", motivo: cur && cur.n, justificativa: why, fonte: "modo_emergencia" }); box.remove(); } }));
    });
    (m.querySelector(".mbody") || m).prepend(box);
  }
  var dev = [], emitted = false;
  document.addEventListener("click", function (e) { // receita baixada no modo → pendente de revisão
    var b = e.target && e.target.closest && e.target.closest("dialog#modal button"); if (!b || !root || !cur) return;
    if (!/baixar|salvar pdf|imprimir/i.test(b.textContent || "") || b.disabled) return;
    emitted = true;
    if (window.PSX_SAFE) window.PSX_SAFE.log({ tipo: "emergencia_pendente", dominio: "emergencia", motivo: cur.n, fonte: "modo_emergencia", justificativa: dev.join("; ") || null, contexto: { tempo_s: Math.round(curElapsed()), itens: rxText().slice(0, 1500), comorb: { renal: pac.renal, hepat: pac.hepat, cardio: pac.cardio }, alergias: pac.alergias } });
  }, true);
  function next() {
    if (cur && !emitted && !confirm("Nenhuma receita foi emitida. Ir para o próximo paciente mesmo assim?")) return;
    var m = modal(); if (m) m.close();
    pac = { nome: "", nasc: "", peso: "", alergias: [], renal: false, hepat: false, cardio: false }; wr(PAC, pac);
    var c = C(); Object.keys(c.pac).forEach(function (k) { c.pac[k] = k === "idUn" ? "anos" : k === "gest" ? false : ""; });
    c.rxAmb = null; c.rxAmbSel = {}; c.proto = null; try { localStorage.setItem("psx.case", JSON.stringify(Object.assign({}, c, { docs: [] }))); } catch (_) {}
    cur = null; dev = []; emitted = false; lastLog = []; started = Date.now(); paused = 0; pausedAt = 0; wr("psx.emerg.t0", started);
    root.querySelector("#psxE-q").value = ""; drawRes([]); drawPac(); drawRx(); root.querySelector("#psxE-nome").focus();
  }

  /* ---------- revisão posterior ---------- */
  async function pendentes() {
    var b = window.parent && window.parent.__psxBridge, all = [];
    try { all = b && b.listSafety ? await b.listSafety() : []; } catch (_) {}
    var done = {}; all.forEach(function (e) { if (e.tipo === "emergencia_revisada" && e.contexto) done[e.contexto.ref] = 1; });
    var pend = all.filter(function (e) { return e.tipo === "emergencia_pendente" && !done[e.id]; });
    var dlg = el("dialog", { class: "modal", "aria-label": "Pendentes de revisão" });
    var body = el("div", { class: "mbody" });
    if (!pend.length) body.appendChild(el("p", { text: "Nenhuma receita do modo emergência aguardando revisão." }));
    pend.forEach(function (e) {
      var cx = e.contexto || {}, nota = el("textarea", { rows: "3", style: "width:100%", placeholder: "Complemento: anamnese, exame, escores, justificativas…" });
      body.appendChild(el("div", { class: "psxE-card", style: "margin-bottom:8px" },
        el("strong", { text: (cx.paciente || "Paciente") + " · " + (e.motivo || "") }),
        el("div", { class: "note", text: new Date(e.created_at).toLocaleString("pt-BR") + " · " + Math.round((cx.tempo_s || 0) / 60) + " min" + (e.justificativa ? " · desvios: " + e.justificativa : "") }),
        el("pre", { style: "white-space:pre-wrap;font-size:12px", text: cx.itens || "" }), nota,
        el("button", { class: "btn sm primary", type: "button", text: "Marcar como revisada", onclick: function (ev) { if (!nota.value.trim()) { toast("Escreva o complemento da revisão."); return; } window.PSX_SAFE.log({ tipo: "emergencia_revisada", dominio: "emergencia", motivo: e.motivo, justificativa: nota.value.trim(), fonte: "modo_emergencia", contexto: { ref: e.id } }); ev.target.closest(".psxE-card").remove(); toast("Revisão registrada."); } })));
    });
    dlg.append(el("div", { class: "mhead" }, el("h2", { text: "Pendentes de revisão (" + pend.length + ")" }), el("button", { class: "x", type: "button", "aria-label": "Fechar", text: "×", onclick: function () { dlg.close(); dlg.remove(); } })), body);
    document.body.appendChild(dlg); dlg.showModal();
  }

  /* ---------- botão no topo e atalhos ---------- */
  function addToggle() {
    var top = document.querySelector(".top"); if (!top || document.getElementById("psxE-toggle")) return;
    var host = top.querySelector(".ptchip"); var btn = el("button", { id: "psxE-toggle", class: "btn sm", type: "button", title: "Modo emergência (Ctrl+Shift+E)", text: "⚡ Emergência", onclick: open });
    if (host) host.parentNode.insertBefore(btn, host); else top.appendChild(btn);
  }
  addToggle(); new MutationObserver(addToggle).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") { e.preventDefault(); root ? close() : open(); return; }
    if (!root) return;
    if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); wr(PAC, pac); pushPac(); toast("Salvo."); return; }
    if (e.key === "Escape" && !modal()) { var q = root.querySelector("#psxE-q"); drawRes([]); q.focus(); return; }
    if (!e.altKey) return;
    var k = e.key.toLowerCase(), map = { b: function () { var q = root.querySelector("#psxE-q"); q.focus(); q.select(); }, p: function () { root.querySelector("#psxE-nome").focus(); }, r: finalize, m: finalize, o: orient, f: finalize, i: printNow, w: whats, n: next };
    if (map[k]) { e.preventDefault(); map[k](); }
  }, true);
  if (rd("psx.emerg.on", false)) open();
  window.PSX_EMERG = { open: open, close: close, search: search };
})();
