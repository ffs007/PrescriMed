/* Modelos pessoais de prescrição (biblioteca de conhecimento clínico).
   Extensão aditiva carregada depois de app.js. Grava pelo __psxBridge.tpl (banco com RLS).
   - Salvar atendimento inteiro ou um módulo (ambulatorial, alta, hospitalar, laboratório, imagem, controle, atestado).
   - Metadados/taxonomia, conteúdo complementar, busca tolerante com filtros, aplicação pelo motor do app
     (dose recalculada para o paciente atual, troca por alternativa em alergia ou fora da padronização).
   - Versões (ramos, comparação, restauração, consolidação), compartilhamento, sugestões, biblioteca institucional,
     exportação/importação (JSON/XML/CSV, AES-GCM opcional) e painel de uso. */
(function () {
  "use strict";
  var D = window.PROTO_DB, T = window.PSAPP && window.PSAPP.test; if (!D || !T) return;
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); };
  function el(tag, attrs) {
    var n = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null || v === false) return;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k === "value") n.value = v;
      else if (k === "checked") n.checked = !!v; else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x != null && x !== false) n.appendChild(typeof x === "string" ? document.createTextNode(x) : x); }); }
    return n;
  }
  function toast(t) { var x = el("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3600); }
  function read(k, f) { try { return JSON.parse(localStorage.getItem(k) || "null") || f; } catch (_) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function bridge() { try { return window.parent && window.parent.__psxBridge; } catch (_) { return null; } }
  async function call(op, a) { var b = bridge(); if (!b || !b.tpl) throw { message: "Faça login para usar os modelos." }; return b.tpl(op, a || {}); }
  function C() { return T.C(); }
  function persist() { try { localStorage.setItem("psx.case", JSON.stringify(Object.assign({}, C(), { docs: [] }))); } catch (_) {} }
  var clone = function (x) { return x == null ? x : JSON.parse(JSON.stringify(x)); };
  var mainModal = function () { return document.getElementById("modal"); };
  var title = function () { var t = document.getElementById("mTitle"); return t ? t.textContent.trim() : ""; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var MODS = [["alta", "Prescrição ambulatorial"], ["hosp", "Prescrição hospitalar"], ["lab", "Exames laboratoriais"], ["comp", "Imagem e outros exames"], ["ctrl", "Controle especial"], ["docs", "Atestados e declarações"]];
  var MODNAME = {}; MODS.forEach(function (m) { MODNAME[m[0]] = m[1]; });
  var GRAV = ["leve", "moderada", "grave", "crítica"], CTX = ["ambulatório", "pronto-socorro", "internação", "UTI"];
  var EVID = ["diretriz internacional", "diretriz nacional", "protocolo institucional", "experiência clínica"];
  var INFO = [["cuidSimples", "Cuidados em casa — linguagem simples (vai na receita)"], ["cuidDetalhe", "Cuidados em casa — versão detalhada"], ["alarme", "Sinais de alerta para voltar (critérios objetivos)"], ["prevencao", "Prevenção secundária"], ["nutricao", "Recomendações nutricionais"], ["atividade", "Atividade física e escola/trabalho"], ["reavaliacao", "Cronograma de reavaliações"], ["controle", "Exames de controle e quando fazer"], ["justificativa", "Justificativa científica das escolhas"], ["referencias", "Referências bibliográficas"]];

  /* ---------- idade/paciente ---------- */
  function idadeAnos() {
    var p = C().pac, v = parseFloat(String(p.idade || "").replace(",", "."));
    if (!isNaN(v)) return p.idUn === "meses" ? v / 12 : v;
    if (p.nasc) { var d = new Date(p.nasc); if (!isNaN(d)) return (Date.now() - d) / 31557600000; }
    return null;
  }

  /* ---------- captura ---------- */
  function rxParts() {
    var c = C();
    return { rx: c.rx, sel: c.rxSel };
  }
  function drugFor(med, sel) {
    var f = fold(med), best = null;
    Object.keys(sel || {}).concat(Object.keys(D.drugs)).some(function (id) {
      var dr = D.drugs[id]; if (!dr) return false; var n = fold(dr.n).split(/[\s(]/)[0];
      if (n.length > 3 && f.indexOf(n) === 0) { best = id; return true; } return false;
    });
    return best;
  }
  function capRx(which) {
    var p = rxParts(which), rx = p.rx || {}, itens = [];
    (rx.itens || []).forEach(function (it) {
      var id = drugFor(it.med, p.sel);
      itens.push({ med: it.med, qtd: it.qtd, via: it.via, pos: it.pos, drug: id || null, sl: id && p.sel[id] ? Object.assign(clone(p.sel[id]), { on: false }) : null, essencial: true, alt: [] });
    });
    return { itens: itens, naoUsar: rx.naoUsar || "", cuidados: rx.cuidados || "", alarme: rx.alarme || "", retorno: rx.retorno || "", visto: rx.visto || "", duasVias: !!rx.duasVias };
  }
  function capture(mods) {
    var c = C(), out = {};
    mods.forEach(function (m) {
      if (m === "amb" || m === "alta") out[m] = capRx(m);
      else if (m === "hosp") { var h = clone(c.hosp) || {}; delete h.open; out.hosp = h; }
      else if (m === "lab") out.lab = { sel: clone(c.lab.sel), obs: c.lab.obs || "", desc: c.lab.desc || "", cid: c.lab.cid || "" };
      else if (m === "comp") out.comp = { sel: clone(c.comp.sel), obs: c.comp.obs || "", desc: c.comp.desc || "", cid: c.comp.cid || "", separar: c.comp.separar };
      else if (m === "ctrl") out.ctrl = { itens: (c.ctrl.itens || []).map(function (x) { var id = drugFor(x.med, {}); return Object.assign(clone(x), { drug: id }); }) };
      else if (m === "docs") { var d = read("psx.ambulatory-docs", {}); out.docs = { atestado: d.atestado ? { dias: d.atestado.dias, finalidade: d.atestado.finalidade, texto: d.atestado.texto, cid: d.atestado.cid } : null }; }
    });
    return sanitize(out);
  }
  function sanitize(o) {
    var p = C().pac, bad = [p.nome, p.cpf, p.cns, p.mae, p.end, p.tel].filter(function (x) { return x && String(x).length > 3; });
    var s = JSON.stringify(o); bad.forEach(function (b) { s = s.split(String(b)).join("[paciente]"); });
    return JSON.parse(s);
  }
  function hasContent(cont) { return Object.keys(cont.mods || {}).some(function (k) { var m = cont.mods[k]; return m && ((m.itens && m.itens.length) || (m.sel && Object.keys(m.sel).length) || m.cuidados || m.dieta || (m.extra && m.extra.length) || (m.cuid && Object.keys(m.cuid).length) || m.atestado); }); }
  function protoHash(pid) { var p = D.protocols.find(function (x) { return x.id === pid; }); if (!p) return ""; var s = JSON.stringify([p.cls, p.lab, p.comp, p.alerta]); var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

  /* ---------- aplicação ---------- */
  function allergic(dr) {
    var a = fold(C().pac.alergias); if (!a || !dr) return false;
    var name = fold(dr.n).split(/[\s(]/)[0];
    return a.split(/[,;\/]| e /).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 3; }).some(function (x) { return name.indexOf(x) === 0 || x.indexOf(name) === 0 || fold(dr.cl || dr.classe || "").indexOf(x) >= 0; });
  }
  function padrao() { var t = fold((read("psx.cfg", {}) || {}).padronizacao || ""); return t ? t.split(/\n|;/).map(function (x) { return x.trim(); }).filter(Boolean) : null; }
  function inPadrao(dr, list) { if (!list || !dr) return true; var n = fold(dr.n).split(/[\s(]/)[0]; return list.some(function (x) { return x.indexOf(n) === 0 || n.indexOf(x.split(" ")[0]) === 0; }); }
  function pickDrug(it, log) {
    var list = padrao(), id = it.drug, dr = D.drugs[id];
    if (!dr) return null;
    var why = allergic(dr) ? "alergia registrada" : !inPadrao(dr, list) ? "fora da lista do hospital" : "";
    if (!why) return id;
    var alt = (it.alt || []).find(function (a) { var d = D.drugs[a]; return d && !allergic(d) && inPadrao(d, list); });
    if (alt) { log.push("⚠ " + dr.n + " trocado por " + D.drugs[alt].n + " (" + why + ")."); return alt; }
    log.push("⛔ " + dr.n + " não aplicado (" + why + ") e sem alternativa cadastrada.");
    return null;
  }
  function clickAdd() { var m = mainModal(); if (!m) return 0; var b = Array.prototype.find.call(m.querySelectorAll("button"), function (x) { return x.textContent.trim() === "Adicionar selecionados"; }); if (b) b.click(); var st = m.querySelector(".status.ok"); return st ? st.textContent : ""; }
  async function applyRx(which, R, info, log) {
    var c = C(), sel = {}, free = [], useOpt = R.useOptional;
    R.itens.forEach(function (it) {
      if (!it.essencial && !useOpt) { log.push("Opcional não aplicado: " + it.med + "."); return; }
      if (!it.drug) { free.push({ med: it.med, qtd: it.qtd, via: it.via, pos: it.pos }); return; }
      var id = pickDrug(it, log); if (!id) return;
      sel[id] = Object.assign(id === it.drug && it.sl ? clone(it.sl) : {}, { on: true });
    });
    var extraTxt = function (base, add) { return [base, add].filter(Boolean).join("\n"); };
    var rx = { itens: free, duasVias: !!R.duasVias, naoUsar: R.naoUsar || "", visto: R.visto || "",
      cuidados: extraTxt(R.cuidados, info && info.cuidSimples), alarme: extraTxt(R.alarme, info && info.alarme), retorno: extraTxt(R.retorno, info && info.reavaliacao) };
    var wanted = Object.keys(sel).length;
    c.rx = rx; c.rxSel = sel; c.rxAll = true; persist(); T.openMod("rx");
    await wait(250);
    if (wanted) { var r = clickAdd(); await wait(150);
      var left = Object.keys(sel).filter(function (id) { return c.rxSel[id] && c.rxSel[id].on; });
      left.forEach(function (id) { log.push("⛔ " + D.drugs[id].n + ": o motor não calculou a dose para este paciente (confira peso/idade) — ficou marcado para você revisar."); });
      if (r) log.push(MODNAME[which] + ": " + r);
    }
    persist();
  }
  async function applyTemplate(m, v, opts) {
    var cont = v.conteudo || {}, mods = cont.mods || {}, log = [], c = C(), started = Date.now();
    if (cont.proto && D.protocols.find(function (p) { return p.id === cont.proto; })) { if (c.proto !== cont.proto) T.chooseProto(cont.proto); }
    else if (!c.proto) T.chooseProto("__branco");
    await wait(150); c = C();
    var mt = m.meta || {}, ia = idadeAnos();
    if (ia != null && ((mt.idadeMin != null && mt.idadeMin !== "" && ia < +mt.idadeMin) || (mt.idadeMax != null && mt.idadeMax !== "" && ia > +mt.idadeMax))) log.push("⚠ Idade do paciente fora da faixa do modelo (" + (mt.idadeMin || 0) + "–" + (mt.idadeMax || "∞") + " anos).");
    if (mods.hosp) { var H = clone(mods.hosp); ["sel", "cuid", "init"].forEach(function (k) { c.hosp[k] = Object.assign({}, c.hosp[k] || {}, H[k] || {}); }); if (H.extra) c.hosp.extra = (c.hosp.extra || []).concat(H.extra); ["dieta", "dietaTxt", "obs"].forEach(function (k) { if (H[k]) c.hosp[k] = H[k]; }); if (H.hid && H.hid.length) c.hosp.hid = H.hid; c.hosp.allCls = !!H.allCls || c.hosp.allCls; log.push("Prescrição hospitalar: itens marcados; doses recalculadas para o paciente atual."); }
    if (mods.lab) { c.lab.sel = Object.assign({}, c.lab.sel, mods.lab.sel || {}); ["obs", "desc", "cid"].forEach(function (k) { if (mods.lab[k]) c.lab[k] = mods.lab[k]; }); log.push("Exames laboratoriais: " + Object.keys(mods.lab.sel || {}).length + " marcados."); }
    if (mods.comp) { c.comp.sel = Object.assign({}, c.comp.sel, mods.comp.sel || {}); ["obs", "desc", "cid"].forEach(function (k) { if (mods.comp[k]) c.comp[k] = mods.comp[k]; }); log.push("Imagem e outros: " + Object.keys(mods.comp.sel || {}).length + " marcados."); }
    if (mods.docs && mods.docs.atestado) { var d = read("psx.ambulatory-docs", {}); d.atestado = Object.assign({}, d.atestado || {}, { dias: mods.docs.atestado.dias, finalidade: mods.docs.atestado.finalidade || "", texto: mods.docs.atestado.texto || "" }); write("psx.ambulatory-docs", d); log.push("Atestado: período e texto preenchidos (confira antes de emitir)."); }
    persist();
    var info = cont.info || {}, infoUsed = false;
    var rxMod = mods.alta || mods.amb;
    if (rxMod) { var R = clone(rxMod); R.useOptional = !!opts.optional; await applyRx("alta", R, info, log); infoUsed = true; }
    if (!infoUsed && (info.cuidSimples || info.alarme)) { c.rx = c.rx || { itens: [] }; c.rx.cuidados = [c.rx.cuidados, info.cuidSimples].filter(Boolean).join("\n"); c.rx.alarme = [c.rx.alarme, info.alarme].filter(Boolean).join("\n"); persist(); }
    if (mods.ctrl && mods.ctrl.itens && mods.ctrl.itens.length && !mods.amb && !mods.alta) log.push("Controle especial: os remédios desse documento entram ao aplicar a receita; " + mods.ctrl.itens.length + " item(ns) registrados no modelo — selecione-os na receita para recalcular.");
    if (opts.track === false) { persist(); return log; }
    var snap = snapshot();
    var uso = null; try { uso = await call("use", { id: m.id, versao: v.id, contexto: { proto: C().proto, idade: ia, peso: C().pac.peso } }); } catch (_) {}
    write("psx.tpl.applied", { id: m.id, nome: m.nome, uso: uso && uso.id, snap: snap, at: started });
    pendingBar();
    return log;
  }
  function snapshot() { var c = C(); var a = []; (c.rx && c.rx.itens || []).forEach(function (x) { a.push(fold(x.med + "|" + x.pos)); }); T.hospItems().forEach(function (x) { a.push(fold(x.text)); }); Object.keys(c.lab.sel || {}).forEach(function (k) { a.push("lab:" + k); }); Object.keys(c.comp.sel || {}).forEach(function (k) { a.push("comp:" + k); }); return a; }
  function pctMod(before) { var now = snapshot(), b = {}, n = {}; before.forEach(function (x) { b[x] = 1; }); now.forEach(function (x) { n[x] = 1; }); var all = Object.keys(Object.assign({}, b, n)); if (!all.length) return 0; var ch = all.filter(function (k) { return !(b[k] && n[k]); }).length; return Math.round(100 * ch / all.length); }

  /* ---------- avaliação após uso ---------- */
  function pendingBar() {
    var ap = read("psx.tpl.applied", null), old = document.getElementById("psxTplRate"); if (old) old.remove(); if (!ap) return;
    var stars = 0, thumb = 0;
    var bar = el("div", { id: "psxTplRate", role: "region", "aria-label": "Avaliar modelo", style: "position:fixed;left:12px;bottom:12px;z-index:60;background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:12px;padding:8px 10px;box-shadow:0 6px 20px rgba(0,0,0,.15);display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:min(560px,calc(100vw - 24px));font-size:13px" });
    var sw = el("span"); function drawS() { sw.textContent = ""; for (var i = 1; i <= 5; i++) (function (k) { sw.appendChild(el("button", { class: "btn sm ghost", type: "button", "aria-label": k + " estrelas", text: k <= stars ? "★" : "☆", onclick: function () { stars = k; drawS(); } })); })(i); }
    drawS();
    var up = el("button", { class: "btn sm ghost", type: "button", "aria-label": "Gostei", text: "👍", onclick: function () { thumb = 1; up.style.outline = "2px solid currentColor"; dn.style.outline = ""; } });
    var dn = el("button", { class: "btn sm ghost", type: "button", "aria-label": "Não gostei", text: "👎", onclick: function () { thumb = -1; dn.style.outline = "2px solid currentColor"; up.style.outline = ""; } });
    bar.append(el("span", { text: "Modelo \"" + ap.nome + "\" aplicado. Ao terminar, avalie:" }), sw, up, dn,
      el("button", { class: "btn sm primary", type: "button", text: "Enviar", onclick: async function () {
        var patch = { pct_mod: pctMod(ap.snap || []), segundos: Math.round((Date.now() - ap.at) / 1000) };
        if (stars) patch.estrelas = stars; if (thumb) patch.polegar = thumb;
        try { if (ap.uso) await call("rate", { usoId: ap.uso, patch: patch }); await call("time", { com: true, segundos: patch.segundos }); toast("Obrigado! Modificação: " + patch.pct_mod + "%."); } catch (e) { toast("Não consegui registrar: " + (e.message || e)); }
        localStorage.removeItem("psx.tpl.applied"); bar.remove(); } }),
      el("button", { class: "btn sm ghost", type: "button", text: "Dispensar", onclick: function () { localStorage.removeItem("psx.tpl.applied"); bar.remove(); } }));
    document.body.appendChild(bar);
  }
  // Tempo sem modelo: do início da condição até o primeiro PDF baixado.
  var condStart = null, lastProto = null;
  setInterval(function () { var p = C().proto; if (p !== lastProto) { lastProto = p; condStart = p ? Date.now() : null; } }, 1500);
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("button"); if (!b || !condStart) return;
    if (!/baixar|salvar pdf|gerar pdf/i.test(b.textContent || "") || read("psx.tpl.applied", null)) return;
    var s = (Date.now() - condStart) / 1000; condStart = null; if (s > 5 && s < 7200) call("time", { com: false, segundos: s }).catch(function () {});
  }, true);

  /* ---------- diálogo genérico ---------- */
  function dialog(titleTxt, sub) {
    var dlg = document.getElementById("psxTplModal");
    if (!dlg) {
      dlg = el("dialog", { class: "modal", id: "psxTplModal", "aria-labelledby": "psxTplTitle" });
      dlg.innerHTML = '<div class="mhead"><div><h2 id="psxTplTitle"></h2><small id="psxTplSub"></small></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="mbody" id="psxTplBody"></div><div class="mfoot" id="psxTplFoot"></div>';
      document.body.appendChild(dlg); dlg.querySelector(".x").addEventListener("click", function () { dlg.close(); });
    }
    dlg.querySelector("#psxTplTitle").textContent = titleTxt; dlg.querySelector("#psxTplSub").textContent = sub || "";
    var b = dlg.querySelector("#psxTplBody"), f = dlg.querySelector("#psxTplFoot"); b.textContent = ""; f.textContent = "";
    if (!dlg.open) dlg.showModal(); b.scrollTop = 0;
    return { dlg: dlg, b: b, f: f };
  }
  function field(label, input) { return el("label", { class: "fld", style: "display:block;margin:6px 0" }, el("span", { class: "note", text: label, style: "display:block;margin-bottom:2px" }), input); }
  function chipsMulti(opts, val, onCh) { var w = el("div", { class: "chips" }); val = val || []; function d() { w.textContent = ""; opts.forEach(function (o) { var on = val.indexOf(o) >= 0; w.appendChild(el("button", { class: "chip" + (on ? " on" : ""), type: "button", text: o, "aria-pressed": on ? "true" : "false", onclick: function () { var i = val.indexOf(o); if (i >= 0) val.splice(i, 1); else val.push(o); onCh(val); d(); } })); }); } d(); return w; }
  function chipsOne(opts, val, onCh) { var w = el("div", { class: "chips" }); function d() { w.textContent = ""; opts.forEach(function (o) { w.appendChild(el("button", { class: "chip" + (val === o ? " on" : ""), type: "button", text: o, onclick: function () { val = val === o ? "" : o; onCh(val); d(); } })); }); } d(); return w; }
  var lines = function (s) { return String(s || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); };

  /* ---------- salvar ---------- */
  async function openSave(preMod, target) {
    var cur = C(), p = D.protocols.find(function (x) { return x.id === cur.proto; });
    var tm = target && target.meta ? clone(target.meta) : {};
    var tv = target && target.headV ? clone(target.headV.conteudo) : null;
    var meta = Object.assign({ tags: [], gravidade: "", contexto: [], evidencia: "", idadeMin: "", idadeMax: "", comorbidades: "", cid: p ? (p.cid || []).map(function (c) { return Array.isArray(c) ? c[0] : c; }).join(", ") : "", sintomas: "", diagnostico: p ? p.n : "" }, tm);
    var mods = preMod ? [preMod] : MODS.map(function (m) { return m[0]; }).filter(function (k) { var x = capture([k])[k]; return hasContent({ mods: (function () { var o = {}; o[k] = x; return o; })() }); });
    var s = dialog(target ? "Nova versão de \"" + target.nome + "\"" : "Salvar como modelo", "os dados do paciente são removidos");
    var nome = el("input", { class: "in", value: target ? target.nome : (p ? p.n + " — meu modelo" : "Meu modelo"), "aria-label": "Nome do modelo" });
    var modBox = el("div", { class: "chips" });
    function drawMods() { modBox.textContent = ""; MODS.forEach(function (m) { var on = mods.indexOf(m[0]) >= 0; modBox.appendChild(el("button", { class: "chip" + (on ? " on" : ""), type: "button", text: m[1], onclick: function () { var i = mods.indexOf(m[0]); if (i >= 0) mods.splice(i, 1); else mods.push(m[0]); drawMods(); drawMeds(); } })); }); }
    var tags = el("textarea", { class: "in", rows: "2", placeholder: "uma por linha — ex.: respiratório > pneumonia > comunitária > típica > 2-5 anos", value: (meta.tags || []).join("\n") });
    var imin = el("input", { class: "in mono", type: "number", min: "0", step: "0.1", placeholder: "mín.", value: meta.idadeMin }), imax = el("input", { class: "in mono", type: "number", min: "0", step: "0.1", placeholder: "máx.", value: meta.idadeMax });
    var como = el("input", { class: "in", placeholder: "ex.: asma, DRC, gestação", value: meta.comorbidades }), cid = el("input", { class: "in mono", value: meta.cid }), sint = el("input", { class: "in", value: meta.sintomas, placeholder: "ex.: febre, tosse, dispneia" }), diag = el("input", { class: "in", value: meta.diagnostico });
    var ramo = el("input", { class: "in", value: target && target.ramo ? target.ramo : "principal", "aria-label": "Ramo" }), msg = el("input", { class: "in", placeholder: "o que mudou nesta versão", value: target ? "" : "Versão inicial" });
    var info = Object.assign({}, tv && tv.info || {}), infoEls = {};
    var mats = (tv && tv.materiais || []).slice();
    var medsBox = el("div"), medOpts = {};
    (tv ? ["amb", "alta"] : []).forEach(function (w) { ((tv.mods || {})[w] && tv.mods[w].itens || []).forEach(function (it) { medOpts[fold(it.med)] = { essencial: it.essencial !== false, alt: it.alt || [] }; }); });
    function drawMeds() {
      medsBox.textContent = ""; var any = false;
      ["amb", "alta"].forEach(function (w) { if (mods.indexOf(w) < 0) return; capRx(w).itens.forEach(function (it) {
        any = true; var k = fold(it.med), o = medOpts[k] = medOpts[k] || { essencial: true, alt: [] };
        var ess = el("select", { class: "sel", "aria-label": "Essencial ou opcional" }, el("option", { value: "1", text: "essencial" }), el("option", { value: "0", text: "opcional" })); ess.value = o.essencial ? "1" : "0"; ess.onchange = function () { o.essencial = ess.value === "1"; };
        var altIn = el("input", { class: "in", placeholder: "alternativas (alergia/falta) — nomes separados por vírgula", value: o.alt.map(function (a) { return D.drugs[a] ? D.drugs[a].n : a; }).join(", ") });
        altIn.onchange = function () { o.alt = altIn.value.split(",").map(function (x) { return drugFor(x.trim(), {}); }).filter(Boolean); altIn.value = o.alt.map(function (a) { return D.drugs[a].n; }).join(", "); };
        medsBox.appendChild(el("div", { class: "drow" }, el("div", { class: "line", text: it.med + (it.drug ? "" : " (texto livre)") }), el("div", { class: "grid" }, ess, altIn)));
      }); });
      if (!any) medsBox.appendChild(el("div", { class: "note", text: "Sem medicamentos nos módulos escolhidos." }));
    }
    var matBox = el("div");
    function drawMats() { matBox.textContent = ""; mats.forEach(function (m, i) { matBox.appendChild(el("div", { class: "note" }, el("a", { href: m.url, target: "_blank", rel: "noopener", text: m.t || m.url }), " ", el("button", { class: "btn sm ghost", type: "button", text: "remover", onclick: function () { mats.splice(i, 1); drawMats(); } }))); }); }
    var mt = el("input", { class: "in", placeholder: "título" }), mu = el("input", { class: "in", placeholder: "https://… (vídeo, infográfico, PDF)" }), mf = el("input", { type: "file", accept: "application/pdf,image/*", "aria-label": "Anexar arquivo" });
    mf.onchange = function () { var f = mf.files[0]; if (!f) return; if (f.size > 1500000) { toast("Arquivo acima de 1,5 MB — use um link."); return; } var r = new FileReader(); r.onload = function () { mats.push({ t: f.name, url: r.result }); drawMats(); }; r.readAsDataURL(f); };
    var st = el("div", { class: "status" });
    s.b.append(
      el("div", { class: "box" }, el("h3", { text: "Conteúdo" }), field("Nome", nome), el("div", { class: "note", text: "Módulos incluídos (todos = atendimento inteiro):" }), modBox),
      el("div", { class: "box" }, el("h3", { text: "Classificação" }), field("Etiquetas em níveis (use \">\")", tags),
        field("Gravidade", chipsOne(GRAV, meta.gravidade, function (v) { meta.gravidade = v; })), field("Contexto", chipsMulti(CTX, meta.contexto, function (v) { meta.contexto = v; })),
        field("Nível de evidência", chipsOne(EVID, meta.evidencia, function (v) { meta.evidencia = v; })),
        el("div", { class: "grid" }, field("Idade mínima (anos)", imin), field("Idade máxima (anos)", imax)),
        field("Comorbidades que mudam a conduta", como), el("div", { class: "grid" }, field("CID-10", cid), field("Diagnóstico", diag)), field("Sintomas-chave", sint)),
      el("div", { class: "box" }, el("h3", { text: "Medicamentos: essenciais, opcionais e alternativas" }), medsBox),
      el("div", { class: "box" }, el("h3", { text: "Informações complementares" }), INFO.map(function (x) { var t = infoEls[x[0]] = el("textarea", { class: "in", rows: "2", value: info[x[0]] || "" }); return field(x[1], t); }),
        el("div", { class: "note", text: "Materiais educativos:" }), matBox, el("div", { class: "grid" }, mt, mu), el("div", { class: "btns" }, el("button", { class: "btn sm", type: "button", text: "Adicionar link", onclick: function () { if (!/^https?:\/\//.test(mu.value)) { toast("Informe um link https://"); return; } mats.push({ t: mt.value || mu.value, url: mu.value }); mt.value = mu.value = ""; drawMats(); } }), mf)),
      el("div", { class: "box" }, el("h3", { text: "Versão" }), el("div", { class: "grid" }, field("Ramo (variação de teste)", ramo), field("Descrição da mudança", msg))), st);
    drawMods(); drawMeds(); drawMats();
    s.f.append(el("button", { class: "btn primary", type: "button", text: target ? "Salvar nova versão" : "Salvar modelo", onclick: async function () {
      if (!mods.length) { st.textContent = "Escolha ao menos um módulo."; st.className = "status err"; return; }
      var content = { proto: cur.proto, protoHash: protoHash(cur.proto), mods: capture(mods), info: {}, materiais: mats };
      INFO.forEach(function (x) { if (infoEls[x[0]].value.trim()) content.info[x[0]] = infoEls[x[0]].value.trim(); });
      ["amb", "alta"].forEach(function (w) { if (content.mods[w]) content.mods[w].itens.forEach(function (it) { var o = medOpts[fold(it.med)]; if (o) { it.essencial = o.essencial; it.alt = o.alt; } }); });
      if (!hasContent(content) && !Object.keys(content.info).length) { st.textContent = "Os módulos escolhidos estão vazios."; st.className = "status err"; return; }
      var m2 = { tags: lines(tags.value), gravidade: meta.gravidade, contexto: meta.contexto, evidencia: meta.evidencia, idadeMin: imin.value, idadeMax: imax.value, comorbidades: como.value, cid: cid.value, sintomas: sint.value, diagnostico: diag.value, modulos: mods.slice(), proto: cur.proto, protoHash: content.protoHash, medNames: [].concat.apply([], ["amb", "alta", "ctrl"].map(function (w) { return content.mods[w] ? content.mods[w].itens.map(function (x) { return x.med; }) : []; })) };
      st.textContent = "Salvando…"; st.className = "status";
      try {
        if (target) await call("commit", { id: target.id, ramo: ramo.value.trim() || "principal", pai: target.headV ? target.headV.id : null, mensagem: msg.value || "Atualização", conteudo: content, meta: m2, nome: nome.value.trim() });
        else await call("create", { nome: nome.value.trim() || "Modelo", meta: m2, conteudo: content, mensagem: msg.value || "Versão inicial" });
        toast("Modelo salvo."); openLibrary();
      } catch (e) { st.textContent = "Erro: " + (e.message || e); st.className = "status err"; }
    } }));
  }

  /* ---------- busca ---------- */
  function lev(a, b) { if (a === b) return 0; var m = a.length, n = b.length; if (!m || !n) return m || n; var p = []; for (var j = 0; j <= n; j++) p[j] = j; for (var i = 1; i <= m; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= n; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return p[n]; }
  function blob(m) { var mt = m.meta || {}, meds = (mt.medNames || []).join(" "); return fold([m.nome, (mt.tags || []).join(" "), mt.sintomas, mt.diagnostico, mt.cid, mt.comorbidades, meds].join(" ")); }
  function score(m, q) {
    if (!q) return 1; var words = fold(q).split(/\s+/).filter(Boolean), b = blob(m), toks = b.split(/[^a-z0-9.]+/).filter(Boolean), sc = 0;
    for (var i = 0; i < words.length; i++) { var w = words[i]; if (b.indexOf(w) >= 0) { sc += 2; continue; } var tol = w.length > 6 ? 2 : w.length > 3 ? 1 : 0; if (tol && toks.some(function (t) { return lev(w, t.slice(0, w.length + 1)) <= tol || lev(w, t) <= tol; })) sc += 1; else return 0; }
    return sc;
  }
  function ageOk(m, ia) { var mt = m.meta || {}; if (ia == null) return null; var lo = mt.idadeMin === "" || mt.idadeMin == null ? -1 : +mt.idadeMin, hi = mt.idadeMax === "" || mt.idadeMax == null ? 999 : +mt.idadeMax; return ia >= lo && ia <= hi; }

  /* ---------- biblioteca ---------- */
  var F = { q: "", ctx: "", ordem: "relevancia", escopo: "todos", idade: true };
  var ME = null;
  async function openLibrary() {
    var s = dialog("Meus modelos", "busque, aplique, versione e compartilhe");
    var st = el("div", { class: "status", text: "Carregando…" }); s.b.appendChild(st);
    var list; try { ME = ME || await call("me"); list = await call("list"); } catch (e) { st.textContent = e.message || "Falha ao carregar."; st.className = "status err"; return; }
    st.remove();
    var ia = idadeAnos();
    var q = el("input", { class: "in", type: "search", placeholder: "nome, etiqueta, sintoma, diagnóstico, CID-10 ou remédio", value: F.q, "aria-label": "Buscar modelos" });
    var ctxSel = el("select", { class: "sel", "aria-label": "Contexto" }, [el("option", { value: "", text: "todo contexto" })].concat(CTX.map(function (c) { return el("option", { value: c, text: c }); }))); ctxSel.value = F.ctx;
    var ord = el("select", { class: "sel", "aria-label": "Ordenar" }, [["relevancia", "mais relevantes"], ["uso", "mais usados"], ["avaliacao", "melhor avaliados"], ["recente", "usados recentemente"], ["criacao", "criados recentemente"]].map(function (o) { return el("option", { value: o[0], text: o[1] }); })); ord.value = F.ordem;
    var esc = el("select", { class: "sel", "aria-label": "Origem" }, [["todos", "todos"], ["dono", "meus"], ["compart", "compartilhados comigo"], ["publico", "biblioteca institucional"], ["revisor", "aguardando aprovação"]].map(function (o) { return el("option", { value: o[0], text: o[1] }); })); esc.value = F.escopo;
    var idadeCb = el("input", { type: "checkbox", checked: F.idade });
    var res = el("div");
    function draw() {
      F.q = q.value; F.ctx = ctxSel.value; F.ordem = ord.value; F.escopo = esc.value; F.idade = idadeCb.checked;
      res.textContent = "";
      var rows = list.map(function (m) { return { m: m, s: score(m, F.q), a: ageOk(m, ia) }; }).filter(function (r) {
        if (!r.s) return false; var m = r.m;
        if (F.ctx && (m.meta.contexto || []).indexOf(F.ctx) < 0) return false;
        if (F.escopo === "dono" && m.nivel !== "dono") return false; if (F.escopo === "compart" && !(m.nivel === "leitura" || m.nivel === "colab")) return false;
        if (F.escopo === "publico" && m.publicacao !== "publicado") return false; if (F.escopo === "revisor" && m.publicacao !== "pendente") return false;
        if (F.escopo !== "revisor" && m.nivel === "revisor") return false;
        if (F.idade && r.a === false) return false; return true;
      });
      rows.sort(function (x, y) {
        if (F.ordem === "uso") return y.m.usos - x.m.usos; if (F.ordem === "avaliacao") return (y.m.estrelas || 0) - (x.m.estrelas || 0);
        if (F.ordem === "recente") return String(y.m.ultimoUso || "").localeCompare(String(x.m.ultimoUso || "")); if (F.ordem === "criacao") return String(y.m.created_at).localeCompare(String(x.m.created_at));
        return (y.a === true) - (x.a === true) || y.s - x.s || y.m.usos - x.m.usos;
      });
      var top = list.filter(function (m) { return m.usos > 0 && m.nivel !== "revisor"; }).sort(function (a, b) { return b.usos - a.usos; }).slice(0, 3);
      if (!F.q && top.length) res.appendChild(el("div", { class: "note", text: "Em destaque (mais usados): " + top.map(function (m) { return m.nome + " (" + m.usos + "×)"; }).join(" · ") }));
      if (!rows.length) res.appendChild(el("div", { class: "note", text: list.length ? "Nenhum modelo com esses filtros." + (F.idade && ia != null ? " Desmarque \"só idade compatível\" para ver todos." : "") : "Você ainda não tem modelos. Monte uma receita e use \"Salvar como modelo\"." }));
      rows.forEach(function (r) { res.appendChild(card(r.m, r.a)); });
    }
    function card(m, a) {
      var mt = m.meta || {}, p = mt.proto && D.protocols.find(function (x) { return x.id === mt.proto; });
      var outdated = m.nivel === "dono" && mt.proto && mt.protoHash && protoHash(mt.proto) && mt.protoHash !== protoHash(mt.proto);
      var badges = [m.nivel === "dono" ? null : el("span", { class: "badge b", text: m.nivel === "publico" ? "biblioteca" : m.nivel === "revisor" ? "aguardando aprovação" : m.nivel === "colab" ? "colaborativo" : "só leitura" }),
        m.publicacao === "pendente" && m.nivel === "dono" ? el("span", { class: "badge w", text: "enviado à biblioteca" }) : null, m.publicacao === "publicado" && m.nivel === "dono" ? el("span", { class: "badge", text: "publicado" }) : null,
        m.publicacao === "recusado" ? el("span", { class: "badge w", text: "recusado: " + (m.revisao_obs || "") }) : null,
        a === true ? el("span", { class: "badge", text: "idade compatível" }) : a === false ? el("span", { class: "badge w", text: "fora da faixa etária" }) : null,
        outdated ? el("span", { class: "badge w", text: "protocolo da base mudou — revise" }) : null,
        m.sugestoes ? el("span", { class: "badge w", text: m.sugestoes + " sugestão(ões)" }) : null];
      return el("div", { class: "box" }, el("h3", { text: m.nome }), el("div", null, badges),
        el("div", { class: "note", text: [(mt.tags || []).join(" · "), mt.gravidade, (mt.contexto || []).join("/"), mt.evidencia, (mt.idadeMin || mt.idadeMax) ? (mt.idadeMin || 0) + "–" + (mt.idadeMax || "∞") + " anos" : "", mt.cid].filter(Boolean).join(" | ") }),
        el("div", { class: "note", text: [(mt.modulos || []).map(function (k) { return MODNAME[k]; }).join(", "), m.usos + " uso(s)", m.estrelas ? "★ " + m.estrelas.toFixed(1) : "", m.polegar ? (m.polegar > 0 ? "👍 +" : "👎 ") + m.polegar : "", m.pctMod.length ? "modificação média " + Math.round(m.pctMod.reduce(function (s, x) { return s + x; }, 0) / m.pctMod.length) + "%" : "", p ? "condição: " + p.n : ""].filter(Boolean).join(" · ") }),
        el("div", { class: "btns" },
          m.nivel !== "revisor" ? el("button", { class: "btn sm primary", type: "button", text: "Aplicar", onclick: function () { openApply(m); } }) : null,
          el("button", { class: "btn sm", type: "button", text: m.nivel === "dono" ? "Versões" : "Ver", onclick: function () { openVersions(m); } }),
          m.nivel === "dono" ? el("button", { class: "btn sm", type: "button", text: "Compartilhar", onclick: function () { openShare(m); } }) : null,
          m.nivel !== "dono" && m.nivel !== "revisor" ? el("button", { class: "btn sm", type: "button", text: "Fazer cópia", onclick: function () { fork(m); } }) : null,
          m.nivel === "colab" ? el("button", { class: "btn sm", type: "button", text: "Sugerir melhoria", onclick: function () { suggest(m); } }) : null,
          m.nivel === "revisor" && ME && ME.admin ? el("button", { class: "btn sm primary", type: "button", text: "Revisar publicação", onclick: function () { openReview(m); } }) : null));
    }
    [q].forEach(function (x) { x.addEventListener("input", draw); }); [ctxSel, ord, esc, idadeCb].forEach(function (x) { x.addEventListener("change", draw); });
    s.b.append(el("div", { class: "box" }, q, el("div", { class: "grid" }, ctxSel, ord, esc), el("label", { class: "check" }, idadeCb, " só idade compatível com o paciente atual" + (ia != null ? " (" + (ia < 2 ? Math.round(ia * 12) + " meses" : Math.floor(ia) + " anos") + ")" : " (idade não informada)"))), res);
    s.f.append(el("button", { class: "btn", type: "button", text: "Painel de uso", onclick: function () { openDash(list); } }),
      el("button", { class: "btn", type: "button", text: "Entrar com código", onclick: joinCode }),
      el("button", { class: "btn", type: "button", text: "Exportar / importar", onclick: function () { openExport(list); } }),
      el("button", { class: "btn", type: "button", text: "Lista do hospital", onclick: openPadrao }),
      C().proto ? el("button", { class: "btn primary", type: "button", text: "Salvar atendimento como modelo", onclick: function () { openSave(null); } }) : null);
    draw(); setTimeout(function () { q.focus(); }, 50);
  }
  async function headOf(m, ramo) { var vs = await call("versions", { id: m.id }); var r = ramo || m.ramo_principal || "principal"; return { vs: vs, head: vs.find(function (v) { return v.ramo === r; }) || vs[0] }; }

  async function openApply(m) {
    var s = dialog("Aplicar \"" + m.nome + "\"", "o motor do app recalcula as doses para o paciente atual");
    var h = await headOf(m), v = h.head; if (!v) { s.b.appendChild(el("div", { class: "note", text: "Modelo sem versão." })); return; }
    var ramos = {}; h.vs.forEach(function (x) { ramos[x.ramo] = ramos[x.ramo] || x; });
    var rs = el("select", { class: "sel", "aria-label": "Ramo" }, Object.keys(ramos).map(function (r) { return el("option", { value: r, text: r === "principal" ? "versão principal" : "ramo: " + r }); })); rs.value = v.ramo;
    var opt = el("input", { type: "checkbox" });
    var c = C(), pac = c.pac, alert = [];
    if (!pac.peso) alert.push("Peso não informado: medicamentos com dose por peso não serão calculados.");
    if (!pac.idade && !pac.nasc) alert.push("Idade não informada.");
    var cont = v.conteudo || {}, info = cont.info || {};
    s.b.append(el("div", { class: "box" }, el("div", { class: "note", text: "Paciente: " + [pac.idade ? pac.idade + " " + pac.idUn : "", pac.peso ? pac.peso + " kg" : "", pac.alergias ? "alergia: " + pac.alergias : "sem alergia registrada"].filter(Boolean).join(" · ") }),
      alert.map(function (a) { return el("div", { class: "warn", text: "⚠ " + a }); }),
      Object.keys(ramos).length > 1 ? field("Usar", rs) : null, el("label", { class: "check" }, opt, " incluir também os medicamentos opcionais"),
      el("div", { class: "note", text: "Módulos: " + Object.keys(cont.mods || {}).map(function (k) { return MODNAME[k]; }).join(", ") })),
      Object.keys(info).length ? el("div", { class: "box" }, el("h3", { text: "Informações do modelo" }), INFO.filter(function (x) { return info[x[0]]; }).map(function (x) { return el("div", null, el("b", { text: x[1] + ": " }), el("span", { text: info[x[0]], style: "white-space:pre-wrap" })); }),
        (cont.materiais || []).length ? el("div", { class: "note" }, "Materiais: ", cont.materiais.map(function (mm) { return el("a", { href: mm.url, target: "_blank", rel: "noopener", text: mm.t + " ", download: /^data:/.test(mm.url) ? mm.t : null }); })) : null) : null);
    var st = el("div", { class: "status" }); s.b.appendChild(st);
    s.f.append(el("button", { class: "btn primary", type: "button", text: "Aplicar ao paciente", onclick: async function () {
      var vv = ramos[rs.value] || v; s.dlg.close();
      var log = await applyTemplate(m, vv, { optional: opt.checked });
      var r = dialog("Modelo aplicado", "revise cada documento antes de emitir"); r.b.appendChild(el("div", { class: "box" }, log.length ? log.map(function (x) { return el("div", { class: /^⛔/.test(x) ? "err" : /^⚠/.test(x) ? "warn" : "note", text: x }); }) : el("div", { class: "note", text: "Tudo aplicado." }), el("div", { class: "note", text: "Os alertas de segurança (rim, gestação, controle especial) e o \"Revisei este documento\" continuam valendo." })));
      r.f.appendChild(el("button", { class: "btn primary", type: "button", text: "Continuar", onclick: function () { r.dlg.close(); } }));
    } }));
  }

  /* ---------- versões / diff ---------- */
  function flat(cont) {
    var o = {}, mods = (cont && cont.mods) || {};
    ["amb", "alta"].forEach(function (w) { var R = mods[w]; if (!R) return; (R.itens || []).forEach(function (it) { o[MODNAME[w] + " · " + (it.drug && D.drugs[it.drug] ? D.drugs[it.drug].n : it.med)] = [it.med, it.pos, it.qtd, it.essencial === false ? "opcional" : "essencial", (it.alt || []).map(function (a) { return D.drugs[a] ? D.drugs[a].n : a; }).join("/")].filter(Boolean).join(" | "); }); ["cuidados", "alarme", "retorno", "naoUsar"].forEach(function (k) { if (R[k]) o[MODNAME[w] + " · " + k] = R[k]; }); });
    if (mods.hosp) { Object.keys(mods.hosp.sel || {}).forEach(function (k) { o["Hospitalar · " + (D.drugs[k] ? D.drugs[k].n : k)] = JSON.stringify(mods.hosp.sel[k]); }); Object.keys(mods.hosp.cuid || {}).forEach(function (k) { o["Hospitalar · cuidado " + k] = "sim"; }); (mods.hosp.extra || []).forEach(function (x, i) { o["Hospitalar · extra " + (i + 1)] = typeof x === "string" ? x : JSON.stringify(x); }); if (mods.hosp.dieta) o["Hospitalar · dieta"] = mods.hosp.dieta + " " + (mods.hosp.dietaTxt || ""); }
    ["lab", "comp"].forEach(function (k) { if (mods[k]) Object.keys(mods[k].sel || {}).forEach(function (e) { o[MODNAME[k] + " · " + e] = "pedido"; }); });
    if (mods.ctrl) (mods.ctrl.itens || []).forEach(function (x) { o["Controle · " + x.med] = x.pos; });
    if (mods.docs && mods.docs.atestado) o["Atestado"] = (mods.docs.atestado.dias || "") + " dia(s) " + (mods.docs.atestado.texto || "");
    Object.keys(cont.info || {}).forEach(function (k) { var l = INFO.find(function (x) { return x[0] === k; }); o["Info · " + (l ? l[1] : k)] = cont.info[k]; });
    return o;
  }
  function diffView(a, b) {
    var A = flat(a), B = flat(b), keys = Object.keys(Object.assign({}, A, B)).sort(), t = el("table", { class: "psx-diff", style: "width:100%;border-collapse:collapse;font-size:12px" });
    t.appendChild(el("tr", null, el("th", { text: "Item", style: "text-align:left" }), el("th", { text: "Versão A", style: "text-align:left" }), el("th", { text: "Versão B", style: "text-align:left" })));
    var n = 0;
    keys.forEach(function (k) { var x = A[k], y = B[k]; if (x === y) return; n++; var bg = x == null ? "rgba(34,160,90,.15)" : y == null ? "rgba(210,60,60,.15)" : "rgba(230,170,30,.18)";
      t.appendChild(el("tr", { style: "background:" + bg + ";border-top:1px solid var(--line,#ddd)" }, el("td", { text: k, style: "padding:4px;vertical-align:top" }), el("td", { text: x == null ? "—" : x, style: "padding:4px;white-space:pre-wrap;vertical-align:top" }), el("td", { text: y == null ? "—" : y, style: "padding:4px;white-space:pre-wrap;vertical-align:top" }))); });
    return n ? t : el("div", { class: "note", text: "Sem diferenças." });
  }
  async function openVersions(m) {
    var s = dialog("Versões de \"" + m.nome + "\"", m.nivel === "dono" ? "histórico, ramos, comparação e restauração" : "somente leitura");
    var h = await headOf(m), vs = h.vs, own = m.nivel === "dono", A = null, B = null, cmp = el("div");
    var heads = {}; vs.forEach(function (v) { heads[v.ramo] = heads[v.ramo] || v; });
    var num = {}; vs.slice().reverse().forEach(function (v, i) { num[v.id] = i + 1; });
    if (own) {
      var rb = Object.keys(heads).filter(function (r) { return r !== "principal"; });
      s.b.appendChild(el("div", { class: "box" }, el("h3", { text: "Ramos" }), el("div", { class: "note", text: "principal → v" + (heads.principal ? num[heads.principal.id] : "?") + (rb.length ? " · " + rb.map(function (r) { return r + " → v" + num[heads[r].id]; }).join(" · ") : " · nenhum ramo de teste") }),
        rb.map(function (r) { return el("button", { class: "btn sm", type: "button", text: "Consolidar \"" + r + "\" na principal", onclick: async function () { if (!confirm("Levar o conteúdo do ramo \"" + r + "\" para a versão principal?")) return; await call("commit", { id: m.id, ramo: "principal", pai: heads[r].id, mensagem: "Consolidação do ramo " + r, conteudo: heads[r].conteudo, meta: heads[r].meta }); toast("Ramo consolidado."); openVersions(m); } }); }),
        el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Salvar atendimento atual como nova versão", onclick: function () { openSave(null, Object.assign({}, m, { headV: heads.principal, ramo: "principal" })); } }),
          el("button", { class: "btn sm", type: "button", text: "Arquivar modelo", onclick: async function () { if (!confirm("Arquivar \"" + m.nome + "\"? Ele some da lista (o histórico fica guardado).")) return; await call("archive", { id: m.id }); openLibrary(); } }),
          m.publicacao !== "publicado" && m.publicacao !== "pendente" ? el("button", { class: "btn sm", type: "button", text: "Enviar à biblioteca institucional", onclick: async function () { await call("update", { id: m.id, patch: { publicacao: "pendente" } }); toast("Enviado para aprovação dos administradores."); openLibrary(); } }) : null)));
      var sug = await call("suggestions", { id: m.id }).catch(function () { return []; });
      var pend = sug.filter(function (x) { return x.status === "pendente"; });
      if (pend.length) s.b.appendChild(el("div", { class: "box" }, el("h3", { text: "Sugestões de colegas" }), pend.map(function (sg) { return el("div", { class: "drow" }, el("div", { class: "line", text: (sg.mensagem || "Sugestão") + " — " + new Date(sg.created_at).toLocaleString("pt-BR") }), diffView(heads.principal && heads.principal.conteudo, sg.conteudo),
        el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Incorporar", onclick: async function () { await call("commit", { id: m.id, ramo: "principal", pai: heads.principal && heads.principal.id, mensagem: "Sugestão incorporada: " + (sg.mensagem || ""), conteudo: sg.conteudo, meta: m.meta }); await call("decide", { sid: sg.id, status: "aceita" }); toast("Sugestão incorporada."); openVersions(m); } }),
          el("button", { class: "btn sm ghost", type: "button", text: "Recusar", onclick: async function () { await call("decide", { sid: sg.id, status: "recusada" }); openVersions(m); } }))); })));
    }
    var hist = el("div", { class: "box" }, el("h3", { text: "Histórico (marque A e B para comparar)" }));
    vs.forEach(function (v) {
      var ra = el("input", { type: "radio", name: "psxA", "aria-label": "A", onchange: function () { A = v; doCmp(); } }), rbb = el("input", { type: "radio", name: "psxB", "aria-label": "B", onchange: function () { B = v; doCmp(); } });
      hist.appendChild(el("div", { class: "drow" }, el("div", { class: "line" }, ra, " A ", rbb, " B · ", el("b", { text: "v" + num[v.id] }), " · " + v.ramo + " · " + new Date(v.created_at).toLocaleString("pt-BR") + " · " + (v.mensagem || "") + (v.hash ? " · #" + v.hash.slice(0, 7) : "")),
        own ? el("div", { class: "btns" }, el("button", { class: "btn sm", type: "button", text: "Restaurar esta versão", onclick: async function () { if (!confirm("Criar nova versão igual à v" + num[v.id] + "?")) return; await call("commit", { id: m.id, ramo: v.ramo, pai: (heads[v.ramo] || {}).id, mensagem: "Restaurado da v" + num[v.id], conteudo: v.conteudo, meta: v.meta }); toast("Versão restaurada."); openVersions(m); } }),
          el("button", { class: "btn sm ghost", type: "button", text: "Criar ramo daqui", onclick: async function () { var r = prompt("Nome do ramo de teste (ex.: dose-alta):"); if (!r) return; r = r.trim().slice(0, 40); if (!r || r === "principal") return; await call("commit", { id: m.id, ramo: r, pai: v.id, mensagem: "Ramo criado a partir da v" + num[v.id], conteudo: v.conteudo, meta: v.meta }); toast("Ramo \"" + r + "\" criado. Ao aplicar, escolha o ramo."); openVersions(m); } })) : null));
    });
    if (vs.length > 1) { A = vs[1]; B = vs[0]; }
    function doCmp() { cmp.textContent = ""; if (A && B) cmp.append(el("h3", { text: "Comparação" }), diffView(A.conteudo, B.conteudo)); }
    s.b.append(hist, el("div", { class: "box" }, cmp)); doCmp();
    s.f.append(el("button", { class: "btn", type: "button", text: "Voltar", onclick: openLibrary }));
  }

  /* ---------- compartilhamento ---------- */
  async function openShare(m) {
    var s = dialog("Compartilhar \"" + m.nome + "\"", "só para quem tem conta no app");
    var email = el("input", { class: "in", type: "email", placeholder: "e-mail do colega" }), niv = el("select", { class: "sel", "aria-label": "Nível" }, el("option", { value: "leitura", text: "só leitura (pode fazer cópia)" }), el("option", { value: "colab", text: "colaborativo (pode sugerir melhorias)" }));
    var st = el("div", { class: "status" }), lst = el("div");
    async function drawL() { lst.textContent = ""; var sh = await call("shares", { id: m.id }); if (!sh.length) lst.appendChild(el("div", { class: "note", text: "Ainda não compartilhado." })); sh.forEach(function (x) { lst.appendChild(el("div", { class: "note" }, "Colega " + String(x.user_id).slice(0, 8) + "… · " + (x.nivel === "colab" ? "colaborativo" : "só leitura") + " ", el("button", { class: "btn sm ghost", type: "button", text: "remover", onclick: async function () { await call("unshare", { shareId: x.id }); drawL(); } }))); }); }
    s.b.append(el("div", { class: "box" }, el("h3", { text: "Convidar por e-mail" }), el("div", { class: "grid" }, email, niv), el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Convidar", onclick: async function () { try { var ok = await call("invite", { id: m.id, email: email.value, nivel: niv.value }); st.textContent = ok ? "Compartilhado. O colega já vê o modelo em \"Meus modelos\"." : "Não há conta no app com esse e-mail."; st.className = "status " + (ok ? "ok" : "err"); drawL(); } catch (e) { st.textContent = e.message; st.className = "status err"; } } })), st),
      el("div", { class: "box" }, el("h3", { text: "Código de acesso (só leitura)" }), el("div", { class: "line mono", text: m.codigo || "—" }), el("div", { class: "note", text: "Quem tiver conta e digitar este código em \"Entrar com código\" recebe acesso de leitura." })),
      el("div", { class: "box" }, el("h3", { text: "Com quem está compartilhado" }), lst));
    s.f.append(el("button", { class: "btn", type: "button", text: "Voltar", onclick: openLibrary }));
    drawL();
  }
  async function joinCode() { var c = prompt("Código do modelo:"); if (!c) return; try { var id = await call("join", { codigo: c }); toast(id ? "Modelo adicionado à sua lista." : "Código não encontrado."); openLibrary(); } catch (e) { toast(e.message); } }
  async function fork(m) { var h = await headOf(m); if (!h.head) return; await call("create", { nome: m.nome + " (minha cópia)", meta: m.meta, conteudo: h.head.conteudo, mensagem: "Cópia de modelo compartilhado", origem_id: m.id }); toast("Cópia criada em \"Meus modelos\"."); openLibrary(); }
  async function suggest(m) {
    if (!C().proto) { toast("Monte o atendimento com sua melhoria e tente de novo."); return; }
    var h = await headOf(m), mods = (m.meta && m.meta.modulos) || Object.keys((h.head.conteudo || {}).mods || {});
    var cont = Object.assign(clone(h.head.conteudo), { mods: capture(mods) });
    var s = dialog("Sugerir melhoria", "o autor revisa e decide"); var msg = el("input", { class: "in", placeholder: "o que você sugere e por quê" });
    s.b.append(el("div", { class: "box" }, el("div", { class: "note", text: "Sua sugestão usa o atendimento atual nos módulos: " + mods.map(function (k) { return MODNAME[k]; }).join(", ") }), diffView(h.head.conteudo, cont), field("Mensagem ao autor", msg)));
    s.f.append(el("button", { class: "btn primary", type: "button", text: "Enviar sugestão", onclick: async function () { await call("suggest", { id: m.id, base: h.head.id, mensagem: msg.value, conteudo: cont }); toast("Sugestão enviada ao autor."); openLibrary(); } }));
  }
  async function openReview(m) {
    var s = dialog("Revisão para a biblioteca", m.nome); var h = await headOf(m), obs = el("textarea", { class: "in", rows: "2", placeholder: "observação ao autor" });
    s.b.append(el("div", { class: "box" }, diffView({}, h.head && h.head.conteudo)), field("Observação", obs));
    var dec = function (ap) { return async function () { await call("review", { id: m.id, aprovar: ap, obs: obs.value }); toast(ap ? "Publicado na biblioteca." : "Recusado."); openLibrary(); }; };
    s.f.append(el("button", { class: "btn", type: "button", text: "Recusar", onclick: dec(false) }), el("button", { class: "btn primary", type: "button", text: "Aprovar e publicar", onclick: dec(true) }));
  }
  function openPadrao() {
    var s = dialog("Lista de padronização do hospital", "remédios fora da lista são trocados pela alternativa do modelo");
    var cfg = read("psx.cfg", {}) || {}, t = el("textarea", { class: "in", rows: "12", placeholder: "um remédio por linha (deixe vazio para não usar)", value: cfg.padronizacao || "" });
    s.b.append(field("Remédios disponíveis", t));
    s.f.append(el("button", { class: "btn primary", type: "button", text: "Salvar", onclick: function () { var c2 = read("psx.cfg", {}) || {}; c2.padronizacao = t.value; write("psx.cfg", c2); toast("Lista salva na sua conta."); openLibrary(); } }));
  }

  /* ---------- exportação / importação ---------- */
  async function aes(mode, pass, data, salt, iv) {
    var enc = new TextEncoder(), km = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    return crypto.subtle[mode]({ name: "AES-GCM", iv: iv }, key, data);
  }
  var b64 = function (buf) { var s = "", a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
  var unb64 = function (s) { var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; };
  function dl(name, text, type) { var u = URL.createObjectURL(new Blob([text], { type: type })), a = el("a", { href: u, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); }
  var xesc = function (s) { return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); };
  function toXml(v, tag) { if (Array.isArray(v)) return "<" + tag + ">" + v.map(function (x) { return toXml(x, "item"); }).join("") + "</" + tag + ">"; if (v && typeof v === "object") return "<" + tag + ">" + Object.keys(v).map(function (k) { return toXml(v[k], k.replace(/[^a-zA-Z0-9_]/g, "_") || "k"); }).join("") + "</" + tag + ">"; return "<" + tag + ">" + xesc(v) + "</" + tag + ">"; }
  async function openExport(list) {
    var s = dialog("Exportar / importar modelos", "backup e migração entre instalações");
    var mine = list.filter(function (m) { return m.nivel === "dono"; }), fmt = el("select", { class: "sel", "aria-label": "Formato" }, el("option", { value: "json", text: "JSON (completo, reimportável)" }), el("option", { value: "xml", text: "XML" }), el("option", { value: "csv", text: "CSV (planilha de itens)" }));
    var pass = el("input", { class: "in", type: "password", placeholder: "senha para criptografar (opcional, JSON)", autocomplete: "new-password" }), st = el("div", { class: "status" });
    var file = el("input", { type: "file", accept: ".json,application/json", "aria-label": "Arquivo para importar" }), ipass = el("input", { class: "in", type: "password", placeholder: "senha (se o arquivo for criptografado)", autocomplete: "off" });
    s.b.append(el("div", { class: "box" }, el("h3", { text: "Exportar " + mine.length + " modelo(s) seus, com todas as versões" }), el("div", { class: "grid" }, fmt, pass), el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Exportar", onclick: async function () {
      st.textContent = "Preparando…"; st.className = "status";
      var out = []; for (var i = 0; i < mine.length; i++) { var vs = await call("versions", { id: mine[i].id }); out.push({ nome: mine[i].nome, meta: mine[i].meta, versoes: vs.slice().reverse().map(function (v) { return { ramo: v.ramo, mensagem: v.mensagem, conteudo: v.conteudo, meta: v.meta, hash: v.hash, criado: v.created_at }; }) }); }
      var pack = { formato: "prescrimed-modelos", versao: 1, exportado: new Date().toISOString(), modelos: out }, stamp = new Date().toISOString().slice(0, 10);
      if (fmt.value === "json") {
        var txt = JSON.stringify(pack, null, 2);
        if (pass.value) { var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), ct = await aes("encrypt", pass.value, new TextEncoder().encode(txt), salt, iv); txt = JSON.stringify({ formato: "prescrimed-modelos-cripto", alg: "AES-256-GCM/PBKDF2-SHA256-200k", salt: b64(salt), iv: b64(iv), dados: b64(ct) }); }
        dl("modelos-" + stamp + ".json", txt, "application/json");
      } else if (fmt.value === "xml") dl("modelos-" + stamp + ".xml", '<?xml version="1.0" encoding="UTF-8"?>' + toXml(pack, "prescrimed"), "application/xml");
      else { var rows = [["modelo", "versao", "ramo", "item", "conteudo"]]; out.forEach(function (m) { m.versoes.forEach(function (v, i) { var f = flat(v.conteudo); Object.keys(f).forEach(function (k) { rows.push([m.nome, "v" + (i + 1), v.ramo, k, f[k]]); }); }); });
        dl("modelos-" + stamp + ".csv", "\ufeff" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\n"), "text/csv"); }
      st.textContent = "Exportado."; st.className = "status ok";
    } }))),
    el("div", { class: "box" }, el("h3", { text: "Importar (arquivo JSON exportado pelo app)" }), file, ipass, el("div", { class: "btns" }, el("button", { class: "btn sm", type: "button", text: "Importar", onclick: async function () {
      var f = file.files[0]; if (!f) { st.textContent = "Escolha o arquivo."; st.className = "status err"; return; }
      try { var j = JSON.parse(await f.text());
        if (j.formato === "prescrimed-modelos-cripto") { if (!ipass.value) throw { message: "Arquivo criptografado: informe a senha." }; var pt = await aes("decrypt", ipass.value, unb64(j.dados), unb64(j.salt), unb64(j.iv)).catch(function () { throw { message: "Senha incorreta ou arquivo alterado." }; }); j = JSON.parse(new TextDecoder().decode(pt)); }
        if (j.formato !== "prescrimed-modelos" || !Array.isArray(j.modelos)) throw { message: "Arquivo não reconhecido." };
        var n = 0; for (var i = 0; i < j.modelos.length; i++) { var m = j.modelos[i], vs = m.versoes || []; if (!vs.length) continue; var r = await call("create", { nome: m.nome, meta: m.meta, conteudo: vs[0].conteudo, mensagem: "Importado: " + (vs[0].mensagem || "") }); for (var k = 1; k < vs.length; k++) await call("commit", { id: r.modelo.id, ramo: vs[k].ramo, mensagem: "Importado: " + (vs[k].mensagem || ""), conteudo: vs[k].conteudo, meta: vs[k].meta }); n++; }
        st.textContent = n + " modelo(s) importado(s)."; st.className = "status ok";
      } catch (e) { st.textContent = e.message || "Falha na importação."; st.className = "status err"; }
    } }))), st);
    s.f.append(el("button", { class: "btn", type: "button", text: "Voltar", onclick: openLibrary }));
  }

  /* ---------- painel ---------- */
  async function openDash(list) {
    var s = dialog("Painel de uso dos modelos", "seus dados");
    var d = await call("stats"), usos = d.usos || [], tempos = d.tempos || [];
    var months = []; for (var i = 5; i >= 0; i--) { var dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i); months.push(dt.toISOString().slice(0, 7)); }
    var cnt = months.map(function (mo) { return usos.filter(function (u) { return String(u.created_at).slice(0, 7) === mo; }).length; });
    var cv = el("canvas", { width: "640", height: "180", "aria-label": "Usos por mês", role: "img", style: "width:100%;max-width:640px" });
    var avg = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; };
    var tc = avg(tempos.filter(function (t) { return t.com_modelo; }).map(function (t) { return t.segundos; })), ts = avg(tempos.filter(function (t) { return !t.com_modelo; }).map(function (t) { return t.segundos; }));
    var fmtT = function (x) { return x == null ? "sem dados" : Math.floor(x / 60) + " min " + Math.round(x % 60) + " s"; };
    var mod = avg(usos.filter(function (u) { return u.pct_mod != null; }).map(function (u) { return +u.pct_mod; }));
    s.b.append(el("div", { class: "box" }, el("h3", { text: "Usos por mês" }), cv),
      el("div", { class: "box" }, el("h3", { text: "Eficiência" }), el("div", { class: "note", text: "Tempo médio com modelo: " + fmtT(tc) + " · sem modelo: " + fmtT(ts) + (tc && ts ? " · economia de " + Math.round(100 * (1 - tc / ts)) + "%" : "") }), el("div", { class: "note", text: "Taxa média de modificação após aplicar: " + (mod == null ? "sem dados" : Math.round(mod) + "%") + " (acima de 40% sugere criar uma variante)." })),
      el("div", { class: "box" }, el("h3", { text: "Por modelo" }), list.filter(function (m) { return m.nivel === "dono"; }).map(function (m) {
        var u = usos.filter(function (x) { return x.modelo_id === m.id; }), pm = avg(u.filter(function (x) { return x.pct_mod != null; }).map(function (x) { return +x.pct_mod; })), stv = avg(u.filter(function (x) { return x.estrelas; }).map(function (x) { return x.estrelas; }));
        var mt = m.meta || {}, out = mt.proto && mt.protoHash && protoHash(mt.proto) !== mt.protoHash;
        return el("div", { class: "drow" }, el("div", { class: "line", text: m.nome }), el("div", { class: "det", text: [u.length + " uso(s)", stv ? "★ " + stv.toFixed(1) : "", pm != null ? "modificação " + Math.round(pm) + "%" : "", pm != null && pm > 40 ? "→ considere refinar ou criar variante" : ""].filter(Boolean).join(" · ") }), out ? el("div", { class: "warn", text: "⚠ O protocolo da condição mudou desde que o modelo foi salvo — revise." }) : null);
      })));
    s.f.append(el("button", { class: "btn", type: "button", text: "Voltar", onclick: openLibrary }));
    var g = cv.getContext("2d"), max = Math.max.apply(null, cnt.concat([1])), cs = getComputedStyle(document.body), fg = cs.color || "#333", W = 640, H = 180, bw = W / months.length;
    g.font = "12px system-ui"; g.fillStyle = fg;
    cnt.forEach(function (c, i) { var bh = (H - 40) * c / max; g.globalAlpha = .75; g.fillRect(i * bw + 14, H - 22 - bh, bw - 28, bh); g.globalAlpha = 1; g.fillText(months[i].slice(5) + "/" + months[i].slice(2, 4), i * bw + 14, H - 6); g.fillText(String(c), i * bw + 14, H - 26 - bh); });
  }

  /* ---------- pontos de entrada ---------- */
  function homeBtn() {
    var bar = document.querySelector("#app [data-psx-home]") || document.querySelector("#app .hero"); if (!bar || bar.querySelector("[data-psx-tpl]")) return;
    if (!document.getElementById("homeQ")) return;
    bar.appendChild(el("button", { class: "btn", type: "button", "data-psx-tpl": "1", text: "Meus modelos", onclick: openLibrary }));
  }
  function condBtn() {
    var grid = document.querySelector("#app .mods"); if (!grid || document.querySelector("#app [data-psx-tpl-cond]")) return;
    grid.parentNode.insertBefore(el("div", { class: "btns", "data-psx-tpl-cond": "1", style: "margin:8px 0" },
      el("button", { class: "btn", type: "button", text: "Aplicar modelo", onclick: openLibrary }),
      el("button", { class: "btn", type: "button", text: "Salvar atendimento como modelo", onclick: function () { openSave(null); } })), grid);
  }
  var TITLE2MOD = { "Prescrição ambulatorial": "alta", "Prescrição hospitalar": "hosp", "Exames laboratoriais": "lab", "Imagem e outros exames": "comp", "Controle especial": "ctrl", "Atestados e declarações": "docs" };
  function modalBtn() {
    [["modal", "mFoot", function () { return title(); }], ["lovableDocumentsModal", "lovableDocumentsFoot", function () { return "Atestados e declarações"; }]].forEach(function (cfg) {
      var m = document.getElementById(cfg[0]); if (!m || !m.open) return; var f = document.getElementById(cfg[1]); if (!f) return;
      var mod = TITLE2MOD[cfg[2]()]; var ex = f.querySelector("[data-psx-tpl-save]");
      if (!mod) { if (ex) ex.remove(); return; } if (ex && ex.getAttribute("data-psx-tpl-save") === mod) return; if (ex) ex.remove();
      f.insertBefore(el("button", { class: "btn", type: "button", "data-psx-tpl-save": mod, text: "Salvar como modelo", onclick: function () { openSave(mod); } }), f.firstChild);
    });
  }
  var busy = false;
  new MutationObserver(function () { if (busy) return; busy = true; requestAnimationFrame(function () { try { homeBtn(); condBtn(); modalBtn(); } finally { busy = false; } }); }).observe(document.body, { childList: true, subtree: true });
  homeBtn(); condBtn(); pendingBar();
  window.PSX_TPL = { open: openLibrary, save: openSave, capture: capture, flat: flat, applyTemplate: applyTemplate };
})();
