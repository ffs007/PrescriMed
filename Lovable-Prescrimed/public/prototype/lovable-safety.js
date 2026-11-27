/* Segurança medicamentosa aditiva (carregado após lovable-extras.js):
   - Função renal: ClCr Cockcroft-Gault padrão (peso real/ideal/ajustado), CKD-EPI 2021, MDRD, Schwartz; faixas configuráveis por população;
   - ajuste renal sugerido na linha do medicamento e bloqueio de incompatíveis com justificativa estruturada;
   - gestação/lactação: status obrigatório em mulheres em idade fértil, categorias D/X bloqueiam (com justificativa), B/C sinalizadas;
   - linha do tempo do status, alertas de reavaliação, auditoria append-only (safety_events via ponte). */
(function () {
  "use strict";
  var RN = window.PSX_RENAL || [], PG = window.PSX_PREG || [];
  var api = function () { return window.PSAPP && window.PSAPP.test; };
  var pr = function () { return window.PSAPP && window.PSAPP.pr; };
  var Cs = function () { var a = api(); return a && a.C(); };
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) && n > 0 ? n : null; };
  var nf = function (n, d) { return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 }); };
  function read(k, f) { try { return JSON.parse(localStorage.getItem(k) || "null") || f; } catch (_) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function el(tag, a) { var n = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) { [].concat(arguments[i]).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); } return n; }

  /* ---------- configuração (conta) ---------- */
  var DEF = { bands: { l: 90, m: 60, g: 30, d: 15 }, pop: { ped: null, geri: null, onco: null, uti: null } };
  function cfg() { var c = read("psx.safety", {}); c.bands = Object.assign({}, DEF.bands, c.bands || {}); c.pop = Object.assign({}, DEF.pop, c.pop || {}); return c; }
  /* ---------- dados do atendimento ---------- */
  function S() { return read("psx.safepac", {}); }
  function setS(o) { var s = Object.assign(S(), o); write("psx.safepac", s); return s; }

  /* ---------- auditoria ---------- */
  function log(ev) {
    var C = Cs() || {}, p = C.pac || {};
    ev.contexto = Object.assign({ paciente: p.nome || "", idade: p.idade || "", sexo: p.sexo || "", peso: p.peso || "", condicao: C.proto || "", renal: lastCalc ? { clcr: lastCalc.clcr, faixa: lastCalc.band } : null, gest: S().gs || "" }, ev.contexto || {});
    try { var b = window.parent && window.parent.__psxBridge; if (b && b.logSafety) { b.logSafety(ev).catch(function () { queue(ev); }); return; } } catch (_) {}
    queue(ev);
  }
  function queue(ev) { var q = read("psx.safety.queue", []); q.push(Object.assign({ em: new Date().toISOString() }, ev)); write("psx.safety.queue", q.slice(-200)); }

  /* ---------- cálculo renal ---------- */
  var BAND_N = { n: "normal", l: "leve", m: "moderada", g: "grave", d: "diálise / < 15" };
  var ORDER = ["n", "l", "m", "g", "d"];
  function population(s, anos) { if (s.pop && s.pop !== "auto") return s.pop; if (anos != null && anos < 18) return "ped"; if (anos != null && anos >= 65) return "geri"; return ""; }
  function bandOf(v, s, pop) { var c = cfg(), b = Object.assign({}, c.bands, (pop && c.pop[pop]) || {}); if (s.dial) return "d"; return v >= b.l ? "n" : v >= b.m ? "l" : v >= b.g ? "m" : v >= b.d ? "g" : "d"; }
  var lastCalc = null;
  function calc() {
    var C = Cs(); if (!C) return null; var p = C.pac, s = S(), P = pr();
    var m = P && P.idadeM(), anos = m != null ? m / 12 : null, w = P && P.peso(), cr = num(s.cr), alt = num(s.alt), sx = p.sexo;
    var r = { notas: [], anos: anos, cr: cr };
    if (!cr) { r.err = "Informe a creatinina sérica."; return (lastCalc = null, r); }
    if (anos == null) { r.err = "Informe a idade."; return (lastCalc = null, r); }
    if (!sx) { r.err = "Informe o sexo."; return (lastCalc = null, r); }
    var F = sx === "F", pop = population(s, anos);
    if (anos < 18) {
      if (!alt) { r.err = "Criança: informe a altura (Schwartz)."; return (lastCalc = null, r); }
      r.clcr = 0.413 * alt / cr; r.formula = "Schwartz (bedside)"; r.notas.push("< 18 anos: Cockcroft-Gault não é validado; usado Schwartz 0,413 × altura / creatinina.");
    } else {
      if (!w) { r.err = "Informe o peso."; return (lastCalc = null, r); }
      var crU = cr; if (s.piso && anos >= 65 && cr < 0.8) { crU = 0.8; r.notas.push("Idoso: creatinina arredondada para 0,8 mg/dL (piso ativado)."); }
      var ibw = alt ? (F ? 45.5 : 50) + 0.9 * (alt - 152.4) : null, imc = alt ? w / Math.pow(alt / 100, 2) : null, wu = w, wl = "real", modo = s.pmodo || "auto";
      if (modo === "ideal" && ibw) { wu = ibw; wl = "ideal"; }
      else if (modo === "ajustado" && ibw) { wu = ibw + 0.4 * (w - ibw); wl = "ajustado"; }
      else if (modo === "auto" && ibw) {
        if (imc >= 30 && w > ibw) { wu = ibw + 0.4 * (w - ibw); wl = "ajustado (IMC " + nf(imc, 1) + " ≥ 30)"; }
        else if (w < ibw) { wu = w; wl = "real (abaixo do ideal)"; }
        else { wu = ibw; wl = "ideal"; }
      } else if (!alt) r.notas.push("Sem altura: usado peso real. Informe a altura para peso ideal/ajustado (obesidade, extremos de peso).");
      r.clcr = (140 - anos) * wu / (72 * crU) * (F ? 0.85 : 1); r.formula = "Cockcroft-Gault"; r.peso = wu; r.pesoL = wl; r.imc = imc;
      var k = F ? 0.7 : 0.9, a = F ? -0.241 : -0.302;
      r.ckd = 142 * Math.pow(Math.min(cr / k, 1), a) * Math.pow(Math.max(cr / k, 1), -1.2) * Math.pow(0.9938, anos) * (F ? 1.012 : 1);
      r.mdrd = 175 * Math.pow(cr, -1.154) * Math.pow(anos, -0.203) * (F ? 0.742 : 1);
      if (p.gest || s.gs === "gestante") r.notas.push("Gestante: a TFG aumenta ~50% e as fórmulas subestimam a função; interpretar com cautela.");
      if (pop === "uti") r.notas.push("Paciente crítico: creatinina instável; nenhuma fórmula é confiável na lesão renal aguda; considere ClCr medido (urina de 24 h) e diurese.");
      if (s.sarc) r.notas.push("Sarcopenia / baixa massa muscular: creatinina baixa superestima a função renal; prefira cistatina C ou ClCr medido.");
    }
    var ur = num(s.ureia), di = num(s.diurese);
    if (di != null && w) { var mlkgh = di / w / 24; r.notas.push("Diurese " + nf(mlkgh, 2) + " mL/kg/h" + (mlkgh < 0.5 ? " — oligúria (critério KDIGO)." : ".")); }
    if (ur) r.notas.push("Ureia " + nf(ur, 0) + " mg/dL" + (ur / cr > 40 ? " · relação ureia/creatinina > 40 (sugere causa pré-renal)." : "."));
    if (s.dial) r.notas.push("Diálise " + (s.dial === "cont" ? "contínua (TRS contínua: doses próprias, geralmente maiores que na intermitente)." : "intermitente: preferir doses após a sessão."));
    r.pop = pop; r.band = bandOf(r.clcr, s, pop);
    lastCalc = r; return r;
  }
  function renalLabel(r) { return r && r.clcr != null ? "ClCr " + nf(r.clcr, 0) + " mL/min · " + BAND_N[r.band] : ""; }

  /* ---------- regras por medicamento ---------- */
  function matchList(list, name) { var f = " " + fold(name).replace(/[^a-z0-9]+/g, " ") + " "; return list.filter(function (x) { return x.k.some(function (k) { return f.indexOf(" " + fold(k) + " ") >= 0 || f.indexOf(" " + fold(k)) >= 0 && fold(k).length > 6; }); }); }
  function renalIssues(name) {
    var r = lastCalc; if (!r || r.clcr == null) return [];
    var bi = ORDER.indexOf(r.band), out = [];
    matchList(RN, name).forEach(function (rule) {
      var hit = null; for (var i = bi; i >= 1; i--) { var key = ORDER[i]; if (rule.r[key]) { hit = rule.r[key]; break; } }
      if (hit) out.push({ dom: "renal", block: hit[0] === "b", t: hit[1], fonte: rule.fonte, nefro: rule.nefro, lim: rule.lim, key: rule.k[0] + "|" + r.band });
      else if (rule.nefro && bi >= 1) out.push({ dom: "renal", block: false, t: "Potencialmente nefrotóxico: monitorar creatinina.", fonte: rule.fonte, nefro: true, key: rule.k[0] + "|nefro" });
    });
    return out;
  }
  /* Categoria por trimestre (IG em semanas): sem = [[de, até, cat]], tri = {t1, t2, t3}. Sem IG vale a pior. */
  var RANK = { A: 0, B: 1, C: 2, D: 3, X: 4 };
  function triOf(ig) { return ig < 14 ? 1 : ig < 28 ? 2 : 3; }
  function catByIg(x, ig) {
    var spans = x.sem || (x.tri ? [[0, 14, x.tri.t1 || x.cat], [14, 28, x.tri.t2 || x.cat], [28, 45, x.tri.t3 || x.cat]] : null);
    if (!spans) return { cat: x.cat, lbl: ig != null ? triOf(ig) + "º tri" : "" };
    if (ig == null) { var w = spans.reduce(function (a, b) { return RANK[b[2]] > RANK[a] ? b[2] : a; }, x.cat); return { cat: w, lbl: "informe a IG (vale a pior categoria)" }; }
    for (var i = 0; i < spans.length; i++) if (ig >= spans[i][0] && ig < spans[i][1]) return { cat: spans[i][2], lbl: triOf(ig) + "º tri, " + ig + " sem" };
    return { cat: x.cat, lbl: triOf(ig) + "º tri" };
  }
  window.PSX_PREG_CAT = catByIg;
  function gestIssues(name) {
    var s = S(), C = Cs(), gs = s.gs || (C && C.pac.gest ? "gestante" : ""), out = [];
    if (gs !== "gestante" && gs !== "lactante") return out;
    var igN = parseFloat(String(s.ig || "").replace(",", ".")), hasIg = igN > 0 && igN < 45;
    matchList(PG, name).forEach(function (x0) {
      var x = x0;
      if (gs === "gestante") { var rc = catByIg(x0, hasIg ? igN : null); x = Object.assign({}, x0, { cat: rc.cat, t: (rc.lbl ? rc.lbl + " — " : "") + x0.t }); }
      if (gs === "gestante") { if (x.cat === "D" || x.cat === "X") out.push({ dom: "gestacao", block: true, cat: x.cat, t: "Categoria " + x.cat + " na gestação — " + x.t, ok: x.ok, no: x.no, fonte: "FDA / ANVISA RDC 60/2010", key: x.k[0] + "|g" }); else out.push({ dom: "gestacao", block: false, cat: x.cat, t: "Categoria " + x.cat + " — " + x.t, fonte: "FDA / ANVISA", key: x.k[0] + "|g" }); }
      else { if (x.lact === "e") out.push({ dom: "lactacao", block: true, t: "Evitar na lactação — " + x.t, ok: x.ok, no: x.no, fonte: "LactMed / e-lactancia", key: x.k[0] + "|l" }); else if (x.lact === "c") out.push({ dom: "lactacao", block: false, t: "Lactação: cautela — " + x.t, fonte: "LactMed / e-lactancia", key: x.k[0] + "|l" }); }
    });
    return out;
  }
  function issuesFor(name) { return renalIssues(name).concat(gestIssues(name)); }

  /* ---------- painel no "Dados do paciente" ---------- */
  function fld(label, key, o) { o = o || {}; var s = S(); var i = el("input", { class: "in mono", inputmode: "decimal", value: s[key] || "", placeholder: o.ph || "" }); i.addEventListener("input", function () { var v = {}; v[key] = i.value; setS(v); refreshPanel(); }); if (key === "ig") i.addEventListener("change", function () { if (hasRx()) banner("A idade gestacional mudou (" + (i.value || "—") + " sem). A categoria de risco por trimestre foi recalculada: reveja os medicamentos prescritos."); log({ tipo: "mudanca_status", dominio: "gestacao", motivo: "IG " + (i.value || "—") + " semanas" }); }); return el("label", { class: "f" }, el("span", { text: label }), i); }
  function sel(label, key, opts, onch) { var s = S(), x = el("select", { class: "sel" }, opts.map(function (o) { return el("option", { value: o[0], text: o[1] }); })); x.value = s[key] || ""; x.addEventListener("change", function () { var v = {}; v[key] = x.value; setS(v); if (onch) onch(x.value); refreshPanel(); }); return el("label", { class: "f" }, el("span", { text: label }), x); }
  function chk(label, key) { var c = el("input", { type: "checkbox" }); c.checked = !!S()[key]; c.addEventListener("change", function () { var v = {}; v[key] = c.checked; setS(v); refreshPanel(); }); return el("label", { class: "check" }, c, document.createTextNode(label)); }
  var panelOut = null, gestOut = null;
  function grid() { var g = el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px" }); for (var i = 0; i < arguments.length; i++) g.appendChild(arguments[i]); return g; }
  function injectPatient() {
    var t = document.getElementById("mTitle"), b = document.getElementById("mBody");
    if (!t || !b || t.textContent !== "Dados do paciente" || b.querySelector("[data-psx-renal]")) return;
    panelOut = el("div", { "aria-live": "polite" }); gestOut = el("div");
    var adv = el("details", null, el("summary", { text: "Opções avançadas (outras fórmulas e perfis)" }),
      grid(sel("Peso usado", "pmodo", [["auto", "Automático"], ["real", "Real"], ["ideal", "Ideal"], ["ajustado", "Ajustado"]]),
        sel("População", "pop", [["auto", "Automática pela idade"], ["ped", "Pediatria"], ["geri", "Geriatria"], ["onco", "Oncologia"], ["uti", "UTI / crítico"]]),
        fld("Ureia (mg/dL)", "ureia"), fld("Diurese 24 h (mL)", "diurese")),
      el("div", { style: "display:flex;gap:16px;flex-wrap:wrap;margin-top:8px" }, chk("Piso de creatinina 0,8 em idoso (≥ 65 anos)", "piso"), chk("Sarcopenia / baixa massa muscular", "sarc")));
    b.appendChild(el("div", { class: "box", "data-psx-renal": "1", style: "margin-top:14px" },
      el("h3", null, "Função renal", el("small", { text: "Cockcroft-Gault (padrão) · recalcula a cada mudança" })),
      grid(fld("Creatinina (mg/dL)", "cr", { ph: "ex.: 1,2" }), fld("Altura (cm)", "alt", { ph: "ex.: 170" }), sel("Diálise", "dial", [["", "Não"], ["int", "Intermitente"], ["cont", "Contínua (TRS)"]])),
      adv, panelOut));
    b.appendChild(el("div", { class: "box", "data-psx-gest": "1", style: "margin-top:14px" },
      el("h3", null, "Gestação e lactação", el("small", { text: "obrigatório para mulheres de 10 a 55 anos" })),
      grid(sel("Status", "gs", [["", "— selecione —"], ["nenhum", "Não gestante / não lactante"], ["gestante", "Gestante"], ["lactante", "Lactante / amamentando"], ["puerperio", "Puérpera (não amamenta)"]], onGestChange), fld("Idade gestacional (semanas)", "ig")),
      gestOut));
    refreshPanel();
  }
  function refreshPanel() {
    var r = calc(); updChip(r);
    if (panelOut) {
      panelOut.textContent = "";
      if (r.err) panelOut.appendChild(el("div", { class: "det", text: r.err }));
      else {
        panelOut.appendChild(el("div", { class: "alertbox" + (r.band === "g" || r.band === "d" ? " bad" : "") }, el("b", { text: r.formula + ": " + nf(r.clcr, 0) + " mL/min" }), " · função renal " + BAND_N[r.band] + (r.pop ? " · população: " + r.pop : "") + (r.pesoL ? " · peso " + r.pesoL + " " + nf(r.peso, 1) + " kg" : "")));
        if (r.ckd) panelOut.appendChild(el("div", { class: "det", text: "TFGe CKD-EPI 2021: " + nf(r.ckd, 0) + " mL/min/1,73 m² · MDRD: " + nf(r.mdrd, 0) + " mL/min/1,73 m² (comparação; as doses usam o Cockcroft-Gault)." }));
        r.notas.forEach(function (n) { panelOut.appendChild(el("div", { class: "det", text: n })); });
        panelOut.appendChild(el("div", { class: "det", text: "Limitações: o Cockcroft-Gault pressupõe creatinina estável; não vale na lesão renal aguda, em amputados nem em massa muscular extrema." }));
      }
    }
    if (gestOut) {
      gestOut.textContent = ""; var s = S(), h = s.hist || [];
      if (h.length) gestOut.appendChild(el("div", { class: "det" }, el("b", { text: "Linha do tempo: " }), h.slice(-6).map(function (x) { return x.d + " " + x.gs + (x.ig ? " (" + x.ig + " sem)" : ""); }).join(" → ")));
      gestOut.appendChild(el("div", { class: "det" }, "Diretrizes: ", (window.PSX_PREG_LINKS || []).map(function (l, i) { return el("span", null, i ? " · " : "", el("a", { href: l[1], target: "_blank", rel: "noopener", text: l[0] })); })));
    }
  }
  function onGestChange(v) {
    var s = S(), h = s.hist || [], d = new Date(); h.push({ d: d.toLocaleDateString("pt-BR") + " " + d.toTimeString().slice(0, 5), gs: v, ig: s.ig || "" }); setS({ hist: h.slice(-30) });
    var C = Cs(); if (C) { C.pac.gest = v === "gestante"; var P = pr(); if (P && P.peso()) P.setPeso(P.peso()); }
    log({ tipo: "mudanca_status", dominio: "gestacao", motivo: "Status alterado para: " + v });
    if (hasRx()) banner("O status de gestação/lactação mudou. Reveja os medicamentos já prescritos.");
  }

  /* ---------- chip no topo + alertas de reavaliação ---------- */
  function updChip(r) {
    var pc = document.getElementById("ptChip"); if (!pc) return;
    var c = document.getElementById("psxRenalChip");
    if (!c) { c = el("button", { id: "psxRenalChip", class: "ptchip", type: "button", "aria-label": "Função renal", style: "margin-left:6px", onclick: function () { pc.click(); } }); pc.insertAdjacentElement("afterend", c); }
    var lbl = renalLabel(r), s = S();
    c.textContent = (lbl || "ClCr: informe creatinina") + (s.gs === "gestante" ? " · gestante" : s.gs === "lactante" ? " · lactante" : "");
    c.style.borderColor = r && (r.band === "g" || r.band === "d") ? "var(--bad)" : r && r.band === "m" ? "var(--warn)" : "";
  }
  function hasRx() { var C = Cs(); return !!C && ((C.rx && C.rx.itens && C.rx.itens.length) || Object.keys(C.rxSel || {}).some(function (k) { return C.rxSel[k] && C.rxSel[k].on !== false; })); }
  function banner(t) { var x = el("div", { class: "toast", role: "status", text: t, style: "max-width:420px" }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 6000); }
  function tick() {
    var C = Cs(); if (!C) return; var p = C.pac;
    if (!p.nome && !p.idade && !p.nasc && !p.peso && Object.keys(S()).length) { localStorage.removeItem("psx.safepac"); lastCalc = null; }
    var s = S(); if (p.gest && s.gs !== "gestante") { setS({ gs: "gestante" }); }
    var r = calc(); updChip(r);
    var sig = r && r.clcr != null ? Math.round(r.clcr) : null, prev = s.lastSig;
    if (sig != null && prev != null && Math.abs(sig - prev) / Math.max(prev, 1) > 0.1) {
      if (hasRx()) banner("A função renal mudou (ClCr " + prev + " → " + sig + " mL/min). Reavalie as doses em curso.");
      log({ tipo: "reavaliacao", dominio: "renal", motivo: "ClCr " + prev + " → " + sig + " mL/min (" + BAND_N[r.band] + ")", fonte: "Cockcroft-Gault" });
    }
    if (sig !== prev) setS({ lastSig: sig });
  }

  /* ---------- sinais na linha do medicamento ---------- */
  function badgeRows() {
    var b = document.getElementById("mBody"); if (!b) return;
    b.querySelectorAll(".dhead .nm").forEach(function (nm) {
      var sig = (lastCalc ? lastCalc.band : "") + "|" + (S().gs || "") + "|" + (S().ig || ""), row = nm.parentNode;
      if (row.getAttribute("data-psxs") === sig) return; row.setAttribute("data-psxs", sig);
      row.querySelectorAll("[data-psxb]").forEach(function (x) { x.remove(); });
      issuesFor(nm.textContent).forEach(function (i) {
        var lbl = i.dom === "renal" ? (i.block ? "renal: incompatível" : i.nefro && !i.lim ? "nefrotóxico" : "ajuste renal") : i.dom === "gestacao" ? "gestação " + i.cat + (/º tri/.test(i.t) ? " · " + i.t.match(/\dº tri/)[0] : "") : i.block ? "lactação: evitar" : "lactação: cautela";
        row.appendChild(el("span", { class: "badge" + (i.block ? " b" : " w"), "data-psxb": "1", title: i.t + " (" + i.fonte + ")", text: lbl }));
        var host = row.parentNode; if (host && !host.querySelector("[data-psxn='" + i.key + "']")) host.appendChild(el("div", { class: "det", "data-psxn": i.key, "data-psxb": "1", text: (i.block ? "⛔ " : "⚠ ") + i.t + " — sugestão revisável · " + i.fonte }));
      });
    });
  }

  /* ---------- trava na emissão ---------- */
  var overrides = {};
  function collect(body) {
    var names = [];
    body.querySelectorAll("input[type=checkbox]:checked").forEach(function (c) { var l = c.closest(".dhead") || c.closest("label"); var nm = l && (l.querySelector(".nm") || l); if (nm) names.push(nm.textContent); });
    body.querySelectorAll("textarea, input.in").forEach(function (i) { if (i.value && i.value.length > 3) i.value.split(/\n/).forEach(function (l) { names.push(l); }); });
    return names;
  }
  function needsGest() { var C = Cs(), P = pr(); if (!C || C.pac.sexo !== "F") return false; var m = P && P.idadeM(); if (m == null) return false; var a = m / 12; return a >= 10 && a <= 55 && !S().gs && !C.pac.gest; }
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("#mFoot button");
    if (!btn || btn.textContent.trim() !== "Gerar PDF" || btn.getAttribute("data-psx-pass")) return;
    var body = document.getElementById("mBody"); if (!body) return;
    var names = collect(body); calc();
    var gate = needsGest();
    var seen = {}, issues = [];
    names.forEach(function (n) { issuesFor(n).forEach(function (i) { if (seen[i.key]) return; seen[i.key] = 1; i.med = n.trim().slice(0, 120); issues.push(i); }); });
    var blocks = issues.filter(function (i) { return i.block && !overrides[i.key]; });
    issues.filter(function (i) { return !i.block; }).forEach(function (i) { if (!overrides["w" + i.key]) { overrides["w" + i.key] = 1; log({ tipo: "alerta", dominio: i.dom, medicamento: i.med, motivo: i.t, fonte: i.fonte }); } });
    if (!gate && !blocks.length) return;
    e.preventDefault(); e.stopImmediatePropagation();
    openGate(gate, blocks, function () { btn.setAttribute("data-psx-pass", "1"); btn.click(); btn.removeAttribute("data-psx-pass"); });
  }, true);

  var REASONS = ["Ausência de alternativa terapêutica", "Terapia de resgate / emergência", "Decisão compartilhada com paciente ou família", "Benefício materno supera o risco", "Dose já ajustada pelo prescritor", "Outro (descrever)"];
  function dlg(title, sub) {
    var d = document.getElementById("psxSafeDlg");
    if (!d) { d = el("dialog", { class: "modal", id: "psxSafeDlg" }, el("div", { class: "mhead" }, el("div", null, el("h2"), el("small")), el("button", { class: "x", type: "button", "aria-label": "Fechar", text: "×", onclick: function () { d.close(); } })), el("div", { class: "mbody" }), el("div", { class: "mfoot" })); document.body.appendChild(d); }
    d.querySelector("h2").textContent = title; d.querySelector("small").textContent = sub || ""; var b = d.querySelector(".mbody"), f = d.querySelector(".mfoot"); b.textContent = ""; f.textContent = ""; if (!d.open) d.showModal(); return { d: d, b: b, f: f };
  }
  function openGate(gate, blocks, proceed) {
    var s = dlg("Segurança da prescrição", "o sistema apoia a decisão; o médico decide");
    var fields = [];
    if (gate) {
      var gs = el("select", { class: "sel" }, [["", "— selecione —"], ["nenhum", "Não gestante / não lactante"], ["gestante", "Gestante"], ["lactante", "Lactante"], ["puerperio", "Puérpera (não amamenta)"]].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
      s.b.appendChild(el("div", { class: "alertbox" }, el("b", { text: "Paciente do sexo feminino em idade fértil: " }), "informe o status de gestação e lactação."));
      s.b.appendChild(el("label", { class: "f" }, el("span", { text: "Status" }), gs)); fields.push({ gate: gs });
    }
    blocks.forEach(function (i) {
      var r = el("select", { class: "sel" }, [el("option", { value: "", text: "— motivo da exceção —" })].concat(REASONS.map(function (x) { return el("option", { value: x, text: x }); })));
      var t = el("textarea", { class: "ta", rows: "2", placeholder: "Justificativa clínica (obrigatória)" });
      var extra = i.dom === "gestacao" ? el("label", { class: "check" }, el("input", { type: "checkbox" }), document.createTextNode("Riscos discutidos e concordância informada da paciente")) : null;
      s.b.appendChild(el("div", { class: "box", style: "margin-top:10px" }, el("h3", { text: i.med }), el("div", { class: "alertbox bad" }, i.t),
        i.ok ? el("div", { class: "det", text: "Uso aceitável: " + i.ok }) : null, i.no ? el("div", { class: "det", text: "Desaconselhado: " + i.no }) : null,
        el("div", { class: "det", text: "Referência: " + i.fonte + ". Para seguir sem justificar, troque ou remova o medicamento." }), r, t, extra));
      fields.push({ i: i, r: r, t: t, x: extra && extra.querySelector("input") });
      log({ tipo: "bloqueio", dominio: i.dom, medicamento: i.med, motivo: i.t, fonte: i.fonte });
    });
    var st = el("div", { class: "status" });
    s.f.appendChild(el("button", { class: "btn", type: "button", text: "Voltar e ajustar", onclick: function () { s.d.close(); } }));
    s.f.appendChild(el("button", { class: "btn primary", type: "button", text: blocks.length ? "Liberar com justificativa" : "Confirmar", onclick: function () {
      for (var k = 0; k < fields.length; k++) { var F = fields[k]; if (F.gate) { if (!F.gate.value) { st.textContent = "Selecione o status de gestação/lactação."; return; } continue; } if (!F.r.value || F.t.value.trim().length < 10) { st.textContent = "Informe motivo e justificativa (mín. 10 caracteres) para " + F.i.med + "."; return; } if (F.x && !F.x.checked) { st.textContent = "Registre a concordância informada da paciente."; return; } }
      var regate = false;
      fields.forEach(function (F) {
        if (F.gate) { setS({ gs: F.gate.value }); onGestChange(F.gate.value); regate = F.gate.value === "gestante" || F.gate.value === "lactante"; return; }
        overrides[F.i.key] = 1; log({ tipo: "liberacao", dominio: F.i.dom, medicamento: F.i.med, motivo: F.i.t + " | exceção: " + F.r.value, fonte: F.i.fonte, justificativa: F.t.value.trim(), contexto: { concordancia: F.x ? F.x.checked : null } });
      });
      s.d.close(); proceed();
    } }), st);
  }

  /* ---------- painel "Segurança medicamentosa" (faixas + registros) ---------- */
  function openPanel() {
    var s = dlg("Segurança medicamentosa", "faixas de função renal e registros de auditoria"), c = cfg();
    var pops = [["", "Padrão"], ["ped", "Pediatria"], ["geri", "Geriatria"], ["onco", "Oncologia"], ["uti", "UTI"]];
    var tbl = el("div", { style: "display:grid;grid-template-columns:110px repeat(4,1fr);gap:6px;align-items:center" }, el("b", { text: "ClCr ≥" }), el("b", { text: "Normal" }), el("b", { text: "Leve" }), el("b", { text: "Moderada" }), el("b", { text: "Grave" }));
    var inputs = [];
    pops.forEach(function (p) { var src = p[0] ? (c.pop[p[0]] || {}) : c.bands; tbl.appendChild(el("span", { text: p[1] })); ["l", "m", "g", "d"].forEach(function (k) { var i = el("input", { class: "in mono", inputmode: "decimal", value: src[k] != null ? src[k] : "", placeholder: p[0] ? String(c.bands[k]) : "" }); inputs.push([p[0], k, i]); tbl.appendChild(i); }); });
    s.b.appendChild(el("div", { class: "box" }, el("h3", null, "Faixas de alerta", el("small", { text: "limite inferior em mL/min; em branco = padrão" })), tbl,
      el("div", { class: "det", text: "Abaixo do limite de Grave = faixa de diálise / < 15. Diálise marcada no paciente sempre usa essa faixa." })));
    var lg = el("div", { class: "det", text: "Carregando registros…" });
    s.b.appendChild(el("div", { class: "box", style: "margin-top:12px" }, el("h3", null, "Registros recentes", el("small", { text: "alertas, bloqueios, liberações e reavaliações" })), lg));
    try { var br = window.parent && window.parent.__psxBridge; (br && br.listSafety ? br.listSafety() : Promise.resolve(read("psx.safety.queue", []))).then(function (rows) {
      lg.textContent = ""; if (!rows.length) { lg.textContent = "Nenhum registro ainda."; return; }
      rows.slice(0, 80).forEach(function (r) { lg.appendChild(el("div", { class: "det", style: "border-bottom:1px solid var(--line);padding:4px 0" }, el("b", { text: new Date(r.created_at || r.em).toLocaleString("pt-BR") + " · " + r.tipo + " · " + r.dominio }), " ", (r.medicamento ? r.medicamento + " — " : "") + (r.motivo || "") + (r.justificativa ? " · justificativa: " + r.justificativa : ""))); });
    }); } catch (_) { lg.textContent = "Registros indisponíveis."; }
    var st = el("div", { class: "status" });
    s.f.appendChild(el("button", { class: "btn primary", type: "button", text: "Salvar faixas", onclick: function () {
      var n = { bands: Object.assign({}, DEF.bands), pop: {} };
      inputs.forEach(function (x) { var v = num(x[2].value); if (!x[0]) { if (v != null) n.bands[x[1]] = v; } else if (v != null) { n.pop[x[0]] = n.pop[x[0]] || {}; n.pop[x[0]][x[1]] = v; } });
      write("psx.safety", n); log({ tipo: "config", dominio: "renal", motivo: "Faixas alteradas: " + JSON.stringify(n) }); st.textContent = "Faixas salvas na sua conta."; refreshPanel();
    } }), st);
  }
  function homeBtn() {
    var hero = document.querySelector("#app .hero"); if (!hero || !document.getElementById("homeQ") || hero.querySelector("[data-psx-safe]")) return;
    var row = hero.querySelector("[data-psx-home]") || hero;
    row.appendChild(el("button", { class: "btn", type: "button", "data-psx-safe": "1", text: "Segurança medicamentosa", onclick: openPanel }));
  }

  var t = null;
  new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; injectPatient(); badgeRows(); homeBtn(); }, 120); }).observe(document.body, { childList: true, subtree: true });
  setInterval(tick, 1500); tick(); homeBtn();
  window.PSX_SAFE = { calc: calc, issuesFor: issuesFor, log: log, state: S, openPanel: openPanel, label: renalLabel };
})();
