/* Escores clínicos e calculadoras com conduta ligada ao resultado.
   HEART, ABCD2, CIWA-Ar, HINTS(+), NPH (início e ajuste), McIsaac, CURB-65/CRB-65, Ottawa (tornozelo/pé), TC de crânio canadense,
   profilaxia antitetânica (MS) e profilaxia da raiva humana pós-exposição (NT 8/2022-CGZV/MS).
   Depende de window.APP e window.APP.proto (proto.js). */
(function () {
  "use strict";
  var X = function () { return window.PSAPP; };
  var PR = {};
  ["current", "choose", "peso", "idadeM", "setScore", "markExam", "selDrug", "setPeso", "render", "gest"].forEach(function (k) { PR[k] = function () { var a = X() && X().pr; return a && a[k] ? a[k].apply(null, arguments) : null; }; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var nf = function (x, d) { return Number(x).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 1 : d }); };


  /* ---------- helpers de campos ---------- */
  var YN = [["0", "não"], ["1", "sim"]];
  function F(k, l, opts, def) { return { k: k, l: l, opts: opts, def: def == null ? opts[0][0] : def }; }
  function N(k, l, def, ph) { return { k: k, l: l, num: true, def: def == null ? "" : def, ph: ph }; }
  function sev(n, desc) { var o = []; for (var i = 0; i <= n; i++) o.push([String(i), i + (desc[i] ? " — " + desc[i] : "")]); return o; }
  function idadeAnos() { var a = PR.idadeM(); return a == null ? null : a / 12; }

  /* orientações de alta */
  function addOrient(txt) { if (X() && X().addOrient) X().addOrient(txt); }
  function goTab(t) { if (X() && X().goModule) X().goModule(t === "rx" ? "receita" : t === "img" ? "comp" : t); }

  /* ---------- definição dos escores ---------- */
  var T = {};

  T.heart = { n: "HEART (dor torácica)", f: function () {
      var a = idadeAnos();
      return [F("h", "História", [["0", "0 — pouco suspeita"], ["1", "1 — moderadamente suspeita"], ["2", "2 — altamente suspeita"]]),
        F("e", "ECG", [["0", "0 — normal"], ["1", "1 — repolarização inespecífica, BRE, HVE, marca-passo"], ["2", "2 — infra/supra de ST significativo"]]),
        F("a", "Idade", [["0", "0 — < 45 anos"], ["1", "1 — 45 a 64 anos"], ["2", "2 — ≥ 65 anos"]], a == null ? "0" : a >= 65 ? "2" : a >= 45 ? "1" : "0"),
        F("r", "Fatores de risco (HAS, DM, DLP, tabagismo, obesidade, história familiar)", [["0", "0 — nenhum"], ["1", "1 — 1 ou 2 fatores"], ["2", "2 — ≥ 3 ou aterosclerose conhecida (IAM, revascularização, AVC, DAP)"]]),
        F("t", "Troponina (inicial)", [["0", "0 — ≤ limite superior"], ["1", "1 — 1 a 3× o limite"], ["2", "2 — > 3× o limite"]])];
    }, calc: function (v) {
      var s = +v.h + +v.e + +v.a + +v.r + +v.t;
      if (s <= 3) return { s: s, cls: "ok", t: "Baixo risco (MACE em 6 semanas ≈ 1,7%)", c: "Alta possível SE troponina seriada (0 e 3 h) negativa e ECG sem isquemia. Seguimento na UBS/cardiologia; teste ergométrico ambulatorial se dúvida. Orientar retorno imediato se dor recorrer.",
        acts: [{ l: "Abrir protocolo dor torácica de baixo risco", fn: function () { PR.choose("dor-toracica-baixo-risco"); } }], o: "Dor torácica avaliada no PS com escore HEART " + s + " (baixo risco). Voltar imediatamente se a dor voltar, durar mais de 15 minutos, vier com falta de ar, suor frio, desmaio ou piorar ao esforço." };
      if (s <= 6) return { s: s, cls: "warn", t: "Risco intermediário (MACE ≈ 12–17%)", c: "NÃO liberar. Observação com troponina seriada e ECG seriado; AAS 300 mg se não houver contraindicação; regulação para estratificação (teste funcional/angio) conforme evolução." };
      return { s: s, cls: "bad", t: "Alto risco (MACE ≈ 50–65%)", c: "Tratar como síndrome coronariana aguda: AAS 300 mg, anticoagulação e antiagregação conforme protocolo de SCA, monitorização e regulação imediata para hemodinâmica." };
    }, note: "Six et al. 2008; Backus et al. 2013. Não usar para liberar se troponina única com dor < 3 h." };

  T.abcd2 = { n: "ABCD² (AIT)", f: function () {
      var a = idadeAnos();
      return [F("a", "Idade ≥ 60 anos", YN, a != null && a >= 60 ? "1" : "0"), F("b", "PA ≥ 140/90 na avaliação inicial", YN),
        F("c", "Clínica", [["0", "outros sintomas"], ["1", "distúrbio da fala sem fraqueza"], ["2", "fraqueza unilateral"]]),
        F("d", "Duração", [["0", "< 10 minutos"], ["1", "10 a 59 minutos"], ["2", "≥ 60 minutos"]]), F("e", "Diabetes", YN)];
    }, calc: function (v) {
      var s = +v.a + +v.b + +v.c + +v.d + +v.e, base = " Em QUALQUER escore: FA, estenose carotídea, AIT em crescendo, déficit persistente ou sem TC = internar/regular.";
      if (s <= 3) return { s: s, cls: "ok", t: "Baixo risco (AVC em 2 dias ≈ 1%)", c: "Com TC de crânio sem sangramento: AAS + estatina e investigação ambulatorial rápida (até 7 dias): Doppler de carótidas, ECG/Holter, ecocardiograma, glicemia e lipídios." + base,
        acts: [{ l: "Abrir protocolo AIT", fn: function () { PR.choose("ait"); } }], o: "Ataque isquêmico transitório (ABCD² " + s + "). Voltar IMEDIATAMENTE (ligar 192) se fraqueza, formigamento ou boca torta de um lado, dificuldade para falar, perda de visão ou tontura forte — anotar a hora do início." };
      if (s <= 5) return { s: s, cls: "warn", t: "Risco moderado (AVC em 2 dias ≈ 4,1%)", c: "Investigação em até 24 h: observação/internação ou regulação. Dupla antiagregação (AAS + clopidogrel por 21 dias) se TC sem sangramento." + base,
        acts: [{ l: "Abrir protocolo AIT", fn: function () { PR.choose("ait"); } }] };
      return { s: s, cls: "bad", t: "Alto risco (AVC em 2 dias ≈ 8,1%)", c: "Internar/regular para investigação imediata. Dupla antiagregação por 21 dias após TC." + base };
    }, note: "Johnston et al. 2007. Diretrizes atuais recomendam avaliação urgente de todo AIT; o escore não deve atrasar a investigação." };

  var CIWA_ITENS = [
    ["n", "Náusea / vômitos", 7, { 0: "ausente", 1: "náusea leve sem vômito", 4: "náusea intermitente com ânsia", 7: "náusea constante, vômitos frequentes" }],
    ["t", "Tremor (braços estendidos)", 7, { 0: "ausente", 1: "só palpável", 4: "moderado com braços estendidos", 7: "grave mesmo em repouso" }],
    ["s", "Sudorese paroxística", 7, { 0: "ausente", 1: "palmas úmidas", 4: "gotas na fronte", 7: "sudorese profusa" }],
    ["a", "Ansiedade", 7, { 0: "calmo", 1: "levemente ansioso", 4: "moderadamente ansioso / guardado", 7: "pânico agudo" }],
    ["g", "Agitação", 7, { 0: "atividade normal", 1: "um pouco mais que o normal", 4: "inquieto, mexe-se muito", 7: "anda de um lado a outro, debate-se" }],
    ["tt", "Distúrbios táteis (coceira, formigamento, insetos)", 7, { 0: "nenhum", 1: "muito leves", 4: "alucinações moderadas", 7: "alucinações contínuas" }],
    ["au", "Distúrbios auditivos (sons, vozes)", 7, { 0: "nenhum", 1: "muito leves", 4: "alucinações moderadas", 7: "alucinações contínuas" }],
    ["v", "Distúrbios visuais (luz, cores, vultos)", 7, { 0: "nenhum", 1: "sensibilidade muito leve", 4: "alucinações moderadas", 7: "alucinações contínuas" }],
    ["c", "Cefaleia / cabeça pesada", 7, { 0: "ausente", 1: "muito leve", 4: "moderada", 7: "extremamente intensa" }],
    ["o", "Orientação", 4, { 0: "orientado, faz somas seriadas", 1: "não faz somas ou incerto da data", 2: "erra a data por ≤ 2 dias", 3: "erra a data por > 2 dias", 4: "desorientado no lugar ou pessoa" }]];
  T.ciwa = { n: "CIWA-Ar (abstinência alcoólica)", f: function () { return CIWA_ITENS.map(function (x) { return F(x[0], x[1], sev(x[2], x[3])); }); },
    calc: function (v) {
      var s = CIWA_ITENS.reduce(function (t, x) { return t + +v[x[0]]; }, 0);
      if (s < 10) return { s: s, cls: "ok", t: "Abstinência mínima/leve (< 10)", c: "Sem benzodiazepínico de rotina. Tiamina 300 mg/dia. Alta possível com acompanhante, sem convulsão/delirium prévio e sem comorbidade grave; reavaliar se piora. Encaminhar ao CAPS AD.",
        acts: [{ l: "Abrir protocolo abstinência alcoólica", fn: function () { PR.choose("abstinencia-alcool"); } }], o: "Abstinência alcoólica leve (CIWA-Ar " + s + "). Voltar imediatamente se tremor forte, confusão, ver ou ouvir coisas que não existem, convulsão, febre ou vômitos que não param." };
      if (s < 19) return { s: s, cls: "warn", t: "Abstinência moderada (10–18)", c: "Benzodiazepínico (diazepam 10–20 mg VO) com reaplicação do CIWA a cada 1 hora; tiamina IM/EV antes de glicose. Observação/internação — liberar só se CIWA cair abaixo de 10 e houver suporte." };
      return { s: s, cls: "bad", t: "Abstinência grave (≥ 19)", c: "Internar: alto risco de convulsão e delirium tremens. Diazepam EV escalonado, tiamina EV, hidratação, correção de K/Mg/glicose, monitorização." };
    }, note: "Sullivan et al. 1989. Pontuação máxima 67. Não aplicável se o paciente não consegue relatar sintomas." };

  T.hints = { n: "HINTS+ (vertigem aguda)", f: function () {
      return [F("sva", "Síndrome vestibular aguda CONTÍNUA (vertigem constante há horas/dias, com nistagmo agora)?", [["1", "sim — aplicar HINTS"], ["0", "não — episódica/posicional"]]),
        F("hi", "Impulso cefálico (head impulse)", [["p", "ANORMAL: sacada corretiva (periférico)"], ["c", "NORMAL: sem sacada (central)"]]),
        F("ny", "Nistagmo", [["p", "unidirecional horizontal, bate para um lado (periférico)"], ["c", "muda de direção no olhar lateral, vertical ou torcional puro (central)"]]),
        F("sk", "Teste de skew (cover test)", [["p", "sem desvio vertical (periférico)"], ["c", "desvio vertical/realinhamento (central)"]]),
        F("au", "Perda auditiva nova unilateral (HINTS+)", [["p", "não"], ["c", "sim"]]),
        F("ma", "Marcha / tronco", [["p", "anda com apoio ou sozinho"], ["c", "não fica sentado ou de pé sem apoio (ataxia de tronco)"]])];
    }, calc: function (v) {
      if (v.sva === "0") return { s: "—", cls: "warn", t: "HINTS não se aplica", c: "Vertigem episódica desencadeada pela posição: fazer Dix-Hallpike (VPPB de canal posterior: nistagmo torcional para cima, latência e fadiga) e tratar com manobra de Epley. Tontura sem vertigem: investigar causas cardiovasculares, metabólicas e medicamentosas.",
        acts: [{ l: "Abrir protocolo vertigem periférica", fn: function () { PR.choose("vertigem"); } }] };
      var cen = ["hi", "ny", "sk", "au", "ma"].filter(function (k) { return v[k] === "c"; });
      if (!cen.length) return { s: "Periférico", cls: "ok", t: "Padrão periférico (neurite vestibular provável)", c: "Supressor vestibular por no máximo 3 dias, antiemético, reabilitação vestibular precoce. Considerar corticoide em neurite com < 72 h. Reavaliar em 48–72 h.",
        acts: [{ l: "Abrir protocolo vertigem periférica", fn: function () { PR.choose("vertigem"); } }], o: "Vertigem de origem periférica (HINTS periférico). Voltar imediatamente se dor de cabeça forte, visão dupla, fala enrolada, fraqueza ou dormência, dificuldade para andar ou engolir." };
      return { s: "Central", cls: "bad", t: "Sinal central presente: " + cen.length + " (INFARCT)", c: "AVC de circulação posterior até prova em contrário. TC normal NÃO exclui (RM com difusão). Regulação imediata — o HMC não tem RM nem trombólise; se < 4,5 h do início, vaga zero." };
    }, note: "Kattah et al. 2009; Newman-Toker et al. 2013. Sensibilidade depende do treino do examinador; não usar em vertigem episódica ou sem nistagmo." };

  T.nph = { n: "Insulina NPH — dose inicial", f: function () {
      return [N("peso", "Peso (kg)", PR.peso() || "", "kg"), F("ukg", "UI/kg/dia", [["0.1", "0,1 — idoso, DRC, magro, risco de hipoglicemia"], ["0.15", "0,15 — padrão"], ["0.2", "0,2 — obeso, glicemia muito alta / HbA1c > 10%"]]),
        F("esq", "Esquema", [["noite", "dose única às 22 h"], ["2x", "2/3 antes do café + 1/3 às 22 h"]])];
    }, calc: function (v) {
      var w = parseFloat(String(v.peso).replace(",", ".")); if (!(w > 20 && w < 300)) return { s: "—", cls: "warn", t: "Informe o peso", c: "Peso entre 20 e 300 kg." };
      var tot = Math.max(4, Math.round(w * +v.ukg)), txt;
      if (v.esq === "2x") { var m = Math.round(tot * 2 / 3); txt = m + " UI antes do café + " + (tot - m) + " UI às 22 h"; } else txt = tot + " UI às 22 h";
      return { s: tot + " UI/dia", cls: tot > 30 && v.esq !== "2x" ? "warn" : "ok", t: txt, c: "Titulação: glicemia de jejum > 130 por 3 dias → +2 UI (> 180 → +4 UI); < 80 ou hipoglicemia → −4 UI (ou −10%). Manter metformina se não houver contraindicação; suspender sulfonilureia se dose noturna alta. Reavaliar na UBS em 7 dias." + (tot > 30 && v.esq !== "2x" ? " Dose > 30 UI: considere dividir em 2 aplicações." : ""),
        acts: [{ l: "Usar esta dose na receita", fn: function () { PR.setPeso(w); PR.selDrug("insulina_nph", { ukg: +v.ukg, esq: v.esq, on: true }); if (!PR.current()) PR.choose("hiperglicemia"); else PR.render(); goTab("rx"); } }],
        o: "Insulina NPH: " + txt + ". Medir a glicemia em jejum todos os dias e anotar. Se glicemia abaixo de 70 ou tremor/suor frio/confusão: tomar 1 colher de sopa de açúcar em meio copo de água e medir de novo em 15 minutos." };
    }, note: "Dose inicial 0,1–0,2 UI/kg/dia (SBD/ADA). Usa o peso do painel do paciente quando informado." };

  T.nphaj = { n: "Insulina NPH — ajuste", f: function () {
      return [N("dose", "Dose total atual (UI/dia)", ""), F("esq", "Esquema atual", [["noite", "só às 22 h"], ["2x", "manhã + 22 h"]]),
        N("dm", "Dose da manhã (se 2 aplicações)", ""), N("gj", "Média da glicemia de JEJUM (últimos 3 dias)", ""), N("gpj", "Média da glicemia ANTES DO JANTAR (se 2 aplicações)", ""), F("hip", "Hipoglicemia (< 70 ou sintomas) no período", YN)];
    }, calc: function (v) {
      var dose = +v.dose, gj = +v.gj; if (!(dose > 0) || !(gj > 0)) return { s: "—", cls: "warn", t: "Informe a dose e a glicemia de jejum", c: "" };
      var dm = v.esq === "2x" ? (+v.dm || Math.round(dose * 2 / 3)) : 0, dn = dose - dm, gpj = +v.gpj, why = [];
      function aj(g, d) { if (v.hip === "1" || g < 80) return Math.max(0, Math.min(d - 4, Math.round(d * 0.9))); if (g > 180) return d + 4; if (g > 130) return d + 2; return d; }
      var ndn = aj(gj, dn); why.push("jejum " + gj + " → dose das 22 h " + dn + " → " + ndn + " UI");
      var ndm = dm; if (v.esq === "2x" && gpj > 0) { ndm = aj(gpj, dm); why.push("pré-jantar " + gpj + " → dose da manhã " + dm + " → " + ndm + " UI"); }
      if (v.hip === "1") why.push("hipoglicemia: redução de 10% ou 4 UI (o que for maior)");
      var nt = ndm + ndn, cls = v.hip === "1" ? "warn" : nt === dose ? "ok" : "ok";
      var txt = v.esq === "2x" ? ndm + " UI antes do café + " + ndn + " UI às 22 h" : ndn + " UI às 22 h";
      return { s: nt + " UI/dia", cls: cls, t: "Nova dose: " + txt, c: why.join("; ") + "." + (nt > 0.7 * (PR.peso() || 999) ? " Dose > 0,5–0,7 UI/kg sem controle: considerar insulina prandial (encaminhar)." : "") + (v.hip === "1" ? " Investigar causa da hipoglicemia (refeição, exercício, função renal, sulfonilureia)." : ""),
        o: "Insulina NPH ajustada: " + txt + ". Continuar medindo a glicemia em jejum e levar as anotações à UBS." };
    }, note: "Titulação por glicemia de jejum (meta 80–130 mg/dL), ajuste a cada 3 dias." };

  T.mcisaac = { n: "Centor/McIsaac (faringite)", f: function () {
      var a = idadeAnos();
      return [F("f", "Temperatura > 38 °C", YN), F("t", "Ausência de tosse", YN), F("l", "Linfonodo cervical anterior doloroso/aumentado", YN), F("e", "Edema ou exsudato amigdaliano", YN),
        F("i", "Idade", [["1", "3 a 14 anos (+1)"], ["0", "15 a 44 anos (0)"], ["-1", "≥ 45 anos (−1)"]], a == null ? "0" : a < 15 ? "1" : a < 45 ? "0" : "-1")];
    }, calc: function (v) {
      var s = +v.f + +v.t + +v.l + +v.e + +v.i;
      if (s <= 1) return { s: s, cls: "ok", t: "Baixo (estreptococo ≈ 1–10%)", c: "Sem teste e sem antibiótico: sintomáticos.", acts: [{ l: "Abrir protocolo faringite", fn: function () { PR.choose("faringite"); } }] };
      if (s <= 3) return { s: s, cls: "warn", t: "Intermediário (≈ 11–35%)", c: "Teste rápido/cultura se disponível e tratar se positivo; sem teste, decidir pelo contexto (preferir não tratar com escore 2).", acts: [{ l: "Abrir protocolo faringite", fn: function () { PR.choose("faringite"); } }] };
      return { s: s, cls: "bad", t: "Alto (≈ 51–53%)", c: "Tratar empiricamente (penicilina benzatina ou amoxicilina 10 dias) se não houver teste rápido.", acts: [{ l: "Abrir protocolo faringite", fn: function () { PR.choose("faringite"); } }] };
    }, note: "McIsaac et al. 1998. Abaixo de 3 anos, faringite estreptocócica é rara." };

  T.curb = { n: "CURB-65 / CRB-65 (pneumonia)", f: function () {
      var a = idadeAnos();
      return [F("c", "Confusão mental nova", YN), F("u", "Ureia > 50 mg/dL (deixe 'sem exame' para CRB-65)", [["0", "não"], ["1", "sim"], ["x", "sem exame"]], "x"), F("r", "FR ≥ 30 irpm", YN), F("b", "PAS < 90 ou PAD ≤ 60 mmHg", YN), F("a", "Idade ≥ 65 anos", YN, a != null && a >= 65 ? "1" : "0")];
    }, calc: function (v) {
      var crb = v.u === "x", s = +v.c + (crb ? 0 : +v.u) + +v.r + +v.b + +v.a, nome = crb ? "CRB-65" : "CURB-65";
      var low = crb ? s === 0 : s <= 1, mid = crb ? s <= 2 : s === 2;
      if (low) return { s: nome + " " + s, cls: "ok", t: "Baixo risco (mortalidade < 3%)", c: "Tratamento ambulatorial se SpO₂ ≥ 92%, sem comorbidade descompensada, aceita VO e tem suporte. Reavaliar em 48–72 h.", acts: [{ l: "Abrir protocolo pneumonia", fn: function () { PR.choose("pac"); } }], o: "Pneumonia de tratamento em casa. Voltar se falta de ar, febre que não cede após 72 h de antibiótico, confusão, lábios roxos ou não conseguir tomar o remédio." };
      if (mid) return { s: nome + " " + s, cls: "warn", t: "Risco intermediário (≈ 9%)", c: "Considerar internação ou observação curta com antibiótico; avaliar SpO₂, gasometria e radiografia." };
      return { s: nome + " " + s, cls: "bad", t: "Alto risco (15–40%)", c: "Internar; 4–5 pontos: avaliar critérios de UTI (regulação). Antibiótico na primeira hora." };
    }, note: "Lim et al. 2003 (BTS). Ureia > 50 mg/dL ≈ BUN > 19 mg/dL (≈ 7 mmol/L). SpO₂ < 92% indica internação independentemente do escore." };

  T.ottawa = { n: "Ottawa (tornozelo e pé)", f: function () {
      return [F("zt", "Dor na região maleolar", YN), F("ml", "Dor óssea na borda posterior ou ponta do maléolo LATERAL (6 cm distais)", YN), F("mm", "Dor óssea na borda posterior ou ponta do maléolo MEDIAL (6 cm distais)", YN),
        F("zp", "Dor no mediopé", YN), F("m5", "Dor óssea na base do 5º metatarso", YN), F("na", "Dor óssea no navicular", YN), F("ca", "Incapaz de dar 4 passos (logo após o trauma e no PS)", YN)];
    }, calc: function (v) {
      var tor = v.zt === "1" && (v.ml === "1" || v.mm === "1" || v.ca === "1"), pe = v.zp === "1" && (v.m5 === "1" || v.na === "1" || v.ca === "1"), acts = [];
      if (tor) acts.push({ l: "Marcar RX de tornozelo no pedido", fn: function () { PR.markExam("0204060087"); goTab("img"); } });
      if (pe) acts.push({ l: "Marcar RX de pé no pedido", fn: function () { PR.markExam("0204060150"); goTab("img"); } });
      if (!tor && !pe) return { s: "RX não indicado", cls: "ok", t: "Fratura muito improvável (sensibilidade ≈ 98%)", c: "Tratar como entorse: proteção, gelo, compressão, elevação, analgesia e carga conforme tolerância. Reavaliar em 5–7 dias se não melhorar.", acts: [{ l: "Abrir protocolo entorse", fn: function () { PR.choose("entorse"); } }], o: "Entorse sem indicação de radiografia (regras de Ottawa). Voltar se não conseguir apoiar o pé após 5 dias, dor que piora, pé frio, roxo ou dormente." };
      return { s: "RX indicado", cls: "warn", t: (tor ? "Tornozelo" : "") + (tor && pe ? " e " : "") + (pe ? "pé" : ""), c: "Radiografia no PS se disponível; se não, imobilizar e solicitar.", acts: acts };
    }, note: "Stiell et al. 1992. Validado em ≥ 18 anos (versão pediátrica a partir de 5 anos). Não aplicar em intoxicados, déficit sensitivo ou politrauma." };

  T.ccthr = { n: "TC de crânio canadense (TCE leve)", f: function () {
      return [F("inc", "Critérios: ECG 13–15 + perda de consciência, amnésia ou desorientação testemunhada; ≥ 16 anos", [["1", "sim — regra aplicável"], ["0", "não"]]),
        F("ex", "Exclusões: anticoagulante/coagulopatia, convulsão pós-trauma, déficit focal, trauma penetrante", [["0", "nenhuma"], ["1", "presente → TC sempre"]]),
        F("g", "ECG < 15 duas horas após o trauma", YN), F("fx", "Suspeita de fratura aberta ou com afundamento", YN), F("bs", "Sinal de fratura de base (hemotímpano, olhos de guaxinim, rinorreia/otorreia, Battle)", YN),
        F("vo", "≥ 2 episódios de vômito", YN), F("id", "Idade ≥ 65 anos", YN, (idadeAnos() || 0) >= 65 ? "1" : "0"), F("am", "Amnésia retrógrada ≥ 30 minutos", YN),
        F("me", "Mecanismo perigoso (atropelamento, ejetado de veículo, queda > 1 m ou 5 degraus)", YN)];
    }, calc: function (v) {
      var reg = " TC de urgência é feita por REGULAÇÃO (NIR), não por APAC ambulatorial.";
      if (v.ex === "1") return { s: "TC indicada", cls: "bad", t: "Exclusão presente", c: "Anticoagulado, convulsão, déficit focal ou trauma penetrante: TC de crânio sempre." + reg };
      if (v.inc === "0") return { s: "—", cls: "warn", t: "Regra não aplicável", c: "Sem perda de consciência/amnésia/desorientação: observação clínica e orientações. Menores de 16 anos: usar PECARN." };
      var alto = ["g", "fx", "bs", "vo", "id"].some(function (k) { return v[k] === "1"; }), medio = v.am === "1" || v.me === "1";
      if (alto) return { s: "TC indicada", cls: "bad", t: "Alto risco (intervenção neurocirúrgica)", c: "TC de crânio de urgência e avaliação neurocirúrgica." + reg };
      if (medio) return { s: "TC indicada", cls: "warn", t: "Risco médio (lesão na TC)", c: "TC de crânio; se indisponível, observação de 6–24 h com reavaliação neurológica seriada." + reg };
      return { s: "TC não indicada", cls: "ok", t: "Baixo risco", c: "Alta com acompanhante e orientações de TCE (24 h de observação domiciliar).", acts: [{ l: "Abrir protocolo TCE leve", fn: function () { PR.choose("tce-leve"); } }],
        o: "Trauma de cabeça leve sem indicação de tomografia. Ficar com um adulto por 24 horas. Voltar imediatamente se sonolência difícil de acordar, vômitos repetidos, dor de cabeça que piora, convulsão, confusão, fraqueza, fala enrolada, sangue ou líquido pelo nariz/ouvido." };
    }, note: "Stiell et al. 2001. Sensibilidade ≈ 100% para lesão neurocirúrgica." };

  T.tetano = { n: "Profilaxia antitetânica (MS)", f: function () {
      return [F("hv", "História vacinal (dT/DTP)", [["inc", "incerta ou < 3 doses"], ["lt5", "≥ 3 doses, última há < 5 anos"], ["5a10", "≥ 3 doses, última há 5 a 10 anos"], ["gt10", "≥ 3 doses, última há > 10 anos"]]),
        F("fe", "Ferimento", [["baixo", "baixo risco: superficial, limpo, sem corpo estranho"], ["alto", "alto risco: profundo, sujo, corpo estranho, tecido desvitalizado, mordedura, queimadura, fratura exposta"]]),
        F("esp", "Imunodeprimido, desnutrido grave ou idoso", YN), F("crianca", "Menor de 7 anos", YN, (idadeAnos() != null && idadeAnos() < 7) ? "1" : "0")];
    }, calc: function (v) {
      var vac = v.crianca === "1" ? "vacina conforme calendário (DTP/pentavalente)" : "dT 0,5 mL IM", sat = "IGHAT 250 UI IM (ou SAT 5.000 UI IM), em local diferente da vacina", vacina = false, soro = false, esquema = "";
      if (v.hv === "inc") { vacina = true; esquema = "iniciar/completar esquema de 3 doses (0, 60 e 120 dias) na UBS"; soro = v.fe === "alto"; }
      else if (v.hv === "lt5") { }
      else if (v.hv === "5a10") { if (v.fe === "alto") { vacina = true; esquema = "1 dose de reforço"; } }
      else { vacina = true; esquema = "1 dose de reforço"; if (v.fe === "alto" && v.esp === "1") soro = true; }
      var c = "Limpeza rigorosa do ferimento com soro/água e sabão, retirada de corpo estranho e tecido desvitalizado. " + (vacina ? "VACINA: " + vac + " — " + esquema + ". " : "Vacina não indicada. ") + (soro ? "IMUNOGLOBULINA: " + sat + ". " : "Soro/imunoglobulina não indicados. ") + "Antibiótico não previne tétano.";
      return { s: vacina || soro ? (vacina ? "Vacina" : "") + (vacina && soro ? " + " : "") + (soro ? "IGHAT/SAT" : "") : "Nada a aplicar", cls: soro ? "bad" : vacina ? "warn" : "ok", t: v.fe === "alto" ? "Ferimento de alto risco" : "Ferimento de baixo risco", c: c,
        o: vacina ? "Vacina antitetânica aplicada hoje (" + esquema + "). Levar o cartão de vacina à UBS" + (v.hv === "inc" ? " para completar as doses em 60 e 120 dias." : ".") : "" };
    }, note: "Guia de Vigilância em Saúde / Manual de Normas e Procedimentos para Vacinação (MS). Gestante: dTpa conforme calendário." };

  T.raiva = { n: "Profilaxia da raiva (NT 8/2022)", f: function () {
      return [F("an", "Animal agressor", [["obs", "cão ou gato passível de observação por 10 dias"], ["nobs", "cão ou gato NÃO observável (morto, desaparecido, de rua, com sinais de raiva)"], ["silv", "morcego ou mamífero silvestre (inclusive domiciliado), primata"], ["herb", "herbívoro/animal de produção (bovino, equino, caprino, ovino, suíno)"], ["roed", "roedor urbano, coelho"]]),
        F("ex", "Tipo de exposição", [["ind", "indireta: toque/lambedura em pele íntegra, contato com objetos"], ["leve", "LEVE: superficial em tronco ou membros (exceto mãos e pés); lambedura de lesão superficial"], ["grave", "GRAVE: mucosas, cabeça/face/pescoço, mãos ou pés; múltiplos, extensos ou profundos; lambedura de mucosa"]]),
        F("prev", "Profilaxia prévia", [["nao", "nenhuma"], ["pre", "pré-exposição completa"], ["pos90", "pós-exposição completa há ≤ 90 dias"], ["posmais", "pós-exposição completa há > 90 dias"]]),
        N("peso", "Peso (kg) — para soro/imunoglobulina", PR.peso() || "")];
    }, calc: function (v) {
      var w = parseFloat(String(v.peso).replace(",", ".")), vac4 = "VACINA antirrábica: 4 doses nos dias 0, 3, 7 e 14 (IM 0,5 mL no deltoide — vasto lateral em < 2 anos — ou ID 0,1 mL em 2 locais).";
      var soroTxt = "SORO/IMUNOGLOBULINA: IGHAR 20 UI/kg" + (w ? " = " + Math.round(20 * w) + " UI" : "") + " ou SAR 40 UI/kg" + (w ? " = " + Math.round(40 * w) + " UI" : "") + ", infiltrar o máximo possível nas lesões e o restante IM; até 7 dias após a 1ª dose da vacina.";
      var base = "Lavar imediatamente com água corrente e sabão, abundantemente. Evitar suturar (aproximar se necessário, após infiltração do soro). Avaliar profilaxia antitetânica. Notificar no SINAN (atendimento antirrábico) e acionar a vigilância.";
      var r;
      if (v.ex === "ind" || v.an === "roed") r = { s: "Sem profilaxia", cls: "ok", t: v.an === "roed" ? "Roedor urbano/coelho: risco desprezível" : "Exposição indireta", c: "Não indicar profilaxia. Lavar o local." };
      else if (v.an === "obs") r = { s: "Observar 10 dias", cls: "warn", t: "Cão/gato observável — " + v.ex, c: "NÃO iniciar profilaxia: observar o animal por 10 dias. Se o animal morrer, desaparecer ou adoecer: " + (v.ex === "grave" ? "vacina 4 doses + soro/imunoglobulina." : "vacina 4 doses.") + " " + base,
        o: "Mordida/arranhão por cão ou gato: o animal deve ser observado por 10 dias. Se ele morrer, sumir ou mudar de comportamento, voltar IMEDIATAMENTE para iniciar a vacina. Lavar a ferida com água e sabão." };
      else {
        var soro = v.ex === "grave" || v.an === "silv";
        r = { s: soro ? "Vacina + soro" : "Vacina", cls: soro ? "bad" : "warn", t: (v.an === "silv" ? "Silvestre/morcego: sempre grave" : v.ex === "grave" ? "Exposição grave" : "Exposição leve"), c: vac4 + (soro ? " " + soroTxt : "") + (v.an === "herb" && !soro ? " Herbívoro: confirmar com a vigilância — alguns protocolos indicam soro também na exposição leve." : "") + " " + base,
          o: "Iniciada vacina contra raiva hoje. Voltar à unidade nos dias 3, 7 e 14 para completar as doses — não pode faltar." };
      }
      if (r.s !== "Sem profilaxia" && v.prev !== "nao" && v.an !== "obs") {
        if (v.prev === "pos90") r = { s: "Sem nova profilaxia", cls: "ok", t: "Pós-exposição completa há ≤ 90 dias", c: "Não repetir profilaxia (esquema completo recente). " + base };
        else r = { s: "Vacina D0 e D3", cls: "warn", t: v.prev === "pre" ? "Pré-exposição prévia" : "Pós-exposição há > 90 dias", c: "VACINA nos dias 0 e 3. NÃO indicar soro/imunoglobulina. " + base, o: "Vacina contra raiva hoje e no dia 3." };
      }
      return r;
    }, note: "Nota Técnica nº 8/2022-CGZV/DEIDT/SVS/MS. Imunodeprimidos: esquema e sorologia específicos — discutir com a vigilância." };

  /* sugestões por protocolo */
  var SUG = { "dor-toracica-baixo-risco": ["heart"], "ait": ["abcd2"], "abstinencia-alcool": ["ciwa"], "vertigem": ["hints"], "hiperglicemia": ["nph", "nphaj"], "hipoglicemia": ["nphaj"],
    "faringite": ["mcisaac"], "pac": ["curb"], "anafilaxia": [], "convulsao-aguda": [], "entorse": ["ottawa"], "contusao": ["ottawa"], "tce-leve": ["ccthr"], "ferimento": ["tetano"], "mordedura": ["raiva", "tetano"], "queimadura": ["tetano"], "abscesso": ["tetano"] };
  var ORDER = ["heart", "abcd2", "ciwa", "hints", "nph", "nphaj", "mcisaac", "curb", "ottawa", "ccthr", "tetano", "raiva"];

  window.SCORES = { T: T, SUG: SUG, ORDER: ORDER };
})();
