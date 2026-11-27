/* ETAPA 5 — Trauma, ortopedia, proctologia, parasitoses e pediatria. Acrescenta medicamentos, classes e protocolos ao PROTO_DB.
   Escores ligados (scores.js): Ottawa (entorse/contusão), TC de crânio canadense (TCE leve), antitetânica (ferimento/mordedura), raiva (mordedura). */
(function () {
  "use strict";
  var DB = window.PROTO_DB; if (!DB) return;
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var L = function (id, ap, c, vol, gt) { return { id: id, ap: ap, c: c, vol: vol, gt: gt, tipo: "liq" }; };
  var R = function (id, l, o) { var r = { id: id, l: l }; for (var k in o) r[k] = o[k]; return r; };
  var SAME = function (min, nota) { return { same: true, min: min || 0, nota: nota }; };
  var EXT = "Uso externo", RET = "Uso retal";
  var AINE_G = "AINE — evitar na gestação (contraindicado a partir de 20 semanas).";

  var d = {
    /* ---------- ortopedia / trauma ---------- */
    diclofenaco_gel: { n: "Diclofenaco dietilamônio (gel)", via: EXT, gc: "evitar no 3º trimestre e em áreas extensas.", nota: "Não aplicar em pele ferida. Lavar as mãos após.",
      a: [A("11,6 mg/g gel", "1 bisnaga de 60 g", ["Aplicar e massagear suavemente na região dolorida 3 a 4 vezes ao dia, por até 7 dias."], EXT)], p: SAME(168) },
    rice: { n: "Gelo, repouso e elevação", via: EXT, a: [A("orientação", "—", ["Nas primeiras 48 a 72 horas: gelo envolto em pano por 15 a 20 minutos, 3 a 4 vezes ao dia; repouso relativo; atadura elástica sem apertar; manter o membro elevado acima do coração. Retomar o movimento conforme a dor permitir."], EXT)], p: SAME(0) },
    imobilizacao: { n: "Cuidados com a imobilização", via: EXT, a: [A("orientação", "—", ["Manter a tala/gesso seco e o membro elevado; mexer os dedos várias vezes ao dia; não colocar objetos por dentro. Voltar imediatamente se dedos frios, roxos, pálidos ou dormentes, dor que aumenta muito ou inchaço que aperta a tala."], EXT)], p: SAME(0) },
    colchicina: { n: "Colchicina", gc: "evitar.", nota: "Diarreia = parar. Reduzir dose em doença renal/hepática. Interação grave com claritromicina, ciclosporina, verapamil e estatinas.",
      a: [A("0,5 mg comprimido", "20 comprimidos", [T("Tomar 2 comprimidos (1 mg) agora e 1 comprimido 1 hora depois; a partir do dia seguinte, 1 comprimido de 12 em 12 horas até 3 dias após o fim da crise.", "20 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos")]),
          A("1 mg comprimido", "10 comprimidos", [T("Tomar 1 comprimido agora e meio comprimido 1 hora depois; a partir do dia seguinte, meio comprimido de 12 em 12 horas até 3 dias após o fim da crise.", "10 comprimidos")])] },
    prednisona_gota: { n: "Prednisona", gc: "usar se necessário, por pouco tempo.", nota: "Opção quando AINE e colchicina são contraindicados (DRC, anticoagulado, úlcera). Diabéticos: monitorar glicemia.",
      a: [A("20 mg comprimido", "10 comprimidos", [T("Tomar 2 comprimidos (40 mg) pela manhã, após o café, por 5 dias.", "10 comprimidos"), T("Tomar 1 comprimido e meio (30 mg) pela manhã por 5 dias.", "8 comprimidos")])] },
    indometacina: { n: "Indometacina", gx: AINE_G, nota: "Tomar após as refeições. Cefaleia e tontura; evitar em idosos, DRC, úlcera e anticoagulados.",
      a: [A("50 mg cápsula", "15 cápsulas", [T("Tomar 1 cápsula de 8 em 8 horas, após as refeições, por 5 dias.", "15 cápsulas")]), A("25 mg cápsula", "15 cápsulas", [T("Tomar 1 cápsula de 8 em 8 horas, após as refeições, por 5 dias.", "15 cápsulas")])] },
    gota_orient: { n: "Orientações na gota", via: EXT, a: [A("orientação", "—", ["Repouso da articulação e gelo local. Beber 2 litros de água por dia. Evitar álcool (principalmente cerveja), refrigerante adoçado, carne vermelha e frutos do mar. Se já usa alopurinol, NÃO parar durante a crise; não começar alopurinol agora — discutir na UBS após 2 a 4 semanas."], EXT)] },
    pontos: { n: "Curativo e retirada de pontos", via: EXT, a: [
      A("orientação", "—", ["Manter o curativo seco por 24 a 48 horas; depois lavar com água e sabão 1 a 2 vezes ao dia, secar e cobrir. Retirar os pontos na UBS em: rosto 5 dias; couro cabeludo 7 a 10 dias; tronco e braços 10 dias; mãos e pernas 10 a 14 dias; pés e sobre articulações 14 dias. Voltar se vermelhidão que espalha, pus, febre ou abertura da ferida."], EXT),
      A("orientação (ferida sem sutura)", "—", ["Lavar a ferida com água e sabão 2 vezes ao dia, secar sem esfregar e manter coberta com gaze limpa até formar casca. Voltar se vermelhidão que espalha, pus, febre ou dor que aumenta."], EXT)], p: SAME(0) },
    amoxclav_mord: { n: "Amoxicilina + clavulanato de potássio", atb: true, nota: "Profilaxia em mordedura de alto risco (gato, mão/face/genital, puntiforme, imunodeprimido, > 8 h). Alergia: doxiciclina ou SMX-TMP + clindamicina.",
      a: [A("875 mg + 125 mg comprimido", "10 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 5 dias.", "10 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 3 dias (profilaxia).", "6 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 7 dias (ferida já infectada).", "14 comprimidos")])] },
    tce_orient: { n: "Orientações após trauma na cabeça", via: EXT, a: [A("orientação", "—", ["Ficar com um adulto responsável por 24 horas, que deve acordar o paciente a cada 3 a 4 horas na primeira noite. Repouso, sem álcool, sem dirigir e sem esporte até liberação. Voltar IMEDIATAMENTE se sonolência difícil de acordar, vômitos repetidos, dor de cabeça que piora, convulsão, confusão, fraqueza ou formigamento, fala enrolada, pupilas diferentes, ou sangue/líquido saindo pelo nariz ou ouvido."], EXT)], p: SAME(0) },
    cervical_orient: { n: "Cuidados com o pescoço", via: EXT, a: [A("orientação", "—", ["Calor local 15 a 20 minutos 3 vezes ao dia; manter-se ativo e fazer movimentos suaves; evitar colar cervical; ajustar travesseiro e postura no celular/computador. Voltar se fraqueza ou formigamento nos braços, febre, perda de peso ou dor após trauma forte."], EXT)] },

    /* ---------- intestino / proctologia ---------- */
    lactulose: { n: "Lactulose", nota: "Gases e cólica no início. Ajustar a dose para 1 a 2 evacuações pastosas por dia.",
      a: [A("667 mg/mL xarope", "1 frasco de 120 mL", [T("Tomar 15 mL 1 vez ao dia, de preferência pela manhã; pode aumentar para 15 mL 2 vezes ao dia.", "1 frasco de 120 mL"), T("Tomar 30 mL 1 vez ao dia.", "2 frascos de 120 mL")])],
      p: { min: 0, reg: [R("lc1", "1 mL/kg/dia 1 vez ao dia", { mgkg: 1, h: 24, max: 30, cond: "pela manhã" }), R("lc05", "0,5 mL/kg/dia 1 vez ao dia (início em lactente)", { mgkg: 0.5, h: 24, max: 15, cond: "pela manhã" })],
           f: [{ id: "xp", ap: "667 mg/mL xarope", c: 1, vol: 120, tipo: "liq", un: "mL" }] } },
    macrogol: { n: "Macrogol", nota: "Diluir em água ou suco. Efeito em 1 a 3 dias.",
      a: [A("3350 + eletrólitos 14 g — sachê", "20 sachês", [T("Dissolver 1 sachê em 125 mL de água e tomar 1 a 2 vezes ao dia.", "20 sachês")]), A("4000 10 g — sachê", "20 sachês", [T("Dissolver 1 sachê em 1 copo de água e tomar 1 a 2 vezes ao dia.", "20 sachês")])],
      p: { fix: "idade", min: 6, ap: "4000 4 g — sachê", q: "20 sachês", faixas: [
        { ate: 12, t: "Dissolver 1 sachê de 4 g em 50 mL de água ou suco e dar 1 vez ao dia." },
        { ate: 48, t: "Dissolver 1 a 2 sachês de 4 g em 50 mL de água ou suco e dar 1 vez ao dia (ajustar para fezes pastosas)." },
        { ate: 96, t: "Dissolver 2 a 4 sachês de 4 g em 100 mL de água ou suco e dar 1 vez ao dia (ajustar para fezes pastosas).", q: "30 sachês" },
        { ate: 9999, t: "Dissolver 1 sachê de 10 g em 1 copo de água e dar 1 vez ao dia.", ap: "4000 10 g — sachê" }] } },
    psyllium: { n: "Psyllium (Plantago ovata)", nota: "Beber pelo menos 2 litros de água por dia. Pode dar gases no início.",
      a: [A("5,85 g pó — sachê", "30 sachês", [T("Dissolver 1 sachê em 1 copo de água e tomar logo, 1 a 2 vezes ao dia.", "30 sachês")])], p: SAME(72) },
    bisacodil: { n: "Bisacodil", gc: "preferir lactulose ou psyllium.", nota: "Uso curto. Cólica. Não tomar com leite ou antiácido.",
      a: [A("5 mg comprimido", "10 comprimidos", [T("Tomar 1 a 2 comprimidos à noite, se não evacuar, por até 5 dias.", "10 comprimidos")])] },
    oleo_mineral: { n: "Óleo mineral", nota: "Risco de pneumonia aspirativa: NÃO usar em < 1 ano, acamados, disfagia ou refluxo. Não tomar deitado.",
      a: [A("100% líquido oral", "1 frasco de 100 mL", [T("Tomar 15 mL à noite, longe das refeições, por até 7 dias.", "1 frasco de 100 mL")])] },
    glicerina_sup: { n: "Glicerina (supositório)", via: RET, nota: "Para alívio pontual, não para uso diário.",
      a: [A("supositório adulto", "1 caixa", ["Introduzir 1 supositório no ânus se não evacuar há 3 dias."], RET), A("supositório infantil", "1 caixa", ["Introduzir 1 supositório infantil no ânus se não evacuar há 3 dias."], RET)], p: SAME(0) },
    dieta_fibra: { n: "Fibras, água e hábito intestinal", via: EXT, a: [A("orientação", "—", ["Beber 2 litros de água por dia; comer frutas com casca (mamão, ameixa, laranja com bagaço), verduras, feijão e aveia; sentar no vaso todo dia após o café da manhã por 5 a 10 minutos, com os pés apoiados em um banquinho; não segurar a vontade de evacuar."], EXT)], p: SAME(0) },
    diosmina: { n: "Diosmina + hesperidina", nota: "Alivia a crise hemorroidária; não substitui fibra e água.",
      a: [A("450 mg + 50 mg comprimido", "38 comprimidos", [T("Tomar 3 comprimidos de 12 em 12 horas por 4 dias e depois 2 comprimidos de 12 em 12 horas por 3 dias.", "36 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 30 dias.", "60 comprimidos")])] },
    pomada_hem: { n: "Policresuleno + cloridrato de cinchocaína (pomada retal)", via: RET, nota: "Uso por até 7 dias.",
      a: [A("100 mg/g + 10 mg/g pomada retal com aplicador", "1 bisnaga de 30 g", ["Aplicar no ânus 2 a 3 vezes ao dia e após evacuar, por até 7 dias."], RET)] },
    nifedipino_top: { n: "Nifedipino 0,2% + lidocaína 1% (pomada manipulada)", via: RET, gc: "avaliar risco-benefício.", nota: "Fissura anal: cicatriza em 6 a 8 semanas. Pode dar dor de cabeça leve.",
      a: [A("pomada manipulada", "1 pote de 30 g", ["Aplicar uma pequena quantidade (tamanho de uma ervilha) na borda do ânus 3 vezes ao dia, por 6 a 8 semanas."], RET)] },
    banho_assento: { n: "Banho de assento", via: EXT, a: [A("orientação", "—", ["Sentar em bacia com água morna (não quente) por 10 a 15 minutos, 3 vezes ao dia e após evacuar. Secar sem esfregar. Evitar papel higiênico áspero: preferir lavar com água."], EXT)], p: SAME(0) },

    /* ---------- parasitoses ---------- */
    albendazol: { n: "Albendazol", gx: "contraindicado na gestação (principalmente no 1º trimestre).", nota: "Tomar com alimento. Tratar todos da casa na oxiuríase.",
      a: [A("400 mg comprimido mastigável", "1 comprimido", [T("Tomar 1 comprimido em dose única.", "1 comprimido"), T("Tomar 1 comprimido 1 vez ao dia por 3 dias (estrongiloidíase, teníase).", "3 comprimidos"), T("Tomar 1 comprimido em dose única e repetir após 14 dias (oxiuríase).", "2 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia por 5 dias (giardíase).", "5 comprimidos")])],
      p: { fix: "idade", ap: "40 mg/mL suspensão oral", q: "1 frasco de 10 mL", faixas: [
        { ate: 12, err: "Abaixo de 1 ano: não usar albendazol (ou só com orientação do pediatra)." },
        { ate: 24, t: "Dar 5 mL (200 mg) em dose única (repetir após 14 dias se oxiúros)." },
        { ate: 9999, t: "Dar 10 mL (400 mg) em dose única (repetir após 14 dias se oxiúros; 1 vez ao dia por 3 dias se estrongiloides)." }] } },
    mebendazol: { n: "Mebendazol", gx: "contraindicado na gestação.", nota: "Tratar todos da casa na oxiuríase.",
      a: [A("100 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 3 dias.", "6 comprimidos")])],
      p: { fix: "idade", ap: "20 mg/mL suspensão oral", q: "1 frasco de 30 mL", faixas: [
        { ate: 12, err: "Abaixo de 1 ano: não usar mebendazol." },
        { ate: 9999, t: "Dar 5 mL (100 mg) de 12 em 12 horas por 3 dias." }] } },
    nitazoxanida: { n: "Nitazoxanida", gc: "evitar.", nota: "Tomar com alimento. Urina pode ficar amarelo-esverdeada.",
      a: [A("500 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, por 3 dias.", "6 comprimidos")])],
      p: { min: 12, reg: [R("nz", "7,5 mg/kg/dose de 12/12 h", { mgkg: 7.5, h: 12, max: 500, cond: "com alimento", dias: [3] })], f: [L("s20", "20 mg/mL pó para suspensão oral", 20, 45)] } },
    ivermectina_verm: { n: "Ivermectina", pa: true, gx: "contraindicada na gestação.", nota: "Estrongiloidíase: 1 vez ao dia por 2 dias. Tomar com água, em jejum.",
      a: [A("6 mg comprimido", "4 comprimidos", [T("Tomar 2 comprimidos (12 mg) em dose única; na estrongiloidíase, repetir no dia seguinte (51 a 65 kg).", "4 comprimidos")])],
      p: { fix: "peso", ap: "6 mg comprimido", q: "2 comprimidos", faixas: [
        { ate: 14.9, err: "Contraindicada abaixo de 15 kg — usar albendazol." },
        { ate: 24, t: "Dar meio comprimido (3 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "1 comprimido" },
        { ate: 35, t: "Dar 1 comprimido (6 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "2 comprimidos" },
        { ate: 50, t: "Dar 1 comprimido e meio (9 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "3 comprimidos" },
        { ate: 65, t: "Tomar 2 comprimidos (12 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "4 comprimidos" },
        { ate: 79, t: "Tomar 2 comprimidos e meio (15 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "5 comprimidos" },
        { ate: 999, t: "Tomar 3 comprimidos (18 mg) em dose única; na estrongiloidíase, repetir no dia seguinte.", q: "6 comprimidos" }] } },
    hig_verm: { n: "Higiene contra vermes", via: EXT, a: [A("orientação", "—", ["Lavar as mãos antes de comer e após usar o banheiro; cortar e limpar as unhas; lavar bem frutas e verduras; beber água filtrada ou fervida; andar calçado. Oxiúros: tratar todos da casa e lavar roupas de cama e íntimas em água quente."], EXT)], p: SAME(0) },

    /* ---------- pediatria ---------- */
    reuteri: { n: "Lactobacillus reuteri DSM 17938 (gotas)", nota: "Evidência de redução do choro em lactentes amamentados. Não substitui a avaliação de sinais de alarme.",
      a: [A("10⁸ UFC/5 gotas suspensão oral", "1 frasco de 5 mL", ["Dar 5 gotas 1 vez ao dia por 21 dias."])], p: SAME(0) },
    oxido_zinco: { n: "Óxido de zinco (pasta/pomada)", via: EXT, a: [A("pasta/pomada", "1 bisnaga", ["Aplicar uma camada grossa na área da fralda a cada troca, sem remover totalmente a camada anterior."], EXT)], p: SAME(0) },
    nistatina_zinco: { n: "Nistatina + óxido de zinco (pomada)", via: EXT, nota: "Para dermatite com candidíase (lesões vermelho-vivas com pontinhos satélites).",
      a: [A("100.000 UI/g + 200 mg/g pomada", "1 bisnaga de 60 g", ["Limpar e secar a área e aplicar a cada troca de fralda por 7 a 14 dias."], EXT)], p: SAME(0) },
    fralda_orient: { n: "Cuidados com a área da fralda", via: EXT, a: [A("orientação", "—", ["Trocar a fralda assim que molhar ou sujar; lavar com água morna e algodão (evitar lenço umedecido com perfume); secar bem; deixar sem fralda alguns minutos por dia; aplicar a pomada de barreira a cada troca."], EXT)], p: SAME(0) },
    colica_orient: { n: "Cólica do bebê", via: EXT, a: [A("orientação", "—", ["Choro de cólica é comum até 3 a 4 meses e não faz mal ao bebê. Colocar para arrotar, embalar, contato pele a pele, compressa morna na barriga e massagem. Manter a amamentação. Se precisar, pedir ajuda: nunca sacudir o bebê. Voltar se febre, vômitos, recusa de mamar, sangue nas fezes, barriga inchada ou choro diferente do habitual."], EXT)], p: SAME(0) },
    bronq_orient: { n: "Cuidados na bronquiolite", via: EXT, a: [A("orientação", "—", ["Lavar o nariz com soro antes das mamadas e de dormir; oferecer mamadas menores e mais vezes; cabeceira elevada. Dura 7 a 14 dias (a tosse até 3 semanas). Voltar IMEDIATAMENTE se respiração rápida ou cansada, costelas afundando, gemência, lábios roxos, pausas na respiração, mamar menos da metade ou molhar poucas fraldas."], EXT)], p: SAME(0) },
    crupe_orient: { n: "Cuidados na laringite (crupe)", via: EXT, a: [A("orientação", "—", ["Manter a criança calma e no colo; a tosse de cachorro costuma piorar à noite e melhorar em 2 a 3 dias. Voltar IMEDIATAMENTE se barulho ao respirar mesmo parada, cansaço, costelas afundando, lábios roxos, babando ou sem conseguir engolir."], EXT)], p: SAME(0) },
    febre_orient: { n: "Cuidados com a febre", via: EXT, a: [A("orientação", "—", ["Febre é defesa do corpo; o objetivo do remédio é o conforto. Oferecer líquidos, roupas leves. Não alternar antitérmicos por rotina. Voltar IMEDIATAMENTE se a criança ficar muito molinha ou irritada mesmo sem febre, manchas roxas na pele, dificuldade para respirar, convulsão, vômitos que não param, pouca urina, ou febre por mais de 48 a 72 horas."], EXT)], p: SAME(0) }
  };
  for (var k in d) DB.drugs[k] = d[k];
  /* simeticona: esquema pediátrico em gotas */
  if (DB.drugs.simeticona && !DB.drugs.simeticona.p) DB.drugs.simeticona.p = { fix: "idade", ap: "75 mg/mL emulsão oral (gotas)", q: "1 frasco de 15 mL", faixas: [{ ate: 12, t: "Dar 4 gotas 3 vezes ao dia, após as mamadas, se gases." }, { ate: 144, t: "Dar 6 a 10 gotas 3 vezes ao dia, após as refeições, se gases." }] };

  var c = {
    aine_top: { n: "Anti-inflamatório tópico", d: ["diclofenaco_gel"] },
    rice_cls: { n: "Medidas locais e imobilização", d: ["rice", "imobilizacao", "compressa_fria"] },
    gota_agudo: { n: "Crise de gota", d: ["colchicina", "naproxeno", "indometacina", "prednisona_gota"] },
    gota_cls: { n: "Orientações (gota)", d: ["gota_orient"] },
    ferida: { n: "Curativo e pontos", d: ["pontos"] },
    atb_mord: { n: "Antimicrobianos (mordedura)", d: ["amoxclav_mord", "amoxclav", "doxiciclina", "smx_tmp", "clindamicina"] },
    tce_cls: { n: "Orientações (TCE leve)", d: ["tce_orient"] },
    analg_tce: { n: "Analgésicos (TCE: evitar AINE e AAS nas primeiras 48 h)", d: ["paracetamol", "dipirona"] },
    cervical_cls: { n: "Orientações (cervicalgia)", d: ["cervical_orient", "bolsa_morna"] },
    laxante: { n: "Laxativos", d: ["lactulose", "macrogol", "psyllium", "bisacodil", "oleo_mineral", "glicerina_sup"] },
    habito_int: { n: "Hábito intestinal", d: ["dieta_fibra"] },
    hemorroida_cls: { n: "Crise hemorroidária", d: ["diosmina", "pomada_hem", "lidocaina_geleia", "banho_assento"] },
    fissura_cls: { n: "Fissura anal", d: ["nifedipino_top", "lidocaina_geleia", "banho_assento"] },
    antiparasit: { n: "Antiparasitários", d: ["albendazol", "mebendazol", "nitazoxanida", "ivermectina_verm", "metronidazol", "secnidazol"] },
    hig_cls: { n: "Prevenção", d: ["hig_verm"] },
    nasal_lact: { n: "Higiene nasal", d: ["soro_nasal", "lavagem_nasal"] },
    analg_febre: { n: "Antitérmicos e analgésicos", d: ["paracetamol", "dipirona", "ibuprofeno"] },
    bronq_cls: { n: "Orientações (bronquiolite)", d: ["bronq_orient"] },
    cortic_crupe: { n: "Corticoide (dose única)", d: ["dexametasona", "prednisolona"] },
    crupe_cls: { n: "Orientações (crupe)", d: ["crupe_orient"] },
    colica_med: { n: "Cólica do lactente", d: ["reuteri", "simeticona"] },
    colica_cls: { n: "Orientações (cólica)", d: ["colica_orient"] },
    fralda_top: { n: "Pomadas para a área da fralda", d: ["oxido_zinco", "nistatina_zinco", "miconazol_cr", "hidrocortisona_cr"] },
    fralda_cls: { n: "Cuidados (fralda)", d: ["fralda_orient"] },
    febre_cls: { n: "Orientações (febre)", d: ["febre_orient"] },
    paron_cls: { n: "Cuidados locais (paroníquia)", d: ["compressa_morna", "mupirocina"] }
  };
  for (var k2 in c) DB.classes[k2] = c[k2];

  var P = function (id, n, cat, o) { var p = { id: id, n: n, cat: cat }; for (var k in o) p[k] = o[k]; return p; };
  var HEMO = "0202020380", PCR = "0202030202", VHS = "0202020150", AU = "0202010120", CREAT = "0202010317", UREIA = "0202010694", EAS = "0202050017", URO = "0202080080", ATBG = "0202080013", HEMOC = "0202080153",
      EPF = "0202040127", OXI = "0202040054", LARV = "0202040089", TROF = "0202040178", TSH = "0202060250", K = "0202010600", CA = "0202010210", GLI = "0202010473",
      RXTOR = "0204060087", RXPE = "0204060150", RXJOE = "0204060125", RXPUN = "0204040124", RXMAO = "0204040094", RXOMB = "0204040116", RXCOT = "0204040078", RXANT = "0204040019", RXPER = "0204060168", RXCERV = "0204020034",
      RXCRA = "0204010080", RXTX = "0204030153", RXABD = "0204050138", USGART = "0205020062", TCC = "0206010079", CONS = "0301010072";
  var novos = [
    P("entorse", "Entorse (tornozelo, joelho, punho)", "Trauma / Ortopedia", { alias: "entorse torceu o pe torcao tornozelo virou o pe joelho torcido punho", cid: [["S93.4", "Entorse e distensão do tornozelo"], ["S83.6", "Entorse e distensão de outras partes do joelho"], ["S63.5", "Entorse e distensão do punho"]], cls: ["rice_cls", "aine", "aine_top", "analg"], lab: [], comp: [RXTOR, RXPE, RXJOE, RXPUN, CONS], alerta: "Use Ottawa para indicar radiografia. Instabilidade, deformidade, déficit neurovascular ou incapacidade de carga após 5–7 dias = ortopedia." }),
    P("contusao", "Contusão / trauma de partes moles", "Trauma / Ortopedia", { alias: "contusao pancada batida hematoma trauma leve queda", cid: [["T14.0", "Traumatismo superficial de região não especificada do corpo"], ["S80.0", "Contusão do joelho"], ["S60.2", "Contusão de outras partes do punho e da mão"]], cls: ["rice_cls", "analg", "aine", "aine_top"], lab: [], comp: [RXTOR, RXJOE, RXPUN, RXMAO, RXOMB, RXCOT, RXANT, RXPER], alerta: "Dor desproporcional, tensão do compartimento e dor ao estiramento passivo = síndrome compartimental (fasciotomia de urgência). Anticoagulado com hematoma em expansão: reavaliar." }),
    P("fratura-imobilizada", "Fratura fechada imobilizada (aguardando ortopedia)", "Trauma / Ortopedia", { alias: "fratura quebrou osso tala gesso imobilizacao ortopedia", cid: [["T14.2", "Fratura de região não especificada do corpo"]], cls: ["analg", "aine", "opio", "rice_cls"], lab: [], comp: [CONS, RXTOR, RXPUN, RXANT, RXPER, RXOMB, RXCOT, RXMAO, RXPE], alerta: "Fratura exposta, desvio importante, lesão neurovascular, articular complexa, fêmur/quadril ou suspeita de síndrome compartimental = regulação de urgência (não APAC ambulatorial). Avaliar profilaxia de TEV em imobilização de membro inferior." }),
    P("tendinite", "Tendinite / bursite / epicondilite", "Trauma / Ortopedia", { alias: "tendinite bursite epicondilite ombro doloroso manguito tenossinovite de quervain cotovelo de tenista", cid: [["M77.9", "Entesopatia não especificada"], ["M75.1", "Síndrome do manguito rotador"], ["M71.9", "Bursopatia não especificada"], ["M65.4", "Tenossinovite estilóide radial (de Quervain)"]], cls: ["aine", "aine_top", "analg", "rice_cls"], lab: [], comp: [USGART, RXOMB, RXCOT, RXPUN, CONS], alerta: "Febre, calor intenso e derrame articular = artrite séptica até prova em contrário (punção). Encaminhar à fisioterapia se > 4 semanas." }),
    P("cervicalgia", "Cervicalgia / torcicolo", "Trauma / Ortopedia", { alias: "dor no pescoco torcicolo cervicalgia pescoco travado", cid: [["M54.2", "Cervicalgia"]], cls: ["relax", "aine", "analg", "cervical_cls"], lab: [], comp: [RXCERV, CONS], alerta: "Trauma de alta energia (usar NEXUS/Canadian C-spine), déficit neurológico, febre, imunossupressão, câncer ou dor noturna progressiva = investigar." }),
    P("gota", "Crise de gota (artrite gotosa aguda)", "Trauma / Ortopedia", { alias: "gota acido urico artrite gotosa dedao inchado podagra", cid: [["M10.9", "Gota não especificada"], ["M10.0", "Gota idiopática"]], cls: ["gota_agudo", "analg", "gota_cls"], lab: [AU, CREAT, UREIA, HEMO, PCR, VHS, GLI], comp: [RXPE, RXJOE, CONS], alerta: "Primeira crise com febre ou articulação grande = afastar artrite séptica (punção). Ácido úrico pode estar normal na crise. AINE: evitar em DRC, úlcera, anticoagulado, IC." }),
    P("ferimento", "Ferimento / laceração (sutura e curativo)", "Trauma / Ortopedia", { alias: "ferimento corte laceracao sutura ponto machucado escoriacao", cid: [["T14.1", "Ferimento de região não especificada do corpo"], ["S01.9", "Ferimento na cabeça, parte não especificada"], ["S61.9", "Ferimento do punho e da mão, parte não especificada"]], cls: ["ferida", "analg", "atb_top", "atb_pele"], lab: [], comp: [RXMAO, RXPE], alerta: "Profilaxia antitetânica: use a calculadora. Antibiótico sistêmico só em ferida contaminada, mordedura, fratura exposta ou imunodeprimido. Corpo estranho radiopaco: RX." }),
    P("mordedura", "Mordedura de animal (cão, gato, morcego, outros)", "Trauma / Ortopedia", { alias: "mordida de cachorro mordedura cao gato morcego arranhadura raiva mordida", cid: [["T14.1", "Ferimento de região não especificada do corpo"], ["S61.9", "Ferimento do punho e da mão, parte não especificada"], ["W54", "Mordedura ou golpe provocado por cão (causa externa — CID secundário)"], ["W55", "Mordedura ou golpe provocado por outros mamíferos (causa externa — CID secundário)"]], cls: ["ferida", "atb_mord", "analg"], lab: [], comp: [RXMAO], alerta: "Lavar com água e sabão abundantes. Profilaxia da raiva e do tétano: use as calculadoras. Notificar no SINAN (atendimento antirrábico). Evitar sutura (exceto face, após limpeza e soro)." }),
    P("tce-leve", "Traumatismo cranioencefálico leve (alta)", "Trauma / Ortopedia", { alias: "tce trauma craniano bateu a cabeca queda batida na cabeca concussao", cid: [["S06.0", "Concussão cerebral"], ["S09.9", "Traumatismo não especificado da cabeça"]], cls: ["analg_tce", "antiem", "tce_cls"], lab: [], comp: [RXCRA, CONS], naoUsar: "AAS, anti-inflamatórios, sedativos e álcool nas primeiras 48 horas.", alerta: "Use a regra canadense (≥ 16 anos) ou PECARN (< 16 anos). TC de urgência é por regulação, não APAC. Anticoagulado, ≥ 65 anos ou intoxicado: limiar baixo para TC e observação." }),
    P("constipacao", "Constipação intestinal", "Gastro / Proctologia", { alias: "intestino preso constipacao prisao de ventre nao evacua fecaloma", cid: [["K59.0", "Constipação"]], cls: ["laxante", "habito_int"], lab: [TSH, CA, K, GLI, HEMO], comp: [RXABD, CONS], alerta: "Sinais de alarme: sangue nas fezes, perda de peso, anemia, > 50 anos com mudança do hábito, vômitos/distensão (obstrução). Lactente: retardo na eliminação de mecônio ou distensão = Hirschsprung. Óleo mineral contraindicado < 1 ano." }),
    P("hemorroida", "Doença hemorroidária (crise)", "Gastro / Proctologia", { alias: "hemorroida hemorroidas sangramento anal dor anal mamilo", cid: [["I84.9", "Hemorróidas sem complicação, não especificadas"], ["I84.3", "Hemorróidas externas trombosadas"]], cls: ["hemorroida_cls", "laxante", "habito_int", "analg"], lab: [HEMO], comp: [CONS], alerta: "Trombose externa com < 72 h: excisão alivia mais rápido (cirurgia). Sangramento com anemia, > 45 anos, mudança do hábito ou perda de peso = colonoscopia." }),
    P("fissura-anal", "Fissura anal", "Gastro / Proctologia", { alias: "fissura anal dor para evacuar rasgo no anus sangue vivo no papel", cid: [["K60.2", "Fissura anal, não especificada"]], cls: ["fissura_cls", "laxante", "habito_int", "analg"], lab: [], comp: [CONS], alerta: "Fissura fora da linha média, múltipla ou indolor = investigar (Crohn, IST, HIV, câncer). Sem melhora em 8 semanas = coloproctologia." }),
    P("parasitoses", "Parasitoses intestinais (verminose, giardíase, oxiúros)", "Gastro / Proctologia", { alias: "verme verminose lombriga oxiurus giardia ameba parasita coceira anal estrongiloides", cid: [["B82.9", "Parasitose intestinal não especificada"], ["B77.9", "Ascaridíase não especificada"], ["B80", "Enterobíase"], ["A07.1", "Giardíase (lambliase)"], ["B78.9", "Estrongiloidíase não especificada"]], cls: ["antiparasit", "hig_cls"], lab: [EPF, OXI, LARV, TROF, HEMO], comp: [], alerta: "Estrongiloidíase: tratar antes de corticoide/imunossupressão (risco de hiperinfecção). Gestante: adiar anti-helmíntico para após o 1º trimestre." }),
    P("bronquiolite", "Bronquiolite viral aguda", "Pediatria", { alias: "bronquiolite chiado bebe vsr virus sincicial lactente cansado", cid: [["J21.9", "Bronquiolite aguda não especificada"], ["J21.0", "Bronquiolite aguda devida a vírus sincicial respiratório"]], cls: ["nasal_lact", "analg_febre", "bronq_cls"], lab: [HEMO], comp: [RXTX], naoUsar: "Salbutamol/fenoterol de rotina, corticoide, antibiótico, xarope para tosse, descongestionante nasal e nebulização com soro sem indicação.", alerta: "Internar se < 3 meses (ou < 6 meses prematuro), SpO₂ < 92%, FR > 60, tiragem importante, apneia, ingestão < 50% ou desidratação, cardiopatia/pneumopatia ou cuidador sem condições." }),
    P("crupe", "Laringite viral aguda (crupe)", "Pediatria", { alias: "crupe laringite tosse de cachorro rouquidao estridor", cid: [["J05.0", "Laringite obstrutiva aguda (crupe)"]], cls: ["cortic_crupe", "analg_febre", "crupe_cls"], lab: [], comp: [], alerta: "Dexametasona 0,15–0,6 mg/kg (máx. 16 mg) VO em dose única no PS. Estridor em repouso = nebulização com adrenalina e observação de 2 a 4 h. Febre alta, toxemia, baba, posição em tripé = epiglotite/traqueíte (via aérea)." }),
    P("colica-lactente", "Cólica do lactente", "Pediatria", { alias: "colica do bebe choro excessivo lactente gases recem nascido", cid: [["R10.4", "Outras dores abdominais e as não especificadas"]], cls: ["colica_cls", "colica_med"], lab: [], comp: [], alerta: "Diagnóstico de exclusão: febre, vômitos em jato ou bilioso, recusa alimentar, ganho ponderal ruim, sangue nas fezes, abdome distendido, letargia ou choro súbito inconsolável = investigar (invaginação, ITU, hérnia encarcerada, torção). Avaliar exaustão do cuidador." }),
    P("dermatite-fraldas", "Dermatite da área das fraldas", "Pediatria", { alias: "assadura dermatite de fralda bumbum assado candidiase fralda", cid: [["L22", "Dermatite das fraldas"]], cls: ["fralda_top", "fralda_cls"], lab: [], comp: [], naoUsar: "Corticoide potente, talco e amido de milho; associações com neomicina.", alerta: "Lesões com bolhas, pústulas, crostas melicéricas ou febre = infecção bacteriana. Sem melhora em 2 semanas: rever diagnóstico." }),
    P("febre-crianca", "Febre sem sinais localizatórios (3 meses a 3 anos)", "Pediatria", { alias: "febre crianca bebe febre sem foco febre a esclarecer", cid: [["R50.9", "Febre não especificada"]], cls: ["analg_febre", "febre_cls"], lab: [HEMO, PCR, EAS, URO, ATBG, HEMOC], comp: [RXTX], alerta: "< 3 meses (principalmente < 28 dias) = investigação completa e internação. Toxemia, petéquias, vacinação incompleta (pneumo/Hib) ou febre ≥ 39 °C sem foco: hemograma, PCR, EAS/urocultura por sondagem. Reavaliar em 24–48 h." }),
    P("paroniquia", "Paroníquia / unha encravada inflamada", "Trauma / Ortopedia", { alias: "paroniquia unheiro unha encravada dedo inflamado panaricio", cid: [["L03.0", "Celulite de dedos das mãos e dos pés"], ["L60.0", "Unha encravada"]], cls: ["paron_cls", "atb_pele", "analg"], lab: [GLI], comp: [], alerta: "Coleção purulenta = drenagem. Diabético ou vasculopata: risco de infecção profunda — reavaliar em 48 h. Encaminhar para cantoplastia se recorrente." })
  ];
  novos.forEach(function (p) { p.cid = p.cid.map(function (x) { return [x[0].replace(".", ""), x[1]]; }); DB.protocols.push(p); });
  [EPF, OXI, LARV, TROF, VHS].forEach(function (x) { if (DB.labPS.indexOf(x) < 0) DB.labPS.push(x); });
  [RXTOR, RXPE, RXJOE, RXPUN, RXMAO, RXOMB, RXCOT, RXANT, RXPER, RXCERV, RXCRA, USGART].forEach(function (x) { if (DB.compPS.indexOf(x) < 0) DB.compPS.push(x); });
  DB.etapa = 5;
})();
