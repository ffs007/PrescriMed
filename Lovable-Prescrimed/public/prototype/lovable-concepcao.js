/* Concepção completa do Dr. Felipe (27/11/2026) — 100% aditivo, sem editar app.js.
   ① MESCLAR CONDIÇÕES: múltiplas condições com prescrições/exames/anamnese mesclados e deduplicados
   ② MEU HOSPITAL: disponibilidade de medicamentos/recursos → selo + sugestão de transferência
   ③ PACIENTE ESPECIAL: hepatopata (hepatotóxicas em vermelho), cardiopata, IG obstétrica por DUM/US
   ④ INTERNAÇÃO/AIH: AIH pré-preenchida, modelo por upload+IA, evolução de admissão, enfermaria, exames
   ⑤ CARDIOVERSÃO/DESFIBRILAÇÃO: módulo dedicado com energia por peso e sedação calculada
   ⑥ ECG/RX COM IA: upload de imagem → leitura com nota de acurácia → laudo + ensinamentos
   Usa PSAPP.test (C/hcalc/hospItems/anamText/efText/openMod/chooseProto) + globals; intercepta
   cliques dos cards em fase de captura quando há condições mescladas. */
(function () {
  "use strict";
  var api = window.PSAPP && window.PSAPP.test;
  if (!api || api.__concepcao) return; api.__concepcao = true;
  var D = window.PROTO_DB, HD = window.HOSP_DB, CL = window.CLIN, SC = window.SCORES, E = window.Engine;

  /* ---------- util replicadas do app ---------- */
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
  function readLS(k, fb) { var v = lsGet(k); return v == null ? fb : v; }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function nowHM() { var d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function nf(v, d) { if (v == null || isNaN(v)) return ""; return (+v).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }); }
  function fold(s) { return E.fold ? E.fold(s) : String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function toast(t) { var x = h("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }
  function copy(text, el) { var ok = function () { toast("Copiado."); }, fb = function () { if (el && el.select) { el.focus(); el.select(); toast("Texto selecionado — use Ctrl+C."); } else toast("Não consegui copiar automaticamente."); }; try { navigator.clipboard.writeText(text).then(ok, fb); } catch (e) { fb(); } }
  function fmtM(m) { return m >= 24 ? nf(m / 12, 0) + " anos" : m + " meses"; }
  function shortTxt(t, n) { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t; }

  function cse() { return api.C(); }
  var saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { var c = Object.assign({}, cse()); c.docs = []; lsSet("psx.case", c); }, 400); }
  function monthsFromNasc(n) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(n || ""); if (!m) return null; var b = new Date(+m[3], +m[2] - 1, +m[1]), t = new Date(); var mo = (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth(); if (t.getDate() < b.getDate()) mo--; return mo >= 0 && mo < 1600 ? mo : null; }
  function idadeM() { var p = cse().pac; if (p.idade !== "" && p.idade != null && !isNaN(parseFloat(String(p.idade).replace(",", ".")))) { var v = parseFloat(String(p.idade).replace(",", ".")); return p.idUn === "meses" ? v : v * 12; } return monthsFromNasc(p.nasc); }
  function pesoN() { var v = parseFloat(String(cse().pac.peso || "").replace(",", ".")); return v > 0 && v < 400 ? v : null; }
  function idadeTxt() { var m = idadeM(); return m == null ? "" : m < 24 ? Math.round(m) + " meses" : Math.floor(m / 12) + " anos"; }
  function sexoTxt() { return cse().pac.sexo === "F" ? "feminino" : cse().pac.sexo === "M" ? "masculino" : ""; }
  function ptLine() { var p = cse().pac; return [p.nome || "Paciente sem nome", idadeTxt(), sexoTxt(), pesoN() ? nf(pesoN(), 1) + " kg" : "", p.gest ? "gestante" : ""].filter(Boolean).join(" · "); }
  function perfil() { E.setPatient({ peso: cse().pac.peso, idadeM: idadeM(), perfil: cse().pac.perfil || "auto", gest: !!cse().pac.gest }); return E.perfil(); }
  function byId(id) { return D.protocols.find(function (p) { return p.id === id; }) || null; }
  function primary() { return byId(cse().proto); }
  function merged() { return (cse().merged || []).map(byId).filter(Boolean); }
  function protos() { var a = [primary()].concat(merged()).filter(Boolean); return a; }

  /* SIGTAP (nomes dos procedimentos) */
  function parseCat(s) { return String(s || "").split("\n").filter(Boolean).map(function (l) { var i = l.indexOf("|"); return { c: l.slice(0, i), n: l.slice(i + 1) }; }); }
  var BYC = new Map(parseCat(window.SIGTAP_IMG).concat(parseCat(window.SIGTAP_LAB)).map(function (x) { return [x.c, x]; }));
  function examName(c) { var x = BYC.get(c); return x ? x.n : c; }
  var HN = {}; HD ? Object.keys(HD.drugs).forEach(function (id) { var k = fold(HD.drugs[id].n); (HN[k] = HN[k] || []).push(id); }) : 0;

  /* config do app (psx.cfg) */
  function cfg() {
    var c = lsGet("psx.cfg") || {};
    return { estab: Object.assign({ nome: "HOSPITAL MUNICIPAL DE CABECEIRAS", cnes: "", cidade: "Cabeceiras-GO", endereco: "" }, c.estab || {}), sol: Object.assign({ nome: "", conselho: "" }, c.sol || {}) };
  }
  function pdfPac() { var p = cse().pac; return { nome: (p.nome || "").toUpperCase(), idade: idadeTxt(), sexo: sexoTxt(), peso: pesoN() ? nf(pesoN(), 1) : "", cns: p.cns, leito: p.leito, alergias: p.alergias }; }
  function fileBase(pref) { var n = (cse().pac.nome || "PACIENTE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase(); return pref + "_" + n + "_" + today().split("/").reverse().join("-") + ".pdf"; }

  /* ---------- shell de modal (réplica de openShell) ---------- */
  var dlg = document.getElementById("modal");
  function openShell(title, sub) {
    document.getElementById("mTitle").textContent = title;
    document.getElementById("mSub").textContent = sub || "";
    var b = document.getElementById("mBody"), f = document.getElementById("mFoot");
    b.textContent = ""; f.textContent = ""; if (!dlg.open) dlg.showModal(); b.scrollTop = 0; dlg.scrollTop = 0;
    return { b: b, f: f };
  }
  function headSub() { var ps = protos(); return ps.map(function (p) { return p.n; }).join(" + ") + " · " + ptLine(); }

  /* ---------- IA ---------- */
  var sample = null;
  if (window.claude && window.claude.use) { try { window.claude.use("sample").then(function (s) { sample = s; }).catch(function () {}); } catch (e) {} }
  function aiErr(e) { var c = e && e.code; return ({ cancelled: "Interrompido.", not_granted: "Uso do Assistente PrescriMed não autorizado nesta página.", rate_limited: "Muitas solicitações agora. Tente de novo em instantes.", prompt_too_large: "Conteúdo grande demais.", refused: "O Assistente PrescriMed recusou este conteúdo.", image_rejected: "Esta visualização não envia imagens; descreva o traçado em texto." })[c] || "Falha ao consultar o Assistente PrescriMed (" + (c || "erro") + ")."; }
  async function ask(prompt, onText) {
    if (!sample) throw { code: "not_granted" };
    var r = await sample(prompt, { modelTier: "default", cache: false, onText: onText ? function (o) { onText(o.text); } : undefined });
    return (r.text || "").replace(/^```[a-z]*\n?|```$/g, "").replace(/\*\*/g, "").trim();
  }
  async function askJSON(prompt, opts) { if (!sample) throw { code: "not_granted" }; return sample.json(prompt, { modelTier: "default", cache: false }, opts || {}); }

  /* ---------- PDF (réplica de pdfBar) ---------- */
  var downloads = null;
  if (window.claude && window.claude.use) { try { window.claude.use("downloads").then(function (d) { downloads = d; }).catch(function () {}); } catch (e) {} }
  function pdfBar(foot, makeDoc, name, status) {
    var last = null, pv = h("div", { class: "preview" });
    var bGen = h("button", { class: "btn primary", type: "button", text: "Gerar PDF" }), bDl = h("button", { class: "btn", type: "button", text: "Baixar PDF", disabled: true });
    bGen.addEventListener("click", async function () {
      try { if (!window.jspdf) throw new Error("gerador de PDF não carregou"); var out = makeDoc(); if (!out) return; var ab = out.doc.output("arraybuffer"); last = { ab: ab, name: typeof name === "function" ? name() : name }; bDl.disabled = false; status.textContent = "PDF pronto: " + last.name; status.className = "status ok"; }
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
  async function pdfToContent(file) {
    var buf = await file.arrayBuffer(), pdf = await pdfjsLib.getDocument({ data: buf }).promise, text = "";
    for (var i = 1; i <= Math.min(pdf.numPages, 15); i++) { var pg = await pdf.getPage(i), tc = await pg.getTextContent(), lastY = null, lastEnd = null, line = "";
      tc.items.forEach(function (it) { if (typeof it.str !== "string") return; var x = it.transform[4], y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 2) { text += line + "\n"; line = ""; lastEnd = null; } var gap = lastEnd === null ? 99 : x - lastEnd; line += (line && gap > 1.2 ? " " : "") + it.str; lastY = y; lastEnd = x + (it.width || 0); });
      text += line + "\n\n"; }
    var images = [];
    if (text.replace(/\s/g, "").length < 120) { for (var k = 1; k <= Math.min(pdf.numPages, 3); k++) { var p2 = await pdf.getPage(k), vp = p2.getViewport({ scale: 1.6 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; await p2.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; images.push(await new Promise(function (res) { cv.toBlob(res, "image/jpeg", 0.85); })); } }
    return { text: text.replace(/\s+$/, "").trim(), images: images };
  }

  /* =====================================================
     ② MEU HOSPITAL — disponibilidade e transferência
     ===================================================== */
  var REC = [["uti", "UTI adulto"], ["utip", "UTI pediátrica"], ["vd", "Ventilação mecânica"], ["hemod", "Hemodinâmica / cateterismo"], ["tc", "Tomografia"], ["us", "US à beira do leito"], ["rx", "Raio-X"], ["ecg", "ECG"], ["hemo", "Hemodiálise"], ["banco", "Banco de sangue"]];
  /* recursos imprescindíveis por família de condição (por palavra no id/nome/categoria) */
  var REC_RULES = [
    ["sepse|choque|shock", ["uti", "vd"]],
    ["car_|sca|coronariana|infarto|iam", ["ecg", "hemod"]],
    ["eap|edema agudo|insuficiencia cardiaca|icc|descompensacao", ["vd", "utip"]],
    ["avc|acidente vascular|neuro|status", ["tc"]],
    ["tep|tromboembolismo|trombose", ["tc"]],
    ["pcr|parada", ["vd"]],
    ["crise hipertensiva|hipertensiva", ["ecg"]],
    ["insuficiencia renal|dialitica|uremia", ["hemo"]],
    ["trauma|politram|hemorragia|gastro", ["banco"]],
    ["politrauma", ["tc"]]
  ];
  function recsFor(p) {
    var hay = fold(p.id + " " + p.n + " " + p.cat), out = [];
    REC_RULES.forEach(function (r) { if (new RegExp(r[0]).test(hay)) r[1].forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); }); });
    return out;
  }
  function hospitalStore() { var s = readLS("psx.hospital", null) || { drugs: {}, rec: {} }; if (!s.drugs) s.drugs = {}; if (!s.rec) s.rec = {}; return s; }
  function persistStore(s) { lsSet("psx.hospital", s || hospitalStore()); }
  function faltaDrugs() { var s = hospitalStore(); return Object.keys(s.drugs).filter(function (id) { return s.drugs[id] === "falta" && HD.drugs[id]; }); }
  function faltaRecs() { var s = hospitalStore(); return Object.keys(s.rec).filter(function (k) { return s.rec[k]; }); }

  function openHospital() {
    var s = openShell("Meu hospital", "marque o que NÃO tem no serviço — o app avisa nas prescrições e sugere transferência");
    var b = s.b, f = s.f, st = h("div", { class: "status" });
    function store() { return hospitalStore(); }
    function persist(s) { persistStore(s); }
    b.appendChild(h("div", { class: "note", text: "Tudo é “tem” por padrão — marque apenas o que falta. Ao prescrever, itens sem estoque ganham selo vermelho e, se forem imprescindíveis à condição, o app sugere transferência/regulação." }));
    /* recursos */
    var recWrap = h("div", { class: "exgrid" });
    function drawRecs() { recWrap.textContent = ""; REC.forEach(function (r) {
      var lb = h("label", { class: "exitem" }); var cb = h("input", { type: "checkbox", checked: !!store().rec[r[0]], onchange: function (e) { var st2 = store(); if (e.target.checked) st2.rec[r[0]] = true; else delete st2.rec[r[0]]; persist(st2); } });
      lb.append(cb, h("span", { text: r[1] }), h("small", { text: "recurso" })); recWrap.appendChild(lb); }); }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Recursos do serviço" }), recWrap));
    drawRecs();
    /* medicamentos */
    var q = h("input", { class: "in", placeholder: "Buscar medicamento… (ex.: noradrenalina, alteplase)" }), res = h("div", { class: "exgrid" });
    q.addEventListener("input", function () { drawSearch(); });
    function drawSearch() { res.textContent = ""; var t = fold(q.value).trim(); if (t.length < 2) { res.appendChild(h("div", { class: "note", text: "Digite ao menos 2 letras." })); return; }
      var hits = Object.keys(HD.drugs).filter(function (id) { return fold(HD.drugs[id].n).indexOf(t) >= 0; }).slice(0, 40);
      if (!hits.length) { res.appendChild(h("div", { class: "note", text: "Nada encontrado na base hospitalar." })); return; }
      hits.forEach(function (id) { res.appendChild(drugTgl(id)); }); }
    function drugTgl(id) {
      var d = HD.drugs[id], lb = h("label", { class: "exitem" }), sel = h("select", { class: "sel" }, [["ok", "tem"], ["falta", "NÃO tem"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
      sel.value = store().drugs[id] === "falta" ? "falta" : "ok";
      sel.addEventListener("change", function () { var st2 = store(); if (sel.value === "falta") st2.drugs[id] = "falta"; else delete st2.drugs[id]; persist(st2); toast(sel.value === "falta" ? "Marcado como SEM estoque: " + d.n : "Disponível: " + d.n); });
      lb.append(h("span", { text: d.n }), h("small", { text: d.via || "" }), sel); return lb;
    }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Buscar qualquer medicamento" }), q, res));
    drawSearch();
    /* lista atual das condições do atendimento primeiro */
    var cur = h("div", { class: "box" }, h("h3", null, "Da condição em atendimento", h("small", { text: headSub() })));
    var ids = [];
    protos().forEach(function (p) { (HD.map[p.id] || []).forEach(function (k) { (HD.classes[k] || { d: [] }).d.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); }); });
    if (!ids.length) cur.appendChild(h("div", { class: "note", text: "Escolha uma condição para ver os medicamentos típicos dela aqui." }));
    ids.forEach(function (id) { cur.appendChild(drugTgl(id)); });
    b.insertBefore(cur, b.children[1] || null);
    f.appendChild(h("button", { class: "btn primary", type: "button", text: "Concluir", onclick: function () { dlg.close(); } }));
    f.appendChild(st);
  }

  /* selos/banners dentro dos modais do app (hosp e rx nativos) */
  var decoBusy = false;
  function mTitleText() { var t = document.getElementById("mTitle"); return t ? t.textContent : ""; }
  function drugIdsByName(nm) { return HN[fold(nm)] || []; }
  function decorateModal() {
    if (decoBusy) return; decoBusy = true;
    setTimeout(function () {
      decoBusy = false;
      try {
        var body = document.getElementById("mBody"); if (!body || !dlg.open) return;
        var t = mTitleText(), isHosp = /Prescrição hospitalar/.test(t), isRx = /Prescrição ambulatorial|Receita de alta/.test(t);
        if (!isHosp && !isRx) return;
        var C = cse(), P = C.pac;
        var flags = [];
        if (P.hepato) flags.push("hepato");
        /* banners de perfil especial */
        if (isHosp && !body.querySelector("[data-psx-banner-perf]")) {
          var msgs = [];
          if (P.cardio) msgs.push("Cardiopata: expansão com 10 mL/kg, reavalie a cada 500 mL; evitar sobrecarga de volume.");
          if (P.hepato) msgs.push("Hepatopata: itens hepatotóxicos marcados em vermelho abaixo; preferir alternativas e doses reduzidas quando couber.");
          if (msgs.length) body.insertBefore(h("div", { class: "alertbox", "data-psx-banner-perf": "1" }, h("b", { text: "Perfil do paciente: " }), msgs.join(" ")), body.firstChild);
        }
        /* selos por linha de medicamento */
        var faltas = hospitalStore();
        var activeIds = []; protos().forEach(function (p) { (HD.map[p.id] || []).forEach(function (k) { (HD.classes[k] || { d: [] }).d.forEach(function (id) { activeIds.push(id); }); }); });
        var missingEss = [], rows = body.querySelectorAll(".drow");
        Array.prototype.forEach.call(rows, function (row) {
          var nm = row.querySelector(".nm"); if (!nm) return;
          var ids = drugIdsByName(nm.textContent);
          var anyFalta = ids.some(function (id) { return faltas.drugs[id] === "falta"; });
          if (anyFalta && !row.querySelector("[data-psx-falta]")) {
            nm.appendChild(h("span", { class: "badge b", "data-psx-falta": "1", text: "SEM NO SEU HOSPITAL" }));
            if (isHosp && ids.some(function (id) { return activeIds.indexOf(id) >= 0; })) missingEss.push(nm.childNodes[0].textContent);
          }
          if (P.hepato) {
            var tok = HEPATO.find(function (x) { return fold(nm.textContent).indexOf(x) >= 0; });
            if (tok && !row.querySelector("[data-psx-hepato]")) nm.appendChild(h("span", { class: "badge b", "data-psx-hepato": "1", text: "hepatotóxico" }));
          }
        });
        /* banner de transferência */
        if (isHosp) {
          var recs = []; protos().forEach(function (p) { recsFor(p).forEach(function (r) { if (recs.indexOf(r) < 0) recs.push(r); }); });
          var recFaltando = recs.filter(function (r) { return faltas.rec[r]; }).map(function (r) { var x = REC.find(function (y) { return y[0] === r; }); return x ? x[1] : r; });
          if ((missingEss.length || recFaltando.length) && !body.querySelector("[data-psx-banner-transf]")) {
            var det = [];
            if (missingEss.length) det.push("Medicamento(s) imprescindível(is) sem estoque: " + missingEss.join(", ") + ".");
            if (recFaltando.length) det.push("Recurso(s) necessário(s) a esta condição e sem disponibilidade: " + recFaltando.join(", ") + ".");
            body.insertBefore(h("div", { class: "alertbox bad", "data-psx-banner-transf": "1" },
              h("b", { text: "Seu hospital não dispõe de tudo que esta condição pede. " }), det.join(" "),
              h("button", { class: "btn sm", type: "button", text: "Abrir Transferência", onclick: function () { api.openMod("transf"); } })), body.querySelector("[data-psx-banner-perf]") ? body.children[1] : body.firstChild);
          }
        }
      } catch (e) {}
    }, 60);
  }

  /* =====================================================
     ③ PACIENTE ESPECIAL — hepatopata / cardiopata / IG
     ===================================================== */
  var HEPATO = ["paracetamol", "acetilsalicilico|aas", "diclofenac", "nimesulid", "cetoprofen", "ibuprofen", "naproxen", "tenoxicam", "carbamazep", "fenitoin", "valpro", "isoniazid", "rifampicin", "pirazinamid", "amoxicilina.*clavulan|clavulan", "eritromicin", "fluconazol", "cetoconazol", "terbinafin", "sinvastat", "atorvastat", "rosuvastat", "amiodaron", "metotrex", "azatioprin", "allopurinol|alopurinol", "tamoxifen", "propiltiouracil", "metimazol", "halotano", "fulminante"];
  var HEPATO_RE = new RegExp(HEPATO.join("|"), "i");
  function igInfo() {
    var p = cse().pac; if (!p || !p.gest) return null;
    var out = {};
    var dum = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(p.dum || "");
    if (dum) { var d = new Date(+dum[3], +dum[2] - 1, +dum[1]); var ms = Date.now() - d.getTime(); var dias = Math.floor(ms / 86400000);
      if (dias >= 0 && dias <= 320) { out.semanas = Math.floor(dias / 7); out.dias = dias % 7; var dpp = new Date(d.getTime() + 280 * 86400000); out.dpp = pad2(dpp.getDate()) + "/" + pad2(dpp.getMonth() + 1) + "/" + dpp.getFullYear(); } }
    var us = parseFloat(String(p.igUs || "").replace(",", "."));
    if (us > 0 && us < 45) out.usSem = us;
    return (out.semanas || out.usSem) ? out : null;
  }
  function igTxt(ig) {
    if (!ig) return "";
    var prim = ig.semanas != null ? ig.semanas + "s" + (ig.dias ? " " + ig.dias + "d" : "") + " (DUM)" : nf(ig.usSem, 0) + "s (US)";
    var sec = ig.usSem != null && ig.semanas != null ? " · US: " + nf(ig.usSem, 0) + "s" : "";
    var dpp = ig.dpp ? " · DPP " + ig.dpp : "";
    return "IG " + prim + sec + dpp;
  }
  /* injeta o box "Perfil especial" no modal nativo "Dados do paciente" */
  function injectPatientBox() {
    if (!/Dados do paciente/.test(mTitleText())) return;
    var body = document.getElementById("mBody"); if (!body || body.querySelector("[data-psx-perfil]")) return;
    var P = cse().pac, st = h("div", { class: "status" });
    var box = h("div", { class: "box", "data-psx-perfil": "1" }, h("h3", null, "Perfil especial", h("small", { text: "muda selos, doses e alertas em todo o atendimento" })));
    var lb1 = h("label", { class: "check" }, h("input", { type: "checkbox", checked: !!P.hepato, onchange: function (e) { P.hepato = e.target.checked; save(); st.textContent = e.target.checked ? "Hepatopata: hepatotóxicos serão marcados em vermelho nas prescrições." : "Hepatopata desmarcada."; st.className = "status ok"; } }), "Hepatopata — marca drogas hepatotóxicas em vermelho nas prescrições");
    var lb2 = h("label", { class: "check" }, h("input", { type: "checkbox", checked: !!P.cardio, onchange: function (e) { P.cardio = e.target.checked; save(); st.textContent = e.target.checked ? "Cardiopata: hidratação/expansão com cautela (10 mL/kg)." : "Cardiopata desmarcada."; st.className = "status ok"; } }), "Cardiopata — cautela com volume e expansão");
    box.append(lb1, lb2);
    box.appendChild(h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "DUM (última menstruação) DD/MM/AAAA" }), h("input", { class: "in mono", id: "psxDum", value: P.dum || "", placeholder: "ex.: 05/09/2026", oninput: function (e) { P.dum = e.target.value; updIg(); } })),
      h("label", { class: "f" }, h("span", { text: "IG por US (semanas)" }), h("input", { class: "in mono", id: "psxIgUs", value: P.igUs || "", placeholder: "ex.: 31", inputmode: "decimal", oninput: function (e) { P.igUs = e.target.value; updIg(); } }))));
    var igOut = h("div", { class: "note" });
    function updIg() { save(); var ig = igInfo(); igOut.textContent = ig ? igTxt(ig) + " — pré-feta por US prevalece para conduta obstétrica se divergente." : "Informe DUM e/ou semanas por US."; }
    updIg();
    box.append(igOut, h("div", { class: "note", text: "Cálculo: Naegele (DUM + 280 dias). Doses de gestante já são trocadas automaticamente pela marcação “Gestante” acima." }), st);
    body.appendChild(box);
  }

  /* faixa de IG no painel da condição */
  function sweepCondExtras() {
    var app = document.getElementById("app"); if (!app) return;
    var chead = app.querySelector(".chead"); if (!chead) return;
    /* botões: Mesclar + Meu hospital */
    if (!chead.querySelector("[data-psx-btn-merge]")) {
      var b2 = h("button", { class: "btn", type: "button", "data-psx-btn-hosp": "1", text: "🏥 Meu hospital", onclick: openHospital });
      var b1 = h("button", { class: "btn", type: "button", "data-psx-btn-merge": "1", text: "＋ Mesclar condição", onclick: openMergeManager });
      var ref = chead.querySelector("button.btn");
      chead.appendChild(b1); chead.appendChild(b2);
    }
    /* faixa mesclada */
    var mg = merged();
    var band = chead.querySelector("[data-psx-band]");
    if (mg.length) {
      if (!band) { band = h("div", { class: "alertbox", "data-psx-band": "1", style: "width:100%" }); chead.appendChild(band); }
      band.textContent = "";
      band.append(h("b", { text: "Mesclado: " }), primary() ? primary().n : "?");
      mg.forEach(function (p, i) { band.append(document.createTextNode(" + "), h("span", { text: p.n }), h("button", { class: "x", type: "button", "aria-label": "Remover " + p.n, text: "×", onclick: function () { cse().merged.splice(i, 1); save(); sweepCondExtras(true); } })); });
    } else if (band) band.remove();
    /* faixa de IG */
    var ig = igInfo();
    var igBand = app.querySelector("[data-psx-ig]");
    if (ig) { if (!igBand) { igBand = h("div", { class: "note", "data-psx-ig": "1", style: "margin:2px 0 0" }); chead.appendChild(igBand); } igBand.textContent = igTxt(ig); }
    else if (igBand) igBand.remove();
  }

  /* =====================================================
     ① MESCLAR CONDIÇÕES
     ===================================================== */
  function openMergeManager() {
    var s = openShell("Mesclar condições", "um atendimento, várias hipóteses — listas mescladas e deduplicadas");
    var b = s.b, f = s.f;
    var cur = protos();
    var box = h("div", { class: "box" }, h("h3", null, "Condições do atendimento", h("small", { text: cur.length > 1 ? cur.length + " mescladas" : "só a principal" })));
    var list = h("div", { class: "chips" });
    cur.forEach(function (p, i) {
      var c = h("span", { class: "chip" + (i ? " pos" : " on"), text: p.n + (i ? " ✕" : " (principal)") });
      if (i) c.addEventListener("click", function () { cse().merged.splice(i - 1, 1); save(); openMergeManager(); sweepCondExtras(); });
      list.appendChild(c);
    });
    if (!cur.length) list.appendChild(h("span", { class: "note", text: "Escolha a condição principal antes de mesclar." }));
    box.appendChild(list); b.appendChild(box);
    var q = h("input", { class: "in", placeholder: "Buscar condição para acrescentar (sinônimos populares funcionam)" }), res = h("div", { class: "conds" });
    function draw() {
      res.textContent = ""; var t = fold(q.value).trim(), toks = t.split(/\s+/).filter(Boolean);
      if (!toks.length) return;
      D.protocols.filter(function (p) { var hay = fold(p.n + " " + (p.alias || "") + " " + p.cat); return toks.every(function (tk) { return hay.indexOf(tk) >= 0; }); })
        .filter(function (p) { return cse().proto !== p.id && (cse().merged || []).indexOf(p.id) < 0; })
        .slice(0, 24).forEach(function (p) {
          res.appendChild(h("button", { class: "cond", type: "button", onclick: function () {
            var C = cse(); if (!C.merged) C.merged = []; C.merged.push(p.id); save(); toast("Mesclado: " + p.n); openMergeManager(); sweepCondExtras();
          } }, h("b", { text: p.n }), h("small", { text: p.cat + (p.cid && p.cid[0] ? " · " + p.cid[0][0] : "") })));
        });
    }
    q.addEventListener("input", draw);
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Acrescentar condição" }), q, h("div", { class: "note", text: "Ao mesclar: prescrições (ambulatorial e hospitalar), exames, anamnese, exame físico, encaminhamento, transferência e evolução passam a mostrar as listas das duas condições, com deduplicação de molécula e de exame." }), res));
    f.appendChild(h("button", { class: "btn primary", type: "button", text: "Concluir", onclick: function () { dlg.close(); } }));
  }

  /* variantes mescladas dos módulos */
  function unionGroups(mapFn, catFn) {
    var g = [], seen = {};
    protos().forEach(function (p) { (mapFn(p) || catFn(p.cat) || ["dor"]).forEach(function (k) { if (!seen[k]) { seen[k] = 1; g.push(k); } }); });
    var pf = perfil();
    if (pf === "ped" && g.indexOf("ped") < 0) g.push("ped");
    if (cse().pac.gest && g.indexOf("obst") < 0) g.push("obst");
    return g;
  }
  function multiProtoBlock(name) {
    var n = fold(name), AINE = /cetorolac|cetoprofen|tenoxicam|diclofenac|ibuprofen|nimesulid|naproxen|piroxicam|meloxicam|aas|acido acetilsalicilico|acetilsalicil/;
    for (var i = 0; i < protos().length; i++) { var p = protos()[i];
      if (p.id === "dengue" && AINE.test(n)) return "Contraindicado na dengue (condição mesclada): AINE/AAS aumentam risco de sangramento.";
      if (p.id === "varicela" && AINE.test(n)) return "Contraindicado na varicela (condição mesclada): AAS (Reye) e AINE."; }
    return null;
  }
  function rxCalcM(id, sl) { var pb = multiProtoBlock(D.drugs[id].n); if (pb) return { ok: false, err: pb }; return E.calc(id, sl); }
  function hdxList() { return protos().map(function (p) { return p.n + " (CID " + ((p.cid || [])[0] || [""])[0] + ")"; }).join("; "); }
  function anamTextM() {
    var A = cse().anam, pos = [], neg = [], fl = [];
    Object.keys(A.chips).forEach(function (k) { var it = k.split("|")[1]; if (A.chips[k] === 1) pos.push(it); else if (A.chips[k] === 2) neg.push(it); });
    Object.keys(A.fields).forEach(function (k) { if (A.fields[k]) { var g = k.split("|")[0], f = k.split("|")[1], def = (CL.ANAM[g] && CL.ANAM[g].fields.find(function (x) { return x.k === f; })) || { l: f }; fl.push(def.l + ": " + A.fields[k]); } });
    var ant = Object.keys(A.ant).filter(function (k) { return A.ant[k]; });
    var qp = A.qp || protos().map(function (p) { return p.n; }).join(" + ");
    var L = [];
    L.push("QP: " + qp + (A.tempo ? " há " + A.tempo : "") + ".");
    var hda = [A.notas && A.notas.trim(), pos.length ? "Refere " + pos.join(", ") + "." : "", neg.length ? "Nega " + neg.join(", ") + "." : "", fl.length ? fl.join("; ") + "." : ""].filter(Boolean).join(" ");
    L.push("HDA: " + (hda || "—"));
    L.push("Antecedentes: " + (ant.length ? ant.join(", ") : "nega comorbidades") + ". Medicações em uso: " + (A.meds || "nega") + ". Alergias: " + (cse().pac.alergias || "nega alergias medicamentosas") + ".");
    return L.join("\n");
  }
  function efTextM() {
    var F = cse().ef, L = [];
    var sv = CL.SV.filter(function (x) { return F.sv[x[0]]; }).map(function (x) { return x[1] + " " + F.sv[x[0]] + (x[2] === "0–10" ? "/10" : " " + x[2]); });
    if (sv.length) L.push("Sinais vitais: " + sv.join(", ") + ".");
    unionGroups(function (p) { return CL.EF_MAP[p.id]; }, function (c) { return CL.EF_MAP_CAT[c]; }).forEach(function (sk) { var S = CL.EF[sk]; if (!S) return;
      var parts = S.it.map(function (it) { var sel = F.sel[sk + "." + it.k] || []; return sel.length ? sel.map(function (i) { return it.alt[i]; }).join(", ") : it.n; });
      L.push(S.l + ": " + parts.join("; ") + "."); });
    if (F.notas) L.push(F.notas);
    return L.join("\n");
  }
  function examsTxtM() {
    var C = cse(), n = function (c) { return examName(c); };
    var l = Object.keys(C.lab.sel).map(n), c2 = Object.keys(C.comp.sel).map(n);
    return [l.length ? "Laboratoriais: " + l.join(", ") : "", c2.length ? "Complementares: " + c2.join(", ") : ""].filter(Boolean).join(". ");
  }
  function condutaTxtM() {
    var hi = api.hospItems().map(function (x) { return x.text; });
    var C = cse(), a = [];
    if (hi.length) a.push("No PS: " + hi.join("; "));
    if (C.rx.itens.length) a.push("Alta com: " + C.rx.itens.map(function (x) { return x.med + " — " + x.pos; }).join("; "));
    return a.join(". ");
  }

  var MERR = {};
  var MERR_BY_ID = {};

  MERR.hosp = MERR_BY_ID.hosp = function (b, f) {
    var H = cse().hosp, ps = protos();
    ps.forEach(function (p) { if (!H.init[p.id]) { H.init[p.id] = true;
      var di = HD.dietaMap[p.id]; if (!H.dieta && di != null) H.dieta = HD.dietas[di];
      (HD.cuidMap[p.id] || ["ssvv", "avp", "avisar"]).forEach(function (k) { if (!H.cuid[k]) H.cuid[k] = true; });
      (HD.map[p.id] || []).forEach(function (k, i) { if (H.open[k] == null) H.open[k] = i < 2; }); } });
    if (!pesoN()) b.appendChild(h("div", { class: "alertbox" }, "Sem peso: doses por kg e hidratação não podem ser calculadas. ", h("button", { class: "btn sm", type: "button", text: "Informar", onclick: function () { dlg.close(); api.openMod ? document.getElementById("ptChip").click() : 0; } })));
    var prev = h("div", { class: "rxlist" });
    function drawPrev() { prev.textContent = ""; var it = api.hospItems(); if (!it.length) prev.appendChild(h("div", { class: "note", text: "Nada prescrito ainda." })); it.forEach(function (x) { prev.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: x.n + "." }), h("span", { class: "t", text: x.text }), h("span"))); }); save(); }
    var dSel = h("select", { class: "sel", onchange: function (e) { H.dieta = e.target.value; drawPrev(); } }, h("option", { value: "", text: "— sem dieta na prescrição —" }), HD.dietas.map(function (d) { return h("option", { value: d, text: d }); })); dSel.value = H.dieta;
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Dieta" }), h("div", { class: "grid" }, dSel, h("input", { class: "in", placeholder: "complemento (ex.: liberar após 6 h)", value: H.dietaTxt, oninput: function (e) { H.dietaTxt = e.target.value; drawPrev(); } }))));
    /* hidratação (réplica com presets) */
    var HP = [["exp", "Expansão volêmica"], ["man_ad", "Manutenção — adulto"], ["hs", "Manutenção — criança (Holliday-Segar)"], ["planoB", "Plano B — reidratação oral"], ["planoC", "Plano C — desidratação grave (MS)"], ["dengC", "Dengue grupo C"], ["dengD", "Dengue grupo D (choque)"]];
    var hidBox = h("div", { class: "box" }, h("h3", null, "Hidratação venosa / oral", h("small", { text: "calculada pelo peso" })));
    var pre = h("select", { class: "sel" }, HP.map(function (x) { return h("option", { value: x[0], text: x[1] }); })), opt = h("select", { class: "sel" }), out = h("div"), list = h("div", { class: "rxlist" });
    var anyDeng = ps.some(function (p) { return p.id === "dengue"; }), anyGE = ps.some(function (p) { return p.id === "geca"; });
    if (anyDeng) pre.value = "dengC"; else if (anyGE) pre.value = perfil() === "ped" ? "planoB" : "exp"; else if (perfil() === "ped") pre.value = "hs"; else pre.value = "man_ad";
    function opts() { opt.textContent = ""; var o = pre.value === "exp" ? (perfil() === "ped" ? [["20", "20 mL/kg"], ["10", "10 mL/kg (cardiopata/dengue)"]] : [["1000", "1.000 mL"], ["500", "500 mL (idoso/cardiopata)"]]) : pre.value === "man_ad" ? [["1500", "1.500 mL/24 h"], ["2000", "2.000 mL/24 h"], ["1000", "1.000 mL/24 h"]] : [["", "—"]]; o.forEach(function (x) { opt.appendChild(h("option", { value: x[0], text: x[1] })); }); opt.hidden = o.length < 2; calc(); }
    function calc() { out.textContent = ""; var r = api.hidrCalc(pre.value, pesoN(), idadeM(), opt.value); if (r.err) { out.appendChild(h("div", { class: "err", text: r.err })); return; } r.lines.forEach(function (l) { out.appendChild(h("div", { class: "line", text: l })); }); if (r.note) out.appendChild(h("div", { class: "det", text: r.note })); out._lines = r.lines; }
    function drawList() { list.textContent = ""; H.hid.forEach(function (l, i) { list.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: "•" }), h("span", { class: "t", text: l }), h("button", { class: "x", type: "button", "aria-label": "Remover", text: "×", onclick: function () { H.hid.splice(i, 1); drawList(); drawPrev(); } }))); }); }
    pre.addEventListener("change", opts); opt.addEventListener("change", calc);
    hidBox.append(h("div", { class: "grid" }, pre, opt), out, h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Adicionar à prescrição", onclick: function () { (out._lines || []).forEach(function (l) { if (!/^\(alternativa/.test(l)) H.hid.push(l); }); drawList(); drawPrev(); } })), list);
    b.appendChild(hidBox); opts(); drawList();
    /* medicamentos: união de classes de TODAS as condições — dedupe por id de droga */
    var medBox = h("div", { class: "box" }), clsWrap = h("div", { class: "chips" }), rows = h("div");
    medBox.append(h("h3", null, "Medicamentos", h("small", { text: "união das classes de: " + ps.map(function (p) { return p.n; }).join(" + ") + (perfil() === "ped" ? " · pediátrico" : "") })), clsWrap,
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: H.allCls, onchange: function (e) { H.allCls = e.target.checked; drawCls(); } }), "Mostrar todas as classes"), rows);
    b.appendChild(medBox);
    function classesFor() {
      var base = [], seen = {};
      ps.forEach(function (p) { (HD.map[p.id] || []).forEach(function (k) { if (!seen[k]) { seen[k] = 1; base.push(k); } }); });
      return H.allCls ? base.concat(Object.keys(HD.classes).filter(function (k) { return !seen[k]; })) : base;
    }
    function drawCls() {
      clsWrap.textContent = ""; var ks = classesFor();
      if (!ks.length) clsWrap.appendChild(h("span", { class: "note", text: "Sem classes para as condições mescladas." }));
      ks.forEach(function (k) { clsWrap.appendChild(h("button", { class: "chip" + (H.open[k] ? " on" : ""), type: "button", text: HD.classes[k].n, onclick: function () { H.open[k] = !H.open[k]; drawCls(); } })); });
      drawRows();
    }
    function drawRows() {
      rows.textContent = ""; var seenD = {};
      classesFor().filter(function (k) { return H.open[k]; }).forEach(function (k) {
        var cl = HD.classes[k]; rows.appendChild(h("h3", { text: cl.n, style: "font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:8px" }));
        cl.d.forEach(function (id) { if (seenD[id]) return; seenD[id] = 1; rows.appendChild(hRow(id)); }); });
    }
    function hRow(id) {
      var d = HD.drugs[id], s = H.sel[id] = H.sel[id] || {}, r = api.hcalc(id, s);
      if (r.ok) { var pb = multiProtoBlock(d.n); if (pb) r = { ok: false, err: pb }; }
      var row = h("div", { class: "drow" });
      var cb = h("input", { type: "checkbox", checked: !!s.on && r.ok, disabled: !r.ok, onchange: function (e) { s.on = e.target.checked; drawPrev(); } });
      row.appendChild(h("label", { class: "dhead" }, cb, h("span", { class: "nm", text: d.n }), h("span", { class: "badge", text: d.via }), d.atb ? h("span", { class: "badge", text: "antimicrobiano" }) : null, cse().pac.gest && d.gx ? h("span", { class: "badge b", text: "contraindicado na gestação" }) : null));
      var pf = perfil(), aMode = pf !== "ped" && d.a && d.a.length && (s.mode === "a" || (s.mode == null && d.paDef === "a")), usePed = !aMode && (pf === "ped" || (d.pa && pesoN() && d.p && d.p.regs));
      if (pf !== "ped" && d.pa && pesoN() && d.p && d.p.regs && d.a && d.a.length) {
        var cs = h("select", { class: "sel" }, h("optgroup", { label: "Por peso (" + nf(pesoN(), 1) + " kg)" }, d.p.regs.map(function (x) { return h("option", { value: "r:" + x.id, text: x.l }); })), h("optgroup", { label: "Esquema pronto" }, d.a.map(function (t, i) { return h("option", { value: "a:" + i, text: t.length > 110 ? t.slice(0, 108) + "…" : t }); })));
        cs.value = aMode ? "a:" + (s.ai || 0) : "r:" + (s.reg || d.p.regs[0].id);
        cs.addEventListener("change", function () { var v = cs.value.split(":"); if (v[0] === "a") { s.mode = "a"; s.ai = +v[1]; } else { s.mode = "r"; s.reg = v[1]; } refresh(); });
        row.appendChild(cs);
      } else if (!usePed && d.a && d.a.length > 1) { var se = h("select", { class: "sel" }, d.a.map(function (t, i) { return h("option", { value: i, text: t }); })); se.value = (s.ai != null ? s.ai : (d.ido != null && idadeM() != null && idadeM() >= 780 ? d.ido : 0)); se.addEventListener("change", function () { s.ai = +se.value; refresh(); }); row.appendChild(se); }
      if (usePed && d.p && d.p.regs && d.p.regs.length > 1) { var sr = h("select", { class: "sel" }, d.p.regs.map(function (x) { return h("option", { value: x.id, text: x.l }); })); sr.value = s.reg || d.p.regs[0].id; sr.addEventListener("change", function () { s.reg = sr.value; refresh(); }); row.appendChild(sr); }
      var pv = h("div"); row.appendChild(pv);
      function refresh() { r = api.hcalc(id, s); if (r.ok) { var pb = multiProtoBlock(d.n); if (pb) r = { ok: false, err: pb }; } pv.textContent = ""; cb.disabled = !r.ok; if (!r.ok) { s.on = false; cb.checked = false; pv.appendChild(h("div", { class: "err", text: "⛔ " + r.err })); } else { pv.appendChild(h("div", { class: "line", text: r.text })); if (r.det) pv.appendChild(h("div", { class: "det", text: r.det })); (r.warn || []).forEach(function (w) { pv.appendChild(h("div", { class: "warn", text: "⚠ " + w })); }); } if (d.nota) pv.appendChild(h("div", { class: "det", text: d.nota })); drawPrev(); }
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
    var cids = protos().map(function (p) { return p.n + " (" + ((p.cid || [])[0] || [""])[0] + ")"; }).join(" + ");
    var pv = pdfBar(f, function () {
      var items = api.hospItems(); if (!items.length) { st.textContent = "Prescreva ao menos um item."; st.className = "status err"; return null; }
      return window.DocPDF.build({ title: "PRESCRIÇÃO MÉDICA", data: today() + " " + nowHM(), cfg: cfg(), pac: pdfPac(), items: items, extraHeader: "Diagnóstico(s): " + cids, sections: [{ h: "Observações", text: H.obs }] });
    }, function () { return fileBase("PRESCRICAO"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Copiar texto", onclick: function () { copy(api.hospItems().map(function (x) { return x.n + ". " + x.text; }).join("\n")); } }), st);
    b.appendChild(pv);
  };

  MERR.rx = MERR_BY_ID.rx = function (b, f) {
    var R = cse().rx, ps = protos(), clsWrap = h("div", { class: "chips" }), rows = h("div"), items = h("div", { class: "rxlist" }), st = h("div", { class: "status" });
    if (!R.naoUsar) { var nu = ps.map(function (p) { return p.naoUsar; }).filter(Boolean); if (nu.length) R.naoUsar = nu.join("; "); }
    var allBox = h("label", { class: "check" }, h("input", { type: "checkbox", checked: cse().rxAll, onchange: function (e) { cse().rxAll = e.target.checked; drawCls(); } }), "Mostrar todas as classes");
    var addBtn = h("button", { class: "btn sm primary", type: "button", text: "Adicionar selecionados" });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Condutas medicamentosas", h("small", { text: "união das classes de " + ps.map(function (p) { return p.n; }).join(" + ") + (perfil() === "ped" ? " · pediátrico" : "") })), clsWrap, allBox, rows, h("div", { class: "btns" }, addBtn)));
    function clsList() {
      var base = [], seen = {};
      ps.forEach(function (p) { (p.cls || []).forEach(function (k) { if (!seen[k]) { seen[k] = 1; base.push(k); } }); });
      return cse().rxAll ? base.concat(Object.keys(D.classes).filter(function (k) { return !seen[k]; })) : base;
    }
    function drawCls() { clsWrap.textContent = ""; var ks = clsList(); ks.forEach(function (k, i) { var O = cse().rxOpen; if (O[k] == null) O[k] = i < 2; clsWrap.appendChild(h("button", { class: "chip" + (O[k] ? " on" : ""), type: "button", text: D.classes[k].n, onclick: function () { O[k] = !O[k]; drawCls(); } })); }); if (!ks.length) clsWrap.appendChild(h("span", { class: "note", text: "Sem classes cadastradas." })); drawRows(); }
    function drawRows() { rows.textContent = ""; var seen = {}; clsList().filter(function (k) { return cse().rxOpen[k]; }).forEach(function (k) { rows.appendChild(h("h3", { text: D.classes[k].n, style: "font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:8px" })); D.classes[k].d.forEach(function (id) { if (seen[id] || !D.drugs[id]) return; seen[id] = 1; rows.appendChild(rxRow(id)); }); }); }
    function mk(opts, val, on, lab) { var s = h("select", { class: "sel", "aria-label": lab }, opts.map(function (o) { return h("option", { value: o[0], text: o[1] }); })); s.value = String(val); s.addEventListener("change", function () { on(s.value); }); return s; }
    function rxRow(id) {
      var dr = D.drugs[id], sl = cse().rxSel[id] = cse().rxSel[id] || {}, pf = perfil(), row = h("div", { class: "drow" }), r = rxCalcM(id, sl);
      var cb = h("input", { type: "checkbox", checked: !!sl.on && r.ok, disabled: !r.ok, onchange: function (e) { sl.on = e.target.checked; save(); } });
      row.appendChild(h("label", { class: "dhead" }, cb, h("span", { class: "nm", text: dr.n }), dr.ctrl ? h("span", { class: "badge w", text: "controle especial" }) : null, dr.atb ? h("span", { class: "badge", text: "antimicrobiano · 2 vias" }) : null, cse().pac.gest && dr.gx ? h("span", { class: "badge b", text: "contraindicado na gestação" }) : null));
      var ctr = h("div", { class: "grid" }), re = function () { var n = rxRow(id); row.replaceWith(n); };
      var usaAd = (pf === "adulto" && !(dr.pa && dr.p && pesoN())) || (pf === "ped" && dr.p && dr.p.same);
      if (usaAd && dr.a && dr.a.length && dr.tipo !== "hidr") { ctr.appendChild(mk(dr.a.map(function (a, i) { return [i, a.ap]; }), sl.ai || 0, function (v) { sl.ai = +v; sl.pi = 0; save(); re(); }, "Apresentação")); var ap = dr.a[sl.ai || 0] || dr.a[0]; if (ap.pos && ap.pos.length > 1) ctr.appendChild(mk(ap.pos.map(function (x, i) { return [i, x.t]; }), sl.pi || 0, function (v) { sl.pi = +v; save(); re(); }, "Posologia")); }
      else if (pf === "ped" && dr.p && dr.p.reg) { var reg = dr.p.reg.find(function (x) { return x.id === sl.reg; }) || dr.p.reg[0]; if (dr.p.reg.length > 1) ctr.appendChild(mk(dr.p.reg.map(function (x) { return [x.id, x.l]; }), reg.id, function (v) { sl.reg = v; sl.form = null; sl.dias = null; save(); re(); }, "Esquema")); var fs = dr.p.f.filter(function (x) { return !reg.f || reg.f.indexOf(x.id) >= 0; }); if (fs.length > 1) ctr.appendChild(mk(fs.map(function (x) { return [x.id, x.ap]; }), (fs.find(function (x) { return x.id === sl.form; }) || r.form || fs[0]).id, function (v) { sl.form = v; save(); re(); }, "Apresentação")); if (reg.dias) ctr.appendChild(mk(reg.dias.map(function (dd) { return [dd, dd ? dd + (dd > 1 ? " dias" : " dia") : "sem duração (se necessário)"]; }), sl.dias != null ? sl.dias : reg.dias[0], function (v) { sl.dias = +v; save(); re(); }, "Duração")); }
      if (ctr.childNodes.length) row.appendChild(ctr);
      if (r.ok) { row.appendChild(h("div", { class: "line", text: r.pos })); row.appendChild(h("div", { class: "det", text: r.med + " · " + r.q + " · " + r.via + (r.det ? " · " + r.det : "") })); (r.warn || []).forEach(function (w) { row.appendChild(h("div", { class: "warn", text: "⚠ " + w })); }); }
      else row.appendChild(h("div", { class: "err", text: "⛔ " + r.err }));
      if (dr.nota) row.appendChild(h("div", { class: "det", text: dr.nota }));
      return row;
    }
    addBtn.addEventListener("click", function () {
      var nR = 0, nC = 0, dupe = 0;
      Object.keys(cse().rxSel).forEach(function (id) { var sl = cse().rxSel[id]; if (!sl.on || !D.drugs[id]) return; var dr = D.drugs[id], r = rxCalcM(id, sl); if (!r.ok) return;
        var all = R.itens.concat(cse().ctrl.itens).map(function (x) { return fold(x.med); });
        if (all.indexOf(fold(r.med)) >= 0) { dupe++; sl.on = false; return; }
        if (dr.ctrl) { cse().ctrl.itens.push({ med: r.med, qtd: r.q, pos: r.pos }); nC++; } else { R.itens.push({ med: r.med, qtd: r.q, via: r.via, pos: r.pos }); nR++; if (dr.atb) R.duasVias = true; } sl.on = false; });
      st.textContent = nR + " na receita" + (nC ? "; " + nC + " no Controle especial" : "") + (dupe ? "; " + dupe + " duplicada(s) de molécula descartada(s)" : "") + "."; st.className = "status ok"; drawItems(); drawRows(); save();
    });
    drawCls();
    function drawItems() { items.textContent = ""; if (!R.itens.length) items.appendChild(h("div", { class: "note", text: "Nenhum medicamento na receita." })); R.itens.forEach(function (it, i) {
      var g = h("div", { class: "grid" }, ["med", "qtd", "via", "pos"].map(function (k) { return h("label", { class: "f" }, h("span", { text: { med: "Medicamento", qtd: "Quantidade", via: "Via", pos: "Posologia" }[k] }), h("input", { class: "in", value: it[k] || "", oninput: function (e) { it[k] = e.target.value; save(); } })); }));
      items.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: (i + 1) + "." }), g, h("button", { class: "x", type: "button", text: "×", "aria-label": "Remover", onclick: function () { R.itens.splice(i, 1); drawItems(); save(); } }))); }); }
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Receita" }), items, h("label", { class: "check" }, h("input", { type: "checkbox", checked: R.duasVias, onchange: function (e) { R.duasVias = e.target.checked; save(); } }), "Receita em 2 vias (antimicrobiano — RDC 20/2011)"))); drawItems();
    var fld = function (k, l, rr) { return h("label", { class: "f" }, h("span", { text: l }), h("textarea", { class: "ta", rows: rr || 3, id: "rx_" + k, value: R[k] || "", oninput: function (e) { R[k] = e.target.value; save(); } })); };
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Orientações de alta", h("small", { text: "uma linha por item" })), fld("naoUsar", "Não usar", 2), fld("visto", "O que foi visto hoje", 3), fld("cuidados", "Como se cuidar", 4), fld("alarme", "Volte imediatamente se", 5), fld("retorno", "Retorno", 2)));
    var pv = pdfBar(f, function () { if (!R.itens.length && !R.cuidados) { st.textContent = "A receita está vazia."; st.className = "status err"; return null; } return window.RxPDF.build({ pac: { nome: (cse().pac.nome || "").toUpperCase(), cns: cse().pac.cns, nasc: cse().pac.nasc }, data: today(), itens: R.itens, duasVias: R.duasVias, naoUsar: R.naoUsar, visto: R.visto, cuidados: R.cuidados, alarme: R.alarme, retorno: R.retorno }, cfg()); }, function () { return fileBase("RECEITA"); }, st);
    b.appendChild(pv);
  };

  function examM(isLab) {
    return function (b, f) {
      var X = cse()[isLab ? "lab" : "comp"], ps = protos(), st = h("div", { class: "status" }), picked = h("div", { class: "rxlist" });
      if (!X.cid) { for (var i = 0; i < ps.length; i++) { if (ps[i].cid && ps[i].cid[0]) { X.cid = ps[i].cid[0][0]; X.desc = ps[i].cid[0][1]; break; } } }
      var sug = [];
      ps.forEach(function (p) { ((isLab ? p.lab : p.comp) || []).map(E.gestCode).forEach(function (x) { if (sug.indexOf(x) < 0) sug.push(x); }); });
      var pool = (isLab ? D.labPS : D.compPS).map(E.gestCode).filter(function (x, i, a) { return a.indexOf(x) === i && sug.indexOf(x) < 0; });
      function itemCb(c) { return h("label", { class: "exitem" }, h("input", { type: "checkbox", checked: !!X.sel[c], onchange: function (e) { if (e.target.checked) X.sel[c] = X.sel[c] || { just: "" }; else delete X.sel[c]; drawPicked(); save(); } }), h("span", { text: examName(c) }), h("small", { text: c })); }
      if (sug.length) b.appendChild(h("div", { class: "box" }, h("h3", null, "Sugeridos (união das condições)", h("small", { text: cse().pac.gest ? "códigos de gestante" : ps.map(function (p) { return p.n; }).join(" + ") })), h("div", { class: "exgrid" }, sug.map(itemCb)),
        h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Marcar todos os sugeridos", onclick: function () { sug.forEach(function (c) { X.sel[c] = X.sel[c] || { just: "" }; }); save(); drawPicked(); } }))));
      b.appendChild(h("details", { class: "box grp" }, h("summary", { text: (isLab ? "Exames laboratoriais de pronto-socorro" : "Imagem, ECG, endoscopia e consulta") + " (" + pool.length + ")" }), h("div", { class: "exgrid" }, pool.map(itemCb))));
      function drawPicked() { picked.textContent = ""; var ks = Object.keys(X.sel); if (!ks.length) picked.appendChild(h("div", { class: "note", text: "Nenhum exame marcado." }));
        ks.forEach(function (c, i) { picked.appendChild(h("div", { class: "rxitem" }, h("span", { class: "n", text: (i + 1) + "." }), h("div", { class: "f" }, h("b", { text: examName(c) + " · " + c }), h("input", { class: "in", placeholder: "Justificativa curta (opcional)", value: X.sel[c].just || "", oninput: function (e) { X.sel[c].just = e.target.value; save(); } })), h("button", { class: "x", type: "button", text: "×", onclick: function () { delete X.sel[c]; drawPicked(); save(); } }))); }); }
      b.appendChild(h("div", { class: "box" }, h("h3", { text: "Pedido" }), picked)); drawPicked();
      var allCids = [];
      ps.forEach(function (p) { (p.cid || []).forEach(function (c) { if (!allCids.some(function (x) { return x.value === c[0]; })) allCids.push({ value: c[0], text: c[0] + " " + c[1] }); }); });
      var obs = h("textarea", { class: "ta", rows: 4, value: X.obs, oninput: function (e) { X.obs = e.target.value; save(); } });
      b.appendChild(h("div", { class: "box" }, h("h3", { text: "Diagnóstico e justificativa clínica" }), h("div", { class: "grid" },
        h("label", { class: "f" }, h("span", { text: "CID principal" }), h("input", { class: "in mono", value: X.cid, list: "psxcids", oninput: function (e) { X.cid = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); var m = allCids.find(function (c) { return c.value === X.cid; }); if (m) { X.desc = m.text.split(" ").slice(1).join(" "); } save(); } }), h("datalist", { id: "psxcids" }, allCids.map(function (c) { return h("option", { value: c.value, text: c.text }); }))),
        h("label", { class: "f" }, h("span", { text: "Diagnóstico (descrição)" }), h("input", { class: "in", value: X.desc, oninput: function (e) { X.desc = e.target.value; save(); } }))),
        h("label", { class: "f" }, h("span", { text: "Observações para o regulador" }), obs),
        !isLab ? h("label", { class: "check" }, h("input", { type: "checkbox", checked: X.separar !== false, onchange: function (e) { X.separar = e.target.checked; save(); } }), "Uma folha APAC por exame (executantes diferentes)") : null));
      var miss = ["nome", "cns", "nasc", "sexo", "mae", "end", "mun"].filter(function (k) { return !cse().pac[k]; });
      if (miss.length) b.insertBefore(h("div", { class: "alertbox" }, "Faltam dados do paciente para a APAC: " + miss.join(", ") + ". "), b.firstChild);
      var pv = pdfBar(f, function () {
        var codes = Object.keys(X.sel); if (!codes.length) { st.textContent = "Marque ao menos um exame."; st.className = "status err"; return null; } if (!X.cid) { st.textContent = "Informe o CID principal."; st.className = "status err"; return null; }
        var P = cse().pac, r = { kind: isLab ? "lab" : "img", pac: { nome: (P.nome || "").toUpperCase(), prontuario: "", cns: String(P.cns || "").replace(/\D/g, ""), cpf: String(P.cpf || "").replace(/\D/g, ""), nasc: P.nasc, sexo: P.sexo, raca: P.raca || "", mae: (P.mae || "").toUpperCase(), tel: P.tel, resp: "", telResp: "", end: (P.end || "").toUpperCase(), mun: (P.mun || "").toUpperCase(), ibge: P.ibge, uf: P.uf, cep: P.cep },
          procs: codes.map(function (c) { return { codigo: c, nome: examName(c), qtd: 1, just: X.sel[c].just || "", ok: !!BYC.get(c) }; }), diag: { desc: X.desc, cidP: X.cid, cidS: "", cidC: "" }, obs: X.obs,
          sol: { nome: cfg().sol.nome, data: today(), docTipo: "CNS", docNum: "", conselho: cfg().sol.conselho, carimbo: true }, exec: Object.assign({}, isLab ? (lsGet("psx.cfg") || {}).execLab || {} : (lsGet("psx.cfg") || {}).execImg || {}), separar: !isLab && X.separar !== false, perProcObs: !isLab, estab: Object.assign({}, cfg().estab) };
        if (!r.pac.cns && r.pac.cpf) r.obs = "CPF do paciente: " + r.pac.cpf + ". " + (r.obs || "");
        if (r.perProcObs && !r.separar) { var js = r.procs.filter(function (x) { return x.just; }).map(function (x) { return x.nome + ": " + x.just; }).join(" "); if (js) r.obs = (r.obs ? r.obs + " " : "") + js; r.perProcObs = false; }
        return window.ApacPDF.build(r);
      }, function () { return fileBase(isLab ? "APAC_LAB" : "APAC"); }, st);
      b.appendChild(pv);
    };
  }
  MERR.lab = MERR_BY_ID.lab = examM(true);
  MERR.comp = MERR_BY_ID.comp = examM(false);

  MERR.anam = MERR_BY_ID.anam = function (b, f) {
    var A = cse().anam, out, ps = protos();
    function upd() { if (!A.edited) { A.final = anamTextM(); if (out) out.value = A.final; } save(); }
    b.appendChild(h("div", { class: "box" }, h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "Queixa principal" }), h("input", { class: "in", id: "aQp", value: A.qp, placeholder: ps.map(function (p) { return p.n; }).join(" + "), oninput: function (e) { A.qp = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Tempo de evolução" }), h("input", { class: "in", id: "aTempo", value: A.tempo, placeholder: "ex.: 2 dias", oninput: function (e) { A.tempo = e.target.value; upd(); } }))),
      h("p", { class: "note", text: "Toque uma vez para PRESENTE (verde), outra para AUSENTE (riscado) e mais uma para limpar." })));
    unionGroups(function (p) { return CL.ANAM_MAP[p.id]; }, function (c) { return CL.ANAM_MAP_CAT[c]; }).forEach(function (gk) {
      var g = CL.ANAM[gk]; if (!g) return;
      var chips = h("div", { class: "chips" }, g.items.map(function (it) {
        var key = gk + "|" + it, stt = A.chips[key] || 0;
        var c = h("button", { class: "chip" + (stt === 1 ? " pos" : stt === 2 ? " neg" : ""), type: "button", text: it, "aria-pressed": stt ? "true" : "false" });
        c.addEventListener("click", function () { var s = ((A.chips[key] || 0) + 1) % 3; if (s) A.chips[key] = s; else delete A.chips[key]; c.className = "chip" + (s === 1 ? " pos" : s === 2 ? " neg" : ""); upd(); });
        return c;
      }));
      var fields = g.fields.length ? h("div", { class: "grid" }, g.fields.map(function (fd) { var k = gk + "|" + fd.k; return h("label", { class: "f" }, h("span", { text: fd.l }), h("input", { class: "in", value: A.fields[k] || "", oninput: function (e) { A.fields[k] = e.target.value; upd(); } })); })) : null;
      b.appendChild(h("div", { class: "box" }, h("h3", { text: g.l }), chips, fields));
    });
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Antecedentes, medicações e alergias" }),
      h("div", { class: "chips" }, CL.ANTEC.map(function (a) { var c = h("button", { class: "chip" + (A.ant[a] ? " pos" : ""), type: "button", text: a }); c.addEventListener("click", function () { A.ant[a] = !A.ant[a]; c.className = "chip" + (A.ant[a] ? " pos" : ""); if (a === "Gestante") { cse().pac.gest = !!A.ant[a]; sweepCondExtras(); } upd(); }); return c; })),
      h("div", { class: "grid" }, h("label", { class: "f" }, h("span", { text: "Medicações em uso" }), h("input", { class: "in", value: A.meds, oninput: function (e) { A.meds = e.target.value; upd(); } })),
        h("label", { class: "f" }, h("span", { text: "Alergias" }), h("input", { class: "in", value: cse().pac.alergias, placeholder: "ex.: dipirona, penicilina", oninput: function (e) { cse().pac.alergias = e.target.value; sweepCondExtras(); upd(); } }))),
      h("label", { class: "f" }, h("span", { text: "Relato livre (HDA)" }), h("textarea", { class: "ta", rows: 3, value: A.notas, oninput: function (e) { A.notas = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", id: "anamFinal", rows: 8, value: A.final || anamTextM(), oninput: function (e) { A.final = e.target.value; A.edited = true; save(); } });
    var st = h("div", { class: "status" });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto da anamnese", h("small", { text: "edite à vontade; “Regenerar” refaz" })), out, st));
    if (!A.final) { A.final = out.value; }
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { A.edited = false; upd(); } }),
      h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }),
      h("button", { class: "btn primary", type: "button", text: "Redigir com Assistente", onclick: async function (e) {
        var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente redigindo…"; st.className = "status";
        try { var txt = await ask("Redija a ANAMNESE de pronto-socorro (QP, HDA em texto corrido, antecedentes, medicações, alergias) para prontuário, em português clínico, objetiva. Use SOMENTE os dados abaixo; não invente sintomas. Sem markdown.\n\nCONDIÇÕES EM AVALIAÇÃO: " + hdxList() + "\nPACIENTE: " + ptLine() + "\n\nDADOS:\n" + anamTextM(), function (t) { out.value = t; });
          A.final = txt; A.edited = true; out.value = txt; st.textContent = "Pronto. Revise antes de usar."; st.className = "status ok"; save(); }
        catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; }
      } }), st);
  };

  MERR.ef = MERR_BY_ID.ef = function (b, f) {
    var F = cse().ef, out;
    function upd() { if (!F.edited) { F.final = efTextM(); if (out) out.value = F.final; } save(); }
    if (!F.sv.peso && cse().pac.peso) F.sv.peso = cse().pac.peso;
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Sinais vitais" }), h("div", { class: "grid" }, CL.SV.map(function (x) {
      return h("label", { class: "f" }, h("span", { text: x[1] + " (" + x[2] + ")" }), h("input", { class: "in mono", value: F.sv[x[0]] || "", oninput: function (e) { F.sv[x[0]] = e.target.value; if (x[0] === "peso") { cse().pac.peso = e.target.value; sweepCondExtras(); } upd(); } }));
    }))));
    unionGroups(function (p) { return CL.EF_MAP[p.id]; }, function (c) { return CL.EF_MAP_CAT[c]; }).forEach(function (sk) {
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
    out = h("textarea", { class: "ta", rows: 9, value: F.final || efTextM(), oninput: function (e) { F.final = e.target.value; F.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto do exame físico"), out));
    if (!F.final) F.final = out.value;
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { F.edited = false; upd(); } }), h("button", { class: "btn primary", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }));
  };

  MERR.enc = MERR_BY_ID.enc = function (b, f) {
    var N = cse().enc, st = h("div", { class: "status" }), out;
    function upd() { if (!N.edited) { N.final = encAuto(); if (out) out.value = N.final; } save(); }
    function encAuto() {
      var P = cse().pac;
      return ["Ao serviço de " + (N.esp || "—") + ".", "", "Encaminho " + (P.nome || "o(a) paciente") + (idadeTxt() ? ", " + idadeTxt() : "") + (sexoTxt() ? ", sexo " + sexoTxt() : "") + ", atendido(a) no pronto-socorro do " + cfg().estab.nome + " em " + today() + ", com hipóteses diagnósticas de " + hdxList() + ".",
        "", "Resumo clínico: " + shortTxt(cse().anam.final || anamTextM(), 600), "Exame físico: " + shortTxt(cse().ef.final || efTextM(), 450), examsTxtM() ? "Exames: " + examsTxtM() + "." : "", condutaTxtM() ? "Conduta: " + condutaTxtM() + "." : "",
        "", "Motivo do encaminhamento: " + (N.motivo || "—"), N.pergunta ? "Solicito: " + N.pergunta : "", "Prioridade: " + N.prio + ".", "", "Atenciosamente,"].filter(function (x, i, a) { return x !== "" || a[i - 1] !== ""; }).join("\n");
    }
    b.appendChild(h("div", { class: "box" }, h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "Especialidade / serviço" }), h("input", { class: "in", value: N.esp, oninput: function (e) { N.esp = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Prioridade" }), (function () { var s = h("select", { class: "sel", onchange: function (e) { N.prio = e.target.value; upd(); } }, ["Eletiva", "Prioritária", "Urgente (vaga em até 7 dias)"].map(function (x) { return h("option", { value: x, text: x }); })); s.value = N.prio; return s; })())),
      h("label", { class: "f" }, h("span", { text: "Motivo do encaminhamento" }), h("input", { class: "in", value: N.motivo, oninput: function (e) { N.motivo = e.target.value; upd(); } })),
      h("label", { class: "f" }, h("span", { text: "Pergunta ao especialista" }), h("input", { class: "in", value: N.pergunta, oninput: function (e) { N.pergunta = e.target.value; upd(); } }))));
    out = h("textarea", { class: "ta", rows: 14, value: N.final || encAuto(), oninput: function (e) { N.final = e.target.value; N.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Texto do encaminhamento"), out));
    if (!N.final) N.final = out.value;
    var pv = pdfBar(f, function () { return window.DocPDF.build({ title: "ENCAMINHAMENTO", data: today(), cfg: cfg(), pac: pdfPac(), sections: [{ h: "Referência — " + N.esp + " · prioridade " + N.prio, text: out.value }] }); }, function () { return fileBase("ENCAMINHAMENTO"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { N.edited = false; upd(); } }), h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }), st);
    b.appendChild(pv);
  };

  MERR.transf = MERR_BY_ID.transf = function (b, f) {
    var T = cse().transf, st = h("div", { class: "status" }), out;
    function upd() { if (!T.edited) { T.final = transfAuto(); if (out) out.value = T.final; } save(); }
    function transfAuto() {
      var T2 = cse().transf, P = cse().pac, recursos = [];
      protos().forEach(function (p) { recsFor(p).forEach(function (r) { var x = REC.find(function (y) { return y[0] === r; }); if (x) recursos.push(x[1]); }); });
      var motivo = T2.recurso || (recursos.length ? "Necessidade de " + recursos.join(", ") + " não disponível no serviço." : "—");
      return ["Origem: " + cfg().estab.nome + " (CNES " + cfg().estab.cnes + "), " + cfg().estab.cidade + ".", "Destino: " + (T2.destino || "conforme regulação") + ".", "Regulação: " + (T2.regulacao ? "nº " + T2.regulacao : "—") + (T2.regulador ? "; médico regulador " + T2.regulador : "") + (T2.hora ? "; contato às " + T2.hora : "") + ".",
        "", "Paciente: " + (P.nome || "—") + (idadeTxt() ? ", " + idadeTxt() : "") + (sexoTxt() ? ", sexo " + sexoTxt() : "") + (pesoN() ? ", " + nf(pesoN(), 1) + " kg" : "") + (P.gest ? ", gestante" : "") + ". Alergias: " + (P.alergias || "nega") + ".",
        "Diagnóstico(s): " + hdxList() + ".", "Motivo / recurso necessário: " + motivo,
        "", "História: " + shortTxt(cse().anam.final || anamTextM(), 700), "Exame físico: " + shortTxt(cse().ef.final || efTextM(), 600), Object.keys(cse().scores).length ? "Escores: " + Object.keys(cse().scores).map(function (k) { return cse().scores[k].split(". Conduta")[0]; }).join("; ") + "." : "",
        examsTxtM() ? "Exames realizados/solicitados: " + examsTxtM() + "." : "", "Tratamento instituído: " + (api.hospItems().map(function (x) { return x.text; }).join("; ") || "—") + ".",
        "Dispositivos: " + (T2.disp || "—") + ". Condição na saída: " + T2.cond + ".", "Transporte: " + T2.transporte + ". Acompanhante: " + (T2.acomp || "—") + "."].filter(function (x, i, a) { return x !== "" || a[i - 1] !== ""; }).join("\n");
    }
    if (!T.hora) T.hora = nowHM();
    var inp = function (k, l, ph) { return h("label", { class: "f" }, h("span", { text: l }), h("input", { class: "in", value: T[k], placeholder: ph || "", oninput: function (e) { T[k] = e.target.value; upd(); } })); };
    var selF = function (k, l, opts) { var s = h("select", { class: "sel", onchange: function (e) { T[k] = e.target.value; upd(); } }, opts.map(function (x) { return h("option", { value: x, text: x }); })); s.value = T[k]; return h("label", { class: "f" }, h("span", { text: l }), s); };
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Regulação e transporte" }), h("div", { class: "grid" }, inp("destino", "Hospital / serviço de destino", "ex.: HUGO, HGG, HC-UFG"), inp("regulacao", "Nº da solicitação (NIR/regulação)"), inp("regulador", "Médico regulador"), inp("hora", "Horário do contato"),
      selF("transporte", "Transporte", ["USA (suporte avançado)", "USB (suporte básico)", "Ambulância simples com técnico", "Ambulância com médico do HMC", "Meios próprios"]), selF("cond", "Condição na saída", ["Estável", "Estável com suporte", "Instável — transporte com médico"]), inp("acomp", "Acompanhante"), inp("disp", "Dispositivos (AVP, SVD, O₂, IOT…)")),
      h("label", { class: "f" }, h("span", { text: "Motivo / recurso necessário" }), h("input", { class: "in", value: T.recurso, oninput: function (e) { T.recurso = e.target.value; upd(); } }))));
    var recs = []; protos().forEach(function (p) { recsFor(p).forEach(function (r) { var x = REC.find(function (y) { return y[0] === r; }); if (x && recs.indexOf(x[1]) < 0) recs.push(x[1]); }); });
    if (recs.length) b.appendChild(h("div", { class: "note", text: "Recursos típicos destas condições: " + recs.join(", ") + " — justifique a necessidade no relatório para a regulação." }));
    out = h("textarea", { class: "ta", rows: 16, value: T.final || transfAuto(), oninput: function (e) { T.final = e.target.value; T.edited = true; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Relatório de transferência"), out));
    if (!T.final) T.final = out.value;
    var pv = pdfBar(f, function () { return window.DocPDF.build({ title: "RELATÓRIO DE TRANSFERÊNCIA", data: today() + " " + nowHM(), cfg: cfg(), pac: pdfPac(), sections: [{ h: "Transferência inter-hospitalar", text: out.value }] }); }, function () { return fileBase("TRANSFERENCIA"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Regenerar", onclick: function () { T.edited = false; upd(); } }), h("button", { class: "btn", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }), st);
    b.appendChild(pv);
  };

  MERR.evol = MERR_BY_ID.evol = function (b, f) {
    var V = cse().evol, st = h("div", { class: "status" });
    function evolAutoM() {
      var L = ["Atendimento no PS — " + today() + " " + nowHM(), "Paciente: " + ptLine() + (cse().pac.alergias ? " · Alergias: " + cse().pac.alergias : ""), "", cse().anam.final || anamTextM(), "", "Exame físico:", cse().ef.final || efTextM()];
      var sc = Object.keys(cse().scores); if (sc.length) L.push("", "Escores: " + sc.map(function (k) { return cse().scores[k]; }).join(" | "));
      L.push("", "Hipóteses diagnósticas: " + hdxList());
      var hi = api.hospItems(); if (hi.length) L.push("", "Prescrição no PS:", hi.map(function (x) { return x.n + ". " + x.text; }).join("\n"));
      if (examsTxtM()) L.push("", "Exames: " + examsTxtM());
      if (cse().rx.itens.length) L.push("", "Prescrição ambulatorial:", cse().rx.itens.map(function (x) { return "- " + x.med + " — " + x.pos; }).join("\n"));
      if (cse().enc.final) L.push("", "Encaminhado a " + cse().enc.esp + " (" + cse().enc.prio + ").");
      if (cse().transf.final) L.push("", "Transferência: " + (cse().transf.destino || "via regulação") + " — " + cse().transf.recurso);
      return L.join("\n");
    }
    var out = h("textarea", { class: "ta", rows: 18, value: V.final || evolAutoM(), oninput: function (e) { V.final = e.target.value; save(); } });
    b.append(h("div", { class: "box" }, h("h3", null, "Evolução do atendimento", h("small", { text: "com todas as hipóteses mescladas" })), out, h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Remontar", onclick: function () { V.final = evolAutoM(); out.value = V.final; save(); } }), h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(out.value, out); } }))));
  };

  /* interceptação: cliques nos cards quando há mesclagem + patch de api.openMod */
  var VARIANT = {};
  [["prescricao hospitalar", "hosp"], ["prescricao ambulatorial", "rx"], ["receita de alta", "rx"], ["exames laboratoriais", "lab"], ["outros exames complementares", "comp"], ["imagem e outros exames", "comp"], ["anamnese dirigida", "anam"], ["exame fisico dirigido", "ef"], ["encaminhamento ambulatorial", "enc"], ["transferencia inter-hospitalar", "transf"], ["evolucao e resumo de alta", "evol"]].forEach(function (p) { VARIANT[p[0]] = p[1]; });
  var TITLE = { hosp: "Prescrição hospitalar", rx: "Prescrição ambulatorial", lab: "Exames laboratoriais", comp: "Outros exames complementares", anam: "Anamnese dirigida", ef: "Exame físico dirigido", enc: "Encaminhamento ambulatorial", transf: "Transferência inter-hospitalar", evol: "Evolução e resumo de alta" };
  document.addEventListener("click", function (e) {
    if (!merged().length) return;
    var t = e.target; if (!t || !t.closest) return;
    var card = t.closest(".mod"); if (!card) return;
    var bb = card.querySelector("b"); if (!bb) return;
    var v = VARIANT[fold(bb.textContent)];
    if (!v) return;
    e.stopPropagation(); e.preventDefault();
    var s = openShell(TITLE[v], headSub());
    MERR[v](s.b, s.f);
  }, true);
  var origOpenMod = api.openMod;
  api.openMod = function (id) {
    if (merged().length && MERR_BY_ID[id]) { var s = openShell(TITLE[id], headSub()); MERR_BY_ID[id](s.b, s.f); return; }
    return origOpenMod(id);
  };
  /* reset da mesclagem quando a condição muda (vigia o h1 do painel) */
  var lastH1 = null;
  setInterval(function () {
    try {
      var h1 = document.querySelector("#app .chead h1");
      var cur = h1 ? h1.textContent : null;
      if (cur !== lastH1) { lastH1 = cur; if (cur != null) { var C = cse(); if (C.merged && C.merged.length) { C.merged = []; save(); } } sweepCondExtras(); }
      sweepCondExtras(); decorateModal(); injectPatientBox();
    } catch (e) {}
  }, 700);

  /* =====================================================
     Cards novos: ④ Internação/AIH · ⑤ Cardioversão · ⑥ ECG/RX IA
     ===================================================== */
  var MY_CARDS = [
    { id: "aih", label: "Internação / AIH", sub: "AIH, admissão e enfermaria", icon: '<path d="M4 3h16v18H4z"/><path d="M12 7v6M9 10h6M8 17h8"/>', fn: function () { openAih(); } },
    { id: "cardio", label: "Cardioversão / Desfibrilação", sub: "energia por peso e sedação", icon: '<path d="M3 12h4l2-7 4 14 2-7h6"/>', fn: function () { openCardio(); } },
    { id: "imaging", label: "ECG / RX com IA", sub: "leitura, laudo e ensinamentos", icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h3l2-3 2 6 2-3h3"/>', fn: function () { openImaging(); } }
  ];
  function sweepCards() {
    var grid = document.querySelector("#app .mods"); if (!grid) return;
    MY_CARDS.forEach(function (c) {
      if (grid.querySelector(":scope > .mod[data-psx-card=\"" + c.id + "\"]")) return;
      var b = h("button", { class: "mod", type: "button", "data-psx-card": c.id, onclick: c.fn });
      var ic = h("span", { class: "ic" }); ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + c.icon + "</svg>";
      b.append(ic, h("b", { text: c.label }), h("small", { text: c.sub }));
      grid.appendChild(b);
    });
  }

  /* ---------- ④ INTERNAÇÃO / AIH ---------- */
  var EX_ADM = [["hemograma", "lab"], ["pcr", "lab"], ["tap tp ttp inr", "lab"], ["ureia creatinina", "lab"], ["eletrólitos sódio potássio", "lab"], ["glicemia", "lab"], ["gasometria", "lab"], ["ecg eletrocardiograma", "comp"], ["raio-x tórax", "comp"]];
  function findExamCode(q) {
    var t = fold(q), toks = t.split(/\s+/);
    var pool = (D.labPS || []).concat(D.compPS || []);
    for (var i = 0; i < pool.length; i++) { var nm = fold(examName(pool[i]));
      if (toks.every(function (tk) { return nm.indexOf(tk) >= 0; })) return pool[i]; }
    return null;
  }
  function openAih() {
    var s = openShell("Internação / AIH", headSub()), b = s.b, f = s.f, st = h("div", { class: "status" });
    var C = cse(), A = C.aih = C.aih || { carater: "Urgência", tipo: "Clínica", regime: "Internação", proc: "", cid: "", obs: "", evol: "", enf: "" };
    var p = primary();
    if (!A.cid && p && p.cid && p.cid[0]) { A.cid = p.cid[0][0]; }
    /* box AIH */
    var b1 = h("div", { class: "box" }, h("h3", null, "Autorização de Internação Hospitalar (AIH)", h("small", { text: "pré-preenchida com o atendimento; campos complementares ficam por sua conta" })));
    var car = h("select", { class: "sel", onchange: function (e) { A.carater = e.target.value; save(); } }, ["Eletiva", "Urgência", "Emergência", "Acesso imediato (AIH 5)"].map(function (x) { return h("option", { value: x, text: x }); })); car.value = A.carater;
    var tip = h("select", { class: "sel", onchange: function (e) { A.tipo = e.target.value; save(); } }, ["Clínica", "Cirúrgica", "Obstétrica", "Pediátrica", "Psiquiátrica"].map(function (x) { return h("option", { value: x, text: x }); })); tip.value = A.tipo;
    var reg = h("select", { class: "sel", onchange: function (e) { A.regime = e.target.value; save(); } }, ["Internação", "Hospital-dia", "Ambulatorial"].map(function (x) { return h("option", { value: x, text: x }); })); reg.value = A.regime;
    b1.appendChild(h("div", { class: "grid" }, h("label", { class: "f" }, h("span", { text: "Caráter de atendimento" }), car), h("label", { class: "f" }, h("span", { text: "Tipo de internação" }), tip), h("label", { class: "f" }, h("span", { text: "Regime" }), reg)));
    b1.appendChild(h("div", { class: "grid" },
      h("label", { class: "f" }, h("span", { text: "CID principal" }), h("input", { class: "in mono", value: A.cid, oninput: function (e) { A.cid = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); save(); } })),
      h("label", { class: "f" }, h("span", { text: "Procedimento principal (SIGTAP) — confira na tabela do serviço" }), h("input", { class: "in", value: A.proc, placeholder: "código + descrição do procedimento da internação", oninput: function (e) { A.proc = e.target.value; save(); } }))));
    b1.appendChild(h("div", { class: "note", text: "Preenchido do atendimento: " + ["paciente: " + (cse().pac.nome || "—"), "CNS: " + (cse().pac.cns || "—"), "nasc.: " + (cse().pac.nasc || "—"), "mãe: " + (cse().pac.mae || "—"), "município: " + (cse().pac.mun || "—") + "/" + (cse().pac.uf || "—"), "CNES: " + (cfg().estab.cnes || "—"), "médico: " + cfg().sol.nome + " (" + cfg().sol.conselho + ")", "data/hora: " + today() + " " + nowHM(), "hipótese(s): " + hdxList()].join(" · ") + (cse().pac.gest && igInfo() ? " · " + igTxt(igInfo()) : "") }));
    var fi = h("input", { type: "file", accept: ".pdf,image/*,.txt", style: "position:absolute;width:1px;height:1px;opacity:0", id: "psxAihFile" });
    fi.addEventListener("change", async function () {
      var fl = fi.files[0]; if (!fl) return;
      st.textContent = "Lendo o modelo…"; st.className = "status";
      try {
        var c2 = /^image\//.test(fl.type) ? { text: "", images: [fl] } : await pdfToContent(fl);
        var imgs = c2.images || [], opts = { modelTier: "default", cache: false };
        if (imgs.length) { var lim = await sample.limits().catch(function () { return null; }); if (lim && lim.images) opts.images = imgs.slice(0, lim.images.maxCount); }
        var j = await askJSON("Extraia de um MODELO de AIH (Autorização de Internação Hospitalar) do SUS os campos a preencher. Use somente o modelo e os dados abaixo; ausente = \"\". Responda SOMENTE JSON: {\"carater\":\"\",\"tipo_internacao\":\"\",\"regime\":\"\",\"procedimento_sigtap\":\"\",\"cid_principal\":\"\",\"cid_secundario\":\"\",\"observacoes\":\"\"}\nCARÁTER aceitos: Eletiva | Urgência | Emergência | Acesso imediato (AIH 5)\nTIPO aceitos: Clínica | Cirúrgica | Obstétrica | Pediátrica | Psiquiátrica\nREGIME aceitos: Internação | Hospital-dia | Ambulatorial\n\nATENDIMENTO ATUAL (para preencher): " + hdxList() + " · caráter atual: " + A.carater + " · CID atual: " + A.cid + "\n\nMODELO (texto):\n" + (c2.text || "").slice(0, 12000), opts);
        if (j.carater && /Eletiva|Urg|Emerg|imediato/i.test(j.carater)) A.carater = j.carater;
        if (j.tipo_internacao && /Cl[ni]|Cir|Obs|Ped|Psi/i.test(j.tipo_internacao)) A.tipo = j.tipo_internacao;
        if (j.regime && /Intern|Hospital-dia|Ambulatorial/i.test(j.regime)) A.regime = j.regime;
        if (j.procedimento_sigtap) A.proc = String(j.procedimento_sigtap); if (j.cid_principal && /^[A-Z]\d/i.test(j.cid_principal)) A.cid = j.cid_principal;
        if (j.observacoes) A.obs = String(j.observacoes);
        car.value = A.carater; tip.value = A.tipo; reg.value = A.regime;
        b1.querySelectorAll("input.in")[0].value = A.cid; b1.querySelectorAll("input.in")[1].value = A.proc;
        st.textContent = "Modelo lido pela IA — revise cada campo antes de emitir."; st.className = "status ok"; save();
      } catch (er) { st.textContent = aiErr(er); st.className = "status err"; }
    });
    b1.appendChild(h("div", { class: "btns" }, h("label", { class: "btn", for: "psxAihFile", text: "Anexar modelo de AIH (lido por IA)" }), fi));
    b.appendChild(b1);
    /* evolução de admissão */
    function admAuto() {
      var hi = api.hospItems();
      return ["EVOLUÇÃO DE ADMISSÃO — " + today() + " " + nowHM(), "Paciente: " + ptLine() + (cse().pac.alergias ? " · Alergias: " + cse().pac.alergias : ""), "",
        "Hipótese(s) diagnóstica(s): " + hdxList(), "", "História: " + shortTxt(cse().anam.final || anamTextM(), 900), "", "Exame físico: " + shortTxt(cse().ef.final || efTextM(), 700),
        Object.keys(cse().scores).length ? "Escores: " + Object.keys(cse().scores).map(function (k) { return cse().scores[k]; }).join(" | ") : "",
        "", "Conduta de admissão: internação na " + (A.tipo || "—") + " (" + (A.carater || "—") + "); " + (hi.map(function (x) { return x.text; }).join("; ") || "prescrição a definir") + ".",
        examsTxtM() ? "Exames de admissão: " + examsTxtM() + "." : "", "", "Médico responsável: " + cfg().sol.nome + " (" + cfg().sol.conselho + ")"].filter(Boolean).join("\n");
    }
    if (!A.evol) A.evol = admAuto();
    var taEvol = h("textarea", { class: "ta", rows: 10, value: A.evol, oninput: function (e) { A.evol = e.target.value; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Evolução de admissão", h("small", { text: "passagem de bastão para a enfermaria" })), taEvol,
      h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Remontar", onclick: function () { A.evol = admAuto(); taEvol.value = A.evol; save(); } }), h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(A.evol, taEvol); } }),
        h("button", { class: "btn sm primary", type: "button", text: "Redigir com Assistente", onclick: async function (e) { var btn = e.currentTarget; btn.disabled = true; st.textContent = "Assistente redigindo…"; st.className = "status";
          try { var t = await ask("Redija a EVOLUÇÃO DE ADMISSÃO hospitalar (prontuário, S/O/A/P) a partir dos dados abaixo; só use o que está lá; sem markdown.\n\n" + admAuto() + "\n\n" + api.caseContext(), function (tx) { taEvol.value = tx; }); A.evol = t; taEvol.value = t; st.textContent = "Pronto. Revise."; st.className = "status ok"; save(); }
          catch (er) { st.textContent = aiErr(er); st.className = "status err"; } finally { btn.disabled = false; } } }))));
    /* prescrição de enfermaria */
    function enfAuto() {
      var hi = api.hospItems();
      return ["PRESCRIÇÃO DA ENFERMARIA — revisar a cada 24 h", "Leito/setor: " + (cse().pac.leito || "—") + " · " + today() + " " + nowHM(), "",
        "Dieta: " + (cse().hosp.dieta || "conforme evolução") + (cse().hosp.dietaTxt ? " — " + cse().hosp.dietaTxt : ""), "",
        "Medicamentos e fluids:", hi.map(function (x) { return "• " + x.text; }).join("\n") || "• (sem itens)",
        "", "Cuidados de enfermagem: checar sinais vitais conforme prescrição; registrar diurese e balanço hídrico se pautado; pele e decúbito; seguridadade do leito.",
        "", "Observações: " + (cse().hosp.obs || "—")].join("\n");
    }
    if (!A.enf) A.enf = enfAuto();
    var taEnf = h("textarea", { class: "ta", rows: 10, value: A.enf, oninput: function (e) { A.enf = e.target.value; save(); } });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Prescrição de enfermaria", h("small", { text: "vem da prescrição do PS + dieta; edite o que é do turno" })), taEnf,
      h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Remontar", onclick: function () { A.enf = enfAuto(); taEnf.value = A.enf; save(); } }), h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(A.enf, taEnf); } }))));
    /* exames de admissão */
    var exBox = h("div", { class: "box" }, h("h3", null, "Exames de admissão", h("small", { text: "marca no pedido APAC do atendimento" })));
    var exGrid = h("div", { class: "exgrid" });
    EX_ADM.forEach(function (x) {
      var code = findExamCode(x[0]);
      exGrid.appendChild(h("label", { class: "exitem" }, h("input", { type: "checkbox", disabled: !code, checked: !!(code && (cse().lab.sel[code] || cse().comp.sel[code])), onchange: function (e) {
        if (!code) return; (x[1] === "lab" ? cse().lab : cse().comp).sel[code] = { just: "Exame de admissão — " + hdxList() }; save();
        st.textContent = "Marcado: " + examName(code) + " (vai para o APAC do atendimento)."; st.className = "status ok";
      } }), h("span", { text: x[0].split(" ")[0].replace(/^\w/, function (m2) { return m2.toUpperCase(); }) }), h("small", { text: code ? examName(code) : "não encontrado no SIGTAP" })));
    });
    if (cse().pac.sexo === "F") { var bhcg = findExamCode("beta hcg"); if (bhcg) exGrid.appendChild(h("label", { class: "exitem" }, h("input", { type: "checkbox", checked: !!cse().lab.sel[bhcg], onchange: function (e) { if (e.target.checked) cse().lab.sel[bhcg] = { just: "Rastrear gestação antes de medicações e imagem" }; else delete cse().lab.sel[bhcg]; save(); } }), h("span", { text: "β-hCG" }), h("small", { text: "gestante ou sexo feminino" }))); }
    exBox.appendChild(exGrid); b.appendChild(exBox);
    /* PDFs */
    var pv = pdfBar(f, function () {
      return window.DocPDF.build({ title: "INTERNAÇÃO HOSPITALAR — AIH", data: today() + " " + nowHM(), cfg: cfg(), pac: pdfPac(),
        extraHeader: "Caráter: " + A.carater + " · Tipo: " + A.tipo + " · Regime: " + A.regime,
        sections: [{ h: "Identificação", text: "CNES: " + (cfg().estab.cnes || "—") + " · Médico: " + cfg().sol.nome + " (" + cfg().sol.conselho + ")\nCID principal: " + (A.cid || "—") + (A.proc ? "\nProcedimento: " + A.proc : "") },
          { h: "Hipótese(s) diagnóstica(s)", text: hdxList() },
          { h: "Evolução de admissão", text: A.evol },
          { h: "Prescrição da enfermaria (resumo)", text: shortTxt(A.enf, 1200) },
          { h: "Exames de admissão", text: examsTxtM() || "—" },
          { h: "Observações", text: A.obs || "—" }] });
    }, function () { return fileBase("AIH"); }, st);
    f.append(h("button", { class: "btn", type: "button", text: "Copiar evolução", onclick: function () { copy(A.evol); } }), st);
    b.appendChild(pv);
  }

  /* ---------- ⑤ CARDIOVERSÃO / DESFIBRILAÇÃO ---------- */
  function openCardio() {
    var s = openShell("Cardioversão / Desfibrilação", headSub()), b = s.b, f = s.f, st = h("div", { class: "status" });
    var ped = perfil() === "ped", w = pesoN();
    if (!w) b.appendChild(h("div", { class: "alertbox" }, "Sem peso: doses por kg e energia pediátrica precisam dele. ", h("button", { class: "btn sm", type: "button", text: "Informar", onclick: function () { dlg.close(); document.getElementById("ptChip").click(); } })));
    var rit = h("select", { class: "sel" }, [["FA instável (descompensada)", "FA com resposta ventricular rápida instável"], ["Flutter", "Flutter atrial"], ["TSV", "TSV refratária"], ["TVcp", "TV com pulso e instabilidade"], ["VF_pVT", "FV / TV sem pulso (PCR)"]].map(function (x) { return h("option", { value: x[0], text: x[1] }); }));
    var out = h("div");
    function calc() {
      out.textContent = "";
      var k = rit.value, sinc = k !== "VF_pVT";
      var E1, E2, rot;
      if (ped && w) {
        if (k === "VF_pVT") { E1 = Math.min(Math.round(2 * w), Math.round(10 * w)); E2 = Math.min(Math.round(4 * w), Math.round(10 * w)); rot = "Desfibrilação pediátrica: 1º choque " + E1 + " J (2 J/kg), 2º choque " + E2 + " J (4 J/kg); máx. 10 J/kg ou dose adulta."; }
        else { E1 = Math.max(5, Math.round(0.5 * w)); E2 = Math.max(10, Math.round(2 * w)); rot = "Cardioversão sincronizada pediátrica: iniciar " + E1 + " J (0,5–1 J/kg); se falhar, " + E2 + " J (2 J/kg)."; }
      } else if (k === "VF_pVT") { E1 = 200; E2 = 200; rot = "Desfibrilação adulto bifásico: 1º e seguintes 200 J (120–200 J conforme aparelho; se desconhecido, use o máximo do cardioversor). NÃO sincronizar."; }
      else if (k === "FA instável (descompensada)") { E1 = 150; E2 = 200; rot = "FA instável: sincronizado bifásico 120–200 J — sugestão inicial 150 J; aumentar para 200 J se falhar."; }
      else if (k === "Flutter" || k === "TSV") { E1 = 100; E2 = 150; rot = "Flutter/TSV: sincronizado 50–100 J — sugestão inicial 100 J; se falhar, 150 J e depois 200 J."; }
      else { E1 = 100; E2 = 150; rot = "TV com pulso e instável: sincronizado 100 J inicial; 150 J; 200 J subsequentes."; }
      out.appendChild(h("div", { class: "line", style: "font-size:15px", text: (sinc ? "SINCRONIZADO — " : "DESFIBRILAÇÃO — ") + rot }));
      /* sedação p/ cardioversão com pulso */
      if (sinc) {
        if (ped && w) {
          var mz = Math.min(Math.round(0.05 * w * 10) / 10, 2), mzMax = Math.min(Math.round(0.1 * w * 10) / 10, 5);
          var ft = Math.round(1 * w), ftMax = Math.round(2 * w);
          var kt = Math.round(1 * w * 10) / 10, ktMax = Math.round(2 * w * 10) / 10;
          out.appendChild(h("div", { class: "box", style: "margin-top:8px" }, h("h3", { text: "Sedação/analgesia (peso " + nf(w, 1) + " kg)" }),
            h("div", { class: "line", text: "Midazolam " + nf(mz, 1) + "–" + nf(mzMax, 1) + " mg EV (0,05–0,1 mg/kg; máx. 5 mg)" }),
            h("div", { class: "line", text: "Fentanil " + ft + "–" + ftMax + " mcg EV (1–2 mcg/kg) — se PA ok" }),
            h("div", { class: "line", text: "Alternativa: ketamina " + nf(kt, 1) + "–" + nf(ktMax, 1) + " mg EV (1–2 mg/kg) se hipotenso" })));
        } else {
          out.appendChild(h("div", { class: "box", style: "margin-top:8px" }, h("h3", { text: "Sedação/analgesia (adulto)" }),
            h("div", { class: "line", text: "Midazolam 2–5 mg EV lento (ou 0,05–0,1 mg/kg)" }),
            h("div", { class: "line", text: "Fentanil 50–100 mcg EV se PA ok (evitar propofol em hipotenso)" }),
            h("div", { class: "line", text: "Alternativa: ketamina 1–2 mg/kg EV se hipotenso" })));
        }
      } else {
        var amio = ped && w ? Math.min(Math.round(5 * w), 300) : 300;
        var epi = ped && w ? Math.min(Math.round(0.01 * w * 100) / 100, 1) : 1;
        out.appendChild(h("div", { class: "box", style: "margin-top:8px" }, h("h3", { text: "RCP — após o 2º choque" }),
          h("div", { class: "line", text: "Amiodarona " + amio + " mg EV bolus" + (ped ? " (5 mg/kg, máx. 300 mg)" : " (300 mg; repetir 150 mg)") }),
          h("div", { class: "line", text: "Epinefrina " + nf(epi, 2) + " mg EV a cada 3–5 min" + (ped ? " (0,01 mg/kg)" : "") }),
          h("div", { class: "line", text: "Minimizar pausas; troque o compressore a cada 2 min; pós-choque retomar compressões imediatamente" })));
      }
      /* checklist */
      var chks = [["Confirmar ritmo no monitor e escolher SYNC (ou não, na FV/TVsp)", sinc], ["Pás: anteroposterior ou anteroapical com boa contato; afastar oxigênio", true], ["Sedação analgesia antes do choque sincronizado (se paciente acordado)", sinc], ["Anunciar: “Carregando — AFASTAR” — checar que ninguém toca o leito", true], ["Disparar e verificar resposta no monitor; registrar energia e tempo", true], ["Se falhar: aumentar energia e repetir; reavaliar ritmo a cada choque", true], ["Registrar no atendimento (botão abaixo)", true]];
      var ol = h("ol", { style: "margin:8px 0 0;padding-left:20px;font-size:14px" });
      chks.forEach(function (c) { ol.appendChild(h("li", { text: c[0], style: !c[1] ? "text-decoration:line-through;color:var(--muted)" : "" })); });
      out.appendChild(h("div", { class: "box", style: "margin-top:8px" }, h("h3", { text: "Passo a passo" }), ol));
      out.appendChild(h("div", { class: "note", style: "margin-top:8px", text: "Ensino curto: 1) SYNC só em ritmo com QRS identificável — em FV/TVsp dessincronize; 2) cardioversão é escolha do ritmo E instabilidade, não da FC; 3) energia bifásica começa baixa no flutter/TSV (50–100 J) e alta na FA instável (120–200 J)." }));
      var act = h("div", { class: "btns", style: "margin-top:10px" });
      act.appendChild(h("button", { class: "btn sm primary", type: "button", text: "Registrar no atendimento", onclick: function () {
        cse().scores["Cardioversão/Desfibrilação"] = (sinc ? "Cardioversão sincronizada" : "Desfibrilação") + ": " + rot + ". Conduta: procedimento realizado conforme checklist do app.";
        save(); st.textContent = "Registrado — entra na evolução e no contexto do Assistente."; st.className = "status ok";
      } }));
      act.appendChild(h("button", { class: "btn sm", type: "button", text: "Copiar conduta", onclick: function () { copy(rot + "\n" + (out.textContent || "")); } }));
      out.appendChild(act);
    }
    rit.addEventListener("change", calc);
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Ritmo alvo" }), rit, out));
    calc();
    b.appendChild(h("div", { class: "note", text: "Energias em bifásico (padrão atual). Em monofásico, dobrar. Protocolo ACLS/PALS vigente; confira o cardioversor do serviço. IA e protocolo apoiam — a decisão é do médico." }));
  }

  /* ---------- ⑥ ECG / RX COM IA ---------- */
  function openImaging() {
    var s = openShell("ECG / RX com IA", headSub()), b = s.b, f = s.f, st = h("div", { class: "status" });
    var modo = "ecg";
    var chips = h("div", { class: "chips" });
    [["ecg", "ECG"], ["rx", "Raio-X"]].forEach(function (m2) {
      var c = h("button", { class: "chip" + (modo === m2[0] ? " on" : ""), type: "button", text: m2[1], onclick: function () { modo = m2[0]; Array.prototype.forEach.call(chips.children, function (x) { x.classList.remove("on"); }); c.classList.add("on"); } });
      chips.appendChild(c);
    });
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Tipo de exame" }), chips,
      h("p", { class: "note", text: "Fotografe ou anexe a imagem. A IA devolve leitura estruturada com NOTA DE ACURÁCIA e 3 ensinamentos curtos. A leitura final é do médico — a IA é apoio." })));
    var fi = h("input", { type: "file", accept: "image/*", style: "position:absolute;width:1px;height:1px;opacity:0", id: "psxImgFile" });
    var prev = h("div"), taOut = h("textarea", { class: "ta", rows: 16, placeholder: "O laudo aparece aqui…" });
    function scaleImage(file) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () { var img = new Image(); img.onload = function () {
          var max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement("canvas");
          cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b2) { res(b2); }, "image/jpeg", 0.9); }; img.src = fr.result; };
        fr.onerror = rej; fr.readAsDataURL(file);
      });
    }
    fi.addEventListener("change", async function () {
      var fl = fi.files[0]; if (!fl) return;
      prev.textContent = ""; taOut.value = ""; st.textContent = "Enviando imagem ao Assistente…"; st.className = "status";
      try {
        var blob = await scaleImage(fl);
        var cv2 = document.createElement("canvas"); cv2.width = 240; cv2.height = 180;
        prev.appendChild(cv2); prev.firstChild.getContext("2d").drawImage(await createImageBitmap(blob), 0, 0, 240, 180);
        var lim = await sample.limits().catch(function () { return null; });
        if (!lim || !lim.images) throw { code: "image_rejected" };
        var ctx = api.caseContext();
        var prompt = modo === "ecg"
          ? "Você apoia um médico de PS (hospital pequeno do SUS, sem cardiologista 24 h). Leia ESTE TRAÇADO DE ECG na imagem anexa e produza um LAUDO ESTRUTURADO em português, sem markdown:\nRITMO: ; FC: ; INTERVALOS (PR, QRS, QT/QTc): ; EIXO: ; ST/T: ; OUTRAS (bloqueios, ondas, pré-excitação): ; SUGESTÃO CLÍNICA (o que isso muda na conduta AGORA): ; ACURÁCIA (limitações honestas desta leitura por IA e o que conferir manualmente): ; ENSINAMENTOS (3 curtos).\nUse o contexto do paciente abaixo; não invente dados clínicos. Se a imagem estiver ruim, diga exatamente o que falta e peça nova foto.\n\nCONTEXTO:\n" + ctx
          : "Você apoia um médico de PS (hospital pequeno do SUS, sem radiologista 24 h). Leia ESTE RAIO-X na imagem anexa e produza um LAUDO ESTRUTURADO em português, sem markdown:\nEXAME/PROJEÇÃO aparente: ; TÉCNICA (posição, inspiração, limitações): ; ACHADOS por sistema/estrutura (campo pulmonar, pleura, mediastino/coração, ossos, partes moles, dispositivos): ; IMPRESSÃO DIAGNÓSTICA (as 2–3 hipóteses mais prováveis): ; SUGESTÃO CLÍNICA (conduta agora; exames complementares); ACURÁCIA (limitações honestas desta leitura por IA e o que reavaliar): ; ENSINAMENTOS (3 curtos).\nUse o contexto do paciente; não invente achados. Se a imagem estiver ruim, diga o que falta e peça nova foto.\n\nCONTEXTO:\n" + ctx;
        var r = await sample([{ role: "user", content: prompt }], { modelTier: "default", cache: false, images: [blob], onText: function (o) { taOut.value = o.text; } });
        var txt = (r.text || "").replace(/\*\*/g, "").trim();
        taOut.value = txt;
        st.textContent = "Leitura pronta — LEIA A NOTA DE ACURÁCIA e confira você mesmo."; st.className = "status ok";
      } catch (er) { st.textContent = aiErr(er); st.className = "status err"; }
    });
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Anexar imagem", h("small", { text: "JPG/PNG · boa luz, sem sombra" })), h("div", { class: "btns" }, h("label", { class: "btn primary", for: "psxImgFile", text: "Escolher foto do exame" }), fi), prev));
    b.appendChild(h("div", { class: "box" }, h("h3", { text: "Laudo (edite antes de colar no prontuário)" }), taOut,
      h("div", { class: "btns" }, h("button", { class: "btn sm", type: "button", text: "Copiar", onclick: function () { copy(taOut.value, taOut); } }),
        h("button", { class: "btn sm", type: "button", text: "Registrar no atendimento", onclick: function () {
          if (!taOut.value.trim()) { st.textContent = "Gere a leitura primeiro."; st.className = "status err"; return; }
          var C = cse(); C.ef.notas = (C.ef.notas ? C.ef.notas + "\n" : "") + "[" + (modo === "ecg" ? "ECG" : "RX") + " com apoio de IA — " + today() + " " + nowHM() + "]\n" + taOut.value.slice(0, 3000);
          if (!C.ef.edited) C.ef.final = "";
          save(); st.textContent = "Registrado em “Outros achados” do Exame físico."; st.className = "status ok";
        } }))));
    f.appendChild(h("span", { class: "note", text: "Responsabilidade: leitura por IA é apoio diagnóstico com erro conhecido; o laudo final é do médico. Não envie imagens identificáveis sem consentimento." }));
  }

  /* ---------- arranque ---------- */
  var t0 = setInterval(function () { try { sweepCards(); } catch (e) {} }, 600);
  sweepCards();
  /* CSS extra mínima */
  var css = document.createElement("style");
  css.textContent = "[data-psx-band]{display:flex;flex-wrap:wrap;gap:6px;align-items:center}" +
    "[data-psx-band] .x{border:1px solid var(--line);background:var(--surface);border-radius:999px;width:22px;height:22px;line-height:1;cursor:pointer}" +
    "[data-psx-falta],[data-psx-hepato]{margin-left:6px}";
  document.head.appendChild(css);
})();
