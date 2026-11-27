/* Assistente de IA para estruturação de protocolos clínicos.
   Extensão aditiva (após lovable-protocols.js). Recebe texto, arquivos (PDF, DOCX, PPTX, TXT, imagens), ditado por voz
   e referências (RIS/BibTeX); a IA devolve um rascunho estruturado em 7 pilares. Nada é salvo sem revisão:
   o rascunho abre no editor de protocolos (versões, equipe e aprovação institucional já existentes). */
(function () {
  "use strict";
  var D = window.PROTO_DB; if (!D || !window.PSX_PROT) return;
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); };
  function el(tag, a) {
    var n = document.createElement(tag); a = a || {};
    Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null || v === false) return;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k === "value") n.value = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v); });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x != null && x !== false) n.appendChild(typeof x === "string" ? document.createTextNode(x) : x); }); }
    return n;
  }
  var btn = function (t, fn, cls) { return el("button", { class: "btn sm " + (cls || ""), type: "button", text: t, onclick: fn }); };
  function toast(t) { var x = el("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 3600); }
  function loadScript(src) { return new Promise(function (res, rej) { if (document.querySelector('script[src="' + src + '"]')) return res(); var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("Não foi possível carregar o leitor de arquivo.")); }; document.head.appendChild(s); }); }

  /* ---------- leitura de arquivos ---------- */
  async function readPdf(f) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    var lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    var doc = await lib.getDocument({ data: await f.arrayBuffer() }).promise, txt = "", imgs = [];
    for (var i = 1; i <= Math.min(doc.numPages, 60); i++) { var pg = await doc.getPage(i), c = await pg.getTextContent(); txt += c.items.map(function (x) { return x.str; }).join(" ") + "\n"; }
    if (txt.replace(/\s/g, "").length < 200) { // PDF escaneado: envia as primeiras páginas como imagem (leitura óptica pela IA)
      for (var j = 1; j <= Math.min(doc.numPages, 3); j++) { var p = await doc.getPage(j), vp = p.getViewport({ scale: 1.6 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; await p.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; imgs.push(await new Promise(function (r) { cv.toBlob(r, "image/jpeg", 0.85); })); }
    }
    return { text: txt, images: imgs };
  }
  async function readDocx(f) { await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"); var r = await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() }); return { text: r.value, images: [] }; }
  async function readPptx(f) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    var z = await window.JSZip.loadAsync(await f.arrayBuffer()), names = Object.keys(z.files).filter(function (n) { return /^ppt\/slides\/slide\d+\.xml$/.test(n); }).sort(function (a, b) { return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]); }), out = "";
    for (var i = 0; i < names.length; i++) { var x = await z.file(names[i]).async("string"); out += "Slide " + (i + 1) + ": " + (x.match(/<a:t>([^<]*)<\/a:t>/g) || []).map(function (t) { return t.replace(/<\/?a:t>/g, ""); }).join(" ") + "\n"; }
    return { text: out, images: [] };
  }
  async function readFile(f) {
    var n = fold(f.name);
    if (/^image\//.test(f.type)) return { text: "", images: [f] };
    if (/\.pdf$/.test(n)) return readPdf(f);
    if (/\.docx$/.test(n)) return readDocx(f);
    if (/\.pptx$/.test(n)) return readPptx(f);
    return { text: await f.text(), images: [] }; // txt, md, ris, bib, nbib, enw, csv
  }

  /* ---------- normalização com a base do app ---------- */
  var DRUGIX = null;
  function drugMatch(nome) {
    if (!DRUGIX) DRUGIX = Object.keys(D.drugs).map(function (id) { return [id, fold(D.drugs[id].n)]; });
    var t = fold(nome).replace(/\(.*?\)/g, "").trim(); if (t.length < 3) return null;
    var exact = DRUGIX.find(function (x) { return x[1] === t; }); if (exact) return exact[0];
    var first = t.split(/[\s+/,]+/)[0]; if (first.length < 5) return null;
    var part = DRUGIX.find(function (x) { return x[1].split(/[\s+/,]+/)[0] === first; }); return part ? part[0] : null;
  }
  var SIG = null;
  function exMatch(nome, cod) {
    if (!SIG) { SIG = []; [window.SIGTAP_LAB, window.SIGTAP_IMG].forEach(function (t) { if (typeof t === "string") t.split("\n").forEach(function (l) { var i = l.indexOf("|"); if (i > 0) SIG.push([l.slice(0, i), fold(l.slice(i + 1))]); }); }); }
    if (cod && SIG.some(function (x) { return x[0] === cod; })) return cod;
    var t = fold(nome); if (t.length < 3) return null;
    var hit = SIG.find(function (x) { return x[1] === t; }) || SIG.find(function (x) { return x[1].indexOf(t) === 0; }) || SIG.find(function (x) { return x[1].indexOf(t) >= 0; });
    return hit ? hit[0] : null;
  }

  /* ---------- prompt ---------- */
  function prompt(text, ctx) {
    return [
      "Você é um assistente de estruturação de protocolos clínicos (foco pediátrico, Brasil). Leia o material abaixo (pode vir de artigo, livro fotografado, anotação manuscrita, transcrição de aula ou nota pessoal) e devolva SOMENTE um objeto JSON.",
      "Regras: use nomes de medicamentos pela DCB (genérico; converta nomes comerciais), CID-10 brasileiro, não invente doses nem referências que não estejam no material; se algo faltar, deixe vazio e registre em 'lacunas'. Para cada campo informe confiança: 'alta' (escrito claramente no texto), 'media' (inferido/interpretado) ou 'baixa'. Corrija erros de leitura óptica pelo contexto. Responda em português.",
      ctx ? "Contexto informado pelo médico: " + ctx : "",
      "Formato JSON:",
      '{"titulo":"","resumo":"","palavras":[""],"cid":[{"codigo":"","nome":""}],"mesh":[""],"snomed":[""],',
      '"indicacoes":{"idadeMin":"","idadeMax":"","contextos":["ambulatório|pronto-socorro|internação|UTI"],"inclui":"","criteriosDiagnosticos":"","gravidade":"","confianca":"alta|media|baixa"},',
      '"contraindicacoes":{"absolutas":"","relativas":"","interacoes":"","populacoesEspeciais":"","confianca":""},',
      '"medicamentos":[{"nome":"","nomeComercial":"","apresentacao":"","dosePorKg":"","doseMaxima":"","via":"","frequencia":"","duracao":"","ajusteRenalHepatico":"","alternativas":[""],"essencial":true,"confianca":""}],',
      '"monitoramento":{"exames":[{"nome":"","quando":"","essencial":true}],"sinaisVitais":"","toxicidade":"","resposta":"","confianca":""},',
      '"orientacoes":{"domiciliar":"","sinaisAlarme":"","cuidados":"","restricoes":"","expectativa":"","confianca":""},',
      '"criterios":{"retorno":"","internacao":"","alta":"","uti":"","confianca":""},',
      '"fluxo":[{"id":"n1","texto":"pergunta ou conduta","conduta":false,"opcoes":[{"t":"sim","next":"n2"}]}],',
      '"referencias":[{"texto":"formato Vancouver","url":"","ano":"","evidencia":"Oxford/GRADE se informado","confianca":""}],',
      '"lacunas":[{"campo":"","problema":"","sugestao":""}],"alertasSeguranca":[""]}',
      "MATERIAL:\n" + text.slice(0, 60000)
    ].join("\n");
  }

  /* ---------- checagem de qualidade (regras transparentes, sem IA) ---------- */
  function quality(j) {
    var g = [], ok = function (c, t, s) { g.push({ ok: !!c, t: t, s: s }); };
    var meds = j.medicamentos || [];
    ok(j.titulo, "Título definido", "Dê um nome claro ao protocolo.");
    ok((j.cid || []).length, "CID-10 informado", "Informe ao menos um CID-10.");
    ok((j.indicacoes || {}).idadeMin || (j.indicacoes || {}).idadeMax, "Faixa etária definida", "Defina idade mínima e máxima.");
    ok((j.indicacoes || {}).criteriosDiagnosticos, "Critérios diagnósticos objetivos", "Descreva critérios clínicos/laboratoriais.");
    ok((j.indicacoes || {}).gravidade, "Estratificação de gravidade", "Cite a escala de gravidade usada.");
    ok((j.contraindicacoes || {}).absolutas || (j.contraindicacoes || {}).relativas, "Contraindicações descritas", "Liste contraindicações absolutas e relativas.");
    ok(meds.length, "Esquema terapêutico presente", "Inclua ao menos um medicamento.");
    meds.forEach(function (m) {
      if (!m.via) g.push({ ok: false, t: m.nome + ": via não especificada", s: "Informe a via (VO, IV, IM, inalatória)." });
      if (!m.frequencia) g.push({ ok: false, t: m.nome + ": frequência ausente", s: "Informe o intervalo entre doses." });
      if (!m.dosePorKg && !m.apresentacao) g.push({ ok: false, t: m.nome + ": dose ausente", s: "Informe dose por kg e dose máxima." });
      if (m.dosePorKg && !m.doseMaxima) g.push({ ok: false, t: m.nome + ": sem dose máxima", s: "Pediatria exige teto de dose." });
      if (!m._drug) g.push({ ok: false, t: m.nome + ": não encontrado na base do app", s: "Escolha o equivalente da base no editor para o cálculo automático por peso." });
    });
    ok(meds.some(function (m) { return (m.alternativas || []).length; }), "Alternativas para alergia/falta", "Inclua alternativas terapêuticas.");
    ok((j.contraindicacoes || {}).populacoesEspeciais, "Populações especiais (prematuros, imunocomprometidos…)", "Considere populações especiais.");
    ok(((j.monitoramento || {}).exames || []).length || (j.monitoramento || {}).sinaisVitais, "Monitoramento definido", "Defina exames e sinais a acompanhar.");
    ok((j.orientacoes || {}).sinaisAlarme, "Sinais de alarme para a família", "Liste sinais que exigem retorno imediato.");
    ok((j.criterios || {}).retorno || (j.criterios || {}).alta, "Critérios de retorno/alta", "Defina reavaliação e critérios de alta.");
    ok((j.referencias || []).length, "Referências bibliográficas", "Cite a fonte (diretriz SBP/AAP/OMS, artigo).");
    ok((j.referencias || []).some(function (r) { return r.evidencia; }), "Nível de evidência", "Classifique por Oxford/GRADE.");
    return g;
  }

  /* ---------- conversão para o formato do editor de protocolos ---------- */
  function toProt(j) {
    var ind = j.indicacoes || {}, ci = j.contraindicacoes || {}, mo = j.monitoramento || {}, or = j.orientacoes || {}, cr = j.criterios || {};
    var meds = (j.medicamentos || []).map(function (m) {
      var pos = [m.dosePorKg, m.doseMaxima ? "máx. " + m.doseMaxima : "", m.via, m.frequencia, m.duracao].filter(Boolean).join(" · ");
      return { drug: m._drug || null, nome: m._drug ? D.drugs[m._drug].n : m.nome, apres: m.apresentacao || "", pos: pos, alt: (m.alternativas || []).map(drugMatch).filter(Boolean), essencial: m.essencial !== false,
        notas: [m.nomeComercial ? "Comercial: " + m.nomeComercial : "", m.ajusteRenalHepatico ? "Ajuste: " + m.ajusteRenalHepatico : ""].filter(Boolean).join(" · "), origem: "assistente_ia" };
    });
    var exames = (mo.exames || []).map(function (x) { var c = exMatch(x.nome, x.codigo); return c ? { codigo: c, grupo: /^0202/.test(c) ? "lab" : "comp", tipo: x.essencial === false ? "opcional" : "essencial", quando: x.quando || "" } : null; }).filter(Boolean);
    var join = function (pairs) { return pairs.filter(function (p) { return p[1]; }).map(function (p) { return p[0] + ": " + p[1]; }).join("\n"); };
    return {
      palavras: (j.palavras || []).filter(Boolean), resumo: j.resumo || "", cid: (j.cid || []).filter(function (c) { return c.codigo; }).map(function (c) { return [String(c.codigo).toUpperCase(), c.nome || ""]; }),
      escopo: { idadeMin: ind.idadeMin || "", idadeMax: ind.idadeMax || "", inclui: join([["Indicações", ind.inclui], ["Critérios diagnósticos", ind.criteriosDiagnosticos], ["Gravidade", ind.gravidade]]),
        exclui: join([["Absolutas", ci.absolutas], ["Relativas", ci.relativas], ["Interações", ci.interacoes], ["Populações especiais", ci.populacoesEspeciais]]),
        contextos: (ind.contextos || []).filter(function (c) { return ["ambulatório", "pronto-socorro", "internação", "UTI"].indexOf(c) >= 0; }) },
      objetivos: { primarios: mo.resposta || "", secundarios: join([["Sinais vitais", mo.sinaisVitais], ["Toxicidade", mo.toxicidade]]) },
      fluxo: { nodes: (j.fluxo || []).filter(function (n) { return n.id && n.texto; }) }, meds: meds,
      criterios: { internacao: cr.internacao || "", alta: join([["Alta", cr.alta], ["Retorno", cr.retorno], ["Orientações domiciliares", or.domiciliar], ["Sinais de alarme", or.sinaisAlarme], ["Cuidados", or.cuidados], ["Restrições", or.restricoes], ["Expectativa de melhora", or.expectativa]]), uti: cr.uti || "" },
      exames: exames, refs: { primarias: (j.referencias || []).map(function (r) { return { t: r.texto + (r.evidencia ? " [" + r.evidencia + "]" : ""), url: r.url || "" }; }), secundarias: [] },
      autor: {}, quiz: [], ia: { mesh: j.mesh || [], snomed: j.snomed || [], alertas: j.alertasSeguranca || [], gerado: new Date().toISOString() }
    };
  }

  /* ---------- exportações ---------- */
  function download(name, data, type) { var u = URL.createObjectURL(new Blob([data], { type: type })), a = el("a", { href: u, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
  function slug(j) { return fold(j.titulo || "protocolo").replace(/[^a-z0-9]+/g, "-").slice(0, 50); }
  function toMarkdown(j) {
    var L = ["# " + (j.titulo || "Protocolo"), "", j.resumo || "", "", "**CID-10:** " + (j.cid || []).map(function (c) { return c.codigo + " " + c.nome; }).join("; ")];
    var sec = function (t, o) { L.push("", "## " + t); Object.keys(o || {}).forEach(function (k) { if (k !== "confianca" && o[k] && typeof o[k] !== "object") L.push("- **" + k + ":** " + o[k]); }); };
    sec("1. Indicações", j.indicacoes); sec("2. Contraindicações", j.contraindicacoes);
    L.push("", "## 3. Esquema terapêutico", "", "| Medicamento | Dose/kg | Máx. | Via | Frequência | Duração |", "|---|---|---|---|---|---|");
    (j.medicamentos || []).forEach(function (m) { L.push("| " + [m.nome, m.dosePorKg, m.doseMaxima, m.via, m.frequencia, m.duracao].map(function (x) { return x || "—"; }).join(" | ") + " |"); });
    sec("4. Monitoramento", j.monitoramento); ((j.monitoramento || {}).exames || []).forEach(function (x) { L.push("- Exame: " + x.nome + (x.quando ? " (" + x.quando + ")" : "")); });
    sec("5. Orientações ao paciente/cuidador", j.orientacoes); sec("6. Critérios de retorno", j.criterios);
    L.push("", "## 7. Referências"); (j.referencias || []).forEach(function (r, i) { L.push((i + 1) + ". " + r.texto + (r.evidencia ? " — Evidência: " + r.evidencia : "") + (r.url ? " " + r.url : "")); });
    L.push("", "_Rascunho estruturado pelo Assistente PrescriMed. Conteúdo deve ser revisado por médico antes do uso._");
    return L.join("\n");
  }
  function toCsv(j) { var q = function (x) { return '"' + String(x || "").replace(/"/g, '""') + '"'; }; return "\ufeff" + ["Medicamento;Apresentação;Dose por kg;Dose máxima;Via;Frequência;Duração;Ajuste renal/hepático;Alternativas"].concat((j.medicamentos || []).map(function (m) { return [m.nome, m.apresentacao, m.dosePorKg, m.doseMaxima, m.via, m.frequencia, m.duracao, m.ajusteRenalHepatico, (m.alternativas || []).join(", ")].map(q).join(";"); })).join("\n"); }
  function toPocketPdf(j) {
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) return toast("Gerador de PDF indisponível.");
    var d = new J({ unit: "mm", format: [85, 54], orientation: "landscape" }), y = 6, w = 77;
    var put = function (t, sz, b) { d.setFont("helvetica", b ? "bold" : "normal"); d.setFontSize(sz); d.splitTextToSize(String(t), w).forEach(function (l) { if (y > 50) { d.addPage([85, 54], "landscape"); y = 6; } d.text(l, 4, y); y += sz * 0.42; }); };
    put(j.titulo || "Protocolo", 9, true); put((j.cid || []).map(function (c) { return c.codigo; }).join(" · "), 6);
    (j.medicamentos || []).forEach(function (m) { put("• " + m.nome + ": " + [m.dosePorKg, m.doseMaxima && "máx " + m.doseMaxima, m.via, m.frequencia, m.duracao].filter(Boolean).join(" "), 6); });
    if ((j.orientacoes || {}).sinaisAlarme) put("Alarme: " + j.orientacoes.sinaisAlarme, 6, true);
    if ((j.criterios || {}).internacao) put("Internar: " + j.criterios.internacao, 6);
    put("Rascunho — revisar antes do uso", 5);
    d.save("card-" + slug(j) + ".pdf");
  }

  /* ---------- tela ---------- */
  var COR = { alta: "var(--ok,#1a8a4a)", media: "var(--warn,#b07a00)", baixa: "var(--bad,#c33)" };
  function conf(c) { c = fold(c); return c === "alta" ? "alta" : c === "baixa" ? "baixa" : "media"; }
  function dialog(t, sub) {
    var dlg = document.getElementById("psxAiProt");
    if (!dlg) { dlg = el("dialog", { class: "modal", id: "psxAiProt", "aria-labelledby": "psxAiProtT", style: "max-width:960px;width:96vw" }); dlg.innerHTML = '<div class="mhead"><div><h2 id="psxAiProtT"></h2><small id="psxAiProtS"></small></div><button class="x" type="button" aria-label="Fechar">×</button></div><div class="mbody" id="psxAiProtB"></div><div class="mfoot" id="psxAiProtF"></div>'; document.body.appendChild(dlg); dlg.querySelector(".x").addEventListener("click", function () { dlg.close(); }); }
    dlg.querySelector("#psxAiProtT").textContent = t; dlg.querySelector("#psxAiProtS").textContent = sub || "";
    var b = dlg.querySelector("#psxAiProtB"), f = dlg.querySelector("#psxAiProtF"); b.textContent = ""; f.textContent = ""; if (!dlg.open) dlg.showModal();
    return { dlg: dlg, b: b, f: f };
  }

  function openAssistant() {
    var s = dialog("Assistente de protocolos com IA", "transforma material solto em protocolo estruturado — você revisa antes de salvar");
    var files = [], txt = el("textarea", { class: "ta", rows: 9, placeholder: "Cole aqui a diretriz, trecho de artigo, transcrição de aula ou suas anotações…", style: "width:100%" });
    var ctx = el("input", { class: "in", type: "text", placeholder: "Contexto opcional (ex.: PS pediátrico, crianças de 1 a 5 anos)", style: "width:100%;margin-top:6px" });
    var list = el("div", { class: "note" }), st = el("div", { class: "status" });
    var fin = el("input", { type: "file", multiple: true, accept: ".pdf,.docx,.pptx,.txt,.md,.ris,.bib,.nbib,.enw,.csv,image/*", style: "display:none" });
    var cam = el("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none" });
    function addFiles(fl) { Array.prototype.forEach.call(fl, function (f) { files.push(f); }); list.textContent = files.length ? "Arquivos: " + files.map(function (f) { return f.name; }).join(", ") : ""; }
    fin.addEventListener("change", function () { addFiles(fin.files); fin.value = ""; }); cam.addEventListener("change", function () { addFiles(cam.files); cam.value = ""; });
    var rec = null, micBtn = btn("🎙 Ditar", function () {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return toast("Ditado indisponível neste navegador. Use Chrome ou Safari.");
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = false;
      rec.onresult = function (e) { for (var i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) txt.value += (txt.value ? " " : "") + e.results[i][0].transcript; };
      rec.onend = function () { rec = null; micBtn.textContent = "🎙 Ditar"; }; rec.start(); micBtn.textContent = "⏹ Parar ditado";
    });
    s.b.append(
      el("div", { class: "note", text: "Aceita: texto colado, PDF (inclusive escaneado), Word (.docx), PowerPoint (.pptx), fotos de livro ou anotação manuscrita, ditado por voz e referências exportadas do Zotero/Mendeley/EndNote (.ris, .bib, .nbib, .enw)." }),
      txt, ctx, el("div", { class: "btns", style: "margin:8px 0" }, btn("📎 Anexar arquivos", function () { fin.click(); }), btn("📷 Fotografar página", function () { cam.click(); }), micBtn, fin, cam), list, st);
    s.f.append(btn("Estruturar protocolo", async function () {
      var text = txt.value.trim(), imgs = [];
      try {
        for (var i = 0; i < files.length; i++) { st.textContent = "Lendo " + files[i].name + "…"; st.className = "status"; var r = await readFile(files[i]); if (r.text) text += "\n\n[Arquivo " + files[i].name + "]\n" + r.text; imgs = imgs.concat(r.images); }
        if (!text && !imgs.length) { st.textContent = "Cole um texto ou anexe um arquivo."; st.className = "status err"; return; }
        if (imgs.length > 3) { toast("Só as 3 primeiras imagens serão lidas."); imgs = imgs.slice(0, 3); }
        st.textContent = "A IA está estruturando o protocolo (pode levar até 1 minuto)…";
        var sample = await window.claude.use("sample"), j = await sample.json(prompt(text || "(ver imagens anexadas)", ctx.value.trim()), { images: imgs });
        if (!j || typeof j !== "object") throw new Error("A IA não devolveu um resultado válido.");
        (j.medicamentos || []).forEach(function (m) { m._drug = drugMatch(m.nome); });
        preview(j, text);
      } catch (e) { st.textContent = (e && (e.message || e.error)) || "Falha ao estruturar."; st.className = "status err"; }
    }, "primary"), btn("Fechar", function () { s.dlg.close(); }, "ghost"));
    setTimeout(function () { txt.focus(); }, 50);
  }

  function preview(j, source) {
    (j.medicamentos || []).forEach(function (m) { if (m._drug === undefined) m._drug = drugMatch(m.nome); });
    var s = dialog("Revisão do rascunho: " + (j.titulo || "protocolo"), "verde = extraído com segurança · amarelo = conferir · vermelho = lacuna");
    var row = function (label, value, c, edit) {
      var k = conf(c), empty = !value || (Array.isArray(value) && !value.length), color = empty ? COR.baixa : COR[k], icon = empty ? "✖" : k === "alta" ? "✔" : "⚠";
      var inpEl = el("textarea", { class: "ta", rows: 2, style: "width:100%;min-height:40px;border-left:4px solid " + color, text: Array.isArray(value) ? value.join(", ") : value || "" });
      if (edit) inpEl.addEventListener("input", function () { edit(inpEl.value); });
      return el("div", { style: "margin:4px 0" }, el("div", { class: "note", style: "color:" + color, text: icon + " " + label + (empty ? " — vazio" : k === "media" ? " — conferir" : "") }), inpEl);
    };
    var set = function (o, k) { return function (v) { o[k] = v; }; };
    var add = function (n) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]); };
    var box = function (t) { return el("div", { class: "box", style: "margin:8px 0" }, el("h3", { text: t })); };
    j.indicacoes = j.indicacoes || {}; j.contraindicacoes = j.contraindicacoes || {}; j.monitoramento = j.monitoramento || {}; j.orientacoes = j.orientacoes || {}; j.criterios = j.criterios || {};
    var I = j.indicacoes, C = j.contraindicacoes, M = j.monitoramento, O = j.orientacoes, R = j.criterios;
    var b0 = box("Identificação"); add(b0,row("Título", j.titulo, "alta", set(j, "titulo")), row("Resumo", j.resumo, "media", set(j, "resumo")), row("CID-10", (j.cid || []).map(function (c) { return c.codigo + " " + (c.nome || ""); }), "media", function (v) { j.cid = v.split(",").map(function (x) { x = x.trim(); var p = x.split(/\s+/); return { codigo: p[0], nome: p.slice(1).join(" ") }; }).filter(function (c) { return c.codigo; }); }),
      (j.mesh || []).length || (j.snomed || []).length ? el("div", { class: "note", text: "MeSH: " + (j.mesh || []).join(", ") + " · SNOMED CT: " + (j.snomed || []).join(", ") }) : null);
    var b1 = box("1. Indicações"); b1.append(row("Idade mínima (anos)", I.idadeMin, I.confianca, set(I, "idadeMin")), row("Idade máxima (anos)", I.idadeMax, I.confianca, set(I, "idadeMax")), row("Condições incluídas", I.inclui, I.confianca, set(I, "inclui")), row("Critérios diagnósticos", I.criteriosDiagnosticos, I.confianca, set(I, "criteriosDiagnosticos")), row("Gravidade", I.gravidade, I.confianca, set(I, "gravidade")));
    var b2 = box("2. Contraindicações"); b2.append(row("Absolutas", C.absolutas, C.confianca, set(C, "absolutas")), row("Relativas", C.relativas, C.confianca, set(C, "relativas")), row("Interações críticas", C.interacoes, C.confianca, set(C, "interacoes")), row("Populações especiais", C.populacoesEspeciais, C.confianca, set(C, "populacoesEspeciais")));
    var b3 = box("3. Esquema terapêutico");
    (j.medicamentos || []).forEach(function (m) {
      var k = conf(m.confianca), color = !m._drug ? COR.baixa : COR[k];
      var f = function (lbl, key, ph) { var x = el("input", { class: "in", type: "text", value: m[key] || "", placeholder: ph || lbl, title: lbl, style: !m[key] ? "border-color:" + COR.baixa : "" }); x.addEventListener("input", function () { m[key] = x.value; }); return el("label", { class: "f" }, el("span", { text: lbl }), x); };
      b3.appendChild(el("div", { class: "box", style: "border-left:4px solid " + color + ";margin:6px 0;padding:8px" },
        el("b", { text: m.nome }), el("span", { class: "note", text: m._drug ? " ✔ na base do app: " + D.drugs[m._drug].n + " (o app recalcula a dose pelo peso)" : " ✖ não encontrado na base — escolha o equivalente no editor" }),
        m.nomeComercial ? el("div", { class: "note", text: "Nome comercial no texto: " + m.nomeComercial }) : null,
        el("div", { class: "grid" }, f("Dose por kg", "dosePorKg"), f("Dose máxima", "doseMaxima"), f("Via", "via"), f("Frequência", "frequencia"), f("Duração", "duracao"), f("Ajuste renal/hepático", "ajusteRenalHepatico"))));
    });
    if (!(j.medicamentos || []).length) b3.appendChild(el("div", { class: "note", style: "color:" + COR.baixa, text: "✖ Nenhum medicamento identificado." }));
    var b4 = box("4. Monitoramento"); b4.append(row("Exames", (M.exames || []).map(function (x) { return x.nome + (x.quando ? " (" + x.quando + ")" : "") + (exMatch(x.nome, x.codigo) ? "" : " [sem código SIGTAP]"); }), M.confianca), row("Sinais vitais", M.sinaisVitais, M.confianca, set(M, "sinaisVitais")), row("Sinais de toxicidade", M.toxicidade, M.confianca, set(M, "toxicidade")), row("Critérios de resposta", M.resposta, M.confianca, set(M, "resposta")));
    var b5 = box("5. Orientações ao paciente/cuidador"); b5.append(row("Uso domiciliar", O.domiciliar, O.confianca, set(O, "domiciliar")), row("Sinais de alarme", O.sinaisAlarme, O.confianca, set(O, "sinaisAlarme")), row("Cuidados", O.cuidados, O.confianca, set(O, "cuidados")), row("Restrições", O.restricoes, O.confianca, set(O, "restricoes")), row("Expectativa de melhora", O.expectativa, O.confianca, set(O, "expectativa")));
    var b6 = box("6. Critérios de retorno e transição"); b6.append(row("Retorno", R.retorno, R.confianca, set(R, "retorno")), row("Internação", R.internacao, R.confianca, set(R, "internacao")), row("Alta", R.alta, R.confianca, set(R, "alta")), row("UTI", R.uti, R.confianca, set(R, "uti")));
    var b7 = box("7. Referências"); (j.referencias || []).forEach(function (r) { b7.appendChild(el("div", { class: "note", style: "border-left:4px solid " + COR[conf(r.confianca)] + ";padding-left:6px;margin:3px 0" }, r.texto + (r.evidencia ? " — " + r.evidencia : "") + " ", r.url ? el("a", { href: r.url, target: "_blank", rel: "noopener", text: "abrir" }) : null)); });
    if (!(j.referencias || []).length) b7.appendChild(el("div", { class: "note", style: "color:" + COR.baixa, text: "✖ Nenhuma referência no material." }));
    var q = encodeURIComponent((j.titulo || "") + " children");
    b7.appendChild(el("div", { class: "btns", style: "margin-top:6px" }, ["PubMed (3 anos)|https://pubmed.ncbi.nlm.nih.gov/?term=" + q + "&filter=datesearch.y_3&filter=pubt.systematicreview", "Cochrane|https://www.cochranelibrary.com/search?q=" + q, "NICE|https://www.nice.org.uk/search?q=" + encodeURIComponent(j.titulo || ""), "SBP|https://www.sbp.com.br/?s=" + encodeURIComponent(j.titulo || ""), "Alertas ANVISA|https://www.gov.br/anvisa/pt-br/search?SearchableText=" + encodeURIComponent((j.medicamentos || []).map(function (m) { return m.nome; }).slice(0, 2).join(" "))].map(function (x) { var p = x.split("|"); return el("a", { class: "btn sm ghost", href: p[1], target: "_blank", rel: "noopener", text: p[0] }); })));
    var qa = quality(j), gaps = j.lacunas || [], alerts = j.alertasSeguranca || [];
    var bq = el("div", { class: "box", style: "margin:8px 0" }, el("h3", { text: "Checagem de completude (" + qa.filter(function (x) { return x.ok; }).length + "/" + qa.length + ")" }),
      qa.map(function (x) { return el("div", { class: "note", style: "color:" + (x.ok ? COR.alta : COR.baixa), text: (x.ok ? "✔ " : "✖ ") + x.t + (x.ok ? "" : " — " + x.s) }); }),
      gaps.length ? el("div", null, el("b", { text: "Lacunas apontadas pela IA" }), gaps.map(function (g) { return el("div", { class: "note", text: "• " + (g.campo || "") + ": " + (g.problema || "") + (g.sugestao ? " → " + g.sugestao : "") }); })) : null,
      alerts.length ? el("div", { style: "color:" + COR.baixa }, el("b", { text: "Alertas de segurança" }), alerts.map(function (a) { return el("div", { class: "note", text: "⚠ " + a }); })) : null);
    add(s.b, el("div", { class: "note", style: "background:var(--warn-soft,#fbefd9);padding:8px;border-radius:8px", text: "Rascunho gerado por IA a partir do seu material. Confira cada dose e referência — nada vai para a prescrição sem a sua revisão e as checagens de segurança do app." }), bq, b0, b1, b2, b3, b4, b5, b6, b7);
    s.f.append(
      btn("Abrir no editor e salvar", function () { s.dlg.close(); var c = toProt(j); window.PSX_PROT.edit(null, "pessoal", c).then(function () { var t = document.querySelector("#psxProtModal input.inp"); if (t && !t.value) t.value = j.titulo || ""; }); }, "primary"),
      btn("Card de bolso (PDF)", function () { toPocketPdf(j); }),
      btn("📊 Fluxograma (SVG/PNG)", function () { if (window.PSX_FLOW) window.PSX_FLOW.open((j.fluxo || []).filter(function (n) { return n.id && n.texto; }), j.titulo); }),
      btn("Documento (Markdown)", function () { download(slug(j) + ".md", toMarkdown(j), "text/markdown"); }),
      btn("Tabela de doses (CSV/Excel)", function () { download(slug(j) + "-doses.csv", toCsv(j), "text/csv"); }),
      btn("JSON interoperável", function () { download(slug(j) + ".json", JSON.stringify({ formato: "prescrimed.protocolo.v1", estruturado: j, protocolo: toProt(j) }, null, 2), "application/json"); }),
      btn("Voltar", function () { openAssistant(); }, "ghost"));
  }

  /* ---------- pontos de entrada ---------- */
  function inject() {
    var hero = document.querySelector("#app .hero");
    if (hero && document.getElementById("homeQ") && !hero.querySelector("[data-psx-aiprot]")) { var bar = hero.querySelector("[data-psx-home]") || hero; bar.appendChild(el("button", { class: "btn", type: "button", "data-psx-aiprot": "1", text: "✨ Criar protocolo com IA", onclick: openAssistant })); }
    var foot = document.getElementById("psxProtFoot"), m = document.getElementById("psxProtModal");
    if (m && m.open && foot && !foot.querySelector("[data-psx-aiprot]") && /Protocolos clínicos/.test((m.querySelector("#psxProtTitle") || {}).textContent || "")) foot.appendChild(el("button", { class: "btn sm", type: "button", "data-psx-aiprot": "1", text: "✨ Criar com IA", onclick: function () { m.close(); openAssistant(); } }));
  }
  var busy = false;
  new MutationObserver(function () { if (busy) return; busy = true; requestAnimationFrame(function () { try { inject(); } finally { busy = false; } }); }).observe(document.body, { childList: true, subtree: true });
  inject();
  window.PSX_PROT_AI = { open: openAssistant, preview: preview, toProt: toProt, quality: quality };
})();
