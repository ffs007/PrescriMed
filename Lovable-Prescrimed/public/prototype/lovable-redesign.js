/* Camada visual PrescriMed: identidade, cockpit responsivo e nomenclatura.
   Não altera cálculos, dados clínicos, geradores ou travas de segurança. */
(function () {
  "use strict";

  var css = document.createElement("style");
  css.textContent = [
    ":root{--bg:#F7F9FF;--surface:#FFFFFF;--soft:#EDF4FF;--line:#C0C7D0;--ink:#121D26;--muted:#40484F;--accent:#005E8A;--accent-ink:#FFFFFF;--accent-soft:#E4EFFD;--ok:#2D8A57;--warn:#C99020;--warn-soft:#FBF4E4;--bad:#BA1A1A;--bad-soft:#FDF3F2;--ai:#6C3CB7;--cyan:#3D72C7;--f-display:Inter,system-ui,sans-serif;--f-body:Inter,system-ui,sans-serif;--f-mono:'IBM Plex Mono',ui-monospace,monospace;--r:4px;--shadow:0 1px 3px rgba(16,24,40,.08)}",
    ":root[data-theme=dark]{--bg:#0B1220;--surface:#111A2B;--soft:#17243A;--line:#344054;--ink:#F2F4F7;--muted:#98A2B3;--accent:#4D83FF;--accent-ink:#FFFFFF;--accent-soft:#162D5E;--ok:#32C99A;--warn:#FDB022;--warn-soft:#3A2B12;--bad:#F97066;--bad-soft:#3A1C21}",
    "body{font-size:14px;letter-spacing:0;font-feature-settings:'tnum' 1,'zero' 1,'cv05' 1,'cv08' 1}",".btn,.in,.sel{border-radius:4px}.btn{min-height:40px}.btn.primary:hover{background:#1E648D}*:focus-visible{outline:2px solid #6B8DFF;outline-offset:2px}",
    "h1,h2,h3,.brand{letter-spacing:0}",
    ".top{background:color-mix(in srgb,var(--surface) 94%,transparent);box-shadow:0 1px 3px rgba(16,24,40,.06)}",
    ".top .wrap{max-width:1680px;padding-inline:24px}",
    ".brand{color:var(--accent);font-size:20px}",
    ".brand small{color:var(--muted);font-family:var(--f-body)}",
    ".btn,.iconbtn,.in,.sel,.ta,.chip,.cond,.mod,.box,.sumcard,.ptchip{box-shadow:none}",
    ".btn.primary{box-shadow:0 1px 2px color-mix(in srgb,var(--accent) 24%,transparent)}",
    ".btn.ai,.fab{background:var(--ai);color:#fff;border-color:var(--ai)}",
    ".fab{border-radius:8px;box-shadow:0 8px 24px rgba(16,24,40,.16)}",
    ".hero{padding-block:32px 16px}.hero h1{font-size:36px}.hero p{max-width:72ch}",
    ".search input{border-width:2px;box-shadow:0 1px 3px rgba(16,24,40,.06)}",
    ".cond{min-height:76px}.cond:hover,.mod:hover{transform:translateY(-1px)}",
    ".badge{border-radius:999px;font-family:var(--f-body);font-weight:700}",
    ".line,.mono{font-variant-numeric:tabular-nums}",
    "dialog.modal{border:1px solid var(--line);box-shadow:0 24px 64px rgba(16,24,40,.22)}",
    ".review-check{margin-left:auto;padding:7px 10px;border:1px solid var(--warning);border-radius:8px;background:var(--warn-soft);font-weight:700}",
    ".review-check:has(input:checked){border-color:var(--ok);background:color-mix(in srgb,var(--ok) 10%,var(--surface));color:var(--ok)}",
    ".pm-cockpit{max-width:1680px;margin:0 auto;display:grid;grid-template-columns:300px minmax(0,1fr) 300px;gap:16px;padding:18px 24px 96px}",
    ".wrap{max-width:1680px;padding-inline:24px}",
    ".conds{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}",
    ".hero .btns[data-psx-home]{justify-content:flex-start!important}",
    "@media(min-width:1536px){.wrap,.top .wrap{padding-inline:32px}.pm-cockpit:not(.pm-home){padding-left:32px}}",
    "@media(min-width:1100px){.pm-cockpit:not(.pm-home){padding-right:64px}.pm-cockpit.pm-home{padding-right:64px;padding-bottom:96px}}",
    ".pm-cockpit>.pm-column{min-width:0}",
    ".pm-patient,.pm-safety{position:sticky;top:78px;display:flex;flex-direction:column;gap:12px}",
    ".pm-side-card{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:14px;box-shadow:var(--shadow)}",
    ".pm-side-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;font-size:12px;font-weight:800;text-transform:uppercase;color:var(--muted)}",
    ".pm-patient-name{font-size:17px;font-weight:750;color:var(--ink);overflow-wrap:anywhere}",
    ".pm-name-in{width:100%;font-size:16px;font-weight:700;min-height:40px}",
    ".pm-modal-name{display:flex;align-items:center;gap:8px;margin-top:6px;max-width:420px}.pm-modal-name span{font-size:12px;font-weight:700;color:var(--muted)}.pm-modal-name input{flex:1;min-height:36px;font-size:15px}",
    ".pm-data{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}",
    ".pm-data div{background:var(--bg);border:1px solid var(--line);border-radius:7px;padding:8px}",
    ".pm-data span{display:block;font-size:10px;text-transform:uppercase;color:var(--muted)}",
    ".pm-data b{display:block;margin-top:2px;font:600 13px var(--f-mono)}",
    ".pm-allergy{margin-top:10px;border:1px solid var(--bad);background:var(--bad-soft);color:var(--bad);border-radius:7px;padding:9px;font-weight:750;overflow-wrap:anywhere}",
    ".pm-state{display:flex;gap:8px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--line);font-size:13px;line-height:1.4}",
    ".pm-state:first-of-type{border-top:0}.pm-dot{width:9px;height:9px;margin-top:4px;border-radius:50%;background:var(--ok);flex:none}.pm-dot.warn{background:var(--warn)}.pm-dot.bad{background:var(--bad)}",
    ".pm-main #app>.crumb{padding-top:0}.pm-main #app>.chead{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:16px}.pm-main #app .mods{grid-template-columns:repeat(2,minmax(0,1fr))}.pm-main #app .sumcard{margin-bottom:0}",
    ".pm-autosave{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px}.pm-autosave i{width:7px;height:7px;border-radius:50%;background:var(--ok)}",
    ".pm-cockpit.pm-home{display:block;max-width:none;margin:0;padding:0}.pm-cockpit.pm-home>.pm-patient,.pm-cockpit.pm-home>.pm-safety{display:none}.pm-cockpit.pm-home>.pm-main{display:block}",
    "@media(max-width:1120px){.pm-cockpit{grid-template-columns:220px minmax(460px,1fr)}.pm-safety{position:static;grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}.pm-safety .pm-side-card:last-child{grid-column:1/-1}}",
    "@media(max-width:760px){.top .wrap{padding-inline:12px;gap:6px;flex-wrap:wrap}.top .ptchip{max-width:calc(100vw - 150px);order:3;margin-left:0}.top .ptchip~.iconbtn{margin-left:auto}.pm-cockpit{display:flex;flex-direction:column;padding:12px}.pm-patient,.pm-safety{position:static;display:block}.pm-patient .pm-side-card,.pm-safety .pm-side-card{margin-bottom:10px}.pm-main{order:2}.pm-patient{order:1}.pm-safety{order:3}.pm-main #app .mods{grid-template-columns:1fr 1fr}.pm-side-card .pm-data{grid-template-columns:repeat(3,1fr)}.brand small{display:none}}",
    "@media(max-width:480px){.pm-main #app .mods{grid-template-columns:1fr}.pm-side-card .pm-data{grid-template-columns:1fr 1fr}.hero h1{font-size:30px}.top .wrap{padding-inline:8px}.top .brand{font-size:17px}.top .btn{padding:7px 9px;font-size:12px}.top .ptchip{max-width:calc(100vw - 104px)}.chead{overflow:hidden}.chead .chips{max-width:100%}.chead .chip{max-width:100%;white-space:normal;overflow-wrap:anywhere}}",
    "@media(prefers-reduced-motion:reduce){.cond:hover,.mod:hover{transform:none}}"
  ].join("");
  document.head.appendChild(css);

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function legacyText(value) {
    return String(value || "")
      .replace(/PS\s*Express(?:\s*HMC)?/gi, "PrescriMed")
      .replace(/Claude/gi, "Assistente PrescriMed");
  }

  function rename(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var item;
    while ((item = walker.nextNode())) {
      if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(item.parentElement && item.parentElement.tagName || "")) continue;
      var next = legacyText(item.nodeValue);
      if (next !== item.nodeValue) item.nodeValue = next;
    }
    document.querySelectorAll('[aria-label*="Claude"],[title*="Claude"]').forEach(function (el) {
      ["aria-label", "title"].forEach(function (attr) {
        var value = el.getAttribute(attr);
        if (value) el.setAttribute(attr, legacyText(value));
      });
    });
  }

  function state() {
    try { return window.PSAPP && window.PSAPP.test && window.PSAPP.test.C(); } catch (_) { return null; }
  }

  function setName(v) {
    var C = state(); if (!C || !C.pac) return;
    C.pac.nome = v;
    try { window.PSAPP.pr.setScore("__pmname", null); } catch (_) {}
    document.querySelectorAll(".pm-name-in").forEach(function (i) { if (i.value !== v) i.value = v; });
    var pt = document.querySelector("#ptTxt b"); if (pt) pt.textContent = v || "Paciente";
  }
  function nameInput(cls) {
    var C = state() || {}, i = document.createElement("input");
    i.className = "in " + cls; i.type = "text"; i.placeholder = "Digite o nome do paciente"; i.setAttribute("aria-label", "Nome do paciente");
    i.autocomplete = "off"; i.value = (C.pac && C.pac.nome) || "";
    i.addEventListener("input", function () { setName(i.value); });
    return i;
  }
  function modalName() {
    var sub = document.getElementById("mSub"); if (!sub) return;
    var C = state(); if (!C || !C.pac) return;
    if (!/Paciente sem nome|·/.test(sub.textContent)) return;
    var wrap = document.getElementById("pmModalName");
    if (!wrap) { wrap = node("label", "pm-modal-name"); wrap.id = "pmModalName"; wrap.append(node("span", "", "Paciente"), nameInput("pm-name-in")); sub.after(wrap); }
    var i = wrap.querySelector("input"); if (document.activeElement !== i) i.value = C.pac.nome || "";
  }
  setInterval(function () { var d = document.querySelector("dialog[open] #mSub"); var w = document.getElementById("pmModalName"); if (d) modalName(); else if (w) w.remove(); }, 400);

  function patientPanel(C) {
    var p = C.pac || {};
    var card = node("section", "pm-side-card");
    var heading = node("div", "pm-side-title");
    heading.append(node("span", "", "Paciente"));
    var edit = node("button", "btn sm", "Editar");
    edit.type = "button";
    edit.addEventListener("click", function () { var chip = document.getElementById("ptChip"); if (chip) chip.click(); });
    heading.append(edit);
    card.append(heading, nameInput("pm-patient-name pm-name-in"));
    var data = node("div", "pm-data");
    [["Idade", p.idade ? p.idade + " " + (p.idUn || "anos") : "—"], ["Peso", p.peso ? p.peso + " kg" : "—"], ["Sexo", p.sexo === "F" ? "Feminino" : p.sexo === "M" ? "Masculino" : "—"], ["Gestação", p.gest ? "Sim" : "—"]].forEach(function (x) {
      var box = node("div"); box.append(node("span", "", x[0]), node("b", "", x[1])); data.append(box);
    });
    card.append(data);
    if (p.alergias && !/^(nega|não|nao|sem)$/i.test(p.alergias.trim())) card.append(node("div", "pm-allergy", "Alergia: " + p.alergias));
    var auto = node("div", "pm-autosave"); auto.append(node("i"), document.createTextNode("Atendimento salvo localmente")); card.append(auto);
    return card;
  }

  function safetyPanel(C) {
    var card = node("section", "pm-side-card");
    card.append(node("div", "pm-side-title", "Segurança clínica"));
    var p = C.pac || {};
    var checks = [
      [p.alergias ? "bad" : "warn", p.alergias ? "Alergias registradas e verificadas" : "Alergias ainda não informadas"],
      [p.peso ? "" : "warn", p.peso ? "Peso disponível para cálculo" : "Informe o peso para doses por kg"],
      [p.sexo === "F" ? "warn" : "", p.sexo === "F" ? "Confirmar gestação e lactação" : "Alertas clínicos permanecem ativos"],
      ["warn", "Dose, função renal e contraindicações serão avaliadas durante a prescrição"]
    ];
    checks.forEach(function (x) { var row = node("div", "pm-state"); row.append(node("i", "pm-dot " + x[0]), node("span", "", x[1])); card.append(row); });
    return card;
  }

  function reviewPanel() {
    var card = node("section", "pm-side-card");
    card.append(node("div", "pm-side-title", "Trava de emissão"));
    var text = node("p", "note", "Baixar, imprimir ou enviar só é liberado após a confirmação “Revisei este documento”. Alterações posteriores exigem nova revisão.");
    text.style.margin = "0";
    card.append(text);
    return card;
  }

  function cockpit() {
    var app = document.getElementById("app"), C = state();
    if (!app || !C) return;
    var shell = document.querySelector(".pm-cockpit");
    if (!shell) {
      shell = node("div", "pm-cockpit pm-home");
      var left = node("aside", "pm-column pm-patient");
      var main = node("section", "pm-column pm-main");
      var right = node("aside", "pm-column pm-safety");
      app.parentNode.insertBefore(shell, app);
      main.append(app);
      shell.append(left, main, right);
    }
    var active = !!C.proto && !!app.querySelector(".mods");
    shell.classList.toggle("pm-home", !active);
    var patient = shell.querySelector(".pm-patient");
    var safety = shell.querySelector(".pm-safety");
    if (!patient || !safety) return;
    var typing = patient.contains(document.activeElement) && document.activeElement.tagName === "INPUT";
    if (!typing) patient.replaceChildren();
    safety.replaceChildren();
    if (active) {
      if (!typing) patient.append(patientPanel(C));
      safety.append(safetyPanel(C), reviewPanel());
    }
  }

  var queued = false;
  function sync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      rename(document.body);
      var brand = document.getElementById("goHome");
      if (brand && brand.firstChild) brand.firstChild.nodeValue = "PrescriMed ";
      var fab = document.getElementById("fab");
      if (fab) fab.classList.add("ai");
      cockpit();
    });
  }

  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("input", sync, true);
  document.addEventListener("change", sync, true);
  sync();
})();