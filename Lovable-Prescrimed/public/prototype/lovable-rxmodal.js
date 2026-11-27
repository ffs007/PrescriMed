/* Modal "Prescrição ambulatorial" — FASES 1 e 2 (layout, busca, organização e mesclagem do legado).
   ADITIVO: não altera app.js nem nenhum dado clínico. Reorganiza no DOM o que o motor já
   renderiza e usa o próprio botão (oculto) "Adicionar selecionados" do motor para incluir
   itens na receita — o texto, a dose e o PDF continuam sendo calculados pelo motor.
   - Marcar = entra na receita na hora; desmarcar = sai.
   - Card compacto (1 linha) quando não marcado; selects/prévia/alertas só quando marcado.
   - Grupos legados "(base anterior)" e rótulos duplicados ficam ocultos e seus medicamentos
     aparecem no grupo novo equivalente (PSX_RXLEG). Duplicatas (princípio + concentração +
     forma) são ocultadas; posologias diferentes viram opções no select do mesmo card. */
(function () {
  "use strict";
  if (window.PSX_RXMODAL) return;

  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  var el = function (t, a, kids) { var e = document.createElement(t); Object.keys(a || {}).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "html") e.innerHTML = a[k]; else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), a[k]); else e.setAttribute(k, a[k]); }); (kids || []).forEach(function (x) { if (x) e.appendChild(x); }); return e; };
  var D = function () { return window.PROTO_DB || { classes: {}, drugs: {} }; };
  var C = function () { try { return window.PSAPP.test.C(); } catch (_) { return null; } };
  var MAP = function () { return window.PSX_RXMAP || {}; };
  var LEG = function () { return window.PSX_RXLEG || {}; };
  var persist = function () { try { window.PSAPP.pr.setScore("__psx_sync", null); } catch (_) {} };

  /* ---------- "Mais usados": contagem local por usuário logado ---------- */
  function apOf(id) { var d = D().drugs[id] || {}; return (d.a && d.a[0] && d.a[0].ap) || (d.p && d.p.f && d.p.f[0] && d.p.f[0].ap) || ""; }
  function uid() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          var u = s && s.user && s.user.id;
          if (u) return u;
        }
      }
    } catch (_) {}
    return "anonimo";
  }
  function freqKey() { return "psx.rxfreq." + uid(); }
  function freqLoad() { try { return JSON.parse(localStorage.getItem(freqKey()) || "{}"); } catch (_) { return {}; } }
  function freqSave(f) { try { localStorage.setItem(freqKey(), JSON.stringify(f)); } catch (_) {} }

  /* ---------- CSS ---------- */
  var CSS = [
    "dialog.modal.rxm{width:96vw;max-width:96vw;height:92vh;max-height:92vh;position:relative}",
    "dialog.modal.rxm .mbody{display:flex;flex-direction:column;overflow-y:auto;padding:0 0 90px;gap:0}",
    "dialog.modal.rxm .mbody>.box{display:none}",
    "dialog.modal.rxm .mbody>.box.rxm-show{display:flex;margin:14px 18px}",
    "dialog.modal.rxm .mbody>.box.rxm-fill{flex:1;min-height:420px;margin:0;overflow:hidden}",
    ".rxm-grid{display:grid;grid-template-columns:320px 1fr;height:100%;min-height:0;width:100%}",
    ".rxm-side{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;background:var(--surface)}",
    ".rxm-search{padding:12px 12px 8px}",
    ".rxm-search .in{width:100%;height:48px;font-size:16px;padding:0 12px 0 38px;background:var(--bg)}",
    ".rxm-swrap{position:relative}",
    ".rxm-swrap svg{position:absolute;left:11px;top:14px;width:20px;height:20px;color:var(--muted);pointer-events:none}",
    ".rxm-tabs{display:flex;gap:4px;padding:4px 12px 8px}",
    ".rxm-tabs button{flex:1;height:38px;border:1px solid var(--line);background:var(--bg);color:var(--muted);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}",
    ".rxm-tabs button.on{background:var(--accent);color:#fff;border-color:var(--accent)}",
    ".rxm-cats{flex:1;overflow-y:auto;padding:0 6px 12px;min-height:0}",
    ".rxm-sec>button{width:100%;display:flex;align-items:center;gap:6px;padding:12px 8px 6px;background:none;border:0;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;text-align:left}",
    ".rxm-sec>button .n{font:600 11px var(--f-mono);background:var(--soft);border-radius:10px;padding:1px 7px;letter-spacing:0}",
    ".rxm-sec>button .car{margin-left:auto;font-size:11px}",
    ".rxm-cat{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;padding:8px 10px;border:0;border-radius:8px;background:none;color:var(--ink);font-size:14.5px!important;font-weight:500;text-transform:none!important;letter-spacing:0!important;text-align:left;cursor:pointer;line-height:1.3}",
    ".rxm-cat:hover{background:var(--soft)}",
    ".rxm-cat.on,.rxm-cat.on .nm{background:var(--accent-soft);color:var(--accent);font-weight:700}",
    ".rxm-cat .nm{flex:1;min-width:0;text-transform:none!important;font-size:14.5px!important;letter-spacing:0!important}",
    ".rxm-cat .ct{font:600 12px var(--f-mono);color:var(--muted);background:var(--soft);border-radius:10px;padding:1px 8px}",
    ".rxm-cat.on .ct{background:var(--accent);color:#fff}",
    ".rxm-main{overflow-y:auto;min-height:0;padding:14px 18px 90px;display:flex;flex-direction:column;gap:10px}",
    ".rxm-main>h3 small{margin-left:6px}",
    ".rxm-main>h3 small::before{content:'· '}",
    ".rxm-main .btns{display:none!important}",
    ".rxm-rows>h3{margin:14px 0 4px!important;font-size:15px!important;text-transform:none!important;letter-spacing:0!important;color:var(--ink)!important;font-weight:700}",
    ".rxm-rows .rxm-hid{display:none!important}",
    ".rxm-rows .drow{padding:8px 12px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px;background:var(--surface)}",
    ".rxm-rows .drow:not(.rxm-on)>:not(.dhead):not(.err){display:none!important}",
    ".rxm-rows .drow.rxm-on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}",
    ".rxm-rows .drow.rxm-act{outline:2px solid var(--accent)}",
    ".rxm-rows .drow .dhead{min-height:30px;cursor:pointer;display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
    ".rxm-rows .drow .dhead input[type=checkbox]{width:22px;height:22px;flex:none}",
    ".rxm-rows .drow .dhead .nm{font-size:16px;font-weight:600}",
    ".rxm-rows .drow .dhead .rxm-ap{font-size:14px;color:var(--muted)}",
    ".rxm-rows .drow .dhead .rxm-orig{font:600 10.5px var(--f-mono);color:var(--muted);border:1px dashed var(--line);border-radius:8px;padding:0 6px}",
    ".rxm-rows .drow.rxm-on .dhead .rxm-ap{display:none}",
    ".rxm-rows .drow .line{font-family:var(--f-body);font-size:14px;margin-top:6px}",
    ".rxm-rows .drow .det{font-size:13px;color:var(--muted)}",
    ".rxm-rows .drow .warn{font-size:13.5px;color:var(--warn)}",
    ".rxm-rows .drow select.sel,.rxm-rows .drow select.rxm-altsel{min-height:44px;font-size:15px}",
    ".rxm-rows .drow .rxm-alt{display:flex;flex-direction:column;gap:4px;margin-top:6px}",
    ".rxm-rows .drow .rxm-alt span{font-size:13px;color:var(--muted)}",
    ".rxm-protlink{display:block;margin:0 0 10px;padding:10px 12px;border:1px solid var(--accent);border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:700;font-size:14px;cursor:pointer;text-align:left;width:100%}",
    ".rxm-empty{padding:24px;text-align:center;color:var(--muted);font-size:14px}",
    ".rxm-bar{position:absolute;left:0;right:0;bottom:57px;z-index:3;display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--surface);border-top:1px solid var(--line);overflow-x:auto}",
    ".rxm-bar b{font-size:14px;white-space:nowrap}",
    ".rxm-bar .chipx{display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);color:var(--accent);border-radius:14px;padding:3px 6px 3px 10px;font-size:13px;font-weight:600;white-space:nowrap}",
    ".rxm-bar .chipx.ctrl{background:var(--warn-soft,var(--soft));color:var(--warn)}",
    ".rxm-bar .chipx button{border:0;background:none;color:inherit;font-size:16px;cursor:pointer;line-height:1;padding:0 2px}",
    ".rxm-bar .none{color:var(--muted);font-size:13px}",
    ".rxm-mtabs{display:none}",
    "@media (max-width:1023px){",
    " .rxm-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr}",
    " .rxm-side{border-right:0;border-bottom:1px solid var(--line)}",
    " .rxm-grid.rxm-mob-med .rxm-side .rxm-cats,.rxm-grid.rxm-mob-med .rxm-side .rxm-tabs{display:none}",
    " .rxm-grid:not(.rxm-mob-med) .rxm-main{display:none}",
    " .rxm-mtabs{display:flex;gap:4px;padding:0 12px 8px}",
    " .rxm-mtabs button{flex:1;height:36px;border:1px solid var(--line);background:var(--bg);color:var(--muted);border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer}",
    " .rxm-mtabs button.on{background:var(--accent);color:#fff;border-color:var(--accent)}",
    "}",
    ".rxm-freq{border-bottom:1px solid var(--line);padding:2px 6px 10px}",
    ".rxm-freq .hd{display:flex;align-items:center;gap:6px;padding:6px 8px 4px;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}",
    ".rxm-freq .hd .dots{margin-left:auto;border:0;background:none;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:6px}",
    ".rxm-freq .hd .dots:hover{background:var(--soft)}",
    ".rxm-freq .row{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:5px 10px;border:0;border-radius:8px;background:none;color:var(--ink);font-size:14px;text-align:left;cursor:pointer}",
    ".rxm-freq .row:hover{background:var(--soft)}",
    ".rxm-freq .row .cbx{width:18px;height:18px;flex:none;border:1.5px solid var(--line);border-radius:5px;display:grid;place-items:center;font-size:12px;color:transparent}",
    ".rxm-freq .row.on .cbx{background:var(--accent);border-color:var(--accent);color:#fff}",
    ".rxm-freq .row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".rxm-freq .row .x{font:600 11px var(--f-mono);color:var(--muted)}",
    ".rxm-freq .row.on{background:var(--accent-soft);color:var(--accent);font-weight:700}",
    ".rxm-freq .clr{width:100%;margin-top:4px;border:0;background:none;color:var(--bad);font-size:12.5px;text-align:left;padding:4px 10px;cursor:pointer;border-radius:6px}",
    ".rxm-kit{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:10px 12px;border:1px dashed var(--accent);border-radius:10px;background:var(--accent-soft)}",
    ".rxm-kit .use{border:0;background:var(--accent);color:#fff;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:700;cursor:pointer}",
    ".rxm-kit .undo{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:7px 12px;font-size:13.5px;font-weight:600;cursor:pointer}",
    ".rxm-kit .info{font-size:13px;color:var(--ink);font-weight:600}",
    ".rxm-kitalt{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:12.5px;color:var(--muted)}",
    ".rxm-kitalt button{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:4px 10px;font-size:12.5px;cursor:pointer}",
    ".rxm-kitalt button:hover{border-color:var(--accent);color:var(--accent)}",
    ".rxm-bar .chipx.kit{background:var(--soft);color:var(--ink);border:1px dashed var(--accent)}"
  ].join("\n");
  var st = document.createElement("style"); st.id = "rxmCss"; st.textContent = CSS; document.head.appendChild(st);

  /* ---------- mesclagem do legado (só exibição; calculada uma vez a partir dos dados) ---------- */
  var SALT = /\b(cloridrato|dicloridrato|maleato|besilato|oxalato|sulfato|bissulfato|bromidrato|butilbrometo|fosfato|dissodico|acetato|dipropionato|estolato|trometamol|potassica|potassico|sodico|sodica|de|do|da|susp|gotas|xarope|spray|granulado)\b/g;
  var FORMS = ["comprimido", "capsula", "dragea", "gotas", "solucao", "suspensao", "xarope", "sublingual", "injetavel", "mastigavel", "aerossol", "lp", "liberacao prolongada", "sache"];
  function princ(n) {
    var f = fold(n).replace(/\(([^)]*)\)/g, " ").replace(/^aas\b/, "acido acetilsalicilico");
    return f.replace(SALT, " ").replace(/[^a-z0-9+ ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function conc(ap) { var m = fold(ap).replace(/\s+/g, "").match(/^(\d+(?:[.,]\d+)?)(mcg|mg|g|ui)(\/\d*(?:[.,]\d+)?ml)?/); return m ? m[1].replace(",", ".") + m[2] + (m[3] || "") : null; }
  function form(ap) { var f = fold(ap); var hit = FORMS.filter(function (x) { return f.indexOf(x) >= 0; }); return hit.length ? hit.sort().join("|") : null; }
  function posList(ap) { return (ap.pos || []).map(function (x) { return fold(x.t).replace(/\s+/g, " ").trim(); }); }

  var MG = null; // { hide: {legId: keptId}, alt: {keptId: [{id, ai, pi, t}]}, origin: {id:1}, conflicts: [] }
  function merge() {
    if (MG) return MG;
    var db = D(), L = LEG();
    MG = { hide: {}, alt: {}, origin: {}, conflicts: [], moved: {} };
    Object.keys(L).forEach(function (src) {
      var cs = db.classes[src]; if (!cs) return;
      var tgt = L[src];
      cs.d.forEach(function (lid) { var dl = db.drugs[lid]; if (dl && dl.origem === "base_anterior") MG.origin[lid] = 1; });
      if (tgt.charAt(0) === "=" || !db.classes[tgt]) return;
      var tds = db.classes[tgt].d.filter(function (x) { return db.drugs[x]; });
      cs.d.forEach(function (lid) {
        var dl = db.drugs[lid]; if (!dl || tds.indexOf(lid) >= 0) return;
        var pl = princ(dl.n), match = null;
        tds.some(function (tid) {
          var dt = db.drugs[tid]; if (princ(dt.n) !== pl) return false;
          (dl.a || []).some(function (la, ai) {
            var lc = conc(la.ap), lf = form(la.ap);
            return (dt.a || []).some(function (ta) {
              if (!lc || conc(ta.ap) !== lc) return false;
              var tf = form(ta.ap); if (lf && tf && lf !== tf) return false;
              match = { tid: tid, ai: ai, la: la, ta: ta }; return true;
            });
          });
          return !!match;
        });
        if (!match) { MG.moved[lid] = tgt; return; }
        MG.hide[lid] = match.tid;
        var tp = posList(match.ta), diff = [];
        (match.la.pos || []).forEach(function (p, pi) { if (tp.indexOf(fold(p.t).replace(/\s+/g, " ").trim()) < 0) diff.push({ id: lid, ai: match.ai, pi: pi, t: p.t }); });
        if (diff.length) {
          MG.alt[match.tid] = (MG.alt[match.tid] || []).concat(diff);
          MG.conflicts.push({ med: db.drugs[match.tid].n, ap: match.ta.ap, novo: (match.ta.pos || []).map(function (x) { return x.t; }), legado: diff.map(function (x) { return x.t; }), grupo: db.classes[tgt].n });
        }
      });
    });
    return MG;
  }

  /* ---------- entradas da coluna esquerda ---------- */
  function sourcesOf(k) { var L = LEG(); return Object.keys(L).filter(function (s) { return L[s] === k; }); }
  function visibleIds(keys) {
    var db = D(), mg = merge(), seen = {}, out = [];
    keys.forEach(function (k) { (db.classes[k] ? db.classes[k].d : []).forEach(function (id) { if (seen[id] || !db.drugs[id] || mg.hide[id]) return; seen[id] = 1; out.push(id); }); });
    return out;
  }
  var ORIENT = /^(orientac|cuidados|medidas|manejo nao|higiene|reabilitac|prevencao$|habito|protecao|hipoglicemia — orient)/;
  function entries(tab) {
    var db = D(), M = MAP(), L = LEG(), out = [];
    var keys = Object.keys(db.classes);
    if (tab === "classe") {
      keys.forEach(function (k) {
        var lg = L[k];
        if (lg && lg.charAt(0) !== "=" && db.classes[lg]) return; // mesclado no equivalente
        var e;
        if (lg && lg.charAt(0) === "=") { var p = lg.slice(1).split("|"); e = { id: k, label: p[0], sec: p[1], ord: 9000 + out.length, keys: [k] }; }
        else { var m = M[k] || { sec: "outros", ord: 9999 }; e = { id: k, label: db.classes[k].n.replace(/\s*—\s*tratamento$/, ""), sec: m.sec, ord: m.ord, keys: [k].concat(sourcesOf(k)) }; }
        e.ids = visibleIds(e.keys); out.push(e);
      });
    } else {
      var byQ = {};
      keys.forEach(function (k) {
        var m = M[k]; if (!m || !m.q) return;
        var q = byQ[m.q];
        if (!q) { q = byQ[m.q] = { id: "q:" + m.q, label: m.q, sec: m.sec, ord: m.ord, keys: [], orient: 0 }; out.push(q); }
        q.keys.push(k); q.keys = q.keys.concat(sourcesOf(k));
        if (ORIENT.test(fold(db.classes[k].n))) q.orient++;
      });
      out.forEach(function (e) { e.ids = visibleIds(e.keys); });
    }
    return out.sort(function (a, b) { return a.ord - b.ord; });
  }

  /* ---------- busca ---------- */
  function synFor(drugName) {
    var f = fold(drugName), out = [], S = window.PSX_RXSYN || {};
    Object.keys(S).forEach(function (k) { if (f.indexOf(k) >= 0) out = out.concat(S[k]); });
    return out;
  }
  function lev1(a, b) {
    if (a === b) return true;
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > 1 || m < 4) return false;
    var i = 0, j = 0, d = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (m > n) i++; else if (n > m) j++; else { i++; j++; }
    }
    return true;
  }
  function matchRow(row, toks) {
    var nm = fold((row.querySelector(".nm") || {}).textContent || "");
    var hay = nm + " " + fold(synFor(nm).join(" ")) + " " + fold(row.dataset.groups || "");
    return toks.every(function (t) {
      if (hay.indexOf(t) >= 0) return true;
      if (t.length >= 4) return hay.split(/[^a-z0-9]+/).some(function (w) { return lev1(t, w); });
      return false;
    });
  }

  var state = { tab: "classe", entry: null, q: "", open: {}, added: {}, alt: {} };

  function isRxModal() {
    var m = document.getElementById("modal"), t = document.getElementById("mTitle");
    return m && m.open && t && /Prescrição ambulatorial|Receita de alta/.test(t.textContent);
  }

  function enhance() {
    if (!isRxModal()) return;
    var modal = document.getElementById("modal"), body = document.getElementById("mBody");
    var box = null;
    body.querySelectorAll(":scope > .box").forEach(function (b) {
      var h = b.querySelector("h3");
      if (h && /^Condutas medicamentosas/.test(h.textContent)) box = b;
    });
    if (!box || box.dataset.rxm === "1") return;
    box.dataset.rxm = "1";
    modal.classList.add("rxm");
    state.added = {}; state.alt = {}; state.entry = null; state.kit = null;

    var chips = box.querySelector(".chips");
    var allBox = box.querySelector("label.check");
    var rowsDiv = null, btns = null;
    Array.prototype.forEach.call(box.children, function (ch) {
      if (ch === chips || ch === allBox || ch.tagName === "H3") return;
      if (ch.classList.contains("btns")) btns = ch;
      else if (!rowsDiv && ch.tagName === "DIV") rowsDiv = ch;
    });
    if (!chips || !rowsDiv || !btns) return;
    var addBtn = btns.querySelector("button");
    chips.style.display = "none";
    if (allBox) {
      allBox.style.display = "none";
      var allCb = allBox.querySelector("input[type=checkbox]");
      if (allCb && !allCb.checked) allCb.click();
    }

    /* --- estrutura --- */
    var grid = el("div", { class: "rxm-grid" });
    var side = el("div", { class: "rxm-side" });
    var main = el("div", { class: "rxm-main" });
    var search = el("input", { class: "in", id: "rxmQ", type: "search", autocomplete: "off", placeholder: "Buscar remédio, sinônimo, nome comercial ou queixa…", "aria-label": "Buscar medicamento" });
    var swrap = el("div", { class: "rxm-swrap" }, [
      el("span", { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' }),
      search
    ]);
    var tabs = el("div", { class: "rxm-tabs" });
    var tabQ = el("button", { type: "button", text: "Por queixa" });
    var tabC = el("button", { type: "button", text: "Por classe" });
    tabs.append(tabQ, tabC);
    var mtabs = el("div", { class: "rxm-mtabs" });
    var mCat = el("button", { type: "button", text: "Categorias", class: "on" });
    var mMed = el("button", { type: "button", text: "Medicamentos" });
    mtabs.append(mCat, mMed);
    var cats = el("div", { class: "rxm-cats" });
    var freq = el("div", { class: "rxm-freq" });
    side.append(el("div", { class: "rxm-search" }, [swrap]), tabs, mtabs, freq, cats);
    grid.append(side, main);

    var h3orig = box.querySelector("h3");
    box.textContent = "";
    rowsDiv.classList.add("rxm-rows");
    var kitBar = el("div", { class: "rxm-kit", style: "display:none" });
    main.append(h3orig, chips, allBox || el("span"), kitBar, rowsDiv, btns);
    box.appendChild(grid);
    box.classList.add("rxm-show", "rxm-fill");
    body.querySelectorAll(":scope > .box").forEach(function (b) { if (b !== box) b.classList.add("rxm-show"); });
    body.querySelectorAll(":scope > .preview, :scope > .alertbox, :scope > .note").forEach(function (n) { n.classList.add("rxm-show"); });
    body.style.overflowY = "auto";

    /* --- ordem das classes exatamente como o motor --- */
    function clsList() {
      var p = null; try { p = window.PSAPP.pr.current(); } catch (_) {}
      var base = (p && p.cls) || [], c = C();
      return c && c.rxAll ? base.concat(Object.keys(D().classes).filter(function (k) { return base.indexOf(k) < 0; })) : base;
    }
    function openOnly(keys) {
      var c = C(), list = clsList(), ch = chips.querySelectorAll("button.chip");
      if (!c || !list.length || !ch.length) return;
      list.forEach(function (k) { c.rxOpen[k] = keys === true || keys.indexOf(k) >= 0; });
      c.rxOpen[list[0]] = !c.rxOpen[list[0]];
      ch[0].click(); // o motor inverte de volta e redesenha uma única vez
    }

    /* --- receita: itens comuns + controle especial --- */
    function rxBox() { var r = null; body.querySelectorAll(":scope > .box").forEach(function (b) { var h = b.querySelector("h3"); if (h && h.textContent.trim().indexOf("Receita") === 0 && !r) r = b; }); return r; }
    function removeRef(a) {
      var c = C(); if (!c || !a) return;
      if (a.arr === "rx") {
        var i = c.rx.itens.indexOf(a.ref); if (i < 0) return;
        var xs = rxBox() ? rxBox().querySelectorAll(".rxitem .x") : [];
        if (xs[i]) xs[i].click(); else { c.rx.itens.splice(i, 1); persist(); }
      } else {
        var j = c.ctrl.itens.indexOf(a.ref); if (j >= 0) { c.ctrl.itens.splice(j, 1); persist(); }
      }
    }
    function addItem(id) {
      var c = C(); if (!c) return;
      var alt = state.alt[id], sl = c.rxSel[id] = c.rxSel[id] || {};
      if (alt) { var s2 = c.rxSel[alt.id] = c.rxSel[alt.id] || {}; s2.ai = alt.ai; s2.pi = alt.pi; s2.on = true; sl.on = false; }
      else sl.on = true;
      var nR = c.rx.itens.length, nC = c.ctrl.itens.length;
      addBtn.click();
      if (c.rx.itens.length > nR) state.added[id] = { arr: "rx", ref: c.rx.itens[c.rx.itens.length - 1] };
      else if (c.ctrl.itens.length > nC) state.added[id] = { arr: "ctrl", ref: c.ctrl.itens[c.ctrl.itens.length - 1] };
      persist(); drawBar();
    }
    function removeItem(id) { var a = state.added[id]; delete state.added[id]; removeRef(a); annotate(); drawBar(); }

    var bar = el("div", { class: "rxm-bar" });
    var mFoot = document.getElementById("mFoot");
    modal.insertBefore(bar, mFoot);
    // "Mais usados": +1 por medicamento marcado quando o documento é gerado
    if (mFoot) mFoot.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!b || !/Gerar PDF/.test(b.textContent)) return;
      var f = freqLoad(), db = D();
      Object.keys(state.added).forEach(function (id) {
        var dr = db.drugs[id]; if (!dr) return;
        var en = f[id] || { n: 0, label: "" };
        en.n++; en.label = dr.n + " " + apOf(id);
        f[id] = en;
      });
      freqSave(f); drawFreq();
    }, true);
    function drawBar() {
      bar.textContent = "";
      var c = C(); if (!c) return;
      var all = c.rx.itens.map(function (it) { return { it: it, arr: "rx" }; }).concat(c.ctrl.itens.map(function (it) { return { it: it, arr: "ctrl" }; }));
      bar.appendChild(el("b", { text: "Receita (" + all.length + ")" }));
      if (state.kit) bar.appendChild(el("span", { class: "chipx kit", title: "Itens adicionados pelo kit da queixa" }, [
        document.createTextNode("kit: " + state.kit.q),
        el("button", { type: "button", text: "×", "aria-label": "Desfazer kit", onclick: function () { undoKit(); } })
      ]));
      if (!all.length) { bar.appendChild(el("span", { class: "none", text: "marque um medicamento e ele entra aqui na hora" })); return; }
      all.forEach(function (x) {
        bar.appendChild(el("span", { class: "chipx" + (x.arr === "ctrl" ? " ctrl" : ""), title: x.arr === "ctrl" ? "Controle especial" : "" }, [
          document.createTextNode(x.it.med),
          el("button", { type: "button", text: "×", "aria-label": "Remover " + x.it.med, onclick: function () {
            Object.keys(state.added).forEach(function (id) { if (state.added[id].ref === x.it) delete state.added[id]; });
            removeRef({ arr: x.arr, ref: x.it }); annotate(); drawBar();
          } })
        ]));
      });
    }

    /* --- anotação das linhas renderizadas pelo motor --- */
    var mo = null, emptyMsg = null, protLink = null, kitLink = null;
    function itemFor(row) {
      var c = C(); if (!c) return null;
      var det = (row.querySelector(".det") || {}).textContent || "", line = (row.querySelector(".line") || {}).textContent || "";
      var med = det.split(" · ")[0], taken = Object.keys(state.added).map(function (k) { return state.added[k].ref; });
      var hit = null;
      c.rx.itens.some(function (it) { if (taken.indexOf(it) < 0 && it.med === med && it.pos === line) { hit = { arr: "rx", ref: it }; return true; } return false; });
      if (!hit) c.ctrl.itens.some(function (it) { if (taken.indexOf(it) < 0 && it.med === med && it.pos === line) { hit = { arr: "ctrl", ref: it }; return true; } return false; });
      return hit;
    }
    function annotate() {
      if (mo) mo.disconnect();
      var db = D(), mg = merge(), L = LEG(), c = C();
      var open = clsList().filter(function (k) { return c && c.rxOpen[k]; });
      var kids = Array.prototype.slice.call(rowsDiv.children).filter(function (n) { return n.tagName === "H3" || n.classList.contains("drow"); });
      var hi = 0, seen = {}, cur = null, ids = [], heads = {};
      kids.forEach(function (n) {
        if (n.tagName === "H3") {
          cur = open[hi++]; n.dataset.key = cur || ""; heads[cur] = n;
          ids = cur && db.classes[cur] ? db.classes[cur].d.filter(function (id) { if (seen[id] || !db.drugs[id]) return false; seen[id] = 1; return true; }) : [];
          var lg = L[cur];
          n.classList.toggle("rxm-hid", !!(lg && lg.charAt(0) !== "=" && db.classes[lg]));
          if (lg && lg.charAt(0) === "=") n.textContent = lg.slice(1).split("|")[0];
          return;
        }
        var id = ids.shift(); if (!id) return;
        n.dataset.id = id; n.dataset.cls = cur;
        var lg2 = L[cur], tgt = lg2 && lg2.charAt(0) !== "=" ? lg2 : cur;
        n.dataset.groups = db.classes[tgt] ? db.classes[tgt].n : "";
        n.classList.toggle("rxm-hid", !!mg.hide[id]);
        var head = n.querySelector(".dhead");
        if (head && !head.querySelector(".rxm-ap")) {
          head.appendChild(el("span", { class: "rxm-ap", text: apOf(id) }));
          if (mg.origin[id]) head.appendChild(el("span", { class: "rxm-orig", text: "origem: base anterior" }));
        }
      });
      // move os medicamentos só-legado para o grupo novo equivalente
      kids.forEach(function (n) {
        var k = n.dataset.cls, lg = L[k];
        if (!n.dataset.id || !lg || lg.charAt(0) === "=" || mg.hide[n.dataset.id] || !heads[lg]) return;
        var h = heads[lg], last = h, nx = h.nextElementSibling;
        while (nx && nx.tagName !== "H3") { if (nx.dataset.cls === lg || nx.dataset.moved === lg) last = nx; nx = nx.nextElementSibling; }
        if (last.nextElementSibling !== n) last.after(n);
        n.dataset.moved = lg;
      });
      // estado marcado + opções de posologia
      Array.prototype.forEach.call(rowsDiv.querySelectorAll(".drow"), function (n) {
        var id = n.dataset.id; if (!id) return;
        var cb = n.querySelector(".dhead input[type=checkbox]");
        if (!state.added[id]) { var f = itemFor(n); if (f) state.added[id] = f; }
        var a = state.added[id], live = a && C() && (C()[a.arr === "rx" ? "rx" : "ctrl"].itens.indexOf(a.ref) >= 0);
        if (a && !live) { delete state.added[id]; a = null; }
        if (cb) cb.checked = !!a;
        n.classList.toggle("rxm-on", !!a);
        var alts = mg.alt[id];
        if (alts && !n.querySelector(".rxm-alt")) {
          var s = el("select", { class: "rxm-altsel", "aria-label": "Posologia" });
          s.appendChild(el("option", { value: "", text: "Posologia padrão (acima)" }));
          alts.forEach(function (o, i) { s.appendChild(el("option", { value: String(i), text: "Base anterior: " + o.t })); });
          var cur2 = state.alt[id]; if (cur2) s.value = String(alts.indexOf(cur2));
          s.addEventListener("change", function () {
            state.alt[id] = s.value === "" ? null : alts[+s.value];
            if (state.added[id]) { removeItem(id); addItem(id); }
          });
          var wrap = el("label", { class: "rxm-alt" }, [el("span", { text: "Outras posologias cadastradas para este medicamento" }), s]);
          var ln = n.querySelector(".line"); if (ln) ln.after(wrap); else n.appendChild(wrap);
        }
        // alternativas do kit (mesma classe, não marcadas) — troca com 1 clique
        var oldAlt = n.querySelector(".rxm-kitalt");
        if (oldAlt && !(state.kit && state.kit.clsOf[id])) oldAlt.remove();
        if (state.kit && state.kit.clsOf[id] && !n.querySelector(".rxm-kitalt")) {
          var mk = (state.kit.def.meds || []).filter(function (m) { return m.id === id; })[0];
          if (mk && mk.alts.length) {
            var altWrap = el("div", { class: "rxm-kitalt" }, [el("span", { text: "Alternativas:" })]);
            mk.alts.forEach(function (aid) {
              var dr = D().drugs[aid]; if (!dr) return;
              altWrap.appendChild(el("button", { type: "button", text: dr.n, onclick: function () { swapKit(id, aid); } }));
            });
            n.appendChild(altWrap);
          }
        }
      });
      filterRows();
      if (mo) mo.observe(rowsDiv, { childList: true });
    }

    function filterRows() {
      var q = fold(search.value).trim();
      state.q = q;
      var toks = q.split(/\s+/).filter(Boolean), searching = toks.length > 0;
      var rows = Array.prototype.slice.call(rowsDiv.children), visible = 0, i, j;
      for (i = 0; i < rows.length; i++) {
        var n = rows[i];
        if (n.tagName !== "H3") continue;
        var has = false;
        for (j = i + 1; j < rows.length && rows[j].tagName !== "H3"; j++) {
          var r = rows[j]; if (!r.classList.contains("drow")) continue;
          var show = !r.classList.contains("rxm-hid") && (!searching || matchRow(r, toks));
          r.style.display = show ? "" : "none";
          if (show) { has = true; visible++; }
        }
        // cabeçalho oculto (legado mesclado) só aparece se for o único dono dos itens visíveis
        n.style.display = has && !n.classList.contains("rxm-hid") ? "" : "none";
      }
      if (emptyMsg) { emptyMsg.remove(); emptyMsg = null; }
      if (protLink) { protLink.remove(); protLink = null; }
      if (kitLink) { kitLink.remove(); kitLink = null; }
      if (searching) {
        var prots = (D().protocols || []).filter(function (p) { return fold(p.n).indexOf(q) >= 0 || fold(p.alias || "").indexOf(q) >= 0; });
        if (prots.length) {
          protLink = el("button", { class: "rxm-protlink", type: "button", text: "Abrir protocolo: " + prots[0].n, onclick: function () {
            try { window.PSAPP.test.chooseProto(prots[0].id); window.PSAPP.test.openMod("rx"); } catch (_) {}
          } });
          rowsDiv.parentNode.insertBefore(protLink, rowsDiv);
        }
        var qe = entries("queixa").filter(function (e) { return fold(e.label).indexOf(q) >= 0 && kitFor(e); })[0];
        if (qe) {
          kitLink = el("button", { class: "rxm-protlink", type: "button", text: "⚡ Usar kit: " + qe.label, onclick: function () { applyKit(qe); } });
          rowsDiv.parentNode.insertBefore(kitLink, rowsDiv);
        }
        if (!visible) { emptyMsg = el("div", { class: "rxm-empty", text: "Nenhum medicamento encontrado para “" + search.value + "”." }); main.appendChild(emptyMsg); }
      }
      drawBar(); drawKitBar();
    }

    /* --- "Mais usados" (coluna esquerda, acima das categorias) --- */
    function drawFreq() {
      freq.textContent = "";
      var f = freqLoad(), mg = merge(), db = D();
      var ids = Object.keys(f).filter(function (id) { return db.drugs[id] && !mg.hide[id]; });
      if (!ids.length) return;
      ids.sort(function (a, b) { return f[b].n - f[a].n; });
      var clr = null;
      var hd = el("div", { class: "hd" }, [document.createTextNode("Mais usados")]);
      var dots = el("button", { class: "dots", type: "button", text: "⋯", "aria-label": "Opções de mais usados" });
      dots.addEventListener("click", function () {
        if (clr) { clr.remove(); clr = null; return; }
        clr = el("button", { class: "clr", type: "button", text: "Limpar mais usados" });
        clr.addEventListener("click", function () { freqSave({}); drawFreq(); });
        freq.appendChild(clr);
      });
      hd.appendChild(dots);
      freq.appendChild(hd);
      ids.slice(0, 8).forEach(function (id) {
        var on = !!state.added[id];
        var row = el("button", { class: "row" + (on ? " on" : ""), type: "button" }, [
          el("span", { class: "cbx", text: "✓" }),
          el("span", { class: "nm", text: f[id].label || db.drugs[id].n }),
          el("span", { class: "x", text: "×" + f[id].n })
        ]);
        row.addEventListener("click", function () {
          if (state.added[id]) { removeItem(id); drawFreq(); return; }
          openOnly(true);
          setTimeout(function () {
            var r = rowsDiv.querySelector('.drow[data-id="' + id + '"]');
            var cb = r && r.querySelector(".dhead input[type=checkbox]");
            if (cb && !cb.checked) cb.click();
            drawFreq();
          }, 40);
        });
        freq.appendChild(row);
      });
    }

    /* --- kits de 1 clique por queixa (só itens já cadastrados no grupo) --- */
    function kitFor(entry) {
      if (!entry || entry.id.indexOf("q:") !== 0) return null;
      var db = D(), mg = merge(), meds = [], orient = [];
      entry.keys.forEach(function (k) {
        var cs = db.classes[k]; if (!cs) return;
        var ids = cs.d.filter(function (id) { return db.drugs[id] && !mg.hide[id]; });
        if (!ids.length) return;
        if (ORIENT.test(fold(cs.n))) { orient = orient.concat(ids); return; }
        if (meds.some(function (m) { return m.id === ids[0]; })) return; // mesma 1ª opção já cobre a classe
        meds.push({ id: ids[0], cls: k, alts: ids.slice(1) });
      });
      if (!meds.length) return null;
      return { q: entry.label, meds: meds, orient: orient };
    }
    function currentEntry() {
      var l = entries(state.tab);
      for (var i = 0; i < l.length; i++) if (l[i].id === state.entry) return l[i];
      return null;
    }
    function clickRow(id, want) {
      var r = rowsDiv.querySelector('.drow[data-id="' + id + '"]');
      var cb = r && r.querySelector(".dhead input[type=checkbox]");
      if (cb && !!cb.checked !== want) cb.click();
    }
    function applyKit(entry) {
      var kit = kitFor(entry); if (!kit) return;
      if (state.entry !== entry.id) selectEntry(entry);
      setTimeout(function () {
        state.kit = { q: kit.q, ids: [], clsOf: {}, def: kit };
        kit.meds.forEach(function (m) { clickRow(m.id, true); state.kit.ids.push(m.id); state.kit.clsOf[m.id] = m.cls; });
        kit.orient.forEach(function (id) { clickRow(id, true); state.kit.ids.push(id); });
        drawKitBar(); drawBar();
      }, state.entry === entry.id ? 0 : 80);
    }
    function undoKit() {
      if (!state.kit) return;
      state.kit.ids.slice().forEach(function (id) { clickRow(id, false); });
      state.kit = null;
      drawKitBar(); drawBar();
    }
    function swapKit(oldId, newId) {
      if (!state.kit) return;
      clickRow(oldId, false);
      clickRow(newId, true);
      var i = state.kit.ids.indexOf(oldId);
      if (i >= 0) state.kit.ids[i] = newId;
      state.kit.clsOf[newId] = state.kit.clsOf[oldId]; delete state.kit.clsOf[oldId];
      var mk = (state.kit.def.meds || []).filter(function (m) { return m.id === oldId; })[0];
      if (mk) { mk.alts = mk.alts.filter(function (x) { return x !== newId; }).concat([oldId]); mk.id = newId; }
      drawKitBar(); drawBar();
    }
    function drawKitBar() {
      kitBar.textContent = ""; kitBar.style.display = "none";
      if (state.q) return; // durante a busca, a oferta de kit aparece nos resultados
      var entry = currentEntry(), kit = kitFor(entry);
      if (!kit) return;
      kitBar.style.display = "";
      if (state.kit && state.kit.q === kit.q) {
        kitBar.appendChild(el("span", { class: "info", text: "Kit " + kit.q + " ativo · " + state.kit.ids.length + " itens na receita" }));
        kitBar.appendChild(el("button", { class: "undo", type: "button", text: "Desfazer kit", onclick: function () { undoKit(); } }));
      } else {
        kitBar.appendChild(el("button", { class: "use", type: "button", text: "⚡ Usar kit: " + kit.q, onclick: function () { applyKit(entry); } }));
        kitBar.appendChild(el("span", { class: "info", text: kit.meds.length + " medicamento(s) — 1 por classe" + (kit.orient.length ? " + orientações" : "") }));
      }
    }

    /* --- coluna esquerda --- */
    function drawCats() {
      cats.textContent = "";
      drawFreq();
      var list = entries(state.tab).filter(function (e) { return e.ids.length; });
      var any = false;
      (window.PSX_RXSEC || []).forEach(function (sec) {
        var items = list.filter(function (x) { return x.sec === sec.id; });
        if (!items.length) return;
        any = true;
        var isOpen = state.open[sec.id] != null ? state.open[sec.id] : (sec.id === "dor" || sec.id === "gastro" || (state.entry && items.some(function (x) { return x.id === state.entry; })));
        var secEl = el("div", { class: "rxm-sec" });
        var head = el("button", { type: "button", "aria-expanded": String(!!isOpen) }, [document.createTextNode(sec.n), el("span", { class: "n", text: String(items.length) }), el("span", { class: "car", text: isOpen ? "▾" : "▸" })]);
        head.addEventListener("click", function () { state.open[sec.id] = !isOpen; drawCats(); });
        secEl.appendChild(head);
        if (isOpen) items.forEach(function (x) {
          var b = el("button", { type: "button", class: "rxm-cat" + (x.id === state.entry && !state.q ? " on" : ""), title: x.label }, [
            el("span", { class: "nm", text: x.label }),
            el("span", { class: "ct", text: String(x.ids.length) })
          ]);
          b.addEventListener("click", function () { selectEntry(x); });
          secEl.appendChild(b);
        });
        cats.appendChild(secEl);
      });
      if (!any) cats.appendChild(el("div", { class: "rxm-empty", text: "Nenhum grupo nesta aba." }));
    }
    function selectEntry(x) {
      search.value = ""; state.q = ""; lastQ = "";
      state.entry = x.id; state.entryKeys = x.keys;
      openOnly(x.keys);
      drawCats();
      drawKitBar();
      grid.classList.add("rxm-mob-med"); mMed.classList.add("on"); mCat.classList.remove("on");
      main.scrollTop = 0;
    }

    /* --- busca: reage a todo evento de edição --- */
    var deb = null, lastQ = null;
    function runSearch() {
      var q = fold(search.value).trim();
      if (q === lastQ) return;
      var was = !!lastQ; lastQ = q;
      if (q) { if (!was) openOnly(true); else filterRows(); }
      else { if (state.entryKeys) openOnly(state.entryKeys); else filterRows(); }
      drawCats();
    }
    function schedule() { clearTimeout(deb); deb = setTimeout(runSearch, 100); }
    ["input", "keyup", "paste", "cut", "search", "change", "compositionend"].forEach(function (ev) { search.addEventListener(ev, schedule); });

    var actIdx = -1;
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); search.value = ""; runSearch(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") return;
      clearTimeout(deb); runSearch();
      var vis = Array.prototype.slice.call(rowsDiv.querySelectorAll(".drow")).filter(function (r) { return r.style.display !== "none" && !r.classList.contains("rxm-hid"); });
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!vis.length) return;
        actIdx = e.key === "ArrowDown" ? Math.min(actIdx + 1, vis.length - 1) : Math.max(actIdx - 1, 0);
        vis.forEach(function (r, i) { r.classList.toggle("rxm-act", i === actIdx); });
        vis[actIdx].scrollIntoView({ block: "nearest" });
        return;
      }
      e.preventDefault();
      var r = vis[actIdx >= 0 ? actIdx : 0];
      if (!r) return;
      var cb = r.querySelector(".dhead input[type=checkbox]");
      if (cb && !cb.disabled) cb.click();
      actIdx = -1;
      search.focus(); search.select();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && isRxModal() && !/input|textarea|select/i.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); search.focus(); }
    });

    tabQ.addEventListener("click", function () { state.tab = "queixa"; tabQ.classList.add("on"); tabC.classList.remove("on"); drawCats(); });
    tabC.addEventListener("click", function () { state.tab = "classe"; tabC.classList.add("on"); tabQ.classList.remove("on"); drawCats(); });
    (state.tab === "queixa" ? tabQ : tabC).classList.add("on");
    mCat.addEventListener("click", function () { grid.classList.remove("rxm-mob-med"); mCat.classList.add("on"); mMed.classList.remove("on"); });
    mMed.addEventListener("click", function () { grid.classList.add("rxm-mob-med"); mMed.classList.add("on"); mCat.classList.remove("on"); });

    // marcar = entra na receita; desmarcar = sai
    rowsDiv.addEventListener("change", function (e) {
      var t = e.target; if (!t || t.type !== "checkbox" || !t.closest(".dhead")) return;
      var row = t.closest(".drow"), id = row && row.dataset.id; if (!id) return;
      if (t.checked) addItem(id); else removeItem(id);
    });
    // trocar apresentação/posologia de um item marcado atualiza o item na receita
    rowsDiv.addEventListener("change", function (e) {
      var t = e.target; if (!t || t.tagName !== "SELECT" || !t.classList.contains("sel")) return;
      var row = t.closest(".drow"), id = row && row.dataset.id;
      if (!id || !state.added[id]) return;
      setTimeout(function () { removeItem(id); addItem(id); }, 0);
    }, true);

    mo = new MutationObserver(function () { annotate(); });
    mo.observe(rowsDiv, { childList: true });
    new MutationObserver(function () { drawBar(); }).observe(body, { childList: true, subtree: true });

    annotate(); drawCats();
    setTimeout(function () { search.focus(); }, 60);
  }

  function cleanup() {
    var modal = document.getElementById("modal");
    if (modal && !modal.open) modal.classList.remove("rxm");
    var bar = document.querySelector(".rxm-bar");
    if (bar && (!modal || !modal.open)) bar.remove();
  }

  new MutationObserver(function () { enhance(); cleanup(); })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });

  window.PSX_RXMODAL = true;
  window.PSX_RXMERGE = function () { return merge(); };
})();
