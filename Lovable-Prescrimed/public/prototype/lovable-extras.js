/* Complementos aditivos (carregados após lovable-documents.js):
   1) controle especial automático na prescrição (seleção e linhas digitadas);
   2) "Estilo dos documentos" nos Ajustes (logo, margens, cabeçalho, rodapé);
   3) "Receituário em branco" e "Minhas condições" (criar/editar/excluir condições personalizadas). */
(function () {
  "use strict";
  var D = window.PROTO_DB;
  var api = function () { return window.PSAPP && window.PSAPP.test; };
  var Cs = function () { var a = api(); return a && a.C(); };
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  function el(tag, attrs) {
    var n = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null || v === false) return;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k === "value") n.value = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x) n.appendChild(typeof x === "string" ? document.createTextNode(x) : x); }); }
    return n;
  }
  function read(k, f) { try { return JSON.parse(localStorage.getItem(k) || "null") || f; } catch (_) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { toast("Não consegui salvar (armazenamento cheio?)."); } }
  function toast(t) { var x = el("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3200); }
  function persist() { var C = Cs(); if (C) try { localStorage.setItem("psx.case", JSON.stringify(Object.assign({}, C, { docs: [] }))); } catch (_) {} }
  var title = function () { var t = document.getElementById("mTitle"); return t ? t.textContent.trim() : ""; };
  var modalOpen = function () { var m = document.getElementById("modal"); return m && m.open; };
  var isRx = function () { return modalOpen() && (title() === "Receita de alta" || title() === "Prescrição ambulatorial"); };

  /* ================= 1) controle especial automático ================= */
  var CTRL_NAMES = null;
  function ctrlNames() {
    if (CTRL_NAMES) return CTRL_NAMES;
    CTRL_NAMES = [];
    Object.keys(D.drugs).forEach(function (id) { var d = D.drugs[id]; if (!d.ctrl) return; var w = fold(d.n).replace(/\(.*?\)/g, "").split(/[ +\/,]/).filter(function (x) { return x.length >= 5; })[0]; if (w) CTRL_NAMES.push([w, d.n]); });
    return CTRL_NAMES;
  }
  function ctrlBanner(n, moved) {
    var body = document.getElementById("mBody"); if (!body) return;
    var old = body.querySelector("[data-psx-ctrl-banner]"); if (old) old.remove();
    var C = Cs(), total = C ? C.ctrl.itens.length : n;
    var box = el("div", { class: "box", "data-psx-ctrl-banner": "1", style: "border-color:var(--warn,#b7791f)" },
      el("h3", { text: "Receita de controle especial criada automaticamente" }),
      el("div", { class: "note", text: (moved ? moved + " linha(s) digitada(s) reconhecida(s) como controle especial. " : "") + total + " medicamento(s) na Receita de Controle Especial (2 vias, Portaria 344). Eles não saem na receita comum." }),
      el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Abrir receita de controle especial", onclick: function () { var a = api(); if (a) a.openMod("ctrl"); } })));
    body.insertBefore(box, body.firstChild);
  }
  function moveTypedCtrl() {
    var C = Cs(); if (!C || !C.rx || !C.rx.itens) return 0;
    var names = ctrlNames(), moved = 0;
    C.rx.itens = C.rx.itens.filter(function (it) {
      var m = fold(it.med); if (!m) return true;
      var hit = names.some(function (x) { return m.indexOf(x[0]) >= 0; });
      if (!hit) return true;
      var dup = C.ctrl.itens.some(function (c) { return fold(c.med) === m; });
      if (!dup) C.ctrl.itens.push({ med: it.med, qtd: it.qtd, pos: it.pos }); moved++; return false;
    });
    if (moved) persist();
    return moved;
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#modal button"); if (!b || !isRx()) return;
    var t = b.textContent.trim(), C = Cs(); if (!C) return;
    if (t === "Adicionar selecionados") {
      var before = C.ctrl.itens.length;
      setTimeout(function () { var add = C.ctrl.itens.length - before; if (add > 0) { ctrlBanner(add, 0); toast(add + " medicamento(s) enviado(s) para a Receita de controle especial."); } }, 0);
    } else if (t === "Gerar PDF") {
      var before2 = C.ctrl.itens.length, moved = moveTypedCtrl();
      setTimeout(function () { var add = C.ctrl.itens.length - before2; if (add > 0 || moved) { ctrlBanner(add, moved); } }, 0);
    }
  }, true);

  /* linha em branco na receita (receituário livre) */
  function reopenRx() {
    var a = api(), t = title(); if (!a) return;
    var keep = document.querySelector("[data-psx-ctrl-banner]");
    a.openMod("rx"); var tt = document.getElementById("mTitle"); if (tt) tt.textContent = t;
    var sub = document.getElementById("mSub"); if (sub && t === "Prescrição ambulatorial") sub.textContent = sub.textContent.replace("Receita de alta", t);
    if (keep) { var body = document.getElementById("mBody"); body.insertBefore(keep, body.firstChild); }
  }
  function enhanceRx() {
    if (!isRx()) return;
    var body = document.getElementById("mBody");
    var box = Array.from(body.querySelectorAll(".box")).find(function (b) { var h = b.querySelector("h3"); return h && h.textContent.trim() === "Receita"; });
    if (!box || box.querySelector("[data-psx-blank-line]")) return;
    var btn = el("button", { class: "btn sm", type: "button", "data-psx-blank-line": "1", text: "Adicionar linha em branco", onclick: function () {
      var C = Cs(); C.rx.itens.push({ med: "", qtd: "", via: "Uso oral", pos: "" }); persist(); reopenRx();
      setTimeout(function () { var ins = document.querySelectorAll("#mBody .rxitem input"); var last = ins[ins.length - 4]; if (last) last.focus(); }, 30);
    } });
    var list = box.querySelector(".rxlist"); if (list) list.after(el("div", { class: "btns" }, btn)); else box.appendChild(btn);
    prefillCustom();
  }
  function prefillCustom() {
    var C = Cs(), p = C && D.protocols.find(function (x) { return x.id === C.proto; });
    if (!p || !p.custom) return;
    ["cuidados", "alarme", "retorno", "visto"].forEach(function (k) {
      var ta = document.getElementById("rx_" + k); if (!ta || ta.value || !p.custom[k] || ta.dataset.psxFilled) return;
      ta.dataset.psxFilled = "1"; ta.value = p.custom[k]; ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  /* ================= 2) estilo dos documentos (Ajustes) ================= */
  function fld(label, input) { return el("label", { class: "f" }, el("span", { text: label }), input); }
  function enhanceCfg() {
    if (!modalOpen() || title() !== "Ajustes") return;
    var body = document.getElementById("mBody"); if (!body || body.querySelector("[data-psx-docstyle]")) return;
    var S = read("psx.docstyle", { ativo: true, logoPos: "esq", logoAlt: 16, mSup: "", mInf: "", mEsq: "", mDir: "", cabecalho: "", rodape: "", oficiais: false });
    var st = el("div", { class: "status" }), prev = el("div", { class: "preview" });
    function save() { write("psx.docstyle", S); st.textContent = "Salvo na sua conta."; st.className = "status ok"; }
    function inp(key, type, ph) { var i = el("input", { class: "in", type: type || "text", value: S[key] == null ? "" : S[key], placeholder: ph || "" }); i.addEventListener("input", function () { S[key] = i.value; save(); }); return i; }
    function ta(key, ph) { var t = el("textarea", { class: "ta", rows: 3, placeholder: ph }); t.value = S[key] || ""; t.addEventListener("input", function () { S[key] = t.value; save(); }); return t; }
    var img = el("img", { alt: "Logo", style: "max-height:56px;max-width:200px;display:" + (S.logo ? "block" : "none") }); if (S.logo) img.src = S.logo;
    var file = el("input", { type: "file", accept: "image/png,image/jpeg" });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () {
        var im = new Image(); im.onload = function () {
          var max = 600, sc = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement("canvas");
          cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
          var cx = cv.getContext("2d"), png = f.type === "image/png"; if (!png) { cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); }
          cx.drawImage(im, 0, 0, cv.width, cv.height);
          S.logo = cv.toDataURL(png ? "image/png" : "image/jpeg", 0.88); S.logoRatio = (cv.width / cv.height).toFixed(4);
          img.src = S.logo; img.style.display = "block"; save();
        }; im.src = r.result;
      }; r.readAsDataURL(f);
    });
    var pos = el("select", { class: "sel" }, [["esq", "Esquerda"], ["centro", "Centro"], ["dir", "Direita"]].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    pos.value = S.logoPos || "esq"; pos.addEventListener("change", function () { S.logoPos = pos.value; save(); });
    var ativo = el("input", { type: "checkbox" }); ativo.checked = S.ativo !== false; ativo.addEventListener("change", function () { S.ativo = ativo.checked; save(); });
    var of = el("input", { type: "checkbox" }); of.checked = !!S.oficiais; of.addEventListener("change", function () { S.oficiais = of.checked; save(); });
    var box = el("div", { class: "box", "data-psx-docstyle": "1" },
      el("h3", null, "Estilo dos documentos", el("small", { text: "vale para os seus PDFs, em qualquer aparelho" })),
      el("label", { class: "check" }, ativo, "Aplicar estilo nos PDFs"),
      el("div", { class: "grid" },
        fld("Logo (PNG ou JPG)", file), fld("Posição do logo", pos), fld("Altura do logo (mm)", inp("logoAlt", "number", "16")),
        fld("Margem superior extra (mm)", inp("mSup", "number", "0")), fld("Margem inferior extra (mm)", inp("mInf", "number", "0")),
        fld("Margem esquerda extra (mm)", inp("mEsq", "number", "0")), fld("Margem direita extra (mm)", inp("mDir", "number", "0"))),
      el("div", { class: "btns" }, img, el("button", { class: "btn sm ghost", type: "button", text: "Remover logo", onclick: function () { delete S.logo; img.style.display = "none"; save(); } })),
      fld("Cabeçalho (uma linha por item: endereço, telefone, e-mail, site, especialidade)", ta("cabecalho", "Rua Exemplo, 100 — Centro — Cabeceiras-GO\n(62) 0000-0000 · contato@clinica.com")),
      fld("Rodapé", ta("rodape", "Texto livre no fim de cada página")),
      el("label", { class: "check" }, of, "Aplicar também em formulários oficiais (APAC, controle especial, notificação)"),
      el("div", { class: "btns" }, el("button", { class: "btn sm primary", type: "button", text: "Pré-visualizar", onclick: function () { preview(prev, st); } })), st, prev);
    body.appendChild(box);
  }
  async function preview(box, st) {
    try {
      var jsPDF = window.jspdf.jsPDF, doc = new jsPDF({ unit: "mm", format: "a4" }), cfg = read("psx.cfg", {}), E = cfg.estab || {}, S = cfg.sol || {};
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(String(E.nome || "ESTABELECIMENTO"), 18, 20);
      doc.setLineWidth(0.45); doc.line(18, 28, 192, 28); doc.setFontSize(15); doc.text("RECEITUÁRIO (EXEMPLO)", 105, 40, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text("1. Medicamento — apresentação", 18, 60); doc.text("Tomar 1 comprimido de 8 em 8 horas.", 24, 66);
      doc.line(110, 250, 192, 250); doc.text(String(S.nome || "Médico"), 151, 256, { align: "center" });
      var ab = doc.output("arraybuffer"); box.textContent = "";
      if (!window.pdfjsLib) { st.textContent = "Visualizador indisponível."; return; }
      var pdf = await window.pdfjsLib.getDocument({ data: ab }).promise, page = await pdf.getPage(1), vp = page.getViewport({ scale: 0.9 }), cv = document.createElement("canvas");
      cv.width = vp.width; cv.height = vp.height; cv.style.border = "1px solid var(--line)"; box.appendChild(cv);
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    } catch (e) { st.textContent = "Não consegui gerar a prévia: " + e.message; st.className = "status err"; }
  }

  /* ================= 3) receituário em branco + minhas condições ================= */
  function blankRx() {
    var a = api(), C = Cs(); if (!a || !C) return;
    a.chooseProto("__branco");
    C.rx = { itens: [], duasVias: false, naoUsar: "", visto: "", cuidados: "", alarme: "", retorno: "" }; C.rxAll = true; C.rxSel = {}; C.rxOpen = {}; persist();
    setTimeout(function () { if (window.PSX_DOCS) window.PSX_DOCS.openAmbulatory(); }, 60);
  }
  function homeBar() {
    var hero = document.querySelector("#app .hero"); if (!hero || !document.getElementById("homeQ") || hero.querySelector("[data-psx-home]")) return;
    var n = (read("psx.custom", {}).conds || []).length;
    hero.appendChild(el("div", { class: "btns", "data-psx-home": "1", style: "margin-top:12px;justify-content:center;flex-wrap:wrap" },
      el("button", { class: "btn", type: "button", text: "Receituário em branco", onclick: blankRx }),
      el("button", { class: "btn", type: "button", text: "Minhas condições" + (n ? " (" + n + ")" : ""), onclick: function () { openCustom(); } }),
      el("button", { class: "btn primary", type: "button", text: "Criar condição personalizada", onclick: function () { openCustom({}); } })));
  }
  function slug(s) { return fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40); }
  function saveConds(conds) {
    write("psx.custom", { conds: conds });
    toast("Salvo na sua conta. Atualizando a lista…");
    setTimeout(function () { location.reload(); }, 1200);
  }
  function openCustom(edit) {
    var dlg = document.getElementById("psxCustomModal");
    if (!dlg) {
      dlg = el("dialog", { class: "modal", id: "psxCustomModal", "aria-labelledby": "psxCustomTitle" });
      dlg.innerHTML = '<div class="mhead"><div><h2 id="psxCustomTitle">Minhas condições</h2><small>criadas por você — só você vê</small></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="mbody" id="psxCustomBody"></div><div class="mfoot" id="psxCustomFoot"></div>';
      document.body.appendChild(dlg); dlg.querySelector(".x").addEventListener("click", function () { dlg.close(); });
    }
    var body = dlg.querySelector("#psxCustomBody"), foot = dlg.querySelector("#psxCustomFoot"); body.textContent = ""; foot.textContent = "";
    var conds = (read("psx.custom", {}).conds || []).slice();
    if (!edit) {
      if (!conds.length) body.appendChild(el("div", { class: "note", text: "Você ainda não criou nenhuma condição." }));
      conds.forEach(function (c, i) {
        body.appendChild(el("div", { class: "box" }, el("h3", { text: c.n }), el("div", { class: "note", text: [(c.cid || []).map(function (x) { return x[0]; }).join(", "), (c.drugs || []).length + " medicamento(s)", c.base ? "baseada em " + ((D.protocols.find(function (p) { return p.id === c.base; }) || {}).n || c.base) : ""].filter(Boolean).join(" · ") }),
          el("div", { class: "btns" },
            el("button", { class: "btn sm primary", type: "button", text: "Abrir", onclick: function () { dlg.close(); api().chooseProto(c.id); } }),
            el("button", { class: "btn sm", type: "button", text: "Editar", onclick: function () { openCustom(c); } }),
            el("button", { class: "btn sm ghost", type: "button", text: "Excluir", onclick: function () { if (confirm("Excluir \"" + c.n + "\"?")) { conds.splice(i, 1); saveConds(conds); } } }))));
      });
      foot.appendChild(el("button", { class: "btn primary", type: "button", text: "Criar nova", onclick: function () { openCustom({}); } }));
      if (!dlg.open) dlg.showModal(); return;
    }
    var c = JSON.parse(JSON.stringify(edit)); c.drugs = c.drugs || [];
    var st = el("div", { class: "status" });
    function tx(key, label, rows, ph) { var t = el(rows ? "textarea" : "input", { class: rows ? "ta" : "in", rows: rows || null, placeholder: ph || "" }); t.value = c[key] || ""; t.addEventListener("input", function () { c[key] = t.value; }); return fld(label, t); }
    var base = el("select", { class: "sel" }, [el("option", { value: "", text: "— nenhuma (começar do zero) —" })].concat(D.protocols.filter(function (p) { return p.id !== "__branco" && p.cat !== "Minhas condições"; }).slice().sort(function (a, b) { return a.n.localeCompare(b.n); }).map(function (p) { return el("option", { value: p.id, text: p.n }); })));
    base.value = c.base || "";
    var cidIn = el("input", { class: "in", placeholder: "ex.: J01.9 Sinusite aguda não especificada" }); cidIn.value = (c.cid || []).map(function (x) { return x[0] + " " + x[1]; }).join("; ");
    base.addEventListener("change", function () {
      c.base = base.value; var p = D.protocols.find(function (x) { return x.id === base.value; });
      if (p) { if (!cidIn.value) cidIn.value = (p.cid || []).map(function (x) { return x[0] + " " + x[1]; }).join("; "); if (!nameIn.value) { nameIn.value = p.n + " by "; c.n = nameIn.value; } }
    });
    var nameIn = el("input", { class: "in", placeholder: "ex.: Sinusite by Felipe" }); nameIn.value = c.n || ""; nameIn.addEventListener("input", function () { c.n = nameIn.value; });
    var chips = el("div", { class: "chips" }), q = el("input", { class: "in", type: "search", placeholder: "Buscar medicamento para adicionar…" }), res = el("div", { class: "chips" });
    function drawChips() { chips.textContent = ""; if (!c.drugs.length) chips.appendChild(el("span", { class: "note", text: "Nenhum medicamento escolhido (serão usados os da condição base)." }));
      c.drugs.forEach(function (id, i) { var d = D.drugs[id]; if (!d) return; chips.appendChild(el("button", { class: "chip on", type: "button", title: "Remover", text: d.n + (d.ctrl ? " · controle" : "") + " ×", onclick: function () { c.drugs.splice(i, 1); drawChips(); } })); }); }
    q.addEventListener("input", function () {
      res.textContent = ""; var t = fold(q.value).trim(); if (t.length < 2) return;
      Object.keys(D.drugs).filter(function (id) { return fold(D.drugs[id].n).indexOf(t) >= 0 && c.drugs.indexOf(id) < 0; }).slice(0, 12).forEach(function (id) {
        res.appendChild(el("button", { class: "chip", type: "button", text: "+ " + D.drugs[id].n, onclick: function () { c.drugs.push(id); drawChips(); q.value = ""; res.textContent = ""; q.focus(); } }));
      });
    });
    drawChips();
    body.append(
      el("div", { class: "box" }, el("h3", { text: c.id ? "Editar condição" : "Nova condição personalizada" }), el("div", { class: "grid" }, fld("Nome", nameIn), fld("Baseada em (copia exames, anamnese, exame físico e classes)", base), fld("CID-10 (separe vários com ;)", cidIn), tx("alias", "Palavras para a busca", 0, "ex.: sinusite seios da face"))),
      el("div", { class: "box" }, el("h3", null, "Medicamentos", el("small", { text: "aparecem primeiro, como \"Minha seleção\"" })), chips, q, res),
      el("div", { class: "box" }, el("h3", { text: "Orientações e alertas" }), tx("naoUsar", "Não usar", 2), tx("visto", "O que foi visto hoje", 2), tx("cuidados", "Como se cuidar", 4), tx("alarme", "Volte imediatamente se", 3), tx("retorno", "Retorno", 2), tx("alerta", "Alerta para o médico (aparece na condição)", 2)));
    foot.append(
      el("button", { class: "btn", type: "button", text: "Voltar", onclick: function () { openCustom(); } }),
      el("button", { class: "btn primary", type: "button", text: "Salvar condição", onclick: function () {
        c.n = (c.n || "").trim(); if (!c.n) { st.textContent = "Dê um nome à condição."; st.className = "status err"; return; }
        if (!c.base && !c.drugs.length) { st.textContent = "Escolha uma condição base ou pelo menos um medicamento."; st.className = "status err"; return; }
        c.cid = cidIn.value.split(";").map(function (s) { s = s.trim(); var m = /^([A-Za-z]\d{2}(?:\.?\d)?)\s*(.*)$/.exec(s); return m ? [m[1].toUpperCase(), m[2] || c.n] : null; }).filter(Boolean);
        if (!c.id) { c.id = "usr-" + (slug(c.n) || "cond") + "-" + Date.now().toString(36); conds.push(c); }
        else { var ix = conds.findIndex(function (x) { return x.id === c.id; }); if (ix >= 0) conds[ix] = c; else conds.push(c); }
        saveConds(conds);
      } }), st);
    if (!dlg.open) dlg.showModal();
  }

  var busy = false;
  new MutationObserver(function () { if (busy) return; busy = true; try { homeBar(); enhanceRx(); enhanceCfg(); } finally { busy = false; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
  homeBar();
  window.PSX_EXTRAS = { blankRx: blankRx, openCustom: openCustom };
})();
