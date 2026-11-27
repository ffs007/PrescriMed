/* Complemento aditivo do PresCrimed: reorganiza os módulos existentes e acrescenta
   atestado médico + declaração de comparecimento sem duplicar motores clínicos. */
(function () {
  "use strict";

  var ORDER = [
    "Prescrição ambulatorial", "Prescrição hospitalar", "Exames laboratoriais",
    "Outros exames complementares", "Atestados e declarações", "Anamnese dirigida",
    "Exame físico dirigido", "Escores e calculadoras",
    "Encaminhamento ambulatorial", "Transferência inter-hospitalar", "Evolução e resumo de alta"
  ];
  var originalLabels = {
    "Imagem e outros exames": "Outros exames complementares",
    "Receita de alta": "Prescrição ambulatorial"
  };
  var reviewByModal = new WeakMap();
  var internal = false;

  function el(tag, attrs) {
    var node = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (key) {
      if (key === "class") node.className = a[key];
      else if (key === "text") node.textContent = a[key];
      else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2), a[key]);
      else if (a[key] != null) node.setAttribute(key, a[key]);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) node.appendChild(arguments[i]);
    return node;
  }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function pad(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function isoToday() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function brDate(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : v; }
  function clean(v) { return String(v == null ? "" : v).trim(); }
  function patient() { return (window.PSAPP && window.PSAPP.test && window.PSAPP.test.C().pac) || {}; }
  function config() {
    var saved = read("psx.cfg", {});
    return {
      estab: Object.assign({ nome: "HOSPITAL MUNICIPAL DE CABECEIRAS", cidade: "Cabeceiras-GO", endereco: "", cnes: "" }, saved.estab || {}),
      sol: Object.assign({ nome: "", conselho: "" }, saved.sol || {})
    };
  }
  function state() {
    return read("psx.ambulatory-docs", {
      atestado: { dias: "1", inicio: isoToday(), finalidade: "", cid: "", consentimentoCid: false, texto: "" },
      comparecimento: { data: isoToday(), inicio: "", fim: "", acompanhante: "", texto: "" }
    });
  }

  function moduleLabel(button) {
    var bold = button.querySelector("b");
    if (!bold) return "";
    var label = originalLabels[bold.textContent] || bold.textContent;
    if (bold.textContent !== label) bold.textContent = label;
    return label;
  }
  function openAmbulatoryPrescription() {
    var api = window.PSAPP && window.PSAPP.test;
    if (!api) return;
    api.openMod("rx");
    var title = document.getElementById("mTitle"), sub = document.getElementById("mSub");
    if (title) title.textContent = "Prescrição ambulatorial";
    if (sub) sub.textContent = sub.textContent.replace("Receita de alta", "Prescrição ambulatorial");
  }
  function documentCard() {
    var button = el("button", { class: "mod", type: "button", "data-lovable-documents": "true", onclick: openDocuments });
    var icon = el("span", { class: "ic" });
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h5"/></svg>';
    button.append(icon, el("b", { text: "Atestados e declarações" }), el("small", { text: "médico e comparecimento" }));
    return button;
  }
  function organizeModules() {
    var grid = document.querySelector(".mods");
    if (!grid || internal) return;
    internal = true;
    grid.querySelectorAll(":scope > .mod[data-lovable-ambulatory]").forEach(function (b) { b.remove(); });
    var buttons = Array.from(grid.querySelectorAll(":scope > .mod"));
    var doc = buttons.find(function (b) { return b.hasAttribute("data-lovable-documents"); });
    if (!doc) { doc = documentCard(); buttons.push(doc); }
    buttons.sort(function (a, b) { return ORDER.indexOf(moduleLabel(a)) - ORDER.indexOf(moduleLabel(b)); });
    var current = Array.from(grid.querySelectorAll(":scope > .mod"));
    var changed = current.length !== buttons.length || buttons.some(function (button, index) { return current[index] !== button; });
    if (changed) buttons.forEach(function (button) { grid.appendChild(button); });
    internal = false;
  }

  function field(label, input) { return el("label", { class: "f" }, el("span", { text: label }), input); }
  function input(type, value, oninput) {
    var i = el("input", { class: "in", type: type || "text", value: value || "" });
    i.value = value || ""; i.addEventListener("input", oninput); i.addEventListener("change", oninput); return i;
  }
  function textarea(value, rows, oninput) {
    var t = el("textarea", { class: "ta", rows: rows || 8 }); t.value = value || ""; t.addEventListener("input", oninput); return t;
  }
  function defaultCertificate(d, p) {
    var nome = clean(p.nome) || "________________________________";
    var dias = Math.max(1, parseInt(d.dias, 10) || 1);
    var texto = "Atesto, para os devidos fins, que " + nome + " necessita de afastamento de suas atividades por " + dias + " dia" + (dias > 1 ? "s" : "") + ", a partir de " + brDate(d.inicio || isoToday()) + ".";
    if (clean(d.finalidade)) texto += " Finalidade: " + clean(d.finalidade) + ".";
    if (d.consentimentoCid && clean(d.cid)) texto += " CID-10: " + clean(d.cid).toUpperCase() + ".";
    return texto;
  }
  function defaultAttendance(d, p) {
    var nome = clean(p.nome) || "________________________________";
    var periodo = d.inicio ? " das " + d.inicio + (d.fim ? " às " + d.fim : "") : "";
    var texto = "Declaro, para os devidos fins, que " + nome + " compareceu a esta unidade de saúde em " + brDate(d.data || isoToday()) + periodo + ".";
    if (clean(d.acompanhante)) texto += " Acompanhante: " + clean(d.acompanhante) + ".";
    return texto;
  }

  function buildPdf(title, body, date, p) {
    var cfg = config(), jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) throw new Error("gerador de PDF não carregou");
    var doc = new jsPDF({ unit: "mm", format: "a4", compress: true }), L = 18, R = 192;
    doc.setProperties({ title: title + " - " + clean(p.nome), creator: "PrescriMed" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(clean(cfg.estab.nome), L, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(clean([cfg.estab.cnes ? "CNES " + cfg.estab.cnes : "", cfg.estab.endereco, cfg.estab.cidade].filter(Boolean).join(" · ")), L, 23);
    doc.setLineWidth(0.4); doc.line(L, 27, R, 27);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(title, 105, 44, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text(doc.splitTextToSize(clean(body), R - L), L, 62, { lineHeightFactor: 1.55 });
    doc.setFontSize(9.5); doc.text(clean(cfg.estab.cidade) + ", " + brDate(date) + ".", R, 205, { align: "right" });
    doc.line(105, 238, R, 238); doc.setFont("helvetica", "bold"); doc.text(clean(cfg.sol.nome), (105 + R) / 2, 244, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.text(clean(cfg.sol.conselho), (105 + R) / 2, 249, { align: "center" });
    doc.setFontSize(7.5); doc.text("Documento emitido após conferência explícita do profissional.", L, 282);
    return doc;
  }
  async function previewPdf(doc, box) {
    box.textContent = ""; var ab = doc.output("arraybuffer");
    if (!window.pdfjsLib) return ab;
    var pdf = await window.pdfjsLib.getDocument({ data: ab.slice(0) }).promise, page = await pdf.getPage(1), viewport = page.getViewport({ scale: 1.4 }), canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height; box.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise; return ab;
  }
  function savePdf(buffer, filename) {
    var url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" })), a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderDocument(kind, body, foot) {
    var data = state(), d = data[kind], p = patient(), status = el("div", { class: "status" }), preview = el("div", { class: "preview" }), generated = null, reviewed = false;
    function changed() { reviewed = false; review.checked = false; download.disabled = true; generated = null; write("psx.ambulatory-docs", data); }
    function bind(obj, key, control) { control.addEventListener("input", function () { obj[key] = control.type === "checkbox" ? control.checked : control.value; changed(); }); control.addEventListener("change", function () { obj[key] = control.type === "checkbox" ? control.checked : control.value; changed(); }); return control; }
    var editor;
    if (kind === "atestado") {
      body.appendChild(el("div", { class: "box" }, el("h3", { text: "Atestado médico" }), el("div", { class: "grid" },
        field("Dias de afastamento", bind(d, "dias", input("number", d.dias))), field("Início do afastamento", bind(d, "inicio", input("date", d.inicio))), field("Finalidade (opcional)", bind(d, "finalidade", input("text", d.finalidade))), field("CID-10 (opcional)", bind(d, "cid", input("text", d.cid))))));
      var consent = el("input", { type: "checkbox" }); consent.checked = !!d.consentimentoCid; bind(d, "consentimentoCid", consent);
      body.lastChild.appendChild(el("label", { class: "check" }, consent, document.createTextNode("Paciente consentiu expressamente com a inclusão do CID no atestado")));
      if (!d.texto) d.texto = defaultCertificate(d, p);
      editor = textarea(d.texto, 8, function () { d.texto = editor.value; changed(); });
      body.appendChild(el("div", { class: "box" }, el("h3", { text: "Texto final" }), editor, el("button", { class: "btn sm", type: "button", text: "Remontar texto", onclick: function () { d.texto = defaultCertificate(d, p); editor.value = d.texto; changed(); } })));
    } else {
      body.appendChild(el("div", { class: "box" }, el("h3", { text: "Declaração de comparecimento" }), el("div", { class: "grid" },
        field("Data", bind(d, "data", input("date", d.data))), field("Horário inicial", bind(d, "inicio", input("time", d.inicio))), field("Horário final", bind(d, "fim", input("time", d.fim))), field("Acompanhante (opcional)", bind(d, "acompanhante", input("text", d.acompanhante))))));
      if (!d.texto) d.texto = defaultAttendance(d, p);
      editor = textarea(d.texto, 8, function () { d.texto = editor.value; changed(); });
      body.appendChild(el("div", { class: "box" }, el("h3", { text: "Texto final" }), editor, el("button", { class: "btn sm", type: "button", text: "Remontar texto", onclick: function () { d.texto = defaultAttendance(d, p); editor.value = d.texto; changed(); } })));
    }
    var review = el("input", { type: "checkbox" });
    var download = el("button", { class: "btn", type: "button", text: "Baixar PDF", disabled: "" });
    review.addEventListener("change", function () { reviewed = review.checked; download.disabled = !(reviewed && generated); });
    var generate = el("button", { class: "btn primary", type: "button", text: "Gerar PDF", onclick: async function () {
      if (!clean(p.nome)) { status.textContent = "Informe o nome do paciente em Dados do paciente."; status.className = "status err"; return; }
      if (kind === "atestado" && (!d.dias || !d.inicio)) { status.textContent = "Informe o período do afastamento."; status.className = "status err"; return; }
      if (kind === "comparecimento" && !d.data) { status.textContent = "Informe a data do comparecimento."; status.className = "status err"; return; }
      try { var doc = buildPdf(kind === "atestado" ? "ATESTADO MÉDICO" : "DECLARAÇÃO DE COMPARECIMENTO", editor.value, kind === "atestado" ? d.inicio : d.data, p); generated = await previewPdf(doc, preview); download.disabled = !(reviewed && generated); status.textContent = "PDF pronto para conferência."; status.className = "status ok"; write("psx.ambulatory-docs", data); }
      catch (e) { status.textContent = "Não consegui gerar o PDF: " + e.message; status.className = "status err"; }
    } });
    download.addEventListener("click", function () { if (generated && reviewed) savePdf(generated, (kind === "atestado" ? "ATESTADO_" : "COMPARECIMENTO_") + clean(p.nome).replace(/\W+/g, "_").toUpperCase() + ".pdf"); });
    foot.append(generate, download, el("label", { class: "check review-check" }, review, document.createTextNode("Revisei este documento")), status);
    body.appendChild(preview);
  }
  function openDocuments() {
    var modal = document.getElementById("lovableDocumentsModal");
    if (!modal) {
      modal = el("dialog", { class: "modal", id: "lovableDocumentsModal", "aria-labelledby": "lovableDocumentsTitle" });
      modal.innerHTML = '<div class="mhead"><div><h2 id="lovableDocumentsTitle">Atestados e declarações</h2><small>documentos compartilhando os dados deste atendimento</small></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="mbody"><div class="chips" role="tablist"><button class="chip on" type="button" data-kind="atestado">Atestado médico</button><button class="chip" type="button" data-kind="comparecimento">Comparecimento</button></div><div id="lovableDocumentsBody"></div></div><div class="mfoot" id="lovableDocumentsFoot"></div>';
      document.body.appendChild(modal); modal.querySelector(".x").addEventListener("click", function () { modal.close(); });
      modal.querySelectorAll("[data-kind]").forEach(function (tab) { tab.addEventListener("click", function () { draw(tab.dataset.kind); }); });
    }
    function draw(kind) {
      modal.querySelectorAll("[data-kind]").forEach(function (tab) { tab.classList.toggle("on", tab.dataset.kind === kind); });
      var body = modal.querySelector("#lovableDocumentsBody"), foot = modal.querySelector("#lovableDocumentsFoot"); body.textContent = ""; foot.textContent = ""; renderDocument(kind, body, foot);
    }
    draw("atestado"); modal.showModal();
  }

  function protectExistingPdf() {
    var modal = document.getElementById("modal"), foot = document.getElementById("mFoot");
    if (!modal || !modal.open || !foot) return;
    var generate = Array.from(foot.querySelectorAll("button")).find(function (b) { return b.textContent.trim() === "Gerar PDF"; });
    var download = Array.from(foot.querySelectorAll("button")).find(function (b) { return b.textContent.trim() === "Baixar PDF"; });
    if (!generate || !download) return;
    var info = reviewByModal.get(modal);
    if (!info || !foot.contains(info.label)) {
      var check = el("input", { type: "checkbox" }), label = el("label", { class: "check review-check" }, check, document.createTextNode("Revisei este documento"));
      info = { check: check, label: label, download: download, generated: false }; reviewByModal.set(modal, info); foot.insertBefore(label, foot.querySelector(".status"));
      generate.addEventListener("click", function () { info.generated = true; setTimeout(function () { download.disabled = !(info.generated && info.check.checked); }, 0); });
      check.addEventListener("change", function () { download.disabled = !(info.generated && check.checked); });
      modal.addEventListener("input", function (event) { if (event.target !== check) { info.generated = false; check.checked = false; download.disabled = true; } });
      download.addEventListener("click", function (event) { if (!check.checked) { event.preventDefault(); event.stopImmediatePropagation(); download.disabled = true; } }, true);
    }
    if (!info.check.checked) download.disabled = true;
  }

  new MutationObserver(function () { organizeModules(); protectExistingPdf(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
  organizeModules();
  window.PSX_DOCS = { openAmbulatory: openAmbulatoryPrescription, isAmbulatory: function () { return false; } };
})();