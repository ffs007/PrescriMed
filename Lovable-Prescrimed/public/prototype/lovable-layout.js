/* Layout do atendimento (aditivo) — disposição do Dr. Felipe:
   MAIN#app vira o GRID: ESQUERDA (ações+módulos) | MEIO (módulo aberto + "Atendimento
   até agora" sempre por último) | DIREITA (avisos → Segurança clínica → Trava).
   Hover: módulos/ações invertem cor (fundo azul, texto branco).
   Home: grid desligado, tudo volta ao fluxo normal. */
(function () {
  "use strict";
  window.__LL = "v6";
  window.__LL_TICK = 0;
  var node = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var state = function () { try { return window.PSAPP && window.PSAPP.test && window.PSAPP.test.C(); } catch (_) { return null; } };

  /* ---------- CSS ---------- */
  document.head.appendChild(node("style")).textContent =
    "main#app.pm-cond{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;padding:18px 0 96px;align-items:start;width:100%}" +
    /* trilhas explícitas do cockpit externo: colapsar a coluna do paciente (display:none)
       não pode deixá-las re-encaixar (pm-main cairia na trilha de 0px) */
    ".pm-cockpit > .pm-column:nth-child(1){grid-column:1}" +
    ".pm-cockpit > .pm-column:nth-child(2){grid-column:2}" +
    ".pm-cockpit > .pm-column:nth-child(3){grid-column:3}" +
    "main#app .pm-col{display:flex;flex-direction:column;gap:10px;min-width:0}" +
    "main#app .pm-col.pm-l,main#app .pm-col.pm-r{position:sticky;top:74px;max-height:calc(100vh - 90px);overflow:auto}" +
    "main#app .pm-l .btns{display:flex;flex-direction:column;gap:6px;margin:0}" +
    "main#app .pm-l .btns .btn{width:100%;text-align:left}" +
    "main#app .pm-modwrap .mods{grid-template-columns:1fr;gap:8px;margin:0}" +
    "main#app .pm-modwrap .mods .mod{width:100%;text-align:left;transition:background .12s,color .12s,border-color .12s}" +
    "main#app .pm-modwrap .mods .mod:hover,main#app .pm-modwrap .mods .mod:hover.on,main#app .pm-acts .btn:hover{background:var(--accent);border-color:var(--accent);color:#fff}" +
    "main#app .pm-modwrap .mods .mod:hover :where(b,small,span,i),main#app .pm-acts .btn:hover :where(b,small,span,i){color:#fff}" +
    "main#app .pm-warn .alertbox{margin:0 0 8px}" +
    "main#app.pm-cond > .alertbox{display:none}" + /* originais ficam no app; clones na coluna direita */
    "main#app .pm-mid{display:flex;flex-direction:column;gap:12px;min-width:0}" +
    "main#app .pm-modcard{background:var(--surface);border:1px solid var(--accent);border-left-width:4px;border-radius:10px;padding:12px 14px}" +
    "main#app .pm-modcard h3{margin:0 0 6px;font-size:14px;color:var(--accent);display:flex;gap:8px;align-items:center}" +
    "main#app .pm-modcard .pm-modprev{font-size:13px;color:var(--ink);white-space:pre-wrap;max-height:200px;overflow:auto;margin:0;font-family:inherit}" +
    "main#app .pm-modcard .pm-live{margin-left:auto;font-size:11px;color:var(--ok);font-weight:700}" +
    "@media(max-width:1120px){main#app.pm-cond{grid-template-columns:260px minmax(0,1fr)}main#app .pm-col.pm-r{grid-column:1/-1;position:static;max-height:none;display:grid;grid-template-columns:1fr 1fr;gap:10px}}";

  /* ---------- helpers ---------- */
  var card = function (title) {
    var c = node("section", "pm-side-card");
    c.append(node("div", "pm-side-title", title));
    return c;
  };
  function safetyCard(C) {
    var c = card("Segurança clínica");
    var p = (C && C.pac) || {};
    var checks = [
      [p.alergias ? "bad" : "warn", p.alergias ? "Alergias registradas e verificadas" : "Alergias ainda não informadas"],
      [p.peso ? "" : "warn", p.peso ? "Peso disponível para cálculo" : "Informe o peso para doses por kg"],
      [p.sexo === "F" ? "warn" : "", p.sexo === "F" ? "Confirmar gestação e lactação" : "Alertas clínicos permanecem ativos"],
      ["warn", "Dose, função renal e contraindicações são avaliadas durante a prescrição"]
    ];
    checks.forEach(function (x) {
      var row = node("div", "pm-state");
      row.append(node("i", "pm-dot " + x[0]), node("span", "", x[1]));
      c.append(row);
    });
    return c;
  }
  function travaCard() {
    var c = card("Trava de emissão");
    var t = node("p", "note", "Baixar, imprimir ou enviar só é liberado após a confirmação “Revisei este documento”. Alterações posteriores exigem nova revisão.");
    t.style.margin = "0";
    c.append(t);
    return c;
  }

  /* ---------- cartão do módulo aberto (meio) ---------- */
  var modcard = null, modTitulo = "", condAtual = "";
  function modcardPass(mid) {
    var app = document.getElementById("app");
    var chead = app ? (app.querySelector(".chead h1") || {}).textContent || "" : "";
    if (chead && condAtual && chead !== condAtual) { // trocou de condição: cartão sai
      if (modcard && modcard.parentNode) modcard.remove();
      modcard = null; modTitulo = "";
    }
    condAtual = chead;
    var dlg = document.querySelector("dialog.modal[open]");
    if (dlg) {
      modTitulo = ((dlg.querySelector("h2,h3") || {}).textContent || "Módulo").trim();
      var corpo = (dlg.textContent || "").replace(/\s+/g, " ").trim().slice(0, 480);
      if (!modcard) {
        modcard = node("section", "pm-modcard");
        var h = node("h3"); h.append(node("b"), node("span", "pm-live", "● ao vivo"));
        modcard.append(h, node("pre", "pm-modprev"));
      }
      modcard.querySelector("h3 b").textContent = "Em edição: " + modTitulo;
      modcard.querySelector("h3 .pm-live").style.display = "";
      modcard.querySelector(".pm-modprev").textContent = corpo;
    } else if (modcard) {
      modcard.querySelector("h3 b").textContent = "Último módulo aberto: " + modTitulo;
      modcard.querySelector("h3 .pm-live").style.display = "none";
    }
    if (modcard && modTitulo) {
      var sum = mid.querySelector(".sumcard");
      if (sum) mid.insertBefore(modcard, sum); else mid.appendChild(modcard);
    }
  }

  /* ---------- passe de layout ---------- */
  var unwrapTimer = null;
  function pass() {
    window.__LL_TICK++;
    try {
      var app = document.getElementById("app"); // = MAIN da página
      if (!app) return;
      var isCond = !!(app.querySelector(".chead") || app.querySelector(".sumcard") || app.querySelector(".mods"));

      if (!isCond) { // home: desligar grid e devolver o fluxo
        if (app.classList.contains("pm-cond") && !unwrapTimer) {
          unwrapTimer = setTimeout(function () {
            unwrapTimer = null;
            var a = document.getElementById("app");
            if (!a || a.querySelector(".chead") || a.querySelector(".sumcard") || a.querySelector(".mods")) return;
            var mid = a.querySelector(":scope > .pm-mid");
            if (mid) Array.prototype.slice.call(mid.children).reverse().forEach(function (e) { a.insertBefore(e, a.firstChild); });
            ["pm-l", "pm-mid", "pm-r"].forEach(function (k) { var c = a.querySelector(":scope > ." + k); if (c) c.remove(); });
            a.classList.remove("pm-cond");
          }, 500);
        }
        return;
      }
      if (unwrapTimer) { clearTimeout(unwrapTimer); unwrapTimer = null; }
      app.classList.add("pm-cond");

      /* colunas: ESQUERDA (ações+módulos) e MEIO dentro do main; DIREITA = .pm-safety
         do shell externo [paciente | main | safety] — criado por mim se o redesign
         ainda não o montou (ele o reutiliza e preenche Paciente/Segurança/Trava). */
      var L = app.querySelector(":scope > .pm-l");
      var MID = app.querySelector(":scope > .pm-mid");
      if (!L) { L = node("aside", "pm-col pm-l"); app.appendChild(L); }
      if (!MID) { MID = node("div", "pm-col pm-mid"); app.appendChild(MID); }
      app.insertBefore(L, app.firstChild);
      var R = null;
      var shell = document.querySelector(".pm-cockpit");
      if (!shell) {
        shell = node("div", "pm-cockpit");
        var pl = node("aside", "pm-column pm-patient");
        var pmn = node("section", "pm-column pm-main");
        var ps = node("aside", "pm-column pm-safety");
        document.body.insertBefore(shell, app);
        pmn.appendChild(app);
        shell.append(pl, pmn, ps);
      }
      R = shell.querySelector(".pm-safety");
      if (!R) { R = node("aside", "pm-column pm-safety"); shell.appendChild(R); }
      /* main#app vive dentro do pm-main do shell */
      var pmMain = shell.querySelector(".pm-main");
      if (pmMain && app.parentNode !== pmMain) pmMain.appendChild(app);

      /* FUSÃO 1+2: card do PACIENTE migria para o topo da coluna esquerda
         (acima de Ações e Módulos); a coluna externa do paciente colapsa.
         O redesign repõe um novo card a cada sync — troco o velho pelo novo. */
      var pat = shell.querySelector(".pm-patient");
      if (pat) {
        pat.style.display = "none";
        shell.style.gridTemplateColumns = "0 minmax(0,1fr) 320px";
        var novoCardPac = pat.querySelector(".pm-side-card");
        var cardPac = L.querySelector(".pm-patientcard");
        if (novoCardPac) {
          novoCardPac.classList.add("pm-patientcard");
          if (cardPac && cardPac !== novoCardPac) cardPac.remove();
          L.insertBefore(novoCardPac, L.firstChild);
        } else if (!cardPac) {
          /* fallback: réplica própria com os dados do atendimento */
          var C2 = state(), p2 = (C2 && C2.pac) || {};
          cardPac = card("Paciente"); cardPac.classList.add("pm-patientcard");
          var editBtn = node("button", "btn sm", "Editar"); editBtn.type = "button";
          editBtn.addEventListener("click", function () { var b = Array.prototype.find.call(document.querySelectorAll("button"), function (x) { return /Dados do paciente/.test(x.textContent || ""); }); if (b) b.click(); });
          cardPac.querySelector(".pm-side-title").append(editBtn);
          var data = node("div", "pm-data");
          [["Idade", p2.idade ? p2.idade + " " + (p2.idUn || "anos") : "—"], ["Peso", p2.peso ? p2.peso + " kg" : "—"], ["Sexo", p2.sexo === "F" ? "Feminino" : p2.sexo === "M" ? "Masculino" : "—"], ["Gestação", p2.gest ? "Sim" : "—"]].forEach(function (x) { var bx = node("div"); bx.append(node("span", "", x[0]), node("b", "", x[1])); data.append(bx); });
          cardPac.append(data);
          if (p2.alergias && !/^(nega|não|nao|sem)$/i.test(String(p2.alergias).trim())) cardPac.append(node("div", "pm-allergy", "Alergia: " + p2.alergias));
          var auto = node("div", "pm-autosave"); auto.append(node("i"), document.createTextNode("Atendimento salvo localmente")); cardPac.append(auto);
          L.insertBefore(cardPac, L.firstChild);
        } else {
          /* valores vivos */
          var p3 = (state() || {}).pac || {};
          var vals = [p3.idade ? p3.idade + " " + (p3.idUn || "anos") : "—", p3.peso ? p3.peso + " kg" : "—", p3.sexo === "F" ? "Feminino" : p3.sexo === "M" ? "Masculino" : "—", p3.gest ? "Sim" : "—"];
          var boxes = cardPac.querySelectorAll(".pm-data > div");
          boxes.forEach(function (bx, i) { var b = bx.querySelector("b"); if (b && vals[i] != null && b.textContent !== vals[i]) b.textContent = vals[i]; });
        }
      }

      /* ESQUERDA: ações em cima, módulos abaixo */
      var actsCard = L.querySelector(".pm-acts");
      if (!actsCard) { actsCard = card("Ações do atendimento"); actsCard.classList.add("pm-acts"); var pacienteNoTopo = L.querySelector(".pm-patientcard"); L.insertBefore(actsCard, pacienteNoTopo ? pacienteNoTopo.nextSibling : L.firstChild); }
      var alvo = actsCard.querySelector(".pm-acts-btns");
      if (!alvo) { alvo = node("div", "btns"); actsCard.append(alvo); }
      var modwrap = L.querySelector(".pm-modwrap");
      if (!modwrap) { modwrap = card("Módulos do atendimento"); modwrap.classList.add("pm-modwrap"); L.appendChild(modwrap); }

      /* DIREITA: avisos em cima. CLONES dos alertboxes (os originais ficam no app,
         escondidos por CSS — o replaceChildren do redesign nunca destrói conteúdo). */
      var warnCardEl = R.querySelector(":scope > .pm-warn");
      if (!warnCardEl) { warnCardEl = node("section", "pm-side-card pm-warn"); warnCardEl.append(node("div", "pm-side-title", "Avisos desta condição")); R.insertBefore(warnCardEl, R.firstChild); }
      if (warnCardEl.parentNode !== R || R.firstElementChild !== warnCardEl) R.insertBefore(warnCardEl, R.firstChild);
      var orig = Array.prototype.slice.call(app.querySelectorAll(".alertbox"));
      var assinatura = orig.map(function (a) { return (a.textContent || "").length + ":" + (a.textContent || "").slice(0, 60); }).join("|");
      if (warnCardEl.dataset.assinatura !== assinatura) {
        warnCardEl.dataset.assinatura = assinatura;
        Array.prototype.slice.call(warnCardEl.querySelectorAll(".alertbox")).forEach(function (c) { c.remove(); });
        orig.forEach(function (a) { warnCardEl.appendChild(a.cloneNode(true)); });
      }
      /* Segurança/Trava: se o redesign não os trouxe, desenho os meus (sem duplicar) */
      if (!/Segurança clínica/.test(R.textContent)) { var seg = safetyCard(state()); seg.classList.add("pm-seg"); R.appendChild(seg); }
      if (!/Trava de emissão/.test(R.textContent)) { var tv = travaCard(); tv.classList.add("pm-trav"); R.appendChild(tv); }

      /* distribui o conteúdo do MAIN pelas colunas (ordem do documento preservada no meio) */
      window.__LL_STEP = "dist";
      var ehAcao = function (b) { return /^(Aplicar modelo|Salvar atendimento como modelo|Protocolos desta condição)$/.test((b.textContent || "").trim()); };
      Array.prototype.slice.call(app.children).forEach(function (el) {
        if (el === L || el === MID || el === R) return;
        if (el.classList.contains("alertbox")) return; // ficam no app (escondidos); clones na direita
        if (el.classList.contains("mods")) { modwrap.appendChild(el); return; }
        if (el.tagName === "DIV" && el.classList.contains("btns")) {
          var bot = Array.prototype.filter.call(el.querySelectorAll("button"), ehAcao);
          if (bot.length && bot.length === el.querySelectorAll("button").length) {
            bot.forEach(function (b) {
              var velho = Array.prototype.find.call(alvo.children, function (c) { return c.textContent.trim() === b.textContent.trim(); });
              if (velho) velho.remove(); // re-render: troca em vez de acumular
              alvo.appendChild(b);
            });
            el.remove();
            return;
          }
        }
        MID.appendChild(el);
      });
      /* poda no modwrap: só título + grade de módulos */
      Array.prototype.slice.call(modwrap.children).forEach(function (c) {
        if (!c.classList.contains("pm-side-title") && !c.classList.contains("mods")) c.remove();
      });
      modcardPass(MID);
      window.__LL_STEP = "fim";
    } catch (e) { window.__LL_ERR = (e && e.message) + " @ " + (window.__LL_STEP || "?"); }
  }

  var queued = false;
  function sync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; try { pass(); } catch (_) {} });
  }
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  setInterval(function () { try { pass(); } catch (_) {} }, 700); // cartão ao vivo do modal
  sync();
})();
