/* Relatório de Alta Médica automatizado (aditivo, após lovable-documents.js).
   Pré-preenche seções por condição (CID-10/categoria, faixa etária, contexto), agrega
   "O que foi visto hoje" dos módulos já preenchidos, detecta contextos especiais,
   destaca trechos gerados, permite edição total e exige revisão humana antes do PDF.
   Conteúdo de orientação escrito por IA: confira antes de usar (origem expansao_ia). */
(function () {
  "use strict";
  var KEY = "psx.alta", BLK = "psx.alta.blocos", VER = "psx.alta.versoes";
  function rd(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (_) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function el(t, a) { var n = document.createElement(t); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "class") n.className = a[k]; else if (k === "text") n.textContent = a[k]; else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), a[k]); else if (a[k] != null) n.setAttribute(k, a[k]); }); for (var i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(typeof arguments[i] === "string" ? document.createTextNode(arguments[i]) : arguments[i]); return n; }
  function api() { return window.PSAPP && window.PSAPP.test; }
  function C() { var a = api(); return a ? a.C() : {}; }
  function protos() { return (window.PROTO_DB && window.PROTO_DB.protocols) || []; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function now() { var d = new Date(); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function cfg() { var s = rd("psx.cfg", {}); return { estab: Object.assign({ nome: "HOSPITAL MUNICIPAL DE CABECEIRAS", cidade: "Cabeceiras-GO" }, s.estab || {}), sol: Object.assign({ nome: "", conselho: "" }, s.sol || {}) }; }

  /* ---------- Biblioteca por categoria (linguagem acessível) ---------- */
  var GERAL = {
    evitar: "Não tome remédios por conta própria além dos receitados.\nEvite bebida alcoólica enquanto estiver em tratamento.",
    cuidados: "Tome os remédios nos horários e pelo tempo indicados, mesmo que melhore antes.\nBeba bastante água, se não houver restrição.\nRepouse conforme se sentir.",
    alarme: "Febre acima de 38,5 °C que não baixa com o remédio.\nFalta de ar, dor no peito, desmaio ou confusão.\nPiora dos sintomas ou aparecimento de sintomas novos.",
    acomp: "Procure a Unidade Básica de Saúde (UBS) em até 7 dias para reavaliação.",
    info: "A maioria dos quadros como o seu melhora em poucos dias com o tratamento correto. Siga as orientações e traga esta folha no retorno."
  };
  var LIB = [
    [/respirat/i, { evitar: "Não fume e evite fumaça, poeira e perfumes fortes.\nNão use xaropes para tosse sem orientação médica.", cuidados: "Faça lavagem nasal com soro fisiológico várias vezes ao dia.\nBeba bastante líquido para soltar a secreção.\nMantenha a casa arejada.", alarme: "Falta de ar, respiração rápida ou chiado que piora.\nLábios ou unhas arroxeados.\nFebre por mais de 3 dias.", acomp: "Reavaliação na UBS em 48 a 72 horas se não houver melhora.", info: "Infecções e crises respiratórias costumam melhorar em 5 a 10 dias. A tosse pode durar um pouco mais." }],
    [/cardio|metab/i, { evitar: "Evite anti-inflamatórios (ibuprofeno, diclofenaco, nimesulida): aumentam a pressão e pioram o coração e os rins.\nEvite descongestionantes nasais.\nReduza o sal.", cuidados: "Meça a pressão e/ou glicemia e anote os valores.\nDieta com pouco sal, pouco açúcar e pouca gordura.\nCaminhe diariamente se o médico liberar.", alarme: "Dor ou aperto no peito, falta de ar, inchaço que piora.\nFraqueza de um lado do corpo, boca torta ou fala enrolada.\nPressão acima de 180/110 ou glicemia muito alta/baixa com sintomas.", acomp: "Consulta na UBS em até 7 dias; cardiologia/endocrinologia conforme encaminhamento em até 30 dias.", info: "Doenças do coração e do metabolismo são controladas com remédio diário e mudança de hábitos. Não pare os remédios por conta própria." }],
    [/gastro|procto/i, { evitar: "Evite anti-inflamatórios, álcool, café em excesso, frituras e comidas gordurosas.", cuidados: "Faça refeições leves e fracionadas.\nBeba soro de reidratação oral em pequenos goles se tiver vômitos ou diarreia.\nLave bem as mãos.", alarme: "Vômitos que não param ou sangue no vômito/fezes.\nFezes pretas.\nDor na barriga forte ou contínua.\nSinais de desidratação: boca seca, pouca urina, tontura.", acomp: "Reavaliação na UBS em 7 dias ou antes se não melhorar.", info: "A maioria dos quadros digestivos melhora em 2 a 5 dias com dieta e hidratação." }],
    [/urol|androl/i, { evitar: "Evite segurar a urina e reduza café e álcool.", cuidados: "Beba de 2 a 3 litros de água por dia, se não houver restrição.\nTome o antibiótico até o fim, se receitado.", alarme: "Febre, calafrios ou dor nas costas (lombar).\nSangue na urina ou incapacidade de urinar.\nVômitos que impedem tomar o remédio.", acomp: "Reavaliação na UBS em 7 dias; urologia conforme encaminhamento.", info: "Os sintomas urinários costumam melhorar em 48 a 72 horas de tratamento." }],
    [/pele|alergia/i, { evitar: "Evite coçar, sabonetes perfumados e o que possa ter causado a alergia.", cuidados: "Lave o local com água e sabão neutro.\nFaça o curativo conforme orientado e mantenha limpo e seco.", alarme: "Vermelhidão que se espalha, pus, febre.\nInchaço no rosto, lábios ou garganta, falta de ar.", acomp: "Retorno na UBS em 48 a 72 horas para avaliar a ferida/lesão; retirada de pontos em 7 a 10 dias, se houver.", info: "Lesões de pele melhoram aos poucos; observe diariamente." }],
    [/trauma|ortop|musculo/i, { evitar: "Evite esforço e carregar peso com a parte machucada.\nNão use anti-inflamatório por mais tempo que o receitado.", cuidados: "Gelo por 20 minutos, 3 a 4 vezes ao dia, nas primeiras 48 horas.\nMantenha o membro elevado.\nCuide da tala/gesso: não molhe e não coloque objetos dentro.", alarme: "Dedos frios, roxos, dormentes ou muito inchados.\nDor que piora muito mesmo com remédio.\nApós batida na cabeça: vômitos, sonolência, confusão ou dor de cabeça forte.", acomp: "Retorno com ortopedia ou na UBS em 7 a 10 dias.", info: "Lesões de músculos e ossos levam de dias a semanas para melhorar; respeite o repouso." }],
    [/neuro/i, { evitar: "Evite álcool, ficar sem dormir e uso excessivo de analgésicos.", cuidados: "Durma bem, alimente-se em horários regulares e anote as crises.", alarme: "Fraqueza ou formigamento de um lado do corpo, fala enrolada, boca torta.\nConvulsão.\nDor de cabeça súbita e muito forte, ou com febre e rigidez na nuca.", acomp: "Consulta na UBS em 7 dias; neurologia conforme encaminhamento.", info: "Siga o tratamento e registre os sintomas para ajudar o médico no retorno." }],
    [/mental/i, { evitar: "Evite álcool e outras drogas.\nNão misture remédios calmantes sem orientação.", cuidados: "Fique perto de pessoas de confiança.\nMantenha rotina de sono e alimentação.\nRetire de casa medicamentos em excesso e objetos perigosos.", alarme: "Pensamentos de se machucar ou de morte.\nAgitação intensa, confusão, não dormir por dias.", acomp: "Acolhimento no CAPS ou UBS em até 7 dias. CVV: ligue 188 (24 h, gratuito).", info: "Sofrimento mental tem tratamento. Pedir ajuda é um passo importante." }],
    [/obst/i, { evitar: "Não tome nenhum remédio sem orientação médica durante a gestação.\nEvite álcool e cigarro.", cuidados: "Mantenha as consultas de pré-natal.\nBeba bastante água e repouse.", alarme: "Sangramento ou perda de líquido pela vagina.\nContrações fortes e regulares, dor na barriga.\nBebê mexendo menos.\nDor de cabeça forte, visão embaçada, inchaço súbito.", acomp: "Consulta de pré-natal na UBS em até 7 dias.", info: "Siga o pré-natal e traga a caderneta da gestante em todos os atendimentos." }],
    [/gineco|ist/i, { evitar: "Evite relações sexuais até terminar o tratamento.\nNão faça duchas vaginais.", cuidados: "Use camisinha.\nO(a) parceiro(a) também deve ser avaliado(a) e tratado(a) quando indicado.", alarme: "Febre, dor forte no pé da barriga, sangramento intenso.", acomp: "Retorno na UBS em 7 a 14 dias; oferecer testes rápidos de HIV, sífilis e hepatites.", info: "Infecções genitais têm tratamento; completar o remédio evita volta dos sintomas." }],
    [/olho/i, { evitar: "Não coce os olhos e não use colírios sem receita.\nNão use lentes de contato até melhorar.", cuidados: "Lave as mãos antes e depois de aplicar o colírio.\nCompressas frias e limpeza com soro fisiológico.", alarme: "Perda ou piora da visão, dor forte no olho, sensibilidade intensa à luz.", acomp: "Oftalmologia conforme encaminhamento ou UBS em 7 dias.", info: "A maioria das irritações dos olhos melhora em poucos dias." }],
    [/ouvido|boca/i, { evitar: "Não coloque cotonete ou objetos no ouvido.\nEvite alimentos muito quentes ou ácidos se houver feridas na boca.", cuidados: "Higiene bucal cuidadosa.\nCompressa morna no local se houver dor.", alarme: "Febre alta, inchaço no rosto ou pescoço, dificuldade para engolir ou abrir a boca.\nSaída de pus ou sangue pelo ouvido.", acomp: "Reavaliação na UBS ou dentista em 7 dias.", info: "Os sintomas costumam melhorar em 2 a 3 dias de tratamento." }],
    [/infecc/i, { evitar: "Não interrompa o antibiótico antes do tempo.", cuidados: "Hidratação e repouso.\nIsolamento conforme orientação, se infecção transmissível.", alarme: "Febre persistente, manchas na pele, sangramentos, sonolência excessiva.", acomp: "Reavaliação na UBS em 48 a 72 horas.", info: "Algumas infecções exigem acompanhamento próximo nos primeiros dias." }],
    [/pediatr/i, {}]
  ];
  var PED = { alarme: "Criança muito sonolenta, mole ou difícil de acordar.\nRecusa de líquidos/mamadas, vômitos repetidos ou pouca urina (fralda seca por 6 horas).\nRespiração rápida, gemência ou costelas aparecendo ao respirar.\nConvulsão.", cuidados: "Ofereça líquidos e alimentos aos poucos e com frequência.\nDê os remédios na dose exata pelo peso, com seringa dosadora.", evitar: "Não dê AAS (aspirina) a crianças.\nNão use remédios de adulto nem xaropes caseiros sem orientação." };
  var GEST = { evitar: "Gestante: não tome remédios sem orientação médica (inclusive chás e anti-inflamatórios).", alarme: "Sangramento, perda de líquido, contrações, bebê mexendo menos, dor de cabeça forte ou visão embaçada." };

  function libFor(p) { var cat = (p && p.cat) || ""; for (var i = 0; i < LIB.length; i++) if (LIB[i][0].test(cat)) return LIB[i][1]; return {}; }
  function ageY() { var P = C().pac || {}, n = parseFloat(String(P.idade || "").replace(",", ".")); if (isNaN(n)) return null; return P.idUn === "meses" ? n / 12 : n; }
  function join() { var o = []; for (var i = 0; i < arguments.length; i++) if (arguments[i]) o.push(arguments[i]); return o.join("\n"); }

  /* ---------- Agregação "O que foi visto hoje" ---------- */
  function vistoAuto(p, ctx) {
    var c = C(), a = api(), P = c.pac || {}, L = [], y = ageY();
    var anam = c.anam && (c.anam.final || (a && a.anamText && a.anamText())); var ef = c.ef && (c.ef.final || (a && a.efText && a.efText()));
    L.push("Você foi atendido(a) em " + now() + " no " + cfg().estab.nome + ".");
    if (anam) L.push("História: " + String(anam).replace(/\s+/g, " ").slice(0, 600));
    if (P.alergias) L.push("Alergias informadas: " + P.alergias + ".");
    if (ef) L.push("Exame físico: " + String(ef).replace(/\s+/g, " ").slice(0, 500));
    var sc = Object.keys(c.scores || {}); if (sc.length) L.push("Escores: " + sc.map(function (k) { return String(c.scores[k]).split(". Conduta")[0]; }).join("; ") + ".");
    var ex = [].concat(Object.keys((c.lab && c.lab.sel) || {}), Object.keys((c.comp && c.comp.sel) || {})); if (ex.length) L.push("Exames solicitados/realizados: " + ex.length + " (ver pedidos anexos).");
    if (p) L.push("Diagnóstico provável: " + p.n + (p.cid && p.cid[0] ? " (CID " + p.cid[0][0] + ")" : "") + ".");
    var hi = a && a.hospItems ? a.hospItems() : []; if (hi.length) L.push("Tratamento no pronto-socorro: " + hi.map(function (x) { return x.text; }).join("; ") + ".");
    if (c.rx && c.rx.itens && c.rx.itens.length) L.push("Remédios para casa: " + c.rx.itens.map(function (x) { return x.med + " — " + x.pos; }).join("; ") + ".");
    if (y != null && y < 12) L.push("Paciente pediátrico" + (P.peso ? ", peso " + P.peso + " kg" : "") + (ctx.resp ? "; responsável: " + ctx.resp : "") + ".");
    if (P.gest) { var gs = rd("psx.safe", {}).gs; L.push("Gestante" + (gs ? ", idade gestacional " + gs + " semanas" : "") + ". Mantenha o pré-natal."); }
    if (ctx.politrauma) L.push("Atendimento de trauma: avaliados cabeça, pescoço, tórax, abdome, pelve, membros e pele; ver detalhes no exame físico.");
    if (ctx.retorno) L.push("Este foi um retorno/reavaliação: " + (ctx.evolucao || "comparado com o atendimento anterior") + ".");
    if (c.enc && c.enc.final) L.push("Encaminhado(a) para " + c.enc.esp + " (" + c.enc.prio + ").");
    if (ctx.paliativo) L.push("Nosso objetivo é o seu conforto e o de sua família. Estamos à disposição para conversar sobre suas dúvidas e desejos.");
    if (ctx.contra) L.push("O(a) paciente/responsável optou pela alta contra a recomendação médica, após ser informado(a) dos riscos, incluindo piora do quadro e risco de vida. Pode retornar a qualquer momento para continuar o tratamento.");
    return L.join("\n");
  }
  function fill(p, ctx) {
    var lb = libFor(p), y = ageY(), P = C().pac || {}, ped = y != null && y < 12, s = {};
    s.evitar = join(lb.evitar || GERAL.evitar, (p && p.naoUsar) ? "Não usar: " + p.naoUsar : "", ped ? PED.evitar : "", P.gest ? GEST.evitar : "");
    s.cuidados = join(lb.cuidados || GERAL.cuidados, ped ? PED.cuidados : "", ctx.paliativo ? "Priorize o conforto: alimente-se conforme aceitação, mantenha a pele limpa e mude de posição com frequência." : "");
    s.alarme = join(lb.alarme || GERAL.alarme, ped ? PED.alarme : "", P.gest ? GEST.alarme : "");
    var enc = C().enc; s.acomp = join(lb.acomp || GERAL.acomp, enc && enc.final ? "Agendar " + enc.esp + " (" + enc.prio + ")." : "");
    s.info = join(lb.info || GERAL.info, p ? "Sua condição: " + p.n + "." : "");
    s.visto = vistoAuto(p, ctx);
    return s;
  }

  var SECS = [["visto", "O que foi visto hoje"], ["evitar", "Medicamentos a evitar"], ["cuidados", "Cuidados domiciliares"], ["alarme", "Retorno imediato se..."], ["acomp", "Acompanhamento recomendado"], ["info", "Informações adicionais sobre a condição"]];
  var CRIT = ["alarme", "acomp", "visto"];

  function coherence(p) {
    var w = [], y = ageY(), P = C().pac || {};
    if (!p) return w;
    if (/pediatr/i.test(p.cat) && y != null && y >= 12) w.push("Condição pediátrica com paciente de " + Math.round(y) + " anos.");
    if (/obst/i.test(p.cat) && P.sexo === "M") w.push("Condição obstétrica em paciente do sexo masculino.");
    if (/obst/i.test(p.cat) && !P.gest) w.push("Condição obstétrica sem a marcação de gestante nos dados do paciente.");
    if (y == null) w.push("Idade não informada: as orientações pediátricas não puderam ser avaliadas.");
    return w;
  }

  /* ---------- Interface ---------- */
  function open() {
    var c = C(); if (!c.pac) return;
    var S = rd(KEY, {}), cur = protos().find(function (x) { return x.id === c.proto; });
    if (!S.cond || (cur && S.cond !== cur.id && !S.touched)) { S = { cond: cur ? cur.id : "", ctx: {}, secs: {}, gen: {} }; }
    var dlg = document.getElementById("lovableAltaModal"); if (dlg) dlg.remove();
    dlg = el("dialog", { class: "modal", id: "lovableAltaModal", "aria-labelledby": "altaTitle" });
    var body = el("div", { class: "mbody" }), foot = el("div", { class: "mfoot" }), st = el("div", { class: "status" }), warn = el("div");
    dlg.append(el("div", { class: "mhead" }, el("div", null, el("h2", { id: "altaTitle", text: "Relatório de alta médica" }), el("small", { text: "pré-preenchido pelo atendimento — edite à vontade e revise antes de liberar" })), el("button", { class: "x", type: "button", "aria-label": "Fechar", text: "×", onclick: function () { dlg.close(); } })), body, foot);
    document.body.appendChild(dlg);
    function save() { wr(KEY, S); }
    var areas = {}, reviewed = false, generated = null;
    var rv = el("input", { type: "checkbox" }), dl = el("button", { class: "btn", type: "button", text: "Baixar PDF", disabled: "" }), prev = el("div", { class: "preview" });
    function p() { return protos().find(function (x) { return x.id === S.cond; }) || null; }
    function invalidate() { reviewed = false; rv.checked = false; dl.disabled = true; generated = null; }

    var sel = el("select", { class: "sel" }, el("option", { value: "", text: "— selecione a condição —" }));
    protos().slice().sort(function (a, b) { return a.n.localeCompare(b.n); }).forEach(function (x) { sel.appendChild(el("option", { value: x.id, text: x.n + (x.cid && x.cid[0] ? " · " + x.cid[0][0] : "") })); });
    sel.value = S.cond || "";
    sel.addEventListener("change", function () { S.cond = sel.value; regen(true); });
    var ck = function (k, l) { var i = el("input", { type: "checkbox" }); i.checked = !!S.ctx[k]; i.addEventListener("change", function () { S.ctx[k] = i.checked; regen(false); }); return el("label", { class: "check" }, i, l); };
    var resp = el("input", { class: "in", placeholder: "Nome do responsável (pediátrico)" }); resp.value = S.ctx.resp || ""; resp.addEventListener("input", function () { S.ctx.resp = resp.value; save(); });
    body.append(el("div", { class: "box" }, el("h3", { text: "Condição e contexto" }), el("label", { class: "f" }, el("span", { text: "Condição / diagnóstico" }), sel),
      el("div", { class: "grid" }, ck("contra", "Alta contra recomendação médica"), ck("retorno", "Retorno / reavaliação"), ck("politrauma", "Politrauma"), ck("paliativo", "Cuidados paliativos")), resp,
      el("p", { class: "note", text: "Pediátrico (< 12 anos), gestante e encaminhamento são detectados automaticamente pelos dados do atendimento." })), warn);

    var blocks = rd(BLK, []);
    SECS.forEach(function (sx) {
      var k = sx[0], ta = el("textarea", { class: "ta", rows: k === "visto" ? 8 : 4 }), tag = el("span", { class: "badge w", text: "gerado — revisar" });
      ta.addEventListener("input", function () { S.secs[k] = ta.value; S.gen[k] = false; S.touched = true; tag.style.display = "none"; ta.style.borderLeft = ""; save(); invalidate(); checks(); });
      var bsel = el("select", { class: "sel", style: "max-width:220px" }, el("option", { value: "", text: "Inserir bloco pessoal…" }));
      function drawB() { while (bsel.options.length > 1) bsel.remove(1); blocks.forEach(function (b, i) { if (b.sec === k) bsel.appendChild(el("option", { value: i, text: b.nome })); }); }
      drawB(); bsel.addEventListener("change", function () { if (bsel.value === "") return; ta.value = (ta.value ? ta.value + "\n" : "") + blocks[+bsel.value].texto; bsel.value = ""; ta.dispatchEvent(new Event("input")); });
      var saveB = el("button", { class: "btn sm ghost", type: "button", text: "Salvar seleção como bloco", onclick: function () { var t = ta.value.substring(ta.selectionStart, ta.selectionEnd) || ta.value; if (!t.trim()) return; var n = prompt("Nome do bloco:"); if (!n) return; blocks.push({ sec: k, nome: n, texto: t }); wr(BLK, blocks); drawB(); } });
      areas[k] = { ta: ta, tag: tag };
      body.appendChild(el("div", { class: "box" }, el("h3", null, sx[1] + " ", tag), ta, el("div", { class: "btns" }, bsel, saveB)));
    });

    function paint() { SECS.forEach(function (sx) { var k = sx[0], A = areas[k]; A.ta.value = S.secs[k] || ""; var g = S.gen[k] !== false && !!S.secs[k]; A.tag.style.display = g ? "" : "none"; A.ta.style.borderLeft = g ? "4px solid var(--warn)" : ""; }); checks(); }
    function regen(all) { var f = fill(p(), S.ctx); SECS.forEach(function (sx) { var k = sx[0]; if (all || S.gen[k] !== false || !S.secs[k]) { S.secs[k] = f[k]; S.gen[k] = true; } }); save(); invalidate(); paint(); }
    function checks() {
      warn.textContent = ""; var msgs = coherence(p());
      CRIT.forEach(function (k) { if (!String(S.secs[k] || "").trim()) msgs.push("Campo crítico vazio: " + SECS.find(function (x) { return x[0] === k; })[1] + "."); });
      if (!S.cond) msgs.push("Selecione a condição para o pré-preenchimento.");
      var al = (C().pac || {}).alergias; if (al && (C().rx || {}).itens) C().rx.itens.forEach(function (it) { al.split(/[,;]/).forEach(function (a) { a = a.trim().toLowerCase(); if (a.length > 3 && String(it.med).toLowerCase().indexOf(a) >= 0) msgs.push("Atenção: " + it.med + " pode conflitar com a alergia informada (" + a + ")."); }); });
      if (msgs.length) warn.appendChild(el("div", { class: "alertbox" }, el("b", { text: "Verifique: " }), msgs.join(" ")));
    }
    if (!S.secs || !S.secs.visto) regen(true); else paint();

    function text() { return SECS.map(function (sx) { return sx[1].toUpperCase() + "\n" + (S.secs[sx[0]] || "—"); }).join("\n\n"); }
    var rvName = cfg().sol.nome || "profissional responsável";
    rv.addEventListener("change", function () { reviewed = rv.checked; dl.disabled = !(reviewed && generated); });
    function build() {
      var pr = p(), P = C().pac || {}, sections = SECS.map(function (sx) { return { h: sx[1], text: S.secs[sx[0]] }; });
      var rx = C().rx; if (rx && rx.itens && rx.itens.length) sections.splice(1, 0, { h: "Remédios para casa", list: rx.itens.map(function (x) { return x.med + " — " + x.pos; }) });
      sections.push({ h: "Revisão", text: "Revisado por " + rvName + " em " + now() + "." });
      return DocPDF.build({ title: "RELATÓRIO DE ALTA", data: now(), cfg: cfg(), pac: { nome: (P.nome || "").toUpperCase(), idade: P.idade ? P.idade + " " + (P.idUn || "anos") : "", sexo: P.sexo, peso: P.peso, cns: P.cns, leito: P.leito, alergias: P.alergias }, extraHeader: pr ? "Diagnóstico: " + pr.n + (pr.cid && pr.cid[0] ? " (CID " + pr.cid[0][0] + ")" : "") : "", sections: sections }).doc;
    }
    var gen = el("button", { class: "btn primary", type: "button", text: "Revisar e finalizar alta", title: "Ctrl+Enter", onclick: async function () {
      if (!String(S.secs.alarme || "").trim() || !String(S.secs.visto || "").trim()) { st.textContent = "Preencha 'O que foi visto hoje' e 'Retorno imediato se...'."; st.className = "status err"; return; }
      try { var doc = build(), ab = doc.output("arraybuffer"); generated = ab; prev.textContent = "";
        if (window.pdfjsLib) { var pdf = await window.pdfjsLib.getDocument({ data: ab.slice(0) }).promise, pg = await pdf.getPage(1), vp = pg.getViewport({ scale: 1.3 }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; prev.appendChild(cv); await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; }
        dl.disabled = !reviewed; st.textContent = "Confira o documento e marque a revisão."; st.className = "status ok"; prev.scrollIntoView({ behavior: "smooth" });
      } catch (e) { st.textContent = "Não consegui gerar o PDF: " + e.message; st.className = "status err"; }
    } });
    dl.addEventListener("click", function () {
      if (!(reviewed && generated)) return;
      var P = C().pac || {}, url = URL.createObjectURL(new Blob([generated], { type: "application/pdf" })), a = el("a", { href: url, download: "ALTA_" + String(P.nome || "PACIENTE").replace(/\W+/g, "_").toUpperCase() + ".pdf" });
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      var V = rd(VER, []); V.unshift({ em: now(), cond: S.cond, revisor: rvName, secs: S.secs }); wr(VER, V.slice(0, 20));
      try { window.PSX_SAFE && window.PSX_SAFE.log({ tipo: "emissao_documento", detalhe: { documento: "relatorio_alta", condicao: S.cond, contexto: S.ctx, gerado: SECS.filter(function (x) { return S.gen[x[0]] !== false; }).map(function (x) { return x[0]; }) } }); } catch (_) {}
      st.textContent = "PDF baixado e versão registrada."; st.className = "status ok";
    });
    var hist = el("button", { class: "btn ghost", type: "button", text: "Versões", onclick: function () { var V = rd(VER, []); if (!V.length) { st.textContent = "Nenhuma versão emitida ainda."; return; } var i = prompt(V.map(function (v, n) { return n + 1 + ") " + v.em + " — " + v.cond + " — " + v.revisor; }).join("\n") + "\n\nNúmero para restaurar:"); var v = V[(+i || 0) - 1]; if (v) { S.secs = Object.assign({}, v.secs); S.gen = {}; S.cond = v.cond; sel.value = v.cond; save(); invalidate(); paint(); } } });
    foot.append(
      el("button", { class: "btn", type: "button", text: "Regenerar", title: "Ctrl+Shift+R — refaz só os trechos não editados", onclick: function () { regen(false); } }),
      el("button", { class: "btn", type: "button", text: "Copiar resumo", onclick: function () { navigator.clipboard && navigator.clipboard.writeText(text()); st.textContent = "Copiado para colar no prontuário."; st.className = "status ok"; } }),
      hist, gen, dl, el("label", { class: "check review-check" }, rv, "Revisei este documento — " + rvName), st);
    body.appendChild(prev);
    dlg.addEventListener("keydown", function (e) { if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); gen.click(); } if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) { e.preventDefault(); regen(false); } });
    dlg.addEventListener("close", function () { dlg.remove(); });
    dlg.showModal();
  }

  function card() {
    /* Card fora da grade por decisão do Dr. Felipe (04/11/2026): o relatório de alta vive
       DENTRO do módulo "Evolução e resumo de alta" (injetado por lovable-modules.js).
       Atalho Ctrl+Shift+A e window.PSX_ALTA.open() permanecem. */
    return;
    var grid = document.querySelector(".mods"); if (!grid || grid.querySelector("[data-lovable-alta]")) return;
    var b = el("button", { class: "mod", type: "button", "data-lovable-alta": "true", onclick: open }), ic = el("span", { class: "ic" });
    ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>';
    b.append(ic, el("b", { text: "Relatório de alta" }), el("small", { text: rd(KEY, {}).touched ? "em edição" : "pré-preenchido pela condição" }));
    grid.appendChild(b);
  }
  new MutationObserver(card).observe(document.body, { childList: true, subtree: true });
  card();
  document.addEventListener("keydown", function (e) { if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a") && C().proto) { e.preventDefault(); open(); } });
  window.PSX_ALTA = { open: open, fill: fill };
})();
