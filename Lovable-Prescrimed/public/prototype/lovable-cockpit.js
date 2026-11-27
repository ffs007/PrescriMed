/* Cockpit de curadoria no atendimento — extensão aditiva.
   Três abas: Recursos da unidade (o que o hospital tem), Editar condição (patch
   assinável) e Fadiga de alertas (override por regra a partir de safety_events).
   Não altera o motor: lê PROTO_DB, PSAPP.pr.current() e __psxBridge.listSafety. */
(function () {
  "use strict";
  if (window.PSX_COCKPIT) return;
  window.PSX_COCKPIT = 1;

  var CHAVE = "psx.stock";
  var el = function (t, a, txt) { var e = document.createElement(t); if (a) for (var k in a) { if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = a[k]; else e.setAttribute(k, a[k]); } if (txt != null) e.textContent = txt; return e; };
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  function proto() { try { return window.PSAPP.pr.current(); } catch (e) { return null; } }
  function db() { return window.PROTO_DB || { drugs: {}, classes: {} }; }
  function hdb() { return window.HOSP_DB || { drugs: {}, classes: {}, map: {} }; }

  /* ---------- inventário da condição ---------- */
  function inventario(p) {
    var D = db(), H = hdb(), out = [];
    (p.cls || []).forEach(function (k) {
      var c = D.classes[k]; if (!c) return;
      out.push({ secao: "amb", classe: c.n || k, chave: k, ids: (c.d || []).slice() });
    });
    (H.map[p.id] || []).forEach(function (k) {
      var c = H.classes[k]; if (!c) return;
      out.push({ secao: "hosp", classe: c.n || k, chave: k, ids: (c.d || []).slice() });
    });
    return out;
  }
  function nome(secao, id) {
    var d = secao === "hosp" ? hdb().drugs[id] : db().drugs[id];
    return d ? d.n : String(id).replace(/^cur[h]?_/, "").replace(/_/g, " ");
  }

  /* ---------- cartão resumo na tela da condição ---------- */
  function resumo(p) {
    var st = ler(), inv = inventario(p), total = 0, ok = 0, vazias = [];
    inv.forEach(function (c) {
      var disp = c.ids.filter(function (id) { return st[id] !== 0; }).length;
      total += c.ids.length; ok += disp;
      if (!disp && c.ids.length) vazias.push(c.classe);
    });
    return { total: total, ok: ok, vazias: vazias, inv: inv };
  }
  function cartao() {
    var p = proto(); if (!p) return;
    var card = document.getElementById("psxCkResumo");
    if (card && card.getAttribute("data-cond") === p.id) return;
    if (!card) { card = el("section", { class: "sumcard", id: "psxCkResumo" }); card.style.marginTop = "10px"; }
    card.setAttribute("data-cond", p.id);
    var r = resumo(p), app = document.getElementById("app");
    if (!app) return;
    card.textContent = "";
    var h = el("h2", null, "Recursos da unidade");
    var b = el("div", { class: r.ok === r.total ? "muted" : "" }, r.ok + " de " + r.total + " opções disponíveis");
    card.appendChild(h); card.appendChild(b);
    if (r.vazias.length) {
      var aviso = el("div", { class: "alertbox bad" });
      aviso.appendChild(el("b", null, "Sem opção local: "));
      aviso.appendChild(document.createTextNode(r.vazias.slice(0, 4).join(" · ") + (r.vazias.length > 4 ? " …" : "")));
      aviso.appendChild(el("small", null, " — considere transferência se a conduta for imprescindível."));
      card.appendChild(aviso);
    }
    if (!card.parentNode) app.appendChild(card);
  }

  /* ---------- painel ---------- */
  var painel = null;
  function abrir(aba) {
    if (painel) { painel.remove(); painel = null; }
    painel = el("div", { id: "psxCk" });
    var caixa = el("div", { class: "psxCk-box" });
    var topo = el("div", { class: "psxCk-top" });
    topo.appendChild(el("b", null, "Curadoria no atendimento"));
    var fechar = el("button", { class: "psxCk-x", type: "button" }, "×");
    fechar.onclick = function () { painel.remove(); painel = null; };
    topo.appendChild(fechar);

    var abas = el("div", { class: "psxCk-tabs" });
    var corpo = el("div", { class: "psxCk-body" });
    var telas = {
      recursos: telaRecursos,
      editar: telaEditar,
      alertas: telaAlertas,
    };
    Object.keys(telas).forEach(function (k) {
      var bt = el("button", { type: "button", class: k === aba ? "on" : "" }, k.charAt(0).toUpperCase() + k.slice(1));
      bt.onclick = function () { abrir(k); };
      abas.appendChild(bt);
    });
    caixa.appendChild(topo); caixa.appendChild(abas); caixa.appendChild(corpo);
    painel.appendChild(caixa);
    painel.addEventListener("click", function (e) { if (e.target === painel) fechar.onclick(); });
    document.body.appendChild(painel);
    (telas[aba] || telaRecursos)(corpo);
  }

  function semCondicao(b) {
    b.appendChild(el("p", { class: "muted" }, "Abra uma condição para ver os recursos e o editor."));
  }

  /* ---- aba: recursos ---- */
  function telaRecursos(b) {
    var p = proto(); if (!p) return semCondicao(b);
    var st = ler(), r = resumo(p);
    b.appendChild(el("p", { class: "muted" }, "Marque o que a sua unidade tem. O que estiver desmarcado aparece como indisponível e a condição avisa quando uma classe fica sem opção."));
    var barra = el("div", { class: "psxCk-bar" });
    var todos = el("button", { type: "button" }, "Marcar tudo");
    todos.onclick = function () { r.inv.forEach(function (c) { c.ids.forEach(function (id) { delete st[id]; }); }); gravar(st); abrir("recursos"); cartao(); };
    var limpar = el("button", { type: "button" }, "Limpar marcações");
    limpar.onclick = function () { gravar({}); abrir("recursos"); cartao(); };
    barra.appendChild(todos); barra.appendChild(limpar);
    b.appendChild(barra);

    r.inv.forEach(function (c) {
      var bloco = el("div", { class: "psxCk-classe" });
      var disp = c.ids.filter(function (id) { return st[id] !== 0; }).length;
      bloco.appendChild(el("div", { class: "psxCk-nome" }, c.classe + " (" + disp + "/" + c.ids.length + ")"));
      c.ids.forEach(function (id) {
        var linha = el("label", { class: "psxCk-item" });
        var cb = el("input", { type: "checkbox" });
        cb.checked = st[id] !== 0;
        cb.onchange = function () { var s2 = ler(); if (cb.checked) delete s2[id]; else s2[id] = 0; gravar(s2); cartao(); abrir("recursos"); };
        linha.appendChild(cb);
        linha.appendChild(document.createTextNode(" " + nome(c.secao, id)));
        bloco.appendChild(linha);
      });
      b.appendChild(bloco);
    });
  }

  /* ---- aba: editar ---- */
  var edicoes = {};
  function telaEditar(b) {
    var p = proto(); if (!p) return semCondicao(b);
    if (!edicoes[p.id]) edicoes[p.id] = {};
    var D = db();
    b.appendChild(el("p", { class: "muted" }, "Ajuste a posologia da condição e exporte um patch. O patch é aplicado por scripts/workspace/aplicar-patch.mjs e passa pelo gate antes de virar bundle."));
    (p.cls || []).forEach(function (k) {
      var c = D.classes[k]; if (!c) return;
      var bloco = el("div", { class: "psxCk-classe" });
      bloco.appendChild(el("div", { class: "psxCk-nome" }, c.n || k));
      (c.d || []).forEach(function (id) {
        var d = D.drugs[id]; if (!d) return;
        var linha = el("div", { class: "psxCk-item" });
        linha.appendChild(el("b", null, d.n + " " + ((d.a && d.a[0] && d.a[0].ap) || "")));
        var atual = (d.a && d.a[0] && d.a[0].pos && d.a[0].pos[0] && d.a[0].pos[0].t) || "";
        var ta = el("textarea", { rows: "2" });
        ta.value = (edicoes[p.id][id] != null) ? edicoes[p.id][id] : atual;
        ta.oninput = function () { edicoes[p.id][id] = ta.value; };
        linha.appendChild(ta);
        bloco.appendChild(linha);
      });
      b.appendChild(bloco);
    });
    var bt = el("button", { type: "button", class: "psxCk-primary" }, "Exportar patch JSON");
    bt.onclick = function () {
      var patch = { condicao: p.id, gerado_em: new Date().toISOString(), itens: [] };
      Object.keys(edicoes[p.id] || {}).forEach(function (id) {
        var novo = edicoes[p.id][id];
        var d = db().drugs[id];
        var atual = (d && d.a && d.a[0] && d.a[0].pos && d.a[0].pos[0] && d.a[0].pos[0].t) || "";
        if (novo != null && novo !== atual) patch.itens.push({ droga: id, pos_antes: atual, pos_depois: novo });
      });
      if (!patch.itens.length) { alert("Nada alterado nesta condição."); return; }
      var blob = new Blob([JSON.stringify(patch, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "patch-" + p.id + ".json";
      document.body.appendChild(a); a.click(); a.remove();
    };
    b.appendChild(bt);
  }

  /* ---- aba: alertas ---- */
  function telaAlertas(b) {
    b.appendChild(el("p", { class: "muted" }, "Regras que estão sendo ignoradas na prática (override), a partir dos eventos de segurança."));
    var alvo = el("div");
    b.appendChild(alvo);
    alvo.appendChild(el("p", { class: "muted" }, "Carregando…"));
    var br = window.parent && window.parent.__psxBridge;
    var carga = (br && br.listSafety) ? br.listSafety() : Promise.resolve(lerLocal());
    carga.then(function (evs) { pintarAlertas(alvo, evs || []); })
      .catch(function () { pintarAlertas(alvo, lerLocal()); });
  }
  function lerLocal() {
    try { return JSON.parse(localStorage.getItem("psx.safety.queue") || "[]"); } catch (e) { return []; }
  }
  function pintarAlertas(alvo, evs) {
    alvo.textContent = "";
    if (!evs.length) { alvo.appendChild(el("p", { class: "muted" }, "Nenhum evento registrado ainda.")); return; }
    var cont = {}, ultimo = {};
    evs.forEach(function (e) {
      var k = (e.tipo || "?") + (e.motivo ? " :: " + String(e.motivo).slice(0, 80) : "");
      cont[k] = (cont[k] || 0) + 1;
      ultimo[k] = e.created_at || e.em || "";
    });
    var linhas = Object.keys(cont).sort(function (a, b2) { return cont[b2] - cont[a]; }).slice(0, 25);
    var tab = el("table", { class: "psxCk-tab" });
    var th = el("tr");
    ["Regra / motivo", "Vezes", "Último"].forEach(function (t) { th.appendChild(el("th", null, t)); });
    tab.appendChild(th);
    linhas.forEach(function (k) {
      var tr = el("tr");
      tr.appendChild(el("td", null, k));
      tr.appendChild(el("td", null, String(cont[k])));
      tr.appendChild(el("td", null, String(ultimo[k] || "").slice(0, 16).replace("T", " ")));
      tab.appendChild(tr);
    });
    alvo.appendChild(el("p", { class: "muted" }, evs.length + " eventos · " + Object.keys(cont).length + " regras distintas"));
    alvo.appendChild(tab);
  }

  /* ---------- estilos ---------- */
  var css = el("style");
  css.textContent = [
    "#psxCkFab{position:fixed;right:14px;bottom:14px;z-index:2147483000;border:1px solid #d7dde8;background:#fff;color:#1f3b63;border-radius:999px;padding:8px 14px;font:600 12px system-ui;box-shadow:0 6px 18px rgba(20,40,70,.18);cursor:pointer}",
    "#psxCkFab:hover{background:#1f3b63;color:#fff}",
    "#psxCk{position:fixed;inset:0;background:rgba(12,24,40,.45);z-index:2147483200;display:flex;align-items:center;justify-content:center;padding:16px}",
    ".psxCk-box{background:#fff;border-radius:14px;width:min(760px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;font:13px/1.45 system-ui;color:#17233a;box-shadow:0 24px 60px rgba(10,25,50,.35)}",
    ".psxCk-top{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e6ebf3}",
    ".psxCk-x{border:0;background:transparent;font-size:20px;cursor:pointer;color:#51607a}",
    ".psxCk-tabs{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid #eef2f7;background:#f8fafc}",
    ".psxCk-tabs button{border:1px solid #dde5f0;background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;font-size:12px}",
    ".psxCk-tabs button.on{background:#1f3b63;color:#fff;border-color:#1f3b63}",
    ".psxCk-body{padding:14px 16px;overflow:auto}",
    ".psxCk-classe{border:1px solid #e6ebf3;border-radius:10px;padding:8px 10px;margin:8px 0}",
    ".psxCk-nome{font-weight:700;margin-bottom:4px;color:#1f3b63}",
    ".psxCk-item{display:block;padding:3px 0;font-size:12px}",
    ".psxCk-item textarea{width:100%;margin-top:2px;border:1px solid #dde5f0;border-radius:8px;padding:6px;font:12px/1.35 system-ui;resize:vertical}",
    ".psxCk-bar{display:flex;gap:8px;margin:6px 0 10px}",
    ".psxCk-bar button,.psxCk-primary{border:1px solid #dde5f0;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px}",
    ".psxCk-primary{background:#1f3b63;color:#fff;border-color:#1f3b63;margin-top:10px}",
    ".psxCk-tab{width:100%;border-collapse:collapse;font-size:12px}",
    ".psxCk-tab th,.psxCk-tab td{border-bottom:1px solid #eef2f7;padding:5px 6px;text-align:left}",
    ".muted{color:#6b7a90}",
  ].join("\n");
  document.head.appendChild(css);

  var fab = el("button", { id: "psxCkFab", type: "button" }, "Curadoria");
  fab.onclick = function () { abrir("recursos"); };
  document.body.appendChild(fab);

  /* cartão resumo sempre que a condição renderiza */
  var alvo = document.getElementById("app");
  if (alvo && window.MutationObserver) {
    var t = null;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () { try { if (document.querySelector(".chead h1")) cartao(); } catch (e) {} }, 250);
    }).observe(alvo, { childList: true });
  }
})();
