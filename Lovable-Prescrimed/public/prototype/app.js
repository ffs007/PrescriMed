/* PrescriMed — fluxo por condição: busca → painel da condição → módulos (janelas) → PDFs; assistente flutuante. */
(function () {
  "use strict";
  var D = window.PROTO_DB, HD = window.HOSP_DB, CL = window.CLIN, E = window.Engine, SC = window.SCORES;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var nf = E.nf, fold = function (s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  function h(tag, attrs) {
    var e = document.createElement(tag), a = attrs || {};
    for (var k in a) { var v = a[k]; if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else if (k === "value") e.value = v; else if (k === "checked") e.checked = !!v; else e.setAttribute(k, v === true ? "" : v); }
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) { if (c == null || c === false) return; if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; } e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var pad2 = function (n) { return String(n).padStart(2, "0"); };
  function today() { var d = new Date(); return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function nowHM() { var d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function monthsFromNasc(n) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(n || ""); if (!m) return null; var b = new Date(+m[3], +m[2] - 1, +m[1]), t = new Date(); var mo = (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth(); if (t.getDate() < b.getDate()) mo--; return mo >= 0 && mo < 1600 ? mo : null; }
  function joinPt(a) { a = a.filter(Boolean); return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " e " + a[a.length - 1]; }
  function toast(t) { var x = h("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }
  function copy(text, el) { var ok = function () { toast("Copiado."); }, fb = function () { if (el && el.select) { el.focus(); el.select(); toast("Texto selecionado — use Ctrl+C."); } else toast("Não consegui copiar automaticamente."); }; try { navigator.clipboard.writeText(text).then(ok, fb); } catch (e) { fb(); } }
  function fmtM(m) { return m >= 24 ? nf(m / 12, 0) + " anos" : m + " meses"; }

  /* ---------- SIGTAP ---------- */
  function parseCat(s) { return String(s || "").split("\n").filter(Boolean).map(function (l) { var i = l.indexOf("|"); return { c: l.slice(0, i), n: l.slice(i + 1) }; }); }
  var CAT = { comp: parseCat(window.SIGTAP_IMG), lab: parseCat(window.SIGTAP_LAB) };
  var BYCODE = new Map(CAT.comp.concat(CAT.lab).map(function (x) { return [x.c, x]; }));
  var fmtCode = function (c) { return /^\d{10}$/.test(c) ? c.replace(/^(\d{2})(\d{2})(\d{2})(\d{3})(\d)$/, "$1.$2.$3.$4-$5") : c; };

  /* ---------- configuração ---------- */
  var DEF_CFG = { estab: { nome: "HOSPITAL MUNICIPAL DE CABECEIRAS", cnes: "2437597", cidade: "Cabeceiras-GO", endereco: "Av. Presidente Juscelino, S/N, Parque São João, CEP 73872-020", telefone: "" },
    sol: { nome: "FELIPE FERREIRA DA SILVA", conselho: "CRM-GO 28469", docTipo: "CNS", docNum: "", carimbo: true }, execImg: { nome: "", cnes: "" }, execLab: { nome: "", cnes: "" } };
  var cfg = JSON.parse(JSON.stringify(DEF_CFG));
  (function () { var c = lsGet("psx.cfg"); if (c) ["estab", "sol", "execImg", "execLab"].forEach(function (k) { if (c[k]) cfg[k] = Object.assign({}, cfg[k], c[k]); }); })();

  /* ---------- atendimento (caso) ---------- */
  function blankCase() {
    return { proto: null, pac: { nome: "", cns: "", cpf: "", nasc: "", idade: "", idUn: "anos", sexo: "", peso: "", gest: false, alergias: "", mae: "", end: "", mun: "", ibge: "", uf: "", cep: "", tel: "", leito: "", raca: "" },
      anam: { qp: "", tempo: "", chips: {}, fields: {}, ant: {}, meds: "", notas: "", final: "", edited: false },
      ef: { sv: {}, sel: {}, notas: "", final: "", edited: false },
      hosp: { init: {}, dieta: "", dietaTxt: "", hid: [], sel: {}, cuid: {}, extra: [], obs: "", allCls: false, open: {} },
      rx: { itens: [], duasVias: false, naoUsar: "", visto: "", cuidados: "", alarme: "", retorno: "" }, rxSel: {}, rxAll: false, rxOpen: {},
      ctrl: { itens: [], end: "", cpf: "", semCpf: false },
      lab: { sel: {}, cid: "", desc: "", obs: "" }, comp: { sel: {}, cid: "", desc: "", obs: "", separar: true },
      scores: {}, enc: { esp: "", prio: "Eletiva", motivo: "", pergunta: "", final: "", edited: false },
      transf: { destino: "", recurso: "", regulacao: "", regulador: "", hora: "", transporte: "USA (suporte avançado)", acomp: "", disp: "Acesso venoso periférico", cond: "Estável", final: "", edited: false },
      evol: { final: "", resumo: "" }, docs: [] };
  }
  var C = lsGet("psx.case") || blankCase();
  (function () { var b = blankCase(); for (var k in b) if (C[k] == null) C[k] = b[k]; for (var k2 in b.pac) if (C.pac[k2] == null) C.pac[k2] = b.pac[k2]; })();
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { var c = Object.assign({}, C); c.docs = []; lsSet("psx.case", c); }, 400); }

  function idadeM() { var p = C.pac; if (p.idade !== "" && p.idade != null && !isNaN(parseFloat(String(p.idade).replace(",", ".")))) { var v = parseFloat(String(p.idade).replace(",", ".")); return p.idUn === "meses" ? v : v * 12; } return monthsFromNasc(p.nasc); }
  function pesoN() { var v = parseFloat(String(C.pac.peso || "").replace(",", ".")); return v > 0 && v < 400 ? v : null; }
  function sync() { E.setPatient({ peso: C.pac.peso, idadeM: idadeM(), perfil: C.pac.perfil || "auto", gest: !!C.pac.gest }); }
  function perfil() { sync(); return E.perfil(); }
  function proto() { return D.protocols.find(function (p) { return p.id === C.proto; }) || null; }
  function idadeTxt() { var m = idadeM(); return m == null ? "" : m < 24 ? Math.round(m) + " meses" : Math.floor(m / 12) + " anos"; }
  function sexoTxt() { return C.pac.sexo === "F" ? "feminino" : C.pac.sexo === "M" ? "masculino" : ""; }
  function ptLine() { var p = C.pac; return [p.nome || "Paciente sem nome", idadeTxt(), sexoTxt(), pesoN() ? nf(pesoN(), 1) + " kg" : "", p.gest ? "gestante" : ""].filter(Boolean).join(" · "); }
  function renderPt() { var p = C.pac, ok = idadeM() != null && pesoN(); $("#ptTxt").innerHTML = ""; $("#ptTxt").appendChild(h("b", { text: p.nome || "Paciente" })); $("#ptTxt").appendChild(document.createTextNode(" · " + ([idadeTxt(), pesoN() ? nf(pesoN(), 1) + " kg" : "", p.gest ? "gestante" : "", p.alergias ? "alergia: " + p.alergias : ""].filter(Boolean).join(" · ") || "informe idade e peso"))); $("#ptChip").classList.toggle("ok", !!ok); sync(); }
  function gestCode(c) { return E.gestCode(c); }

  /* ---------- Assistente PrescriMed e downloads ---------- */
  var sample = null, downloads = null;
  if (window.claude && window.claude.use) {
    window.claude.use("sample").then(function (s) { sample = s; }).catch(function () {});
    window.claude.use("downloads").then(function (d) { downloads = d; }).catch(function () {});
  }
  function aiErr(e) { var c = e && e.code; return ({ cancelled: "Interrompido.", not_granted: "Uso do Assistente PrescriMed não autorizado nesta página.", rate_limited: "Muitas solicitações agora. Tente de novo em instantes.", prompt_too_large: "Conteúdo grande demais.", refused: "O Assistente PrescriMed recusou este conteúdo." })[c] || "Falha ao consultar o Assistente PrescriMed (" + (c || "erro") + ")."; }
  async function ask(prompt, onText, tier) {
    if (!sample) throw { code: "not_granted" };
    var r = await sample(prompt, { modelTier: tier || "default", cache: false, onText: onText ? function (o) { onText(o.text); } : undefined });
    return (r.text || "").replace(/^```[a-z]*\n?|```$/g, "").replace(/\*\*/g, "").trim();
  }
  async function askJSON(prompt, tier) { if (!sample) throw { code: "not_granted" }; return sample.json(prompt, { modelTier: tier || "default", cache: false }); }

  /* ---------- PDF ---------- */
  if (window.pdfjsLib) { try { pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; } catch (e) {} }
  async function preview(ab, box) {
    box.textContent = "";
    if (!window.pdfjsLib) { box.appendChild(h("div", { class: "note", text: "PDF gerado (pré-visualização indisponível)." })); return; }
    try { var pdf = await pdfjsLib.getDocument({ data: ab }).promise; for (var i = 1; i <= Math.min(pdf.numPages, 6); i++) { var pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.5 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; box.appendChild(cv); await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; } }
    catch (e) { box.appendChild(h("div", { class: "note", text: "PDF gerado; não consegui desenhar a prévia." })); }
  }
  function fileBase(pref) { var n = (C.pac.nome || "PACIENTE").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase(); return pref + "_" + n + "_" + today().split("/").reverse().join("-") + ".pdf"; }
  function pdfBar(foot, makeDoc, name, status) {
    var last = null, pv = h("div", { class: "preview" });
    var bGen = h("button", { class: "btn primary", type: "button", text: "Gerar PDF" }), bDl = h("button", { class: "btn", type: "button", text: "Baixar PDF", disabled: true });
    bGen.addEventListener("click", async function () {
      try { if (!window.jspdf) throw new Error("gerador de PDF não carregou"); var out = makeDoc(); if (!out) return; var ab = out.doc.output("arraybuffer"); last = { ab: ab, name: typeof name === "function" ? name() : name }; bDl.disabled = false; status.textContent = "PDF pronto: " + last.name; status.className = "status ok"; await preview(ab.slice(0), pv); pv.scrollIntoView({ behavior: "smooth", block: "start" }); }
      catch (e) { status.textContent = "Não consegui gerar o PDF: " + (e.message || e); status.className = "status err"; }
    });
    bDl.addEventListener("click", async function () {
      if (!last) return; if (!downloads) { status.textContent = "Download indisponível nesta visualização."; status.className = "status err"; return; }
      try { await downloads.save({ filename: last.name, data: new Blob([last.ab], { type: "application/pdf" }) }); status.textContent = "Salvo: " + last.name; status.className = "status ok"; }
      catch (e) { var c = e && e.code; status.textContent = c === "declined" ? "Download cancelado." : "Não foi possível baixar (" + (c || "erro") + ")."; status.className = c === "declined" ? "status" : "status err"; }
    });
    foot.append(bGen, bDl);
    return pv;
  }

  /* ---------- roteamento ---------- */
  var app = $("#app"), view = C.proto ? "cond" : "home";
  function go(v) { view = v; render(); window.scrollTo(0, 0); }
  function render() { renderPt(); if (view === "cond" && proto()) renderCond(); else renderHome(); updateChatCtx(); }
  function chooseProto(id) { C.proto = id; save(); var dlg = $("#modal"); if (dlg.open) dlg.close(); go("cond"); }

  /* ======================= INÍCIO ======================= */
  var homeQ = "", homeCat = "";
  var CAT_ORDER = ["Emergência"].concat(D.protocols.map(function (p) { return p.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i && c !== "Emergência"; }));
  function searchProtos(q) {
    var toks = fold(q).trim().split(/\s+/).filter(Boolean);
    return D.protocols.filter(function (p) { if (homeCat && p.cat !== homeCat) return false; if (!toks.length) return true; var hay = fold(p.n + " " + (p.alias || "") + " " + p.cat + " " + (p.cid || []).map(function (c) { return c[0] + " " + c[1]; }).join(" ")); return toks.every(function (t) { return hay.indexOf(t) >= 0; }); })
      .sort(function (a, b) { var t = fold(q); return (fold(b.n).indexOf(t) === 0) - (fold(a.n).indexOf(t) === 0); });
  }
  function renderHome() {
    app.textContent = "";
    var res = h("div");
    var inp = h("input", { id: "homeQ", type: "search", placeholder: "Queixa, síndrome ou CID — ex.: dor lombar, febre em criança, J45, mordida de cão", autocomplete: "off", "aria-label": "Buscar condição", value: homeQ });
    inp.addEventListener("input", function () { homeQ = inp.value; list(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { var r = searchProtos(homeQ); if (r.length) chooseProto(r[0].id); } });
    var cats = h("div", { class: "cats" }, h("button", { class: "chip" + (!homeCat ? " on" : ""), type: "button", text: "Todas", onclick: function () { homeCat = ""; renderHome(); } }),
      CAT_ORDER.map(function (c) { return h("button", { class: "chip" + (homeCat === c ? " on" : ""), type: "button", text: c, onclick: function () { homeCat = homeCat === c ? "" : c; renderHome(); } }); }));
    app.append(h("section", { class: "hero" }, h("h1", { text: "Qual é o quadro?" }),
      h("p", { text: "Escolha a condição. Anamnese, exame físico, escores, prescrição hospitalar, exames (APAC), receita de alta, encaminhamentos e transferência abrem já ajustados para ela e para o paciente." }),
      h("div", { class: "search" }, h("span", { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' }), inp), cats), res);
    function list() {
      res.textContent = ""; var r = searchProtos(homeQ);
      if (!r.length) { res.appendChild(h("div", { class: "empty", text: "Nenhuma condição encontrada. Tente outro termo ou pergunte ao Assistente PrescriMed." })); return; }
      var by = {}; r.forEach(function (p) { (by[p.cat] = by[p.cat] || []).push(p); });
      CAT_ORDER.filter(function (c) { return by[c]; }).forEach(function (c) {
        res.appendChild(h("section", { class: "catgroup" }, h("h2", { text: c + " · " + by[c].length }), h("div", { class: "conds" }, by[c].map(function (p) {
          return h("button", { class: "cond", type: "button", onclick: function () { chooseProto(p.id); } }, h("b", { text: p.n }), h("small", { text: (p.cid || []).slice(0, 3).map(function (x) { return x[0]; }).join(" · ") }));
        }))));
      });
    }
    list(); setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }

  /* ======================= PAINEL DA CONDIÇÃO ======================= */
  var IC = {
    anam: '<path d="M8 3h8l4 4v14H4V3h4"/><path d="M8 11h8M8 15h6"/>', ef: '<path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M12 15v3a3 3 0 0 0 6 0v-1"/><circle cx="18" cy="15" r="2"/>',
    scores: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', hosp: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>', lab: '<path d="M9 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L15 9V3M8 3h8"/>',
    comp: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/>', rx: '<path d="M6 3h7a4 4 0 0 1 0 8H6zM6 11v10M11 11l7 10M18 14l-6 7"/>', ctrl: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    enc: '<path d="M5 12h14M13 6l6 6-6 6"/>', transf: '<path d="M3 17h2l2-6h8l2 6h4M7 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M10 7h4M12 5v4"/>', evol: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>'
  };
  var MODS = [
    ["anam", "Anamnese dirigida", function () { var n = Object.keys(C.anam.chips).length; return n ? n + " achado(s) marcado(s)" : C.anam.final ? "preenchida" : "não iniciada"; }],
    ["ef", "Exame físico dirigido", function () { var n = Object.keys(C.ef.sv).filter(function (k) { return C.ef.sv[k]; }).length; return C.ef.final ? "preenchido" + (n ? " · " + n + " sinais vitais" : "") : "não iniciado"; }],
    ["scores", "Escores e calculadoras", function () { var n = Object.keys(C.scores).length; var s = SC.SUG[C.proto] || []; return n ? n + " registrado(s)" : s.length ? "sugerido: " + s.map(function (k) { return SC.T[k].n.split(" (")[0]; }).join(", ") : "12 disponíveis"; }],
    ["hosp", "Prescrição hospitalar", function () { var n = hospItems().filter(function (i) { return !i.sec; }).length; return n > 1 ? n + " itens" : "não iniciada"; }],
    ["lab", "Exames laboratoriais", function () { var n = Object.keys(C.lab.sel).length; return n ? n + " exame(s) no pedido" : "APAC laboratorial"; }],
    ["comp", "Imagem e outros exames", function () { var n = Object.keys(C.comp.sel).length; return n ? n + " exame(s) no pedido" : "APAC de imagem/consulta"; }],
    ["rx", "Prescrição ambulatorial", function () { return C.rx.itens.length ? C.rx.itens.length + " medicamento(s)" : "VO e orientações"; }],
    ["ctrl", "Controle especial", function () { return C.ctrl.itens.length ? C.ctrl.itens.length + " item(ns)" : "Portaria 344 · 2 vias"; }],
    ["enc", "Encaminhamento ambulatorial", function () { return C.enc.final ? "redigido" : (CL.ESP[C.proto] ? CL.ESP[C.proto][0] : "referência"); }],
    ["transf", "Transferência inter-hospitalar", function () { return C.transf.final ? "redigido" : "relatório e regulação"; }],
    ["evol", "Evolução e resumo de alta", function () { return C.evol.final ? "redigida" : "texto para o prontuário"; }]
  ];
  function renderCond() {
    var p = proto(); app.textContent = "";
    app.appendChild(h("button", { class: "crumb", type: "button", onclick: function () { go("home"); } }, "← Todas as condições"));
    app.appendChild(h("div", { class: "chead" }, h("div", null, h("div", { class: "cat", text: p.cat }), h("h1", { text: p.n }),
      h("div", { class: "cids" }, (p.cid || []).map(function (c) { return h("button", { class: "chip", type: "button", title: "Copiar CID", text: c[0] + " · " + c[1], onclick: function () { copy(c[0]); } }); }))),
      h("button", { class: "btn", type: "button", text: "Dados do paciente", onclick: openPatient })));
    if (p.naoUsar) app.appendChild(h("div", { class: "alertbox bad" }, h("b", { text: "Não usar: " }), p.naoUsar));
    if (p.alerta) app.appendChild(h("div", { class: "alertbox" }, h("b", { text: "Atenção: " }), p.alerta));
    if (!pesoN() || idadeM() == null) app.appendChild(h("div", { class: "alertbox" }, h("b", { text: "Paciente: " }), "informe idade e peso para as doses serem calculadas (pediatria e doses por kg). ", h("button", { class: "btn sm", type: "button", text: "Informar agora", onclick: openPatient })));
    app.appendChild(h("div", { class: "mods" }, MODS.map(function (m) {
      var st = m[2](); var done = /marcad|preenchid|itens|exame\(s\)|medicamento|item|registrad|redigid/.test(st);
      return h("button", { class: "mod" + (done ? " done" : ""), type: "button", onclick: function () { openMod(m[0]); } }, h("span", { class: "ic", html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IC[m[0]] + "</svg>" }), h("b", { text: m[1] }), h("small", { text: st }));
    })));
    var txt = evolAuto();
    var ta = h("div", { class: "sumtxt", text: txt });
    app.appendChild(h("section", { class: "sumcard" }, h("div", { class: "btns", style: "justify-content:space-between" }, h("h2", { text: "Atendimento até agora" }), h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(txt); } })), ta));
  }

  /* ======================= JANELA DE MÓDULO ======================= */
  var dlg = $("#modal"), curMod = null;
  $("#mClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("close", function () { curMod = null; save(); if (view === "cond") renderCond(); renderPt(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  function openShell(title, sub) { $("#mTitle").textContent = title; $("#mSub").textContent = sub || ""; var b = $("#mBody"), f = $("#mFoot"); b.textContent = ""; f.textContent = ""; if (!dlg.open) dlg.showModal(); b.scrollTop = 0; dlg.scrollTop = 0; return { b: b, f: f }; }
  function openMod(id) { var p = proto(); var m = MODS.find(function (x) { return x[0] === id; }); curMod = id; var s = openShell(m[1], p.n + " · " + ptLine()); RENDER[id](s.b, s.f, p); }
  var RENDER = {};

  /* ---------- Anamnese ---------- */
  function anamGroups(p) { var g = (CL.ANAM_MAP[p.id] || CL.ANAM_MAP_CAT[p.cat] || ["dor"]).slice(); if (perfil() === "ped" && g.indexOf("ped") < 0) g.push("ped"); if (C.pac.gest && g.indexOf("obst") < 0) g.push("obst"); return g; }
  function anamText() {
    var A = C.anam, p = proto(), pos = [], neg = [], fl = [];
    Object.keys(A.chips).forEach(function (k) { var it = k.split("|")[1]; if (A.chips[k] === 1) pos.push(it); else if (A.chips[k] === 2) neg.push(it); });
    Object.keys(A.fields).forEach(function (k) { if (A.fields[k]) { var g = k.split("|")[0], f = k.split("|")[1], def = (CL.ANAM[g] && CL.ANAM[g].fields.find(function (x) { return x.k === f; })) || { l: f }; fl.push(def.l + ": " + A.fields[k]); } });
    var ant = Object.keys(A.ant).filter(function (k) { return A.ant[k]; });
    var L = [];
    L.push("QP: " + (A.qp || (p ? p.n : "")) + (A.tempo ? " há " + A.tempo : "") + ".");
    var hda = [A.notas && A.notas.trim(), pos.length ? "Refere " + joinPt(pos) + "." : "", neg.length ? "Nega " + joinPt(neg) + "." : "", fl.length ? fl.join("; ") + "." : ""].filter(Boolean).join(" ");
    L.push("HDA: " + (hda || "—"));
    L.push("Antecedentes: " + (ant.length ? joinPt(ant) : "nega comorbidades") + ". Medicações em uso: " + (A.meds || "nega") + ". Alergias: " + (C.pac.alergias || "nega alergias medicamentosas") + ".");
    return L.join("\n");
  }
  RENDER.anam = function (b, f, p) {
    var A = C.anam, out;
    function upd() { if (!A.edited) { A.final = anamText(); if (out) out.value = A.final; } save(); }
    b.appendChild(h("div", { class: "box" }, h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "Queixa principal" }), h("input", { class: "in", id: "aQp", value: A.qp, placeholder: p.n, oninput: function (e) { A.qp = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Tempo de evolução" }), h("input", { class: "in", id: "aTempo", value: A.tempo, placeholder: "ex.: 2 dias", oninput: function (e) { A.tempo = e.target.value; upd(); } }))),
      h("p", { class: "note", text: "Toque uma vez para PRESENTE (verde), outra para AUSENTE (riscado) e mais uma para limpar." })));
    anamGroups(p).forEach(function (gk) {
      var g = CL.ANAM[gk]; if (!g) return;
      var chips = h("div", { class: "chips" }, g.items.map(function (it) {
        var key = gk + "|" + it, st = A.chips[key] || 0;
        var c = h("button", { class: "chip" + (st === 1 ? " pos" : st === 2 ? " neg" : ""), type: "button", text: it, "aria-pressed": st ? "true" : "false" });
        c.addEventListener("click", function () { var s = ((A.chips[key] || 0) + 1) % 3; if (s) A.chips[key] = s; else delete A.chips[key]; c.className = "chip" + (s === 1 ? " pos" : s === 2 ? " neg" : ""); upd(); });
        return c;
      }));
      var fields = g.fields.length ? h("div", { class: "grid" }, g.fields.map(function (fd) { var k = gk + "|" + fd.k; return h("label", { class: "f" }, h("span", { text: fd.l }), h("input", { class: "in", value: A.fields[k] || "", oninput: function (e) { A.fields[k] = e.target.value; upd(); } })); })) : null;
      b.appendChild(h("div", { class: "box" }, h("h3", { text: g.l }), chips, fields));
    });
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Antecedentes, medicações e alergias" }),
      h("div", { class: "chips" }, CL.ANTEC.map(function (a) { var c = h("button", { class: "chip" + (A.ant[a] ? " pos" : ""), type: "button", text: a }); c.addEventListener("click", function () { A.ant[a] = !A.ant[a]; c.className = "chip" + (A.ant[a] ? " pos" : ""); if (a === "Gestante") { C.pac.gest = !!A.ant[a]; renderPt(); } upd(); }); return c; })),
      h("div", { class: "grid" }, h("label", { class: "f" }, h("span", { text: "Medicações em uso" }), h("input", { class: "in", value: A.meds, oninput: function (e) { A.meds = e.target.value; upd(); } })),
        h("label", { class: "f" }, h("span", { text: "Alergias" }), h("input", { class: "in", value: C.pac.alergias, placeholder: "ex.: dipirona, penicilina", oninput: function (e) { C.pac.alergias = e.target.value; renderPt(); upd(); } }))),
      h("label", { class: "f" }, h("span", { text: "Relato livre (HDA)" }), h("textarea", { class: "ta", rows: 3, value: A.notas, placeholder: "Escreva com suas palavras; o texto final junta tudo.", oninput: function (e) { A.notas = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", id: "anamFinal", rows: 8, value: A.final || anamText(), oninput: function (e) { A.final = e.target.value; A.edited = true; save(); } });
    var st = h("div", { class: "status" });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto da anamnese", h("small", { text: "edite à vontade; “Regenerar” refaz a partir das marcações" })), out, st));
    if (!A.final) { A.final = out.value; }
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { A.edited = false; upd(); } }),
      h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }),
      h("button", { class: "btn primary", type: "button", text: "Redigir com Assistente", onclick: async function (e) {
        var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente redigindo…"; st.className = "status";
        try { var txt = await ask("Redija a ANAMNESE de pronto-socorro (QP, HDA em texto corrido, antecedentes, medicações, alergias) para prontuário, em português clínico, objetiva. Use SOMENTE os dados abaixo; não invente sintomas, tempos ou achados. Mantenha positivos e negativos pertinentes. Sem markdown.\n\nCONDIÇÃO EM AVALIAÇÃO: " + p.n + "\nPACIENTE: " + ptLine() + "\n\nDADOS:\n" + anamText(), function (t) { out.value = t; }, "default");
          A.final = txt; A.edited = true; out.value = txt; st.textContent = "Pronto. Revise antes de usar."; st.className = "status ok"; save(); }
        catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; }
      } }), st);
  };

  /* ---------- Exame físico ---------- */
  function efSystems(p) {
    var s = (CL.EF_MAP[p.id] || CL.EF_MAP_CAT[p.cat] || ["geral"]).slice();
    if (C.pac.sexo === "F") s = s.filter(function (x) { return x !== "gu"; }); if (C.pac.sexo === "M") s = s.filter(function (x) { return ["gine", "obst"].indexOf(x) < 0; });
    if (perfil() === "ped" && s.indexOf("ped") < 0) s.unshift("ped");
    if (C.pac.gest && s.indexOf("obst") < 0) s.push("obst");
    return s;
  }
  function efText() {
    var F = C.ef, p = proto(), L = [];
    var sv = CL.SV.filter(function (x) { return F.sv[x[0]]; }).map(function (x) { return x[1] + " " + F.sv[x[0]] + (x[2] === "0–10" ? "/10" : " " + x[2]); });
    if (sv.length) L.push("Sinais vitais: " + sv.join(", ") + ".");
    efSystems(p).forEach(function (sk) { var S = CL.EF[sk]; if (!S) return;
      var parts = S.it.map(function (it) { var sel = F.sel[sk + "." + it.k] || []; return sel.length ? sel.map(function (i) { return it.alt[i]; }).join(", ") : it.n; });
      L.push(S.l + ": " + parts.join("; ") + "."); });
    if (F.notas) L.push(F.notas);
    return L.join("\n");
  }
  RENDER.ef = function (b, f, p) {
    var F = C.ef, out;
    function upd() { if (!F.edited) { F.final = efText(); if (out) out.value = F.final; } save(); }
    if (!F.sv.peso && C.pac.peso) F.sv.peso = C.pac.peso;
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Sinais vitais" }), h("div", { class: "grid" }, CL.SV.map(function (x) {
      return h("label", { class: "f" }, h("span", { text: x[1] + " (" + x[2] + ")" }), h("input", { class: "in mono", inputmode: x[0] === "pa" ? "text" : "decimal", value: F.sv[x[0]] || "", oninput: function (e) { F.sv[x[0]] = e.target.value; if (x[0] === "peso") { C.pac.peso = e.target.value; renderPt(); } upd(); } }));
    }))));
    efSystems(p).forEach(function (sk) {
      var S = CL.EF[sk]; if (!S) return;
      var box = h("div", { class: "box" }, h("h3", { text: S.l }));
      S.it.forEach(function (it) {
        var key = sk + "." + it.k, row = h("div", { class: "efrow" }, h("span", { text: it.l })), chips = h("div", { class: "chips" });
        function draw() {
          chips.textContent = ""; var sel = F.sel[key] || [];
          chips.appendChild(h("button", { class: "chip norm" + (sel.length ? "" : " on"), type: "button", text: it.n, onclick: function () { delete F.sel[key]; draw(); upd(); } }));
          it.alt.forEach(function (a, i) { chips.appendChild(h("button", { class: "chip alt" + (sel.indexOf(i) >= 0 ? " on" : ""), type: "button", text: a, onclick: function () { var s = (F.sel[key] || []).slice(), j = s.indexOf(i); if (j >= 0) s.splice(j, 1); else s.push(i); if (s.length) F.sel[key] = s; else delete F.sel[key]; draw(); upd(); } })); });
        }
        draw(); row.appendChild(chips); box.appendChild(row);
      });
      b.appendChild(box);
    });
    b.appendChild(h("div", { class: "box" }, h("label", { class: "f" }, h("span", { text: "Outros achados" }), h("textarea", { class: "ta", rows: 2, value: F.notas, oninput: function (e) { F.notas = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", rows: 9, value: F.final || efText(), oninput: function (e) { F.final = e.target.value; F.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto do exame físico", h("small", { text: "normal por padrão; marque só o que estiver alterado" })), out));
    if (!F.final) F.final = out.value;
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { F.edited = false; upd(); } }), h("button", { class: "btn primary", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }));
  };

  /* ---------- Escores ---------- */
  var scoreCur = null, scoreVals = {};
  RENDER.scores = function (b, f, p) {
    var sug = SC.SUG[p.id] || [], order = SC.ORDER.slice().sort(function (x, y) { return (sug.indexOf(y) >= 0) - (sug.indexOf(x) >= 0); });
    if (!scoreCur || order.indexOf(scoreCur) < 0) scoreCur = sug[0] || order[0];
    var tools = h("div", { class: "chips" }), form = h("div", { class: "box" }), status = h("div", { class: "status" });
    b.append(h("div", { class: "box" }, h("h3", null, "Escolha o escore", h("small", { text: sug.length ? "em destaque: sugeridos para " + p.n : "" })), tools), form);
    function draw() {
      tools.textContent = ""; order.forEach(function (k) { tools.appendChild(h("button", { class: "chip" + (k === scoreCur ? " on" : sug.indexOf(k) >= 0 ? " pos" : ""), type: "button", text: SC.T[k].n, onclick: function () { scoreCur = k; draw(); } })); });
      var t = SC.T[scoreCur], fields = t.f(), v = scoreVals[scoreCur] = scoreVals[scoreCur] || {}, tch = v._t = v._t || {};
      form.textContent = ""; form.appendChild(h("h3", { text: t.n }));
      var grid = h("div", { class: "grid" }), res = h("div", { class: "sc-res" });
      fields.forEach(function (fd) {
        if (v[fd.k] == null || (!tch[fd.k] && fd.def !== "" && fd.def != null)) v[fd.k] = fd.def;
        var inp = fd.num ? h("input", { class: "in mono", inputmode: "decimal", value: v[fd.k] }) : h("select", { class: "sel" }, fd.opts.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
        if (!fd.num) inp.value = v[fd.k];
        inp.addEventListener(fd.num ? "input" : "change", function () { v[fd.k] = inp.value; tch[fd.k] = true; upd(); });
        grid.appendChild(h("label", { class: "f" }, h("span", { text: fd.l }), inp));
      });
      form.append(grid, res, status); if (t.note) form.appendChild(h("div", { class: "note", text: t.note }));
      function upd() {
        var r = t.calc(v), lbl = (typeof r.s === "number" ? t.n.split(" (")[0] + " " + r.s : r.s) + " · " + r.t, summ = t.n + ": " + (typeof r.s === "number" ? r.s + " pontos" : r.s) + " — " + r.t + ". Conduta: " + r.c;
        res.className = "sc-res " + r.cls; res.textContent = ""; res.append(h("div", { class: "sc-big", text: lbl }), r.c ? h("p", { text: r.c, style: "margin:6px 0 0" }) : null);
        var act = h("div", { class: "btns", style: "margin-top:10px" });
        act.appendChild(h("button", { class: "btn sm", type: "button", text: "Registrar no atendimento", onclick: function () { C.scores[scoreCur] = summ; save(); status.textContent = "Registrado: entra na evolução e no contexto do Assistente PrescriMed."; status.className = "status ok"; } }));
        if (r.o) act.appendChild(h("button", { class: "btn sm", type: "button", text: "Incluir nas orientações de alta", onclick: function () { addOrient(r.o); C.scores[scoreCur] = summ; save(); status.textContent = "Incluído em “Como se cuidar” da receita de alta."; status.className = "status ok"; } }));
        (r.acts || []).forEach(function (a) { act.appendChild(h("button", { class: "btn sm primary", type: "button", text: a.l, onclick: function () { C.scores[scoreCur] = summ; save(); a.fn(); } })); });
        res.appendChild(act);
      }
      upd();
    }
    draw();
    f.appendChild(h("span", { class: "note", text: "Os escores registrados aparecem na evolução e no contexto do Assistente PrescriMed." }));
  };
  function addOrient(txt) { C.rx.cuidados = (C.rx.cuidados ? C.rx.cuidados.replace(/\s+$/, "") + "\n" : "") + txt; save(); }
  window.PSAPP = {
    pr: { current: function () { return proto(); }, choose: function (id) { chooseProto(id); }, peso: function () { return pesoN(); }, idadeM: function () { return idadeM(); }, gest: function () { return !!C.pac.gest; },
      setScore: function (k, t) { if (t) C.scores[k] = t; else delete C.scores[k]; save(); }, markExam: function (code, lab) { (lab ? C.lab : C.comp).sel[code] = { just: "" }; save(); },
      selDrug: function (id, o) { var x = C.rxSel[id] = C.rxSel[id] || {}; for (var k in o) x[k] = o[k]; save(); }, setPeso: function (w) { if (w > 0) { C.pac.peso = String(w).replace(".", ","); renderPt(); save(); } }, render: function () {} },
    addOrient: addOrient, goModule: function (id) { openMod(id); }
  };

  /* alergia registrada: bloqueia o próprio fármaco e a classe das penicilinas/sulfas; avisa reação cruzada */
  function allergy(name) {
    var A = fold(C.pac.alergias || ""); if (!A.trim() || /^(nega|nkda|sem alergia|nao)/.test(A.trim())) return {};
    var toks = A.split(/[,;/]+|\s+e\s+/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 3; }), n = fold(name), first = n.replace(/^(cloridrato|sulfato|fosfato|succinato|bromidrato|maleato|citrato|acetato|trometamol|sodica|sodico|potassica)\s+(de\s+)?/, '').split(/[\s+]/)[0];
    var pen = /penicil|amoxi|ampicil|benzatin|oxacil/, aine = /aine|anti-?inflamat|cetorolac|cetoprofen|tenoxicam|diclofenac|ibuprofen|nimesulid|naproxen/, sulfa = /sulfa/;
    for (var i = 0; i < toks.length; i++) { var t = toks[i];
      if (n.indexOf(t) >= 0 || (first.length > 3 && t.indexOf(first) >= 0)) return { block: "ALERGIA registrada (" + t + ") — bloqueado. Se o registro estiver errado, corrija em Dados do paciente." };
      if (pen.test(t) && /cilin|penicil/.test(n)) return { block: "ALERGIA a penicilina registrada — bloqueado (mesma classe)." };
      if (sulfa.test(t) && /sulfametox|sulfadiaz|sulfassalaz|sulfadox/.test(n)) return { block: "ALERGIA a sulfa registrada — bloqueado." };
      if (pen.test(t) && /^cef/.test(n)) return { warn: "Alergia a penicilina registrada: reação cruzada com cefalosporina é rara (≈ 1–2%), mas evitar se a reação foi anafilaxia." };
      if (aine.test(t) && /cetorolac|cetoprofen|tenoxicam|diclofenac|ibuprofen|nimesulid|naproxen|aas|acetilsalicil/.test(n)) return { block: "ALERGIA/intolerância a AINE registrada — bloqueado (mesma classe)." };
      if (/dipiron|metamizol/.test(t) && /dipiron/.test(n)) return { block: "ALERGIA a dipirona registrada — bloqueado." }; }
    return {};
  }
  function aIdx(d, sel) { if (sel.ai != null) return sel.ai; var a = idadeM(); return d.ido != null && a != null && a >= 780 ? d.ido : 0; }
  var AINE_RE = /cetorolac|cetoprofen|tenoxicam|diclofenac|ibuprofen|nimesulid|naproxen|piroxicam|meloxicam|aas|acido acetilsalicilico|acetilsalicil/;
  function protoBlock(name) { var n = fold(name); if (C.proto === "dengue" && AINE_RE.test(n)) return "Contraindicado na dengue: AINE/AAS aumentam o risco de sangramento."; if (C.proto === "varicela" && AINE_RE.test(n)) return "Contraindicado na varicela: AAS (síndrome de Reye) e AINE (infecção grave de pele)."; return null; }
  function rxCalc(id, sl) { var pb = protoBlock(D.drugs[id].n); if (pb) return { ok: false, err: pb }; var r = E.calc(id, sl); if (r && r.ok) { var al = allergy(D.drugs[id].n); if (al.block) return { ok: false, err: al.block }; if (al.warn) { r.warn = (r.warn || []).concat([al.warn]); } } return r; }
  /* ---------- Prescrição hospitalar ---------- */
  function hcalc(id, sel) {
    sel = sel || {}; var d = HD.drugs[id], w = pesoN(), a = idadeM(), pf = perfil(), warn = [], r;
    var aMode = pf !== "ped" && d.a && d.a.length && (sel.mode === "a" || (sel.mode == null && d.paDef === "a"));
    var usePed = !aMode && (pf === "ped" || (d.pa && w && d.p && d.p.regs));
    if (!usePed) { if (!d.a || !d.a.length) return { ok: false, err: "Sem esquema adulto cadastrado." }; var ai = aIdx(d, sel); r = { ok: true, text: d.a[ai] || d.a[0], det: "" }; if (sel.ai == null && d.ido != null && ai === d.ido) warn.push("≥ 65 anos: esquema de dose reduzida selecionado automaticamente."); }
    else {
      var p = d.p; if (!p) return { ok: false, err: "Sem esquema pediátrico nesta base — não usar em criança sem orientação especializada." };
      if (pf === "ped" && p.min && a != null && a < p.min) return { ok: false, err: p.min >= 9999 ? "Somente adulto nesta base." : "Uso a partir de " + fmtM(p.min) + "." };
      if (pf === "ped" && p.min && a == null) warn.push("Informe a idade (mínimo " + fmtM(p.min) + ").");
      if (p.lact && a != null && a < p.lact.ate) { if (!w) return { ok: false, err: "Informe o peso." }; var ld = Math.round(p.lact.mgkg * w * 10) / 10; r = { ok: true, text: p.lact.t.replace("{d}", nf(ld, 1)), det: nf(p.lact.mgkg) + " mg/kg × " + nf(w, 1) + " kg = " + nf(ld, 1) + " mg (< " + p.lact.ate + " meses)" }; }
      else if (p.fix) { var key = p.fix === "peso" ? w : a; if (key == null) return { ok: false, err: p.fix === "peso" ? "Informe o peso." : "Informe a idade." }; var bd = p.faixas.find(function (x) { return key < x.ate || (p.fix === "peso" && key <= x.ate); }); if (!bd) return { ok: false, err: "Fora das faixas cadastradas." }; r = { ok: true, text: bd.t, det: "Faixa por " + p.fix }; }
      else if (p.tipo) { if (!w) return { ok: false, err: "Informe o peso." }; var n = Math.min(p.max, Math.max(p.min, Math.round(w / p.porKg))); r = { ok: true, text: d.n + " " + d.ap + ": " + n + (p.tipo === "jatos" ? " jatos " : " gotas ") + p.t, det: "1 " + (p.tipo === "jatos" ? "jato" : "gota") + " a cada " + p.porKg + " kg (mín. " + p.min + ", máx. " + p.max + ")" }; }
      else {
        if (!w) return { ok: false, err: "Informe o peso." };
        var reg = p.regs.find(function (x) { return x.id === sel.reg; }) || p.regs[0], raw = reg.mgkg * w, dose = Math.min(raw, reg.max), capped = raw > reg.max + 1e-9, volT = "";
        if (d.c && d.un !== "mL") { var vr = dose / d.c, stp = d.r || 0.1; if (vr < 1) stp = Math.min(stp, 0.05); if (vr < 0.5) stp = Math.min(stp, 0.02); var vol = Math.max(stp, Math.round(vr / stp) * stp); while ((vol * d.c > reg.max * 1.0001 || vol * d.c > dose * 1.1) && vol - stp > 0) vol -= stp; if (vol < 0.1 && vol * d.c > 0) warn.push("Volume < 0,1 mL: aspirar em seringa de 1 mL (ou diluir antes) e conferir."); vol = Math.round(vol * 100) / 100; dose = vol * d.c; volT = " (" + nf(vol, 2) + " mL)"; }
        if (d.un === "mL") { var st2 = dose < 2 ? 0.1 : dose < 10 ? 0.5 : 1; dose = Math.max(st2, Math.round(dose / st2) * st2); }
        var dT = d.un === "mL" ? nf(dose, 1) + " mL" : nf(dose, dose < 10 ? 2 : dose < 100 ? 1 : 0) + " " + d.un;
        r = { ok: true, text: d.n + " " + d.ap.split(" — ")[0] + ": " + dT + volT + (reg.dil ? ", " + reg.dil : "") + ", " + (reg.inf || d.via) + ", " + reg.freq, det: nf(reg.mgkg) + " " + (d.un === "mL" ? "mL" : d.un) + "/kg × " + nf(w, 1) + " kg = " + nf(raw, 2) + (capped ? " → teto " + nf(reg.max) : "") + (pf !== "ped" ? " · dose por peso no adulto" : "") };
      }
    }
    if (pf === "ped" && d.p && d.p.ivMin && a != null && a < d.p.ivMin) warn.push(d.p.ivMsg);
    if (C.pac.gest) { if (d.gx) return { ok: false, err: "Contraindicado na gestação: " + d.gx }; if (d.gc) warn.push("Gestação: " + d.gc); }
    var pb = protoBlock(d.n); if (pb) return { ok: false, err: pb };
    var al = allergy(d.n); if (al.block) return { ok: false, err: al.block }; if (al.warn) warn.push(al.warn);
    r.warn = warn; return r;
  }
  var HPRESETS = [
    ["exp", "Expansão volêmica"], ["man_ad", "Manutenção — adulto"], ["hs", "Manutenção — criança (Holliday-Segar)"], ["planoB", "Plano B — reidratação oral no serviço"],
    ["planoC", "Plano C — desidratação grave (MS)"], ["dengC", "Dengue grupo C"], ["dengD", "Dengue grupo D (choque)"]
  ];
  function gts(mlh) { return "≈ " + Math.round(mlh / 3) + " gotas/min (" + Math.round(mlh) + " microgotas/min)"; }
  function hidrCalc(k, w, aM, opt) {
    var ped = perfil() === "ped"; if (!w && k !== "man_ad") return { err: "Informe o peso." };
    var L = [], note = "";
    if (k === "exp") { if (ped) { var v = Math.round((opt === "10" ? 10 : 20) * w); L.push("SF 0,9% " + v + " mL EV em 20 a 30 min (" + (opt === "10" ? "10" : "20") + " mL/kg); reavaliar perfusão, FC e diurese e repetir se necessário"); } else L.push(opt === "500" ? "SF 0,9% 500 mL EV em 30 min (idoso/cardiopata); reavaliar" : "SF 0,9% 1.000 mL EV em 30 a 60 min; reavaliar perfusão e PA"); note = "Cardiopata, DRC ou dengue: 10 mL/kg."; }
    else if (k === "man_ad") { var vol = opt === "2000" ? 2000 : opt === "1000" ? 1000 : 1500; L.push("SF 0,9% " + nf(vol, 0) + " mL EV em 24 h — " + Math.round(vol / 24) + " mL/h, " + gts(vol / 24)); L.push("(alternativa: Ringer lactato no mesmo volume)"); }
    else if (k === "hs") { var tot = w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20); tot = Math.min(tot, 2400); var mlh = tot / 24;
      L.push("Soro de manutenção isotônico (SG 5% 500 mL + NaCl 20% 20 mL + KCl 19,1% 5 mL): " + nf(Math.round(tot), 0) + " mL/24 h — " + nf(Math.round(mlh), 0) + " mL/h, " + gts(mlh)); note = "Holliday-Segar: 100 mL/kg (até 10 kg) + 50 mL/kg (10–20 kg) + 20 mL/kg (> 20 kg); máx. 2.400 mL/dia. Solução final ≈ Na 130 e K 24 mEq/L. Ajustar se hiponatremia, cardiopatia ou SIADH."; }
    else if (k === "planoB") { L.push("Soro de reidratação oral " + nf(Math.round(50 * w), 0) + " a " + nf(Math.round(100 * w), 0) + " mL em 4 a 6 h, em pequenos volumes (50–100 mL/kg); reavaliar ao fim"); }
    else if (k === "planoC") { var menor5 = aM != null && aM < 60;
      if (menor5) { L.push("Fase rápida: SF 0,9% " + nf(Math.round(20 * w), 0) + " mL EV em 30 min (20 mL/kg); repetir até sinais de hidratação"); }
      else { L.push("Fase rápida: SF 0,9% " + nf(Math.round(30 * w), 0) + " mL EV em 30 min (30 mL/kg)"); L.push("Em seguida: Ringer lactato " + nf(Math.round(70 * w), 0) + " mL EV em 2 h 30 min (70 mL/kg)"); }
      note = "Plano C do Ministério da Saúde. Após hidratado: manutenção + reposição; iniciar SRO assim que possível."; }
    else if (k === "dengC") { L.push("Expansão: SF 0,9% ou Ringer " + nf(Math.round(10 * w), 0) + " mL EV na 1ª hora (10 mL/kg); reavaliar e repetir até 3 vezes"); L.push("Melhora: manutenção " + nf(Math.round(25 * w), 0) + " mL em 6 h (25 mL/kg) e depois " + nf(Math.round(25 * w), 0) + " mL em 8 h"); L.push("Hematócrito 2 h após a expansão; diurese e sinais vitais de 1/1 h"); note = "Manejo da dengue (MS): grupo C = sinais de alarme."; }
    else if (k === "dengD") { L.push("Expansão rápida: SF 0,9% " + nf(Math.round(20 * w), 0) + " mL EV em 20 min (20 mL/kg); repetir até 3 vezes"); L.push("Hematócrito após cada fase; se refratário, regulação para UTI"); note = "Grupo D = choque ou sangramento grave."; }
    return { lines: L, note: note };
  }
  function hospInit(p) {
    var H = C.hosp; if (H.init[p.id]) return; H.init[p.id] = true;
    var di = HD.dietaMap[p.id]; H.dieta = HD.dietas[di != null ? di : 2];
    (HD.cuidMap[p.id] || ["ssvv", "avp", "avisar"]).forEach(function (k) { H.cuid[k] = true; });
    (HD.map[p.id] || []).forEach(function (k, i) { if (H.open[k] == null) H.open[k] = i < 2; });
  }
  function hospItems() {
    var H = C.hosp, it = [], n = 0, push = function (t) { it.push({ n: ++n, text: t }); };
    if (H.dieta || H.dietaTxt) push([H.dieta, H.dietaTxt].filter(Boolean).join(". "));
    H.hid.forEach(push);
    Object.keys(H.sel).forEach(function (id) { var s = H.sel[id]; if (!s.on || !HD.drugs[id]) return; var r = hcalc(id, s); if (r.ok) push(r.text); });
    HD.cuidados.forEach(function (c) { if (H.cuid[c[0]]) push(c[1]); });
    H.extra.forEach(push);
    return it;
  }
  RENDER.hosp = function (b, f, p) {
    var H = C.hosp; hospInit(p);
    if (!pesoN()) b.appendChild(h("div", { class: "alertbox" }, "Sem peso: doses por kg e hidratação não podem ser calculadas. ", h("button", { class: "btn sm", type: "button", text: "Informar", onclick: openPatient })));
    var prev = h("div", { class: "rxlist" });
    function drawPrev() { prev.textContent = ""; var it = hospItems(); if (!it.length) prev.appendChild(h("div", { class: "note", text: "Nada prescrito ainda." })); it.forEach(function (x) { prev.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: x.n + "." }), h("span", { class: "t", text: x.text }), h("span"))); }); save(); }
    /* dieta */
    var dSel = h("select", { class: "sel", onchange: function (e) { H.dieta = e.target.value; drawPrev(); } }, h("option", { value: "", text: "— sem dieta na prescrição —" }), HD.dietas.map(function (d) { return h("option", { value: d, text: d }); })); dSel.value = H.dieta;
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Dieta" }), h("div", { class: "grid" }, dSel, h("input", { class: "in", placeholder: "complemento (ex.: liberar após 6 h)", value: H.dietaTxt, oninput: function (e) { H.dietaTxt = e.target.value; drawPrev(); } }))));
    /* hidratação */
    var hidBox = h("div", { class: "box" }, h("h3", null, "Hidratação venosa / oral", h("small", { text: "calculada pelo peso" })));
    var pre = h("select", { class: "sel" }, HPRESETS.map(function (x) { return h("option", { value: x[0], text: x[1] }); })), opt = h("select", { class: "sel" }), out = h("div"), list = h("div", { class: "rxlist" });
    if (p.id === "dengue") pre.value = "dengC"; else if (p.id === "geca") pre.value = perfil() === "ped" ? "planoB" : "exp"; else if (perfil() === "ped") pre.value = "hs"; else pre.value = "man_ad";
    function opts() { opt.textContent = ""; var o = pre.value === "exp" ? (perfil() === "ped" ? [["20", "20 mL/kg"], ["10", "10 mL/kg (cardiopata/dengue)"]] : [["1000", "1.000 mL"], ["500", "500 mL (idoso/cardiopata)"]]) : pre.value === "man_ad" ? [["1500", "1.500 mL/24 h"], ["2000", "2.000 mL/24 h"], ["1000", "1.000 mL/24 h"]] : [["", "—"]]; o.forEach(function (x) { opt.appendChild(h("option", { value: x[0], text: x[1] })); }); opt.hidden = o.length < 2; calc(); }
    function calc() { out.textContent = ""; var r = hidrCalc(pre.value, pesoN(), idadeM(), opt.value); if (r.err) { out.appendChild(h("div", { class: "err", text: r.err })); return; } r.lines.forEach(function (l) { out.appendChild(h("div", { class: "line", text: l })); }); if (r.note) out.appendChild(h("div", { class: "det", text: r.note })); out._lines = r.lines; }
    function drawList() { list.textContent = ""; H.hid.forEach(function (l, i) { list.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: "•" }), h("span", { class: "t", text: l }), h("button", { class: "x", type: "button", "aria-label": "Remover", text: "×", onclick: function () { H.hid.splice(i, 1); drawList(); drawPrev(); } }))); }); }
    pre.addEventListener("change", opts); opt.addEventListener("change", calc);
    hidBox.append(h("div", { class: "grid" }, pre, opt), out, h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Adicionar à prescrição", onclick: function () { (out._lines || []).forEach(function (l) { if (!/^\(alternativa/.test(l)) H.hid.push(l); }); drawList(); drawPrev(); } })), list);
    b.appendChild(hidBox); opts(); drawList();
    /* medicamentos */
    var medBox = h("div", { class: "box" }), clsWrap = h("div", { class: "chips" }), rows = h("div");
    medBox.append(h("h3", null, "Medicamentos", h("small", { text: perfil() === "ped" ? "pediátrico — dose, volume e diluição por kg" : "adulto — esquema pronto; doses por kg quando aplicável" })), clsWrap,
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: H.allCls, onchange: function (e) { H.allCls = e.target.checked; drawCls(); } }), "Mostrar todas as classes"), rows);
    b.appendChild(medBox);
    function classesFor() { var base = HD.map[p.id] || []; return H.allCls ? base.concat(Object.keys(HD.classes).filter(function (k) { return base.indexOf(k) < 0; })) : base; }
    function drawCls() {
      clsWrap.textContent = ""; var ks = classesFor();
      if (!ks.length) clsWrap.appendChild(h("span", { class: "note", text: "Condição de manejo ambulatorial. Marque “Mostrar todas as classes” se precisar de medicação na observação." }));
      ks.forEach(function (k) { clsWrap.appendChild(h("button", { class: "chip" + (H.open[k] ? " on" : ""), type: "button", text: HD.classes[k].n, onclick: function () { H.open[k] = !H.open[k]; drawCls(); } })); });
      drawRows();
    }
    function drawRows() {
      rows.textContent = ""; var seen = {};
      classesFor().filter(function (k) { return H.open[k]; }).forEach(function (k) {
        var cl = HD.classes[k]; rows.appendChild(h("h3", { text: cl.n, style: "font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:8px" }));
        cl.d.forEach(function (id) { if (seen[id]) return; seen[id] = 1; rows.appendChild(hRow(id)); });
      });
    }
    function hRow(id) {
      var d = HD.drugs[id], s = H.sel[id] = H.sel[id] || {}, r = hcalc(id, s), row = h("div", { class: "drow" });
      var cb = h("input", { type: "checkbox", checked: !!s.on && r.ok, disabled: !r.ok, onchange: function (e) { s.on = e.target.checked; drawPrev(); } });
      row.appendChild(h("label", { class: "dhead" }, cb, h("span", { class: "nm", text: d.n }), h("span", { class: "badge", text: d.via }), d.atb ? h("span", { class: "badge", text: "antimicrobiano" }) : null, C.pac.gest && d.gx ? h("span", { class: "badge b", text: "contraindicado na gestação" }) : C.pac.gest && d.gc ? h("span", { class: "badge w", text: "gestação: cautela" }) : null));
      var pf = perfil(), aMode = pf !== "ped" && d.a && d.a.length && (s.mode === "a" || (s.mode == null && d.paDef === "a")), usePed = !aMode && (pf === "ped" || (d.pa && pesoN() && d.p && d.p.regs));
      if (pf !== "ped" && d.pa && pesoN() && d.p && d.p.regs && d.a && d.a.length) {
        var cs = h("select", { class: "sel" }, h("optgroup", { label: "Por peso (" + nf(pesoN(), 1) + " kg)" }, d.p.regs.map(function (x) { return h("option", { value: "r:" + x.id, text: x.l }); })), h("optgroup", { label: "Esquema pronto" }, d.a.map(function (t, i) { return h("option", { value: "a:" + i, text: t.length > 110 ? t.slice(0, 108) + "…" : t }); })));
        cs.value = aMode ? "a:" + (s.ai || 0) : "r:" + (s.reg || d.p.regs[0].id);
        cs.addEventListener("change", function () { var v = cs.value.split(":"); if (v[0] === "a") { s.mode = "a"; s.ai = +v[1]; } else { s.mode = "r"; s.reg = v[1]; } refresh(); });
        row.appendChild(cs);
      } else if (!usePed && d.a && d.a.length > 1) { var se = h("select", { class: "sel" }, d.a.map(function (t, i) { return h("option", { value: i, text: t }); })); se.value = aIdx(d, s); se.addEventListener("change", function () { s.ai = +se.value; refresh(); }); row.appendChild(se); }
      if (usePed && d.p && d.p.regs && d.p.regs.length > 1) { var sr = h("select", { class: "sel" }, d.p.regs.map(function (x) { return h("option", { value: x.id, text: x.l }); })); sr.value = s.reg || d.p.regs[0].id; sr.addEventListener("change", function () { s.reg = sr.value; refresh(); }); row.appendChild(sr); }
      var pv = h("div"); row.appendChild(pv);
      function refresh() { r = hcalc(id, s); pv.textContent = ""; cb.disabled = !r.ok; if (!r.ok) { s.on = false; cb.checked = false; pv.appendChild(h("div", { class: "err", text: "⛔ " + r.err })); } else { pv.appendChild(h("div", { class: "line", text: r.text })); if (r.det) pv.appendChild(h("div", { class: "det", text: r.det })); (r.warn || []).forEach(function (w) { pv.appendChild(h("div", { class: "warn", text: "⚠ " + w })); }); } if (d.nota) pv.appendChild(h("div", { class: "det", text: d.nota })); drawPrev(); }
      refresh(); return row;
    }
    drawCls();
    /* cuidados */
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Cuidados e monitorização" }), h("div", { class: "grid" }, HD.cuidados.map(function (c) { return h("label", { class: "check" }, h("input", { type: "checkbox", checked: !!H.cuid[c[0]], onchange: function (e) { H.cuid[c[0]] = e.target.checked; drawPrev(); } }), c[1]); }))));
    var ex = h("input", { class: "in", placeholder: "Outro item (ex.: Reavaliação médica em 2 h)" });
    var exList = h("div", { class: "rxlist" });
    function drawEx() { exList.textContent = ""; H.extra.forEach(function (t, i) { exList.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: "+" }), h("span", { class: "t", text: t }), h("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { H.extra.splice(i, 1); drawEx(); drawPrev(); } }))); }); }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Itens livres e observações" }), h("div", { class: "btns" }, ex, h("button", { class: "btn sm", type: "button", text: "Adicionar", onclick: function () { if (ex.value.trim()) { H.extra.push(ex.value.trim()); ex.value = ""; drawEx(); drawPrev(); } } })), exList,
      h("label", { class: "f" }, h("span", { text: "Observações (saem no rodapé)" }), h("textarea", { class: "ta", rows: 2, value: H.obs, oninput: function (e) { H.obs = e.target.value; save(); } }))));
    drawEx();
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Prescrição (pré-visualização)" }), prev));
    drawPrev();
    var st = h("div", { class: "status" });
    var pv = pdfBar(f, function () {
      var items = hospItems(); if (!items.length) { st.textContent = "Prescreva ao menos um item."; st.className = "status err"; return null; }
      return DocPDF.build({ title: "PRESCRIÇÃO MÉDICA", data: today() + " " + nowHM(), cfg: cfg, pac: pdfPac(), items: items, extraHeader: "Diagnóstico: " + p.n + " (" + ((p.cid || [])[0] || [""])[0] + ")", sections: [{ h: "Observações", text: H.obs }] });
    }, function () { return fileBase("PRESCRICAO"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Copiar texto", onclick: function () { copy(hospItems().map(function (x) { return x.n + ". " + x.text; }).join("\n")); } }),
      h("button", { class: "btn ghost", type: "button", text: "Revisar com Assistente", onclick: function () { openChat("Revise esta prescrição hospitalar para o paciente (doses, diluições, interações, contraindicações, itens faltando para " + p.n + "):\n" + hospItems().map(function (x) { return x.n + ". " + x.text; }).join("\n")); } }), st);
    b.appendChild(pv);
  };
  function pdfPac() { var p = C.pac; return { nome: (p.nome || "").toUpperCase(), idade: idadeTxt(), sexo: sexoTxt(), peso: pesoN() ? nf(pesoN(), 1) : "", cns: p.cns, leito: p.leito, alergias: p.alergias }; }

  /* ---------- Prescrição ambulatorial (VO) ---------- */
  RENDER.rx = function (b, f, p) {
    var R = C.rx, clsWrap = h("div", { class: "chips" }), rows = h("div"), items = h("div", { class: "rxlist" }), st = h("div", { class: "status" });
    if (!R.naoUsar && p.naoUsar) R.naoUsar = p.naoUsar;
    var allBox = h("label", { class: "check" }, h("input", { type: "checkbox", checked: C.rxAll, onchange: function (e) { C.rxAll = e.target.checked; drawCls(); } }), "Mostrar todas as classes");
    var addBtn = h("button", { class: "btn sm primary", type: "button", text: "Adicionar selecionados" });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Condutas medicamentosas", h("small", { text: perfil() === "ped" ? "pediátrico — dose por peso/idade" : "adulto" })), clsWrap, allBox, rows, h("div", { class: "btns" }, addBtn)));
    function clsList() { var base = p.cls || []; return C.rxAll ? base.concat(Object.keys(D.classes).filter(function (k) { return base.indexOf(k) < 0; })) : base; }
    function drawCls() { clsWrap.textContent = ""; clsList().forEach(function (k, i) { if (C.rxOpen[k] == null) C.rxOpen[k] = i < 2; clsWrap.appendChild(h("button", { class: "chip" + (C.rxOpen[k] ? " on" : ""), type: "button", text: D.classes[k].n, onclick: function () { C.rxOpen[k] = !C.rxOpen[k]; drawCls(); } })); }); if (!clsList().length) clsWrap.appendChild(h("span", { class: "note", text: "Sem classes cadastradas; marque todas as classes." })); drawRows(); }
    function drawRows() { rows.textContent = ""; var seen = {}; clsList().filter(function (k) { return C.rxOpen[k]; }).forEach(function (k) { rows.appendChild(h("h3", { text: D.classes[k].n, style: "font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:8px" })); D.classes[k].d.forEach(function (id) { if (seen[id] || !D.drugs[id]) return; seen[id] = 1; rows.appendChild(rxRow(id)); }); }); }
    function sel(id) { return C.rxSel[id] = C.rxSel[id] || {}; }
    function mk(opts, val, on, lab) { var s = h("select", { class: "sel", "aria-label": lab }, opts.map(function (o) { return h("option", { value: o[0], text: o[1] }); })); s.value = String(val); s.addEventListener("change", function () { on(s.value); }); return s; }
    function rxRow(id) {
      var dr = D.drugs[id], sl = sel(id), pf = perfil(), row = h("div", { class: "drow" }), r = rxCalc(id, sl);
      var cb = h("input", { type: "checkbox", checked: !!sl.on && r.ok, disabled: !r.ok, onchange: function (e) { sl.on = e.target.checked; save(); } });
      row.appendChild(h("label", { class: "dhead" }, cb, h("span", { class: "nm", text: dr.n }), dr.ctrl ? h("span", { class: "badge w", text: "controle especial" }) : null, dr.notif ? h("span", { class: "badge b", text: "notificação " + dr.notif }) : null, dr.atb ? h("span", { class: "badge", text: "antimicrobiano · 2 vias" }) : null, C.pac.gest && dr.gx ? h("span", { class: "badge b", text: "contraindicado na gestação" }) : null));
      var ctr = h("div", { class: "grid" }), re = function () { var n = rxRow(id); row.replaceWith(n); };
      var usaAd = (pf === "adulto" && !(dr.pa && dr.p && pesoN())) || (pf === "ped" && dr.p && dr.p.same);
      if (dr.ins && pf === "adulto" && pesoN()) { ctr.append(mk(E.INS_UKG, sl.ukg || 0.1, function (v) { sl.ukg = +v; save(); re(); }, "Dose inicial"), mk(E.INS_ESQ, sl.esq || "noite", function (v) { sl.esq = v; save(); re(); }, "Esquema"), mk(dr.a.map(function (a, i) { return [i, a.ap]; }), sl.ai || 0, function (v) { sl.ai = +v; save(); re(); }, "Apresentação")); }
      else if (usaAd && dr.a && dr.a.length && dr.tipo !== "hidr") { ctr.appendChild(mk(dr.a.map(function (a, i) { return [i, a.ap]; }), sl.ai || 0, function (v) { sl.ai = +v; sl.pi = 0; save(); re(); }, "Apresentação")); var ap = dr.a[sl.ai || 0] || dr.a[0]; if (ap.pos.length > 1) ctr.appendChild(mk(ap.pos.map(function (x, i) { return [i, x.t]; }), sl.pi || 0, function (v) { sl.pi = +v; save(); re(); }, "Posologia")); }
      else if (pf === "ped" && dr.p && dr.p.reg) { var reg = dr.p.reg.find(function (x) { return x.id === sl.reg; }) || dr.p.reg[0]; if (dr.p.reg.length > 1) ctr.appendChild(mk(dr.p.reg.map(function (x) { return [x.id, x.l]; }), reg.id, function (v) { sl.reg = v; sl.form = null; sl.dias = null; save(); re(); }, "Esquema")); var fs = dr.p.f.filter(function (x) { return !reg.f || reg.f.indexOf(x.id) >= 0; }); if (fs.length > 1) ctr.appendChild(mk(fs.map(function (x) { return [x.id, x.ap]; }), (fs.find(function (x) { return x.id === sl.form; }) || r.form || fs[0]).id, function (v) { sl.form = v; save(); re(); }, "Apresentação")); if (reg.dias) ctr.appendChild(mk(reg.dias.map(function (d) { return [d, d ? d + (d > 1 ? " dias" : " dia") : "sem duração (se necessário)"]; }), sl.dias != null ? sl.dias : reg.dias[0], function (v) { sl.dias = +v; save(); re(); }, "Duração")); }
      if (ctr.childNodes.length) row.appendChild(ctr);
      if (r.ok) { row.appendChild(h("div", { class: "line", text: r.pos })); row.appendChild(h("div", { class: "det", text: r.med + " · " + r.q + " · " + r.via + (r.det ? " · " + r.det : "") })); (r.warn || []).forEach(function (w) { row.appendChild(h("div", { class: "warn", text: "⚠ " + w })); }); }
      else row.appendChild(h("div", { class: "err", text: "⛔ " + r.err }));
      if (dr.nota) row.appendChild(h("div", { class: "det", text: dr.nota }));
      return row;
    }
    addBtn.addEventListener("click", function () {
      var nR = 0, nC = 0;
      Object.keys(C.rxSel).forEach(function (id) { var sl = C.rxSel[id]; if (!sl.on || !D.drugs[id]) return; var dr = D.drugs[id], r = rxCalc(id, sl); if (!r.ok) return;
        if (dr.ctrl) { C.ctrl.itens.push({ med: r.med, qtd: r.q, pos: r.pos }); nC++; } else { R.itens.push({ med: r.med, qtd: r.q, via: r.via, pos: r.pos }); nR++; if (dr.atb) R.duasVias = true; } sl.on = false; });
      st.textContent = nR + " na receita" + (nC ? "; " + nC + " enviado(s) ao Controle especial" : "") + "."; st.className = "status ok"; drawItems(); drawRows(); save();
    });
    drawCls();
    function drawItems() { items.textContent = ""; if (!R.itens.length) items.appendChild(h("div", { class: "note", text: "Nenhum medicamento na receita." })); R.itens.forEach(function (it, i) {
      var g = h("div", { class: "grid" }, ["med", "qtd", "via", "pos"].map(function (k) { return h("label", { class: "f" }, h("span", { text: { med: "Medicamento", qtd: "Quantidade", via: "Via", pos: "Posologia" }[k] }), h("input", { class: "in", value: it[k] || "", oninput: function (e) { it[k] = e.target.value; save(); } })); }));
      items.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: (i + 1) + "." }), g, h("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { R.itens.splice(i, 1); drawItems(); save(); } }))); }); }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Receita" }), items, h("label", { class: "check" }, h("input", { type: "checkbox", checked: R.duasVias, onchange: function (e) { R.duasVias = e.target.checked; save(); } }), "Receita em 2 vias (antimicrobiano — RDC 20/2011)"))); drawItems();
    var fld = function (k, l, rows) { return h("label", { class: "f" }, h("span", { text: l }), h("textarea", { class: "ta", rows: rows || 3, id: "rx_" + k, value: R[k] || "", oninput: function (e) { R[k] = e.target.value; save(); } })); };
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Orientações de alta", h("small", { text: "uma linha por item" })), fld("naoUsar", "Não usar", 2), fld("visto", "O que foi visto hoje", 3), fld("cuidados", "Como se cuidar", 4), fld("alarme", "Volte imediatamente se", 5), fld("retorno", "Retorno", 2)));
    var pv = pdfBar(f, function () { if (Object.keys(C.rxSel).some(function (id) { return C.rxSel[id].on; })) addBtn.click(); if (!R.itens.length && !R.cuidados) { st.textContent = "A receita está vazia."; st.className = "status err"; return null; } return RxPDF.build({ pac: { nome: (C.pac.nome || "").toUpperCase(), cns: C.pac.cns, nasc: C.pac.nasc }, data: today(), itens: R.itens, duasVias: R.duasVias, naoUsar: R.naoUsar, visto: R.visto, cuidados: R.cuidados, alarme: R.alarme, retorno: R.retorno }, cfg); }, function () { return fileBase("RECEITA"); }, st);
    f.append(h("button", { class: "btn ghost", type: "button", text: "Orientações com Assistente", onclick: async function (e) {
      var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente escrevendo as orientações…"; st.className = "status";
      try { var j = await askJSON("Você escreve as ORIENTAÇÕES DE ALTA de um paciente do pronto-socorro do Hospital Municipal de Cabeceiras-GO (SUS; referência a 160 km). Linguagem para paciente com pouca escolaridade, frases curtas, sem siglas. Hoje: " + today() + ".\nResponda SOMENTE JSON: {\"o_que_foi_visto\":[\"\"],\"cuidados\":[\"\"],\"sinais_de_alarme\":[\"\"],\"retorno\":\"\",\"nao_usar\":\"\",\"alertas\":[\"\"]}\n- o_que_foi_visto: 2–4 frases; não afirme diagnóstico não confirmado.\n- cuidados: 3–6 itens práticos do quadro e do uso dos remédios.\n- sinais_de_alarme: 5–10 sinais concretos para voltar.\n- retorno: quando e onde (data concreta se reavaliação).\n- nao_usar: medicamentos a evitar e por quê ('' se nenhum).\n- alertas: problemas na receita (dose, interação, contraindicação).\n\n" + caseContext());
        var J = function (a) { return Array.isArray(a) ? a.map(String).filter(function (x) { return x.trim(); }).join("\n") : String(a || ""); };
        R.visto = J(j.o_que_foi_visto); R.cuidados = [R.cuidados, J(j.cuidados)].filter(Boolean).join("\n"); R.alarme = J(j.sinais_de_alarme); R.retorno = String(j.retorno || R.retorno || ""); if (j.nao_usar) R.naoUsar = String(j.nao_usar);
        ["naoUsar", "visto", "cuidados", "alarme", "retorno"].forEach(function (k) { var t = document.getElementById("rx_" + k); if (t) t.value = R[k]; });
        var al = (j.alertas || []).filter(function (x) { return String(x).trim(); }); st.textContent = al.length ? "Atenção: " + al.join(" · ") : "Orientações prontas. Revise."; st.className = al.length ? "status err" : "status ok"; save(); }
      catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }), st);
    b.appendChild(pv);
  };

  /* ---------- Controle especial ---------- */
  RENDER.ctrl = function (b, f, p) {
    var K = C.ctrl, list = h("div", { class: "rxlist" }), st = h("div", { class: "status" });
    if (!K.end && C.pac.end) K.end = [C.pac.end, C.pac.mun, C.pac.uf].filter(Boolean).join(", ");
    if (!K.cpf && C.pac.cpf) K.cpf = C.pac.cpf;
    b.appendChild(h("div", { class: "note", text: "Receita de Controle Especial (modelo Anvisa v2, 2 vias) para listas C1/C5 e tramadol/codeína ≤ 100 mg por unidade. Benzodiazepínicos, zolpidem e fenobarbital (B1) exigem talonário próprio e não são impressos aqui." }));
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Paciente" }), h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "Endereço completo" }), h("input", { class: "in", value: K.end, oninput: function (e) { K.end = e.target.value; save(); } })),
      h("label", { class: "f" }, h("span", { text: "CPF" }), h("input", { class: "in mono", value: K.cpf, oninput: function (e) { K.cpf = e.target.value; save(); } })),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: K.semCpf, onchange: function (e) { K.semCpf = e.target.checked; save(); } }), "Não possui CPF"))));
    function draw() { list.textContent = ""; if (!K.itens.length) list.appendChild(h("div", { class: "note", text: "Sem itens. Marque um medicamento controlado na Prescrição ambulatorial (ele vem para cá) ou adicione abaixo." }));
      K.itens.forEach(function (it, i) { list.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: (i + 1) + "." }), h("div", { class: "grid" }, ["med", "qtd", "pos"].map(function (k) { return h("label", { class: "f" }, h("span", { text: { med: "Medicamento", qtd: "Quantidade", pos: "Posologia" }[k] }), h("input", { class: "in", value: it[k] || "", oninput: function (e) { it[k] = e.target.value; save(); } })); })), h("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { K.itens.splice(i, 1); draw(); save(); } }))); }); }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Medicamentos (até 3 por receita; o app divide)" }), list, h("button", { class: "btn sm", type: "button", text: "Adicionar linha", onclick: function () { K.itens.push({ med: "", qtd: "", pos: "" }); draw(); } })));
    draw();
    var pv = pdfBar(f, function () { var it = K.itens.filter(function (x) { return x.med; }); if (!it.length) { st.textContent = "Sem medicamentos."; st.className = "status err"; return null; } if (!K.semCpf && String(K.cpf || "").replace(/\D/g, "").length !== 11) { st.textContent = "CPF obrigatório (11 dígitos) ou marque “Não possui CPF”."; st.className = "status err"; return null; }
      return CtrlPDF.build({ pac: { nome: (C.pac.nome || "").toUpperCase(), end: K.end, cpf: K.cpf, semCpf: K.semCpf }, data: today(), itens: it }, cfg); }, function () { return fileBase("CONTROLE_ESPECIAL"); }, st);
    f.appendChild(st); b.appendChild(pv);
  };

  /* ---------- Exames (APAC) ---------- */
  function examRender(kind) {
    return function (b, f, p) {
      var X = C[kind], isLab = kind === "lab", st = h("div", { class: "status" }), picked = h("div", { class: "rxlist" });
      if (!X.cid && p.cid && p.cid[0]) { X.cid = p.cid[0][0]; X.desc = p.cid[0][1]; }
      var name = function (c) { var x = BYCODE.get(c); return x ? x.n : c; };
      var sug = ((isLab ? p.lab : p.comp) || []).map(gestCode).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var pool = (isLab ? D.labPS : D.compPS).map(gestCode).filter(function (x, i, a) { return a.indexOf(x) === i && sug.indexOf(x) < 0; });
      function itemCb(c) { return h("label", { class: "exitem" }, h("input", { type: "checkbox", checked: !!X.sel[c], onchange: function (e) { if (e.target.checked) X.sel[c] = X.sel[c] || { just: "" }; else delete X.sel[c]; drawPicked(); save(); } }), h("span", { text: name(c) }), h("small", { text: fmtCode(c) })); }
      if (sug.length) b.appendChild(h("div", { class: "box" }, h("h3", null, "Sugeridos para " + p.n, h("small", { text: C.pac.gest ? "códigos de gestante" : "" })), h("div", { class: "exgrid" }, sug.map(itemCb)), h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Marcar todos os sugeridos", onclick: function () { sug.forEach(function (c) { X.sel[c] = X.sel[c] || { just: "" }; }); save(); openMod(kind); } }))));
      b.appendChild(h("details", { class: "box grp" }, h("summary", { text: (isLab ? "Exames laboratoriais de pronto-socorro" : "Imagem, ECG, endoscopia e consulta especializada") + " (" + pool.length + ")" }), h("div", { class: "exgrid" }, pool.map(itemCb))));
      var q = h("input", { class: "in", placeholder: isLab ? "Buscar na tabela SIGTAP: ferritina, sorologia…" : "Buscar na tabela SIGTAP: tomografia, doppler…" }), res = h("div", { class: "exgrid" });
      q.addEventListener("input", function () { res.textContent = ""; var t = fold(q.value).trim(); if (t.length < 3) return; var toks = t.split(/\s+/); CAT[kind].filter(function (x) { var n = fold(x.n); return toks.every(function (k) { return n.indexOf(k) >= 0; }); }).slice(0, 40).forEach(function (x) { res.appendChild(itemCb(x.c)); }); });
      b.appendChild(h("div", { class: "box" }, h("h3", { text: "Buscar qualquer procedimento" }), q, res));
      function drawPicked() { picked.textContent = ""; var ks = Object.keys(X.sel); if (!ks.length) picked.appendChild(h("div", { class: "note", text: "Nenhum exame marcado." }));
        ks.forEach(function (c, i) { picked.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: (i + 1) + "." }), h("div", { class: "f" }, h("b", { text: name(c) + " · " + fmtCode(c) }), h("input", { class: "in", placeholder: "Justificativa curta deste exame (opcional)", value: X.sel[c].just || "", oninput: function (e) { X.sel[c].just = e.target.value; save(); } })), h("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { delete X.sel[c]; drawPicked(); save(); } }))); }); }
      b.appendChild(h("div", { class: "box" }, h("h3", { text: "Pedido" }), picked)); drawPicked();
      var obs = h("textarea", { class: "ta", rows: 4, value: X.obs, oninput: function (e) { X.obs = e.target.value; save(); } });
      b.appendChild(h("div", { class: "box" }, h("h3", { text: "Diagnóstico e justificativa clínica" }), h("div", { class: "grid" },
        h("label", { class: "f" }, h("span", { text: "CID principal" }), h("input", { class: "in mono", value: X.cid, list: "cids_" + kind, oninput: function (e) { X.cid = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); var m = (p.cid || []).find(function (c) { return c[0] === X.cid; }); if (m) { X.desc = m[1]; var d2 = document.getElementById("apDesc"); if (d2) d2.value = X.desc; } save(); } }), h("datalist", { id: "cids_" + kind }, (p.cid || []).map(function (c) { return h("option", { value: c[0], text: c[1] }); }))),
        h("label", { class: "f" }, h("span", { text: "Diagnóstico (descrição)" }), h("input", { class: "in", id: "apDesc", value: X.desc, oninput: function (e) { X.desc = e.target.value; save(); } }))),
        h("label", { class: "f" }, h("span", { text: "Observações para o regulador" }), obs),
        isLab ? null : h("label", { class: "check" }, h("input", { type: "checkbox", checked: X.separar !== false, onchange: function (e) { X.separar = e.target.checked; save(); } }), "Uma folha APAC por exame (executantes diferentes)")));
      var miss = ["nome", "cns", "nasc", "sexo", "mae", "end", "mun"].filter(function (k) { return !C.pac[k]; });
      if (miss.length) b.insertBefore(h("div", { class: "alertbox" }, "Faltam dados do paciente para a APAC: " + miss.map(function (k) { return { nome: "nome", cns: "CNS", nasc: "nascimento", sexo: "sexo", mae: "nome da mãe", end: "endereço", mun: "município" }[k]; }).join(", ") + ". ", h("button", { class: "btn sm", type: "button", text: "Completar", onclick: openPatient })), b.firstChild);
      var pv = pdfBar(f, function () {
        var codes = Object.keys(X.sel); if (!codes.length) { st.textContent = "Marque ao menos um exame."; st.className = "status err"; return null; } if (!X.cid) { st.textContent = "Informe o CID principal."; st.className = "status err"; return null; }
        var P = C.pac, r = { kind: isLab ? "lab" : "img", pac: { nome: (P.nome || "").toUpperCase(), prontuario: "", cns: String(P.cns || "").replace(/\D/g, ""), cpf: String(P.cpf || "").replace(/\D/g, ""), nasc: P.nasc, sexo: P.sexo, raca: P.raca || "", mae: (P.mae || "").toUpperCase(), tel: P.tel, resp: "", telResp: "", end: (P.end || "").toUpperCase(), mun: (P.mun || "").toUpperCase(), ibge: P.ibge, uf: P.uf, cep: P.cep },
          procs: codes.map(function (c) { return { codigo: c, nome: name(c), qtd: 1, just: X.sel[c].just || "", ok: !!BYCODE.get(c) }; }), diag: { desc: X.desc, cidP: X.cid, cidS: "", cidC: "" }, obs: X.obs,
          sol: { nome: cfg.sol.nome, data: today(), docTipo: cfg.sol.docTipo, docNum: cfg.sol.docNum, conselho: cfg.sol.conselho, carimbo: cfg.sol.carimbo }, exec: Object.assign({}, isLab ? cfg.execLab : cfg.execImg), separar: !isLab && X.separar !== false, perProcObs: !isLab, estab: Object.assign({}, cfg.estab) };
        if (!r.pac.cns && r.pac.cpf) r.obs = "CPF do paciente: " + r.pac.cpf + ". " + (r.obs || "");
        if (r.perProcObs && !r.separar) { var js = r.procs.filter(function (x) { return x.just; }).map(function (x) { return x.nome + ": " + x.just; }).join(" "); if (js) r.obs = (r.obs ? r.obs + " " : "") + js; r.perProcObs = false; }
        return ApacPDF.build(r);
      }, function () { return fileBase(isLab ? "APAC_LAB" : "APAC"); }, st);
      f.append(h("button", { class: "btn ghost", type: "button", text: "Justificativa com Assistente", onclick: async function (e) {
        var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente escrevendo…"; st.className = "status";
        try { var t = await ask("Escreva as OBSERVAÇÕES de um laudo APAC (SUS) para o médico regulador justificar os exames abaixo: 3 a 6 frases objetivas — sexo e idade, queixa e tempo, achados registrados (sinais vitais, exame físico, exames prévios), conduta já feita e por que o exame é necessário. Não invente achados. Texto simples, sem markdown.\nEXAMES: " + Object.keys(X.sel).map(name).join("; ") + "\n\n" + caseContext(), function (tx) { obs.value = tx; }, "default"); X.obs = t; obs.value = t; st.textContent = "Pronto. Revise."; st.className = "status ok"; save(); }
        catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }), st);
      b.appendChild(pv);
    };
  }
  RENDER.lab = examRender("lab"); RENDER.comp = examRender("comp");

  /* ---------- Encaminhamento ambulatorial ---------- */
  function shortTxt(t, n) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t; }
  function condutaTxt() { var a = []; var hi = hospItems().filter(function (x) { return !/^Sinais vitais|^Manter acesso|^Comunicar|^Dieta|^Cabeceira|^Controle|^Precau|^Repouso|^Oximetria|^O₂ por/.test(x.text); }).map(function (x) { return x.text; }); if (hi.length) a.push("No PS: " + hi.join("; ")); if (C.rx.itens.length) a.push("Alta com: " + C.rx.itens.map(function (x) { return x.med + " — " + x.pos; }).join("; ")); return a.join(". "); }
  function examsTxt() { var n = function (c) { var x = BYCODE.get(c); return x ? x.n : c; }; var l = Object.keys(C.lab.sel).map(n), c2 = Object.keys(C.comp.sel).map(n); return [l.length ? "Laboratoriais: " + l.join(", ") : "", c2.length ? "Complementares: " + c2.join(", ") : ""].filter(Boolean).join(". "); }
  function encAuto() { var p = proto(), N = C.enc, P = C.pac;
    return ["Ao serviço de " + (N.esp || "—") + ".", "", "Encaminho " + (P.nome || "o(a) paciente") + (idadeTxt() ? ", " + idadeTxt() : "") + (sexoTxt() ? ", sexo " + sexoTxt() : "") + ", atendido(a) no pronto-socorro do " + cfg.estab.nome + " em " + today() + ", com hipótese diagnóstica de " + p.n + " (CID " + ((p.cid || [])[0] || [""])[0] + ").",
      "", "Resumo clínico: " + shortTxt(C.anam.final || anamText(), 600), "Exame físico: " + shortTxt(C.ef.final || efText(), 450), examsTxt() ? "Exames: " + examsTxt() + "." : "", condutaTxt() ? "Conduta: " + condutaTxt() + "." : "",
      "", "Motivo do encaminhamento: " + (N.motivo || "—"), N.pergunta ? "Solicito: " + N.pergunta : "", "Prioridade: " + N.prio + ".", "", "Atenciosamente,"].filter(function (x, i, a) { return x !== "" || a[i - 1] !== ""; }).join("\n"); }
  RENDER.enc = function (b, f, p) {
    var N = C.enc, st = h("div", { class: "status" }), out;
    var dflt = CL.ESP[p.id] || [CL.CAT_ESP[p.cat] || "Clínica médica", "Seguimento ambulatorial de " + p.n + "."];
    if (!N.esp) N.esp = dflt[0]; if (!N.motivo) N.motivo = dflt[1];
    function upd() { if (!N.edited) { N.final = encAuto(); if (out) out.value = N.final; } save(); }
    b.appendChild(h("div", { class: "box" }, h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "Especialidade / serviço" }), h("input", { class: "in", value: N.esp, oninput: function (e) { N.esp = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Prioridade" }), (function () { var s = h("select", { class: "sel", onchange: function (e) { N.prio = e.target.value; upd(); } }, ["Eletiva", "Prioritária", "Urgente (vaga em até 7 dias)"].map(function (x) { return h("option", { value: x, text: x }); })); s.value = N.prio; return s; })())),
      h("label", { class: "f" }, h("span", { text: "Motivo do encaminhamento" }), h("input", { class: "in", value: N.motivo, oninput: function (e) { N.motivo = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Pergunta ao especialista (o que você precisa)" }), h("input", { class: "in", value: N.pergunta, placeholder: "ex.: avaliar indicação cirúrgica; ajustar profilaxia", oninput: function (e) { N.pergunta = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", rows: 14, value: N.final || encAuto(), oninput: function (e) { N.final = e.target.value; N.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto do encaminhamento", h("small", { text: "montado com anamnese, exame físico, exames e conduta" })), out));
    if (!N.final) N.final = out.value;
    var pv = pdfBar(f, function () { return DocPDF.build({ title: "ENCAMINHAMENTO", data: today(), cfg: cfg, pac: pdfPac(), sections: [{ h: "Referência — " + N.esp + " · prioridade " + N.prio, text: out.value }] }); }, function () { return fileBase("ENCAMINHAMENTO"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { N.edited = false; upd(); } }), h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }),
      h("button", { class: "btn", type: "button", text: "APAC de consulta", title: "Adiciona 03.01.01.007-2 ao pedido de exames complementares", onclick: function () { C.comp.sel["0301010072"] = { just: "Consulta em " + N.esp + ": " + N.motivo }; if (!C.comp.cid && p.cid && p.cid[0]) { C.comp.cid = p.cid[0][0]; C.comp.desc = p.cid[0][1]; } save(); openMod("comp"); } }),
      h("button", { class: "btn ghost", type: "button", text: "Redigir com Assistente", onclick: async function (e) { var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente redigindo…"; st.className = "status";
        try { var t = await ask("Redija uma GUIA DE ENCAMINHAMENTO (referência) do pronto-socorro para " + N.esp + ", prioridade " + N.prio + ". Formal, objetiva, em parágrafos curtos: identificação, hipótese e CID, resumo clínico, exame físico, exames, conduta já feita, motivo e a pergunta ao especialista. Use só os dados abaixo; sem markdown; termine com 'Atenciosamente,'.\nMOTIVO: " + N.motivo + "\nPERGUNTA: " + N.pergunta + "\n\n" + caseContext(), function (tx) { out.value = tx; }); N.final = t; N.edited = true; out.value = t; st.textContent = "Pronto. Revise."; st.className = "status ok"; save(); }
        catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }), st);
    b.appendChild(pv);
  };

  /* ---------- Transferência inter-hospitalar ---------- */
  function transfAuto() { var p = proto(), T = C.transf, P = C.pac;
    return ["Origem: " + cfg.estab.nome + " (CNES " + cfg.estab.cnes + "), " + cfg.estab.cidade + ".", "Destino: " + (T.destino || "conforme regulação") + ".", "Regulação: " + (T.regulacao ? "nº " + T.regulacao : "—") + (T.regulador ? "; médico regulador " + T.regulador : "") + (T.hora ? "; contato às " + T.hora : "") + ".",
      "", "Paciente: " + (P.nome || "—") + (idadeTxt() ? ", " + idadeTxt() : "") + (sexoTxt() ? ", " + sexoTxt() : "") + (pesoN() ? ", " + nf(pesoN(), 1) + " kg" : "") + (P.gest ? ", gestante" : "") + ". Alergias: " + (P.alergias || "nega") + ".",
      "Diagnóstico: " + p.n + " (CID " + ((p.cid || [])[0] || [""])[0] + ").", "Motivo / recurso necessário: " + (T.recurso || "—"),
      "", "História: " + shortTxt(C.anam.final || anamText(), 700), "Exame físico: " + shortTxt(C.ef.final || efText(), 600), Object.keys(C.scores).length ? "Escores: " + Object.keys(C.scores).map(function (k) { return C.scores[k].split(". Conduta")[0]; }).join("; ") + "." : "",
      examsTxt() ? "Exames realizados/solicitados: " + examsTxt() + "." : "", "Tratamento instituído: " + (hospItems().map(function (x) { return x.text; }).join("; ") || "—") + ".",
      "Dispositivos: " + (T.disp || "—") + ". Condição na saída: " + T.cond + ".", "Transporte: " + T.transporte + ". Acompanhante: " + (T.acomp || "—") + "."].filter(function (x, i, a) { return x !== "" || a[i - 1] !== ""; }).join("\n"); }
  RENDER.transf = function (b, f, p) {
    var T = C.transf, st = h("div", { class: "status" }), out;
    if (!T.recurso) T.recurso = CL.TRANSF[p.id] || "Avaliação/tratamento especializado não disponível no HMC.";
    if (!T.hora) T.hora = nowHM();
    function upd() { if (!T.edited) { T.final = transfAuto(); if (out) out.value = T.final; } save(); }
    var inp = function (k, l, ph) { return h("label", { class: "f" }, h("span", { text: l }), h("input", { class: "in", value: T[k], placeholder: ph || "", oninput: function (e) { T[k] = e.target.value; upd(); } })); };
    var selF = function (k, l, opts) { var s = h("select", { class: "sel", onchange: function (e) { T[k] = e.target.value; upd(); } }, opts.map(function (x) { return h("option", { value: x, text: x }); })); s.value = T[k]; return h("label", { class: "f" }, h("span", { text: l }), s); };
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Regulação e transporte" }), h("div", { class: "grid" }, inp("destino", "Hospital / serviço de destino", "ex.: HUGO, HGG, HC-UFG"), inp("regulacao", "Nº da solicitação (NIR/regulação)"), inp("regulador", "Médico regulador"), inp("hora", "Horário do contato"),
      selF("transporte", "Transporte", ["USA (suporte avançado)", "USB (suporte básico)", "Ambulância simples com técnico", "Ambulância com médico do HMC", "Meios próprios"]), selF("cond", "Condição na saída", ["Estável", "Estável com suporte", "Instável — transporte com médico"]), inp("acomp", "Acompanhante"), inp("disp", "Dispositivos (AVP, SVD, O₂, IOT…)")),
      h("label", { class: "f" }, h("span", { text: "Motivo / recurso necessário" }), h("input", { class: "in", value: T.recurso, oninput: function (e) { T.recurso = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", rows: 16, value: T.final || transfAuto(), oninput: function (e) { T.final = e.target.value; T.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Relatório de transferência", h("small", { text: "sinais vitais e tratamento vêm do exame físico e da prescrição" })), out));
    if (!T.final) T.final = out.value;
    var pv = pdfBar(f, function () { return DocPDF.build({ title: "RELATÓRIO DE TRANSFERÊNCIA", data: today() + " " + nowHM(), cfg: cfg, pac: pdfPac(), sections: [{ h: "Transferência inter-hospitalar", text: out.value }] }); }, function () { return fileBase("TRANSFERENCIA"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { T.edited = false; upd(); } }), h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }),
      h("button", { class: "btn ghost", type: "button", text: "Redigir com Assistente", onclick: async function (e) { var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente redigindo…"; st.className = "status";
        try { var t = await ask("Redija o RELATÓRIO DE TRANSFERÊNCIA INTER-HOSPITALAR (passagem para o serviço de destino e para a regulação) em texto objetivo, organizado em tópicos curtos: identificação, diagnóstico, motivo/recurso, história, exame e sinais vitais, exames, tratamento feito com horários se houver, dispositivos, condição na saída, transporte. Use só os dados abaixo; sem markdown.\nDESTINO: " + T.destino + "; RECURSO: " + T.recurso + "; TRANSPORTE: " + T.transporte + "\n\n" + caseContext(), function (tx) { out.value = tx; }); T.final = t; T.edited = true; out.value = t; st.textContent = "Pronto. Revise."; st.className = "status ok"; save(); }
        catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }), st);
    b.appendChild(pv);
  };

  /* ---------- Evolução ---------- */
  function evolAuto() {
    var p = proto(); if (!p) return "";
    var L = ["Atendimento no PS — " + today() + " " + nowHM(), "Paciente: " + ptLine() + (C.pac.alergias ? " · Alergias: " + C.pac.alergias : ""), "", C.anam.final || anamText(), "", "Exame físico:", C.ef.final || efText()];
    var sc = Object.keys(C.scores); if (sc.length) L.push("", "Escores: " + sc.map(function (k) { return C.scores[k]; }).join(" | "));
    L.push("", "Hipótese diagnóstica: " + p.n + " (CID " + ((p.cid || [])[0] || [""])[0] + ")");
    var hi = hospItems(); if (hi.length) L.push("", "Prescrição no PS:", hi.map(function (x) { return x.n + ". " + x.text; }).join("\n"));
    if (examsTxt()) L.push("", "Exames: " + examsTxt());
    if (C.rx.itens.length) L.push("", "Prescrição ambulatorial:", C.rx.itens.map(function (x) { return "- " + x.med + " — " + x.pos; }).join("\n"));
    if (C.enc.final) L.push("", "Encaminhado a " + C.enc.esp + " (" + C.enc.prio + ").");
    if (C.transf.final) L.push("", "Transferência: " + (C.transf.destino || "via regulação") + " — " + C.transf.recurso);
    return L.join("\n");
  }
  RENDER.evol = function (b, f, p) {
    var V = C.evol, st = h("div", { class: "status" });
    var out = h("textarea", { class: "ta", rows: 18, value: V.final || evolAuto(), oninput: function (e) { V.final = e.target.value; save(); } });
    var res = h("textarea", { class: "ta", rows: 6, value: V.resumo, placeholder: "Resumo curto de alta para colar no prontuário do município", oninput: function (e) { V.resumo = e.target.value; save(); } });
    b.append(h("div", { class: "box" }, h("h3", null, "Evolução do atendimento", h("small", { text: "montada a partir de todos os módulos" })), out, h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Remontar", onclick: function () { V.final = evolAuto(); out.value = V.final; save(); } }), h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }))),
      h("div", { class: "box" }, h("h3", { text: "Resumo de alta (prontuário eletrônico)" }), res, h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Copiar resumo", onclick: function () { copy(res.value, res); } }))));
    async function gen(kind, btn) { btn.disabled = true; st.textContent = "Assistente escrevendo…"; st.className = "status";
      try { var prompt = kind === "evol" ? "Reescreva a EVOLUÇÃO MÉDICA de pronto-socorro abaixo em formato de prontuário (S/O/A/P), clara e completa, sem inventar dados; sem markdown.\n\n" + evolAuto() + "\n\n" + caseContext() : "Escreva o RESUMO DE ALTA para colar no prontuário eletrônico do município: texto simples, até 900 caracteres, sem markdown, com: queixa e tempo, achados relevantes, hipótese e CID, conduta no PS, exames pedidos, prescrição de alta resumida, orientação de retorno e encaminhamentos. Use só os dados abaixo.\n\n" + caseContext();
        var t = await ask(prompt, function (tx) { (kind === "evol" ? out : res).value = tx; }); if (kind === "evol") { V.final = t; out.value = t; } else { V.resumo = t; res.value = t; } st.textContent = "Pronto. Revise antes de colar."; st.className = "status ok"; save(); }
      catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } }
    f.append(h("button", { class: "btn ghost", type: "button", text: "Evolução SOAP com Assistente", onclick: function (e) { gen("evol", e.currentTarget); } }), h("button", { class: "btn primary", type: "button", text: "Resumo de alta com Assistente", onclick: function (e) { gen("res", e.currentTarget); } }), st);
    var pv = pdfBar(f, function () { return DocPDF.build({ title: "EVOLUÇÃO MÉDICA", data: today() + " " + nowHM(), cfg: cfg, pac: pdfPac(), sections: [{ h: "Evolução", text: out.value }] }); }, function () { return fileBase("EVOLUCAO"); }, st);
    b.appendChild(pv);
  };

  /* ======================= PACIENTE ======================= */
  function openPatient() {
    var s = openShell("Dados do paciente", "usados em todos os módulos e documentos"), b = s.b, f = s.f, P = C.pac, st = h("div", { class: "status" });
    var fld = function (k, l, o) { o = o || {}; var i = h("input", { class: "in" + (o.mono ? " mono" : ""), value: P[k] || "", placeholder: o.ph || "", inputmode: o.num ? "decimal" : null, oninput: function (e) { P[k] = e.target.value; renderPt(); save(); } }); i.id = "p_" + k; return h("label", { class: "f" }, h("span", { text: l }), i); };
    var sx = h("select", { class: "sel", id: "p_sexo", onchange: function (e) { P.sexo = e.target.value; renderPt(); save(); } }, [["", "—"], ["F", "Feminino"], ["M", "Masculino"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); })); sx.value = P.sexo;
    var un = h("select", { class: "sel", id: "p_idUn", onchange: function (e) { P.idUn = e.target.value; renderPt(); save(); } }, [["anos", "anos"], ["meses", "meses"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); })); un.value = P.idUn;
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Para as doses" }), h("div", { class: "grid" }, fld("idade", "Idade", { num: 1, mono: 1 }), h("label", { class: "f" }, h("span", { text: "Unidade" }), un), fld("peso", "Peso (kg)", { num: 1, mono: 1 }), h("label", { class: "f" }, h("span", { text: "Sexo" }), sx), fld("alergias", "Alergias", { ph: "ex.: dipirona, penicilina" })),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: P.gest, onchange: function (e) { P.gest = e.target.checked; renderPt(); save(); } }), "Gestante — bloqueia contraindicados, alerta cautelas e troca exames para códigos de gestante"),
      h("p", { class: "note", text: "Sem idade, a data de nascimento é usada. Abaixo de 12 anos as doses são pediátricas." })));
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Identificação (APAC, receitas e documentos)" }), h("div", { class: "grid" }, fld("nome", "Nome completo"), fld("cns", "CNS", { mono: 1 }), fld("cpf", "CPF", { mono: 1 }), fld("nasc", "Nascimento (DD/MM/AAAA)", { mono: 1 }), fld("mae", "Nome da mãe"), fld("tel", "Telefone"), fld("end", "Endereço (rua, nº, bairro)"), fld("mun", "Município"), fld("ibge", "IBGE", { mono: 1 }), fld("uf", "UF"), fld("cep", "CEP", { mono: 1 }), fld("leito", "Leito/setor"))));
    var fi = h("input", { type: "file", id: "docIn", multiple: true, accept: ".pdf,image/*,.txt", style: "position:absolute;width:1px;height:1px;opacity:0" }), lst = h("div", { class: "note" });
    function drawDocs() { lst.textContent = C.docs.length ? C.docs.map(function (d) { return d.name + " (" + d.meta + ")"; }).join(" · ") : "Nenhum documento anexado."; }
    fi.addEventListener("change", async function () { for (var i = 0; i < fi.files.length; i++) { var fl = fi.files[i], it = { name: fl.name, text: "", images: [], meta: "lendo…" }; C.docs.push(it); drawDocs(); try { if (/pdf$/i.test(fl.type) || /\.pdf$/i.test(fl.name)) { var c = await pdfToContent(fl); it.text = c.text; it.images = c.images; it.meta = c.images.length ? "escaneado → imagem" : (c.text.length / 1000).toFixed(1) + "k caracteres"; } else if (/^image\//.test(fl.type)) { it.images = [fl]; it.meta = "imagem"; } else { it.text = await fl.text(); it.meta = "texto"; } } catch (e) { it.meta = "não consegui ler"; } drawDocs(); } fi.value = ""; });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Ler documentos com o Assistente PrescriMed", h("small", { text: "prontuário, laudos, foto do cartão SUS" })), h("div", { class: "btns" }, h("label", { class: "btn", for: "docIn", text: "Anexar arquivos" }), fi), lst));
    drawDocs();
    f.append(h("button", { class: "btn primary", type: "button", text: "Preencher com Assistente", onclick: async function (e) {
      var btn = e.currentTarget; if (!C.docs.length) { st.textContent = "Anexe ao menos um documento."; st.className = "status err"; return; }
      btn.disabled = true; st.textContent = "Assistente lendo os documentos…"; st.className = "status";
      try { var imgs = C.docs.reduce(function (a, d) { return a.concat(d.images); }, []), opts = { modelTier: "default", cache: false };
        if (imgs.length) { var lim = await sample.limits().catch(function () { return null; }); if (!lim || !lim.images) throw { code: "image_rejected" }; opts.images = imgs.slice(0, lim.images.maxCount); }
        var j = await sample.json("Extraia dados de documentos de um paciente atendido no pronto-socorro do Hospital Municipal de Cabeceiras-GO. Use SOMENTE o que estiver nos documentos; ausente = \"\". CNS 15 dígitos; CPF 11. Datas DD/MM/AAAA. Sexo M/F. CEP 73870-000 ou 73872-xxx = CABECEIRAS, IBGE 5204003, UF GO. No prontuário municipal, '081' antes do logradouro = RUA.\nResponda SOMENTE JSON: {\"nome\":\"\",\"cns\":\"\",\"cpf\":\"\",\"nascimento\":\"\",\"sexo\":\"\",\"mae\":\"\",\"telefone\":\"\",\"endereco\":\"\",\"municipio\":\"\",\"ibge\":\"\",\"uf\":\"\",\"cep\":\"\",\"peso_kg\":\"\",\"alergias\":\"\",\"comorbidades\":[\"\"],\"medicacoes_em_uso\":\"\",\"resumo_clinico\":\"\",\"sinais_vitais\":{\"pa\":\"\",\"fc\":\"\",\"fr\":\"\",\"tax\":\"\",\"spo2\":\"\",\"hgt\":\"\"},\"alertas\":[\"\"]}\n\nDOCUMENTOS:\n" + C.docs.filter(function (d) { return d.text; }).map(function (d) { return "[" + d.name + "]\n" + d.text.slice(0, 20000); }).join("\n\n"), opts);
        var map = { nome: "nome", cns: "cns", cpf: "cpf", nascimento: "nasc", sexo: "sexo", mae: "mae", telefone: "tel", endereco: "end", municipio: "mun", ibge: "ibge", uf: "uf", cep: "cep", peso_kg: "peso", alergias: "alergias" };
        Object.keys(map).forEach(function (k) { var v = j[k]; if (v != null && String(v).trim()) P[map[k]] = String(v).trim(); });
        P.cns = String(P.cns || "").replace(/\D/g, ""); P.cpf = String(P.cpf || "").replace(/\D/g, ""); if (P.sexo) P.sexo = /^f/i.test(P.sexo) ? "F" : /^m/i.test(P.sexo) ? "M" : "";
        if (j.medicacoes_em_uso) C.anam.meds = String(j.medicacoes_em_uso); if (j.resumo_clinico) C.anam.notas = [C.anam.notas, String(j.resumo_clinico)].filter(Boolean).join("\n");
        (j.comorbidades || []).forEach(function (c) { var m = CL.ANTEC.find(function (a) { return fold(String(c)).indexOf(fold(a).split("/")[0]) >= 0; }); if (m) C.anam.ant[m] = true; });
        var sv = j.sinais_vitais || {}; ["pa", "fc", "fr", "tax", "spo2", "hgt"].forEach(function (k) { if (sv[k]) C.ef.sv[k] = String(sv[k]); });
        if (!C.anam.edited) C.anam.final = ""; if (!C.ef.edited) C.ef.final = "";
        save(); renderPt(); var al = (j.alertas || []).filter(function (x) { return String(x).trim(); }); openPatient(); var s2 = $("#mFoot .status"); if (s2) { s2.textContent = "Dados preenchidos. " + (al.length ? "Atenção: " + al.join(" · ") : "Revise."); s2.className = al.length ? "status err" : "status ok"; } }
      catch (er) { st.textContent = er && er.code === "image_rejected" ? "Esta visualização não envia imagens ao Assistente PrescriMed; use PDF com texto." : aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }),
      h("button", { class: "btn", type: "button", text: "Concluir", onclick: function () { dlg.close(); } }), st);
  }
  async function pdfToContent(file) {
    var buf = await file.arrayBuffer(), pdf = await pdfjsLib.getDocument({ data: buf }).promise, text = "";
    for (var i = 1; i <= Math.min(pdf.numPages, 15); i++) { var pg = await pdf.getPage(i), tc = await pg.getTextContent(), lastY = null, lastEnd = null, line = "";
      tc.items.forEach(function (it) { if (typeof it.str !== "string") return; var x = it.transform[4], y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 2) { text += line + "\n"; line = ""; lastEnd = null; } var gap = lastEnd === null ? 99 : x - lastEnd; line += (line && gap > 1.2 ? " " : "") + it.str; lastY = y; lastEnd = x + (it.width || 0); });
      text += line + "\n\n"; }
    var images = [];
    if (text.replace(/\s/g, "").length < 120) { for (var k = 1; k <= Math.min(pdf.numPages, 3); k++) { var p2 = await pdf.getPage(k), vp = p2.getViewport({ scale: 1.6 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; await p2.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; images.push(await new Promise(function (res) { cv.toBlob(res, "image/jpeg", 0.85); })); } }
    return { text: text.replace(/[​-‍­﻿]/g, "").replace(/[ \t]+/g, " ").trim(), images: images };
  }

  /* ======================= AJUSTES ======================= */
  function openCfg() {
    var s = openShell("Ajustes", "estabelecimento e médico solicitante"), b = s.b;
    var fld = function (grp, k, l) { return h("label", { class: "f" }, h("span", { text: l }), h("input", { class: "in", value: cfg[grp][k] || "", oninput: function (e) { cfg[grp][k] = e.target.value; lsSet("psx.cfg", cfg); } })); };
    b.append(h("div", { class: "box" }, h("h3", { text: "Estabelecimento" }), h("div", { class: "grid" }, fld("estab", "nome", "Nome"), fld("estab", "cnes", "CNES"), fld("estab", "cidade", "Cidade-UF"), fld("estab", "endereco", "Endereço"), fld("estab", "telefone", "Telefone"))),
      h("div", { class: "box" }, h("h3", { text: "Médico solicitante" }), h("div", { class: "grid" }, fld("sol", "nome", "Nome"), fld("sol", "conselho", "Conselho (CRM-UF nº)"), fld("sol", "docNum", "CNS/CPF do profissional (campo 44 da APAC)"))),
      h("div", { class: "box" }, h("h3", { text: "Executantes padrão (APAC)" }), h("div", { class: "grid" }, fld("execImg", "nome", "Imagem — nome"), fld("execImg", "cnes", "Imagem — CNES"), fld("execLab", "nome", "Laboratório — nome"), fld("execLab", "cnes", "Laboratório — CNES"))));
    s.f.appendChild(h("button", { class: "btn primary", type: "button", text: "Concluir", onclick: function () { dlg.close(); } }));
  }

  /* ======================= ASSISTENTE PRESCRIMED ======================= */
  function caseContext() {
    var p = proto(), L = [];
    L.push("PACIENTE: " + ptLine() + (C.pac.alergias ? "; ALERGIAS: " + C.pac.alergias : "; alergias não informadas") + "; perfil de dose: " + (perfil() === "ped" ? "pediátrico" : "adulto"));
    if (p) { L.push("CONDIÇÃO SELECIONADA: " + p.n + " — CID " + (p.cid || []).map(function (c) { return c[0] + " " + c[1]; }).join("; ")); if (p.alerta) L.push("ALERTAS DO PROTOCOLO: " + p.alerta); if (p.naoUsar) L.push("NÃO USAR: " + p.naoUsar); }
    var a = C.anam.final || (p ? anamText() : ""); if (a) L.push("ANAMNESE:\n" + a);
    var e = C.ef.final || (p ? efText() : ""); if (e) L.push("EXAME FÍSICO:\n" + e);
    var sc = Object.keys(C.scores); if (sc.length) L.push("ESCORES: " + sc.map(function (k) { return C.scores[k]; }).join(" | "));
    var hi = p ? hospItems() : []; if (hi.length) L.push("PRESCRIÇÃO HOSPITALAR ATUAL:\n" + hi.map(function (x) { return x.n + ". " + x.text; }).join("\n"));
    if (C.rx.itens.length) L.push("RECEITA DE ALTA:\n" + C.rx.itens.map(function (x) { return "- " + x.med + " | " + x.qtd + " | " + x.pos; }).join("\n"));
    if (C.ctrl.itens.length) L.push("CONTROLE ESPECIAL: " + C.ctrl.itens.map(function (x) { return x.med; }).join("; "));
    if (examsTxt()) L.push("EXAMES NO PEDIDO: " + examsTxt());
    return L.join("\n\n");
  }
  var SYS = "Você é o Assistente PrescriMed, apoio clínico de um médico de pronto-socorro do Hospital Municipal de Cabeceiras-GO (SUS, município pequeno, sem UTI e sem hemodinâmica; referência hospitalar em Goiânia a ~160 km; regulação via NIR). Responda em português do Brasil, direto e estruturado (tópicos curtos). Ao prescrever: fármaco genérico, dose (e mg/kg na criança), via, diluição, velocidade e intervalo; alerte contraindicações (gestação, alergias, DRC, idade, interações) e diga quando o quadro exige internação, transferência ou exame que o HMC não tem. Para anamnese e exame físico, liste perguntas e manobras dirigidas à condição. Siga protocolos do Ministério da Saúde e diretrizes brasileiras vigentes; se não tiver certeza de uma dose ou norma, diga. Não invente dados do paciente. Você apoia; a decisão é do médico.";
  var chat = { msgs: [], busy: false, ctl: null };
  var QK = [["Sugerir prescrição hospitalar", "Sugira a prescrição hospitalar completa para este caso (dieta, hidratação, medicamentos com doses calculadas, cuidados e reavaliação)."], ["Revisar doses e interações", "Revise as doses, diluições, interações e contraindicações de tudo que está prescrito neste caso."],
    ["Diagnósticos diferenciais", "Quais os diagnósticos diferenciais que não posso deixar passar neste caso e como afastá-los no PS?"], ["Anamnese dirigida", "Quais perguntas da anamnese são essenciais para esta condição? Liste por prioridade, com os sinais de alarme."],
    ["Exame físico dirigido", "Quais manobras e achados do exame físico são essenciais para esta condição?"], ["Internar ou transferir?", "Este paciente tem critério de internação ou de transferência? Quais critérios usar e o que documentar para a regulação?"]];
  function updateChatCtx() { var p = proto(); $("#chatCtx").textContent = (p ? p.n : "sem condição selecionada") + " · " + ptLine(); }
  function drawChat() {
    var box = $("#msgs"); box.textContent = "";
    if (!chat.msgs.length) box.appendChild(h("div", { class: "note", text: "Pergunte sobre o caso. O Assistente PrescriMed recebe a condição, os dados do paciente, a anamnese, o exame, os escores e o que já foi prescrito." }));
    chat.msgs.forEach(function (m) { var d = h("div", { class: "msg " + (m.role === "user" ? "u" : "a") }, m.content || (m.role === "assistant" && chat.busy ? "Pensando…" : "")); if (m.role === "assistant" && m.content && !m.pending) d.appendChild(h("div", { class: "act" }, h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(m.content); } }))); m.el = d; box.appendChild(d); });
    box.scrollTop = box.scrollHeight;
    var qk = $("#qk"); qk.textContent = ""; QK.forEach(function (q) { qk.appendChild(h("button", { class: "chip", type: "button", text: q[0], disabled: chat.busy, onclick: function () { send(q[1]); } })); });
  }
  async function send(text) {
    text = String(text || "").trim(); if (!text || chat.busy) return;
    if (!sample) { chat.msgs.push({ role: "user", content: text }, { role: "assistant", content: "O Assistente PrescriMed não está disponível nesta visualização." }); drawChat(); return; }
    chat.msgs.push({ role: "user", content: text }); var a = { role: "assistant", content: "", pending: true }; chat.msgs.push(a); chat.busy = true; $("#chatSend").disabled = true; drawChat();
    var hist = chat.msgs.filter(function (m) { return m !== a; }).map(function (m) { return { role: m.role, content: m.content }; });
    hist[hist.length - 1] = { role: "user", content: SYS + "\n\nCONTEXTO ATUAL DO CASO (atualizado agora):\n" + caseContext() + "\n\nMENSAGEM DO MÉDICO:\n" + text };
    try { var r = await sample(hist, { modelTier: "default", cache: false, onText: function (o) { a.content = o.text; if (a.el) { a.el.textContent = o.text; $("#msgs").scrollTop = $("#msgs").scrollHeight; } } }); a.content = (r.text || "").replace(/\*\*/g, ""); }
    catch (e) { a.content = (e && e.text) ? e.text + "\n\n[interrompido]" : aiErr(e); }
    finally { a.pending = false; chat.busy = false; $("#chatSend").disabled = false; drawChat(); }
  }
  function openChat(prefill) { $("#chat").hidden = false; $("#fab").hidden = true; updateChatCtx(); drawChat(); var i = $("#chatIn"); if (prefill) { i.value = prefill; } setTimeout(function () { try { i.focus(); } catch (e) {} }, 30); }
  $("#fab").addEventListener("click", function () { openChat(); });
  $("#chatClose").addEventListener("click", function () { $("#chat").hidden = true; $("#fab").hidden = false; });
  $("#chatClear").addEventListener("click", function () { chat.msgs = []; drawChat(); });
  $("#chatForm").addEventListener("submit", function (e) { e.preventDefault(); var i = $("#chatIn"); var t = i.value; i.value = ""; send(t); });
  $("#chatIn").addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chatForm").requestSubmit(); } });
  // o chat precisa ficar acima da janela modal
  $("#modal").addEventListener("close", function () {});
  var chatEl = $("#chat"), fabEl = $("#fab");
  var mo = new MutationObserver(function () { var host = dlg.open ? dlg : document.body; if (chatEl.parentNode !== host) host.appendChild(chatEl); if (fabEl.parentNode !== host) host.appendChild(fabEl); });
  mo.observe(dlg, { attributes: true, attributeFilter: ["open"] });

  /* ======================= topo ======================= */
  $("#goHome").addEventListener("click", function () { go("home"); });
  $("#goHome").addEventListener("keydown", function (e) { if (e.key === "Enter") go("home"); });
  $("#ptChip").addEventListener("click", openPatient);
  $("#btnCfg").addEventListener("click", openCfg);
  var newArmed = false;
  $("#btnNew").addEventListener("click", function () {
    if (!newArmed) { newArmed = true; toast("Toque de novo em + para apagar este atendimento e começar outro."); setTimeout(function () { newArmed = false; }, 4000); return; }
    newArmed = false; C = blankCase(); save(); chat.msgs = []; scoreVals = {}; go("home"); toast("Novo atendimento.");
  });
  window.PSAPP.test = { C: function () { return C; }, hcalc: hcalc, hidrCalc: hidrCalc, hospItems: hospItems, anamText: anamText, efText: efText, caseContext: caseContext, openMod: openMod, chooseProto: chooseProto };
  render();
})();
