/* Base de protocolos do PS — Laudo APAC Express.
   ETAPA 1: formulário (medicamentos adulto/pediátrico), classes, 18 protocolos, exames laboratoriais e complementares.
   Doses pediátricas por peso com teto de dose adulta. Revisão clínica obrigatória antes da prescrição.
   Estrutura:
     drugs[id] = { n, via, ctrl, atb, nota, a:[apresentação adulto], p:{pediátrico} }
     a = { ap, q, via?, pos:[{t, q?}] }
     p = { min (meses), nota, reg:[regimes], f:[formas] }  |  p = { fix:"idade"|"peso", ... }  |  p = { tipo:"jatos"|"hidr" }
     reg = { id, l, mgkg | mgkgdia, h, max, cond, dias:[...], f:[ids de formas permitidas] }
     forma líquida = { id, ap, c (mg/mL), vol (mL do frasco), gt (mg por gota) }   forma sólida = { id, ap, mg, split }
*/
(function () {
  "use strict";
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var L = function (id, ap, c, vol, gt) { return { id: id, ap: ap, c: c, vol: vol, gt: gt, tipo: "liq" }; };
  var C = function (id, ap, mg, split) { return { id: id, ap: ap, mg: mg, split: !!split, tipo: "cp" }; };
  var R = function (id, l, o) { var r = { id: id, l: l }; for (var k in o) r[k] = o[k]; return r; };
  var DOR = "se dor ou febre", DIAS_ATB = [5, 7, 10, 14];

  var drugs = {
    /* ===================== ANALGÉSICOS / ANTITÉRMICOS ===================== */
    dipirona: { n: "Dipirona", nota: "Contraindicada em < 3 meses ou < 5 kg, discrasias sanguíneas e alergia a pirazolonas.",
      a: [A("500 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor ou febre.", "Tomar 2 comprimidos (1 g) de 6 em 6 horas se dor ou febre. Máximo de 8 comprimidos por dia."]),
          A("1 g comprimido", "10 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor ou febre. Máximo de 4 comprimidos por dia.", "Tomar 1 comprimido de 8 em 8 horas se dor ou febre."]),
          A("500 mg/mL solução oral (gotas)", "1 frasco de 20 mL", ["Tomar 40 gotas (1 g) de 6 em 6 horas se dor ou febre.", "Tomar 20 gotas (500 mg) de 6 em 6 horas se dor ou febre."])],
      p: { min: 3, reg: [R("d15", "15 mg/kg/dose de 6/6 h", { mgkg: 15, h: 6, max: 1000, cond: DOR }), R("d25", "25 mg/kg/dose de 6/6 h (dor intensa)", { mgkg: 25, h: 6, max: 1000, cond: DOR })],
           f: [L("gts", "500 mg/mL solução oral (gotas) — 1 gota = 25 mg", 500, 20, 25), L("sol", "50 mg/mL solução oral", 50, 100)] } },
    paracetamol: { n: "Paracetamol", nota: "Dose máxima adulto 4 g/dia (3 g/dia em hepatopatas/etilistas).",
      a: [A("500 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor ou febre.", "Tomar 2 comprimidos (1 g) de 6 em 6 horas se dor ou febre. Máximo de 8 comprimidos por dia."]),
          A("750 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor ou febre. Máximo de 5 comprimidos por dia.", "Tomar 1 comprimido de 8 em 8 horas se dor ou febre."]),
          A("200 mg/mL solução oral (gotas)", "1 frasco de 15 mL", ["Tomar 5 mL (1 g) de 6 em 6 horas se dor ou febre."])],
      p: { min: 0, nota: "< 3 meses: febre exige avaliação médica antes de antitérmico.",
           reg: [R("p10", "10 mg/kg/dose de 6/6 h", { mgkg: 10, h: 6, max: 1000, cond: DOR }), R("p15", "15 mg/kg/dose de 6/6 h", { mgkg: 15, h: 6, max: 1000, cond: DOR })],
           f: [L("gts", "200 mg/mL solução oral (gotas)", 200, 15), L("susp", "32 mg/mL suspensão oral", 32, 60), C("cp500", "500 mg comprimido", 500, true)] } },
    aas: { n: "Ácido acetilsalicílico", nota: "Não usar em < 16 anos (síndrome de Reye), suspeita de dengue, úlcera, anticoagulados ou gestantes no 3º trimestre.",
      a: [A("500 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor ou febre, após as refeições."])] },

    /* ===================== AINEs ===================== */
    ibuprofeno: { n: "Ibuprofeno", nota: "Evitar em suspeita de dengue, desidratação, doença renal, úlcera péptica, gestação (3º tri) e anticoagulados.",
      a: [A("400 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, após as refeições, por 5 dias.", "15 comprimidos"), "Tomar 1 comprimido de 6 em 6 horas se dor ou febre, após as refeições."]),
          A("600 mg comprimido", "15 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas, após as refeições, por 5 dias."]),
          A("50 mg/mL suspensão oral (gotas)", "1 frasco de 30 mL", ["Tomar 8 mL (400 mg) de 8 em 8 horas se dor ou febre."])],
      p: { min: 6, reg: [R("i5", "5 mg/kg/dose de 6/6 h (antitérmico)", { mgkg: 5, h: 6, max: 400, cond: DOR }), R("i10", "10 mg/kg/dose de 8/8 h (dor/anti-inflamatório)", { mgkg: 10, h: 8, max: 400, cond: "se dor", dias: [0, 3, 5] })],
           f: [L("g50", "50 mg/mL suspensão oral (gotas)", 50, 30), L("g100", "100 mg/mL suspensão oral (gotas)", 100, 20), L("s20", "20 mg/mL suspensão oral", 20, 100)] } },
    naproxeno: { n: "Naproxeno", nota: "Evitar em dengue, doença renal, úlcera, anticoagulados.",
      a: [A("250 mg comprimido", "20 comprimidos", ["Tomar 2 comprimidos de 12 em 12 horas, após as refeições, por 5 dias."]),
          A("500 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."]),
          A("550 mg comprimido (naproxeno sódico)", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."])] },
    diclofenaco: { n: "Diclofenaco", nota: "Evitar em dengue, doença renal, cardiopatia isquêmica, úlcera.",
      a: [A("50 mg comprimido (diclofenaco sódico)", "15 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas, após as refeições, por 5 dias.", "Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."]),
          A("50 mg comprimido (diclofenaco potássico)", "15 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas, após as refeições, por 5 dias."]),
          A("100 mg comprimido de liberação prolongada", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, após a refeição, por 5 dias."])],
      p: { min: 12, reg: [R("dc", "0,5 mg/kg/dose de 8/8 h", { mgkg: 0.5, h: 8, max: 50, cond: "se dor", dias: [0, 3, 5] })], f: [L("gts", "15 mg/mL suspensão oral (gotas, diclofenaco potássico)", 15, 20)] } },
    cetoprofeno: { n: "Cetoprofeno", nota: "Evitar em dengue, doença renal, úlcera.",
      a: [A("100 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."]),
          A("150 mg comprimido de liberação prolongada", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, após a refeição, por 5 dias."]),
          A("50 mg cápsula", "15 cápsulas", ["Tomar 1 cápsula de 8 em 8 horas, após as refeições, por 5 dias."])],
      p: { min: 12, reg: [R("k1", "1 mg/kg/dose de 8/8 h", { mgkg: 1, h: 8, max: 50, cond: "se dor", dias: [0, 3, 5] })], f: [L("gts", "20 mg/mL solução oral (gotas)", 20, 20)] } },
    nimesulida: { n: "Nimesulida", nota: "Risco hepatotóxico; uso máximo 15 dias. Não recomendada em crianças.",
      a: [A("100 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."])] },
    meloxicam: { n: "Meloxicam", a: [A("7,5 mg comprimido", "7 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, após a refeição, por 7 dias."]), A("15 mg comprimido", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, após a refeição, por 5 dias."])] },
    piroxicam: { n: "Piroxicam", a: [A("20 mg cápsula", "5 cápsulas", ["Tomar 1 cápsula 1 vez ao dia, após a refeição, por 5 dias."]), A("20 mg comprimido sublingual", "5 comprimidos", ["Dissolver 1 comprimido embaixo da língua 1 vez ao dia por 5 dias."], "Uso sublingual")] },
    tenoxicam: { n: "Tenoxicam", a: [A("20 mg comprimido", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, após a refeição, por 5 dias."])] },
    celecoxibe: { n: "Celecoxibe", nota: "Evitar em cardiopatia isquêmica e alergia a sulfonamidas.", a: [A("200 mg cápsula", "10 cápsulas", ["Tomar 1 cápsula 1 vez ao dia por 10 dias.", "Tomar 1 cápsula de 12 em 12 horas por 5 dias."])] },
    etoricoxibe: { n: "Etoricoxibe", nota: "Evitar em HAS não controlada e cardiopatia.", a: [A("60 mg comprimido", "7 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 7 dias."]), A("90 mg comprimido", "7 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 7 dias."]), A("120 mg comprimido", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por até 5 dias (crise aguda)."])] },
    aceclofenaco: { n: "Aceclofenaco", a: [A("100 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, após as refeições, por 5 dias."])] },
    cetorolaco: { n: "Cetorolaco de trometamol", nota: "Uso máximo 5 dias.", a: [A("10 mg comprimido sublingual", "10 comprimidos", ["Dissolver 1 comprimido embaixo da língua de 8 em 8 horas se dor, por até 5 dias.", "Dissolver 1 comprimido embaixo da língua de 6 em 6 horas se dor, por até 5 dias."], "Uso sublingual")] },

    /* ===================== OPIOIDES FRACOS (controle especial) ===================== */
    tramadol: { n: "Tramadol", ctrl: true, nota: "Contraindicado em < 12 anos. Risco de convulsão e síndrome serotoninérgica com ISRS/tricíclicos.",
      a: [A("50 mg cápsula", "15 cápsulas", ["Tomar 1 cápsula de 8 em 8 horas se dor forte, por até 5 dias.", "Tomar 1 cápsula de 6 em 6 horas se dor forte, por até 5 dias."]),
          A("100 mg/mL solução oral (gotas)", "1 frasco de 10 mL", ["Tomar 20 gotas (50 mg) de 8 em 8 horas se dor forte, por até 5 dias."])] },
    codeina_paracetamol: { n: "Codeína + paracetamol", ctrl: true, nota: "Contraindicado em < 12 anos.", a: [A("30 mg + 500 mg comprimido", "12 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor forte, por até 3 dias.", "Tomar 1 comprimido de 8 em 8 horas se dor forte, por até 4 dias."])] },
    codeina: { n: "Fosfato de codeína", ctrl: true, nota: "Contraindicado em < 12 anos.", a: [A("30 mg comprimido", "12 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor forte, por até 3 dias."])] },

    /* ===================== RELAXANTES MUSCULARES ===================== */
    ciclobenzaprina: { n: "Ciclobenzaprina", nota: "Sonolência; evitar com álcool, em idosos e com IMAO.", a: [A("5 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido à noite por 10 dias.", "Tomar 1 comprimido de 8 em 8 horas por 5 dias."]), A("10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido à noite por 10 dias."])] },
    orfenadrina_comb: { n: "Orfenadrina + dipirona + cafeína", a: [A("35 mg + 300 mg + 50 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se dor.", "Tomar 2 comprimidos de 8 em 8 horas se dor, por até 5 dias."])] },
    carisoprodol_comb: { n: "Carisoprodol + paracetamol + diclofenaco + cafeína", nota: "Contém AINE — evitar em dengue e doença renal.", a: [A("125 mg + 300 mg + 50 mg + 30 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas por 5 dias."])] },
    tizanidina: { n: "Tizanidina", nota: "Hipotensão e sonolência.", a: [A("2 mg comprimido", "15 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas por 5 dias."])] },
    baclofeno: { n: "Baclofeno", a: [A("10 mg comprimido", "15 comprimidos", ["Tomar meio comprimido de 8 em 8 horas por 2 dias, depois 1 comprimido de 8 em 8 horas até completar 7 dias."])] },

    /* ===================== ANTIESPASMÓDICOS ===================== */
    escopolamina: { n: "Butilbrometo de escopolamina", nota: "Evitar em glaucoma de ângulo fechado, retenção urinária e íleo.",
      a: [A("10 mg drágea", "20 drágeas", ["Tomar 1 drágea de 8 em 8 horas se dor em cólica.", "Tomar 2 drágeas de 8 em 8 horas se dor em cólica."]), A("10 mg/mL solução oral (gotas)", "1 frasco de 20 mL", ["Tomar 20 gotas (10 mg) de 8 em 8 horas se dor em cólica."])],
      p: { min: 12, nota: "Dose habitual 0,3–0,6 mg/kg/dose.", reg: [R("e", "0,5 mg/kg/dose de 8/8 h", { mgkg: 0.5, h: 8, max: 10, cond: "se dor em cólica" })], f: [L("gts", "10 mg/mL solução oral (gotas) — 1 gota = 0,5 mg", 10, 20, 0.5)] } },
    escopolamina_dipirona: { n: "Butilbrometo de escopolamina + dipirona", a: [A("10 mg + 250 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas se dor em cólica.", "Tomar 2 comprimidos de 8 em 8 horas se dor em cólica."])] },
    simeticona: { n: "Simeticona", a: [A("40 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas, após as refeições."]), A("125 mg cápsula", "10 cápsulas", ["Tomar 1 cápsula de 8 em 8 horas, após as refeições, se gases."])] },

    /* ===================== ANTIEMÉTICOS / PROCINÉTICOS ===================== */
    ondansetrona: { n: "Ondansetrona", nota: "Cuidado com QT longo. Constipação.",
      a: [A("4 mg comprimido orodispersível", "10 comprimidos", ["Dissolver 1 comprimido na boca de 8 em 8 horas se enjoo ou vômito."]), A("8 mg comprimido orodispersível", "10 comprimidos", ["Dissolver 1 comprimido na boca de 8 em 8 horas se enjoo ou vômito."]), A("8 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas se enjoo ou vômito."])],
      p: { min: 6, reg: [R("o", "0,15 mg/kg/dose de 8/8 h", { mgkg: 0.15, h: 8, max: 8, tol: 0.7, cond: "se enjoo ou vômito" })], f: [C("od4", "4 mg comprimido orodispersível", 4, true)] } },
    metoclopramida: { n: "Metoclopramida", nota: "Risco extrapiramidal; uso máximo 5 dias. Contraindicada em < 1 ano; evitar em < 18 anos.",
      a: [A("10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas se enjoo ou vômito, por até 5 dias."])] },
    bromoprida: { n: "Bromoprida", nota: "Risco extrapiramidal.",
      a: [A("10 mg cápsula", "10 cápsulas", ["Tomar 1 cápsula de 8 em 8 horas se enjoo ou vômito."])],
      p: { min: 12, reg: [R("b", "0,25 mg/kg/dose de 8/8 h", { mgkg: 0.25, h: 8, max: 10, cond: "se enjoo ou vômito" })], f: [L("gts", "4 mg/mL solução oral (gotas)", 4, 20), L("sol", "1 mg/mL solução oral", 1, 120)] } },
    dimenidrinato: { n: "Dimenidrinato + piridoxina", nota: "Sonolência.",
      a: [A("50 mg + 10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido de 6 em 6 horas se enjoo ou vômito. Máximo de 8 por dia."])],
      p: { min: 24, reg: [R("dm", "1,25 mg/kg/dose de 6/6 h", { mgkg: 1.25, h: 6, max: 25, cond: "se enjoo ou vômito" })], f: [L("gts", "25 mg/mL solução oral (gotas)", 25, 20)] } },
    domperidona: { n: "Domperidona", nota: "Cuidado com QT longo; máximo 30 mg/dia em adultos.",
      a: [A("10 mg comprimido", "21 comprimidos", ["Tomar 1 comprimido 15 a 30 minutos antes do café, almoço e jantar, por 7 dias."])],
      p: { min: 12, reg: [R("dp", "0,25 mg/kg/dose de 8/8 h, antes das refeições", { mgkg: 0.25, h: 8, max: 10, cond: "antes das refeições", dias: [5, 7] })], f: [L("susp", "1 mg/mL suspensão oral", 1, 100)] } },

    /* ===================== PROTEÇÃO GÁSTRICA / ANTIÁCIDOS ===================== */
    omeprazol: { n: "Omeprazol", a: [A("20 mg cápsula", "28 cápsulas", [T("Tomar 1 cápsula pela manhã, em jejum, 30 minutos antes do café, por 14 dias.", "14 cápsulas"), "Tomar 1 cápsula pela manhã, em jejum, por 28 dias.", T("Tomar 1 cápsula em jejum e 1 antes do jantar por 14 dias.", "28 cápsulas")]), A("40 mg cápsula", "28 cápsulas", ["Tomar 1 cápsula pela manhã, em jejum, por 28 dias."])],
      p: { min: 12, nota: "Cápsula pode ser aberta e misturada em alimento pastoso ácido.", reg: [R("om", "1 mg/kg/dia 1 vez ao dia", { mgkg: 1, h: 24, max: 20, cond: "em jejum", dias: [14, 28] })], f: [C("c10", "10 mg cápsula", 10, false), C("c20", "20 mg cápsula", 20, false)] } },
    pantoprazol: { n: "Pantoprazol", a: [A("20 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido pela manhã, em jejum, por 28 dias."]), A("40 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido pela manhã, em jejum, por 14 dias.", "14 comprimidos"), "Tomar 1 comprimido pela manhã, em jejum, por 28 dias."])] },
    esomeprazol: { n: "Esomeprazol", a: [A("20 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido pela manhã, em jejum, por 28 dias."]), A("40 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido pela manhã, em jejum, por 28 dias."])] },
    lansoprazol: { n: "Lansoprazol", a: [A("15 mg cápsula", "28 cápsulas", ["Tomar 1 cápsula pela manhã, em jejum, por 28 dias."]), A("30 mg cápsula", "28 cápsulas", ["Tomar 1 cápsula pela manhã, em jejum, por 28 dias."])] },
    rabeprazol: { n: "Rabeprazol", a: [A("10 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido pela manhã, em jejum, por 28 dias."]), A("20 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido pela manhã, em jejum, por 28 dias."])] },
    famotidina: { n: "Famotidina", a: [A("20 mg comprimido", "28 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas por 14 dias."]), A("40 mg comprimido", "14 comprimidos", ["Tomar 1 comprimido à noite, ao deitar, por 14 dias."])] },
    antiacido: { n: "Hidróxido de alumínio + hidróxido de magnésio + simeticona", nota: "Separar 2 horas de outros medicamentos.", a: [A("suspensão oral", "1 frasco de 240 mL", ["Tomar 10 mL 1 hora após as refeições e ao deitar, se queimação."])] },
    sucralfato: { n: "Sucralfato", nota: "Separar 2 horas de outros medicamentos.", a: [A("1 g comprimido", "28 comprimidos", ["Tomar 1 comprimido 1 hora antes do café, do almoço, do jantar e ao deitar, por 7 dias."])] },

    /* ===================== DIARREIA / HIDRATAÇÃO ===================== */
    sro: { n: "Sais para reidratação oral",
      a: [A("envelope (pó para 1 litro)", "6 envelopes", ["Dissolver 1 envelope em 1 litro de água filtrada e beber ao longo do dia, além de beber 1 copo após cada evacuação líquida ou vômito."])],
      p: { fix: "idade", ap: "envelope (pó para 1 litro)", q: "6 envelopes", faixas: [
        { ate: 12, t: "Dissolver 1 envelope em 1 litro de água filtrada. Oferecer 50 a 100 mL após cada evacuação líquida ou vômito, em pequenos goles, e manter o aleitamento." },
        { ate: 120, t: "Dissolver 1 envelope em 1 litro de água filtrada. Oferecer 100 a 200 mL após cada evacuação líquida ou vômito, em pequenos goles." },
        { ate: 9999, t: "Dissolver 1 envelope em 1 litro de água filtrada. Beber à vontade após cada evacuação líquida ou vômito." }] } },
    racecadotrila: { n: "Racecadotrila",
      a: [A("100 mg cápsula", "15 cápsulas", ["Tomar 1 cápsula de 8 em 8 horas até parar a diarreia, por no máximo 7 dias."])],
      p: { min: 3, reg: [R("rc", "1,5 mg/kg/dose de 8/8 h", { mgkg: 1.5, h: 8, max: 100, cond: "até parar a diarreia (máximo 7 dias)" })], f: [C("s10", "10 mg granulado (sachê)", 10, false), C("s30", "30 mg granulado (sachê)", 30, false)] } },
    loperamida: { n: "Loperamida", nota: "Não usar com febre, sangue ou pus nas fezes. Contraindicada em crianças.", a: [A("2 mg comprimido", "12 comprimidos", ["Tomar 2 comprimidos após a primeira evacuação líquida e 1 comprimido após cada evacuação líquida seguinte. Máximo de 8 comprimidos por dia, por até 2 dias."])] },
    zinco: { n: "Sulfato de zinco", p: { fix: "idade", ap: "solução oral (conforme apresentação disponível)", q: "1 frasco", faixas: [
        { ate: 6, t: "Dar 10 mg de zinco elementar 1 vez ao dia por 10 dias (volume conforme a apresentação)." },
        { ate: 9999, t: "Dar 20 mg de zinco elementar 1 vez ao dia por 10 dias (volume conforme a apresentação)." }] } },
    boulardii: { n: "Saccharomyces boulardii", a: [A("200 mg cápsula", "10 cápsulas", ["Tomar 1 cápsula de 12 em 12 horas por 5 dias."])],
      p: { fix: "idade", ap: "200 mg pó para suspensão oral (envelope)", q: "10 envelopes", faixas: [{ ate: 9999, t: "Dissolver 1 envelope em água ou leite e dar de 12 em 12 horas por 5 dias." }] } },

    /* ===================== ANTIMICROBIANOS ===================== */
    amoxicilina: { n: "Amoxicilina", atb: true, nota: "Alergia a penicilinas: usar macrolídeo.",
      a: [A("500 mg cápsula", "21 cápsulas", [T("Tomar 1 cápsula de 8 em 8 horas por 7 dias.", "21 cápsulas"), T("Tomar 1 cápsula de 8 em 8 horas por 10 dias.", "30 cápsulas"), T("Tomar 1 cápsula de 8 em 8 horas por 5 dias.", "15 cápsulas")]),
          A("875 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 10 dias.", "20 comprimidos")]),
          A("500 mg cápsula — dose alta (1 g)", "42 cápsulas", [T("Tomar 2 cápsulas (1 g) de 8 em 8 horas por 7 dias.", "42 cápsulas"), T("Tomar 2 cápsulas (1 g) de 8 em 8 horas por 5 dias.", "30 cápsulas")])],
      p: { min: 0, reg: [
        R("a50", "50 mg/kg/dia ÷ 8/8 h", { mgkgdia: 50, h: 8, max: 500, dias: [10, 7, 5] }),
        R("a50b", "50 mg/kg/dia ÷ 12/12 h", { mgkgdia: 50, h: 12, max: 1000, dias: [10, 7, 5] }),
        R("a90", "90 mg/kg/dia ÷ 12/12 h (dose alta: OMA, sinusite, pneumonia)", { mgkgdia: 90, h: 12, max: 2000, dias: [10, 7, 5] })],
        f: [L("s250", "250 mg/5 mL suspensão oral", 50, 150), L("s400", "400 mg/5 mL suspensão oral", 80, 100), L("s500", "500 mg/5 mL suspensão oral", 100, 150)] } },
    amoxclav: { n: "Amoxicilina + clavulanato de potássio", atb: true, nota: "Dose pediátrica calculada pela amoxicilina. Diarreia frequente.",
      a: [A("875 mg + 125 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 10 dias.", "20 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, no início da refeição, por 14 dias.", "28 comprimidos")]),
          A("500 mg + 125 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, no início da refeição, por 7 dias.", "21 comprimidos")])],
      p: { min: 3, reg: [
        R("c45", "45 mg/kg/dia ÷ 12/12 h (apresentação BD)", { mgkgdia: 45, h: 12, max: 875, dias: [10, 7, 5], f: ["bd400"] }),
        R("c90", "90 mg/kg/dia ÷ 12/12 h (apresentação ES-600)", { mgkgdia: 90, h: 12, max: 2000, dias: [10, 7], f: ["es600"] }),
        R("c40", "40 mg/kg/dia ÷ 8/8 h", { mgkgdia: 40, h: 8, max: 500, dias: [10, 7, 5], f: ["s250"] })],
        f: [L("bd400", "400 mg + 57 mg/5 mL suspensão oral (BD)", 80, 70), L("es600", "600 mg + 42,9 mg/5 mL suspensão oral (ES-600)", 120, 100), L("s250", "250 mg + 62,5 mg/5 mL suspensão oral", 50, 75)] } },
    cefalexina: { n: "Cefalexina", atb: true,
      a: [A("500 mg cápsula", "28 cápsulas", [T("Tomar 1 cápsula de 6 em 6 horas por 7 dias.", "28 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 10 dias.", "40 cápsulas"), T("Tomar 1 cápsula de 12 em 12 horas por 10 dias (faringite).", "20 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 5 dias.", "20 cápsulas")])],
      p: { min: 0, reg: [R("x50", "50 mg/kg/dia ÷ 6/6 h", { mgkgdia: 50, h: 6, max: 500, dias: [7, 10, 5] }), R("x100", "100 mg/kg/dia ÷ 6/6 h (infecção mais grave)", { mgkgdia: 100, h: 6, max: 1000, dias: [7, 10] })],
           f: [L("s250", "250 mg/5 mL suspensão oral", 50, 100)] } },
    cefadroxila: { n: "Cefadroxila", atb: true,
      a: [A("500 mg cápsula", "20 cápsulas", [T("Tomar 1 cápsula de 12 em 12 horas por 10 dias.", "20 cápsulas"), T("Tomar 1 cápsula de 12 em 12 horas por 7 dias.", "14 cápsulas")]), A("1 g comprimido", "10 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 10 dias.", "10 comprimidos")])],
      p: { min: 0, reg: [R("cd", "30 mg/kg/dia ÷ 12/12 h", { mgkgdia: 30, h: 12, max: 1000, dias: [10, 7] })], f: [L("s250", "250 mg/5 mL suspensão oral", 50, 100), L("s500", "500 mg/5 mL suspensão oral", 100, 100)] } },
    cefuroxima: { n: "Cefuroxima (axetil)", atb: true,
      a: [A("500 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, após a refeição, por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, após a refeição, por 10 dias.", "20 comprimidos")]), A("250 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, após a refeição, por 7 dias.", "14 comprimidos")])],
      p: { min: 3, reg: [R("cf", "30 mg/kg/dia ÷ 12/12 h", { mgkgdia: 30, h: 12, max: 500, dias: [10, 7, 5] })], f: [L("s250", "250 mg/5 mL suspensão oral", 50, 50)] } },
    azitromicina: { n: "Azitromicina", atb: true,
      a: [A("500 mg comprimido", "3 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 3 dias.", "3 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia por 5 dias.", "5 comprimidos"), T("Tomar 1 comprimido no 1º dia e meio comprimido 1 vez ao dia do 2º ao 5º dia.", "3 comprimidos")])],
      p: { min: 6, reg: [R("z10", "10 mg/kg/dia 1 vez ao dia", { mgkgdia: 10, h: 24, max: 500, dias: [3, 5] }), R("z12", "12 mg/kg/dia 1 vez ao dia (faringite estreptocócica)", { mgkgdia: 12, h: 24, max: 500, dias: [5] })],
           f: [L("s200", "200 mg/5 mL suspensão oral", 40, 15), L("s200b", "200 mg/5 mL suspensão oral (frasco 22,5 mL)", 40, 22.5)] } },
    claritromicina: { n: "Claritromicina", atb: true, nota: "Muitas interações (estatinas, anticoagulantes, QT).",
      a: [A("500 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 10 dias.", "20 comprimidos")])],
      p: { min: 6, reg: [R("cl", "15 mg/kg/dia ÷ 12/12 h", { mgkgdia: 15, h: 12, max: 500, dias: [10, 7, 5] })], f: [L("s125", "125 mg/5 mL suspensão oral", 25, 60), L("s250", "250 mg/5 mL suspensão oral", 50, 60)] } },
    penicilina_benzatina: { n: "Benzilpenicilina benzatina", atb: true, via: "Uso intramuscular", nota: "Aplicar em serviço de saúde. Alergia a penicilina: contraindicada.",
      a: [A("1.200.000 UI pó para suspensão injetável", "1 frasco-ampola", ["Aplicar 1.200.000 UI por via intramuscular profunda, dose única."], "Uso intramuscular")],
      p: { fix: "peso", via: "Uso intramuscular", ap: "pó para suspensão injetável", q: "1 frasco-ampola", faixas: [
        { ate: 27, t: "Aplicar 600.000 UI por via intramuscular profunda, dose única.", ap: "600.000 UI pó para suspensão injetável" },
        { ate: 999, t: "Aplicar 1.200.000 UI por via intramuscular profunda, dose única.", ap: "1.200.000 UI pó para suspensão injetável" }] } },
    clindamicina: { n: "Clindamicina", atb: true, nota: "Risco de colite por C. difficile.", a: [A("300 mg cápsula", "30 cápsulas", [T("Tomar 1 cápsula de 8 em 8 horas por 10 dias.", "30 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 7 dias.", "28 cápsulas")])] },
    doxiciclina: { n: "Doxiciclina", atb: true, nota: "Contraindicada em < 8 anos e gestantes. Tomar com água, sem deitar em seguida.",
      a: [A("100 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 5 dias.", "10 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 10 dias.", "20 comprimidos")])],
      p: { min: 96, reg: [R("dx", "2,2 mg/kg/dose de 12/12 h", { mgkg: 2.2, h: 12, max: 100, dias: [7, 5, 10] })], f: [C("c100", "100 mg comprimido", 100, true)] } },
    smx_tmp: { n: "Sulfametoxazol + trimetoprima", atb: true, nota: "Dose pediátrica pelo trimetoprima. Evitar em < 2 meses, G6PD, gestação (1º e 3º tri).",
      a: [A("800 mg + 160 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 3 dias.", "6 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 14 dias.", "28 comprimidos")])],
      p: { min: 2, reg: [R("st", "8 mg/kg/dia de trimetoprima ÷ 12/12 h", { mgkgdia: 8, h: 12, max: 160, dias: [7, 10, 3, 14] })], f: [L("susp", "200 mg + 40 mg/5 mL suspensão oral (dose em trimetoprima: 8 mg/mL)", 8, 100)] } },
    ciprofloxacino: { n: "Ciprofloxacino", atb: true, nota: "Evitar em < 18 anos, gestantes; risco de tendinopatia. Separar de antiácidos e laticínios.",
      a: [A("500 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 3 dias.", "6 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 10 dias.", "20 comprimidos")]), A("250 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 3 dias.", "6 comprimidos")])] },
    levofloxacino: { n: "Levofloxacino", atb: true, nota: "Evitar em < 18 anos, gestantes; QT longo, tendinopatia.",
      a: [A("500 mg comprimido", "7 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 7 dias.", "7 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia por 10 dias.", "10 comprimidos")]), A("750 mg comprimido", "5 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 5 dias.", "5 comprimidos")])] },
    nitrofurantoina: { n: "Nitrofurantoína", atb: true, nota: "Não usar se TFG < 30 mL/min, no termo da gestação ou em pielonefrite.",
      a: [A("100 mg cápsula", "20 cápsulas", [T("Tomar 1 cápsula de 6 em 6 horas por 5 dias.", "20 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 7 dias.", "28 cápsulas")])],
      p: { min: 1, reg: [R("nf", "1,5 mg/kg/dose de 6/6 h", { mgkg: 1.5, h: 6, max: 100, dias: [7, 5, 10] })], f: [L("susp", "5 mg/mL suspensão oral", 5, 120)] } },
    fosfomicina: { n: "Fosfomicina trometamol", atb: true, a: [A("3 g granulado (envelope)", "1 envelope", ["Dissolver 1 envelope em meio copo de água e tomar em dose única, à noite, após esvaziar a bexiga."])] },
    ceftriaxona: { n: "Ceftriaxona", atb: true, via: "Uso intramuscular", nota: "Aplicar em serviço de saúde (diluir em lidocaína para IM).",
      a: [A("1 g pó para solução injetável", "1 frasco-ampola", ["Aplicar 1 g por via intramuscular, dose única no pronto-socorro.", T("Aplicar 1 g por via intramuscular 1 vez ao dia por 3 dias.", "3 frascos-ampola")], "Uso intramuscular")],
      p: { min: 1, nota: "Evitar em neonatos com hiperbilirrubinemia e junto a cálcio IV.", reg: [R("ct", "50 mg/kg/dia IM 1 vez ao dia", { mgkgdia: 50, h: 24, max: 1000, dias: [1, 3], via: "Uso intramuscular" })], f: [L("im", "1 g pó para solução injetável (1 g + 3,5 mL de lidocaína 1% ≈ 250 mg/mL)", 250, 4)] } },
    oseltamivir: { n: "Fosfato de oseltamivir", nota: "Indicado em síndrome gripal com fator de risco ou SRAG, idealmente nas primeiras 48 h.",
      a: [A("75 mg cápsula", "10 cápsulas", ["Tomar 1 cápsula de 12 em 12 horas por 5 dias."])],
      p: { fix: "peso", ap: "cápsula", q: "10 cápsulas", faixas: [
        { ate: 15, t: "Dar 1 cápsula de 30 mg de 12 em 12 horas por 5 dias (a cápsula pode ser aberta e misturada em alimento doce).", ap: "30 mg cápsula" },
        { ate: 23, t: "Dar 1 cápsula de 45 mg de 12 em 12 horas por 5 dias (a cápsula pode ser aberta e misturada em alimento doce).", ap: "45 mg cápsula" },
        { ate: 40, t: "Dar 2 cápsulas de 30 mg (60 mg) de 12 em 12 horas por 5 dias.", ap: "30 mg cápsula", q: "20 cápsulas" },
        { ate: 999, t: "Tomar 1 cápsula de 75 mg de 12 em 12 horas por 5 dias.", ap: "75 mg cápsula" }],
        menor1ano: "< 1 ano: 3 mg/kg/dose de 12/12 h por 5 dias (0–8 meses) ou 3,5 mg/kg/dose (9–11 meses) — preparar a partir da cápsula conforme protocolo do MS." } },

    /* ===================== ANTI-HISTAMÍNICOS ===================== */
    loratadina: { n: "Loratadina", a: [A("10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias.", "Tomar 1 comprimido 1 vez ao dia por 5 dias."])],
      p: { fix: "peso", min: 24, ap: "1 mg/mL xarope", q: "1 frasco de 100 mL", faixas: [{ ate: 30, t: "Dar 5 mL (5 mg) 1 vez ao dia por 7 dias." }, { ate: 999, t: "Dar 10 mL (10 mg) 1 vez ao dia por 7 dias." }] } },
    desloratadina: { n: "Desloratadina", a: [A("5 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias."])],
      p: { fix: "idade", min: 6, ap: "0,5 mg/mL xarope", q: "1 frasco de 60 mL", faixas: [{ ate: 12, t: "Dar 2 mL (1 mg) 1 vez ao dia por 7 dias." }, { ate: 72, t: "Dar 2,5 mL (1,25 mg) 1 vez ao dia por 7 dias." }, { ate: 144, t: "Dar 5 mL (2,5 mg) 1 vez ao dia por 7 dias." }, { ate: 9999, t: "Dar 10 mL (5 mg) 1 vez ao dia por 7 dias." }] } },
    cetirizina: { n: "Dicloridrato de cetirizina", a: [A("10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, à noite, por 10 dias."])],
      p: { fix: "idade", min: 24, ap: "1 mg/mL solução oral", q: "1 frasco de 120 mL", faixas: [{ ate: 72, t: "Dar 2,5 mL (2,5 mg) de 12 em 12 horas por 7 dias." }, { ate: 144, t: "Dar 5 mL (5 mg) de 12 em 12 horas por 7 dias." }, { ate: 9999, t: "Dar 10 mL (10 mg) 1 vez ao dia por 7 dias." }] } },
    levocetirizina: { n: "Dicloridrato de levocetirizina", a: [A("5 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias."])],
      p: { fix: "idade", min: 24, ap: "5 mg/mL solução oral (gotas) — 1 gota = 0,25 mg", q: "1 frasco de 20 mL", faixas: [{ ate: 72, t: "Dar 5 gotas (1,25 mg) de 12 em 12 horas por 7 dias." }, { ate: 9999, t: "Dar 20 gotas (5 mg) 1 vez ao dia por 7 dias." }] } },
    fexofenadina: { n: "Cloridrato de fexofenadina", a: [A("120 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias."]), A("180 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias."])],
      p: { fix: "idade", min: 6, ap: "6 mg/mL suspensão oral", q: "1 frasco de 60 mL", faixas: [{ ate: 24, t: "Dar 2,5 mL (15 mg) de 12 em 12 horas por 7 dias." }, { ate: 144, t: "Dar 5 mL (30 mg) de 12 em 12 horas por 7 dias." }, { ate: 9999, t: "Tomar 1 comprimido de 120 mg 1 vez ao dia por 7 dias.", ap: "120 mg comprimido", q: "7 comprimidos" }] } },
    bilastina: { n: "Bilastina", a: [A("20 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, em jejum, por 10 dias."])],
      p: { fix: "idade", min: 72, ap: "10 mg comprimido orodispersível", q: "10 comprimidos", faixas: [{ ate: 144, t: "Dissolver 1 comprimido de 10 mg na boca 1 vez ao dia por 7 dias (crianças com 20 kg ou mais)." }, { ate: 9999, t: "Tomar 1 comprimido de 20 mg 1 vez ao dia, em jejum, por 7 dias.", ap: "20 mg comprimido" }] } },
    ebastina: { n: "Ebastina", a: [A("10 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido 1 vez ao dia por 10 dias."])],
      p: { fix: "idade", min: 24, ap: "1 mg/mL xarope", q: "1 frasco de 60 mL", faixas: [{ ate: 72, t: "Dar 2,5 mL (2,5 mg) 1 vez ao dia por 7 dias." }, { ate: 144, t: "Dar 5 mL (5 mg) 1 vez ao dia por 7 dias." }, { ate: 9999, t: "Dar 10 mL (10 mg) 1 vez ao dia por 7 dias." }] } },
    dexclorfeniramina: { n: "Maleato de dexclorfeniramina", nota: "Sedativo; evitar em < 2 anos.",
      a: [A("2 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas se coceira, por até 7 dias.", "Tomar 1 comprimido à noite se coceira."])],
      p: { min: 24, reg: [R("dx", "0,05 mg/kg/dose de 8/8 h", { mgkg: 0.05, h: 8, max: 2, cond: "se coceira", dias: [0, 5, 7] })], f: [L("xp", "2 mg/5 mL solução oral (0,4 mg/mL)", 0.4, 100)] } },
    hidroxizina: { n: "Cloridrato de hidroxizina", nota: "Sedativo; QT longo.",
      a: [A("25 mg comprimido", "20 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas se coceira.", "Tomar 1 comprimido à noite se coceira."])],
      p: { min: 24, reg: [R("hx", "0,5 mg/kg/dose de 8/8 h", { mgkg: 0.5, h: 8, max: 25, cond: "se coceira" })], f: [L("xp", "2 mg/mL solução oral", 2, 120)] } },
    prometazina: { n: "Cloridrato de prometazina", nota: "Contraindicada em < 2 anos. Sedação importante.", a: [A("25 mg comprimido", "10 comprimidos", ["Tomar 1 comprimido à noite se coceira ou alergia.", "Tomar 1 comprimido de 12 em 12 horas se coceira, por até 5 dias."])] },

    /* ===================== CORTICOIDES ===================== */
    prednisona: { n: "Prednisona", nota: "Tomar pela manhã, após o café. Cuidado em diabetes e HAS.",
      a: [A("20 mg comprimido", "10 comprimidos", [T("Tomar 2 comprimidos (40 mg) 1 vez ao dia, pela manhã, por 5 dias.", "10 comprimidos"), T("Tomar 1 comprimido (20 mg) 1 vez ao dia, pela manhã, por 5 dias.", "5 comprimidos"), T("Tomar 3 comprimidos (60 mg) 1 vez ao dia, pela manhã, por 5 dias.", "15 comprimidos")]),
          A("5 mg comprimido", "20 comprimidos", [T("Tomar 4 comprimidos (20 mg) 1 vez ao dia, pela manhã, por 5 dias.", "20 comprimidos")])],
      p: { min: 0, reg: [R("pn1", "1 mg/kg/dia 1 vez ao dia", { mgkg: 1, h: 24, max: 40, cond: "pela manhã", dias: [5, 3] }), R("pn2", "2 mg/kg/dia 1 vez ao dia (crise de asma)", { mgkg: 2, h: 24, max: 40, cond: "pela manhã", dias: [5, 3] })], f: [C("c5", "5 mg comprimido", 5, true), C("c20", "20 mg comprimido", 20, true)] } },
    prednisolona: { n: "Prednisolona", nota: "Tomar pela manhã.",
      a: [A("20 mg comprimido", "10 comprimidos", [T("Tomar 2 comprimidos (40 mg) 1 vez ao dia, pela manhã, por 5 dias.", "10 comprimidos")]), A("40 mg comprimido", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, pela manhã, por 5 dias."])],
      p: { min: 0, reg: [R("pl1", "1 mg/kg/dia 1 vez ao dia", { mgkg: 1, h: 24, max: 40, cond: "pela manhã", dias: [5, 3] }), R("pl2", "2 mg/kg/dia 1 vez ao dia (crise de asma)", { mgkg: 2, h: 24, max: 40, cond: "pela manhã", dias: [5, 3] })],
           f: [L("s3", "3 mg/mL solução oral", 3, 60), L("s1", "1 mg/mL solução oral", 1, 120)] } },
    dexametasona: { n: "Dexametasona",
      a: [A("4 mg comprimido", "5 comprimidos", ["Tomar 1 comprimido 1 vez ao dia, pela manhã, por 5 dias.", T("Tomar 4 comprimidos (16 mg) em dose única.", "4 comprimidos")])],
      p: { min: 0, reg: [R("dx6", "0,6 mg/kg dose única diária (máx. 16 mg)", { mgkg: 0.6, h: 24, max: 16, cond: "pela manhã", dias: [1, 2] }), R("dx15", "0,15 mg/kg dose única", { mgkg: 0.15, h: 24, max: 10, dias: [1] })],
           f: [L("el", "0,1 mg/mL elixir", 0.1, 120), C("c4", "4 mg comprimido", 4, true), C("c05", "0,5 mg comprimido", 0.5, false)] } },

    /* ===================== BRONCODILATADORES / CONTROLE DA ASMA ===================== */
    salbutamol: { n: "Sulfato de salbutamol", via: "Uso inalatório",
      a: [A("100 mcg/jato aerossol", "1 frasco (200 jatos)", ["Inalar 4 jatos com espaçador de 4 em 4 horas nas primeiras 48 horas; depois, 4 jatos de 6 em 6 horas se tosse, chiado ou falta de ar.", "Inalar 2 jatos com espaçador de 6 em 6 horas se chiado ou falta de ar."], "Uso inalatório")],
      p: { tipo: "jatos", via: "Uso inalatório", ap: "100 mcg/jato aerossol (usar com espaçador e máscara)", q: "1 frasco (200 jatos)", porKg: 3, min: 2, max: 10,
           t: "jatos com espaçador de 4 em 4 horas nas primeiras 48 horas; depois, de 6 em 6 horas se tosse, chiado ou falta de ar." } },
    fenoterol: { n: "Bromidrato de fenoterol", via: "Uso inalatório", nota: "Preferir aerossol com espaçador quando possível.",
      a: [A("5 mg/mL solução para nebulização", "1 frasco de 20 mL", ["Nebulizar 10 gotas em 3 a 5 mL de soro fisiológico 0,9% de 6 em 6 horas se falta de ar."], "Uso inalatório")],
      p: { tipo: "gotasKg", via: "Uso inalatório", ap: "5 mg/mL solução para nebulização", q: "1 frasco de 20 mL", porKg: 3, min: 2, max: 8, t: "em 3 a 5 mL de soro fisiológico 0,9%, nebulizar de 6 em 6 horas se falta de ar." } },
    beclometasona: { n: "Dipropionato de beclometasona", via: "Uso inalatório", nota: "Enxaguar a boca após o uso.",
      a: [A("250 mcg/jato aerossol", "1 frasco (200 jatos)", ["Inalar 1 jato com espaçador de 12 em 12 horas, uso contínuo até reavaliação."], "Uso inalatório"), A("50 mcg/jato aerossol", "1 frasco (200 jatos)", ["Inalar 2 jatos com espaçador de 12 em 12 horas, uso contínuo até reavaliação."], "Uso inalatório")],
      p: { fix: "idade", via: "Uso inalatório", ap: "50 mcg/jato aerossol (com espaçador e máscara)", q: "1 frasco (200 jatos)", faixas: [{ ate: 144, t: "Inalar 2 jatos (100 mcg) com espaçador de 12 em 12 horas, uso contínuo até a consulta de acompanhamento." }, { ate: 9999, t: "Inalar 4 jatos (200 mcg) com espaçador de 12 em 12 horas, uso contínuo até a consulta de acompanhamento." }] } },
    budesonida_formoterol: { n: "Budesonida + formoterol", via: "Uso inalatório",
      a: [A("6 mcg + 200 mcg cápsula para inalação / aerossol", "1 embalagem com 60 doses", ["Inalar 1 dose de 12 em 12 horas e 1 dose extra se falta de ar (máximo 8 doses por dia).", "Inalar 2 doses de 12 em 12 horas."], "Uso inalatório")],
      p: { fix: "idade", min: 72, via: "Uso inalatório", ap: "6 mcg + 100 mcg aerossol", q: "1 frasco", faixas: [{ ate: 144, t: "Inalar 1 dose de 12 em 12 horas, uso contínuo até a consulta de acompanhamento." }, { ate: 9999, t: "Inalar 1 dose (6/200 mcg) de 12 em 12 horas e 1 dose extra se falta de ar (máximo 8 por dia).", ap: "6 mcg + 200 mcg aerossol" }] } },
    montelucaste: { n: "Montelucaste de sódio", nota: "Alterações de humor/sono: suspender se ocorrerem.",
      a: [A("10 mg comprimido", "30 comprimidos", ["Tomar 1 comprimido à noite, uso contínuo."])],
      p: { fix: "idade", min: 6, ap: "comprimido mastigável / sachê", q: "30 unidades", faixas: [{ ate: 72, t: "Dar 4 mg (1 sachê ou comprimido mastigável) à noite, uso contínuo.", ap: "4 mg sachê / comprimido mastigável" }, { ate: 180, t: "Dar 1 comprimido mastigável de 5 mg à noite, uso contínuo.", ap: "5 mg comprimido mastigável" }, { ate: 9999, t: "Tomar 1 comprimido de 10 mg à noite, uso contínuo.", ap: "10 mg comprimido" }] } },

    /* ===================== NASAIS / VIAS AÉREAS ===================== */
    soro_nasal: { n: "Cloreto de sódio 0,9%", via: "Uso nasal",
      a: [A("solução nasal", "1 frasco", ["Aplicar 2 a 3 jatos ou gotas em cada narina 4 a 6 vezes ao dia e antes de assoar o nariz."], "Uso nasal")],
      p: { fix: "idade", via: "Uso nasal", ap: "solução nasal", q: "1 frasco", faixas: [{ ate: 9999, t: "Aplicar 2 a 3 gotas ou jatos em cada narina 4 a 6 vezes ao dia, antes das mamadas e de dormir." }] } },
    lavagem_nasal: { n: "Lavagem nasal com soro fisiológico 0,9%", via: "Uso nasal",
      a: [A("soro fisiológico 0,9% (frasco)", "1 frasco de 250 mL", ["Lavar cada narina com 10 a 20 mL usando seringa sem agulha, 3 vezes ao dia."], "Uso nasal")],
      p: { fix: "idade", via: "Uso nasal", ap: "soro fisiológico 0,9%", q: "1 frasco de 250 mL", faixas: [{ ate: 24, t: "Aplicar 1 a 2 mL em cada narina com seringa sem agulha, devagar, 3 a 4 vezes ao dia." }, { ate: 9999, t: "Lavar cada narina com 5 a 10 mL usando seringa sem agulha, 3 vezes ao dia." }] } },
    budesonida_nasal: { n: "Budesonida (spray nasal)", via: "Uso nasal",
      a: [A("64 mcg/jato suspensão nasal", "1 frasco", ["Aplicar 2 jatos em cada narina 1 vez ao dia, pela manhã, por 14 dias."], "Uso nasal"), A("32 mcg/jato suspensão nasal", "1 frasco", ["Aplicar 2 jatos em cada narina 1 vez ao dia por 14 dias."], "Uso nasal")],
      p: { fix: "idade", min: 72, via: "Uso nasal", ap: "32 mcg/jato suspensão nasal", q: "1 frasco", faixas: [{ ate: 9999, t: "Aplicar 1 jato em cada narina 1 vez ao dia por 14 dias." }] } },
    mometasona_nasal: { n: "Furoato de mometasona (spray nasal)", via: "Uso nasal",
      a: [A("50 mcg/jato suspensão nasal", "1 frasco", ["Aplicar 2 jatos em cada narina 1 vez ao dia por 14 dias.", "Aplicar 2 jatos em cada narina de 12 em 12 horas por 14 dias (rinossinusite)."], "Uso nasal")],
      p: { fix: "idade", min: 24, via: "Uso nasal", ap: "50 mcg/jato suspensão nasal", q: "1 frasco", faixas: [{ ate: 144, t: "Aplicar 1 jato em cada narina 1 vez ao dia por 14 dias." }, { ate: 9999, t: "Aplicar 2 jatos em cada narina 1 vez ao dia por 14 dias." }] } },
    oximetazolina: { n: "Cloridrato de oximetazolina", via: "Uso nasal", nota: "No máximo 3 dias (efeito rebote). Evitar em HAS, cardiopatia e < 6 anos.",
      a: [A("0,05% solução nasal", "1 frasco", ["Aplicar 2 jatos em cada narina de 12 em 12 horas, por no máximo 3 dias."], "Uso nasal")],
      p: { fix: "idade", min: 72, via: "Uso nasal", ap: "0,025% solução nasal (infantil)", q: "1 frasco", faixas: [{ ate: 144, t: "Aplicar 1 a 2 gotas em cada narina de 12 em 12 horas, por no máximo 3 dias." }, { ate: 9999, t: "Aplicar 2 jatos em cada narina de 12 em 12 horas, por no máximo 3 dias.", ap: "0,05% solução nasal" }] } },
    mel: { n: "Mel", nota: "Proibido em < 1 ano (botulismo).", a: [A("mel puro", "—", ["Tomar 1 colher de chá de mel puro antes de dormir, se tosse."])],
      p: { fix: "idade", min: 12, ap: "mel puro", q: "—", faixas: [{ ate: 72, t: "Dar meia colher de chá de mel puro antes de dormir, se tosse." }, { ate: 9999, t: "Dar 1 colher de chá de mel puro antes de dormir, se tosse." }] } },
    dropropizina: { n: "Dropropizina", nota: "Benefício limitado. Não usar em < 2 anos.", a: [A("3 mg/mL xarope", "1 frasco de 120 mL", ["Tomar 10 mL de 6 em 6 horas se tosse seca, por até 5 dias."])] },
    levodropropizina: { n: "Levodropropizina", nota: "Benefício limitado.", a: [A("6 mg/mL xarope", "1 frasco de 120 mL", ["Tomar 10 mL de 8 em 8 horas se tosse seca, por até 7 dias."])] },
    acetilcisteina: { n: "Acetilcisteína", nota: "Benefício limitado em IVAS.", a: [A("600 mg granulado (envelope)", "7 envelopes", ["Dissolver 1 envelope em meio copo de água e tomar 1 vez ao dia por 7 dias."])] },
    ambroxol: { n: "Cloridrato de ambroxol", nota: "Benefício limitado.", a: [A("30 mg/5 mL xarope adulto", "1 frasco de 120 mL", ["Tomar 5 mL de 8 em 8 horas por 5 dias."])] },

    /* ===================== ANTIMIGRANOSOS ===================== */
    sumatriptana: { n: "Sumatriptana", nota: "Contraindicada em doença coronariana, HAS não controlada, AVC prévio, gestação.",
      a: [A("50 mg comprimido", "6 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 2 horas. Máximo de 4 comprimidos por dia."]), A("100 mg comprimido", "4 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 2 horas. Máximo de 2 comprimidos por dia."])] },
    naratriptana: { n: "Naratriptana", nota: "Contraindicações dos triptanos.", a: [A("2,5 mg comprimido", "4 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 4 horas. Máximo de 2 por dia."])] },
    rizatriptana: { n: "Rizatriptana", nota: "Contraindicações dos triptanos.", a: [A("10 mg comprimido", "6 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 2 horas. Máximo de 3 por dia."]), A("10 mg comprimido orodispersível", "6 comprimidos", ["Dissolver 1 comprimido na boca no início da crise; repetir após 2 horas se necessário. Máximo de 3 por dia."])] },
    zolmitriptana: { n: "Zolmitriptana", nota: "Contraindicações dos triptanos.", a: [A("2,5 mg comprimido", "6 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 2 horas. Máximo de 4 por dia."])] },
    dhe_comb: { n: "Mesilato de di-hidroergotamina + dipirona + cafeína", nota: "Não associar a triptanos (intervalo de 24 h). Contraindicado em coronariopatia, gestação.", a: [A("1 mg + 350 mg + 100 mg comprimido", "6 comprimidos", ["Tomar 1 comprimido no início da crise; se necessário, repetir após 30 minutos. Máximo de 4 por dia."])] },
    isometepteno_comb: { n: "Isometepteno + dipirona + cafeína", a: [A("30 mg + 300 mg + 30 mg drágea", "20 drágeas", ["Tomar 1 a 2 drágeas no início da dor; repetir de 6 em 6 horas se necessário. Máximo de 8 por dia."])] },
    propranolol: { n: "Cloridrato de propranolol", nota: "Contraindicado em asma, bradicardia, BAV.", a: [A("40 mg comprimido", "60 comprimidos", ["Tomar 1 comprimido de 12 em 12 horas, uso contínuo até a consulta.", "Tomar meio comprimido de 12 em 12 horas na 1ª semana; depois 1 comprimido de 12 em 12 horas."])] },
    flunarizina: { n: "Dicloridrato de flunarizina", nota: "Sonolência, ganho de peso; evitar em depressão e parkinsonismo.", a: [A("10 mg cápsula", "30 cápsulas", ["Tomar 1 cápsula à noite, uso contínuo até a consulta."]), A("5 mg cápsula", "30 cápsulas", ["Tomar 1 cápsula à noite, uso contínuo até a consulta."])] },
    amitriptilina: { n: "Cloridrato de amitriptilina", ctrl: true, nota: "Sonolência, boca seca; evitar em idosos, cardiopatia e glaucoma.", a: [A("25 mg comprimido", "30 comprimidos", ["Tomar 1 comprimido à noite por 30 dias.", "Tomar meio comprimido à noite por 7 dias; depois 1 comprimido à noite até completar 30 dias."])] },
    topiramato: { n: "Topiramato", ctrl: true, nota: "Parestesias, perda de peso, cálculo renal; teratogênico.", a: [A("25 mg comprimido", "60 comprimidos", ["Tomar 1 comprimido à noite por 7 dias; depois 1 comprimido de 12 em 12 horas até completar 30 dias."])] },

    /* ===================== URINÁRIO ===================== */
    fenazopiridina: { n: "Cloridrato de fenazopiridina", nota: "Urina fica alaranjada. Uso máximo 2 dias.", a: [A("200 mg comprimido", "6 comprimidos", ["Tomar 1 comprimido de 8 em 8 horas, após as refeições, por 2 dias."])] },
    tansulosina: { n: "Cloridrato de tansulosina", nota: "Hipotensão postural.", a: [A("0,4 mg cápsula de liberação prolongada", "30 cápsulas", ["Tomar 1 cápsula 1 vez ao dia, após o café, por até 4 semanas ou até eliminar o cálculo."])] },

    /* ===================== HIDRATAÇÃO NA DENGUE ===================== */
    hidratacao_dengue: { n: "Hidratação oral (dengue)", tipo: "hidr", nota: "Adulto: 60 mL/kg/dia. Criança: 130 mL/kg/dia (até 10 kg), 100 mL/kg/dia (10–20 kg), 80 mL/kg/dia (> 20 kg). 1/3 em SRO." }
  };

  var classes = {
    analg: { n: "Analgésicos e antitérmicos", d: ["dipirona", "paracetamol", "aas"] },
    analg_dengue: { n: "Analgésicos e antitérmicos (seguros na dengue)", d: ["dipirona", "paracetamol"] },
    aine: { n: "Anti-inflamatórios não esteroides (AINEs)", d: ["ibuprofeno", "naproxeno", "diclofenaco", "cetoprofeno", "nimesulida", "meloxicam", "piroxicam", "tenoxicam", "celecoxibe", "etoricoxibe", "aceclofenaco", "cetorolaco"] },
    opio: { n: "Opioides fracos (receita de controle especial)", d: ["tramadol", "codeina_paracetamol", "codeina"] },
    relax: { n: "Relaxantes musculares", d: ["ciclobenzaprina", "orfenadrina_comb", "carisoprodol_comb", "tizanidina", "baclofeno"] },
    antiesp: { n: "Antiespasmódicos", d: ["escopolamina", "escopolamina_dipirona"] },
    antiem: { n: "Antieméticos e procinéticos", d: ["ondansetrona", "bromoprida", "metoclopramida", "dimenidrinato", "domperidona"] },
    ibp: { n: "Inibidores de bomba de prótons e anti-H2", d: ["omeprazol", "pantoprazol", "esomeprazol", "lansoprazol", "rabeprazol", "famotidina"] },
    antiacido: { n: "Antiácidos, protetores de mucosa e antiflatulentos", d: ["antiacido", "sucralfato", "simeticona"] },
    hidrat: { n: "Hidratação oral", d: ["sro"] },
    hidrat_dengue: { n: "Hidratação oral (protocolo dengue)", d: ["hidratacao_dengue", "sro"] },
    antidiarr: { n: "Antidiarreicos, probióticos e zinco", d: ["racecadotrila", "boulardii", "zinco", "loperamida"] },
    atb_disenteria: { n: "Antimicrobianos (diarreia com sangue / disenteria)", d: ["azitromicina", "ciprofloxacino"] },
    atb_faringe: { n: "Antimicrobianos (faringoamigdalite estreptocócica)", d: ["penicilina_benzatina", "amoxicilina", "cefalexina", "cefadroxila", "azitromicina", "claritromicina", "clindamicina"] },
    atb_oma: { n: "Antimicrobianos (otite média aguda)", d: ["amoxicilina", "amoxclav", "cefuroxima", "azitromicina", "claritromicina", "ceftriaxona"] },
    atb_sinus: { n: "Antimicrobianos (rinossinusite bacteriana)", d: ["amoxicilina", "amoxclav", "cefuroxima", "doxiciclina", "levofloxacino", "azitromicina", "claritromicina"] },
    atb_cistite: { n: "Antimicrobianos (cistite)", d: ["nitrofurantoina", "fosfomicina", "smx_tmp", "cefalexina", "amoxclav", "cefuroxima", "ciprofloxacino"] },
    atb_pielo: { n: "Antimicrobianos (pielonefrite ambulatorial)", d: ["ciprofloxacino", "levofloxacino", "ceftriaxona", "amoxclav", "smx_tmp", "cefuroxima"] },
    atb_pac: { n: "Antimicrobianos (pneumonia comunitária ambulatorial)", d: ["amoxicilina", "amoxclav", "azitromicina", "claritromicina", "doxiciclina", "levofloxacino", "cefuroxima"] },
    antiviral: { n: "Antiviral (síndrome gripal)", d: ["oseltamivir"] },
    antihist: { n: "Anti-histamínicos", d: ["loratadina", "desloratadina", "cetirizina", "levocetirizina", "fexofenadina", "bilastina", "ebastina", "dexclorfeniramina", "hidroxizina", "prometazina"] },
    cortic: { n: "Corticoides sistêmicos", d: ["prednisona", "prednisolona", "dexametasona"] },
    bronco: { n: "Broncodilatadores de resgate", d: ["salbutamol", "fenoterol"] },
    asma_ctrl: { n: "Controle da asma (iniciar e encaminhar)", d: ["beclometasona", "budesonida_formoterol", "montelucaste"] },
    nasal: { n: "Sintomáticos nasais", d: ["soro_nasal", "lavagem_nasal", "budesonida_nasal", "mometasona_nasal", "oximetazolina"] },
    tosse: { n: "Tosse (benefício limitado)", d: ["mel", "dropropizina", "levodropropizina", "acetilcisteina", "ambroxol"] },
    enxaq: { n: "Abortivos da crise de enxaqueca", d: ["sumatriptana", "naratriptana", "rizatriptana", "zolmitriptana", "dhe_comb", "isometepteno_comb"] },
    profilaxia_cef: { n: "Profilaxia de enxaqueca (iniciar e encaminhar)", d: ["propranolol", "amitriptilina", "flunarizina", "topiramato"] },
    uro: { n: "Analgésico urinário", d: ["fenazopiridina"] },
    expulsiva: { n: "Terapia expulsiva do cálculo", d: ["tansulosina"] }
  };

  /* Exames (códigos SIGTAP sem pontuação) */
  var LAB_PS = ["0202020380", "0202030202", "0202010473", "0202010694", "0202010317", "0202010635", "0202010600", "0202010260", "0202010210", "0202010228", "0202010562", "0202010430", "0202010643", "0202010651", "0202010465", "0202010422", "0202010201", "0202010180", "0202010554", "0202010627", "0202010325", "0202010333", "0202031209", "0202010791", "0202010368", "0202020142", "0202020134", "0202020290", "0202010732", "0202010538", "0202010120", "0202020150", "0202020029", "0202050017", "0202080080", "0202080013", "0202080153", "0202060217", "0214010066", "0202060250", "0202060381", "0202010503", "0202010198", "0202020037", "0202020541", "0202010490", "0202010384", "0214010147", "0214010120", "0214010139", "0214010112", "0214010058", "0214010074", "0214010228", "0214010295", "0214010163", "0214010180", "0202040127", "0202040097", "0202040143", "0202040135", "0202080196", "0202030474", "0214010023", "0214010155", "0202080072", "0202030539", "0202030733", "0202030911"];
  var COMP_PS = ["0211020036", "0204030153", "0204030170", "0204050120", "0204050138", "0204020069", "0204020042", "0204020093", "0204010144", "0204010063", "0204010080", "0204030072", "0204060095", "0204060060", "0204060125", "0204060087", "0204060150", "0204040094", "0204040124", "0204040078", "0204040116", "0204040060", "0204040019", "0204060168", "0204060117", "0205020046", "0205020038", "0205020054", "0205020160", "0205020186", "0205020143", "0205020127", "0205020070", "0205020062", "0205010040", "0205010032", "0206010079", "0206020031", "0206030010", "0206030037", "0206010044", "0206010028", "0207010064", "0207010048", "0207030049", "0209010037", "0209010029", "0209010053", "0209010010", "0209040025", "0211020044", "0211020052", "0211020060", "0211050024", "0211080055", "0211070041", "0301010072"];

  var P = function (id, n, cat, o) { o.id = id; o.n = n; o.cat = cat; return o; };
  var protocols = [
    P("febre-dor", "Febre e dor inespecíficas (sintomáticos)", "Geral", { alias: "febre dor sintomatico antitermico analgesico", cid: [["R509", "Febre não especificada"], ["R529", "Dor não especificada"]], cls: ["analg", "aine"], lab: ["0202020380", "0202030202", "0202050017", "0214010147", "0214010120"], comp: ["0204030153"] }),
    P("cefaleia", "Cefaleia / enxaqueca", "Neurológico", { alias: "dor de cabeca migranea enxaqueca cefaleia tensional", cid: [["R51", "Cefaleia"], ["G439", "Enxaqueca sem especificação"], ["G442", "Cefaleia tensional"]], cls: ["analg", "aine", "enxaq", "antiem", "profilaxia_cef"], lab: ["0202020380", "0202030202", "0202010473"], comp: ["0206010079", "0207010064", "0211050024", "0301010072"] }),
    P("lombalgia", "Lombalgia aguda / dor musculoesquelética", "Musculoesquelético", { alias: "dor lombar lombalgia lumbago ciatalgia mialgia dor nas costas contratura", cid: [["M545", "Dor lombar baixa"], ["M544", "Lumbago com ciática"], ["M791", "Mialgia"]], cls: ["analg", "aine", "relax", "opio"], lab: ["0202020380", "0202030202", "0202020150", "0202050017"], comp: ["0204020069", "0206010028", "0207010048", "0301010072"] }),
    P("colica-renal", "Cólica renal / nefrolitíase", "Urológico", { alias: "calculo renal litiase ureteral nefrolitiase colica nefretica pedra no rim", cid: [["N23", "Cólica nefrética não especificada"], ["N200", "Calculose do rim"], ["N201", "Calculose do ureter"]], cls: ["analg", "aine", "antiesp", "opio", "expulsiva", "antiem"], lab: ["0202050017", "0202010317", "0202010694", "0202020380", "0202010600", "0202010635", "0202010120", "0202010210", "0202080080", "0202080013"], comp: ["0205020054", "0206030037", "0204050138", "0301010072"] }),
    P("geca", "Gastroenterite aguda / diarreia", "Gastrointestinal", { alias: "diarreia gastroenterite gastroenterocolite geca vomito desidratacao virose intestinal disenteria", cid: [["A09", "Diarreia e gastroenterite de origem infecciosa presumível"], ["A084", "Infecção intestinal viral não especificada"], ["K529", "Gastroenterite e colite não infecciosas"]], cls: ["hidrat", "antidiarr", "antiem", "analg", "atb_disenteria"], lab: ["0202020380", "0202030202", "0202010694", "0202010317", "0202010635", "0202010600", "0202010473", "0202040097", "0202040127", "0202040135", "0202040143"], comp: ["0204050120", "0205020046"] }),
    P("nauseas", "Náuseas e vômitos", "Gastrointestinal", { alias: "nausea vomito enjoo emese", cid: [["R11", "Náusea e vômitos"]], cls: ["antiem", "hidrat", "ibp"], lab: ["0202020380", "0202010473", "0202010694", "0202010317", "0202010635", "0202010600", "0202060217", "0214010066", "0202010180", "0202010554", "0202050017"], comp: ["0204050120", "0205020046"] }),
    P("dispepsia", "Dispepsia / DRGE / gastrite", "Gastrointestinal", { alias: "azia queimacao epigastralgia gastrite refluxo drge dispepsia ulcera", cid: [["K30", "Dispepsia"], ["K219", "DRGE sem esofagite"], ["K297", "Gastrite não especificada"]], cls: ["ibp", "antiacido", "antiem", "antiesp"], lab: ["0202020380", "0202010180", "0202010554", "0202010643", "0202010651", "0202060217"], comp: ["0209010037", "0205020038", "0211020036"] }),
    P("colica-biliar", "Cólica biliar / colelitíase", "Gastrointestinal", { alias: "colelitiase vesicula calculo biliar colica biliar hipocondrio direito", cid: [["K802", "Calculose da vesícula biliar sem colecistite"], ["R101", "Dor localizada no abdome superior"]], cls: ["analg", "antiesp", "aine", "antiem", "ibp"], lab: ["0202020380", "0202030202", "0202010643", "0202010651", "0202010465", "0202010422", "0202010201", "0202010180", "0202010554", "0202050017"], comp: ["0205020038", "0205020046", "0207030049", "0209010010", "0301010072"] }),
    P("ivas-gripe", "Resfriado / IVAS / síndrome gripal", "Respiratório", { alias: "gripe resfriado ivas coriza tosse influenza covid sindrome gripal nasofaringite", cid: [["J069", "Infecção aguda das vias aéreas superiores não especificada"], ["J00", "Nasofaringite aguda (resfriado comum)"], ["J111", "Influenza com outras manifestações respiratórias"]], cls: ["analg", "aine", "nasal", "antihist", "tosse", "antiviral"], lab: ["0214010163", "0202020380", "0202030202"], comp: ["0204030153"] }),
    P("faringite", "Faringoamigdalite", "Respiratório", { alias: "dor de garganta amigdalite faringite placas estreptococo", cid: [["J029", "Faringite aguda não especificada"], ["J039", "Amigdalite aguda não especificada"], ["J020", "Faringite estreptocócica"]], cls: ["analg", "aine", "atb_faringe", "cortic"], lab: ["0202080196", "0202020380", "0202030202", "0202030733", "0202030474"], comp: [] }),
    P("oma", "Otite média aguda", "Respiratório", { alias: "otite dor de ouvido otalgia oma", cid: [["H669", "Otite média não especificada"], ["H660", "Otite média aguda supurativa"]], cls: ["analg", "aine", "atb_oma", "nasal"], lab: ["0202020380"], comp: ["0211070041", "0211070203", "0301010072"] }),
    P("sinusite", "Rinossinusite aguda", "Respiratório", { alias: "sinusite rinossinusite dor facial secrecao nasal purulenta", cid: [["J019", "Sinusite aguda não especificada"]], cls: ["nasal", "analg", "aine", "atb_sinus", "antihist"], lab: ["0202020380", "0202030202"], comp: ["0206010044", "0204010144", "0301010072"] }),
    P("cistite", "Cistite / ITU baixa", "Urológico", { alias: "infeccao urinaria itu cistite disuria ardencia para urinar", cid: [["N300", "Cistite aguda"], ["N390", "Infecção do trato urinário de localização não especificada"]], cls: ["atb_cistite", "uro", "analg"], lab: ["0202050017", "0202080080", "0202080013", "0214010066", "0202060217"], comp: ["0205020054"] }),
    P("pielonefrite", "Pielonefrite (ambulatorial)", "Urológico", { alias: "pielonefrite itu alta febre dor lombar giordano", cid: [["N10", "Nefrite túbulo-intersticial aguda"]], cls: ["atb_pielo", "analg", "antiem", "hidrat"], lab: ["0202050017", "0202080080", "0202080013", "0202020380", "0202030202", "0202010317", "0202010694", "0202010635", "0202010600", "0202080153", "0214010066"], comp: ["0205020054", "0206030037"] }),
    P("pac", "Pneumonia comunitária (ambulatorial)", "Respiratório", { alias: "pneumonia pac broncopneumonia infeccao pulmonar", cid: [["J189", "Pneumonia não especificada"], ["J159", "Pneumonia bacteriana não especificada"]], cls: ["atb_pac", "analg", "bronco", "antiviral"], lab: ["0202020380", "0202030202", "0202010694", "0202010317", "0202010635", "0202010600", "0202010473", "0214010163", "0202010732"], comp: ["0204030153", "0204030170", "0206020031"] }),
    P("asma", "Asma / broncoespasmo (alta)", "Respiratório", { alias: "asma crise asmatica broncoespasmo chiado sibilancia bronquite", cid: [["J459", "Asma não especificada"], ["J450", "Asma predominantemente alérgica"]], cls: ["bronco", "cortic", "asma_ctrl", "antihist"], lab: ["0202020380", "0202010732"], comp: ["0204030153", "0211080055", "0301010072"] }),
    P("urticaria", "Urticária / reação alérgica leve", "Alergia/Pele", { alias: "alergia urticaria coceira prurido placas angioedema reacao alergica", cid: [["L509", "Urticária não especificada"], ["T784", "Alergia não especificada"], ["T783", "Edema angioneurótico"]], cls: ["antihist", "cortic"], lab: ["0202020380"], comp: ["0301010072"] }),
    P("dengue", "Dengue / arboviroses (grupos A e B)", "Infeccioso", { alias: "dengue chikungunya zika arbovirose febre mialgia artralgia exantema", cid: [["A90", "Dengue (dengue clássico)"], ["A920", "Febre de Chikungunya"], ["A928", "Outras febres virais por mosquitos (Zika)"]], cls: ["analg_dengue", "hidrat_dengue", "antiem", "antihist"], lab: ["0202020380", "0214010147", "0214010120", "0214010139", "0214010112", "0202010643", "0202010651", "0202010317", "0202010694", "0202010635", "0202010600", "0202010627"], comp: ["0205020046", "0204030153"], naoUsar: "Anti-inflamatórios (ibuprofeno, diclofenaco, nimesulida, cetoprofeno), AAS/aspirina e corticoides: aumentam o risco de sangramento na dengue." })
  ];

  window.PROTO_DB = { drugs: drugs, classes: classes, protocols: protocols, labPS: LAB_PS, compPS: COMP_PS, etapa: 1 };
})();
