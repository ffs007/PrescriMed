/* ETAPA 2 — Pele e partes moles, olho, ouvido e boca. Acrescenta medicamentos, classes e protocolos ao PROTO_DB. */
(function () {
  "use strict";
  var DB = window.PROTO_DB; if (!DB) return;
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var L = function (id, ap, c, vol, gt) { return { id: id, ap: ap, c: c, vol: vol, gt: gt, tipo: "liq" }; };
  var C = function (id, ap, mg, split) { return { id: id, ap: ap, mg: mg, split: !!split, tipo: "cp" }; };
  var R = function (id, l, o) { var r = { id: id, l: l }; for (var k in o) r[k] = o[k]; return r; };
  var SAME = function (min, nota) { return { same: true, min: min || 0, nota: nota }; };
  var EXT = "Uso externo", OFT = "Uso oftálmico", OTO = "Uso otológico", BUC = "Uso bucal";

  var d = {
    /* ---------- antibióticos tópicos ---------- */
    mupirocina: { n: "Mupirocina", via: EXT, a: [A("20 mg/g (2%) pomada", "1 bisnaga de 15 g", ["Lavar a lesão com água e sabão e aplicar uma fina camada 3 vezes ao dia por 5 dias.", "Lavar a lesão com água e sabão e aplicar uma fina camada 3 vezes ao dia por 7 dias.", "Aplicar dentro de cada narina 2 vezes ao dia por 5 dias (descolonização)."], EXT)], p: SAME(2) },
    acido_fusidico: { n: "Ácido fusídico", via: EXT, a: [A("20 mg/g (2%) creme", "1 bisnaga de 15 g", ["Lavar a lesão com água e sabão e aplicar uma fina camada 3 vezes ao dia por 7 dias."], EXT)], p: SAME(0) },
    neomicina_bacitracina: { n: "Sulfato de neomicina + bacitracina zíncica", via: EXT, nota: "Dermatite de contato à neomicina é frequente; evitar em áreas extensas.", a: [A("5 mg/g + 250 UI/g pomada", "1 bisnaga de 15 g", ["Lavar a lesão e aplicar uma fina camada 3 vezes ao dia por 7 dias."], EXT)], p: SAME(0) },
    sulfadiazina_prata: { n: "Sulfadiazina de prata", via: EXT, nota: "Não usar em < 2 meses, gestantes a termo ou alergia a sulfas. Trocar curativo diariamente.", a: [A("10 mg/g (1%) creme", "1 bisnaga de 50 g", ["Lavar a queimadura com água corrente e sabão neutro, aplicar camada de 3 a 5 mm e cobrir com gaze, 1 vez ao dia.", "Lavar a queimadura com água corrente e sabão neutro, aplicar camada de 3 a 5 mm e cobrir com gaze, 2 vezes ao dia."], EXT)], p: SAME(2) },

    /* ---------- antifúngicos tópicos ---------- */
    cetoconazol_cr: { n: "Cetoconazol", via: EXT, a: [A("20 mg/g (2%) creme", "1 bisnaga de 30 g", ["Aplicar nas lesões e 2 cm ao redor 1 vez ao dia por 4 semanas.", "Aplicar nas lesões 2 vezes ao dia por 2 semanas (candidíase de dobras)."], EXT)], p: SAME(0) },
    miconazol_cr: { n: "Nitrato de miconazol", via: EXT, a: [A("20 mg/g (2%) creme", "1 bisnaga de 28 g", ["Aplicar nas lesões e ao redor 2 vezes ao dia por 4 semanas.", "Aplicar nas lesões 2 vezes ao dia por 2 semanas (candidíase de dobras)."], EXT)], p: SAME(0) },
    clotrimazol_cr: { n: "Clotrimazol", via: EXT, a: [A("10 mg/g (1%) creme", "1 bisnaga de 20 g", ["Aplicar nas lesões 2 a 3 vezes ao dia por 4 semanas (manter 2 semanas após melhora)."], EXT)], p: SAME(0) },
    terbinafina_cr: { n: "Cloridrato de terbinafina", via: EXT, a: [A("10 mg/g (1%) creme", "1 bisnaga de 20 g", ["Aplicar nas lesões 1 vez ao dia por 2 semanas (tinha do corpo ou da virilha).", "Aplicar entre os dedos 2 vezes ao dia por 1 semana (pé de atleta)."], EXT)], p: SAME(24) },
    isoconazol_cr: { n: "Nitrato de isoconazol", via: EXT, a: [A("10 mg/g (1%) creme", "1 bisnaga de 20 g", ["Aplicar nas lesões 1 vez ao dia por 3 semanas."], EXT)], p: SAME(0) },
    cetoconazol_xampu: { n: "Cetoconazol (xampu)", via: EXT, a: [A("20 mg/g (2%) xampu", "1 frasco de 100 mL", ["Aplicar na pele afetada, deixar agir 5 minutos e enxaguar, 1 vez ao dia por 5 dias (pitiríase versicolor).", "Lavar o couro cabeludo, deixar agir 5 minutos e enxaguar, 2 vezes por semana por 4 semanas."], EXT)], p: SAME(24) },
    selenio_xampu: { n: "Sulfeto de selênio (xampu)", via: EXT, a: [A("25 mg/mL (2,5%) xampu", "1 frasco de 100 mL", ["Aplicar na pele afetada, deixar agir 10 minutos e enxaguar, 1 vez ao dia por 7 dias."], EXT)], p: SAME(24) },

    /* ---------- antifúngicos orais / boca ---------- */
    fluconazol: { n: "Fluconazol", nota: "Interações (varfarina, estatinas, QT). Ajustar em doença renal.",
      a: [A("150 mg cápsula", "4 cápsulas", [T("Tomar 1 cápsula 1 vez por semana por 4 semanas (tinha).", "4 cápsulas"), T("Tomar 2 cápsulas (300 mg) em dose única e repetir após 7 dias (pitiríase versicolor).", "4 cápsulas"), T("Tomar 1 cápsula em dose única (candidíase vaginal).", "1 cápsula")]),
          A("100 mg cápsula", "15 cápsulas", [T("Tomar 2 cápsulas (200 mg) no 1º dia e depois 1 cápsula 1 vez ao dia até completar 14 dias (candidíase oral/esofágica).", "15 cápsulas"), T("Tomar 1 cápsula 1 vez ao dia por 7 dias.", "7 cápsulas")])],
      p: { min: 0, reg: [R("fl", "3 mg/kg/dia 1 vez ao dia (dobrar no 1º dia)", { mgkg: 3, h: 24, max: 200, cond: "(no 1º dia, dar o dobro)", dias: [14, 7] }), R("fl6", "6 mg/kg/dia 1 vez ao dia", { mgkg: 6, h: 24, max: 400, dias: [14, 7] })],
           f: [C("c50", "50 mg cápsula (pode ser aberta)", 50, false), C("c100", "100 mg cápsula (pode ser aberta)", 100, false), C("c150", "150 mg cápsula (pode ser aberta)", 150, false)] } },
    terbinafina_vo: { n: "Cloridrato de terbinafina", nota: "Hepatotoxicidade rara; evitar em hepatopatia.",
      a: [A("250 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 2 semanas (tinha do corpo extensa).", "14 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia por 4 semanas (tinha do couro cabeludo).", "28 comprimidos")])],
      p: { fix: "peso", min: 24, ap: "250 mg comprimido", q: "1 caixa (14 comprimidos)", faixas: [
        { ate: 20, t: "Dar 1/4 de comprimido (62,5 mg) 1 vez ao dia por 4 semanas (tinha do couro cabeludo) ou 2 semanas (tinha do corpo)." },
        { ate: 40, t: "Dar meio comprimido (125 mg) 1 vez ao dia por 4 semanas (tinha do couro cabeludo) ou 2 semanas (tinha do corpo)." },
        { ate: 999, t: "Dar 1 comprimido (250 mg) 1 vez ao dia por 4 semanas (tinha do couro cabeludo) ou 2 semanas (tinha do corpo)." }] } },
    griseofulvina: { n: "Griseofulvina", nota: "Tomar com refeição gordurosa. Contraindicada em gestação e porfiria.",
      a: [A("500 mg comprimido", "42 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, com refeição, por 6 semanas.", "42 comprimidos")])],
      p: { min: 24, reg: [R("gr", "20 mg/kg/dia 1 vez ao dia (tinha do couro cabeludo)", { mgkg: 20, h: 24, max: 1000, cond: "com refeição", dias: [42, 56] })], f: [C("c500", "500 mg comprimido", 500, true)] } },
    itraconazol: { n: "Itraconazol", nota: "Tomar após refeição. Interações (CYP3A4), contraindicado em ICC.", a: [A("100 mg cápsula", "14 cápsulas", [T("Tomar 2 cápsulas (200 mg) 1 vez ao dia, após refeição, por 7 dias.", "14 cápsulas"), T("Tomar 1 cápsula 1 vez ao dia, após refeição, por 15 dias.", "15 cápsulas")])] },
    nistatina_oral: { n: "Nistatina", via: BUC,
      a: [A("100.000 UI/mL suspensão oral", "1 frasco de 50 mL", ["Bochechar 5 mL por 1 minuto e engolir, 4 vezes ao dia, por 14 dias (manter 2 dias após melhora)."], BUC)],
      p: { fix: "idade", via: BUC, ap: "100.000 UI/mL suspensão oral", q: "1 frasco de 50 mL", faixas: [
        { ate: 12, t: "Aplicar 1 mL em cada lado da boca (2 mL por vez) 4 vezes ao dia, após as mamadas, por 14 dias. Ferver bicos e chupetas." },
        { ate: 9999, t: "Dar 4 a 6 mL (metade de cada lado da boca), bochechar e engolir, 4 vezes ao dia por 14 dias." }] } },
    miconazol_gel: { n: "Miconazol (gel oral)", via: BUC, nota: "Aplicar em pequenas porções (risco de engasgo em lactentes). Interação com varfarina.",
      a: [A("20 mg/g gel oral", "1 bisnaga de 40 g", ["Aplicar 2,5 mL na boca, espalhando sobre as lesões, 4 vezes ao dia após as refeições, por 7 a 14 dias."], BUC)],
      p: { fix: "idade", min: 4, via: BUC, ap: "20 mg/g gel oral", q: "1 bisnaga de 40 g", faixas: [{ ate: 24, t: "Aplicar 1,25 mL na boca, em pequenas porções sobre as lesões, 4 vezes ao dia após as mamadas, por 7 a 14 dias." }, { ate: 9999, t: "Aplicar 2,5 mL na boca, espalhando sobre as lesões, 4 vezes ao dia após as refeições, por 7 a 14 dias." }] } },

    /* ---------- escabiose / pediculose ---------- */
    permetrina5: { n: "Permetrina", via: EXT, nota: "Tratar todos os contatos da casa no mesmo dia. Lavar roupas e lençóis em água quente.",
      a: [A("50 mg/mL (5%) loção", "1 frasco de 60 mL", ["Aplicar à noite em todo o corpo, do pescoço até os pés (inclusive entre os dedos, unhas e região genital); retirar no banho após 8 a 12 horas. Repetir após 7 dias."], EXT)],
      p: { fix: "idade", min: 2, via: EXT, ap: "50 mg/mL (5%) loção", q: "1 frasco de 60 mL", faixas: [
        { ate: 24, t: "Aplicar à noite em todo o corpo, incluindo couro cabeludo, rosto (evitar olhos e boca), entre os dedos e região genital; retirar no banho após 8 a 12 horas. Repetir após 7 dias." },
        { ate: 9999, t: "Aplicar à noite em todo o corpo, do pescoço até os pés (inclusive entre os dedos, unhas e região genital); retirar no banho após 8 a 12 horas. Repetir após 7 dias." }] } },
    permetrina1: { n: "Permetrina", via: EXT, nota: "Pediculose: tratar contatos com piolho vivo; passar pente fino diariamente.",
      a: [A("10 mg/mL (1%) loção capilar", "1 frasco de 60 mL", ["Lavar e secar os cabelos, aplicar a loção em todo o cabelo e couro cabeludo, deixar agir 10 minutos e enxaguar. Passar pente fino. Repetir após 7 a 10 dias."], EXT)], p: SAME(2) },
    deltametrina: { n: "Deltametrina", via: EXT, a: [A("0,2 mg/mL xampu", "1 frasco de 100 mL", ["Aplicar no cabelo molhado, massagear, deixar agir 5 minutos e enxaguar. Passar pente fino. Repetir após 7 dias."], EXT), A("0,2 mg/mL loção", "1 frasco de 100 mL", ["Aplicar no corpo após o banho, 1 vez ao dia por 4 dias (escabiose). Repetir após 7 dias."], EXT)], p: SAME(24) },
    benzoato_benzila: { n: "Benzoato de benzila", via: EXT, nota: "Irritante; não usar em < 2 anos (preferir permetrina ou enxofre).",
      a: [A("250 mg/mL (25%) emulsão/loção", "1 frasco de 100 mL", ["Aplicar do pescoço para baixo à noite por 3 noites seguidas, com banho pela manhã. Repetir após 7 dias."], EXT)],
      p: { fix: "idade", min: 24, via: EXT, ap: "250 mg/mL (25%) emulsão/loção", q: "1 frasco de 100 mL", faixas: [{ ate: 144, t: "Diluir em partes iguais com água e aplicar do pescoço para baixo à noite por 3 noites seguidas, com banho pela manhã. Repetir após 7 dias." }, { ate: 9999, t: "Aplicar do pescoço para baixo à noite por 3 noites seguidas, com banho pela manhã. Repetir após 7 dias." }] } },
    enxofre: { n: "Enxofre precipitado em vaselina (manipulado)", via: EXT, nota: "Opção para lactentes < 2 meses e gestantes.",
      a: [A("5% a 10% pomada (manipulada)", "1 pote de 60 g", ["Aplicar em todo o corpo à noite por 3 noites seguidas, com banho pela manhã. Repetir após 7 dias."], EXT)],
      p: { fix: "idade", via: EXT, ap: "5% pomada (manipulada)", q: "1 pote de 60 g", faixas: [{ ate: 9999, t: "Aplicar em todo o corpo, incluindo couro cabeludo e rosto (evitar olhos e boca), à noite por 3 noites seguidas, com banho pela manhã. Repetir após 7 dias." }] } },
    ivermectina: { n: "Ivermectina", pa: true, nota: "Não usar em < 15 kg, gestantes e lactantes. Tomar com água, em jejum.",
      a: [A("6 mg comprimido", "4 comprimidos", [T("Tomar 2 comprimidos (12 mg) em dose única e repetir após 7 dias (51 a 65 kg).", "4 comprimidos"), T("Tomar 2 comprimidos e meio (15 mg) em dose única e repetir após 7 dias (66 a 79 kg).", "5 comprimidos"), T("Tomar 3 comprimidos (18 mg) em dose única e repetir após 7 dias (80 kg ou mais: 200 mcg/kg).", "6 comprimidos")])],
      p: { fix: "peso", ap: "6 mg comprimido", q: "2 comprimidos", faixas: [
        { ate: 14.9, err: "Contraindicada abaixo de 15 kg — usar permetrina ou enxofre." },
        { ate: 24, t: "Dar meio comprimido (3 mg) em dose única e repetir após 7 dias.", q: "1 comprimido" },
        { ate: 35, t: "Dar 1 comprimido (6 mg) em dose única e repetir após 7 dias.", q: "2 comprimidos" },
        { ate: 50, t: "Dar 1 comprimido e meio (9 mg) em dose única e repetir após 7 dias.", q: "3 comprimidos" },
        { ate: 65, t: "Tomar 2 comprimidos (12 mg) em dose única e repetir após 7 dias.", q: "4 comprimidos" },
        { ate: 79, t: "Tomar 2 comprimidos e meio (15 mg) em dose única e repetir após 7 dias.", q: "5 comprimidos" },
        { ate: 999, t: "Tomar 200 mcg/kg em dose única (3 comprimidos ou mais, conforme peso) e repetir após 7 dias.", q: "6 comprimidos" }] } },
    pente_fino: { n: "Pente fino", via: EXT, a: [A("orientação", "—", ["Passar pente fino nos cabelos úmidos, mecha por mecha, todos os dias por 14 dias. Lavar pentes, escovas e roupas de cama em água quente."], EXT)], p: SAME(0) },

    /* ---------- antivirais ---------- */
    aciclovir: { n: "Aciclovir", nota: "Hidratar bem; ajustar em doença renal. Na varicela, indicado em > 12 anos, doença crônica de pele/pulmão ou contato domiciliar (iniciar em até 24 h).",
      a: [A("400 mg comprimido", "70 comprimidos", [T("Tomar 2 comprimidos (800 mg) 5 vezes ao dia (de 4 em 4 horas, pulando a madrugada) por 7 dias.", "70 comprimidos"), T("Tomar 1 comprimido (400 mg) de 8 em 8 horas por 5 dias (herpes labial recorrente).", "15 comprimidos"), T("Tomar 1 comprimido (400 mg) de 8 em 8 horas por 10 dias (primeiro episódio de herpes).", "30 comprimidos")]),
          A("200 mg comprimido", "25 comprimidos", [T("Tomar 1 comprimido 5 vezes ao dia (de 4 em 4 horas, pulando a madrugada) por 5 dias.", "25 comprimidos")])],
      p: { min: 3, reg: [
        R("av20", "20 mg/kg/dose 4 vezes ao dia (varicela / herpes zoster)", { mgkg: 20, n: 4, h: 6, ftxt: "4 vezes ao dia (de 6 em 6 horas)", max: 800, dias: [5, 7] }),
        R("av15", "15 mg/kg/dose 5 vezes ao dia (gengivoestomatite herpética)", { mgkg: 15, n: 5, h: 4, ftxt: "5 vezes ao dia (de 4 em 4 horas, pulando a madrugada)", max: 200, dias: [7, 5] })],
        f: [L("susp", "200 mg/5 mL suspensão oral", 40, 50), C("c200", "200 mg comprimido", 200, true), C("c400", "400 mg comprimido", 400, true)] } },
    valaciclovir: { n: "Cloridrato de valaciclovir", nota: "Ajustar em doença renal.", a: [A("500 mg comprimido", "42 comprimidos", [T("Tomar 2 comprimidos (1 g) de 8 em 8 horas por 7 dias (herpes zoster).", "42 comprimidos"), T("Tomar 4 comprimidos (2 g) de 12 em 12 horas por 1 dia (herpes labial).", "8 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 3 dias (herpes genital recorrente).", "6 comprimidos"), T("Tomar 2 comprimidos (1 g) de 12 em 12 horas por 10 dias (primeiro episódio de herpes genital).", "40 comprimidos")])] },
    fanciclovir: { n: "Fanciclovir", nota: "Ajustar em doença renal.", a: [A("500 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 7 dias (herpes zoster).", "21 comprimidos")])] },
    aciclovir_cr: { n: "Aciclovir (creme)", via: EXT, a: [A("50 mg/g (5%) creme", "1 bisnaga de 10 g", ["Aplicar nas lesões 5 vezes ao dia por 5 dias, começando aos primeiros sintomas."], EXT)], p: SAME(0) },
    penciclovir_cr: { n: "Penciclovir (creme)", via: EXT, a: [A("10 mg/g (1%) creme", "1 bisnaga de 2 g", ["Aplicar nas lesões de 2 em 2 horas, enquanto acordado, por 4 dias."], EXT)], p: SAME(144) },
    gabapentina: { n: "Gabapentina", ctrl: true, nota: "Sonolência e tontura; ajustar em doença renal.", a: [A("300 mg cápsula", "60 cápsulas", ["Tomar 1 cápsula à noite por 3 dias, depois 1 cápsula de 12 em 12 horas por 3 dias, depois 1 cápsula de 8 em 8 horas até a reavaliação."])] },
    pregabalina: { n: "Pregabalina", ctrl: true, nota: "Sonolência, tontura, edema; ajustar em doença renal.", a: [A("75 mg cápsula", "60 cápsulas", ["Tomar 1 cápsula à noite por 3 dias, depois 1 cápsula de 12 em 12 horas até a reavaliação."])] },

    /* ---------- corticoides tópicos / antipruriginosos ---------- */
    hidrocortisona_cr: { n: "Acetato de hidrocortisona", via: EXT, a: [A("10 mg/g (1%) creme", "1 bisnaga de 30 g", ["Aplicar uma fina camada nas lesões 2 vezes ao dia por até 7 dias."], EXT)], p: SAME(3) },
    desonida_cr: { n: "Desonida", via: EXT, a: [A("0,5 mg/g (0,05%) creme", "1 bisnaga de 30 g", ["Aplicar uma fina camada nas lesões 2 vezes ao dia por até 7 dias."], EXT)], p: SAME(3) },
    dexametasona_cr: { n: "Acetato de dexametasona", via: EXT, nota: "Não usar no rosto e dobras por mais de 5 dias.", a: [A("1 mg/g (0,1%) creme", "1 bisnaga de 10 g", ["Aplicar uma fina camada nas lesões 2 vezes ao dia por até 7 dias."], EXT)], p: SAME(24) },
    betametasona_cr: { n: "Valerato de betametasona", via: EXT, nota: "Média/alta potência: evitar rosto, dobras e áreas extensas.", a: [A("1 mg/g (0,1%) creme", "1 bisnaga de 30 g", ["Aplicar uma fina camada nas lesões 2 vezes ao dia por até 7 dias."], EXT)], p: SAME(24) },
    mometasona_cr: { n: "Furoato de mometasona", via: EXT, a: [A("1 mg/g (0,1%) creme", "1 bisnaga de 20 g", ["Aplicar uma fina camada nas lesões 1 vez ao dia por até 7 dias."], EXT)], p: SAME(24) },
    clobetasol_cr: { n: "Propionato de clobetasol", via: EXT, nota: "Altíssima potência: não usar no rosto, dobras ou em crianças; máximo 7 dias.", a: [A("0,5 mg/g (0,05%) creme", "1 bisnaga de 30 g", ["Aplicar uma fina camada nas lesões 2 vezes ao dia por no máximo 7 dias."], EXT)] },
    calamina: { n: "Calamina (loção)", via: EXT, a: [A("loção", "1 frasco de 100 mL", ["Agitar e aplicar nas lesões com algodão 3 a 4 vezes ao dia se coceira."], EXT)], p: SAME(0) },
    emoliente: { n: "Hidratante sem perfume (creme ou vaselina sólida)", via: EXT, a: [A("creme / vaselina sólida", "1 pote", ["Aplicar na pele 2 a 3 vezes ao dia, logo após o banho."], EXT)], p: SAME(0) },
    compressa_fria: { n: "Compressa fria", via: EXT, a: [A("orientação", "—", ["Aplicar compressa fria (gelo envolto em pano ou soro gelado) por 15 minutos, 3 a 4 vezes ao dia."], EXT)], p: SAME(0) },
    compressa_morna: { n: "Compressa morna", via: EXT, a: [A("orientação", "—", ["Aplicar compressa morna (pano limpo com água morna) por 10 a 15 minutos, 4 vezes ao dia."], EXT)], p: SAME(0) },

    /* ---------- oftalmológicos ---------- */
    tobramicina_col: { n: "Tobramicina (colírio)", via: OFT, a: [A("3 mg/mL (0,3%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 a 2 gotas no olho afetado de 4 em 4 horas por 7 dias.", "Pingar 1 gota no olho afetado de 6 em 6 horas por 7 dias."], OFT)], p: SAME(2) },
    tobramicina_pom: { n: "Tobramicina (pomada oftálmica)", via: OFT, a: [A("3 mg/g (0,3%) pomada oftálmica", "1 bisnaga de 3,5 g", ["Aplicar 1 cm da pomada no canto interno do olho afetado 3 vezes ao dia por 7 dias."], OFT)], p: SAME(2) },
    ciprofloxacino_col: { n: "Ciprofloxacino (colírio)", via: OFT, a: [A("3 mg/mL (0,3%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 a 2 gotas no olho afetado de 4 em 4 horas por 2 dias e depois de 6 em 6 horas até completar 7 dias."], OFT)], p: SAME(12) },
    moxifloxacino_col: { n: "Moxifloxacino (colírio)", via: OFT, a: [A("5 mg/mL (0,5%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota no olho afetado de 8 em 8 horas por 7 dias."], OFT)], p: SAME(12) },
    ofloxacino_col: { n: "Ofloxacino (colírio)", via: OFT, a: [A("3 mg/mL (0,3%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 a 2 gotas no olho afetado de 6 em 6 horas por 7 dias."], OFT)], p: SAME(12) },
    epitezan: { n: "Acetato de retinol + aminoácidos + metionina + cloranfenicol", via: OFT, a: [A("pomada oftálmica", "1 bisnaga de 3,5 g", ["Aplicar 1 cm da pomada no olho afetado 3 vezes ao dia por 7 dias."], OFT)], p: SAME(0) },
    tobradex: { n: "Tobramicina + dexametasona (colírio)", via: OFT, nota: "Usar só com avaliação oftalmológica: corticoide piora ceratite herpética/fúngica e eleva pressão ocular.", a: [A("3 mg/mL + 1 mg/mL suspensão oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota no olho afetado de 6 em 6 horas por 7 dias."], OFT)] },
    olopatadina: { n: "Cloridrato de olopatadina", via: OFT, a: [A("1 mg/mL (0,1%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota em cada olho de 12 em 12 horas por 14 dias."], OFT)], p: SAME(36) },
    cetotifeno_col: { n: "Fumarato de cetotifeno (colírio)", via: OFT, a: [A("0,25 mg/mL (0,025%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota em cada olho de 12 em 12 horas por 14 dias."], OFT)], p: SAME(36) },
    epinastina: { n: "Cloridrato de epinastina", via: OFT, a: [A("0,5 mg/mL (0,05%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota em cada olho de 12 em 12 horas por 14 dias."], OFT)], p: SAME(36) },
    nafazolina_fen: { n: "Nafazolina + feniramina (colírio)", via: OFT, nota: "Vasoconstritor: máximo 3 dias; contraindicado em glaucoma de ângulo fechado.", a: [A("0,25 mg/mL + 3 mg/mL solução oftálmica", "1 frasco de 15 mL", ["Pingar 1 a 2 gotas em cada olho até 4 vezes ao dia, por no máximo 3 dias."], OFT)] },
    carmelose: { n: "Carmelose sódica (lágrima artificial)", via: OFT, a: [A("5 mg/mL (0,5%) solução oftálmica", "1 frasco de 15 mL", ["Pingar 1 gota em cada olho 4 a 6 vezes ao dia."], OFT)], p: SAME(0) },
    ciclopentolato: { n: "Cloridrato de ciclopentolato", via: OFT, nota: "Turva a visão: não dirigir. Contraindicado em glaucoma de ângulo fechado.", a: [A("10 mg/mL (1%) solução oftálmica", "1 frasco de 5 mL", ["Pingar 1 gota no olho afetado de 12 em 12 horas por 2 dias (dor por lesão de córnea)."], OFT)] },
    higiene_palpebral: { n: "Higiene das pálpebras", via: EXT, a: [A("orientação", "—", ["Limpar a borda das pálpebras com cotonete umedecido em xampu infantil diluído em água (1 parte para 10) 2 vezes ao dia por 14 dias."], EXT)], p: SAME(0) },

    /* ---------- otológicos ---------- */
    cipro_hidro_oto: { n: "Ciprofloxacino + hidrocortisona (solução otológica)", via: OTO, a: [A("2 mg/mL + 10 mg/mL solução otológica", "1 frasco de 5 mL", ["Pingar 3 gotas no ouvido afetado de 12 em 12 horas por 7 dias, deitado de lado por 5 minutos."], OTO)], p: SAME(12) },
    otosporin: { n: "Polimixina B + neomicina + hidrocortisona (solução otológica)", via: OTO, nota: "Não usar com perfuração do tímpano (neomicina é ototóxica).",
      a: [A("10.000 UI + 5 mg + 10 mg/mL suspensão otológica", "1 frasco de 10 mL", ["Pingar 4 gotas no ouvido afetado de 8 em 8 horas por 7 dias, deitado de lado por 5 minutos."], OTO)],
      p: { fix: "idade", via: OTO, ap: "10.000 UI + 5 mg + 10 mg/mL suspensão otológica", q: "1 frasco de 10 mL", faixas: [{ ate: 9999, t: "Pingar 3 gotas no ouvido afetado de 8 em 8 horas por 7 dias, deitado de lado por 5 minutos." }] } },
    cerumenolitico: { n: "Oleato de trolamina (cerumenolítico)", via: OTO, nota: "Não usar com perfuração ou otite.", a: [A("solução otológica", "1 frasco de 10 mL", ["Pingar 5 gotas no ouvido 2 vezes ao dia por 3 dias e retornar para lavagem."], OTO)], p: SAME(12) },
    oleo_mineral: { n: "Óleo mineral (vaselina líquida)", via: OTO, nota: "Não usar com perfuração ou otite.", a: [A("frasco", "1 frasco de 100 mL", ["Pingar 3 a 5 gotas no ouvido à noite por 5 dias e retornar para lavagem."], OTO)], p: SAME(0) },

    /* ---------- boca ---------- */
    triancinolona_oral: { n: "Triancinolona acetonida (pasta oral)", via: BUC, a: [A("1 mg/g (0,1%) pomada orabase", "1 bisnaga de 10 g", ["Aplicar pequena quantidade sobre a afta, sem esfregar, 2 a 3 vezes ao dia após as refeições e ao deitar, por até 7 dias."], BUC)], p: SAME(24) },
    benzidamina: { n: "Cloridrato de benzidamina", via: BUC, a: [A("1,5 mg/mL (0,15%) colutório", "1 frasco de 250 mL", ["Bochechar ou gargarejar 15 mL por 30 segundos 3 vezes ao dia, sem engolir, por até 7 dias."], BUC), A("1,5 mg/mL spray oral", "1 frasco de 30 mL", ["Aplicar 4 a 8 jatos na garganta ou nas lesões 3 vezes ao dia."], BUC)],
      p: { fix: "idade", min: 72, via: BUC, ap: "1,5 mg/mL spray oral", q: "1 frasco de 30 mL", faixas: [{ ate: 144, t: "Aplicar 4 jatos na garganta ou nas lesões 3 vezes ao dia." }, { ate: 9999, t: "Aplicar 4 a 8 jatos na garganta ou nas lesões 3 vezes ao dia." }] } },
    lidocaina_gel: { n: "Cloridrato de lidocaína (gel)", via: BUC, nota: "Não usar em crianças (risco de intoxicação). Não engolir.", a: [A("20 mg/g (2%) gel", "1 bisnaga de 30 g", ["Aplicar pequena quantidade sobre a lesão antes das refeições, até 4 vezes ao dia."], BUC)] },
    clorexidina_bucal: { n: "Digluconato de clorexidina (colutório)", via: BUC, nota: "Pode manchar os dentes; não engolir.", a: [A("1,2 mg/mL (0,12%) solução bucal", "1 frasco de 250 mL", ["Bochechar 15 mL por 30 segundos 2 vezes ao dia, sem engolir, por 7 dias. Não comer nem beber por 30 minutos."], BUC)], p: SAME(72) },
    metronidazol: { n: "Metronidazol", atb: true, nota: "Não ingerir álcool durante e até 3 dias após. Gosto metálico.",
      a: [A("400 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 7 dias.", "21 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 5 comprimidos (2 g) em dose única.", "5 comprimidos")]), A("250 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 7 dias.", "21 comprimidos"), T("Tomar 2 comprimidos (500 mg) de 12 em 12 horas por 7 dias.", "28 comprimidos")])],
      p: { min: 0, reg: [R("mt", "10 mg/kg/dose de 8/8 h", { mgkg: 10, h: 8, max: 500, dias: [7, 5, 10] }), R("mt5", "5 mg/kg/dose de 8/8 h (giardíase)", { mgkg: 5, h: 8, max: 250, dias: [5, 7] })], f: [L("susp", "40 mg/mL suspensão oral (benzoilmetronidazol)", 40, 100), C("c250", "250 mg comprimido", 250, true), C("c400", "400 mg comprimido", 400, true)] } }
  };
  for (var k in d) DB.drugs[k] = d[k];

  var c = {
    atb_pele: { n: "Antimicrobianos orais (celulite, erisipela, abscesso)", d: ["cefalexina", "cefadroxila", "amoxicilina", "amoxclav", "clindamicina", "smx_tmp", "doxiciclina", "azitromicina", "penicilina_benzatina"] },
    atb_top: { n: "Antibióticos tópicos", d: ["mupirocina", "acido_fusidico", "neomicina_bacitracina"] },
    antifung_top: { n: "Antifúngicos tópicos", d: ["cetoconazol_cr", "miconazol_cr", "clotrimazol_cr", "terbinafina_cr", "isoconazol_cr", "cetoconazol_xampu", "selenio_xampu"] },
    antifung_or: { n: "Antifúngicos orais", d: ["fluconazol", "terbinafina_vo", "griseofulvina", "itraconazol"] },
    antifung_boca: { n: "Antifúngicos para a boca", d: ["nistatina_oral", "miconazol_gel", "fluconazol"] },
    escabicida: { n: "Escabicidas", d: ["permetrina5", "ivermectina", "benzoato_benzila", "deltametrina", "enxofre"] },
    pediculicida: { n: "Pediculicidas e medidas", d: ["permetrina1", "deltametrina", "ivermectina", "pente_fino"] },
    antiviral_herpes: { n: "Antivirais orais (herpes / varicela / zoster)", d: ["aciclovir", "valaciclovir", "fanciclovir"] },
    antiviral_top: { n: "Antivirais tópicos", d: ["aciclovir_cr", "penciclovir_cr"] },
    neuropatica: { n: "Dor neuropática (receita de controle especial)", d: ["gabapentina", "pregabalina", "amitriptilina"] },
    cortic_top: { n: "Corticoides tópicos (da menor para a maior potência)", d: ["hidrocortisona_cr", "desonida_cr", "dexametasona_cr", "mometasona_cr", "betametasona_cr", "clobetasol_cr"] },
    antiprurido: { n: "Antipruriginosos e cuidados com a pele", d: ["calamina", "emoliente", "compressa_fria"] },
    queimadura: { n: "Curativo de queimadura", d: ["sulfadiazina_prata", "emoliente"] },
    analg_varicela: { n: "Analgésicos e antitérmicos (varicela: sem AAS e sem ibuprofeno)", d: ["paracetamol", "dipirona"] },
    colirio_atb: { n: "Antibióticos oftálmicos", d: ["tobramicina_col", "tobramicina_pom", "ciprofloxacino_col", "moxifloxacino_col", "ofloxacino_col", "epitezan", "tobradex"] },
    colirio_alerg: { n: "Antialérgicos e descongestionantes oftálmicos", d: ["olopatadina", "cetotifeno_col", "epinastina", "nafazolina_fen"] },
    olho_sint: { n: "Lubrificantes e cuidados oculares", d: ["carmelose", "compressa_fria", "compressa_morna", "higiene_palpebral", "ciclopentolato"] },
    otologico: { n: "Gotas otológicas (otite externa)", d: ["cipro_hidro_oto", "otosporin"] },
    cerume: { n: "Amolecedores de cerume", d: ["cerumenolitico", "oleo_mineral"] },
    boca_top: { n: "Tópicos para a boca (aftas e estomatites)", d: ["triancinolona_oral", "benzidamina", "lidocaina_gel", "clorexidina_bucal"] },
    atb_dente: { n: "Antimicrobianos (abscesso dentário)", d: ["amoxicilina", "amoxclav", "clindamicina", "metronidazol", "azitromicina"] }
  };
  for (var k2 in c) DB.classes[k2] = c[k2];

  var P = function (id, n, cat, o) { o.id = id; o.n = n; o.cat = cat; return o; };
  var HEMO = "0202020380", PCR = "0202030202", GLI = "0202010473", CREAT = "0202010317", UREIA = "0202010694", HEMOC = "0202080153", CULT = "0202080080", ATBG = "0202080013", HIV = "0214010058", SIF = "0214010074", HBS = "0214010228", HCV = "0214010295", HBA1C = "0202010503", EBV = "0202030733", CONSULTA = "0301010072", DOPPLER = "0205010040", BACTER = "0202080072";
  var novos = [
    P("celulite", "Celulite / erisipela", "Pele e partes moles", { alias: "celulite erisipela infeccao de pele vermelhidao perna inchada linfangite", cid: [["L039", "Celulite não especificada"], ["A46", "Erisipela"], ["L031", "Celulite de outras partes dos membros"]], cls: ["atb_pele", "analg", "aine", "antihist"], lab: [HEMO, PCR, GLI, CREAT, UREIA, HEMOC, HBA1C], comp: [DOPPLER, "0204060168", "0301010072"] }),
    P("abscesso", "Abscesso cutâneo / furúnculo", "Pele e partes moles", { alias: "abscesso furunculo carbunculo nodulo com pus drenagem", cid: [["L029", "Abscesso cutâneo, furúnculo e antraz de localização NE"], ["L024", "Abscesso cutâneo, furúnculo e antraz de membro"]], cls: ["atb_pele", "atb_top", "analg", "aine", "antiprurido"], lab: [HEMO, PCR, GLI, HBA1C, CULT, ATBG, BACTER], comp: ["0205020062", "0301010072"] }),
    P("impetigo", "Impetigo", "Pele e partes moles", { alias: "impetigo crostas melicericas feridas infectadas piodermite", cid: [["L010", "Impetigo"], ["L011", "Impetiginização de outras dermatoses"]], cls: ["atb_top", "atb_pele", "antihist"], lab: [], comp: [] }),
    P("foliculite", "Foliculite", "Pele e partes moles", { alias: "foliculite pelo encravado pustulas", cid: [["L739", "Afecção dos folículos pilosos não especificada"]], cls: ["atb_top", "atb_pele", "antiprurido"], lab: [], comp: [] }),
    P("escabiose", "Escabiose (sarna)", "Pele e partes moles", { alias: "escabiose sarna coceira noturna prurido familiar", cid: [["B86", "Escabiose"]], cls: ["escabicida", "antihist", "cortic_top", "emoliente_cls"], lab: [], comp: [] }),
    P("pediculose", "Pediculose (piolho)", "Pele e partes moles", { alias: "piolho pediculose lendea", cid: [["B850", "Pediculose devida a Pediculus humanus capitis"]], cls: ["pediculicida", "antihist"], lab: [], comp: [] }),
    P("micose", "Micoses superficiais (tinhas, pitiríase versicolor)", "Pele e partes moles", { alias: "micose tinha tinea frieira pe de atleta impingem pitiriase versicolor pano branco", cid: [["B354", "Tinha do corpo"], ["B356", "Tinha inguinal"], ["B353", "Tinha dos pés"], ["B360", "Pitiríase versicolor"], ["B350", "Tinha da barba e do couro cabeludo"]], cls: ["antifung_top", "antifung_or", "antihist"], lab: ["0202080137"], comp: [] }),
    P("candidiase-pele", "Candidíase cutânea / intertrigo", "Pele e partes moles", { alias: "candidiase intertrigo assadura dobras fungo", cid: [["B372", "Candidíase da pele e das unhas"]], cls: ["antifung_top", "antifung_or", "cortic_top"], lab: [GLI, HBA1C], comp: [] }),
    P("zoster", "Herpes zoster", "Pele e partes moles", { alias: "herpes zoster cobreiro dor em faixa vesiculas", cid: [["B029", "Herpes zoster sem complicação"], ["B023", "Herpes zoster oftálmico"]], cls: ["antiviral_herpes", "analg", "aine", "neuropatica", "antiprurido"], lab: [HIV, HEMO, CREAT], comp: [CONSULTA] }),
    P("herpes-simples", "Herpes simples labial / oral", "Pele e partes moles", { alias: "herpes labial bolhas boca febre interna", cid: [["B001", "Dermatite vesicular devida ao vírus do herpes"], ["B002", "Gengivoestomatite e faringoamigdalite herpética"]], cls: ["antiviral_top", "antiviral_herpes", "analg", "boca_top"], lab: [HIV, "0202090043"], comp: [] }),
    P("varicela", "Varicela (catapora)", "Pele e partes moles", { alias: "varicela catapora vesiculas febre", cid: [["B019", "Varicela sem complicação"]], cls: ["analg_varicela", "antihist", "antiprurido", "antiviral_herpes"], lab: [HEMO], comp: [], naoUsar: "AAS/aspirina (risco de síndrome de Reye) e ibuprofeno ou outros anti-inflamatórios (risco de infecção grave de pele) durante a catapora." }),
    P("picada", "Picada de inseto / prurigo estrófulo", "Alergia/Pele", { alias: "picada inseto mosquito abelha vespa prurigo estrofulo alergia a picada", cid: [["L282", "Outras formas de prurigo (estrófulo)"], ["T634", "Efeito tóxico de veneno de outros artrópodes"]], cls: ["antihist", "cortic_top", "antiprurido", "cortic", "analg"], lab: [], comp: [] }),
    P("queimadura", "Queimadura leve (1º/2º grau, pequena extensão)", "Pele e partes moles", { alias: "queimadura bolha agua quente oleo fogo sol", cid: [["T301", "Queimadura de 1º grau, parte do corpo NE"], ["T302", "Queimadura de 2º grau, parte do corpo NE"]], cls: ["queimadura", "analg", "aine", "opio", "atb_pele"], lab: [], comp: [] }),
    P("dermatite", "Dermatite de contato / eczema agudo", "Alergia/Pele", { alias: "dermatite de contato eczema alergia de pele vermelhidao coceira bijuteria", cid: [["L239", "Dermatite alérgica de contato de causa NE"], ["L249", "Dermatite de contato por irritantes de causa NE"], ["L309", "Dermatite não especificada"]], cls: ["cortic_top", "antihist", "antiprurido", "cortic"], lab: [], comp: [CONSULTA] }),
    P("conjuntivite", "Conjuntivite (bacteriana, viral ou alérgica)", "Olho", { alias: "conjuntivite olho vermelho secrecao remela olho coçando", cid: [["H103", "Conjuntivite aguda não especificada"], ["H109", "Conjuntivite não especificada"], ["H101", "Conjuntivite atópica aguda"]], cls: ["colirio_atb", "colirio_alerg", "olho_sint", "antihist"], lab: [], comp: [CONSULTA] }),
    P("hordeolo", "Hordéolo / calázio / blefarite", "Olho", { alias: "terçol hordeolo calazio blefarite palpebra inchada", cid: [["H000", "Hordéolo e outras inflamações profundas das pálpebras"], ["H001", "Calázio"], ["H010", "Blefarite"]], cls: ["olho_sint", "colirio_atb", "atb_pele", "analg"], lab: [], comp: [CONSULTA] }),
    P("abrasao-cornea", "Corpo estranho / abrasão de córnea", "Olho", { alias: "corpo estranho olho cisco abrasao corneana arranhao olho", cid: [["T150", "Corpo estranho na córnea"], ["S050", "Traumatismo da conjuntiva e abrasão da córnea sem corpo estranho"]], cls: ["colirio_atb", "olho_sint", "analg", "aine"], lab: [], comp: [CONSULTA] }),
    P("otite-externa", "Otite externa", "Ouvido", { alias: "otite externa ouvido de nadador dor ao puxar a orelha", cid: [["H609", "Otite externa não especificada"], ["H603", "Outras otites externas infecciosas"]], cls: ["otologico", "analg", "aine", "atb_pele"], lab: [GLI], comp: [CONSULTA] }),
    P("cerume", "Rolha de cerume", "Ouvido", { alias: "cerume cera no ouvido ouvido tampado rolha", cid: [["H612", "Cerume impactado"]], cls: ["cerume"], lab: [], comp: [CONSULTA, "0211070041"] }),
    P("afta", "Estomatite aftosa (afta)", "Boca", { alias: "afta estomatite ulcera na boca", cid: [["K120", "Aftas bucais recidivantes"], ["K121", "Outras formas de estomatite"]], cls: ["boca_top", "analg"], lab: [HEMO], comp: [] }),
    P("gengivoestomatite", "Gengivoestomatite herpética / herpangina", "Boca", { alias: "gengivoestomatite herpangina feridas na boca crianca febre nao come", cid: [["B002", "Gengivoestomatite e faringoamigdalite herpética"], ["B085", "Faringite vesicular enteroviral (herpangina)"]], cls: ["analg", "aine", "antiviral_herpes", "hidrat", "boca_top"], lab: [], comp: [] }),
    P("odontalgia", "Odontalgia / abscesso dentário", "Boca", { alias: "dor de dente abscesso dentario carie inchaço no rosto", cid: [["K088", "Outros transtornos especificados dos dentes (odontalgia)"], ["K047", "Abscesso periapical sem fístula"]], cls: ["analg", "aine", "atb_dente", "boca_top", "opio"], lab: [], comp: ["0204010179", "0204010225"] }),
    P("candidiase-oral", "Candidíase oral (sapinho)", "Boca", { alias: "sapinho candidiase oral placas brancas boca", cid: [["B370", "Estomatite por Candida"]], cls: ["antifung_boca"], lab: [GLI, HIV], comp: [] })
  ];
  /* classe-alias usada acima */
  DB.classes.emoliente_cls = { n: "Hidratação da pele", d: ["emoliente"] };
  novos.forEach(function (p) { DB.protocols.push(p); });
  /* RDC 20/2011 (Anexo I): antibacterianos tópicos/oftálmicos/otológicos também exigem 2 vias; isenção apenas para neomicina tópica. */
  ["mupirocina", "acido_fusidico", "sulfadiazina_prata", "tobramicina_col", "tobramicina_pom", "ciprofloxacino_col", "moxifloxacino_col", "ofloxacino_col", "epitezan", "tobradex", "cipro_hidro_oto", "otosporin"].forEach(function (k) { if (DB.drugs[k]) DB.drugs[k].atb = true; });
  /* fluconazol: suspensão manipulada para lactentes (cápsula de 50 mg não fraciona com segurança) */
  if (DB.drugs.fluconazol) DB.drugs.fluconazol.p.f.push({ id: "s10", ap: "10 mg/mL suspensão oral (manipulada)", c: 10, vol: 50, tipo: "liq" });
  DB.etapa = 2;
})();
