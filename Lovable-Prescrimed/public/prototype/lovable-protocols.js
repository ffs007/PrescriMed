/* Protocolos clínicos em três camadas (pessoal, equipe, institucional).
   Extensão aditiva carregada depois de app.js e lovable-templates.js. Grava pelo __psxBridge.prot (RLS + gatilhos).
    - Base institucional = protocolos do PrescriMed (cópia única, travados).
   - Documento rico: escopo, objetivos, fluxograma interativo, remédios com alternativas, critérios, exames, referências, autoria/CRM, revisão.
   - Aplicação pelo motor do app (via PSX_TPL.applyTemplate, sem rastreio de modelo).
   - Sugestões bottom-up com prazo e recusa justificada; changelog colorido; quiz para mudança crítica; painel e equipes. */
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
  async function call(op, a) { var b = bridge(); if (!b || !b.prot) throw { message: "Faça login para usar os protocolos." }; return b.prot(op, a || {}); }
  var clone = function (x) { return x == null ? x : JSON.parse(JSON.stringify(x)); };
  var lines = function (s) { return String(s || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var fmtD = function (s) { if (!s) return "—"; var d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("pt-BR"); };
  var CAMADA = { pessoal: "Pessoal", equipe: "Equipe", institucional: "Institucional" };
  var STATUS = { rascunho: "rascunho", pendente: "aguardando aprovação", aprovado: "aprovado", recusado: "recusado" };
  var TIPO_EQ = ["plantão diurno", "plantão noturno", "ambulatório de especialidade", "enfermaria", "UTI pediátrica/neonatal", "outro"];
  var CTX = ["ambulatório", "pronto-socorro", "internação", "UTI"];

  /* ---------- exames: nome pelo SIGTAP ---------- */
  var SIG = null;
  function exName(code) {
    if (!SIG) { SIG = {}; [window.SIGTAP_LAB, window.SIGTAP_IMG].forEach(function (t) { if (typeof t === "string") t.split("\n").forEach(function (l) { var i = l.indexOf("|"); if (i > 0) SIG[l.slice(0, i)] = l.slice(i + 1); }); }); }
    return SIG[code] ? SIG[code].charAt(0) + SIG[code].slice(1).toLowerCase() : code;
  }

  /* ---------- diálogo ---------- */
  function dialog(titleTxt, sub) {
    var dlg = document.getElementById("psxProtModal");
    if (!dlg) {
      dlg = el("dialog", { class: "modal", id: "psxProtModal", "aria-labelledby": "psxProtTitle" });
      dlg.innerHTML = '<div class="mhead"><div><h2 id="psxProtTitle"></h2><small id="psxProtSub"></small></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="mbody" id="psxProtBody"></div><div class="mfoot" id="psxProtFoot"></div>';
      document.body.appendChild(dlg); dlg.querySelector(".x").addEventListener("click", function () { dlg.close(); });
    }
    dlg.querySelector("#psxProtTitle").textContent = titleTxt; dlg.querySelector("#psxProtSub").textContent = sub || "";
    var b = dlg.querySelector("#psxProtBody"), f = dlg.querySelector("#psxProtFoot"); b.textContent = ""; f.textContent = "";
    if (!dlg.open) dlg.showModal(); b.scrollTop = 0;
    return { dlg: dlg, b: b, f: f };
  }
  function field(label, input) { return el("label", { class: "fld", style: "display:block;margin:6px 0" }, el("span", { class: "note", text: label, style: "display:block;margin-bottom:2px" }), input); }
  var inp = function (v, ph) { return el("input", { class: "inp", type: "text", value: v || "", placeholder: ph || "", style: "width:100%" }); };
  var area = function (v, ph, rows) { return el("textarea", { class: "inp", rows: rows || 3, placeholder: ph || "", style: "width:100%" , text: v || "" }); };
  var btn = function (t, fn, cls) { return el("button", { class: "btn sm " + (cls || ""), type: "button", text: t, onclick: fn }); };
  var badge = function (t, color) { return el("span", { class: "chip", text: t, style: "font-size:11px;padding:1px 8px;margin-right:4px;" + (color ? "border-color:" + color + ";color:" + color : "") }); };

  /* ---------- estado ---------- */
  var ME = null, LIST = [], TEAMS = null;
  async function loadMe() { if (!ME) ME = await call("me"); return ME; }
  async function loadList() { LIST = await call("list"); return LIST; }
  async function loadTeams() { TEAMS = await call("teams"); return TEAMS; }
  function papelEm(eq) { var m = (ME.membros || []).find(function (x) { return x.equipe_id === eq; }); return m ? m.papel : null; }
  function nivel(p) {
    if (ME.admin) return "admin";
    if (p.camada === "pessoal") return p.owner === ME.uid ? "dono" : null;
    if (p.camada === "equipe") return papelEm(p.equipe_id) || (p.owner === ME.uid ? "leitor" : null);
    return "leitor";
  }
  function podeEditar(p) { var n = nivel(p); if (p.travado && n !== "admin") return false; return ["admin", "dono", "coordenador", "editor"].indexOf(n) >= 0; }
  function podeAprovar(p) { var n = nivel(p); return p.camada === "institucional" ? n === "admin" : p.camada === "equipe" ? (n === "admin" || n === "coordenador") : false; }
  function teamName(id) { var t = TEAMS && TEAMS.equipes.find(function (e) { return e.id === id; }); return t ? t.nome : "equipe"; }

  /* ---------- semente institucional (cópia única) ---------- */
  function fromProto(p) {
    var meds = [];
    (p.cls || []).forEach(function (c) { var cl = D.classes[c]; (cl && cl.d || []).forEach(function (id) { var dr = D.drugs[id]; if (!dr || meds.some(function (m) { return m.drug === id; })) return; var a = (dr.a || [])[0]; meds.push({ drug: id, nome: dr.n, apres: a ? a.ap : "", pos: a && a.pos && a.pos[0] ? a.pos[0].t : "", alt: [], essencial: true, classe: cl.n }); }); });
    return { palavras: String(p.alias || "").split(/\s+/).filter(Boolean), resumo: "", cid: p.cid || [], categoria: p.cat,
      escopo: { idadeMin: "", idadeMax: "", inclui: "", exclui: "", contextos: ["pronto-socorro"] }, objetivos: { primarios: "", secundarios: "" },
      fluxo: { nodes: [] }, meds: meds, criterios: { internacao: "", alta: "", uti: "" },
      exames: (p.lab || []).map(function (c) { return { codigo: c, grupo: "lab", tipo: "essencial", quando: "na admissão" }; }).concat((p.comp || []).map(function (c) { return { codigo: c, grupo: "comp", tipo: "opcional", quando: "se indicado" }; })),
      refs: { primarias: [], secundarias: [] }, autor: { nome: "PrescriMed", crm: "" }, quiz: [], indicadores: { metaAdesao: 80 } };
  }
  async function seedIfNeeded() {
    if (!ME.admin) return;
    var have = {}; LIST.forEach(function (p) { if (p.camada === "institucional" && p.proto_origem) have[p.proto_origem] = 1; });
    var items = D.protocols.filter(function (p) { return !have[p.id] && !/^(usr_|__)/.test(p.id); }).map(function (p) { return { proto_origem: p.id, titulo: p.n, conteudo: fromProto(p) }; });
    if (!items.length) return;
    toast("Copiando " + items.length + " protocolos do PrescriMed para a base institucional…");
    for (var i = 0; i < items.length; i += 10) await call("seed", { items: items.slice(i, i + 10) });
    await loadList();
  }

  /* ---------- busca tolerante ---------- */
  function lev(a, b) { if (a === b) return 0; var m = a.length, n = b.length; if (!m || !n) return m || n; var p = []; for (var j = 0; j <= n; j++) p[j] = j; for (var i = 1; i <= m; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= n; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return p[n]; }
  function hay(p) { var c = (p.head && p.headC) || {}; return fold([p.titulo, (c.palavras || []).join(" "), (c.cid || []).map(function (x) { return x[0] + " " + x[1]; }).join(" "), (c.meds || []).map(function (m) { return m.nome; }).join(" "), c.resumo].join(" ")); }
  function match(p, q) {
    var toks = fold(q).split(/\s+/).filter(Boolean); if (!toks.length) return true;
    var h = p._h || (p._h = hay(p)), words = h.split(/[^a-z0-9]+/);
    return toks.every(function (t) { return h.indexOf(t) >= 0 || (t.length > 3 && words.some(function (w) { return w.length > 3 && lev(t, w.slice(0, t.length + 1)) <= (t.length > 6 ? 2 : 1); })); });
  }
  async function headContent(p) { if (p.headC) return p.headC; if (!p.head) return {}; var v = await call("version", { id: p.head.id }); p.headC = v.conteudo || {}; p._h = null; return p.headC; }

  /* ---------- novidades / leitura ---------- */
  function lido(p) { return !p.head || (p.lidas || []).some(function (l) { return l.versao_id === p.head.id && (!p.head.critico || l.quiz_ok); }); }
  function novidades() { return LIST.filter(function (p) { return p.nVersoes > 1 && !lido(p) && (p.meusUsos > 0 || p.obrigatorio || p.camada === "equipe"); }).sort(function (a, b) { return (b.meusUsos - a.meusUsos) || (b.head.critico - a.head.critico); }); }

  /* ---------- biblioteca ---------- */
  async function openLibrary(tab) {
    var s = dialog("Protocolos clínicos", "pessoais, da equipe e institucionais");
    s.b.appendChild(el("div", { class: "note", text: "Carregando…" }));
    try { await loadMe(); await Promise.all([loadList(), loadTeams()]); await seedIfNeeded(); } catch (e) { s.b.textContent = ""; s.b.appendChild(el("div", { class: "err", text: e.message || String(e) })); return; }
    s.b.textContent = "";
    var tabs = [["meus", "Meus"], ["equipe", "Da equipe"], ["inst", "Institucionais"], ["fila", "Sugestões"]];
    var coord = ME.admin || (ME.membros || []).some(function (m) { return m.papel === "coordenador"; });
    if (coord) tabs.push(["painel", "Painel"]);
    if (ME.admin) tabs.push(["equipes", "Equipes"]);
    var cur = tab || "inst", q = "", ctx = "";
    var bar = el("div", { class: "chips", role: "tablist", style: "margin-bottom:8px" });
    var search = el("input", { class: "inp", type: "search", placeholder: "Buscar por título, palavra-chave, CID ou remédio (aceita erro de digitação)", "aria-label": "Buscar protocolo", style: "width:100%" });
    var ctxSel = el("select", { class: "sel", "aria-label": "Contexto" }, el("option", { value: "", text: "todos os contextos" }), CTX.map(function (c) { return el("option", { value: c, text: c }); }));
    var body = el("div");
    var nov = novidades();
    if (nov.length) s.b.appendChild(el("div", { class: "box", style: "border-left:4px solid var(--warn,#d9a400)" }, el("b", { text: "Protocolos atualizados (" + nov.length + ")" }),
      nov.slice(0, 6).map(function (p) { return el("div", { class: "note" }, (p.head.critico ? "⚠ mudança crítica — " : "") + p.titulo + " · v" + p.head.numero + ": " + (p.head.changelog || "") + " ", btn("Ver mudanças", function () { openView(p, true); })); })));
    s.b.append(bar, el("div", { class: "grid", style: "grid-template-columns:1fr auto;gap:6px" }, search, ctxSel), body);
    function drawBar() { bar.textContent = ""; tabs.forEach(function (t) { bar.appendChild(el("button", { class: "chip" + (cur === t[0] ? " on" : ""), role: "tab", "aria-selected": cur === t[0] ? "true" : "false", type: "button", text: t[1], onclick: function () { cur = t[0]; drawBar(); draw(); } })); }); }
    search.addEventListener("input", function () { q = search.value; draw(); });
    ctxSel.addEventListener("change", function () { ctx = ctxSel.value; draw(); });
    function row(p) {
      var c = p.headC || {};
      var venc = p.proxima_revisao && new Date(p.proxima_revisao) < new Date();
      return el("div", { class: "box", style: "padding:8px 10px;margin:6px 0" },
        el("div", { style: "display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap" },
          el("div", null, el("b", { text: p.titulo }), el("div", { class: "note" }, badge(CAMADA[p.camada]), p.camada === "equipe" ? badge(teamName(p.equipe_id)) : null, badge(STATUS[p.status], p.status === "aprovado" ? "var(--ok,#1a8a4a)" : "var(--warn,#b07a00)"), p.obrigatorio ? badge("obrigatório", "var(--err,#c33)") : p.camada === "institucional" ? badge("recomendado") : null, p.travado ? badge("travado") : null, venc ? badge("revisão vencida", "var(--err,#c33)") : null, " v" + (p.head ? p.head.numero : 0) + (c.resumo ? " · " + c.resumo : ""))),
          el("div", { class: "btns" }, btn("Abrir", function () { openView(p); }), btn("Aplicar", function () { applyProt(p); }, "primary"))));
    }
    async function draw() {
      body.textContent = "";
      if (cur === "fila") return drawQueue(body);
      if (cur === "painel") return drawPanel(body);
      if (cur === "equipes") return drawTeams(body);
      var L = LIST.filter(function (p) { return cur === "meus" ? p.camada === "pessoal" : cur === "equipe" ? p.camada === "equipe" : p.camada === "institucional"; });
      if (q || ctx) { body.appendChild(el("div", { class: "note", text: "Buscando…" })); await Promise.all(L.slice(0, 400).map(headContent)); body.textContent = ""; }
      L = L.filter(function (p) { return match(p, q) && (!ctx || ((p.headC || {}).escopo || {}).contextos && p.headC.escopo.contextos.indexOf(ctx) >= 0); });
      L.sort(function (a, b) { return (b.meusUsos - a.meusUsos) || a.titulo.localeCompare(b.titulo); });
      if (cur !== "inst") body.appendChild(el("div", { class: "btns", style: "margin:6px 0" }, btn("Novo protocolo " + (cur === "meus" ? "pessoal" : "da equipe"), function () { openEdit(null, cur === "meus" ? "pessoal" : "equipe"); }, "primary")));
      if (!L.length) body.appendChild(el("div", { class: "note", text: cur === "meus" ? "Você ainda não tem protocolos pessoais. Copie um institucional ou crie um novo." : cur === "equipe" ? "Nenhum protocolo de equipe visível. Peça ao administrador para incluí-lo numa equipe." : "Nada encontrado." }));
      L.slice(0, 150).forEach(function (p) { body.appendChild(row(p)); });
    }
    drawBar(); draw(); setTimeout(function () { search.focus(); }, 50);
  }

  /* ---------- visualização ---------- */
  function sec(t, content) { if (!content || (Array.isArray(content) && !content.length)) return null; return el("div", { class: "box" }, el("h3", { text: t }), content); }
  function txt(s) { return s ? el("div", { text: s, style: "white-space:pre-wrap" }) : null; }
  function fluxoView(nodes) {
    if (!nodes || !nodes.length) return null;
    var w = el("div"), path = [];
    function go(id) {
      var n = nodes.find(function (x) { return x.id === id; }) || nodes[0]; path.push(n.id); w.textContent = "";
      w.appendChild(el("div", { class: "note", text: "Caminho: " + path.join(" → ") }));
      w.appendChild(el("div", { style: "font-weight:600;margin:6px 0", text: (n.conduta ? "Conduta: " : "") + n.texto }));
      var b = el("div", { class: "btns" }); (n.opcoes || []).forEach(function (o) { b.appendChild(btn(o.t, function () { go(o.next); })); });
      b.appendChild(btn("Recomeçar", function () { path = []; go(nodes[0].id); }, "ghost")); w.appendChild(b);
    }
    go(nodes[0].id);
    var wrapEl = el("div", null, w);
    if (window.PSX_FLOW) wrapEl.appendChild(el("div", { class: "btns", style: "margin-top:6px" }, btn("📊 Ver diagrama / exportar SVG-PNG", function () { var t = document.querySelector("dialog[open] h2"); window.PSX_FLOW.open(nodes, t ? t.textContent : ""); })));
    return wrapEl;
  }
  async function openView(p, showChanges) {
    var s = dialog(p.titulo, CAMADA[p.camada] + " · " + STATUS[p.status]);
    var vs = await call("versions", { id: p.id }), v = vs[0], c = (v && v.conteudo) || {}; p.headC = c;
    call("event", { id: p.id, versao: v && v.id, tipo: "abertura" }).catch(function () {});
    var e = c.escopo || {}, o = c.objetivos || {}, cr = c.criterios || {}, rf = c.refs || {};
    var refList = function (arr) { return (arr || []).length ? el("ul", null, arr.map(function (r) { return el("li", null, r.url ? el("a", { href: r.url, target: "_blank", rel: "noopener", text: r.t || r.url }) : r.t); })) : null; };
    if (showChanges && vs.length > 1) s.b.appendChild(sec("O que mudou na v" + v.numero + (v.critico ? " (crítica)" : ""), diffView(vs[1].conteudo, v.conteudo)));
    s.b.append(
      el("div", { class: "note" }, badge(CAMADA[p.camada]), p.obrigatorio ? badge("obrigatório", "var(--err,#c33)") : null, p.travado ? badge("travado para edição") : null,
        " Criado " + fmtD(p.created_at) + " · atualizado " + fmtD(p.updated_at) + " · próxima revisão " + fmtD(p.proxima_revisao)),
      c.resumo ? el("p", { style: "font-weight:600", text: c.resumo }) : null,
      c.palavras && c.palavras.length ? el("div", { class: "note", text: "Palavras-chave: " + c.palavras.join(", ") }) : null,
      sec("Escopo", [el("div", { text: "Idade: " + (e.idadeMin || 0) + "–" + (e.idadeMax || "sem limite") + " anos · Contextos: " + (e.contextos || []).join(", ") }), (c.cid || []).length ? el("div", { text: "CID: " + c.cid.map(function (x) { return x[0] + " " + x[1]; }).join("; ") }) : null, e.inclui ? el("div", { text: "Inclui: " + e.inclui }) : null, e.exclui ? el("div", { text: "Exclui: " + e.exclui }) : null]),
      (o.primarios || o.secundarios) ? sec("Objetivos terapêuticos", [o.primarios ? el("div", { text: "Primários: " + o.primarios }) : null, o.secundarios ? el("div", { text: "Secundários: " + o.secundarios }) : null]) : null,
      sec("Fluxograma decisório", fluxoView((c.fluxo || {}).nodes)),
      sec("Medicamentos", (c.meds || []).length ? el("table", { style: "width:100%;font-size:12px;border-collapse:collapse" }, el("tr", null, ["Remédio", "Posologia", "Tipo", "Alternativas"].map(function (h) { return el("th", { text: h, style: "text-align:left" }); })),
        c.meds.map(function (m) { return el("tr", { style: "border-top:1px solid var(--line,#ddd)" }, el("td", { text: m.nome + (m.apres ? " — " + m.apres : "") }), el("td", { text: m.pos || "conforme cálculo do app" }), el("td", { text: m.essencial === false ? "opcional" : "essencial" }), el("td", { text: (m.alt || []).map(function (a) { return D.drugs[a] ? D.drugs[a].n : a; }).join(", ") || "—" })); })) : null),
      (cr.internacao || cr.alta || cr.uti) ? sec("Critérios", [cr.internacao ? el("div", null, el("b", { text: "Internação: " }), cr.internacao) : null, cr.alta ? el("div", null, el("b", { text: "Alta: " }), cr.alta) : null, cr.uti ? el("div", null, el("b", { text: "Transferência para UTI: " }), cr.uti) : null]) : null,
      sec("Exames complementares", (c.exames || []).length ? el("ul", null, c.exames.map(function (x) { return el("li", { text: exName(x.codigo) + " — " + x.tipo + (x.quando ? " · " + x.quando : "") }); })) : null),
      (rf.primarias || []).length || (rf.secundarias || []).length ? sec("Referências", [rf.primarias && rf.primarias.length ? el("div", null, el("b", { text: "Primárias" }), refList(rf.primarias)) : null, rf.secundarias && rf.secundarias.length ? el("div", null, el("b", { text: "Secundárias" }), refList(rf.secundarias)) : null]) : null,
      sec("Autoria e aprovação", el("div", { text: "Autor: " + ((c.autor || {}).nome || "—") + ((c.autor || {}).crm ? " · CRM " + c.autor.crm : "") + " · Aprovação: " + (p.aprovador_nome || "—") + (p.aprovador_crm ? " · CRM " + p.aprovador_crm : "") + (p.aprovado_em ? " em " + fmtD(p.aprovado_em) : "") })),
      sec("Histórico de revisões", el("div", null, vs.map(function (x, i) { return el("div", { class: "note" }, "v" + x.numero + " · " + fmtD(x.created_at) + (x.critico ? " · ⚠ crítica" : "") + " — " + (x.changelog || "sem descrição") + " ", vs[i + 1] ? btn("Comparar com v" + vs[i + 1].numero, function () { var d = dialog("v" + vs[i + 1].numero + " → v" + x.numero, "verde = adição · vermelho = remoção · amarelo = alteração"); d.b.appendChild(diffView(vs[i + 1].conteudo, x.conteudo)); d.f.appendChild(btn("Voltar", function () { openView(p); })); }, "ghost") : null); }))));
    var st = el("div", { class: "status" }); s.b.appendChild(st);
    var f = s.f;
    f.appendChild(btn("Aplicar na prescrição", function () { applyProt(p); }, "primary"));
    if (podeEditar(p)) f.appendChild(btn("Editar", function () { openEdit(p, p.camada, c); }));
    f.appendChild(btn("Copiar para meus", async function () { var cc = clone(c); cc.autor = { nome: ME.nome, crm: ME.crm }; await call("create", { camada: "pessoal", titulo: p.titulo + " (minha versão)", proto_origem: p.proto_origem, conteudo: cc, changelog: "Cópia de " + CAMADA[p.camada].toLowerCase() + " v" + v.numero }); toast("Cópia criada em \"Meus\"."); openLibrary("meus"); }));
    if (p.camada === "pessoal" && p.owner === ME.uid && (ME.membros || []).some(function (m) { return m.papel !== "membro"; })) f.appendChild(btn("Enviar para a equipe", function () { sendToTeam(p, c); }));
    if (p.camada !== "pessoal") f.appendChild(btn("Sugerir mudança", function () { openSuggest(p); }));
    if (podeAprovar(p) && p.status !== "aprovado") f.appendChild(btn("Aprovar", function () { approve(p, true); }));
    if (podeAprovar(p) && p.status === "pendente") f.appendChild(btn("Recusar", function () { approve(p, false); }));
    if (podeEditar(p) && p.camada === "equipe" && p.status === "rascunho") f.appendChild(btn("Enviar para aprovação", async function () { await call("update", { id: p.id, patch: { status: "pendente" } }); toast("Enviado ao coordenador."); p.status = "pendente"; openView(p); }));
    if (ME.admin && p.camada === "institucional") {
      f.appendChild(btn(p.obrigatorio ? "Tornar recomendado" : "Tornar obrigatório", async function () { await call("update", { id: p.id, patch: { obrigatorio: !p.obrigatorio } }); p.obrigatorio = !p.obrigatorio; openView(p); }));
      f.appendChild(btn(p.travado ? "Destravar" : "Travar", async function () { await call("update", { id: p.id, patch: { travado: !p.travado } }); p.travado = !p.travado; openView(p); }));
    }
    if (["admin", "coordenador", "dono"].indexOf(nivel(p)) >= 0) f.appendChild(btn("Registrar alerta", function () { openAlert(p); }, "ghost"));
    f.appendChild(btn("Voltar", function () { openLibrary(p.camada === "pessoal" ? "meus" : p.camada === "equipe" ? "equipe" : "inst"); }, "ghost"));
  }
  async function approve(p, yes) {
    var s = dialog((yes ? "Aprovar " : "Recusar ") + p.titulo, p.camada === "institucional" ? "aprovação por instância deliberativa" : "aprovação do coordenador da equipe");
    var inst = el("select", { class: "sel" }, (TEAMS.instancias || []).map(function (i) { return el("option", { value: i.id, text: i.nome }); }));
    var nome = inp(ME.nome), crm = inp(ME.crm, "CRM/UF"), rev = el("input", { class: "inp", type: "date", value: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) });
    if (yes) s.b.append(p.camada === "institucional" ? field("Instância", inst) : null, field("Responsável pela aprovação", nome), field("CRM", crm), field("Próxima revisão obrigatória", rev));
    else s.b.appendChild(el("div", { class: "note", text: "O autor verá o protocolo como recusado e poderá corrigi-lo." }));
    var st = el("div", { class: "status" }); s.b.appendChild(st);
    s.f.appendChild(btn(yes ? "Aprovar" : "Recusar", async function () {
      try {
        var patch = yes ? { status: "aprovado", aprovador_nome: (p.camada === "institucional" ? inst.options[inst.selectedIndex].text + " — " : "") + nome.value, aprovador_crm: crm.value, proxima_revisao: rev.value, instancia_id: p.camada === "institucional" ? inst.value : null } : { status: "recusado" };
        await call("update", { id: p.id, patch: patch }); Object.assign(p, patch); toast(yes ? "Protocolo aprovado." : "Protocolo recusado."); openView(p);
      } catch (e) { st.textContent = e.message; st.className = "status err"; }
    }, "primary"));
  }
  async function sendToTeam(p, c) {
    var s = dialog("Enviar para a equipe", "o coordenador aprova antes do uso pela equipe");
    var eqs = (ME.membros || []).filter(function (m) { return m.papel !== "membro"; });
    var sel = el("select", { class: "sel" }, eqs.map(function (m) { return el("option", { value: m.equipe_id, text: teamName(m.equipe_id) }); }));
    s.b.appendChild(field("Equipe", sel));
    s.f.appendChild(btn("Enviar", async function () { var cc = clone(c); await call("create", { camada: "equipe", equipe_id: sel.value, titulo: p.titulo, proto_origem: p.proto_origem, conteudo: cc, changelog: "Proposto a partir de protocolo pessoal" }).then(async function (r) { await call("update", { id: r.protocolo.id, patch: { status: "pendente" } }); }); toast("Enviado para aprovação do coordenador."); openLibrary("equipe"); }, "primary"));
  }

  /* ---------- edição ---------- */
  function drugPicker(onPick) {
    var q = el("input", { class: "inp", type: "search", placeholder: "Adicionar remédio da base (ex.: amoxicilina)", style: "width:100%" }), out = el("div", { class: "chips" });
    q.addEventListener("input", function () { out.textContent = ""; var t = fold(q.value); if (t.length < 3) return; Object.keys(D.drugs).filter(function (id) { return fold(D.drugs[id].n).indexOf(t) >= 0; }).slice(0, 12).forEach(function (id) { out.appendChild(el("button", { class: "chip", type: "button", text: D.drugs[id].n, onclick: function () { onPick(id); q.value = ""; out.textContent = ""; } })); }); });
    return el("div", null, q, out);
  }
  function fluxoToText(nodes) { return (nodes || []).map(function (n) { return n.id + " | " + (n.conduta ? "CONDUTA: " : "") + n.texto + ((n.opcoes || []).length ? " | " + n.opcoes.map(function (o) { return o.t + ">" + o.next; }).join(" ; ") : ""); }).join("\n"); }
  function textToFluxo(t) { return lines(t).map(function (l) { var p = l.split("|").map(function (x) { return x.trim(); }); var txt0 = p[1] || ""; var cond = /^CONDUTA:/i.test(txt0); return { id: p[0], texto: txt0.replace(/^CONDUTA:\s*/i, ""), conduta: cond, opcoes: p[2] ? p[2].split(";").map(function (o) { var k = o.split(">"); return { t: k[0].trim(), next: (k[1] || "").trim() }; }).filter(function (o) { return o.t; }) : [] }; }); }
  function refsToText(a) { return (a || []).map(function (r) { return r.t + (r.url ? " | " + r.url : ""); }).join("\n"); }
  function textToRefs(t) { return lines(t).map(function (l) { var p = l.split("|"); return { t: p[0].trim(), url: (p[1] || "").trim() }; }); }
  function quizToText(q) { return (q || []).map(function (x) { return x.q + " | " + x.ops.map(function (o, i) { return (i === x.certa ? "*" : "") + o; }).join(" | "); }).join("\n"); }
  function textToQuiz(t) { return lines(t).map(function (l) { var p = l.split("|").map(function (x) { return x.trim(); }); var ops = p.slice(1), certa = ops.findIndex(function (o) { return o.charAt(0) === "*"; }); return { q: p[0], ops: ops.map(function (o) { return o.replace(/^\*/, ""); }), certa: certa < 0 ? 0 : certa }; }).filter(function (x) { return x.ops.length > 1; }); }
  function examsToText(a) { return (a || []).map(function (x) { return x.codigo + " | " + x.tipo + " | " + (x.quando || ""); }).join("\n"); }
  function textToExams(t, old) { return lines(t).map(function (l) { var p = l.split("|").map(function (x) { return x.trim(); }); var prev = (old || []).find(function (o) { return o.codigo === p[0]; }); return { codigo: p[0], grupo: prev ? prev.grupo : (/^0202/.test(p[0]) ? "lab" : "comp"), tipo: /opc/i.test(p[1] || "") ? "opcional" : "essencial", quando: p[2] || "" }; }); }

  async function openEdit(p, camada, c0) {
    await loadMe(); if (!TEAMS) await loadTeams();
    var c = clone(c0) || { palavras: [], escopo: { contextos: [] }, objetivos: {}, fluxo: { nodes: [] }, meds: [], criterios: {}, exames: [], refs: {}, autor: { nome: ME.nome, crm: ME.crm }, quiz: [] };
    c.escopo = c.escopo || {}; c.objetivos = c.objetivos || {}; c.criterios = c.criterios || {}; c.refs = c.refs || {}; c.autor = c.autor || {};
    var s = dialog(p ? "Editar: " + p.titulo : "Novo protocolo " + CAMADA[camada].toLowerCase(), "cada salvamento cria uma nova versão");
    var F = {
      titulo: inp(p ? p.titulo : ""), palavras: inp((c.palavras || []).join(", ")), resumo: inp(c.resumo, "resumo de uma linha"),
      idMin: el("input", { class: "inp", type: "number", min: 0, max: 120, value: c.escopo.idadeMin || "" }), idMax: el("input", { class: "inp", type: "number", min: 0, max: 120, value: c.escopo.idadeMax || "" }),
      inclui: area(c.escopo.inclui, "condições incluídas", 2), exclui: area(c.escopo.exclui, "condições excluídas", 2), cid: inp((c.cid || []).map(function (x) { return x[0]; }).join(", "), "CIDs, separados por vírgula"),
      prim: area(c.objetivos.primarios, "", 2), secd: area(c.objetivos.secundarios, "", 2),
      fluxo: area(fluxoToText((c.fluxo || {}).nodes), "Uma linha por passo: id | pergunta | resposta>id ; resposta>id\nou: id | CONDUTA: texto", 5),
      intern: area(c.criterios.internacao, "", 2), alta: area(c.criterios.alta, "", 2), uti: area(c.criterios.uti, "", 2),
      exames: area(examsToText(c.exames), "código SIGTAP | essencial/opcional | quando", 4),
      rp: area(refsToText(c.refs.primarias), "título | link (ECR, meta-análise, diretriz)", 3), rs: area(refsToText(c.refs.secundarias), "título | link (livro, centro de referência)", 3),
      autor: inp(c.autor.nome), crm: inp(c.autor.crm, "CRM/UF"),
      quiz: area(quizToText(c.quiz), "pergunta | opção | *opção certa | opção", 3),
      log: inp("", "o que mudou nesta versão (obrigatório)"), critico: el("input", { type: "checkbox" }),
      rev: el("input", { class: "inp", type: "date", value: p && p.proxima_revisao ? p.proxima_revisao : new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) })
    };
    var ctxs = (c.escopo.contextos || []).slice(), ctxW = el("div", { class: "chips" });
    function drawCtx() { ctxW.textContent = ""; CTX.forEach(function (x) { var on = ctxs.indexOf(x) >= 0; ctxW.appendChild(el("button", { class: "chip" + (on ? " on" : ""), type: "button", text: x, onclick: function () { if (on) ctxs.splice(ctxs.indexOf(x), 1); else ctxs.push(x); drawCtx(); } })); }); } drawCtx();
    var meds = clone(c.meds || []), medW = el("div");
    function drawMeds() { medW.textContent = ""; meds.forEach(function (m, i) {
      var pos = inp(m.pos, "posologia (deixe em branco para o app calcular)"), ess = el("input", { type: "checkbox", checked: m.essencial !== false });
      pos.addEventListener("input", function () { m.pos = pos.value; }); ess.addEventListener("change", function () { m.essencial = ess.checked; });
      medW.appendChild(el("div", { class: "box", style: "padding:6px;margin:4px 0" }, el("div", { style: "display:flex;justify-content:space-between" }, el("b", { text: m.nome }), btn("Remover", function () { meds.splice(i, 1); drawMeds(); }, "ghost")), pos,
        el("label", { class: "check" }, ess, " essencial"), el("div", { class: "note", text: "Alternativas (alergia ou falta): " + ((m.alt || []).map(function (a) { return D.drugs[a] ? D.drugs[a].n : a; }).join(", ") || "nenhuma") }),
        drugPicker(function (id) { m.alt = (m.alt || []).concat(id); drawMeds(); })));
    }); }
    drawMeds();
    var eqSel = null;
    if (!p && camada === "equipe") { var eqs = ME.admin ? TEAMS.equipes.map(function (e) { return { equipe_id: e.id }; }) : (ME.membros || []).filter(function (m) { return m.papel !== "membro"; }); if (!eqs.length) { s.b.appendChild(el("div", { class: "err", text: "Você não é editor nem coordenador de nenhuma equipe." })); return; } eqSel = el("select", { class: "sel" }, eqs.map(function (m) { return el("option", { value: m.equipe_id, text: teamName(m.equipe_id) }); })); }
    s.b.append(eqSel ? field("Equipe", eqSel) : null, field("Título", F.titulo), field("Palavras-chave", F.palavras), field("Resumo executivo", F.resumo),
      el("div", { class: "box" }, el("h3", { text: "Escopo" }), el("div", { class: "grid", style: "grid-template-columns:1fr 1fr;gap:6px" }, field("Idade mínima (anos)", F.idMin), field("Idade máxima (anos)", F.idMax)), field("Contextos", ctxW), field("CID-10", F.cid), F.inclui, F.exclui),
      el("div", { class: "box" }, el("h3", { text: "Objetivos" }), field("Primários", F.prim), field("Secundários", F.secd)),
      el("div", { class: "box" }, el("h3", { text: "Fluxograma decisório" }), F.fluxo),
      el("div", { class: "box" }, el("h3", { text: "Medicamentos" }), medW, drugPicker(function (id) { var dr = D.drugs[id], a = (dr.a || [])[0]; meds.push({ drug: id, nome: dr.n, apres: a ? a.ap : "", pos: "", alt: [], essencial: true }); drawMeds(); })),
      el("div", { class: "box" }, el("h3", { text: "Critérios" }), field("Internação", F.intern), field("Alta", F.alta), field("Transferência para UTI", F.uti)),
      el("div", { class: "box" }, el("h3", { text: "Exames complementares" }), F.exames),
      el("div", { class: "box" }, el("h3", { text: "Referências" }), field("Primárias", F.rp), field("Secundárias", F.rs)),
      el("div", { class: "grid", style: "grid-template-columns:1fr 1fr;gap:6px" }, field("Autor", F.autor), field("CRM", F.crm)),
      field("Próxima revisão obrigatória", F.rev),
      el("div", { class: "box" }, el("h3", { text: "Quiz de leitura (para mudanças críticas)" }), F.quiz),
      field("Descrição da mudança (changelog)", F.log), el("label", { class: "check" }, F.critico, " mudança crítica de segurança (exige quiz antes do uso)"));
    var st = el("div", { class: "status" }); s.b.appendChild(st);
    s.f.appendChild(btn("Salvar versão", async function () {
      if (!F.titulo.value.trim()) { st.textContent = "Informe o título."; st.className = "status err"; return; }
      if (p && !F.log.value.trim()) { st.textContent = "Descreva o que mudou."; st.className = "status err"; return; }
      var quiz = textToQuiz(F.quiz.value);
      if (F.critico.checked && !quiz.length) { st.textContent = "Mudança crítica exige ao menos uma pergunta no quiz."; st.className = "status err"; return; }
      var cidOld = {}; (c.cid || []).forEach(function (x) { cidOld[x[0]] = x[1]; });
      var nc = Object.assign({}, c, { palavras: F.palavras.value.split(/[,;]/).map(function (x) { return x.trim(); }).filter(Boolean), resumo: F.resumo.value.trim(),
        cid: F.cid.value.split(/[,;\s]+/).filter(Boolean).map(function (k) { return [k.toUpperCase(), cidOld[k.toUpperCase()] || ""]; }),
        escopo: { idadeMin: F.idMin.value, idadeMax: F.idMax.value, inclui: F.inclui.value, exclui: F.exclui.value, contextos: ctxs },
        objetivos: { primarios: F.prim.value, secundarios: F.secd.value }, fluxo: { nodes: textToFluxo(F.fluxo.value) }, meds: meds,
        criterios: { internacao: F.intern.value, alta: F.alta.value, uti: F.uti.value }, exames: textToExams(F.exames.value, c.exames),
        refs: { primarias: textToRefs(F.rp.value), secundarias: textToRefs(F.rs.value) }, autor: { nome: F.autor.value, crm: F.crm.value }, quiz: quiz });
      try {
        if (p) {
          var patch = { titulo: F.titulo.value.trim(), proxima_revisao: F.rev.value || null };
          if (p.camada === "equipe" && p.status === "aprovado" && !podeAprovar(p)) patch.status = "pendente";
          await call("commit", { id: p.id, conteudo: nc, changelog: F.log.value.trim(), critico: F.critico.checked, patch: patch });
          Object.assign(p, patch); p.headC = null; toast("Nova versão salva."); await loadList(); openView(LIST.find(function (x) { return x.id === p.id; }) || p);
        } else {
          var r = await call("create", { camada: camada, equipe_id: eqSel ? eqSel.value : null, titulo: F.titulo.value.trim(), conteudo: nc, changelog: F.log.value.trim() || "Versão inicial", proxima_revisao: F.rev.value || null });
          toast(camada === "equipe" ? "Criado como rascunho da equipe. Envie para aprovação." : "Protocolo pessoal criado."); await loadList(); openView(LIST.find(function (x) { return x.id === r.protocolo.id; }) || r.protocolo);
        }
      } catch (e) { st.textContent = e.message || String(e); st.className = "status err"; }
    }, "primary"));
    s.f.appendChild(btn("Cancelar", function () { p ? openView(p) : openLibrary(camada === "pessoal" ? "meus" : "equipe"); }, "ghost"));
  }

  /* ---------- diff colorido ---------- */
  function flat(c) {
    var o = {}; c = c || {};
    (c.meds || []).forEach(function (m) { o["Remédio · " + m.nome] = [m.pos || "dose calculada pelo app", m.essencial === false ? "opcional" : "essencial", (m.alt || []).length ? "alt: " + m.alt.map(function (a) { return D.drugs[a] ? D.drugs[a].n : a; }).join("/") : ""].filter(Boolean).join(" | "); });
    (c.exames || []).forEach(function (x) { o["Exame · " + exName(x.codigo)] = x.tipo + (x.quando ? " · " + x.quando : ""); });
    var e = c.escopo || {}; o["Escopo · idade"] = (e.idadeMin || 0) + "–" + (e.idadeMax || "∞"); if (e.inclui) o["Escopo · inclui"] = e.inclui; if (e.exclui) o["Escopo · exclui"] = e.exclui; if ((e.contextos || []).length) o["Escopo · contextos"] = e.contextos.join(", ");
    ["internacao", "alta", "uti"].forEach(function (k) { if ((c.criterios || {})[k]) o["Critério · " + k] = c.criterios[k]; });
    ["primarios", "secundarios"].forEach(function (k) { if ((c.objetivos || {})[k]) o["Objetivo · " + k] = c.objetivos[k]; });
    ((c.fluxo || {}).nodes || []).forEach(function (n) { o["Fluxo · " + n.id] = n.texto; });
    if (c.resumo) o["Resumo"] = c.resumo;
    ((c.refs || {}).primarias || []).concat((c.refs || {}).secundarias || []).forEach(function (r) { o["Referência · " + r.t] = r.url || "—"; });
    return o;
  }
  function diffView(a, b) {
    var A = flat(a), B = flat(b), keys = Object.keys(Object.assign({}, A, B)).sort(), t = el("table", { style: "width:100%;border-collapse:collapse;font-size:12px" }), n = 0;
    t.appendChild(el("tr", null, el("th", { text: "Item", style: "text-align:left" }), el("th", { text: "Antes", style: "text-align:left" }), el("th", { text: "Depois", style: "text-align:left" })));
    keys.forEach(function (k) { var x = A[k], y = B[k]; if (x === y) return; n++; var bg = x == null ? "rgba(34,160,90,.18)" : y == null ? "rgba(210,60,60,.18)" : "rgba(230,170,30,.22)";
      t.appendChild(el("tr", { style: "background:" + bg }, el("td", { text: (x == null ? "＋ " : y == null ? "− " : "± ") + k, style: "padding:4px;vertical-align:top" }), el("td", { text: x == null ? "—" : x, style: "padding:4px;white-space:pre-wrap" }), el("td", { text: y == null ? "—" : y, style: "padding:4px;white-space:pre-wrap" }))); });
    return n ? t : el("div", { class: "note", text: "Sem diferenças de conteúdo." });
  }

  /* ---------- quiz ---------- */
  function quizGate(p, v, c) {
    return new Promise(function (res) {
      var s = dialog("Confirme a leitura da mudança crítica", p.titulo + " · v" + v.numero);
      s.b.appendChild(el("div", { class: "warn", text: "⚠ " + (v.changelog || "Mudança crítica de segurança.") }));
      var ans = {};
      (c.quiz || []).forEach(function (q, i) { s.b.appendChild(el("div", { class: "box" }, el("b", { text: (i + 1) + ". " + q.q }), q.ops.map(function (o, j) { var r = el("input", { type: "radio", name: "pq" + i, onchange: function () { ans[i] = j; } }); return el("label", { class: "check", style: "display:block" }, r, " " + o); }))); });
      var st = el("div", { class: "status" }); s.b.appendChild(st);
      s.f.appendChild(btn("Enviar respostas", async function () {
        var ok = 0; (c.quiz || []).forEach(function (q, i) { if (ans[i] === q.certa) ok++; });
        if (ok < (c.quiz || []).length) { st.textContent = "Acertos: " + ok + " de " + c.quiz.length + ". Releia a mudança e tente de novo."; st.className = "status err"; await call("read", { versao: v.id, quiz_ok: false, acertos: ok }).catch(function () {}); return; }
        await call("read", { versao: v.id, quiz_ok: true, acertos: ok }); var pp = LIST.find(function (x) { return x.id === p.id; }); if (pp) pp.lidas = (pp.lidas || []).concat({ versao_id: v.id, quiz_ok: true }); res(true);
      }, "primary"));
      s.f.appendChild(btn("Cancelar", function () { s.dlg.close(); res(false); }, "ghost"));
    });
  }

  /* ---------- aplicação ---------- */
  async function applyProt(p) {
    await loadMe(); if (!LIST.length) await loadList();
    var vs = await call("versions", { id: p.id }), v = vs[0]; if (!v) return;
    var c = v.conteudo || {};
    if (p.camada !== "pessoal" && p.status !== "aprovado") { toast("Protocolo ainda não aprovado: use com cautela."); }
    var pr = LIST.find(function (x) { return x.id === p.id; }) || p;
    if (v.critico && (c.quiz || []).length && !(pr.lidas || []).some(function (l) { return l.versao_id === v.id && l.quiz_ok; })) { var ok = await quizGate(p, v, c); if (!ok) return; }
    else if (vs.length > 1 && !(pr.lidas || []).some(function (l) { return l.versao_id === v.id; })) call("read", { versao: v.id, quiz_ok: false }).catch(function () {});
    if (!window.PSX_TPL || !window.PSX_TPL.applyTemplate) { toast("Motor de aplicação indisponível."); return; }
    var lab = {}, comp = {}; (c.exames || []).filter(function (x) { return x.tipo === "essencial"; }).forEach(function (x) { (x.grupo === "lab" ? lab : comp)[x.codigo] = { just: "" }; });
    var itens = (c.meds || []).map(function (m) { return { med: m.nome + (m.apres ? " " + m.apres : ""), pos: m.pos || "", qtd: "", via: "", drug: m.drug || null, sl: null, essencial: m.essencial !== false, alt: m.alt || [] }; });
    var mods = { amb: { itens: itens } }; if (Object.keys(lab).length) mods.lab = { sel: lab }; if (Object.keys(comp).length) mods.comp = { sel: comp };
    var dlg = document.getElementById("psxProtModal"); if (dlg && dlg.open) dlg.close();
    var log = await window.PSX_TPL.applyTemplate({ id: p.id, nome: p.titulo, meta: { idadeMin: (c.escopo || {}).idadeMin, idadeMax: (c.escopo || {}).idadeMax } }, { id: v.id, conteudo: { proto: p.proto_origem, mods: mods } }, { optional: false, track: false });
    write("psx.prot.applied", { id: p.id, versao: v.id, titulo: p.titulo, drugs: (c.meds || []).filter(function (m) { return m.essencial !== false; }).map(function (m) { return m.drug || fold(m.nome); }), at: Date.now() });
    call("event", { id: p.id, versao: v.id, tipo: "aplicacao", detalhes: { hora: new Date().getHours() } }).catch(function () {});
    var r = dialog("Protocolo aplicado", "revise cada documento antes de emitir");
    r.b.appendChild(el("div", { class: "box" }, (log || []).length ? log.map(function (x) { return el("div", { class: /^⛔/.test(x) ? "err" : /^⚠/.test(x) ? "warn" : "note", text: x }); }) : el("div", { class: "note", text: "Tudo aplicado." }), el("div", { class: "note", text: "Doses recalculadas para o paciente atual. Alertas de rim, gestação, alergia e controle especial e o \"Revisei este documento\" continuam valendo." })));
    r.f.appendChild(btn("Continuar", function () { r.dlg.close(); }, "primary"));
  }

  /* ---------- desvio na emissão ---------- */
  function currentDrugs() {
    var c = T.C(), out = {};
    [c.rx].forEach(function (rx) { (rx && rx.itens || []).forEach(function (it) { var f = fold(it.med), hit = Object.keys(D.drugs).find(function (id) { var n = fold(D.drugs[id].n).split(/[\s(]/)[0]; return n.length > 3 && f.indexOf(n) === 0; }); out[hit || f] = 1; }); });
    Object.keys(c.rxSel || {}).forEach(function (k) { if (c.rxSel[k] && c.rxSel[k].on) out[k] = 1; });
    return Object.keys(out);
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("button"); if (!b || b.disabled) return;
    if (!/pdf|imprimir/i.test(b.textContent || "")) return;
    var ap = read("psx.prot.applied", null); if (!ap || Date.now() - ap.at > 6 * 3600e3) return;
    var now = currentDrugs(); if (!now.length) return;
    var removidos = ap.drugs.filter(function (d) { return now.indexOf(d) < 0; }), adicionados = now.filter(function (d) { return ap.drugs.indexOf(d) < 0; });
    var nm = function (d) { return D.drugs[d] ? D.drugs[d].n : d; };
    var det = { removidos: removidos.map(nm), adicionados: adicionados.map(nm), hora: new Date().getHours() };
    call("event", { id: ap.id, versao: ap.versao, tipo: "emissao", detalhes: det }).catch(function () {});
    if (removidos.length || adicionados.length) call("event", { id: ap.id, versao: ap.versao, tipo: "desvio", detalhes: det }).catch(function () {});
  }, true);

  /* ---------- sugestões ---------- */
  function openSuggest(p) {
    var s = dialog("Sugerir mudança", p.titulo);
    var tipo = el("select", { class: "sel" }, [["adicao", "Adição de conduta"], ["remocao", "Remoção de conduta"], ["alteracao", "Alteração de conduta"]].map(function (x) { return el("option", { value: x[0], text: x[1] }); }));
    var pri = el("select", { class: "sel" }, [["alta", "alta"], ["media", "média"], ["baixa", "baixa"]].map(function (x) { return el("option", { value: x[0], text: x[1] }); })); pri.value = "media";
    var F = { descricao: area("", "o que mudar, de forma clara e objetiva"), justificativa: area("", "justificativa científica"), evidencias: area("", "publicações dos últimos 2-3 anos, diretrizes, estudos locais (título | link por linha)"), impacto: area("", "desfechos, custos, segurança, simplificação"), barreiras: area("", "disponibilidade, treinamento, processos"), mitigacao: area("", "como contornar as barreiras") };
    s.b.append(field("Tipo", tipo), field("Prioridade", pri), field("Descrição", F.descricao), field("Justificativa", F.justificativa), field("Evidências", F.evidencias), field("Impacto esperado", F.impacto), field("Barreiras de implementação", F.barreiras), field("Estratégias de mitigação", F.mitigacao));
    var st = el("div", { class: "status" }); s.b.appendChild(st);
    s.f.appendChild(btn("Enviar sugestão", async function () {
      if (F.descricao.value.trim().length < 10 || F.justificativa.value.trim().length < 20) { st.textContent = "Descreva a mudança (10+ caracteres) e justifique (20+ caracteres)."; st.className = "status err"; return; }
      var campos = { tipo: tipo.value, prioridade: pri.value }; Object.keys(F).forEach(function (k) { campos[k] = F[k].value.trim(); });
      try { await call("suggest", { id: p.id, campos: campos }); toast("Sugestão enviada. Prazo de resposta: " + (p.prazo_sugestao_dias || 7) + " dias úteis."); openView(p); } catch (e) { st.textContent = e.message; st.className = "status err"; }
    }, "primary"));
    s.f.appendChild(btn("Cancelar", function () { openView(p); }, "ghost"));
  }
  var SUGST = { pendente: "pendente", em_analise: "em análise", aprovada: "aprovada", recusada: "recusada", implantada: "implantada" };
  async function drawQueue(body) {
    var L = await call("suggestions", {}), pmap = {}; LIST.forEach(function (p) { pmap[p.id] = p; });
    var PR = { alta: 0, media: 1, baixa: 2 };
    L.sort(function (a, b) { var oa = /pendente|em_analise/.test(a.status) ? 0 : 1, ob = /pendente|em_analise/.test(b.status) ? 0 : 1; return oa - ob || PR[a.prioridade] - PR[b.prioridade] || String(a.prazo).localeCompare(String(b.prazo)); });
    if (!L.length) { body.appendChild(el("div", { class: "note", text: "Nenhuma sugestão visível. Abra um protocolo de equipe ou institucional e use \"Sugerir mudança\"." })); return; }
    L.forEach(function (sg) {
      var p = pmap[sg.protocolo_id] || { titulo: "protocolo", camada: "institucional" }, mine = sg.autor === ME.uid, can = p.id && (ME.admin || (p.camada === "equipe" && papelEm(p.equipe_id) === "coordenador"));
      var late = /pendente|em_analise/.test(sg.status) && sg.prazo && new Date(sg.prazo) < new Date();
      var resp = area(sg.resposta || "", "resposta / justificativa (obrigatória na recusa)", 2), st = el("div", { class: "status" });
      var set = async function (status) { try { await call("decide", { sid: sg.id, status: status, resposta: resp.value.trim() || null }); toast("Sugestão: " + SUGST[status] + "."); body.textContent = ""; drawQueue(body); } catch (e) { st.textContent = e.message; st.className = "status err"; } };
      body.appendChild(el("div", { class: "box", style: "padding:8px;margin:6px 0;" + (late ? "border-left:4px solid var(--err,#c33)" : "") },
        el("div", null, el("b", { text: p.titulo }), " ", badge(SUGST[sg.status]), badge("prioridade " + sg.prioridade), late ? badge("prazo vencido", "var(--err,#c33)") : badge("prazo " + fmtD(sg.prazo)), mine ? badge("sua") : null),
        el("div", { text: "(" + sg.tipo + ") " + sg.descricao, style: "white-space:pre-wrap;margin:4px 0" }),
        el("details", null, el("summary", { text: "Justificativa, evidências, impacto e barreiras" }), ["justificativa", "evidencias", "impacto", "barreiras", "mitigacao"].map(function (k) { return sg[k] ? el("div", { style: "white-space:pre-wrap" }, el("b", { text: k + ": " }), sg[k]) : null; })),
        sg.resposta ? el("div", { class: "note", text: "Resposta: " + sg.resposta }) : null,
        can && sg.status !== "implantada" && sg.status !== "recusada" ? el("div", null, resp, el("div", { class: "btns" },
          sg.status === "pendente" ? btn("Iniciar análise", function () { set("em_analise"); }) : null,
          sg.status !== "aprovada" ? btn("Aprovar", function () { set("aprovada"); }) : btn("Marcar implantada", function () { set("implantada"); }),
          btn("Recusar", function () { if (resp.value.trim().length < 10) { st.textContent = "A recusa exige justificativa formal."; st.className = "status err"; return; } set("recusada"); }, "ghost"),
          p.id ? btn("Abrir protocolo", function () { openView(p); }, "ghost") : null), st) : null));
    });
  }

  /* ---------- alertas ---------- */
  function openAlert(p) {
    var s = dialog("Registrar alerta", "recall, mudança regulatória ou de diretriz");
    var t = inp("", "ex.: ANVISA suspende lote de …"), u = inp("", "link"), r = area("", "resumo e impacto no protocolo");
    s.b.append(field("Título", t), field("Link", u), field("Resumo", r));
    s.f.appendChild(btn("Salvar", async function () { if (!t.value.trim()) return; await call("alertAdd", { id: p.id, titulo: t.value.trim(), url: u.value.trim(), resumo: r.value.trim() }); toast("Alerta registrado."); openView(p); }, "primary"));
  }

  /* ---------- painel ---------- */
  function bars(rows, max) { max = max || Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat(1)); return el("div", null, rows.map(function (r) { return el("div", { style: "display:grid;grid-template-columns:minmax(120px,40%) 1fr auto;gap:6px;align-items:center;font-size:12px;margin:2px 0" }, el("span", { text: r[0] }), el("div", { style: "height:10px;border-radius:5px;background:var(--accent,#2a7);width:" + Math.max(2, 100 * r[1] / max) + "%" }), el("span", { text: String(r[1]) + (r[2] || "") })); })); }
  async function drawPanel(body) {
    var per = el("select", { class: "sel" }, [["30", "últimos 30 dias"], ["90", "últimos 90 dias"], ["365", "último ano"]].map(function (x) { return el("option", { value: x[0], text: x[1] }); }));
    var turno = el("select", { class: "sel" }, [["", "todos os turnos"], ["d", "diurno (7–19 h)"], ["n", "noturno (19–7 h)"]].map(function (x) { return el("option", { value: x[0], text: x[1] }); }));
    var out = el("div"); body.append(el("div", { class: "grid", style: "grid-template-columns:1fr 1fr;gap:6px" }, per, turno), out);
    async function draw() {
      out.textContent = "Carregando…";
      var desde = new Date(Date.now() - +per.value * 864e5).toISOString();
      var S = await call("stats", { desde: "2000-01-01" }), al = await call("alerts", {}); out.textContent = "";
      var pmap = {}; LIST.forEach(function (p) { pmap[p.id] = p; });
      var hourOf = function (e) { var h = (e.detalhes && e.detalhes.hora != null) ? e.detalhes.hora : new Date(e.created_at).getHours(); return h; };
      var inT = function (e) { if (!turno.value) return true; var h = hourOf(e), d = h >= 7 && h < 19; return turno.value === "d" ? d : !d; };
      var ev = S.eventos.filter(function (e) { return e.created_at >= desde && inT(e); });
      var count = function (tipo, key) { var m = {}; ev.filter(function (e) { return e.tipo === tipo; }).forEach(function (e) { var k = key(e); m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); };
      var tName = function (e) { return (pmap[e.protocolo_id] || {}).titulo || "protocolo"; };
      var apl = count("aplicacao", tName), emi = count("emissao", tName), dev = count("desvio", tName);
      var uName = {}; var medico = count("aplicacao", function (e) { if (!uName[e.user_id]) uName[e.user_id] = e.user_id === ME.uid ? "você" : "médico " + (Object.keys(uName).length + 1); return uName[e.user_id]; });
      var adesao = emi.map(function (r) { var d = (dev.find(function (x) { return x[0] === r[0]; }) || [0, 0])[1]; return [r[0], Math.round(100 * (r[1] - d) / r[1]), "% sem desvio"]; });
      var medsDev = {}; ev.filter(function (e) { return e.tipo === "desvio"; }).forEach(function (e) { (e.detalhes.removidos || []).forEach(function (m) { medsDev["− " + m] = (medsDev["− " + m] || 0) + 1; }); (e.detalhes.adicionados || []).forEach(function (m) { medsDev["＋ " + m] = (medsDev["＋ " + m] || 0) + 1; }); });
      var venc = LIST.filter(function (p) { return p.proxima_revisao && new Date(p.proxima_revisao) < new Date(); });
      out.append(
        sec("Protocolos mais aplicados", apl.length ? bars(apl.slice(0, 12)) : el("div", { class: "note", text: "Sem aplicações no período." })),
        medico.length ? sec("Aplicações por médico", bars(medico.slice(0, 12))) : null,
        sec("Adesão na emissão (receitas emitidas sem desvio do protocolo)", adesao.length ? bars(adesao, 100) : el("div", { class: "note", text: "Sem emissões após aplicar protocolo." })),
        sec("Desvios por remédio (− retirado, ＋ acrescentado)", Object.keys(medsDev).length ? bars(Object.keys(medsDev).map(function (k) { return [k, medsDev[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15)) : el("div", { class: "note", text: "Nenhum desvio registrado." })),
        sec("Alertas de desatualização", el("div", null, venc.slice(0, 20).map(function (p) { return el("div", { class: "err", text: "Revisão vencida: " + p.titulo + " (" + fmtD(p.proxima_revisao) + ")" }); }),
          al.map(function (a) { var p = pmap[a.protocolo_id] || {}; return el("div", { class: "note" }, badge(a.tipo === "pubmed" ? "PubMed" : a.tipo), el("b", { text: (p.titulo || "") + ": " }), a.url ? el("a", { href: a.url, target: "_blank", rel: "noopener", text: a.titulo }) : a.titulo, a.resumo ? el("div", { text: a.resumo, style: "white-space:pre-wrap" }) : null, " ", btn("Resolvido", async function () { await call("alertResolve", { aid: a.id }); draw(); }, "ghost")); }),
          !venc.length && !al.length ? el("div", { class: "note", text: "Nenhum alerta aberto. A busca no PubMed roda toda semana." }) : null)),
        prePost(S.eventos, pmap), teamsCompare(S.eventos), cycle(S.sugestoes));
    }
    per.addEventListener("change", draw); turno.addEventListener("change", draw); draw();
  }
  function prePost(evs, pmap) {
    var sel = el("select", { class: "sel" }, el("option", { value: "", text: "escolha um protocolo com mais de uma versão" }), LIST.filter(function (p) { return p.nVersoes > 1; }).map(function (p) { return el("option", { value: p.id, text: p.titulo }); }));
    var out = el("div");
    sel.addEventListener("change", function () { out.textContent = ""; var p = pmap[sel.value]; if (!p) return; var cut = p.head.created_at;
      var rate = function (arr) { var e = arr.filter(function (x) { return x.tipo === "emissao"; }).length, d = arr.filter(function (x) { return x.tipo === "desvio"; }).length; return e ? Math.round(100 * (e - d) / e) + "% de adesão (" + e + " emissões)" : "sem emissões"; };
      var mine = evs.filter(function (e) { return e.protocolo_id === p.id; });
      out.append(el("div", { text: "Antes da v" + p.head.numero + ": " + rate(mine.filter(function (e) { return e.created_at < cut; })) }), el("div", { text: "Depois da v" + p.head.numero + ": " + rate(mine.filter(function (e) { return e.created_at >= cut; })) }));
    });
    return sec("Antes e depois da implantação", el("div", null, sel, out, el("div", { class: "note", text: "Desfechos clínicos não são registrados no app; a comparação usa adesão e desvios." })));
  }
  function teamsCompare(evs) {
    if (!TEAMS || !TEAMS.equipes.length) return null;
    var rows = TEAMS.equipes.map(function (t) { var us = t.membros.map(function (m) { return m.user_id; }); var mine = evs.filter(function (e) { return us.indexOf(e.user_id) >= 0; }); var e = mine.filter(function (x) { return x.tipo === "emissao"; }).length, d = mine.filter(function (x) { return x.tipo === "desvio"; }).length; return [t.nome, e ? Math.round(100 * (e - d) / e) : 0, e ? "% (" + e + ")" : "% (sem dados)"]; });
    return sec("Comparação entre equipes (adesão)", bars(rows, 100));
  }
  function cycle(sug) {
    var d = function (a, b) { return a && b ? (new Date(b) - new Date(a)) / 864e5 : null; }, avg = function (arr) { arr = arr.filter(function (x) { return x != null; }); return arr.length ? (arr.reduce(function (s, x) { return s + x; }, 0) / arr.length).toFixed(1) + " dias" : "—"; };
    var open = sug.filter(function (s) { return /pendente|em_analise/.test(s.status); }).length, late = sug.filter(function (s) { return /pendente|em_analise/.test(s.status) && s.prazo && new Date(s.prazo) < new Date(); }).length;
    return sec("Ciclo de revisão das sugestões", el("div", null,
      el("div", { text: "Proposta → início da análise: " + avg(sug.map(function (s) { return d(s.created_at, s.analise_em); })) }),
      el("div", { text: "Proposta → decisão: " + avg(sug.map(function (s) { return d(s.created_at, s.decidido_em); })) }),
      el("div", { text: "Decisão → implantação: " + avg(sug.map(function (s) { return d(s.decidido_em, s.implantado_em); })) }),
      el("div", { text: "Abertas: " + open + " · fora do prazo: " + late + " · total: " + sug.length })));
  }

  /* ---------- equipes (admin) ---------- */
  async function drawTeams(body) {
    await loadTeams();
    var nome = inp("", "ex.: Plantão noturno PS"), tipo = el("select", { class: "sel" }, TIPO_EQ.map(function (t) { return el("option", { value: t, text: t }); }));
    body.appendChild(el("div", { class: "box" }, el("h3", { text: "Nova equipe" }), el("div", { class: "grid", style: "grid-template-columns:1fr auto auto;gap:6px" }, nome, tipo, btn("Criar", async function () { if (!nome.value.trim()) return; await call("teamCreate", { nome: nome.value.trim(), tipo: tipo.value }); body.textContent = ""; drawTeams(body); }, "primary"))));
    for (var i = 0; i < TEAMS.equipes.length; i++) (function (t) {
      var box = el("div", { class: "box" }, el("h3", { text: t.nome + " · " + t.tipo })), list = el("div", { class: "note", text: "Carregando membros…" });
      var email = inp("", "e-mail da conta do colega"), pap = el("select", { class: "sel" }, ["membro", "editor", "coordenador"].map(function (x) { return el("option", { value: x, text: x }); })), st = el("div", { class: "status" });
      box.append(list, el("div", { class: "grid", style: "grid-template-columns:1fr auto auto;gap:6px" }, email, pap, btn("Adicionar", async function () { try { var ok = await call("teamAdd", { equipe_id: t.id, email: email.value, papel: pap.value }); st.textContent = ok ? "Adicionado." : "Não há conta no app com esse e-mail."; st.className = "status " + (ok ? "ok" : "err"); ME = null; await loadMe(); loadM(); } catch (e) { st.textContent = e.message; st.className = "status err"; } })), st);
      async function loadM() { var ms = await call("teamMembers", { equipe_id: t.id }); list.textContent = ""; if (!ms.length) list.textContent = "Sem membros."; ms.forEach(function (m) { list.appendChild(el("div", null, m.email + " — " + m.papel + " ", btn("Remover", async function () { await call("teamRemove", { id: m.id }); loadM(); }, "ghost"))); }); }
      loadM(); body.appendChild(box);
    })(TEAMS.equipes[i]);
  }

  /* ---------- pontos de entrada ---------- */
  function homeBtn() {
    var hero = document.querySelector("#app .hero"); if (!hero || !document.getElementById("homeQ")) return;
    var bar = hero.querySelector("[data-psx-home]") || hero; if (bar.querySelector("[data-psx-prot]")) return;
    bar.appendChild(el("button", { class: "btn", type: "button", "data-psx-prot": "1", text: "Protocolos", onclick: function () { openLibrary(); } }));
  }
  function condBtn() {
    var grid = document.querySelector("#app .mods"); if (!grid || document.querySelector("#app [data-psx-prot-cond]")) return;
    var cur = T.C().proto; if (!cur) return;
    grid.parentNode.insertBefore(el("div", { class: "btns", "data-psx-prot-cond": "1", style: "margin:4px 0" }, btn("Protocolos desta condição", async function () {
      await loadMe(); await loadList(); var L = LIST.filter(function (p) { return p.proto_origem === T.C().proto; });
      var s = dialog("Protocolos desta condição", L.length + " encontrados"); if (!L.length) s.b.appendChild(el("div", { class: "note", text: "Nenhum. Abra \"Protocolos\" na tela inicial." }));
      L.forEach(function (p) { s.b.appendChild(el("div", { class: "box" }, el("b", { text: p.titulo }), " ", badge(CAMADA[p.camada]), el("div", { class: "btns" }, btn("Abrir", function () { openView(p); }), btn("Aplicar", function () { applyProt(p); }, "primary")))); });
    })), grid);
  }
  var busy = false;
  new MutationObserver(function () { if (busy) return; busy = true; requestAnimationFrame(function () { try { homeBtn(); condBtn(); } finally { busy = false; } }); }).observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
  homeBtn(); condBtn();
  // Aviso de novidades ao abrir o app (protocolos que o médico usa primeiro).
  setTimeout(async function () { try { await loadMe(); await loadList(); var n = novidades(); if (n.length) toast(n.length + " protocolo(s) que você usa foram atualizados. Abra \"Protocolos\" para ver as mudanças."); } catch (_) {} }, 2500);
  window.PSX_PROT = { open: openLibrary, apply: applyProt, view: openView, edit: openEdit, diff: diffView, flat: flat };
})();
