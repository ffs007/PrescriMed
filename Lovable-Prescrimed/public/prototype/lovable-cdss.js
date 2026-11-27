/* Motor de recomendação clínica contextual (aditivo; origem expansao_ia — confira antes de usar).
   Painel lateral persistente: detecta a condição/sintomas, sugere escores validados, calcula em tempo real
   com os dados já digitados, traduz em conduta, mostra ficha técnica (população, sens/esp, VPP/VPN pela
   prevalência local, limitações, referências), compara escores do mesmo contexto e reúne calculadoras
   pediátricas. Registrar no prontuário grava de forma permanente (safety_events) com data e hora. */
(function () {
  "use strict";
  var VER = "2026.10-cdss1";
  var LS = "psx.cdss";
  var api = function () { return window.PSAPP && window.PSAPP.test; };
  var Cs = function () { var a = api(); return a && a.C(); };
  var num = function (v) { if (v === true || v === false) return v ? 1 : 0; var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : null; };
  var nf = function (n, d) { return n == null || !isFinite(n) ? "—" : Number(n).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 1 : d }); };
  var fold = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  function rd() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (_) { return {}; } }
  function wr(s) { try { localStorage.setItem(LS, JSON.stringify(s)); } catch (_) {} }
  var ST = rd(); ST.vals = ST.vals || {}; ST.prev = ST.prev || {}; ST.hist = ST.hist || []; ST.extra = ST.extra || [];
  function save() { wr(ST); }
  function el(tag, a) { var n = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") n.textContent = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return n; }
  function toast(t) { var x = el("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }

  /* ---------- dados do prontuário ---------- */
  function pt() {
    var C = Cs() || { pac: {}, ef: { sv: {} } }, P = window.PSAPP && window.PSAPP.pr, sv = (C.ef && C.ef.sv) || {}, pa = String(sv.pa || "").split(/[x\/]/);
    var s = window.PSX_SAFE && window.PSX_SAFE.state ? window.PSX_SAFE.state() : {}, a = api(), txt = "";
    try { txt = fold((a && a.anamText ? a.anamText() : "") + " " + (a && a.efText ? a.efText() : "")); } catch (_) {}
    var m = P && P.idadeM ? P.idadeM() : null;
    return { peso: P && P.peso ? P.peso() : null, meses: m, anos: m != null ? m / 12 : null, pas: num(pa[0]), pad: num(pa[1]), fc: num(sv.fc), fr: num(sv.fr), tax: num(sv.tax), spo2: num(sv.spo2), sexo: (C.pac || {}).sexo, cr: num(s.cr), alt: num(s.alt), proto: C.proto || "", txt: txt };
  }

  /* destinos de conduta (nível crescente) */
  var DEST = { alta: [1, "Alta com orientações e sinais de retorno"], obs: [2, "Observação na sala de emergência"], exame: [3, "Exame complementar obrigatório antes de decidir"], enf: [4, "Internação em enfermaria"], semi: [5, "Unidade semi-intensiva com monitorização contínua"], uti: [6, "UTI (pediátrica/adulto) — suporte avançado"] };
  var YN = [["0", "não"], ["1", "sim"]];
  function sel(opts) { return opts; }
  function sumKeys(v, ks) { return ks.reduce(function (a, k) { return a + (num(v[k]) || 0); }, 0); }
  function need(v, ks) { return ks.filter(function (k) { return v[k] == null || v[k] === ""; }); }

  /* Campo: [chave, rótulo, tipo ("n" | opções), auto (fn pt -> valor), rx (regex no texto da anamnese/exame para marcar "1")] */
  var S = [
    { id: "westley", n: "Westley (crupe)", ctx: ["crupe"], kw: /estridor|crupe|laringotraque/, age: [0, 18],
      f: [["cons", "Nível de consciência", [["0", "normal (0)"], ["5", "desorientado (5)"]]], ["cian", "Cianose", [["0", "ausente (0)"], ["4", "à agitação (4)"], ["5", "em repouso (5)"]], null, /cianos/], ["estr", "Estridor", [["0", "ausente (0)"], ["1", "à agitação (1)"], ["2", "em repouso (2)"]], null, /estridor/], ["ar", "Entrada de ar", [["0", "normal (0)"], ["1", "diminuída (1)"], ["2", "muito diminuída (2)"]]], ["ret", "Retrações", [["0", "ausentes (0)"], ["1", "leves (1)"], ["2", "moderadas (2)"], ["3", "graves (3)"]], null, /retra|tiragem/]],
      calc: function (v) { var s = sumKeys(v, ["cons", "cian", "estr", "ar", "ret"]);
        if (s >= 12) return { s: s, cls: "bad", t: "Insuficiência respiratória iminente", c: "Adrenalina inalatória + dexametasona 0,6 mg/kg; via aérea avançada por equipe experiente; transferência para UTI pediátrica.", d: "uti" };
        if (s >= 6) return { s: s, cls: "bad", t: "Crupe grave", c: "Adrenalina inalatória (L-adrenalina 0,5 mL/kg, máx. 5 mL) + dexametasona 0,6 mg/kg; observar ≥ 4 h após adrenalina (rebote); internar se recorrência.", d: "enf" };
        if (s >= 3) return { s: s, cls: "warn", t: "Crupe moderado", c: "Dexametasona 0,15–0,6 mg/kg VO; observação 2–4 h com reavaliação; adrenalina inalatória se estridor em repouso.", d: "obs" };
        return { s: s, cls: "ok", t: "Crupe leve", c: "Dexametasona 0,15 mg/kg VO dose única; alta com sinais de retorno (estridor em repouso, tiragem, cianose, sonolência).", d: "alta" }; },
      info: { desc: "Gravidade da laringotraqueobronquite (crupe) em 5 itens, 0–17 pontos.", pop: "Crianças hospitalizadas por crupe (Westley, Cotton & Brooks, Am J Dis Child 1978; n=16, ensaio de adrenalina racêmica). Amplamente usado em ensaios posteriores (Bjornson 2004).", sens: null, spec: null, perf: "Escore de gravidade, não diagnóstico; confiabilidade interobservador boa (κ ≈ 0,6–0,9).", lim: "Pouca validação como preditor de internação; subjetivo em lactentes agitados; não se aplica a epiglotite, corpo estranho ou traqueíte bacteriana.", refs: [["Westley 1978", "https://pubmed.ncbi.nlm.nih.gov/350920/"], ["Bjornson NEJM 2004", "https://www.nejm.org/doi/full/10.1056/NEJMoa040006"]], upd: "Revisão Cochrane de corticoide 2023" } },

    { id: "tal", n: "Tal modificado (sibilância/bronquiolite)", ctx: ["bronquiolite", "asma"], kw: /sibil|bronquiol|chiado/, age: [0, 3],
      f: [["fr", "FR (irpm)", "n", function (p) { return p.fr; }], ["sib", "Sibilância", [["0", "ausente (0)"], ["1", "final da expiração (1)"], ["2", "toda a expiração (2)"], ["3", "ins + expiração audível (3)"]], null, /sibil/], ["ret", "Retrações", [["0", "ausentes (0)"], ["1", "subcostal (1)"], ["2", "+ intercostal (2)"], ["3", "+ fúrcula/batimento de asa (3)"]], null, /retra|tiragem/], ["spo2", "SpO₂ (%)", "n", function (p) { return p.spo2; }]],
      calc: function (v, p) { var miss = need(v, ["fr", "spo2"]); if (miss.length) return { miss: "Preencha FR e SpO₂." };
        var m = p.meses == null ? 12 : p.meses, fr = v.fr, a = m < 6 ? [40, 55, 70] : [30, 45, 60], frP = fr <= a[0] ? 0 : fr <= a[1] ? 1 : fr <= a[2] ? 2 : 3;
        var sp = v.spo2 >= 95 ? 0 : v.spo2 >= 92 ? 1 : v.spo2 >= 90 ? 2 : 3, s = frP + sp + (num(v.sib) || 0) + (num(v.ret) || 0);
        if (s >= 9) return { s: s, cls: "bad", t: "Grave", c: "O₂ para SpO₂ ≥ 92%, monitorização contínua; avaliar CNAF/VNI; vaga em semi-intensiva ou UTI pediátrica.", d: "semi" };
        if (s >= 6) return { s: s, cls: "warn", t: "Moderado", c: "Internação em enfermaria pediátrica; O₂ se SpO₂ < 92%; hidratação/sonda se baixa aceitação; reavaliar a cada 2–4 h.", d: "enf" };
        return { s: s, cls: "ok", t: "Leve", c: "Alta com lavagem nasal, fracionar mamadas e sinais de retorno; reavaliar em 24–48 h.", d: "alta" }; },
      info: { desc: "Escore clínico 0–12 (FR por idade, sibilância, retração, SpO₂) para sibilância no lactente.", pop: "Lactentes < 2 anos com sibilância/bronquiolite (Tal et al., Pediatrics 1983; modificação com SpO₂ — Golan-Tripto 2018).", sens: null, spec: null, perf: "Boa concordância interobservador (κ 0,7) na versão modificada; correlaciona com internação.", lim: "Não substitui avaliação de apneia, desidratação ou fatores de risco (prematuridade, cardiopatia). Originalmente citado também em crupe, mas foi desenhado para sibilância.", refs: [["Tal 1983", "https://pubmed.ncbi.nlm.nih.gov/6828337/"], ["Golan-Tripto 2018", "https://pubmed.ncbi.nlm.nih.gov/29893074/"]], upd: "2018" } },

    { id: "wood", n: "Wood-Downes modificado (bronquiolite)", ctx: ["bronquiolite"], kw: /bronquiol/, age: [0, 2],
      f: [["sib", "Sibilância", [["0", "ausente (0)"], ["1", "final da expiração (1)"], ["2", "toda a expiração (2)"], ["3", "ins + expiração (3)"]], null, /sibil/], ["tir", "Tiragem", [["0", "ausente (0)"], ["1", "subcostal (1)"], ["2", "+ supraclavicular + batimento de asa (2)"], ["3", "+ intercostal + supraesternal (3)"]], null, /tiragem|retra/], ["fr", "FR (irpm)", "n", function (p) { return p.fr; }], ["fc", "FC (bpm)", "n", function (p) { return p.fc; }], ["vent", "Ventilação", [["0", "boa, simétrica (0)"], ["1", "regular, simétrica (1)"], ["2", "muito diminuída (2)"], ["3", "tórax silente (3)"]]], ["cian", "Cianose", YN, null, /cianos/]],
      calc: function (v) { if (need(v, ["fr", "fc"]).length) return { miss: "Preencha FR e FC." };
        var fr = v.fr < 30 ? 0 : v.fr <= 45 ? 1 : v.fr <= 60 ? 2 : 3, s = fr + (v.fc > 120 ? 1 : 0) + sumKeys(v, ["sib", "tir", "vent", "cian"]);
        if (s >= 8) return { s: s, cls: "bad", t: "Crise grave", c: "Monitorização contínua, O₂/CNAF; transferência para UTI pediátrica se esforço progressivo, apneia ou acidose.", d: "uti" };
        if (s >= 4) return { s: s, cls: "warn", t: "Crise moderada", c: "Internação em enfermaria pediátrica, O₂ se SpO₂ < 92%, suporte hídrico, reavaliação 4/4 h.", d: "enf" };
        return { s: s, cls: "ok", t: "Crise leve", c: "Alta com orientações (lavagem nasal, sinais de esforço, aceitação < 50%); retorno em 24–48 h.", d: "alta" }; },
      info: { desc: "Escore 0–14 de gravidade da bronquiolite (modificação de Ferrés).", pop: "Lactentes < 2 anos com bronquiolite (Wood & Downes 1972, asma; modificação Ferrés 1988 para bronquiolite — Espanha).", sens: null, spec: null, perf: "Validação limitada; uso difundido na Ibero-América.", lim: "Subjetivo; não validado como preditor de desfechos duros; considerar fatores de risco e apneia.", refs: [["Wood 1972", "https://pubmed.ncbi.nlm.nih.gov/5040095/"], ["SBP — Bronquiolite 2017", "https://www.sbp.com.br/"]], upd: "Diretriz AAP 2014 (escores não obrigatórios)" } },

    { id: "pram", n: "PRAM (exacerbação de asma)", ctx: ["asma"], kw: /asma|broncoespasm/, age: [2, 18],
      f: [["supra", "Retração supraesternal", [["0", "ausente"], ["2", "presente (2)"]]], ["esc", "Contração de escalenos", [["0", "ausente"], ["2", "presente (2)"]]], ["ar", "Entrada de ar", [["0", "normal (0)"], ["1", "diminuída nas bases (1)"], ["2", "diminuída difusa (2)"], ["3", "ausente/mínima (3)"]]], ["sib", "Sibilância", [["0", "ausente (0)"], ["1", "expiratória (1)"], ["2", "ins + expiratória (2)"], ["3", "audível sem esteto ou tórax silente (3)"]], null, /sibil/], ["spo2", "SpO₂ ar ambiente (%)", "n", function (p) { return p.spo2; }]],
      calc: function (v) { if (v.spo2 == null) return { miss: "Preencha a SpO₂." }; var s = sumKeys(v, ["supra", "esc", "ar", "sib"]) + (v.spo2 >= 95 ? 0 : v.spo2 >= 92 ? 1 : 2);
        if (s >= 8) return { s: s, cls: "bad", t: "Grave", c: "Salbutamol contínuo + ipratrópio, corticoide sistêmico, sulfato de magnésio 40–50 mg/kg; risco de internação > 80% — semi-intensiva/UTI se sem resposta.", d: "semi" };
        if (s >= 4) return { s: s, cls: "warn", t: "Moderada", c: "Salbutamol 3 doses em 1 h + ipratrópio, prednisolona 1–2 mg/kg; reavaliar em 1–4 h; internar se PRAM persistir ≥ 4.", d: "obs" };
        return { s: s, cls: "ok", t: "Leve", c: "Salbutamol inalatório; corticoide oral se necessário; alta com plano de ação e retorno em 24–72 h.", d: "alta" }; },
      info: { desc: "Escore 0–12 de gravidade da asma aguda em crianças de 2–17 anos.", pop: "217 crianças de 3–6 anos e validação em 3–17 anos em PS canadense (Chalut 2000; Ducharme J Pediatr 2008, n=1.089).", sens: 0.86, spec: 0.56, outcome: "internação (PRAM ≥ 4 após tratamento)", perf: "Responsivo à mudança; κ interobservador 0,78.", lim: "Não validado < 2 anos; SpO₂ em ar ambiente; não substitui gasometria em casos graves.", refs: [["Ducharme 2008", "https://pubmed.ncbi.nlm.nih.gov/18206686/"], ["GINA 2024", "https://ginasthma.org/reports/"]], upd: "2008 (validação); uso GINA 2024" } },

    { id: "gorelick", n: "Gorelick (desidratação)", ctx: ["geca", "nauseas"], kw: /desidrat|diarreia|vomit/, age: [0, 5],
      f: [["ap", "Aparência geral alterada", YN, null, /prostr|letarg|irritad/], ["ec", "Enchimento capilar > 2 s", YN, null, /enchimento capilar (>|lentificado|> ?2)/], ["lag", "Lágrimas ausentes", YN], ["muc", "Mucosas secas", YN, null, /mucosas? secas|desidratad/], ["olh", "Olhos encovados", YN, null, /encovad|fundos/], ["pul", "Pulso radial fraco", YN], ["fc", "FC > 150 bpm", YN, function (p) { return p.fc == null ? null : p.fc > 150 ? "1" : "0"; }], ["resp", "Respiração profunda/acidótica", YN], ["tur", "Turgor diminuído", YN, null, /turgor/], ["diu", "Diurese reduzida", YN, null, /oligur|diurese reduz/]],
      calc: function (v) { var s = sumKeys(v, ["ap", "ec", "lag", "muc", "olh", "pul", "fc", "resp", "tur", "diu"]);
        if (s >= 7) return { s: s, cls: "bad", t: "Desidratação grave (≥ 10%)", c: "Expansão SF 0,9% 20 mL/kg em 15–30 min, repetir até perfusão; glicemia e eletrólitos; internação (enfermaria; UTI se choque refratário). Use a calculadora de déficit hídrico.", d: "enf" };
        if (s >= 3) return { s: s, cls: "warn", t: "Desidratação 5–9%", c: "Plano B: SRO 50–100 mL/kg em 4 h na sala de reidratação, reavaliar; ondansetrona se vômitos; IV se falha.", d: "obs" };
        return { s: s, cls: "ok", t: "Sem desidratação significativa (< 5%)", c: "Plano A: SRO após cada evacuação, zinco, dieta habitual; alta com sinais de retorno.", d: "alta" }; },
      info: { desc: "10 sinais clínicos (escala de 10 itens) para estimar desidratação em crianças pequenas.", pop: "186 crianças de 1 mês a 5 anos em PS dos EUA, déficit confirmado por peso pós-reidratação (Gorelick, Pediatrics 1997).", sens: 0.87, spec: 0.82, outcome: "desidratação ≥ 5% com ≥ 3 sinais", perf: "≥ 7 sinais: sens. 0,82 / esp. 0,83 para ≥ 10%.", lim: "Pior desempenho em desnutridos e hipernatremia; não aplicar > 5 anos sem cautela.", refs: [["Gorelick 1997", "https://pubmed.ncbi.nlm.nih.gov/9346998/"], ["Steiner JAMA 2004", "https://jamanetwork.com/journals/jama/fullarticle/198861"]], upd: "2004 (revisão sistemática)" } },

    { id: "pecarn", n: "PECARN (TCE leve)", ctx: ["tce-leve"], kw: /trauma craniano|tce|queda.*cabe|bateu a cabe/, age: [0, 18], cmp: "tce",
      f: [["alt", "GCS < 15, alteração mental ou fratura palpável/base de crânio", YN], ["loc", "Perda de consciência (≥ 5 s se < 2 a)", YN, null, /perda de consc/], ["vom", "Vômitos (≥ 2 a)", YN, null, /vomit/], ["mec", "Mecanismo grave (queda > 0,9 m se < 2 a / > 1,5 m; atropelamento, capotamento, objeto de alto impacto)", YN], ["cef", "Cefaleia intensa (≥ 2 a)", YN, null, /cefaleia intensa/], ["hem", "Hematoma de couro cabeludo não frontal (< 2 a)", YN], ["norm", "Não age normalmente segundo os pais (< 2 a)", YN]],
      calc: function (v, p) { var lt2 = p.anos != null && p.anos < 2;
        if (+v.alt) return { s: "alto", cls: "bad", t: lt2 ? "Alto risco (~4,4% TCE-ci)" : "Alto risco (~4,3% TCE-ci)", c: "Tomografia de crânio indicada; observação com neurochecagem até o resultado.", d: "exame" };
        var inter = lt2 ? (+v.loc || +v.mec || +v.hem || +v.norm) : (+v.loc || +v.vom || +v.mec || +v.cef);
        if (inter) return { s: "intermediário", cls: "warn", t: "Risco intermediário (~0,9%)", c: "Observação de 4–6 h vs TC conforme experiência, achados múltiplos, piora ou < 3 meses; decisão compartilhada com os pais.", d: "obs" };
        return { s: "muito baixo", cls: "ok", t: "Risco muito baixo (< 0,05%)", c: "TC não recomendada; alta com orientações de TCE e sinais de alarme.", d: "alta" }; },
      info: { desc: "Regras de decisão para TC de crânio em crianças com TCE leve (GCS 14–15) em até 24 h.", pop: "42.412 crianças < 18 anos em 25 PS norte-americanos (Kuppermann, Lancet 2009); validação externa Babl 2017 (n=20.137).", sens: 1.0, spec: 0.537, outcome: "TCE clinicamente importante (< 2 anos; IC95% sens 86–100%)", perf: "≥ 2 anos: sens 96,8% (IC 89–99,6), esp 58,2%; VPN 99,95%.", lim: "Não se aplica a trauma penetrante, coagulopatia, shunt, doença neurológica prévia, suspeita de maus-tratos ou TCE > 24 h.", refs: [["Kuppermann Lancet 2009", "https://pubmed.ncbi.nlm.nih.gov/19758692/"], ["Babl Lancet 2017", "https://pubmed.ncbi.nlm.nih.gov/28410802/"]], upd: "2017 (validação externa)" } },

    { id: "cchr", n: "Canadian CT Head Rule", ctx: ["tce-leve"], kw: /trauma craniano|tce/, age: [16, 120], cmp: "tce",
      f: [["g2", "GCS < 15 duas horas após o trauma", YN], ["fx", "Suspeita de fratura aberta ou com afundamento", YN], ["base", "Sinal de fratura de base (hemotímpano, olhos de guaxinim, Battle, otoliquorreia)", YN], ["vom", "≥ 2 episódios de vômito", YN], ["id", "Idade ≥ 65 anos", YN, function (p) { return p.anos == null ? null : p.anos >= 65 ? "1" : "0"; }], ["amn", "Amnésia retrógrada ≥ 30 min", YN], ["mec", "Mecanismo perigoso", YN]],
      calc: function (v) { if (+v.g2 || +v.fx || +v.base || +v.vom || +v.id) return { s: "alto", cls: "bad", t: "Alto risco de intervenção neurocirúrgica", c: "TC de crânio obrigatória.", d: "exame" };
        if (+v.amn || +v.mec) return { s: "médio", cls: "warn", t: "Risco médio (lesão em TC)", c: "TC de crânio recomendada.", d: "exame" };
        return { s: "baixo", cls: "ok", t: "Sem critério", c: "TC dispensável; alta com acompanhante e orientações de alarme.", d: "alta" }; },
      info: { desc: "TC em adultos com TCE leve (GCS 13–15 com perda de consciência, amnésia ou desorientação).", pop: "3.121 adultos ≥ 16 anos em 10 PS canadenses (Stiell, Lancet 2001); validação Stiell JAMA 2005.", sens: 1.0, spec: 0.687, outcome: "necessidade de intervenção neurocirúrgica", perf: "Lesão clinicamente importante: sens 98,4%, esp 49,6%.", lim: "Excluídos < 16 anos, anticoagulados, convulsão pós-trauma, GCS < 13, gestantes.", refs: [["Stiell Lancet 2001", "https://pubmed.ncbi.nlm.nih.gov/11356436/"], ["Stiell JAMA 2005", "https://pubmed.ncbi.nlm.nih.gov/16186558/"]], upd: "2005" } },

    { id: "qsofa_a", n: "qSOFA (adulto)", ctx: ["pielonefrite", "pac", "celulite", "abscesso", "febre-dor", "dengue", "exp-diverticulite", "exp-lepto"], kw: /sepse|septic|choque|infec/, age: [18, 120], cmp: "sepse",
      f: [["fr", "FR (irpm)", "n", function (p) { return p.fr; }], ["pas", "PAS (mmHg)", "n", function (p) { return p.pas; }], ["cons", "Alteração do nível de consciência", YN, null, /confus|sonolen|rebaix/]],
      calc: function (v) { if (need(v, ["fr", "pas"]).length) return { miss: "Preencha FR e PAS." }; var s = (v.fr >= 22 ? 1 : 0) + (v.pas <= 100 ? 1 : 0) + (+v.cons || 0);
        return s >= 2 ? { s: s, cls: "bad", t: "Alto risco (mortalidade ~3–14×)", c: "Pacote da 1ª hora: lactato, hemoculturas, antimicrobiano, 30 mL/kg cristaloide se hipotensão ou lactato ≥ 4; avaliar UTI.", d: "semi" } : { s: s, cls: s ? "warn" : "ok", t: "qSOFA < 2", c: "Não exclui sepse — calcular NEWS2/SOFA e lactato; reavaliar.", d: s ? "obs" : "alta" }; },
      info: { desc: "Três critérios à beira-leito para risco de desfecho ruim em suspeita de infecção.", pop: "148.907 encontros com suspeita de infecção fora da UTI (Seymour, JAMA 2016).", sens: 0.51, spec: 0.83, outcome: "mortalidade intra-hospitalar (qSOFA ≥ 2; metanálise Fernando 2018)", perf: "AUROC 0,81 fora da UTI.", lim: "Baixa sensibilidade — SSC 2021 recomenda NÃO usar isoladamente como triagem.", refs: [["Seymour JAMA 2016", "https://pubmed.ncbi.nlm.nih.gov/26903335/"], ["SSC 2021", "https://pubmed.ncbi.nlm.nih.gov/34599691/"]], upd: "2021" } },

    { id: "qsofa_p", n: "qSOFA pediátrico (ajustado por idade)", ctx: ["pielonefrite", "pac", "celulite", "febre-dor", "dengue", "oma", "varicela"], kw: /sepse|septic|choque|toxemi/, age: [0, 18], cmp: "sepse",
      f: [["fr", "FR (irpm)", "n", function (p) { return p.fr; }], ["pas", "PAS (mmHg)", "n", function (p) { return p.pas; }], ["cons", "Alteração mental (AVDI ≠ A)", YN, null, /sonolen|letarg|rebaix|hipoativ/], ["ec", "Enchimento capilar > 3 s", YN]],
      calc: function (v, p) { if (need(v, ["fr", "pas"]).length) return { miss: "Preencha FR e PAS." }; var m = p.meses == null ? 60 : p.meses, y = m / 12;
        var frL = m < 3 ? 60 : m < 12 ? 50 : y < 4 ? 40 : y < 6 ? 34 : y < 13 ? 30 : 20, pasL = m < 1 ? 60 : m < 12 ? 70 : y <= 10 ? 70 + 2 * Math.floor(y) : 90;
        var s = (v.fr > frL ? 1 : 0) + (v.pas < pasL ? 1 : 0) + (+v.cons || 0), hipo = v.pas < pasL;
        if (s >= 2 || (hipo && +v.ec)) return { s: s, cls: "bad", t: "Provável sepse com disfunção orgânica", c: "Acesso, lactato, hemocultura, antimicrobiano < 1 h; bolus 10–20 mL/kg com reavaliação; UTI pediátrica se choque (Phoenix ≥ 2).", d: "uti", note: "Limiares PALS: FR > " + frL + ", PAS < " + pasL };
        return { s: s, cls: s ? "warn" : "ok", t: s ? "Alerta" : "Sem critérios", c: s ? "Observação com reavaliação seriada de perfusão em 1–2 h." : "Manter vigilância; orientar sinais de alarme.", d: s ? "obs" : "alta", note: "Limiares PALS: FR > " + frL + ", PAS < " + pasL }; },
      info: { desc: "Adaptação do qSOFA com limiares de FR e PAS por faixa etária (PALS). Para definição de sepse pediátrica usar critérios de Phoenix 2024.", pop: "Coortes pediátricas de PS/UTI (Schlapbach 2018; Eun 2021, Coreia; n ≈ 2.000).", sens: 0.42, spec: 0.88, outcome: "mortalidade/admissão em UTI (variável entre coortes)", perf: "AUROC 0,6–0,75; inferior ao pSOFA/Phoenix.", lim: "Não validado como critério diagnóstico; baixa sensibilidade — não exclui sepse.", refs: [["Schlapbach 2018", "https://pubmed.ncbi.nlm.nih.gov/29453432/"], ["Phoenix JAMA 2024", "https://jamanetwork.com/journals/jama/fullarticle/2814297"]], upd: "2024 (Phoenix)" } },

    { id: "gbs", n: "Glasgow-Blatchford (HDA)", ctx: [], kw: /melena|hematemese|hemorragia digest|enterorrag/, age: [16, 120], cmp: "hda",
      f: [["ur", "Ureia (mg/dL)", "n"], ["hb", "Hemoglobina (g/dL)", "n"], ["pas", "PAS (mmHg)", "n", function (p) { return p.pas; }], ["fc", "FC ≥ 100 bpm", YN, function (p) { return p.fc == null ? null : p.fc >= 100 ? "1" : "0"; }], ["mel", "Melena", YN, null, /melena/], ["sin", "Síncope", YN, null, /sincope/], ["hep", "Hepatopatia", YN, null, /cirros|hepatopat/], ["ic", "Insuficiência cardíaca", YN]],
      calc: function (v, p) { if (need(v, ["ur", "hb", "pas"]).length) return { miss: "Preencha ureia, hemoglobina e PAS." };
        var bun = v.ur / 6.006, s = 0, F = p.sexo === "F"; s += bun >= 25 ? 6 : bun >= 10 ? 4 : bun >= 8 ? 3 : bun >= 6.5 ? 2 : 0;
        s += F ? (v.hb < 10 ? 6 : v.hb < 12 ? 1 : 0) : (v.hb < 10 ? 6 : v.hb < 12 ? 3 : v.hb < 13 ? 1 : 0); s += v.pas < 90 ? 3 : v.pas < 100 ? 2 : v.pas < 110 ? 1 : 0;
        s += (+v.fc || 0) + (+v.mel || 0) + (+v.sin ? 2 : 0) + (+v.hep ? 2 : 0) + (+v.ic ? 2 : 0);
        if (s <= 1) return { s: s, cls: "ok", t: "Muito baixo risco", c: "Candidato a alta com endoscopia ambulatorial em poucos dias (ESGE/ACG).", d: "alta" };
        if (s >= 12) return { s: s, cls: "bad", t: "Alto risco de intervenção", c: "Ressuscitação, IBP EV, endoscopia em até 12–24 h (urgente se instável); semi-intensiva/UTI.", d: "semi" };
        return { s: s, cls: "warn", t: "Necessita intervenção provável", c: "Internação, IBP EV, transfusão se Hb < 7 (< 8 coronariopata), endoscopia em 24 h.", d: "enf" }; },
      info: { desc: "Pré-endoscópico: identifica HDA alta que não precisará de intervenção (transfusão, endoscopia terapêutica, cirurgia).", pop: "1.748 pacientes no Reino Unido (Blatchford, Lancet 2000); validação internacional Stanley BMJ 2017 (n=3.012).", sens: 0.99, spec: 0.08, outcome: "necessidade de intervenção/óbito com GBS ≤ 1", perf: "AUROC 0,86 para intervenção (superior a Rockall pré-endoscópico e AIMS65).", lim: "Validado em HDA alta adulta; menos útil em hemorragia baixa e em pediatria.", refs: [["Blatchford 2000", "https://pubmed.ncbi.nlm.nih.gov/11073021/"], ["Stanley BMJ 2017", "https://www.bmj.com/content/356/bmj.i6432"]], upd: "2017" } },

    { id: "rockall", n: "Rockall pré-endoscópico (HDA)", ctx: [], kw: /melena|hematemese|hemorragia digest/, age: [16, 120], cmp: "hda",
      f: [["id", "Idade", [["0", "< 60 (0)"], ["1", "60–79 (1)"], ["2", "≥ 80 (2)"]], function (p) { return p.anos == null ? null : p.anos >= 80 ? "2" : p.anos >= 60 ? "1" : "0"; }], ["ch", "Choque", [["0", "ausente (0)"], ["1", "FC > 100 (1)"], ["2", "PAS < 100 (2)"]], function (p) { return p.pas != null && p.pas < 100 ? "2" : p.fc != null && p.fc > 100 ? "1" : p.fc != null ? "0" : null; }], ["com", "Comorbidade", [["0", "nenhuma (0)"], ["2", "IC, DAC ou outra maior (2)"], ["3", "IRC, hepatopatia ou câncer metastático (3)"]]]],
      calc: function (v) { var s = sumKeys(v, ["id", "ch", "com"]); return s === 0 ? { s: s, cls: "ok", t: "Baixo risco", c: "Considerar alta precoce com endoscopia ambulatorial.", d: "alta" } : s >= 4 ? { s: s, cls: "bad", t: "Alto risco de óbito", c: "Internação monitorizada e endoscopia precoce.", d: "semi" } : { s: s, cls: "warn", t: "Risco intermediário", c: "Internação e endoscopia em 24 h.", d: "enf" }; },
      info: { desc: "Componente clínico do Rockall (0–7) para risco de óbito antes da endoscopia.", pop: "4.185 pacientes no Reino Unido (Rockall, Gut 1996).", sens: 0.93, spec: 0.22, outcome: "óbito (pré-Rockall 0)", perf: "AUROC 0,69 para intervenção (Stanley 2017).", lim: "Concebido para mortalidade; pior que GBS para decidir alta.", refs: [["Rockall 1996", "https://pubmed.ncbi.nlm.nih.gov/8675081/"]], upd: "1996 (validação 2017)" } },

    { id: "pas", n: "Pediatric Appendicitis Score (Samuel)", ctx: [], kw: /fid|fossa iliaca direita|apendic|dor abdominal/, age: [3, 18], cmp: "apend",
      f: [["tos", "Dor em FID à tosse, percussão ou saltitar", [["0", "não"], ["2", "sim (2)"]]], ["ano", "Anorexia", YN, null, /anorexia|inapeten/], ["feb", "Febre ≥ 38 °C", YN, function (p) { return p.tax == null ? null : p.tax >= 38 ? "1" : "0"; }], ["nv", "Náuseas/vômitos", YN, null, /nausea|vomit/], ["fid", "Dor à palpação em FID", [["0", "não"], ["2", "sim (2)"]], null, /dor.*fid|fossa iliaca direita/], ["leu", "Leucócitos > 10.000", YN], ["neu", "Neutrófilos > 7.500", YN], ["mig", "Migração da dor para FID", YN, null, /migra/]],
      calc: function (v) { var s = sumKeys(v, ["tos", "ano", "feb", "nv", "fid", "leu", "neu", "mig"]);
        if (s >= 7) return { s: s, cls: "bad", t: "Alta probabilidade", c: "Avaliação cirúrgica pediátrica; jejum, analgesia, hidratação; imagem conforme cirurgião.", d: "enf" };
        if (s >= 4) return { s: s, cls: "warn", t: "Probabilidade intermediária", c: "Ultrassonografia de abdome obrigatória antes da decisão; observação com reavaliação seriada.", d: "exame" };
        return { s: s, cls: "ok", t: "Baixa probabilidade", c: "Apendicite improvável; alta com reavaliação em 12–24 h se dor persistir.", d: "alta" }; },
      info: { desc: "Escore 0–10 para apendicite em crianças. Observação: não foi localizado na literatura um “Índice de Kirschner” validado para apendicite; o app usa PAS e Alvarado.", pop: "1.170 crianças de 4–15 anos com dor abdominal (Samuel, J Pediatr Surg 2002); validação Goldman 2008.", sens: 0.82, spec: 0.65, outcome: "apendicite (PAS ≥ 6; metanálise)", perf: "PAS ≤ 3 VPN ~ 98%.", lim: "Menor acurácia < 4 anos e em meninas adolescentes.", refs: [["Samuel 2002", "https://pubmed.ncbi.nlm.nih.gov/12037754/"], ["Goldman 2008", "https://pubmed.ncbi.nlm.nih.gov/18329998/"]], upd: "2008" } },

    { id: "alvarado", n: "Alvarado (MANTRELS)", ctx: [], kw: /fid|fossa iliaca direita|apendic/, age: [10, 120], cmp: "apend",
      f: [["mig", "Dor migratória para FID", YN, null, /migra/], ["ano", "Anorexia", YN, null, /anorexia/], ["nv", "Náuseas/vômitos", YN, null, /nausea|vomit/], ["dor", "Dor em FID", [["0", "não"], ["2", "sim (2)"]], null, /dor.*fid|fossa iliaca direita/], ["desc", "Descompressão brusca dolorosa", YN, null, /blumberg|descompressao/], ["feb", "T ≥ 37,3 °C", YN, function (p) { return p.tax == null ? null : p.tax >= 37.3 ? "1" : "0"; }], ["leu", "Leucocitose > 10.000", [["0", "não"], ["2", "sim (2)"]]], ["desv", "Desvio à esquerda", YN]],
      calc: function (v) { var s = sumKeys(v, ["mig", "ano", "nv", "dor", "desc", "feb", "leu", "desv"]);
        if (s >= 7) return { s: s, cls: "bad", t: "Alta probabilidade", c: "Avaliação cirúrgica; jejum e analgesia.", d: "enf" };
        if (s >= 5) return { s: s, cls: "warn", t: "Intermediária", c: "Exame de imagem obrigatório (USG/TC) e observação.", d: "exame" };
        return { s: s, cls: "ok", t: "Baixa", c: "Considerar outras causas; reavaliação se piora.", d: "alta" }; },
      info: { desc: "Escore 0–10 para apendicite aguda.", pop: "305 pacientes com dor abdominal (Alvarado, Ann Emerg Med 1986).", sens: 0.99, spec: 0.43, outcome: "apendicite com escore ≥ 5 (Ohle BMC Med 2011)", perf: "Bom para excluir (< 5); calibração ruim em crianças e mulheres.", lim: "Superestima em mulheres; menos preciso < 10 anos.", refs: [["Alvarado 1986", "https://pubmed.ncbi.nlm.nih.gov/3963537/"], ["Ohle 2011", "https://pubmed.ncbi.nlm.nih.gov/22204638/"]], upd: "2011" } },

    { id: "pim3", n: "PIM3 (mortalidade na UTI pediátrica)", ctx: [], kw: /uti|intuba|choque/, age: [0, 16], uti: true, cmp: "uti",
      f: [["pup", "Pupilas fixas > 3 mm", YN], ["ele", "Admissão eletiva", YN], ["vm", "Ventilação mecânica na 1ª hora", YN], ["pas", "PAS (mmHg)", "n", function (p) { return p.pas; }], ["be", "Base excess (mmol/L)", "n"], ["fio2", "FiO₂ (0,21–1)", "n"], ["pao2", "PaO₂ (mmHg)", "n"], ["proc", "Recuperação de procedimento", [["0", "não"], ["by", "cirurgia cardíaca com CEC"], ["nb", "cirurgia cardíaca sem CEC"], ["nc", "procedimento não cardíaco"]]], ["dx", "Diagnóstico de risco", [["0", "nenhum"], ["mh", "muito alto (PCR pré-UTI, imunodeficiência grave, leucemia/linfoma 1ª indução, transplante de medula, falência hepática)"], ["h", "alto (hemorragia cerebral espontânea, cardiomiopatia/miocardite, hipoplasia de VE, doença neurodegenerativa, ECN)"], ["l", "baixo (asma, bronquiolite, crupe, apneia obstrutiva, CAD, convulsão)"]]]],
      calc: function (v) { if (v.pas == null) return { miss: "Preencha ao menos a PAS (BE e PaO₂ zeram se ausentes)." };
        var fio = v.fio2 != null ? (v.fio2 > 1 ? v.fio2 / 100 : v.fio2) : null, pf = fio && v.pao2 ? 100 * fio / v.pao2 : 0.23;
        var x = 3.8233 * (+v.pup || 0) - 0.5378 * (+v.ele || 0) + 0.9763 * (+v.vm || 0) + 0.0671 * Math.abs(v.pas - 120) + 0.4321 * Math.abs(v.be || 0) + 0.4214 * pf
          + (v.proc === "by" ? -1.2246 : v.proc === "nb" ? -0.8762 : v.proc === "nc" ? -1.5164 : 0) + (v.dx === "mh" ? 1.6225 : v.dx === "h" ? 1.0725 : v.dx === "l" ? -2.1766 : 0) - 1.7928;
        var r = Math.exp(x) / (1 + Math.exp(x)), pct = r * 100;
        return { s: nf(pct, 1) + "%", cls: pct >= 15 ? "bad" : pct >= 5 ? "warn" : "ok", t: "Mortalidade prevista " + nf(pct, 1) + "%", c: pct >= 5 ? "Risco elevado — suporte avançado em UTI pediátrica; documentar e discutir prognóstico com a família." : "Risco baixo; usar para benchmarking (razão de mortalidade padronizada), não para decisão individual.", d: "uti" }; },
      info: { desc: "Índice de mortalidade pediátrica 3 — dados da 1ª hora de UTI.", pop: "53.112 admissões em 60 UTIP da Austrália, Nova Zelândia, Irlanda e Reino Unido (Straney, PCCM 2013).", sens: null, spec: null, perf: "AUROC 0,88; calibrado para benchmarking.", lim: "Ferramenta de qualidade populacional — não decide conduta individual. Coeficientes do app gerados por IA: conferir com a publicação original.", refs: [["Straney 2013", "https://pubmed.ncbi.nlm.nih.gov/23863821/"]], upd: "2013" } },

    { id: "prism", n: "PRISM III (gravidade na UTI pediátrica)", ctx: [], kw: /uti|intuba|choque/, age: [0, 18], uti: true, cmp: "uti",
      f: [["pas", "PAS (mmHg)", "n", function (p) { return p.pas; }], ["fc", "FC (bpm)", "n", function (p) { return p.fc; }], ["tax", "Temperatura (°C)", "n", function (p) { return p.tax; }], ["gcs", "Glasgow < 8", YN], ["pup", "Pupilas", [["0", "reativas"], ["7", "uma fixa (7)"], ["11", "ambas fixas (11)"]]], ["ph", "pH", "n"], ["hco3", "CO₂ total/HCO₃ (mmol/L)", "n"], ["pco2", "PaCO₂ (mmHg)", "n"], ["pao2", "PaO₂ (mmHg)", "n"], ["gli", "Glicemia (mg/dL)", "n"], ["k", "Potássio (mEq/L)", "n"], ["cr", "Creatinina (mg/dL)", "n", function (p) { return p.cr; }], ["ur", "Ureia (mg/dL)", "n"], ["leu", "Leucócitos (/mm³)", "n"], ["plq", "Plaquetas (/mm³)", "n"], ["tp", "TP > 22 s ou TTPa > 57 s", YN]],
      calc: function (v, p) { if (v.pas == null || v.fc == null) return { miss: "Preencha ao menos PAS e FC." };
        var m = p.meses == null ? 60 : p.meses, g = m < 1 ? 0 : m < 12 ? 1 : m < 144 ? 2 : 3, s = 0;
        var pasL = [[40, 55], [45, 65], [55, 75], [65, 85]][g], fcL = [[215, 225], [215, 225], [185, 205], [145, 155]][g];
        s += v.pas < pasL[0] ? 7 : v.pas <= pasL[1] ? 3 : 0; s += v.fc > fcL[1] ? 4 : v.fc >= fcL[0] ? 3 : 0;
        if (v.tax != null && (v.tax < 33 || v.tax > 40)) s += 3; s += +v.gcs ? 5 : 0; s += +v.pup || 0;
        if (v.ph != null || v.hco3 != null) { var a = (v.ph != null && v.ph < 7) || (v.hco3 != null && v.hco3 < 5) ? 6 : (v.ph != null && v.ph <= 7.28) || (v.hco3 != null && v.hco3 < 17) ? 2 : 0; s += a; if (v.ph != null && v.ph > 7.55) s += 3; else if (v.ph != null && v.ph >= 7.48) s += 2; if (v.hco3 != null && v.hco3 > 34) s += 4; }
        if (v.pco2 != null) s += v.pco2 > 75 ? 3 : v.pco2 >= 50 ? 1 : 0; if (v.pao2 != null) s += v.pao2 < 42 ? 6 : v.pao2 < 50 ? 3 : 0;
        if (v.gli != null && v.gli > 200) s += 2; if (v.k != null && v.k > 6.9) s += 3;
        if (v.cr != null) { var cl = [0.85, 0.9, 0.9, 1.3][g]; if (v.cr > cl) s += 2; } if (v.ur != null) { var bun = v.ur / 2.14; if (bun > (g === 0 ? 11.9 : 14.9)) s += 3; }
        if (v.leu != null && v.leu < 3000) s += 4; if (v.plq != null) s += v.plq < 50000 ? 5 : v.plq < 100000 ? 4 : v.plq <= 200000 ? 2 : 0; s += +v.tp ? 3 : 0;
        return { s: s, cls: s >= 20 ? "bad" : s >= 10 ? "warn" : "ok", t: s >= 20 ? "Gravidade muito alta" : s >= 10 ? "Gravidade moderada" : "Gravidade baixa", c: s >= 10 ? "Manter/indicar UTI pediátrica; reavaliar em 12–24 h. A mortalidade prevista exige a equação original com tipo de admissão." : "Gravidade baixa; usar para benchmarking.", d: "uti" }; },
      info: { desc: "Pontuação fisiológica (17 variáveis, 0–74) nas primeiras 12/24 h de UTIP.", pop: "11.165 admissões em 32 UTIP dos EUA (Pollack, Crit Care Med 1996).", sens: null, spec: null, perf: "AUROC 0,94 para mortalidade (com equação completa).", lim: "Faixas e pontos do app gerados por IA — conferir com a tabela original; licenciado; não decide conduta individual.", refs: [["Pollack 1996", "https://pubmed.ncbi.nlm.nih.gov/8605803/"]], upd: "1996 (PRISM IV 2016)" } }
  ];
  var BY = {}; S.forEach(function (s) { BY[s.id] = s; });

  /* ---------- detecção do contexto ---------- */
  function hit(rx, txt) { var g = new RegExp(rx.source, "g"), m; while ((m = g.exec(txt))) { var pre = txt.slice(Math.max(0, m.index - 28), m.index); if (!/(sem|nega|negou|ausencia de|ausente|nao ha|nao|sem sinais de)[^.;,]*$/.test(pre)) return true; if (m[0].length === 0) g.lastIndex++; } return false; }
  function applicable(p) {
    var out = [], ageOk = function (s) { return p.anos == null || (p.anos >= s.age[0] && p.anos < s.age[1]); };
    S.forEach(function (s) { if (!ageOk(s)) return; var why = s.ctx.indexOf(p.proto) >= 0 ? "condição selecionada" : s.kw && hit(s.kw, p.txt) ? "sinais/sintomas registrados" : ST.extra.indexOf(s.id) >= 0 ? "adicionado por você" : null; if (why) out.push({ s: s, why: why }); });
    return out;
  }
  function values(s, p) {
    var key = s.id, saved = (ST.vals[p.proto || "_"] || {})[key] || {}, v = {}, src = {};
    s.f.forEach(function (f) { var k = f[0];
      if (saved[k] != null && saved[k] !== "") { v[k] = f[2] === "n" ? num(saved[k]) : saved[k]; src[k] = "você"; return; }
      var a = f[3] ? f[3](p) : null; if (a != null) { v[k] = f[2] === "n" ? a : String(a); src[k] = "prontuário"; return; }
      if (f[4] && hit(f[4], p.txt)) { v[k] = Array.isArray(f[2]) ? (f[2].length > 2 ? f[2][1][0] : f[2][1][0]) : 1; src[k] = "texto do atendimento"; return; }
      v[k] = f[2] === "n" ? null : (Array.isArray(f[2]) ? f[2][0][0] : null); });
    return { v: v, src: src };
  }
  function setVal(p, sid, k, val) { var b = ST.vals[p.proto || "_"] = ST.vals[p.proto || "_"] || {}; (b[sid] = b[sid] || {})[k] = val; save(); }
  function run(s, p) { var x = values(s, p); var r; try { r = s.calc(x.v, p) || {}; } catch (e) { r = { miss: "Não foi possível calcular: " + e.message }; } r.v = x.v; r.src = x.src; return r; }

  /* ---------- VPP/VPN ---------- */
  function ppvnpv(se, sp, prev) { var ppv = se * prev / (se * prev + (1 - sp) * (1 - prev)), npv = sp * (1 - prev) / (sp * (1 - prev) + (1 - se) * prev); return [ppv, npv]; }

  /* ---------- registro no prontuário ---------- */
  function register(kind, nome, texto, dados) {
    var it = { em: new Date().toISOString(), tipo: kind, nome: nome, texto: texto, proto: (pt().proto || "") };
    ST.hist.unshift(it); ST.hist = ST.hist.slice(0, 300); save();
    if (window.PSX_SAFE && window.PSX_SAFE.log) window.PSX_SAFE.log({ tipo: kind === "escore" ? "registro_escore" : "registro_calculo", dominio: "cdss", medicamento: null, motivo: nome + ": " + texto, fonte: "Motor de recomendação v" + VER, contexto: { dados: dados || null } });
    toast("Registrado no prontuário às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + ".");
  }

  /* ---------- estilos ---------- */
  var css = "#psxCdss{position:fixed;top:72px;right:0;bottom:12px;width:360px;max-width:92vw;z-index:40;display:flex;flex-direction:column;background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-right:0;border-radius:14px 0 0 14px;box-shadow:var(--shadow,0 6px 24px rgba(0,0,0,.12));transition:transform .2s}" +
    "#psxCdss.min{transform:translateX(calc(100% - 0px))}#psxCdssTab{position:fixed;right:0;top:45%;z-index:41;writing-mode:vertical-rl;transform:rotate(180deg);background:var(--accent,#0a6);color:var(--accent-ink,#fff);border:0;border-radius:0 10px 10px 0;padding:12px 7px;font:600 12px var(--f-body,system-ui);cursor:pointer;box-shadow:var(--shadow)}" +
    "#psxCdssTab .bd{display:inline-block;margin-top:6px;padding:3px 5px;border-radius:9px;background:var(--surface,#fff);color:var(--ink,#111)}#psxCdssTab .bd.bad{background:var(--bad,#c00);color:#fff}#psxCdssTab .bd.warn{background:var(--warn,#c80);color:#fff}" +
    "#psxCdss .hd{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid var(--line,#ddd)}#psxCdss .hd b{flex:1;font-family:var(--f-display,inherit)}#psxCdss .tabs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid var(--line,#ddd);flex-wrap:wrap}" +
    "#psxCdss .tabs button{border:1px solid var(--line,#ddd);background:var(--soft,#f5f5f5);border-radius:99px;padding:3px 9px;font-size:12px;cursor:pointer}#psxCdss .tabs button.on{background:var(--accent-soft,#e6f5ee);border-color:var(--accent,#0a6);color:var(--accent,#0a6);font-weight:600}" +
    "#psxCdss .bdy{overflow:auto;padding:10px 12px;flex:1;font-size:13px}#psxCdss .sc{border:1px solid var(--line,#ddd);border-radius:10px;margin-bottom:8px;overflow:hidden}#psxCdss .sc>summary{list-style:none;cursor:pointer;padding:8px 10px;display:flex;gap:8px;align-items:center}" +
    "#psxCdss .pill{margin-left:auto;font:600 12px var(--f-mono,monospace);padding:2px 7px;border-radius:99px;background:var(--soft,#eee);white-space:nowrap}#psxCdss .pill.ok{background:var(--accent-soft,#e6f5ee);color:var(--ok,#070)}#psxCdss .pill.warn{background:var(--warn-soft,#fff3d6);color:var(--warn,#a60)}#psxCdss .pill.bad{background:var(--bad-soft,#fde2e2);color:var(--bad,#b00)}" +
    "#psxCdss .in2{padding:0 10px 10px}#psxCdss .fg{display:grid;grid-template-columns:1fr;gap:6px;margin:6px 0}#psxCdss label.r{display:flex;flex-direction:column;gap:2px;font-size:12px}#psxCdss label.r small{color:var(--muted,#777)}#psxCdss input,#psxCdss select{width:100%;padding:5px 7px;border:1px solid var(--line,#ccc);border-radius:7px;font:inherit;background:var(--surface,#fff)}" +
    "#psxCdss .res{border-radius:8px;padding:8px;margin:6px 0;background:var(--soft,#f5f5f5)}#psxCdss .res.bad{background:var(--bad-soft,#fde2e2)}#psxCdss .res.warn{background:var(--warn-soft,#fff3d6)}#psxCdss .res.ok{background:var(--accent-soft,#e6f5ee)}#psxCdss .why,#psxCdss .mut{color:var(--muted,#777);font-size:11px}" +
    "#psxCdss .act{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}#psxCdss .act button,.psxCd button.b{}#psxCdss button[disabled]{opacity:.45;cursor:not-allowed}#psxCdss .dummy{border:1px solid var(--line,#ccc);background:var(--surface,#fff);border-radius:7px;padding:4px 9px;font-size:12px;cursor:pointer}#psxCdss .act button.p{background:var(--accent,#0a6);color:var(--accent-ink,#fff);border-color:var(--accent,#0a6)}" +
    "#psxCdss table{width:100%;border-collapse:collapse;font-size:12px}#psxCdss td,#psxCdss th{border-bottom:1px solid var(--line,#eee);padding:4px;text-align:left;vertical-align:top}#psxCdss .warnx{color:var(--bad,#b00);font-weight:600;font-size:12px;margin:4px 0}" +
    "@media (min-width:1100px){body.psx-cdss-open #app{margin-right:360px}}@media (max-width:700px){#psxCdss{top:auto;height:70vh;width:100vw;max-width:100vw;border-radius:14px 14px 0 0;bottom:0}#psxCdss.min{transform:translateY(100%)}#psxCdssTab{top:auto;bottom:84px}}";
  document.head.appendChild(el("style", { text: css }));

  /* ---------- painel ---------- */
  var panel, tab, body, cur = ST.tab || "sug", lastSig = "";
  function build() {
    if (panel) return;
    tab = el("button", { id: "psxCdssTab", type: "button", "aria-label": "Abrir escores e recomendações", onclick: function () { toggle(true); } }, "Escores · conduta");
    panel = el("aside", { id: "psxCdss", class: "min", "aria-label": "Escores e recomendações" },
      el("div", { class: "hd" }, el("b", { text: "Escores e recomendações" }), el("span", { class: "mut", text: "v" + VER }), el("button", { type: "button", class: "x", "aria-label": "Recolher painel", text: "→", onclick: function () { toggle(false); }, style: "border:0;background:none;font-size:18px;cursor:pointer" })),
      el("div", { class: "tabs" }, [["sug", "Sugeridos"], ["cmp", "Comparar"], ["calc", "Calculadoras"], ["card", "Cartão de parada"], ["hist", "Registros"], ["all", "Todos"]].map(function (t) { return el("button", { type: "button", "data-t": t[0], text: t[1], onclick: function () { cur = t[0]; ST.tab = cur; save(); render(true); } }); })),
      body = el("div", { class: "bdy" }),
      el("div", { class: "mut", style: "padding:6px 12px;border-top:1px solid var(--line,#ddd)", text: "Apoio à decisão gerado por IA e regras publicadas — confira antes de usar. A decisão é sempre do médico." }));
    document.body.append(panel, tab);
    toggle(!!ST.open, true);
  }
  function toggle(o, quiet) { ST.open = o; save(); panel.classList.toggle("min", !o); tab.style.display = o ? "none" : ""; document.body.classList.toggle("psx-cdss-open", o); if (!quiet) render(true); }

  function fieldInput(s, f, r, p, rerun) {
    var k = f[0], val = r.v[k], inp;
    if (Array.isArray(f[2])) { inp = el("select", null, f[2].map(function (o) { var op = el("option", { value: o[0], text: o[1] }); if (String(val) === o[0]) op.selected = true; return op; })); inp.addEventListener("change", function () { setVal(p, s.id, k, inp.value); rerun(); }); }
    else { inp = el("input", { inputmode: "decimal", value: val == null ? "" : String(Math.round(val * 100) / 100).replace(".", ",") }); inp.addEventListener("change", function () { setVal(p, s.id, k, inp.value); rerun(); }); }
    return el("label", { class: "r" }, el("span", null, f[1], r.src[k] ? el("small", { text: " · " + r.src[k] }) : null), inp);
  }
  function infoBox(s) {
    var I = s.info, d = el("details", null, el("summary", { class: "mut", style: "cursor:pointer", text: "Ficha técnica e referências" })), b = el("div", { style: "font-size:12px;margin-top:4px" });
    b.append(el("p", null, el("b", { text: "Finalidade: " }), I.desc), el("p", null, el("b", { text: "População de validação: " }), I.pop), el("p", null, el("b", { text: "Desempenho: " }), I.perf || ""));
    if (I.sens != null) {
      var prevIn = el("input", { inputmode: "decimal", value: String(ST.prev[s.id] != null ? ST.prev[s.id] : 10).replace(".", ","), style: "width:70px" }), o = el("div");
      var upd = function () { var pr = (num(prevIn.value) || 0) / 100; if (pr <= 0 || pr >= 1) { o.textContent = "Prevalência entre 0 e 100%."; return; } ST.prev[s.id] = pr * 100; save(); var x = ppvnpv(I.sens, I.spec, pr); o.textContent = "VPP " + nf(x[0] * 100, 1) + "% · VPN " + nf(x[1] * 100, 2) + "%"; };
      prevIn.addEventListener("input", upd);
      b.append(el("p", null, el("b", { text: "Sensibilidade " + nf(I.sens * 100, 1) + "% · especificidade " + nf(I.spec * 100, 1) + "%" }), " para " + (I.outcome || "o desfecho")), el("div", { style: "display:flex;gap:6px;align-items:center" }, "Prevalência local estimada (%):", prevIn), o); upd();
    } else b.append(el("p", { class: "mut", text: "Escore de gravidade/prognóstico — sensibilidade e especificidade não se aplicam como teste diagnóstico." }));
    b.append(el("p", null, el("b", { text: "Limitações: " }), I.lim), el("p", null, el("b", { text: "Referências: " }), I.refs.map(function (x, i) { return el("span", null, i ? " · " : "", el("a", { href: x[1], target: "_blank", rel: "noopener", text: x[0] })); })), el("p", { class: "mut", text: "Última atualização/revalidação: " + I.upd }));
    d.appendChild(b); return d;
  }
  function scoreCard(item, p, openIt) {
    var s = item.s, det = el("details", { class: "sc" }); if (openIt) det.open = true; var pill = el("span", { class: "pill" }), sum = el("summary", null, el("b", { text: s.n }), pill), inner = el("div", { class: "in2" });
    det.append(sum, inner);
    function rerun() { var r = run(s, p); inner.textContent = ""; pill.className = "pill " + (r.cls || ""); pill.textContent = r.miss ? "dados" : r.s;
      inner.appendChild(el("div", { class: "why", text: "Por que aparece: " + item.why }));
      var fg = el("div", { class: "fg" }); s.f.forEach(function (f) { fg.appendChild(fieldInput(s, f, r, p, rerun)); }); inner.appendChild(fg);
      if (r.miss) inner.appendChild(el("div", { class: "res", text: r.miss }));
      else { var txt = s.n + ": " + r.s + " — " + r.t + ". Conduta sugerida: " + r.c;
        inner.appendChild(el("div", { class: "res " + r.cls }, el("b", { text: r.t }), el("div", { text: r.c }), r.d ? el("div", { class: "mut", text: "Destino sugerido: " + DEST[r.d][1] }) : null, r.note ? el("div", { class: "mut", text: r.note }) : null));
        inner.appendChild(el("div", { class: "act" }, el("button", { type: "button", class: "p", text: "Registrar no prontuário", onclick: function () { register("escore", s.n, r.s + " — " + r.t + ". " + r.c, r.v); } }), el("button", { type: "button", text: "Incluir nas orientações", onclick: function () { if (window.PSAPP && window.PSAPP.addOrient) window.PSAPP.addOrient(txt); toast("Incluído nas orientações."); } }), el("button", { type: "button", text: "Copiar", onclick: function () { try { navigator.clipboard.writeText(txt); toast("Copiado."); } catch (_) {} } }))); }
      inner.appendChild(infoBox(s));
      item.r = r; badge(); }
    rerun(); item.rerun = rerun; return det;
  }
  var items = [];
  function badge() { if (!tab) return; var worst = 0, n = 0, cls = ""; items.forEach(function (i) { if (!i.r || i.r.miss) return; n++; var w = i.r.cls === "bad" ? 3 : i.r.cls === "warn" ? 2 : 1; if (w > worst) { worst = w; cls = i.r.cls; } }); var b = tab.querySelector(".bd"); if (!b) { b = el("span", { class: "bd" }); tab.appendChild(b); } b.className = "bd " + cls; b.textContent = items.length ? String(items.length) : "0"; tab.title = n + " escore(s) calculado(s)"; }

  function render(force) {
    if (!panel) return; var p = pt(); panel.querySelectorAll(".tabs button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === cur); });
    var app = applicable(p);
    if (app.some(function (i) { var r = run(i.s, p); return r.d === "uti" && !i.s.uti; }) || /uti/.test(p.txt)) ["pim3", "prism"].forEach(function (id) { if (!app.some(function (x) { return x.s.id === id; }) && (p.anos == null || p.anos < 16)) app.push({ s: BY[id], why: "gravidade alta em outro escore" }); });
    items = app; if (!ST.open && !force) { badge(); return; }
    body.textContent = "";
    if (cur === "sug") {
      if (!app.length) body.appendChild(el("div", { class: "res", text: "Nenhum escore específico detectado para o quadro atual. Escolha uma condição, registre sinais/sintomas na anamnese ou adicione um escore em “Todos”." }));
      else body.appendChild(el("div", { class: "mut", style: "margin-bottom:6px", text: app.length + " escore(s) aplicável(is) — recalculados conforme você preenche o atendimento." }));
      app.forEach(function (i, n) { body.appendChild(scoreCard(i, p, n === 0)); });
    } else if (cur === "all") {
      body.appendChild(el("div", { class: "mut", style: "margin-bottom:6px", text: "Marque para manter o escore no painel mesmo sem detecção automática." }));
      S.forEach(function (s) { var cb = el("input", { type: "checkbox", style: "width:auto" }); cb.checked = ST.extra.indexOf(s.id) >= 0; cb.addEventListener("change", function () { ST.extra = ST.extra.filter(function (x) { return x !== s.id; }); if (cb.checked) ST.extra.push(s.id); save(); });
        body.appendChild(el("label", { style: "display:flex;gap:8px;align-items:center;padding:4px 0" }, cb, el("span", null, el("b", { text: s.n }), el("span", { class: "mut", text: " · " + s.age[0] + "–" + (s.age[1] >= 120 ? "∞" : s.age[1]) + " anos" })))); });
    } else if (cur === "cmp") compareView(p, app);
    else if (cur === "calc") calcView(p);
    else if (cur === "card") cardView(p);
    else if (cur === "hist") histView();
    badge();
  }

  function compareView(p, app) {
    var groups = {}; app.forEach(function (i) { var g = i.s.cmp || i.s.id; (groups[g] = groups[g] || []).push(i); });
    var any = false;
    Object.keys(groups).forEach(function (g) { var gs = groups[g]; if (gs.length < 2) return; any = true;
      var rows = gs.map(function (i) { return { s: i.s, r: run(i.s, p) }; }), lv = rows.filter(function (x) { return !x.r.miss && x.r.d; }).map(function (x) { return DEST[x.r.d][0]; });
      var conv = lv.length < 2 ? "Dados insuficientes para comparar" : Math.max.apply(null, lv) - Math.min.apply(null, lv) <= 1 ? "Convergentes" : "Divergentes — prevalece a conduta mais segura; reavalie os dados e o quadro clínico";
      var t = el("table", null, el("tr", null, el("th", { text: "Escore" }), el("th", { text: "Resultado" }), el("th", { text: "Destino" })), rows.map(function (x) { return el("tr", null, el("td", { text: x.s.n }), el("td", null, x.r.miss ? el("span", { class: "mut", text: x.r.miss }) : el("span", { class: "pill " + x.r.cls, text: x.r.s + " · " + x.r.t })), el("td", { text: x.r.d ? DEST[x.r.d][1] : "—" })); }));
      body.append(el("div", { class: "sc", style: "padding:8px" }, t, el("div", { class: "res " + (/Diverg/.test(conv) ? "bad" : /Converg/.test(conv) ? "ok" : ""), text: conv }), el("div", { class: "mut", text: "Preencha os dados de cada escore na aba Sugeridos." })));
    });
    if (!any) body.appendChild(el("div", { class: "res", text: "Comparação disponível quando dois escores se aplicam ao mesmo contexto: TCE (PECARN × Canadian CT Head), apendicite (PAS × Alvarado), hemorragia digestiva (Glasgow-Blatchford × Rockall), sepse e UTI (PIM3 × PRISM III)." }));
  }

  /* ---------- calculadoras ---------- */
  function cn(k, l, auto) { return [k, l, auto]; }
  var CALC = [
    { id: "bsa", n: "Superfície corporal", f: [cn("peso", "Peso (kg)", "peso"), cn("alt", "Altura (cm)", "alt")], c: function (v, p) {
        if (!v.peso || !v.alt) return { miss: 1 }; var w = v.peso, h = v.alt, r = { Mosteller: Math.sqrt(w * h / 3600), DuBois: 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725), Haycock: 0.024265 * Math.pow(w, 0.5378) * Math.pow(h, 0.3964), "Gehan-George": 0.0235 * Math.pow(w, 0.51456) * Math.pow(h, 0.42246) };
        var best = w < 15 || (p.anos != null && p.anos < 2) ? "Haycock" : p.anos != null && p.anos >= 18 ? "DuBois" : "Mosteller";
        return { rows: Object.keys(r).map(function (k) { return [k + (k === best ? " (recomendada)" : ""), nf(r[k], 2) + " m²"]; }), main: best + " " + nf(r[best], 2) + " m²", ref: "RN ~0,25 m² · 1 ano ~0,45 · 10 anos ~1,1 · adulto 1,7–1,9 m².", interp: best === "Haycock" ? "< 15 kg/lactentes: Haycock tem melhor acurácia." : best === "DuBois" ? "Adultos: DuBois/Mosteller equivalentes." : "Crianças: Mosteller é a padrão para quimioterapia e doses por m².", plaus: [w > 0 && w <= 250, h >= 30 && h <= 230] }; } },
    { id: "tfg", n: "TFG estimada pediátrica", f: [cn("cr", "Creatinina (mg/dL)", "cr"), cn("alt", "Altura (cm)", "alt"), cn("cis", "Cistatina C (mg/L) — opcional"), cn("ur", "Ureia (mg/dL) — opcional"), cn("pre", "Prematuro? (1 = sim)")], c: function (v, p) {
        if (!v.cr) return { miss: 1 }; var a = p.anos, h = v.alt, cr = v.cr, M = p.sexo !== "F", rows = [];
        if (h) { rows.push(["Schwartz bedside 2009 (0,413)", nf(0.413 * h / cr, 0)]); var k = v.pre ? 0.33 : a != null && a < 1 ? 0.45 : a != null && a >= 13 && M ? 0.7 : 0.55; rows.push(["Schwartz original (k " + String(k).replace(".", ",") + ")", nf(k * h / cr, 0)]); rows.push(["Counahan-Barratt (0,43)", nf(0.43 * h / cr, 0)]);
          if (v.cis && v.ur) { var bun = v.ur / 2.14; rows.push(["CKiD 2009 completa (cistatina + BUN)", nf(39.1 * Math.pow(h / 100 / cr, 0.516) * Math.pow(1.8 / v.cis, 0.294) * Math.pow(30 / bun, 0.169) * (M ? 1.099 : 1) * Math.pow(h / 100 / 1.4, 0.188), 0)]); } }
        if (a != null) { var Q = a >= 18 ? (M ? 0.9 : 0.7) : 0.0270 * a + 0.2329; rows.push(["Independente de altura (FAS, Pottel) — UTI", nf(107.3 / (cr / Q), 0)]); }
        var main = h ? 0.413 * h / cr : rows.length ? num(rows[rows.length - 1][1]) : null;
        return { rows: rows.map(function (r) { return [r[0], r[1] + " mL/min/1,73 m²"]; }), main: "Schwartz bedside " + nf(main, 0) + " mL/min/1,73 m²", ref: "Normal ≥ 90 (> 2 anos); RN 20–50; 1 ano ~80.", interp: main == null ? "" : main < 15 ? "Estágio 5 (< 15): falência renal." : main < 30 ? "Estágio 4: ajuste importante de doses." : main < 60 ? "Estágio 3: ajustar doses renais." : main < 90 ? "Leve redução." : "Função preservada.", plaus: [cr > 0.05 && cr < 20, !h || (h > 30 && h < 230)] }; } },
    { id: "cg", n: "Clearance de creatinina (Cockcroft-Gault)", f: [cn("peso", "Peso (kg)", "peso"), cn("cr", "Creatinina (mg/dL)", "cr"), cn("idade", "Idade (anos)", "anos")], c: function (v, p) {
        if (!v.peso || !v.cr || v.idade == null) return { miss: 1 }; var r = (140 - v.idade) * v.peso / (72 * v.cr) * (p.sexo === "F" ? 0.85 : 1);
        return { main: nf(r, 0) + " mL/min", ref: "Normal 90–140 mL/min.", interp: (v.idade < 18 ? "Atenção: Cockcroft-Gault não é validado em < 18 anos — prefira Schwartz. " : "") + (r < 30 ? "ClCr < 30: ajuste/contraindicação de vários fármacos." : r < 60 ? "ClCr 30–60: ajustar doses renais." : "Sem ajuste habitual."), plaus: [v.cr > 0.05 && v.cr < 20, v.peso > 0.3 && v.peso < 300] }; } },
    { id: "hs", n: "Necessidades basais (Holliday-Segar)", f: [cn("peso", "Peso (kg)", "peso"), cn("alt", "Altura (cm) — para método por SC", "alt"), cn("est", "Estado: 0 normal · 1 estresse/febre · 2 crítico")], c: function (v, p) {
        if (!v.peso) return { miss: 1 }; var w = v.peso, d = w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20), h = w <= 10 ? 4 * w : w <= 20 ? 40 + 2 * (w - 10) : 60 + (w - 20), a = p.anos;
        var prot = a == null ? null : a < 2 ? [2, 3] : a < 13 ? [1.5, 2] : [1.5, 1.5]; if (prot && (+v.est || 0) === 0) prot = a < 1 ? [1.5, 2.2] : a < 13 ? [0.95, 1.2] : [0.85, 1]; var rows = [["Água (Holliday-Segar)", nf(Math.min(d, 2400), 0) + " mL/dia"], ["Regra 4-2-1", nf(Math.min(h, 100), 0) + " mL/h"], ["Calorias (Holliday-Segar)", nf(Math.min(d, 2400), 0) + " kcal/dia"]];
        if (v.alt) { var sc = Math.sqrt(w * v.alt / 3600); rows.push(["Água por superfície corporal (1.500 mL/m²)", nf(1500 * sc, 0) + " mL/dia"]); }
        rows.push(["Água por peso (> 10 kg cálculo acima; RN 60–150 mL/kg)", nf(d / w, 0) + " mL/kg/dia"]); if (prot) rows.push(["Proteína (" + ((+v.est || 0) ? "doente/crítico ASPEN" : "saudável DRI") + ")", nf(prot[0] * w, 0) + "–" + nf(prot[1] * w, 0) + " g/dia"]);
        rows.push(["Sódio 2–4 mEq/kg/dia", nf(2 * w, 0) + "–" + nf(4 * w, 0) + " mEq/dia"], ["Potássio 1–2 mEq/kg/dia", nf(w, 0) + "–" + nf(2 * w, 0) + " mEq/dia"], ["Cloreto 2–4 mEq/kg/dia", nf(2 * w, 0) + "–" + nf(4 * w, 0) + " mEq/dia"], ["Cálcio 0,5–4 mEq/kg/dia (gluconato 10% ~0,46 mEq/mL)", nf(0.5 * w, 1) + "–" + nf(4 * w, 1) + " mEq/dia"], ["Magnésio 0,3–0,5 mEq/kg/dia", nf(0.3 * w, 1) + "–" + nf(0.5 * w, 1) + " mEq/dia"], ["Fósforo 0,5–2 mmol/kg/dia", nf(0.5 * w, 1) + "–" + nf(2 * w, 1) + " mmol/dia"]);
        return { rows: rows, main: nf(Math.min(h, 100), 0) + " mL/h de manutenção", ref: "Máximo habitual 2.400 mL/dia (100 mL/h). Diretriz AAP 2018: soro isotônico com glicose e potássio.", interp: "Em pacientes críticos, com SIADH, IC ou insuficiência renal, considerar restringir a 50–70%.", plaus: [w > 0.3 && w < 250] }; } },
    { id: "na", n: "Correção de sódio (hipo/hipernatremia)", f: [cn("peso", "Peso (kg)", "peso"), cn("na", "Na sérico (mEq/L)"), cn("alvo", "Variação desejada em 24 h (mEq/L) — padrão 8"), cn("inf", "Na da solução (mEq/L): 513 = NaCl 3% · 154 = SF · 77 = SF 0,45% · 0 = SG5%")], c: function (v, p) {
        if (!v.peso || !v.na) return { miss: 1 }; var age = p.anos, f = age != null && age < 18 ? 0.6 : p.sexo === "F" ? (age >= 65 ? 0.45 : 0.5) : (age >= 65 ? 0.5 : 0.6), tbw = v.peso * f, hypo = v.na < 135, inf = v.inf != null ? v.inf : hypo ? 513 : 0, alvo = Math.min(v.alvo || (hypo ? 8 : 10), hypo ? 10 : 12);
        var dPerL = (inf - v.na) / (tbw + 1), vol = Math.abs(dPerL) > 0 ? alvo / Math.abs(dPerL) * 1000 : null, rows = [["Água corporal total (fator " + String(f).replace(".", ",") + ")", nf(tbw, 1) + " L"], ["Variação esperada por litro (Adrogué-Madias)", nf(dPerL, 1) + " mEq/L"]];
        if (vol) rows.push(["Volume para corrigir " + alvo + " mEq/L em 24 h", nf(vol, 0) + " mL → " + nf(vol / 24, 1) + " mL/h"]);
        if (hypo) rows.push(["Hiponatremia sintomática grave (convulsão, coma)", "NaCl 3% " + nf(Math.min(2 * v.peso, 100), 0) + " mL em 10–20 min (2 mL/kg, máx. 100 mL), repetir até 2–3× até melhora; meta +4–6 mEq/L"]);
        else if (v.na > 145) { var def = tbw * (v.na / 140 - 1) * 1000; rows.push(["Déficit de água livre", nf(def, 0) + " mL"]); }
        return { rows: rows, main: vol ? nf(vol / 24, 1) + " mL/h por 24 h" : "—", ref: "Na normal 135–145 mEq/L.", interp: (hypo ? "Limite de segurança: ≤ 8–10 mEq/L em 24 h (≤ 8 se alto risco de desmielinização osmótica). " : v.na > 145 ? "Hipernatremia: reduzir ≤ 10–12 mEq/L em 24 h (≤ 0,5 mEq/L/h) para evitar edema cerebral. " : "Sódio normal. ") + "Dosar Na a cada 2–4 h.", plaus: [v.na >= 100 && v.na <= 190] }; } },
    { id: "k", n: "Reposição de potássio", f: [cn("peso", "Peso (kg)", "peso"), cn("k", "K sérico (mEq/L)"), cn("via", "Acesso: 0 periférico · 1 central")], c: function (v) {
        if (!v.peso || v.k == null) return { miss: 1 }; var w = v.peso, dose = Math.min(0.5 * w, 40), dmax = Math.min(1 * w, 40), conc = +v.via ? "≤ 150–200 mEq/L (central, bomba, monitor)" : "≤ 40–80 mEq/L (periférico)", rate = Math.min(0.5 * w, +v.via ? 40 : 20);
        return { rows: [["Dose IV por reposição (0,5–1 mEq/kg)", nf(dose, 1) + "–" + nf(dmax, 1) + " mEq em 1–2 h"], ["Velocidade máxima", nf(rate, 1) + " mEq/h (≤ 0,5 mEq/kg/h)"], ["Concentração máxima", conc], ["Déficit estimado (adulto, grosseiro)", v.k < 3.5 ? "~" + nf((3.5 - v.k) * 100, 0) + "–" + nf((3.5 - v.k) * 200, 0) + " mEq ao total" : "—"]], main: v.k < 2.5 ? "Hipocalemia grave" : v.k < 3.5 ? "Hipocalemia" : v.k > 5.5 ? "HIPERcalemia — não repor" : "K normal", ref: "Normal 3,5–5,0 mEq/L.", interp: v.k > 5.5 ? "Não administrar potássio; tratar hipercalemia." : "Prefira VO se K ≥ 3,0 e assintomático. Monitor cardíaco se > 0,3 mEq/kg/h. Corrigir magnésio junto.", plaus: [v.k >= 1 && v.k <= 9] }; } },
    { id: "bic", n: "Bicarbonato na acidose metabólica", f: [cn("peso", "Peso (kg)", "peso"), cn("be", "Base excess (mmol/L, negativo)"), cn("hco3", "HCO₃ atual (mmol/L)"), cn("ph", "pH")], c: function (v) {
        if (!v.peso || (v.be == null && v.hco3 == null)) return { miss: 1 }; var d1 = v.be != null ? 0.3 * v.peso * Math.abs(v.be) : null, d2 = v.hco3 != null ? 0.5 * v.peso * Math.max(0, 24 - v.hco3) : null, d = d1 != null ? d1 : d2;
        return { rows: [["Déficit (0,3 × peso × |BE|)", d1 != null ? nf(d1, 0) + " mEq" : "—"], ["Déficit ((24 − HCO₃) × 0,5 × peso)", d2 != null ? nf(d2, 0) + " mEq" : "—"], ["Repor metade em 4–8 h", nf(d / 2, 0) + " mEq = " + nf(d / 2, 0) + " mL de NaHCO₃ 8,4% (diluir 1:1 em lactentes → 4,2%)"]], main: nf(d / 2, 0) + " mEq iniciais", ref: "pH 7,35–7,45; HCO₃ 22–26; BE −2 a +2.", interp: v.ph != null && v.ph >= 7.1 ? "Com pH ≥ 7,1 o bicarbonato raramente está indicado — tratar a causa." : "Indicado sobretudo se pH < 7,1 com acidose não-orgânica, hipercalemia grave ou intoxicação por tricíclicos. Na CAD só se pH < 6,9.", plaus: [v.ph == null || (v.ph > 6.5 && v.ph < 7.8)] }; } },
    { id: "desid", n: "Déficit hídrico e plano de reidratação", f: [cn("peso", "Peso atual (kg)", "peso"), cn("pre", "Peso pré-mórbido (kg) — se conhecido"), cn("grau", "Grau clínico: 1 leve · 2 moderado · 3 grave"), cn("na", "Na sérico (mEq/L) — opcional")], c: function (v, p) {
        if (!v.peso) return { miss: 1 }; var lact = p.anos != null && p.anos < 1, pct = v.pre && v.pre > v.peso ? (v.pre - v.peso) / v.pre * 100 : [0, lact ? 5 : 3, lact ? 10 : 6, lact ? 15 : 9][+v.grau || 1], w = v.pre || v.peso, def = pct * w * 10;
        var hs = w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20), rows = [["% de desidratação", nf(pct, 1) + "% " + (v.pre ? "(por peso pré-mórbido)" : "(estimativa clínica)")], ["Déficit", nf(def, 0) + " mL"], ["Manutenção 24 h", nf(Math.min(hs, 2400), 0) + " mL"]];
        if ((+v.grau || 1) >= 3 || pct >= 10) rows.push(["Fase 1 — expansão", "SF 0,9%/Ringer 20 mL/kg = " + nf(20 * v.peso, 0) + " mL em 15–30 min; repetir até 60 mL/kg conforme perfusão"]);
        var rest = Math.max(0, def - ((+v.grau || 1) >= 3 ? 20 * v.peso : 0)), tot = rest + Math.min(hs, 2400), hyper = v.na != null && v.na > 150;
        if (pct < 10 && (+v.grau || 1) < 3) rows.push(["Plano B (TRO)", "SRO 50–100 mL/kg = " + nf(50 * v.peso, 0) + "–" + nf(100 * v.peso, 0) + " mL em 4 h"]);
        rows.push(hyper ? ["Fase 2 — hipernatremia", "déficit + manutenção em 48 h: " + nf((rest + 2 * Math.min(hs, 2400)) / 48, 0) + " mL/h (queda de Na ≤ 0,5 mEq/L/h)"] : ["Fase 2 — reposição IV", "metade em 8 h: " + nf(tot / 2 / 8, 0) + " mL/h; restante em 16 h: " + nf(tot / 2 / 16, 0) + " mL/h"]);
        return { rows: rows, main: nf(def, 0) + " mL de déficit", ref: "Leve < 5% (lactente) / < 3% (criança maior); grave ≥ 10–15%.", interp: "Reavaliar perfusão, diurese (> 1 mL/kg/h) e eletrólitos a cada fase.", plaus: [v.peso > 0.3 && v.peso < 200, !v.pre || Math.abs(v.pre - v.peso) / v.pre < 0.3] }; } },
    { id: "osm", n: "Osmolaridade e gap osmolar", f: [cn("na", "Na (mEq/L)"), cn("gli", "Glicose (mg/dL)"), cn("ur", "Ureia (mg/dL)"), cn("med", "Osmolalidade medida (mOsm/kg) — opcional"), cn("et", "Etanol (mg/dL) — opcional")], c: function (v) {
        if (!v.na || !v.gli || !v.ur) return { miss: 1 }; var calc = 2 * v.na + v.gli / 18 + v.ur / 6 + (v.et ? v.et / 3.7 : 0), gap = v.med ? v.med - calc : null, ef = 2 * v.na + v.gli / 18;
        return { rows: [["Osmolaridade calculada", nf(calc, 0) + " mOsm/L"], ["Osmolaridade efetiva (tonicidade)", nf(ef, 0) + " mOsm/L"], ["Gap osmolar", gap == null ? "informe a medida" : nf(gap, 0) + " mOsm"]], main: nf(calc, 0) + " mOsm/L", ref: "Normal 275–295; gap < 10.", interp: (gap != null && gap > 10 ? "Gap > 10: considerar metanol, etilenoglicol, isopropanol, manitol, cetoacidose/lactato. " : "") + (ef > 320 ? "Efetiva > 320: estado hiperosmolar." : ""), plaus: [v.na >= 100 && v.na <= 190, v.gli > 10 && v.gli < 3000] }; } },
    { id: "nacor", n: "Sódio corrigido pela glicemia", f: [cn("na", "Na medido (mEq/L)"), cn("gli", "Glicose (mg/dL)")], c: function (v) {
        if (!v.na || !v.gli) return { miss: 1 }; var k = (v.gli - 100) / 100, a = v.na + 1.6 * k, b = v.na + 2.4 * k;
        return { rows: [["Katz (1,6)", nf(a, 1) + " mEq/L"], ["Hillier (2,4) — preferível se glicose > 400", nf(b, 1) + " mEq/L"]], main: nf(v.gli > 400 ? b : a, 1) + " mEq/L", ref: "135–145 mEq/L.", interp: "Na corrigido em elevação durante tratamento da CAD indica risco de edema cerebral se queda brusca da osmolaridade.", plaus: [v.gli > 10 && v.gli < 3000] }; } },
    { id: "ca", n: "Cálcio corrigido pela albumina", f: [cn("ca", "Cálcio total (mg/dL)"), cn("alb", "Albumina (g/dL)")], c: function (v) {
        if (!v.ca || !v.alb) return { miss: 1 }; var c = v.ca + 0.8 * (4 - v.alb);
        return { main: nf(c, 1) + " mg/dL", ref: "Cálcio total 8,5–10,5 mg/dL; iônico 4,5–5,3 mg/dL (1,12–1,32 mmol/L).", interp: (c < 8.5 ? "Hipocalcemia corrigida. " : c > 10.5 ? "Hipercalcemia corrigida. " : "Normal. ") + "A fórmula é imprecisa em críticos, pediatria e distúrbios ácido-base — dosar cálcio iônico sempre que possível.", plaus: [v.ca > 3 && v.ca < 20, v.alb > 0.5 && v.alb < 7] }; } },
    { id: "oxi", n: "Oxigenação (P/F, IO, ISO)", f: [cn("pao2", "PaO₂ (mmHg)"), cn("spo2", "SpO₂ (%)", "spo2"), cn("fio2", "FiO₂ (21–100%)"), cn("map", "Pressão média de via aérea (cmH₂O)")], c: function (v) {
        if (!v.fio2) return { miss: 1 }; var f = v.fio2 > 1 ? v.fio2 / 100 : v.fio2, rows = [];
        if (v.pao2) rows.push(["Relação PaO₂/FiO₂", nf(v.pao2 / f, 0)]); if (v.pao2 && v.map) rows.push(["Índice de oxigenação (IO)", nf(v.map * f * 100 / v.pao2, 1)]); if (v.spo2 && v.map) rows.push(["Índice de saturação (ISO)", nf(v.map * f * 100 / v.spo2, 1) + (v.spo2 > 97 ? " — SpO₂ > 97% invalida o ISO" : "")]);
        var io = v.pao2 && v.map ? v.map * f * 100 / v.pao2 : null, iso = v.spo2 && v.map ? v.map * f * 100 / v.spo2 : null, pf = v.pao2 ? v.pao2 / f : null;
        var interp = io != null ? (io >= 16 ? "SDRA pediátrica grave (IO ≥ 16, PALICC-2): considerar posição prona, VAF; IO > 40 avaliar ECMO." : io >= 8 ? "SDRA pediátrica moderada (IO 8–16)." : io >= 4 ? "SDRA pediátrica leve (IO 4–8)." : "IO < 4.") : iso != null ? (iso >= 12.3 ? "ISO ≥ 12,3: grave." : iso >= 7.5 ? "ISO 7,5–12,3: moderada." : iso >= 5 ? "ISO 5–7,5: leve." : "ISO < 5.") : pf != null ? (pf < 100 ? "P/F < 100: SDRA grave (Berlim)." : pf < 200 ? "P/F 100–200: moderada." : pf < 300 ? "P/F 200–300: leve — considerar VNI/CNAF." : "P/F ≥ 300.") : "";
        return { rows: rows, main: rows.length ? rows[0][0] + " " + rows[0][1] : "—", ref: "P/F normal > 400; IO < 4; ISO < 5.", interp: interp, plaus: [f >= 0.21 && f <= 1, !v.pao2 || (v.pao2 > 20 && v.pao2 < 700)] }; } },
    { id: "gota", n: "Gotejamento e bombas de infusão", f: [cn("vol", "Volume (mL)"), cn("h", "Tempo (horas)"), cn("dose", "Dose (mcg/kg/min) — para drogas vasoativas"), cn("peso", "Peso (kg)", "peso"), cn("conc", "Concentração da solução (mcg/mL)")], c: function (v) {
        var rows = []; if (v.vol && v.h) { rows.push(["Bomba", nf(v.vol / v.h, 1) + " mL/h"], ["Macrogotas (20 gt/mL)", nf(v.vol / (v.h * 3), 0) + " gotas/min"], ["Microgotas (60 mcgt/mL)", nf(v.vol / v.h, 0) + " microgotas/min"]); }
        if (v.dose && v.peso && v.conc) rows.push(["Infusão contínua", nf(v.dose * v.peso * 60 / v.conc, 2) + " mL/h"]);
        if (!rows.length) return { miss: 1 }; return { rows: rows, main: rows[0][0] + " " + rows[0][1], ref: "Macro: gotas/min = volume ÷ (horas × 3). Micro: microgotas/min = mL/h.", interp: "Conferir dupla checagem para drogas de alta vigilância.", plaus: [!v.h || v.h > 0 && v.h <= 72, !v.vol || v.vol < 10000] }; } }
  ];
  function calcView(p) {
    body.appendChild(el("div", { class: "mut", style: "margin-bottom:6px", text: "Campos já digitados no atendimento entram sozinhos. Resultados são de apoio — confira." }));
    CALC.forEach(function (c) {
      var det = el("details", { class: "sc" }), out = el("div"), vals = {}, inner = el("div", { class: "in2" }), fg = el("div", { class: "fg" });
      det.append(el("summary", null, el("b", { text: c.n })), inner);
      c.f.forEach(function (f) { var a = f[2] ? (f[2] === "anos" ? (p.anos != null ? Math.floor(p.anos) : null) : p[f[2]]) : null, inp = el("input", { inputmode: "decimal", value: a != null ? String(Math.round(a * 10) / 10).replace(".", ",") : "" }); vals[f[0]] = a; inp.addEventListener("input", function () { vals[f[0]] = num(inp.value); go(); }); fg.appendChild(el("label", { class: "r" }, el("span", null, f[1], a != null ? el("small", { text: " · prontuário" }) : null), inp)); });
      inner.append(fg, out);
      function go() { out.textContent = ""; var r; try { r = c.c(vals, p); } catch (e) { r = { miss: 1 }; } if (r.miss) { out.appendChild(el("div", { class: "res", text: "Preencha os campos necessários." })); return; }
        var bad = (r.plaus || []).some(function (x) { return !x; }); if (bad) out.appendChild(el("div", { class: "warnx", text: "⚠ Valor fisiologicamente implausível ou incompatível com a vida — confira a digitação." }));
        out.appendChild(el("div", { class: "res" + (bad ? " bad" : "") }, el("b", { text: r.main }), r.rows ? el("table", null, r.rows.map(function (x) { return el("tr", null, el("td", { text: x[0] }), el("td", { text: x[1] })); })) : null, r.interp ? el("div", { style: "margin-top:4px", text: r.interp }) : null, el("div", { class: "mut", text: "Referência: " + r.ref })));
        var txt = c.n + ": " + r.main + (r.rows ? " (" + r.rows.map(function (x) { return x[0] + " " + x[1]; }).join("; ") + ")" : "");
        out.appendChild(el("div", { class: "act" }, el("button", { type: "button", class: "p", text: "Salvar no prontuário", onclick: function () { if (bad && !confirm("Há valores implausíveis. Salvar mesmo assim?")) return; register("calculo", c.n, txt, vals); } }), el("button", { type: "button", text: "Copiar", onclick: function () { try { navigator.clipboard.writeText(txt); toast("Copiado."); } catch (_) {} } }))); }
      go(); body.appendChild(det);
    });
  }

  /* ---------- cartão de parada ---------- */
  function emerg(w, anos) {
    var mg = function (d, max) { return Math.min(d * w, max); }, tube = anos == null ? null : anos < 1 ? 3.5 : Math.round((anos / 4 + 3.5) * 2) / 2;
    return [
      ["Adrenalina (PCR) 0,01 mg/kg IV/IO", nf(mg(0.01, 1), 2) + " mg = " + nf(mg(0.01, 1) * 10, 1) + " mL da solução 0,1 mg/mL (1 mL 1:1000 + 9 mL SF)"],
      ["Adrenalina (anafilaxia) 0,01 mg/kg IM", nf(mg(0.01, 0.5), 2) + " mg = " + nf(mg(0.01, 0.5), 2) + " mL de 1 mg/mL"],
      ["Amiodarona 5 mg/kg IV/IO", nf(mg(5, 300), 0) + " mg"], ["Adenosina 0,1 mg/kg (2ª 0,2)", nf(mg(0.1, 6), 1) + " mg / " + nf(mg(0.2, 12), 1) + " mg"],
      ["Atropina 0,02 mg/kg (mín. 0,1; máx. 0,5)", nf(Math.max(0.1, mg(0.02, 0.5)), 2) + " mg"], ["Bicarbonato de sódio 8,4% 1 mEq/kg", nf(mg(1, 50), 0) + " mEq = " + nf(mg(1, 50), 0) + " mL"],
      ["Glicose 10% 2–5 mL/kg (hipoglicemia)", nf(2 * w, 0) + "–" + nf(Math.min(5 * w, 250), 0) + " mL"], ["Gluconato de cálcio 10% 0,5 mL/kg", nf(mg(0.5, 20), 1) + " mL"],
      ["Midazolam 0,1–0,2 mg/kg IV (convulsão/sedação)", nf(mg(0.1, 5), 1) + "–" + nf(mg(0.2, 10), 1) + " mg"], ["Diazepam retal 0,5 mg/kg", nf(mg(0.5, 10), 1) + " mg"],
      ["Cetamina 1–2 mg/kg (indução)", nf(mg(1, 150), 0) + "–" + nf(mg(2, 200), 0) + " mg"], ["Etomidato 0,3 mg/kg", nf(mg(0.3, 20), 1) + " mg"], ["Fentanil 1–2 mcg/kg", nf(mg(1, 100), 0) + "–" + nf(mg(2, 100), 0) + " mcg"],
      ["Rocurônio 1 mg/kg", nf(mg(1, 100), 0) + " mg"], ["Succinilcolina 2 mg/kg (< 10 kg) / 1 mg/kg", nf(mg(w < 10 ? 2 : 1, 150), 0) + " mg"], ["Naloxona 0,1 mg/kg (máx. 2)", nf(mg(0.1, 2), 2) + " mg"],
      ["Flumazenil 0,01 mg/kg (máx. 0,2)", nf(mg(0.01, 0.2), 2) + " mg"], ["Salina 3% 3–5 mL/kg (HIC)", nf(3 * w, 0) + "–" + nf(Math.min(5 * w, 250), 0) + " mL"], ["Manitol 20% 0,5–1 g/kg", nf(2.5 * w, 0) + "–" + nf(5 * w, 0) + " mL"],
      ["Expansão SF 0,9% 10–20 mL/kg", nf(10 * w, 0) + "–" + nf(Math.min(20 * w, 1000), 0) + " mL"], ["Desfibrilação 2 J/kg → 4 J/kg (máx. 10 J/kg ou 200 J)", nf(Math.min(2 * w, 200), 0) + " J → " + nf(Math.min(4 * w, 200), 0) + " J"],
      ["Cardioversão sincronizada 0,5–1 J/kg → 2 J/kg", nf(0.5 * w, 0) + "–" + nf(w, 0) + " J → " + nf(Math.min(2 * w, 200), 0) + " J"],
      ["Tubo traqueal com cuff (idade/4 + 3,5)", tube == null ? "informe a idade" : nf(tube, 1) + " mm · fixar em " + nf(tube * 3, 0) + " cm"]
    ];
  }
  function cardView(p) {
    var w = p.peso, rows = w ? emerg(w, p.anos) : null;
    if (!w) { body.appendChild(el("div", { class: "res bad", text: "Informe o peso do paciente em “Dados do paciente” para gerar o cartão de parada." })); return; }
    if (w > 0 && (w < 0.4 || w > 200)) body.appendChild(el("div", { class: "warnx", text: "⚠ Peso implausível — confira." }));
    body.appendChild(el("div", { class: "mut", text: "Peso " + nf(w, 1) + " kg" + (p.anos != null ? " · " + nf(p.anos, 1) + " anos" : "") + ". Doses PALS/AHA 2020 — confira antes de usar." }));
    body.appendChild(el("table", null, rows.map(function (r) { return el("tr", null, el("td", { text: r[0] }), el("td", null, el("b", { text: r[1] }))); })));
    var ck = el("input", { type: "checkbox", style: "width:auto" }), btn = el("button", { type: "button", class: "p", text: "Baixar cartão (PDF)", disabled: "disabled", onclick: function () { pdfCard(w, p, rows); } });
    ck.addEventListener("change", function () { if (ck.checked) btn.removeAttribute("disabled"); else btn.setAttribute("disabled", "disabled"); });
    body.append(el("label", { style: "display:flex;gap:6px;align-items:center;margin-top:8px" }, ck, "Revisei este documento"), el("div", { class: "act" }, btn, el("button", { type: "button", text: "Salvar no prontuário", onclick: function () { register("calculo", "Cartão de parada", "gerado para " + nf(w, 1) + " kg", { peso: w }); } })));
  }
  function pdfCard(w, p, rows) {
    var J = window.jspdf && window.jspdf.jsPDF; if (!J) { toast("Gerador de PDF indisponível."); return; }
    var d = new J({ unit: "mm", format: [100, 150] }), C = Cs() || { pac: {} }, y = 10;
    d.setFont("helvetica", "bold"); d.setFontSize(11); d.text("CARTÃO DE PARADA — DOSES POR PESO", 5, y); y += 5; d.setFontSize(8); d.setFont("helvetica", "normal");
    d.text(((C.pac || {}).nome || "Paciente") + " · " + nf(w, 1) + " kg" + (p.anos != null ? " · " + nf(p.anos, 1) + " anos" : "") + " · " + new Date().toLocaleString("pt-BR"), 5, y); y += 5;
    rows.forEach(function (r) { var a = d.splitTextToSize(r[0], 48), b = d.splitTextToSize(r[1], 42), h = Math.max(a.length, b.length) * 3.2; if (y + h > 142) { d.addPage(); y = 10; } d.setFont("helvetica", "normal"); d.text(a, 5, y); d.setFont("helvetica", "bold"); d.text(b, 54, y); y += h + 1; d.setDrawColor(220); d.line(5, y - 1.5, 95, y - 1.5); });
    d.setFont("helvetica", "italic"); d.setFontSize(6.5); d.text("PALS/AHA 2020. Apoio à decisão — conferir dose e diluição antes de administrar.", 5, 146);
    d.save("cartao-parada-" + String(nf(w, 1)).replace(",", "_") + "kg.pdf"); register("calculo", "Cartão de parada (PDF)", "baixado para " + nf(w, 1) + " kg", { peso: w });
  }
  function histView() {
    if (!ST.hist.length) { body.appendChild(el("div", { class: "res", text: "Nenhum registro ainda. Use “Registrar no prontuário” em um escore ou calculadora." })); return; }
    body.appendChild(el("div", { class: "mut", style: "margin-bottom:6px", text: "Registros com data e hora (também gravados de forma permanente na sua conta). Mais recentes primeiro." }));
    body.appendChild(el("table", null, el("tr", null, el("th", { text: "Quando" }), el("th", { text: "Registro" })), ST.hist.map(function (h) { return el("tr", null, el("td", { text: new Date(h.em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) }), el("td", null, el("b", { text: h.nome }), el("div", { text: h.texto }), h.proto ? el("div", { class: "mut", text: h.proto }) : null)); })));
  }

  /* ---------- ciclo de atualização em tempo real ---------- */
  function sig() { var p = pt(); return [p.proto, p.peso, p.meses, p.pas, p.fc, p.fr, p.tax, p.spo2, p.cr, p.alt, p.sexo, p.txt.length, p.txt.slice(-60)].join("|"); }
  function tick() { if (!document.getElementById("app") || !api()) return; build(); var s = sig(); if (s === lastSig) return; lastSig = s;
    var a = document.activeElement; if (a && panel.contains(a)) return; /* não interromper digitação no painel */
    render(); }
  setInterval(tick, 1200); setTimeout(tick, 400);
  window.PSX_CDSS = { scores: S, calculators: CALC, applicable: function () { return applicable(pt()); }, run: function (id) { return run(BY[id], pt()); }, open: function () { build(); toggle(true); }, version: VER };
})();
