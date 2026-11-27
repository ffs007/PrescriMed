/* Concepção do Dr. Felipe — pacote 2 (27/11, loop pós-PR#8):
   ⑦ QUIZ DA CONDIÇÃO — repetição espaçada gerada do conteúdo curado (sem IA): "não usar",
      contraindicados na gestação, red flags e escores sugeridos; placar e explicação.
   ⑧ RELATÓRIO DE PLANTÃO — arquiva automaticamente cada atendimento concluído (psx.turno,
      local) e monta relatório do turno (lista + PDF + copiar).
   ⑪ OFFLINE-FIRST — service worker (sw.js) registrado aqui: rede-primeiro com cache como
      reserva, para o app seguir funcionando com internet do hospital ruim.
   100% aditivo; usa PSAPP.test + globals. */
(function () {
  "use strict";
  var api = window.PSAPP && window.PSAPP.test;
  if (!api || api.__concepcao2) return; api.__concepcao2 = true;
  var D = window.PROTO_DB, HD = window.HOSP_DB, SC = window.SCORES, E = window.Engine;

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
  function pad2(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function nowHM() { var d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function nf(v, d) { if (v == null || isNaN(v)) return ""; return (+v).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 2 : d }); }
  function fold(s) { return E.fold ? E.fold(s) : String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function toast(t) { var x = h("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }
  function copy(text) { try { navigator.clipboard.writeText(text).then(function () { toast("Copiado."); }, function () { toast("Não consegui copiar."); }); } catch (e) { toast("Não consegui copiar."); } }
  function cse() { return api.C(); }
  function ptLine() { var p = cse().pac; return [p.nome || "Paciente", p.idade ? p.idade + (p.idUn === "meses" ? " m" : " a") : "", p.peso ? nf(parseFloat(String(p.peso).replace(",", ".")), 1) + " kg" : ""].filter(Boolean).join(" · "); }
  function byId(id) { return D.protocols.find(function (p) { return p.id === id; }) || null; }
  function primary() { return byId(cse().proto); }
  var dlg = document.getElementById("modal");
  function openShell(title, sub) {
    document.getElementById("mTitle").textContent = title;
    document.getElementById("mSub").textContent = sub || "";
    var b = document.getElementById("mBody"), f = document.getElementById("mFoot");
    b.textContent = ""; f.textContent = ""; if (!dlg.open) dlg.showModal(); b.scrollTop = 0; dlg.scrollTop = 0;
    return { b: b, f: f };
  }
  function fileBase(pref) { var n = (cse().pac.nome || "PLANTAO").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase(); return pref + "_" + today().split("/").reverse().join("-") + ".pdf"; }

  /* =====================================================
     ⑦ QUIZ DA CONDIÇÃO (repetição espaçada do conteúdo curado)
     ===================================================== */
  function quizPool(p) {
    var q = [];
    /* tipo 1: NÃO usar */
    if (p.naoUsar) {
      var itens = p.naoUsar.split(/[;.]|\s—\s/).map(function (s) { return s.replace(/\(.*?\)/g, "").trim(); })
        .filter(function (s) { return s.length > 8 && s.length < 160; });
      if (itens.length) {
        var alvo = itens[Math.floor(Math.random() * itens.length)];
        var distratores = D.protocols.filter(function (o) { return o.id !== p.id && o.naoUsar; }).map(function (o) { return o.naoUsar.split(/[;.]|\s—\s/)[0].replace(/\(.*?\)/g, "").trim(); })
          .filter(function (s, i, a) { return s.length > 8 && a.indexOf(s) === i && fold(s) !== fold(alvo); })
          .sort(function () { return Math.random() - 0.5; }).slice(0, 3);
        if (distratores.length >= 2) q.push({ t: "Qual conduta NÃO deve ser feita em " + p.n + "?", opts: [alvo].concat(distratores.slice(0, 3)), ok: 0, why: "Protocolo da condição: " + p.naoUsar.slice(0, 200) });
      }
    }
    /* tipo 2: contraindicado na gestação (drogas da condição com gx) */
    var gxIds = [];
    (p.cls || []).forEach(function (k) { (D.classes[k] || { d: [] }).d.forEach(function (id) { if (D.drugs[id] && D.drugs[id].gx && gxIds.indexOf(id) < 0) gxIds.push(id); }); });
    if (gxIds.length) {
      var g = D.drugs[gxIds[Math.floor(Math.random() * gxIds.length)]];
      var gDis = Object.keys(HD.drugs).map(function (id) { return HD.drugs[id]; }).filter(function (d) { return !d.gx; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3).map(function (d) { return d.n; });
      var opts = [g.n].concat(gDis).sort(function () { return Math.random() - 0.5; });
      q.push({ t: "Na gestação, qual destes fármacos é CONTRAINDICADO no manejo de " + p.n + "?", opts: opts, ok: opts.indexOf(g.n), why: g.n + ": " + g.gx });
    }
    /* tipo 3: red flag */
    if (Array.isArray(p.redFlags) && p.redFlags.length >= 4) {
      var rf = p.redFlags[Math.floor(Math.random() * p.redFlags.length)];
      var rfTxt = typeof rf === "string" ? rf : (rf && (rf.n || rf.texto || rf.t) || "");
      var outras = D.protocols.filter(function (o) { return o.id !== p.id && Array.isArray(o.redFlags) && o.redFlags.length; })
        .map(function (o) { var r = o.redFlags[0]; return typeof r === "string" ? r : (r && (r.n || r.texto || r.t) || ""); })
        .filter(function (s) { return s && s.length > 6 && fold(s) !== fold(rfTxt); }).sort(function () { return Math.random() - 0.5; }).slice(0, 3);
      if (rfTxt && outras.length >= 2) {
        var opts2 = [rfTxt].concat(outras.slice(0, 3)).sort(function () { return Math.random() - 0.5; });
        q.push({ t: "Qual destes é sinal de alarme (" + p.redFlags.length + " listados) de " + p.n + "?", opts: opts2, ok: opts2.indexOf(rfTxt), why: "Red flag de " + p.n + ": " + rfTxt });
      }
    }
    /* tipo 4: escore sugerido */
    var sug = SC.SUG[p.id] || [];
    if (sug.length) {
      var alvoSc = sug[0], t = SC.T[alvoSc];
      var dis = SC.ORDER.filter(function (k) { return sug.indexOf(k) < 0; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3).map(function (k) { return SC.T[k].n.split(" (")[0]; });
      var opts3 = [t.n.split(" (")[0]].concat(dis).sort(function () { return Math.random() - 0.5; });
      q.push({ t: "Qual escore é SUGERIDO para " + p.n + "?", opts: opts3, ok: opts3.indexOf(t.n.split(" (")[0]), why: t.n + " — " + (t.note ? String(t.note).slice(0, 140) : "escore indicado pela condição") });
    }
    return q;
  }
  function openQuiz() {
    var p = primary();
    if (!p) { toast("Escolha uma condição primeiro."); return; }
    var s = openShell("Quiz da condição", p.n + " · repetição espaçada do protocolo curado"), b = s.b, f = s.f, st = h("div", { class: "status" });
    var pool = quizPool(p);
    if (!pool.length) { b.appendChild(h("div", { class: "note", text: "Esta condição ainda não tem conteúdo suficiente para o quiz (sem “não usar”, red flags, contraindicados de gestação ou escore sugerido)." })); f.appendChild(st); return; }
    var acertos = 0, i = 0, order = pool.sort(function () { return Math.random() - 0.5; }).slice(0, Math.min(5, pool.length));
    var box = h("div", { class: "box" });
    b.appendChild(box);
    function draw() {
      box.textContent = "";
      if (i >= order.length) {
        box.append(h("h3", { text: "Fim — " + acertos + "/" + order.length + " (" + Math.round(100 * acertos / order.length) + "%)" }),
          h("div", { class: "note", text: acertos === order.length ? "Perfeito — conteúdo fresco." : "Reveja os itens errados no protocolo da condição e repita amanhã (repetição espaçada)." }),
          h("div", { class: "btns" }, h("button", { class: "btn primary", type: "button", text: "Repetir agora", onclick: function () { acertos = 0; i = 0; order = quizPool(p).sort(function () { return Math.random() - 0.5; }).slice(0, Math.min(5, pool.length)); draw(); } })));
        return;
      }
      var q = order[i];
      var opts = q.opts.map(function (o, idx) { return { txt: o, idx: idx }; }).sort(function () { return Math.random() - 0.5; });
      var fb = h("div", { class: "status" });
      box.append(h("h3", { text: "Pergunta " + (i + 1) + "/" + order.length }), h("p", { text: q.t }));
      opts.forEach(function (o) {
        var c = h("button", { class: "chip", type: "button", style: "text-align:left;white-space:normal;padding:8px 14px", text: o.txt });
        c.addEventListener("click", function () {
          var ok = o.idx === q.ok;
          if (ok) acertos++;
          c.className = "chip " + (ok ? "pos" : "neg");
          fb.textContent = (ok ? "✓ Correto. " : "✗ ") + q.why;
          fb.className = "status " + (ok ? "ok" : "err");
          Array.prototype.forEach.call(box.querySelectorAll("button.chip"), function (x) { x.disabled = true; });
          box.appendChild(h("div", { class: "btns" }, h("button", { class: "btn primary", type: "button", text: i + 1 === order.length ? "Ver resultado" : "Próxima", onclick: function () { i++; draw(); } })));
        });
        box.appendChild(c);
      });
      box.appendChild(fb);
    }
    draw();
    f.appendChild(st);
  }

  /* =====================================================
     ⑧ RELATÓRIO DE PLANTÃO (arquivo automático local)
     ===================================================== */
  var lastRef = null, lastSnap = null;
  function snapshot() {
    var C = cse(), p = primary();
    if (!C.proto || !p) return null;
    var dados = !!(C.pac.nome || C.rx.itens.length || (C.hosp && (C.hosp.hid || []).length) || Object.keys(C.hosp && C.hosp.sel || {}).some(function (k) { return C.hosp.sel[k] && C.hosp.sel[k].on; }) || C.evol.final);
    if (!dados) return null;
    var conduta = [];
    C.rx.itens.slice(0, 6).forEach(function (x) { conduta.push(x.med + " — " + x.pos); });
    var dest = C.transf.final ? "Transferência: " + (C.transf.destino || "regulação") : (C.enc.final ? "Encaminhado: " + C.enc.esp : (C.evol.final ? "Atendido no PS" : "Em atendimento"));
    return { ts: Date.now(), dia: today(), hora: nowHM(), proto: p.id, cond: p.n, cid: (p.cid && p.cid[0] ? p.cid[0][0] : ""), nome: C.pac.nome || "—", idade: C.pac.idade ? C.pac.idade + (C.pac.idUn === "meses" ? " meses" : " anos") : "", sexo: C.pac.sexo || "", gest: !!C.pac.gest, alergias: C.pac.alergias || "", conduta: conduta.join("; "), destino: dest, scores: Object.keys(C.scores).length, revisado: false };
  }
  function turnoStore() { var t = lsGet("psx.turno"); return Array.isArray(t) ? t : []; }
  function archive(snap) {
    if (!snap) return false;
    var t = turnoStore();
    var dup = t.some(function (x) { return x.ts === snap.ts && x.proto === snap.proto && x.nome === snap.nome && x.dia === snap.dia && x.hora === snap.hora; });
    if (dup) return false;
    t.unshift(snap); t = t.slice(0, 120); lsSet("psx.turno", t); return true;
  }
  setInterval(function () {
    try {
      var C = cse();
      if (C !== lastRef) {
        if (lastRef !== null && lastSnap) archive(lastSnap);
        lastRef = C; lastSnap = snapshot();
      } else if (C && lastRef === C) { lastSnap = snapshot(); }
    } catch (e) {}
  }, 2000);
  window.addEventListener("pagehide", function () { try { var C = cse(); var s = snapshot(); if (C && s && !lastRef) archive(s); else if (s && lastRef === C) archive(s); } catch (e) {} });

  function openTurno() {
    var s = openShell("Relatório de plantão", "atendimentos arquivados localmente neste dispositivo"), b = s.b, f = s.f, st = h("div", { class: "status" });
    var t = turnoStore();
    var diaSel = h("select", { class: "sel" });
    var dias = []; t.forEach(function (x) { if (dias.indexOf(x.dia) < 0) dias.push(x.dia); });
    dias.forEach(function (d) { diaSel.appendChild(h("option", { value: d, text: d })); });
    var list = h("div", { class: "rxlist" });
    function filtrar() { return diaSel.value ? t.filter(function (x) { return x.dia === diaSel.value; }) : t; }
    function draw() {
      list.textContent = "";
      var ft = filtrar();
      if (!ft.length) { list.appendChild(h("div", { class: "note", text: "Nenhum atendimento arquivado ainda. O app arquiva automaticamente cada atendimento com dados quando você inicia o próximo ou fecha a página." })); return; }
      ft.forEach(function (x) {
        list.appendChild(h("div", { class: "rxitem", style: "grid-template-columns:1fr" },
          h("div", null, h("b", { text: (x.nome || "—") + " · " + (x.idade || "—") + (x.gest ? " · gestante" : "") }),
            h("div", { class: "disc", text: x.dia + " " + x.hora + " · " + x.cond + (x.cid ? " (" + x.cid + ")" : "") + " · " + x.destino }),
            x.conduta ? h("div", { class: "disc", text: "Conduta: " + x.conduta }) : null)));
      });
    }
    diaSel.addEventListener("change", draw);
    b.appendChild(h("div", { class: "box" }, h("h3", null, "Atendimentos", h("small", { text: t.length + " no arquivo local — nada sai do dispositivo sem você emitir" })), h("div", { class: "grid" }, h("label", { class: "f" }, h("span", { text: "Dia" }), diaSel)), list));
    draw();
    function textoTurno() {
      var ft = filtrar();
      return ["RELATÓRIO DE PLANTÃO — " + (diaSel.value || "todos os dias") + " · emitido " + today() + " " + nowHM(), ""].concat(ft.map(function (x) {
        return ["• " + (x.nome || "—") + (x.idade ? ", " + x.idade : "") + (x.sexo ? " (" + x.sexo + ")" : "") + (x.gest ? ", gestante" : ""), "  " + x.dia + " " + x.hora + " · " + x.cond + (x.cid ? " (" + x.cid + ")" : ""), "  " + x.destino + (x.alergias ? " · alergias: " + x.alergias : ""), x.conduta ? "  Conduta: " + x.conduta : ""].filter(Boolean).join("\n");
      })).join("\n\n");
    }
    var pvBar = null;
    f.append(h("button", { class: "btn", type: "button", text: "Copiar texto", onclick: function () { copy(textoTurno()); } }),
      h("span", { class: "note", text: "PDF abaixo usa o módulo de documentos padrão." }), st);
    var pv = (function () {
      var foot = f, last = null, pv2 = h("div", { class: "preview" });
      var bGen = h("button", { class: "btn primary", type: "button", text: "Gerar PDF" });
      bGen.addEventListener("click", function () {
        try {
          if (!window.jspdf || !window.DocPDF) throw new Error("gerador não carregou");
          var sec = filtrar().map(function (x) { return { h: (x.nome || "—") + " · " + x.dia + " " + x.hora, text: x.cond + (x.cid ? " (" + x.cid + ")" : "") + " — " + x.destino + (x.conduta ? "\nConduta: " + x.conduta : "") }; });
          if (!sec.length) { st.textContent = "Nada para emitir."; st.className = "status err"; return; }
          var out = window.DocPDF.build({ title: "RELATÓRIO DE PLANTÃO", data: today() + " " + nowHM(), cfg: { estab: (lsGet("psx.cfg") || {}).estab || {}, sol: (lsGet("psx.cfg") || {}).sol || {} }, pac: { nome: "", idade: "", sexo: "", peso: "", cns: "", leito: "", alergias: "" }, sections: sec });
          last = { ab: out.doc.output("arraybuffer"), name: fileBase("PLANTAO") }; st.textContent = "PDF pronto: " + last.name; st.className = "status ok";
        } catch (e) { st.textContent = "Não consegui gerar o PDF: " + (e.message || e); st.className = "status err"; }
      });
      foot.appendChild(bGen);
      return pv2;
    })();
    b.appendChild(pv);
  }

  /* ---------- injeção de cards/botões ---------- */
  var MY2_CARDS = [{ id: "quiz", label: "Quiz da condição", sub: "repetição espaçada · 5 perguntas", icon: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>', fn: openQuiz }];
  function sweep2() {
    var grid = document.querySelector("#app .mods");
    if (grid) MY2_CARDS.forEach(function (c) {
      if (grid.querySelector(":scope > .mod[data-psx-card=\"" + c.id + "\"]")) return;
      var btn = h("button", { class: "mod", type: "button", "data-psx-card": c.id, onclick: c.fn });
      var ic = h("span", { class: "ic" }); ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + c.icon + "</svg>";
      btn.append(ic, h("b", { text: c.label }), h("small", { text: c.sub }));
      grid.appendChild(btn);
    });
    /* botão do relatório de plantão na HOME (perto do hero) e no chead */
    var app = document.getElementById("app");
    var hero = app.querySelector(".hero");
    if (hero && !app.querySelector("[data-psx-btn-turno]")) {
      var wrap = hero.querySelector(".search");
      var btn = h("button", { class: "btn", type: "button", "data-psx-btn-turno": "1", text: "📋 Relatório de plantão", onclick: openTurno });
      (wrap ? wrap.parentNode : hero).appendChild(btn);
    }
    var chead = app.querySelector(".chead");
    if (chead && !chead.querySelector("[data-psx-btn-turno]")) {
      chead.appendChild(h("button", { class: "btn", type: "button", "data-psx-btn-turno": "1", text: "📋 Plantão", onclick: openTurno }));
    }
  }
  setInterval(function () { try { sweep2(); } catch (e) {} }, 700);
  sweep2();

  /* =====================================================
     ⑪ OFFLINE-FIRST — registra o service worker
     ===================================================== */
  if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
    try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {}
  }
})();
