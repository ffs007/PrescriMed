/* Expansão da base (origem: expansao_ia) — conteúdo novo gerado por IA a partir de diretrizes usuais (MS/SBP/bulas),
   no MESMO formato do PROTO_DB. Tudo marcado: aviso "Conteúdo de expansão — confira a dose antes de emitir".
   Também marca como controle especial (Portaria 344) os itens da base anterior que pertencem às listas C1/C5.
   Não altera nenhum item existente do protótipo; apenas acrescenta. */
(function () {
  "use strict";
  var DB = window.PROTO_DB; if (!DB) return;
  var AV = "Conteúdo de expansão (gerado por IA, marcado) — confira a dose antes de emitir.";
  var EXT = "Uso externo";
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var L = function (id, ap, c, vol, gt) { return { id: id, ap: ap, c: c, vol: vol, gt: gt, tipo: "liq" }; };
  var R = function (id, l, o) { var r = { id: id, l: l }; for (var k in o) r[k] = o[k]; return r; };
  var SAME = function (min, nota) { return { same: true, min: min || 0, nota: nota }; };
  function mark(d) { d.origem = "expansao_ia"; d.nota = (d.nota ? d.nota + " " : "") + AV; return d; }

  /* ---------- controle especial nos itens da base anterior (listas C1/C5) ---------- */
  ["leg_sertralina", "leg_fluoxetina", "leg_escitalopram", "leg_paroxetina", "leg_citalopram", "leg_venlafaxina", "leg_desvenlafaxina", "leg_duloxetina",
   "leg_bupropiona", "leg_trazodona", "leg_risperidona", "leg_quetiapina", "leg_olanzapina", "leg_haloperidol", "leg_lamotrigina", "leg_aripiprazol",
   "leg_amitriptilina", "leg_testosterona"].forEach(function (id) { if (DB.drugs[id]) DB.drugs[id].ctrl = true; });

  /* ---------- medicamentos novos ---------- */
  var drugs = {
    exp_eritromicina: { n: "Eritromicina (estearato)", atb: true, nota: "Opção em alergia a penicilina. Muitas interações (QT, estatinas, varfarina).",
      a: [A("500 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido de 6 em 6 horas por 7 dias.", "28 comprimidos"), T("Tomar 1 comprimido de 6 em 6 horas por 14 dias (coqueluche).", "56 comprimidos"), T("Tomar 1 comprimido de 6 em 6 horas por 10 dias (faringite).", "40 comprimidos")])],
      p: { min: 1, reg: [R("e40", "40 mg/kg/dia ÷ 6/6 h", { mgkgdia: 40, h: 6, max: 500, dias: [10, 7, 14] })], f: [L("s250", "250 mg/5 mL suspensão oral", 50, 60), L("s125", "125 mg/5 mL suspensão oral", 25, 60)] } },
    exp_oxcarbazepina: { n: "Oxcarbazepina", ctrl: true, nota: "Hiponatremia; ajustar na doença renal. Iniciar e encaminhar.",
      a: [A("300 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas.", "60 comprimidos"), T("Tomar meio comprimido de 12 em 12 horas por 3 dias e depois 1 comprimido de 12 em 12 horas.", "60 comprimidos")])] },
    exp_vaselina_nasal: { n: "Vaselina sólida (uso nasal)", via: "Uso nasal",
      a: [A("pomada", "1 bisnaga", ["Aplicar pequena quantidade dentro de cada narina 2 vezes ao dia por 7 dias, para manter a mucosa hidratada."], "Uso nasal")], p: SAME(0) },
    exp_epistaxe_orient: { n: "Sangramento pelo nariz", via: EXT,
      a: [A("orientação", "—", ["Se voltar a sangrar: sentar inclinado para frente, apertar as asas do nariz com os dedos por 10 minutos sem soltar, compressa fria. Não deitar nem jogar a cabeça para trás. Evitar assoar com força, esforço e calor por 7 dias. Voltar se não parar em 20 minutos, sangrar muito ou pela boca, tontura ou desmaio."], EXT)], p: SAME(0) },
    exp_olho_vermelho_orient: { n: "Mancha vermelha no olho", via: EXT,
      a: [A("orientação", "—", ["A mancha de sangue no branco do olho é benigna e some sozinha em 1 a 3 semanas, mudando de cor. Não precisa de colírio de antibiótico. Medir a pressão arterial. Voltar se dor no olho, visão embaçada, sensibilidade à luz ou trauma."], EXT)], p: SAME(0) },
    exp_balano_orient: { n: "Higiene do pênis", via: EXT,
      a: [A("orientação", "—", ["Lavar com água e sabonete neutro 2 vezes ao dia, retraindo a pele com cuidado; secar bem antes de vestir. Evitar sabonetes perfumados. Usar preservativo. Se diabético, controlar a glicemia. Voltar se a pele não voltar à posição (parafimose), febre ou feridas."], EXT)], p: SAME(0) },
    exp_parotidite_orient: { n: "Caxumba — cuidados", via: EXT,
      a: [A("orientação", "—", ["Afastamento por 5 dias após o início do inchaço. Alimentos pastosos, evitar ácidos, compressa morna ou fria no local, muito líquido. Atualizar a vacina dos contatos. Voltar se dor nos testículos, dor abdominal forte, dor de cabeça forte, vômitos ou rigidez de nuca."], EXT)], p: SAME(0) },
    exp_mono_orient: { n: "Mononucleose — cuidados", via: EXT,
      a: [A("orientação", "—", ["Repouso relativo e muito líquido. Evitar esporte de contato e esforço por pelo menos 3 a 4 semanas (risco de lesão do baço). Não usar amoxicilina. Não compartilhar copos e talheres. Voltar se dor forte na barriga do lado esquerdo, falta de ar, dificuldade para engolir ou pele amarelada."], EXT)], p: SAME(0) },
    exp_mpb_orient: { n: "Mão-pé-boca — cuidados", via: EXT,
      a: [A("orientação", "—", ["Alimentos frios e pastosos, muito líquido. Lavar as mãos com frequência e após trocar fraldas. Afastamento da creche até as feridas secarem. Voltar se a criança não conseguir beber, urinar pouco, ficar muito sonolenta, vomitar muito, tremores ou fraqueza."], EXT)], p: SAME(0) },
    exp_coqueluche_orient: { n: "Coqueluche — cuidados", via: EXT,
      a: [A("orientação", "—", ["Afastamento por 5 dias após o início do antibiótico. Contatos próximos devem procurar a unidade para profilaxia e vacina. Notificação compulsória. Voltar se pausas na respiração, ficar roxo, vômitos após tosse que impeçam alimentar ou cansaço."], EXT)], p: SAME(0) },
    exp_cinetose_orient: { n: "Enjoo de viagem", via: EXT,
      a: [A("orientação", "—", ["Tomar o remédio 30 a 60 minutos antes da viagem. Sentar na frente, olhar para o horizonte, evitar ler e telas, ventilar o ambiente, refeições leves antes."], EXT)], p: SAME(0) },
    exp_fascite_orient: { n: "Dor na sola do pé — cuidados", via: EXT,
      a: [A("orientação", "—", ["Alongar a panturrilha e a sola do pé 3 vezes ao dia; rolar uma garrafa gelada sob o pé por 15 minutos; calçado com amortecimento e palmilha; evitar andar descalço e longos períodos em pé; controle do peso."], EXT)], p: SAME(0) },
    exp_carpo_orient: { n: "Formigamento nas mãos — cuidados", via: EXT,
      a: [A("orientação", "—", ["Usar tala de punho em posição neutra para dormir por 6 semanas; pausas e alongamento no trabalho repetitivo; evitar dobrar o punho com força. Voltar se perda de força ou atrofia da mão."], EXT)], p: SAME(0) },
    exp_lepto_orient: { n: "Leptospirose — cuidados", via: EXT,
      a: [A("orientação", "—", ["Muito líquido, repouso. Não usar AAS nem anti-inflamatório. Notificação compulsória. Voltar IMEDIATAMENTE se pele ou olhos amarelos, urina escura ou pouca urina, falta de ar, tosse com sangue, sangramentos ou desmaio."], EXT)], p: SAME(0) },
    exp_divert_orient: { n: "Diverticulite — cuidados", via: EXT,
      a: [A("orientação", "—", ["Dieta líquida/leve nos primeiros dias, depois retomar a alimentação com fibras. Muito líquido. Retorno em 48 a 72 horas para reavaliação. Voltar IMEDIATAMENTE se febre alta, piora da dor, barriga dura, vômitos ou sangue nas fezes."], EXT)], p: SAME(0) },
    exp_pele_seb_orient: { n: "Caspa / dermatite seborreica — cuidados", via: EXT,
      a: [A("orientação", "—", ["Doença crônica que melhora e piora; não é contagiosa. Lavar o couro cabeludo com o xampu deixando agir 5 minutos antes de enxaguar. Evitar água muito quente. Estresse e frio pioram."], EXT)], p: SAME(0) },
    exp_rosea_orient: { n: "Pitiríase rósea — cuidados", via: EXT,
      a: [A("orientação", "—", ["Mancha benigna que some sozinha em 6 a 8 semanas; não é contagiosa. Hidratar a pele, banho morno, evitar sabonetes fortes. Sol moderado pode ajudar. Gestante: comunicar o pré-natal."], EXT)], p: SAME(0) }
  };
  Object.keys(drugs).forEach(function (id) { if (!DB.drugs[id]) DB.drugs[id] = mark(drugs[id]); });

  /* ---------- classes novas (usam itens existentes + novos) ---------- */
  var has = function (ids) { return ids.filter(function (id) { return !!DB.drugs[id]; }); };
  var classes = {
    exp_epistaxe: { n: "Epistaxe — cuidados locais", d: has(["exp_vaselina_nasal", "soro_nasal", "exp_epistaxe_orient"]) },
    exp_trigemeo: { n: "Neuralgia do trigêmeo (receita de controle especial)", d: has(["carbamazepina", "exp_oxcarbazepina", "gabapentina", "pregabalina"]) },
    exp_seborreica: { n: "Dermatite seborreica", d: has(["cetoconazol_xampu", "selenio_xampu", "cetoconazol_cr", "hidrocortisona_cr", "desonida_cr", "exp_pele_seb_orient"]) },
    exp_rosea: { n: "Pitiríase rósea — sintomáticos", d: has(["hidroxizina", "loratadina", "cetirizina", "calamina", "emoliente", "exp_rosea_orient"]) },
    exp_olho: { n: "Hemorragia subconjuntival", d: has(["carmelose", "compressa_fria", "exp_olho_vermelho_orient"]) },
    exp_balano: { n: "Balanopostite", d: has(["clotrimazol_cr", "miconazol_cr", "cetoconazol_cr", "fluconazol", "exp_balano_orient"]) },
    exp_mono: { n: "Mononucleose — sintomáticos (sem amoxicilina)", d: has(["paracetamol", "dipirona", "exp_mono_orient"]) },
    exp_parot: { n: "Caxumba — sintomáticos", d: has(["paracetamol", "dipirona", "compressa_morna", "exp_parotidite_orient"]) },
    exp_escarl: { n: "Antimicrobianos (escarlatina)", d: has(["amoxicilina", "penicilina_benzatina", "cefalexina", "azitromicina", "exp_eritromicina"]) },
    exp_mpb: { n: "Mão-pé-boca — sintomáticos", d: has(["paracetamol", "dipirona", "lidocaina_gel", "exp_mpb_orient"]) },
    exp_coqueluche: { n: "Antimicrobianos (coqueluche)", d: has(["azitromicina", "claritromicina", "exp_eritromicina", "smx_tmp", "exp_coqueluche_orient"]) },
    exp_divert: { n: "Antimicrobianos (diverticulite não complicada)", d: has(["amoxclav", "ciprofloxacino", "metronidazol", "smx_tmp", "exp_divert_orient"]) },
    exp_cinetose: { n: "Prevenção do enjoo de viagem", d: has(["dimenidrinato", "meclizina", "prometazina", "exp_cinetose_orient"]) },
    exp_fascite: { n: "Fascite plantar — cuidados", d: has(["exp_fascite_orient", "diclofenaco_gel", "compressa_fria"]) },
    exp_carpo: { n: "Síndrome do túnel do carpo", d: has(["exp_carpo_orient", "prednisona", "diclofenaco_gel"]) },
    exp_lepto: { n: "Antimicrobianos (leptospirose — formas leves)", d: has(["doxiciclina", "amoxicilina", "azitromicina", "exp_lepto_orient"]) }
  };
  Object.keys(classes).forEach(function (k) { if (!DB.classes[k]) DB.classes[k] = classes[k]; });

  /* ---------- exames: amplia as listas do PS com códigos SIGTAP existentes ---------- */
  var addCodes = function (list, codes) { codes.forEach(function (c) { if (list.indexOf(c) < 0) list.push(c); }); };
  addCodes(DB.labPS, ["0202030105", "0202030970", "0202030679", "0202030300", "0202080129", "0202080137", "0202060012", "0214010090", "0202050254", "0202031500"]);
  addCodes(DB.compPS, ["0206010010", "0206010036", "0206010052", "0206020023", "0206030029", "0207010030", "0207010056", "0207030014", "0207030022",
    "0205020097", "0205020100", "0205020089", "0205020135", "0205010059", "0205020151", "0205010024"]);

  /* ---------- condições novas ---------- */
  var HEMO = "0202020380", PCR = "0202030202";
  var P = function (id, n, cat, o) { o.id = id; o.n = n; o.cat = cat; o.origem = "expansao_ia"; o.alerta = (o.alerta ? o.alerta + " " : "") + AV; return o; };
  var protos = [
    P("exp-epistaxe", "Epistaxe anterior (controlada)", "Otorrino", { alias: "sangramento nasal nariz sangrando epistaxe", cid: [["R040", "Epistaxe"]], cls: ["exp_epistaxe", "anti_has"], lab: [HEMO, "0202020029"], comp: [], naoUsar: "AAS e anti-inflamatórios nos próximos dias; assoar com força.", alerta: "Sangramento posterior, refratário ou em anticoagulado: tamponamento e avaliação especializada." }),
    P("exp-trigemeo", "Neuralgia do trigêmeo", "Neurológico", { alias: "dor face choque trigemeo neuralgia", cid: [["G500", "Nevralgia do trigêmeo"]], cls: ["exp_trigemeo", "analg"], lab: [HEMO, "0202010635"], comp: ["0207010064"], alerta: "Déficit sensitivo, idade < 40 anos ou bilateral: investigar causa secundária (RM)." }),
    P("exp-seborreica", "Dermatite seborreica", "Dermatológico", { alias: "caspa seborreia descamacao couro cabeludo crosta lactea", cid: [["L219", "Dermatite seborreica não especificada"]], cls: ["exp_seborreica"], lab: [], comp: [] }),
    P("exp-rosea", "Pitiríase rósea", "Dermatológico", { alias: "manchas tronco medalhao pitiriase rosea", cid: [["L42", "Pitiríase rósea"]], cls: ["exp_rosea"], lab: ["0202031179"], comp: [], alerta: "Considerar sífilis secundária (VDRL) se lesões palmoplantares." }),
    P("exp-hsc", "Hemorragia subconjuntival", "Oftalmológico", { alias: "olho vermelho mancha sangue no olho hiposfagma", cid: [["H113", "Hemorragia conjuntival"]], cls: ["exp_olho", "anti_has"], lab: [], comp: [], alerta: "Trauma ocular, dor, baixa visual ou anticoagulado com INR alto: avaliação oftalmológica." }),
    P("exp-balano", "Balanopostite", "Urológico", { alias: "inflamacao glande prepucio balanite coceira penis", cid: [["N481", "Balanopostite"]], cls: ["exp_balano"], lab: ["0202010473"], comp: [], alerta: "Recorrente: investigar diabetes. Parafimose: urgência." }),
    P("exp-mono", "Mononucleose infecciosa", "Infeccioso", { alias: "mononucleose doenca do beijo epstein barr ganglios garganta", cid: [["B279", "Mononucleose infecciosa não especificada"]], cls: ["exp_mono"], lab: [HEMO, "0202010643", "0202010651"], comp: [], naoUsar: "Amoxicilina/ampicilina (exantema) e esporte de contato por 3 a 4 semanas." }),
    P("exp-caxumba", "Caxumba (parotidite epidêmica)", "Infeccioso", { alias: "caxumba parotidite papeira inchaço parotida", cid: [["B269", "Caxumba sem complicação"]], cls: ["exp_parot"], lab: ["0202010180"], comp: [], alerta: "Notificar surtos. Orquite, pancreatite ou meningite: reavaliar." }),
    P("exp-escarlatina", "Escarlatina", "Pediatria", { alias: "escarlatina lingua framboesa exantema aspero estreptococo", cid: [["A38", "Escarlatina"]], cls: ["exp_escarl", "analg"], lab: [HEMO], comp: [] }),
    P("exp-mpb", "Doença mão-pé-boca", "Pediatria", { alias: "mao pe boca coxsackie feridas boca bolhas maos", cid: [["B084", "Estomatite vesicular devida a enterovírus com exantema"]], cls: ["exp_mpb"], lab: [], comp: [], alerta: "Sinais neurológicos (mioclonias, ataxia) ou desidratação: internação." }),
    P("exp-coqueluche", "Coqueluche (suspeita)", "Infeccioso", { alias: "coqueluche tosse comprida guincho pertussis", cid: [["A379", "Coqueluche não especificada"]], cls: ["exp_coqueluche"], lab: [HEMO, "0202080080"], comp: ["0204030153"], alerta: "Lactente < 6 meses: internação. Notificação compulsória; profilaxia dos contatos." }),
    P("exp-diverticulite", "Diverticulite aguda não complicada (ambulatorial)", "Gastrointestinal", { alias: "diverticulite dor fossa iliaca esquerda diverticulo", cid: [["K573", "Doença diverticular do intestino grosso sem perfuração ou abscesso"]], cls: ["exp_divert", "analg", "antiem"], lab: [HEMO, PCR, "0202010317", "0202010694"], comp: ["0206030037", "0206030010"], alerta: "Imunossupressão, febre alta, peritonite, intolerância oral ou idoso frágil: internação." }),
    P("exp-cinetose", "Cinetose (enjoo de viagem)", "Geral", { alias: "enjoo viagem cinetose mal do movimento", cid: [["T756", "Efeitos de movimento (cinetose)"]], cls: ["exp_cinetose"], lab: [], comp: [] }),
    P("exp-fascite", "Fascite plantar", "Musculoesquelético", { alias: "dor calcanhar sola pe esporao fascite", cid: [["M722", "Fibromatose da fáscia plantar"]], cls: ["exp_fascite", "aine", "analg"], lab: [], comp: ["0204060150"] }),
    P("exp-carpo", "Síndrome do túnel do carpo", "Musculoesquelético", { alias: "formigamento mao tunel carpo mediano dormencia", cid: [["G560", "Síndrome do túnel do carpo"]], cls: ["exp_carpo", "analg", "aine"], lab: ["0202060250", "0202010473"], comp: [], alerta: "Déficit motor ou atrofia tenar: encaminhar para cirurgia." }),
    P("exp-lepto", "Leptospirose — forma leve (suspeita)", "Infeccioso", { alias: "leptospirose enchente rato febre panturrilha", cid: [["A279", "Leptospirose não especificada"]], cls: ["exp_lepto", "analg_dengue"], lab: [HEMO, "0202010317", "0202010694", "0202010643", "0202010651", "0202010325"], comp: [], naoUsar: "AAS e anti-inflamatórios.", alerta: "Icterícia, oligúria, hemorragia, dispneia ou hipotensão: internação imediata. Notificação compulsória." })
  ];
  var ids = {}; DB.protocols.forEach(function (p) { ids[p.id] = 1; });
  protos.forEach(function (p) { if (!ids[p.id]) DB.protocols.push(p); });
})();
