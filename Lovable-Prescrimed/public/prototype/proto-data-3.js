/* ETAPA 3 — Ginecologia, obstetrícia e IST (PCDT IST/MS; PCDT PEP/MS). Acrescenta medicamentos, classes, protocolos,
   marcações de gestação (gx = contraindicado → bloqueia; gc = cautela → alerta) e exames ao PROTO_DB. */
(function () {
  "use strict";
  var DB = window.PROTO_DB; if (!DB) return;
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var L = function (id, ap, c, vol, gt) { return { id: id, ap: ap, c: c, vol: vol, gt: gt, tipo: "liq" }; };
  var R = function (id, l, o) { var r = { id: id, l: l }; for (var k in o) r[k] = o[k]; return r; };
  var SAME = function (min, nota) { return { same: true, min: min || 0, nota: nota }; };
  var IM = "Uso intramuscular", VAG = "Uso vaginal", EXT = "Uso externo";
  var ALC = "Não ingerir bebida alcoólica durante e até 3 dias após o tratamento.";
  var PARC = "Tratar parceria(s) sexual(is) e orientar preservativo até o fim do tratamento de todos.";

  var d = {
    /* ---------- antifúngicos vaginais / orais (candidíase vulvovaginal) ---------- */
    miconazol_vag: { n: "Nitrato de miconazol (creme vaginal)", via: VAG, nota: "Primeira escolha na gestação (7 noites).",
      a: [A("20 mg/g (2%) creme vaginal com aplicadores", "1 bisnaga", ["Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 7 noites seguidas.", "Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 14 noites seguidas (casos recorrentes ou complicados)."], VAG)] },
    clotrimazol_vag: { n: "Clotrimazol (creme vaginal)", via: VAG,
      a: [A("10 mg/g (1%) creme vaginal com aplicadores", "1 bisnaga", ["Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 6 a 7 noites seguidas."], VAG), A("20 mg/g (2%) creme vaginal com aplicadores", "1 bisnaga", ["Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 3 noites seguidas."], VAG)] },
    nistatina_vag: { n: "Nistatina (creme vaginal)", via: VAG,
      a: [A("25.000 UI/g creme vaginal (100.000 UI por aplicador)", "1 bisnaga de 60 g com 14 aplicadores", ["Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 14 noites seguidas."], VAG)] },
    tioconazol_vag: { n: "Tioconazol (pomada vaginal)", via: VAG, gc: "Preferir miconazol ou clotrimazol por 7 noites.",
      a: [A("65 mg/g (6,5%) pomada vaginal — aplicador de dose única", "1 bisnaga com aplicador", ["Introduzir todo o conteúdo do aplicador na vagina à noite, ao deitar, em dose única."], VAG)] },
    fluconazol_cvv: { n: "Fluconazol", gx: "via oral contraindicada na gestação — usar creme vaginal por 7 noites.", nota: "Interações (varfarina, estatinas, QT).",
      a: [A("150 mg cápsula", "1 cápsula", [T("Tomar 1 cápsula em dose única.", "1 cápsula"), T("Tomar 1 cápsula no 1º, 4º e 7º dia (candidíase complicada).", "3 cápsulas")])] },
    itraconazol_cvv: { n: "Itraconazol", gx: "contraindicado na gestação.", nota: "Tomar após refeição. Interações (QT, estatinas).",
      a: [A("100 mg cápsula", "4 cápsulas", [T("Tomar 2 cápsulas de 12 em 12 horas por 1 dia.", "4 cápsulas")])] },

    /* ---------- vaginose bacteriana / tricomoníase ---------- */
    metro_ist: { n: "Metronidazol", atb: true, gc: "usar 250 mg, 2 comprimidos de 12/12 h por 7 dias; evitar a dose única de 2 g no 1º trimestre.", nota: ALC,
      a: [A("250 mg comprimido", "28 comprimidos", [T("Tomar 2 comprimidos (500 mg) de 12 em 12 horas por 7 dias.", "28 comprimidos")]),
          A("400 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 5 comprimidos (2 g) juntos, em dose única, após uma refeição.", "5 comprimidos")])] },
    metro_gel: { n: "Metronidazol (gel vaginal)", via: VAG, atb: true, nota: ALC,
      a: [A("100 mg/g gel vaginal com aplicadores", "1 bisnaga de 50 g", ["Introduzir 1 aplicador cheio (5 g) na vagina à noite, ao deitar, por 5 noites seguidas."], VAG)] },
    clinda_vb: { n: "Clindamicina", atb: true, nota: "Risco de colite por C. difficile.",
      a: [A("300 mg cápsula", "14 cápsulas", [T("Tomar 1 cápsula de 12 em 12 horas por 7 dias.", "14 cápsulas")])] },
    clinda_vag: { n: "Clindamicina (creme vaginal)", via: VAG, atb: true, nota: "Enfraquece preservativo de látex por até 5 dias.",
      a: [A("20 mg/g (2%) creme vaginal com aplicadores", "1 bisnaga", ["Introduzir 1 aplicador cheio na vagina à noite, ao deitar, por 7 noites seguidas."], VAG)] },
    secnidazol: { n: "Secnidazol", atb: true, gx: "evitar na gestação — usar metronidazol 7 dias.", nota: ALC,
      a: [A("1 g comprimido", "2 comprimidos", [T("Tomar 2 comprimidos (2 g) juntos, em dose única, após uma refeição.", "2 comprimidos")])] },
    tinidazol: { n: "Tinidazol", atb: true, gx: "evitar na gestação — usar metronidazol 7 dias.", nota: ALC,
      a: [A("500 mg comprimido", "4 comprimidos", [T("Tomar 4 comprimidos (2 g) juntos, em dose única, após uma refeição.", "4 comprimidos")])] },

    /* ---------- uretrite / cervicite / DIP / orquiepididimite ---------- */
    ceftriaxona_ist: { n: "Ceftriaxona", atb: true, via: IM, nota: "Aplicar no serviço de saúde, diluída em lidocaína 1% sem vasoconstritor.",
      a: [A("500 mg pó para solução injetável", "1 frasco-ampola", ["Aplicar 500 mg por via intramuscular, dose única."], IM),
          A("1 g pó para solução injetável", "1 frasco-ampola", [T("Aplicar 1 g por via intramuscular, dose única.", "1 frasco-ampola"), T("Aplicar 1 g por via intramuscular 1 vez ao dia por 10 dias (sífilis em alérgico à penicilina, fora da gestação).", "10 frascos-ampola")], IM)] },
    azitro_ist: { n: "Azitromicina", atb: true,
      a: [A("500 mg comprimido", "2 comprimidos", [T("Tomar 2 comprimidos (1 g) juntos, em dose única.", "2 comprimidos"), T("Tomar 2 comprimidos (1 g) 1 vez por semana por 3 semanas (donovanose).", "6 comprimidos")])] },
    doxi_ist: { n: "Doxiciclina", atb: true, gx: "contraindicada na gestação.", nota: "Tomar com água, sem deitar em seguida. Evitar sol forte.",
      a: [A("100 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 7 dias.", "14 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 15 dias (sífilis recente em alérgico à penicilina).", "30 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 21 dias (linfogranuloma venéreo / donovanose).", "42 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 30 dias (sífilis tardia em alérgico à penicilina).", "60 comprimidos")])] },
    doxi_dip: { n: "Doxiciclina", atb: true, gx: "contraindicada na gestação (DIP na gestante = internação).", nota: "Tomar com água, sem deitar em seguida.",
      a: [A("100 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 14 dias.", "28 comprimidos")])] },
    doxi_orq: { n: "Doxiciclina", atb: true, gx: "contraindicada na gestação.", nota: "Tomar com água, sem deitar em seguida.",
      a: [A("100 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 10 dias.", "20 comprimidos")])] },
    metro_dip: { n: "Metronidazol", atb: true, nota: ALC,
      a: [A("250 mg comprimido", "56 comprimidos", [T("Tomar 2 comprimidos (500 mg) de 12 em 12 horas por 14 dias.", "56 comprimidos")]), A("400 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 14 dias.", "28 comprimidos")])] },
    levo_orq: { n: "Levofloxacino", atb: true, gx: "contraindicado na gestação.", nota: "Opção quando há suspeita de germe entérico (> 35 anos, sem risco de IST, prática anal insertiva). QT longo, tendinopatia.",
      a: [A("500 mg comprimido", "10 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 10 dias.", "10 comprimidos")])] },
    cipro_prost: { n: "Ciprofloxacino", atb: true, nota: "Prostatite aguda: 2 a 4 semanas. Tendinopatia; separar de antiácidos e laticínios.",
      a: [A("500 mg comprimido", "56 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 28 dias.", "56 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 14 dias.", "28 comprimidos")])] },
    levo_prost: { n: "Levofloxacino", atb: true, nota: "QT longo, tendinopatia.",
      a: [A("500 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 28 dias.", "28 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia por 14 dias.", "14 comprimidos")])] },
    smx_prost: { n: "Sulfametoxazol + trimetoprima", atb: true, nota: "Usar se sensível no antibiograma. Hipercalemia, alergia a sulfas.",
      a: [A("800 mg + 160 mg comprimido", "56 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 28 dias.", "56 comprimidos")])] },

    /* ---------- sífilis / úlcera genital / herpes / verrugas ---------- */
    benzatina_ist: { n: "Benzilpenicilina benzatina", atb: true, via: IM, nota: "Aplicar em serviço de saúde (UBS ou PS), 1.200.000 UI em cada glúteo. Respeitar o intervalo semanal: atraso exige reiniciar o esquema (PCDT). Na gestante alérgica: dessensibilizar — não há alternativa.",
      a: [A("1.200.000 UI pó para suspensão injetável", "2 frascos-ampola", [T("Aplicar 2.400.000 UI por via intramuscular profunda (1.200.000 UI em cada glúteo), dose única (sífilis recente: primária, secundária ou latente < 1 ano).", "2 frascos-ampola"), T("Aplicar 2.400.000 UI por via intramuscular profunda (1.200.000 UI em cada glúteo) 1 vez por semana por 3 semanas — total 7.200.000 UI (sífilis tardia ou de duração ignorada).", "6 frascos-ampola")], IM)] },
    aciclovir_gen: { n: "Aciclovir", nota: "Hidratar bem; ajustar em doença renal.",
      a: [A("200 mg comprimido", "42 comprimidos", [T("Tomar 2 comprimidos (400 mg) de 8 em 8 horas por 7 dias (primeiro episódio).", "42 comprimidos"), T("Tomar 2 comprimidos (400 mg) de 8 em 8 horas por 10 dias (primeiro episódio extenso).", "60 comprimidos"), T("Tomar 2 comprimidos (400 mg) de 8 em 8 horas por 5 dias (recorrência).", "30 comprimidos")]),
          A("400 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 7 dias (primeiro episódio).", "21 comprimidos"), T("Tomar 1 comprimido de 8 em 8 horas por 5 dias (recorrência).", "15 comprimidos")])] },
    valaciclovir_gen: { n: "Cloridrato de valaciclovir", gc: "preferir aciclovir na gestação.", nota: "Ajustar em doença renal.",
      a: [A("500 mg comprimido", "28 comprimidos", [T("Tomar 2 comprimidos (1 g) de 12 em 12 horas por 7 dias (primeiro episódio).", "28 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas por 3 dias (recorrência).", "6 comprimidos")])] },
    fanciclovir_gen: { n: "Fanciclovir", gc: "preferir aciclovir na gestação.", nota: "Ajustar em doença renal.",
      a: [A("250 mg comprimido", "21 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 7 a 10 dias (primeiro episódio).", "30 comprimidos")]), A("500 mg comprimido", "2 comprimidos", [T("Tomar 2 comprimidos (1 g) de 12 em 12 horas por 1 dia (recorrência).", "4 comprimidos")])] },
    cipro_cancro: { n: "Ciprofloxacino", atb: true, gx: "fluoroquinolona — evitar na gestação (usar azitromicina).", nota: "Alternativa para cancroide. Tendinopatia; separar de antiácidos e laticínios.",
      a: [A("500 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por 3 dias.", "6 comprimidos")])] },
    lidocaina_geleia: { n: "Cloridrato de lidocaína (geleia)", via: EXT,
      a: [A("20 mg/g (2%) geleia", "1 bisnaga de 30 g", ["Aplicar uma fina camada sobre as feridas antes de urinar e até 4 vezes ao dia, se dor."], EXT)] },
    podofilotoxina: { n: "Podofilotoxina", via: EXT, gx: "contraindicada na gestação (usar ATA 80–90% no serviço, crioterapia ou exérese).", nota: "Não aplicar em mucosa, sangramento ou área > 10 cm². Proteger a pele ao redor com vaselina.",
      a: [A("1,5 mg/g (0,15%) creme", "1 bisnaga de 5 g", ["Aplicar sobre as verrugas 2 vezes ao dia por 3 dias seguidos e pausar 4 dias; repetir o ciclo por até 4 semanas."], EXT)] },
    imiquimode: { n: "Imiquimode", via: EXT, gx: "evitar na gestação.", nota: "Irritação local esperada. Não usar em mucosa interna.",
      a: [A("50 mg/g (5%) creme — sachês de 250 mg", "1 caixa com 12 sachês", ["Aplicar sobre as verrugas à noite, 3 vezes por semana (em dias alternados), e lavar com água e sabão após 6 a 10 horas; manter por até 16 semanas."], EXT)] },

    /* ---------- dismenorreia / sangramento uterino ---------- */
    mefenamico: { n: "Ácido mefenâmico", gx: "AINE — evitar na gestação.", nota: "Tomar após as refeições. Evitar em úlcera, doença renal, dengue.",
      a: [A("500 mg comprimido", "9 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, a partir do início da cólica ou do sangramento, por até 3 dias.", "9 comprimidos"), T("Tomar 1 comprimido de 8 em 8 horas por 5 dias (sangramento menstrual aumentado).", "15 comprimidos")])] },
    bolsa_morna: { n: "Calor local", via: EXT, a: [A("orientação", "—", ["Aplicar bolsa de água morna sobre o baixo ventre por 15 a 20 minutos, várias vezes ao dia, protegendo a pele com um pano."], EXT)], p: SAME(0) },
    tranexamico: { n: "Ácido tranexâmico", nota: "Contraindicado em trombose atual ou prévia e com anticoncepcional combinado. Excluir gestação (beta-hCG).",
      a: [A("250 mg comprimido", "60 comprimidos", [T("Tomar 4 comprimidos (1 g) de 8 em 8 horas durante o sangramento, por até 5 dias.", "60 comprimidos"), T("Tomar 4 comprimidos (1 g) de 8 em 8 horas por 3 dias.", "36 comprimidos")])] },
    medroxiprogesterona: { n: "Acetato de medroxiprogesterona", gx: "excluir gestação (beta-hCG) antes de prescrever.", nota: "Sangramento de privação 3 a 7 dias após o término.",
      a: [A("10 mg comprimido", "10 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 10 dias.", "10 comprimidos"), T("Tomar 2 comprimidos (20 mg) de 8 em 8 horas por 7 dias (sangramento intenso).", "42 comprimidos")])] },
    aco_comb: { n: "Etinilestradiol + levonorgestrel", gx: "excluir gestação (beta-hCG) antes de prescrever.", nota: "Contraindicado: tabagismo ≥ 35 anos, enxaqueca com aura, HAS não controlada, trombose prévia/trombofilia, lúpus com anticorpo antifosfolípide, câncer de mama, hepatopatia, < 6 semanas pós-parto.",
      a: [A("0,03 mg + 0,15 mg comprimido (cartela de 21)", "2 cartelas", [T("Tomar 1 comprimido de 8 em 8 horas por 7 dias; depois, 1 comprimido ao dia por 3 semanas.", "2 cartelas")])] },
    sulfato_ferroso: { n: "Sulfato ferroso", nota: "Tomar longe de leite, café e antiácidos. Fezes escurecem.",
      a: [A("40 mg de ferro elementar comprimido", "60 comprimidos", [T("Tomar 1 comprimido 2 vezes ao dia, 30 minutos antes do almoço e do jantar, por 30 dias e reavaliar com hemograma.", "60 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia, 30 minutos antes do almoço, por 30 dias.", "30 comprimidos")])],
      p: { min: 0, reg: [R("fe", "3 mg/kg/dia de ferro elementar 1 vez ao dia (tratamento)", { mgkg: 3, h: 24, max: 60, cond: "30 minutos antes de uma refeição", dias: [30] })], f: [L("g25", "25 mg/mL de ferro elementar solução oral (gotas) — 1 gota = 1,25 mg", 25, 30, 1.25)] } },

    /* ---------- obstetrícia / contracepção ---------- */
    nitro_gest: { n: "Nitrofurantoína", atb: true, gc: "evitar a partir de 38 semanas e na deficiência de G6PD.", nota: "Não usar se TFG < 30 mL/min ou em pielonefrite. Urocultura de controle 7 dias após o término.",
      a: [A("100 mg cápsula", "28 cápsulas", [T("Tomar 1 cápsula de 6 em 6 horas por 7 dias.", "28 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 10 dias.", "40 cápsulas")])] },
    cefalexina_mast: { n: "Cefalexina", atb: true, nota: "Compatível com amamentação.",
      a: [A("500 mg cápsula", "40 cápsulas", [T("Tomar 1 cápsula de 6 em 6 horas por 10 dias.", "40 cápsulas"), T("Tomar 1 cápsula de 6 em 6 horas por 14 dias.", "56 cápsulas")])] },
    esvaziamento_mama: { n: "Esvaziamento das mamas", via: EXT, a: [A("orientação", "—", ["Manter a amamentação, começando pela mama afetada, ou ordenhar a cada 2 a 3 horas até esvaziar. Aplicar compressa fria entre as mamadas para dor e inchaço."], EXT)] },
    levonorgestrel: { n: "Levonorgestrel", nota: "Quanto antes, mais eficaz: até 72 horas (eficácia menor até 5 dias). Repetir a dose se vomitar em até 3 horas. Não é abortivo. Menor de 14 anos: presunção legal de violência sexual — notificação compulsória (SINAN) e Conselho Tutelar.",
      a: [A("1,5 mg comprimido", "1 comprimido", [T("Tomar 1 comprimido em dose única, o quanto antes.", "1 comprimido")]), A("0,75 mg comprimido", "2 comprimidos", [T("Tomar 2 comprimidos juntos, em dose única, o quanto antes.", "2 comprimidos")])],
      p: SAME(0) },

    /* ---------- profilaxia pós-exposição (PEP) ---------- */
    tdf_3tc: { n: "Tenofovir + lamivudina", nota: "PEP: iniciar idealmente em até 2 horas, no máximo 72 horas após a exposição. Dispensação via SICLOM (formulário de PEP). Avaliar função renal; testar HIV, sífilis, hepatites B e C antes.",
      a: [A("300 mg + 300 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 28 dias, sem interromper.", "28 comprimidos")])] },
    dolutegravir: { n: "Dolutegravir", nota: "PEP: tomar junto com tenofovir + lamivudina. Separar 2 h antes ou 6 h depois de antiácidos, cálcio e ferro.",
      a: [A("50 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 28 dias, sem interromper.", "28 comprimidos")])] }
  };
  for (var k in d) DB.drugs[k] = d[k];

  /* ---------- marcações de gestação em medicamentos das etapas 1 e 2 ---------- */
  var AINE = "AINE — evitar na gestação (contraindicado a partir de 20 semanas: oligoâmnio e fechamento do ducto arterial).";
  var gx = {
    ibuprofeno: AINE, naproxeno: AINE, diclofenaco: AINE, cetoprofeno: AINE, nimesulida: AINE, meloxicam: AINE, piroxicam: AINE, tenoxicam: AINE,
    celecoxibe: AINE, etoricoxibe: AINE, aceclofenaco: AINE, cetorolaco: AINE, aas: "AAS em dose analgésica — evitar na gestação.",
    doxiciclina: "contraindicada na gestação.", ciprofloxacino: "fluoroquinolona — evitar na gestação.", levofloxacino: "fluoroquinolona — evitar na gestação.",
    fluconazol: "via oral contraindicada na gestação.", itraconazol: "contraindicado na gestação.", griseofulvina: "contraindicada na gestação.", terbinafina_vo: "evitar na gestação.",
    ivermectina: "contraindicada na gestação — usar permetrina.", dhe_comb: "ergotamínico — contraindicado na gestação.", topiramato: "teratogênico — contraindicado na gestação.",
    isometepteno_comb: "evitar na gestação.", racecadotrila: "não recomendada na gestação.", carisoprodol_comb: "evitar na gestação.", tansulosina: "sem indicação na gestação."
  };
  var gc = {
    dipirona: "evitar no 1º e no 3º trimestre — preferir paracetamol.", smx_tmp: "evitar no 1º trimestre e no final da gestação.", metronidazol: "evitar a dose única de 2 g no 1º trimestre.",
    nitrofurantoina: "evitar a partir de 38 semanas.", ondansetrona: "preferir após o 1º trimestre (possível risco de fenda oral).", tramadol: "usar só se necessário e por pouco tempo.",
    codeina: "usar só se necessário e por pouco tempo.", codeina_paracetamol: "usar só se necessário e por pouco tempo.", sumatriptana: "usar só se paracetamol falhar.",
    naratriptana: "usar só se paracetamol falhar.", rizatriptana: "usar só se paracetamol falhar.", zolmitriptana: "usar só se paracetamol falhar.", propranolol: "risco de restrição de crescimento — acompanhar.",
    amitriptilina: "avaliar risco-benefício.", flunarizina: "avaliar risco-benefício.", ciclobenzaprina: "avaliar risco-benefício.", orfenadrina_comb: "contém dipirona — evitar no 1º e 3º trimestres.",
    tizanidina: "evitar.", baclofeno: "evitar.", gabapentina: "avaliar risco-benefício.", pregabalina: "avaliar risco-benefício.", prometazina: "evitar perto do parto.",
    hidroxizina: "evitar no 1º trimestre.", domperidona: "avaliar risco-benefício.", loperamida: "evitar no 1º trimestre.", fenazopiridina: "evitar.", valaciclovir: "preferir aciclovir.",
    fanciclovir: "preferir aciclovir.", clobetasol_cr: "corticoide potente — áreas pequenas e por pouco tempo.", deltametrina: "preferir permetrina.", escopolamina_dipirona: "contém dipirona — evitar no 1º e 3º trimestres.",
    levodropropizina: "evitar.", dropropizina: "evitar.", oximetazolina: "uso máximo 3 dias.", selenio_xampu: "evitar."
  };
  for (var a in gx) if (DB.drugs[a]) DB.drugs[a].gx = gx[a];
  for (var b in gc) if (DB.drugs[b] && !DB.drugs[b].gx) DB.drugs[b].gc = gc[b];

  var c = {
    antifung_vag: { n: "Antifúngicos vaginais (gestação: 7 noites)", d: ["miconazol_vag", "clotrimazol_vag", "nistatina_vag", "tioconazol_vag"] },
    antifung_cvv: { n: "Antifúngicos orais (fora da gestação)", d: ["fluconazol_cvv", "itraconazol_cvv"] },
    vaginose: { n: "Tratamento da vaginose bacteriana", d: ["metro_ist", "metro_gel", "clinda_vb", "clinda_vag", "secnidazol", "tinidazol"] },
    trico: { n: "Tratamento da tricomoníase (tratar parceria)", d: ["metro_ist", "secnidazol", "tinidazol"] },
    uretrite: { n: "Gonorreia + clamídia (tratamento combinado)", d: ["ceftriaxona_ist", "azitro_ist", "doxi_ist"] },
    dip: { n: "DIP ambulatorial (os 3 juntos)", d: ["ceftriaxona_ist", "doxi_dip", "metro_dip"] },
    sifilis: { n: "Sífilis", d: ["benzatina_ist", "doxi_ist", "ceftriaxona_ist"] },
    ulcera_gen: { n: "Úlcera genital (sífilis + cancroide; herpes se vesículas)", d: ["benzatina_ist", "azitro_ist", "cipro_cancro", "doxi_ist", "aciclovir_gen"] },
    herpes_gen: { n: "Antivirais (herpes genital)", d: ["aciclovir_gen", "valaciclovir_gen", "fanciclovir_gen"] },
    sint_gen: { n: "Sintomáticos locais", d: ["lidocaina_geleia", "compressa_fria"] },
    verrugas: { n: "Verrugas anogenitais (autoaplicação)", d: ["podofilotoxina", "imiquimode"] },
    aine_gin: { n: "Anti-inflamatórios (dismenorreia / sangramento)", d: ["mefenamico", "ibuprofeno", "naproxeno", "cetoprofeno", "diclofenaco", "nimesulida"] },
    calor: { n: "Medidas locais", d: ["bolsa_morna"] },
    hemostatico: { n: "Antifibrinolítico", d: ["tranexamico"] },
    hormonal_sua: { n: "Hormonais (sangramento uterino agudo — excluir gestação)", d: ["medroxiprogesterona", "aco_comb"] },
    ferro: { n: "Reposição de ferro", d: ["sulfato_ferroso"] },
    antiem_gest: { n: "Antieméticos na gestação", d: ["dimenidrinato", "metoclopramida", "bromoprida", "ondansetrona", "prometazina"] },
    analg_gest: { n: "Analgésicos (gestação: preferir paracetamol)", d: ["paracetamol", "dipirona", "escopolamina"] },
    atb_itu_gest: { n: "Antimicrobianos (ITU / bacteriúria na gestação)", d: ["cefalexina", "nitro_gest", "amoxicilina", "amoxclav", "fosfomicina"] },
    contracep_em: { n: "Contracepção de emergência", d: ["levonorgestrel"] },
    atb_mastite: { n: "Antimicrobianos (mastite lactacional)", d: ["cefalexina_mast", "amoxclav", "clindamicina"] },
    mama_med: { n: "Medidas para a mama", d: ["esvaziamento_mama", "compressa_fria"] },
    atb_prost: { n: "Antimicrobianos (prostatite aguda)", d: ["cipro_prost", "levo_prost", "smx_prost"] },
    alfa_bloq: { n: "Alfabloqueador (sintomas urinários)", d: ["tansulosina"] },
    atb_orq: { n: "Antimicrobianos (orquiepididimite)", d: ["ceftriaxona_ist", "doxi_orq", "levo_orq"] },
    pep_hiv: { n: "PEP — antirretrovirais (28 dias)", d: ["tdf_3tc", "dolutegravir"] },
    pep_ist: { n: "Profilaxia de IST após violência sexual", d: ["ceftriaxona_ist", "azitro_ist", "benzatina_ist", "metro_ist"] }
  };
  for (var k2 in c) DB.classes[k2] = c[k2];

  var P = function (id, n, cat, o) { var p = { id: id, n: n, cat: cat }; for (var k in o) p[k] = o[k]; return p; };
  var HEMO = "0202020380", PCR = "0202030202", EAS = "0202050017", URO = "0202080080", ATBG = "0202080013", GRAM = "0202080072",
      BHCG = "0202060217", TRG = "0214010066", HIV = "0214010058", SIF = "0214010074", HBV = "0214010104", HCV = "0214010090",
      VDRL = "0202031110", CTNG = "0202030997", FUNGO = "0202080137", CREAT = "0202010317", UREIA = "0202010694", GLI = "0202010473",
      HIVG = "0214010040", SIFG = "0214010082", VDRLG = "0202031179", HBSG = "0202031454", HCVG = "0202031489", ABO = "0202120023", RH = "0202120082",
      TAP = "0202020142", TTPA = "0202020134", TSH = "0202060250", FERRIT = "0202010384", TGO = "0202010643", TGP = "0202010651", K = "0202010600", NA = "0202010635",
      USGP = "0205020160", USGTV = "0205020186", USGOB = "0205020143", USGESC = "0205020070", USGPROST = "0205020100", USGMAMA = "0205020097", USGURI = "0205020054", CONS = "0301010072";
  var IST = [HIV, SIF, HBV, HCV];
  var novos = [
    P("corrimento-vaginal", "Corrimento vaginal (abordagem sindrômica)", "Ginecologia / IST", { alias: "corrimento vaginal leucorreia secrecao vaginal coceira vaginal odor fetido", cid: [["N76.0", "Vaginite aguda"], ["B37.3", "Candidíase da vulva e da vagina"], ["A59.0", "Tricomoníase urogenital"]], cls: ["antifung_vag", "antifung_cvv", "vaginose", "trico"], lab: [GRAM, FUNGO, TRG].concat(IST), comp: [] }),
    P("candidiase-vaginal", "Candidíase vulvovaginal", "Ginecologia / IST", { alias: "candidiase vaginal monilia corrimento branco grumoso coceira vaginal fungo", cid: [["B37.3", "Candidíase da vulva e da vagina"]], cls: ["antifung_vag", "antifung_cvv"], lab: [FUNGO, GLI], comp: [] }),
    P("vaginose", "Vaginose bacteriana", "Ginecologia / IST", { alias: "vaginose gardnerella corrimento cinza odor de peixe", cid: [["N76.0", "Vaginite aguda"], ["N76.1", "Vaginite subaguda e crônica"]], cls: ["vaginose"], lab: [GRAM], comp: [] }),
    P("tricomoniase", "Tricomoníase", "Ginecologia / IST", { alias: "tricomonas corrimento amarelo esverdeado bolhoso", cid: [["A59.0", "Tricomoníase urogenital"]], cls: ["trico"], lab: IST.slice(), comp: [], naoUsar: "Bebida alcoólica durante e até 3 dias após o metronidazol/secnidazol/tinidazol. " + PARC }),
    P("uretrite-cervicite", "Uretrite / cervicite (corrimento uretral)", "Ginecologia / IST", { alias: "uretrite gonorreia clamidia corrimento uretral pus no penis ardencia ao urinar cervicite", cid: [["A54.0", "Infecção gonocócica do trato geniturinário inferior sem abscesso"], ["A56.0", "Infecção por clamídias do trato geniturinário inferior"], ["N34.1", "Uretrites não específicas"], ["N72", "Doença inflamatória do colo do útero"]], cls: ["uretrite"], lab: [CTNG, GRAM].concat(IST), comp: [] }),
    P("dip", "Doença inflamatória pélvica (DIP) — ambulatorial", "Ginecologia / IST", { alias: "dip doenca inflamatoria pelvica dor pelvica febre corrimento dor a mobilizacao do colo anexite", cid: [["N73.9", "Doença inflamatória pélvica feminina não especificada"], ["N70.9", "Salpingite e ooforite não especificadas"]], cls: ["dip", "analg", "aine"], lab: [BHCG, HEMO, PCR, EAS, URO, CTNG].concat(IST), comp: [USGTV, USGP], alerta: "Internar se gestante, abscesso tubo-ovariano, peritonite, falha em 72 h ou intolerância oral. Reavaliar em 72 h. Retirar DIU não é obrigatório. " + PARC }),
    P("sifilis", "Sífilis (adquirida / na gestação)", "Ginecologia / IST", { alias: "sifilis cancro duro vdrl reagente teste rapido sifilis roseola sifilitica lues", cid: [["A53.9", "Sífilis não especificada"], ["A51.0", "Sífilis genital primária"], ["A51.3", "Sífilis secundária da pele e mucosas"], ["A52.8", "Sífilis tardia latente"], ["O98.1", "Sífilis complicando a gravidez, parto e puerpério"]], cls: ["sifilis"], lab: [SIF, VDRL, HIV, HBV, HCV], comp: [CONS], naoUsar: "Na gestante, doxiciclina ou ceftriaxona em lugar da penicilina benzatina (não tratam o feto — dessensibilizar se alérgica).", alerta: "Notificação compulsória. " + PARC + " VDRL de controle trimestral (mensal na gestante)." }),
    P("ulcera-genital", "Úlcera genital (abordagem sindrômica)", "Ginecologia / IST", { alias: "ulcera genital ferida no penis ferida na vagina cancro mole cancroide linfogranuloma donovanose", cid: [["N48.5", "Úlcera do pênis"], ["N76.6", "Ulceração vulvar"], ["A57", "Cancro mole"], ["A55", "Linfogranuloma venéreo por clamídia"]], cls: ["ulcera_gen", "sint_gen", "analg"], lab: [VDRL].concat(IST), comp: [] }),
    P("herpes-genital", "Herpes genital", "Ginecologia / IST", { alias: "herpes genital bolhas vesiculas genitais ardencia", cid: [["A60.0", "Infecção dos órgãos genitais e do trato geniturinário pelo vírus do herpes"]], cls: ["herpes_gen", "sint_gen", "analg"], lab: IST.slice(), comp: [] }),
    P("verrugas-genitais", "Verrugas anogenitais (condiloma / HPV)", "Ginecologia / IST", { alias: "condiloma verruga genital hpv crista de galo", cid: [["A63.0", "Verrugas anogenitais (venéreas)"]], cls: ["verrugas"], lab: IST.slice(), comp: [CONS] }),
    P("dismenorreia", "Dismenorreia (cólica menstrual)", "Ginecologia / IST", { alias: "colica menstrual dismenorreia dor menstrual", cid: [["N94.6", "Dismenorreia não especificada"], ["N94.4", "Dismenorreia primária"]], cls: ["aine_gin", "analg", "antiesp", "calor"], lab: [BHCG], comp: [USGTV, USGP] }),
    P("sangramento-uterino", "Sangramento uterino anormal agudo (não gestante)", "Ginecologia / IST", { alias: "sangramento vaginal menorragia hemorragia uterina sua sangramento menstrual aumentado metrorragia", cid: [["N92.0", "Menstruação excessiva e frequente com ciclo regular"], ["N93.9", "Sangramento anormal do útero ou da vagina, não especificado"]], cls: ["hemostatico", "aine_gin", "hormonal_sua", "ferro"], lab: [BHCG, HEMO, TAP, TTPA, TSH, FERRIT, ABO, RH], comp: [USGTV, USGP], alerta: "Instabilidade hemodinâmica, Hb < 7 g/dL, sangramento que encharca 1 absorvente/hora ou beta-hCG positivo — não é conduta ambulatorial." }),
    P("emese-gestacao", "Náuseas e vômitos da gestação", "Obstetrícia", { gest: true, alias: "enjoo gravidez nauseas gestacao vomitos gestante hiperemese", cid: [["O21.0", "Hiperêmese gravídica leve"], ["O21.9", "Vômitos da gravidez, não especificados"]], cls: ["antiem_gest", "hidrat"], lab: [EAS, NA, K, CREAT, UREIA, TGO, TGP, TSH], comp: [USGOB], alerta: "Desidratação, perda de peso > 5%, cetonúria ou distúrbio eletrolítico = hiperêmese gravídica — hidratar EV e internar." }),
    P("itu-gestante", "ITU / bacteriúria na gestação", "Obstetrícia", { gest: true, alias: "infeccao urinaria gestante gravida cistite gestacao bacteriuria assintomatica", cid: [["O23.1", "Infecções da bexiga na gravidez"], ["O23.4", "Infecção não especificada do trato urinário na gravidez"]], cls: ["atb_itu_gest", "analg_gest"], lab: [EAS, URO, ATBG, HEMO, CREAT], comp: [USGURI, USGOB], naoUsar: "Ciprofloxacino, levofloxacino e doxiciclina (gestação).", alerta: "Febre, dor lombar ou Giordano positivo = pielonefrite na gestante: internar. Urocultura de controle 7 dias após o tratamento." }),
    P("contracepcao-emergencia", "Contracepção de emergência", "Ginecologia / IST", { alias: "pilula do dia seguinte contracepcao de emergencia anticoncepcao de emergencia rompeu camisinha relacao desprotegida", cid: [["Z30.0", "Aconselhamento geral sobre contracepção"]], cls: ["contracep_em"], lab: [TRG].concat(IST), comp: [], alerta: "Se houve violência sexual, usar o protocolo Violência sexual / exposição sexual de risco (PEP + profilaxia de IST + notificação)." }),
    P("violencia-sexual", "Violência sexual / exposição sexual de risco (PEP)", "Ginecologia / IST", { alias: "violencia sexual estupro abuso sexual pep profilaxia pos exposicao exposicao sexual camisinha rompeu hiv", cid: [["T74.2", "Abuso sexual"], ["Z20.6", "Contato com e exposição ao vírus da imunodeficiência humana (HIV)"], ["Z20.2", "Contato com e exposição a infecções de transmissão predominantemente sexual"]], cls: ["pep_hiv", "pep_ist", "contracep_em", "antiem"], lab: [HIV, SIF, HBV, HCV, BHCG, TRG, CREAT, TGO, TGP, HEMO], comp: [], alerta: "PEP só até 72 h. Notificação compulsória (SINAN — violência interpessoal/autoprovocada); < 14 anos = Conselho Tutelar. Vacinar hepatite B (imunoglobulina se não vacinada e fonte de risco). Repetir testagem em 30 e 90 dias. Pediatria: esquema próprio do PCDT PEP." }),
    P("mastite", "Mastite lactacional", "Obstetrícia", { alias: "mastite mama inflamada amamentacao ingurgitamento mamario puerperio", cid: [["O91.2", "Mastite não purulenta associada ao parto"], ["O91.1", "Abscesso da mama associado ao parto"], ["N61", "Transtornos inflamatórios da mama"]], cls: ["atb_mastite", "mama_med", "analg", "aine"], lab: [HEMO, PCR], comp: [USGMAMA], alerta: "Manter a amamentação (suspender só na mama com abscesso drenando próximo à aréola). Ibuprofeno e cefalexina são compatíveis. Sem melhora em 48 h: USG para abscesso." }),
    P("prostatite", "Prostatite bacteriana aguda", "Urologia / Andrologia", { alias: "prostatite dor perineal disuria febre homem prostata dolorosa", cid: [["N41.0", "Prostatite aguda"]], cls: ["atb_prost", "alfa_bloq", "analg", "aine"], lab: [EAS, URO, ATBG, HEMO, PCR, CREAT, CTNG].concat(IST), comp: [USGPROST], alerta: "Não fazer massagem prostática nem toque vigoroso (bacteremia). Retenção urinária: evitar sonda uretral, encaminhar para cistostomia. Toxemia ou falha em 48 h: internar." }),
    P("orquiepididimite", "Orquiepididimite", "Urologia / Andrologia", { alias: "orquite epididimite dor no testiculo escroto inchado", cid: [["N45.9", "Orquite, epididimite e epidídimo-orquite, sem menção de abscesso"]], cls: ["atb_orq", "analg", "aine"], lab: [EAS, URO, CTNG].concat(IST), comp: [USGESC, CONS], alerta: "Dor testicular súbita em jovem = TORÇÃO até prova em contrário (cirurgia em até 6 h). Não tratar como orquiepididimite sem excluir (Prehn, reflexo cremastérico, Doppler)." })
  ];
  novos.forEach(function (p) { p.cid = p.cid.map(function (x) { return [x[0].replace(".", ""), x[1]]; }); DB.protocols.push(p); });

  /* exames de PS acrescentados às listas completas */
  [CTNG, HIVG, SIFG, VDRLG, HBSG, HCVG, ABO, RH, TSH, FERRIT, HBV, HCV, VDRL].forEach(function (x) { if (DB.labPS.indexOf(x) < 0) DB.labPS.push(x); });
  [USGPROST, USGMAMA].forEach(function (x) { if (DB.compPS.indexOf(x) < 0) DB.compPS.push(x); });
  DB.etapa = 3;
})();
