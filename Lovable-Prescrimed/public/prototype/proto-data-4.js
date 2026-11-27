/* ETAPA 4 — Cardiometabólico, neurologia e saúde mental. Acrescenta medicamentos, classes e protocolos ao PROTO_DB.
   ctrl = Receita de Controle Especial (C1, aba Controle especial); notif = Notificação de Receita (talonário — o app não imprime). */
(function () {
  "use strict";
  var DB = window.PROTO_DB; if (!DB) return;
  var T = function (t, q) { return q ? { t: t, q: q } : { t: t }; };
  var A = function (ap, q, pos, via) { return { ap: ap, q: q, via: via, pos: pos.map(function (p) { return typeof p === "string" ? { t: p } : p; }) }; };
  var SAME = function (min, nota) { return { same: true, min: min || 0, nota: nota }; };
  var SC = "Uso subcutâneo", EXT = "Uso externo", OFT = "Uso oftálmico";
  var IECA = "IECA/BRA — fetotóxico; contraindicado na gestação (usar metildopa, nifedipino retard ou hidralazina).";
  var ESTAT = "estatina — contraindicada na gestação.";
  var ISRS_G = "avaliar risco-benefício; não suspender abruptamente se já em uso.";
  var BZD = "B1";

  var d = {
    /* ---------- anti-hipertensivos ---------- */
    losartana: { n: "Losartana potássica", gx: IECA, nota: "Checar potássio e creatinina em 1 a 2 semanas. Não associar a IECA.",
      a: [A("50 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    enalapril: { n: "Maleato de enalapril", gx: IECA, nota: "Tosse seca e angioedema. Checar potássio e creatinina em 1 a 2 semanas.",
      a: [A("10 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")]), A("20 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    captopril: { n: "Captopril", gx: IECA, nota: "Tomar 1 hora antes das refeições. Não usar sublingual para 'baixar a pressão'.",
      a: [A("25 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    anlodipino: { n: "Besilato de anlodipino", gc: "preferir nifedipino retard ou metildopa.", nota: "Edema de tornozelo.",
      a: [A("5 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")]), A("10 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")])] },
    hctz: { n: "Hidroclorotiazida", gc: "evitar iniciar na gestação.", nota: "Hipocalemia, hiponatremia, gota. Pouco eficaz se TFG < 30.",
      a: [A("25 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido pela manhã, uso contínuo.", "30 comprimidos"), T("Tomar meio comprimido pela manhã, uso contínuo.", "15 comprimidos")])] },
    clortalidona: { n: "Clortalidona", gc: "evitar iniciar na gestação.", nota: "Hipocalemia, hiponatremia, gota.",
      a: [A("25 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (12,5 mg) pela manhã, uso contínuo.", "15 comprimidos"), T("Tomar 1 comprimido pela manhã, uso contínuo.", "30 comprimidos")])] },
    atenolol: { n: "Atenolol", gc: "restrição de crescimento fetal — preferir metildopa.", nota: "Contraindicado em asma, bradicardia, BAV.",
      a: [A("25 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")]), A("50 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")])] },
    carvedilol: { n: "Carvedilol", gc: "avaliar risco-benefício.", nota: "Tomar com alimento. Aumentar a dose devagar na insuficiência cardíaca. Contraindicado em asma.",
      a: [A("3,125 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, uso contínuo.", "60 comprimidos")]), A("6,25 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, uso contínuo.", "60 comprimidos")]), A("12,5 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, uso contínuo.", "60 comprimidos")]), A("25 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, uso contínuo.", "60 comprimidos")])] },
    espironolactona: { n: "Espironolactona", gx: "antiandrogênico — contraindicada na gestação.", nota: "Hipercalemia: checar potássio e creatinina. Ginecomastia.",
      a: [A("25 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido pela manhã, uso contínuo.", "30 comprimidos")])] },
    furosemida: { n: "Furosemida", gc: "evitar (reduz perfusão placentária) salvo edema agudo/IC.", nota: "Tomar pela manhã. Hipocalemia, desidratação.",
      a: [A("40 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido pela manhã, uso contínuo.", "30 comprimidos"), T("Tomar 1 comprimido às 8 h e 1 comprimido às 14 h, uso contínuo.", "60 comprimidos"), T("Tomar 1 comprimido pela manhã por 5 dias.", "5 comprimidos")])] },
    metildopa: { n: "Metildopa", nota: "Primeira escolha na gestação. Sonolência, hipotensão postural.",
      a: [A("250 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos"), T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")]), A("500 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos")])] },
    nifedipino: { n: "Nifedipino (liberação prolongada)", nota: "Usar só a forma retard. Nunca a cápsula de liberação imediata sublingual.",
      a: [A("20 mg comprimido de liberação prolongada", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos"), T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")])] },
    hidralazina: { n: "Cloridrato de hidralazina", nota: "Taquicardia reflexa e cefaleia. Associar betabloqueador fora da gestação.",
      a: [A("25 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos")]), A("50 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos")])] },
    pesagem: { n: "Controle de peso e líquidos", via: EXT, a: [A("orientação", "—", ["Pesar-se todo dia pela manhã, após urinar. Se ganhar mais de 2 kg em 3 dias ou o inchaço/falta de ar piorar, voltar ao hospital. Limitar sal e beber no máximo 1,5 litro de líquidos por dia."], EXT)] },
    mrpa: { n: "Medição da pressão em casa", via: EXT, a: [A("orientação", "—", ["Medir a pressão sentado, após 5 minutos de repouso, de manhã e à noite por 7 dias, anotar e levar à consulta na UBS. Voltar se pressão ≥ 180/110 com dor no peito, falta de ar, fraqueza de um lado do corpo, confusão ou dor de cabeça forte."], EXT)] },

    /* ---------- antidiabéticos ---------- */
    metformina: { n: "Cloridrato de metformina", nota: "Contraindicada se TFG < 30; suspender em desidratação, vômitos ou contraste iodado. Diarreia no início.",
      a: [A("500 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido no jantar por 7 dias; depois 1 comprimido no café da manhã e 1 no jantar, junto com a refeição.", "60 comprimidos"), T("Tomar 1 comprimido no café da manhã e 1 no jantar, junto com a refeição.", "60 comprimidos")]), A("850 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido no café da manhã e 1 no jantar, junto com a refeição.", "60 comprimidos"), T("Tomar 1 comprimido no café, 1 no almoço e 1 no jantar, junto com a refeição.", "90 comprimidos")]), A("500 mg comprimido de liberação prolongada (XR)", "60 comprimidos", [T("Tomar 2 comprimidos no jantar.", "60 comprimidos")])] },
    glibenclamida: { n: "Glibenclamida", gc: "preferir insulina.", nota: "Risco de hipoglicemia (idosos, doença renal). Não pular refeições.",
      a: [A("5 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido antes do café da manhã, uso contínuo.", "30 comprimidos"), T("Tomar 1 comprimido antes do café da manhã e 1 antes do jantar, uso contínuo.", "60 comprimidos")])] },
    gliclazida: { n: "Gliclazida (liberação modificada)", gc: "preferir insulina.", nota: "Menor risco de hipoglicemia que a glibenclamida. Não partir o comprimido de 30 mg.",
      a: [A("30 mg comprimido de liberação modificada", "30 comprimidos", [T("Tomar 1 comprimido no café da manhã, uso contínuo.", "30 comprimidos")]), A("60 mg comprimido de liberação modificada", "30 comprimidos", [T("Tomar 1 comprimido no café da manhã, uso contínuo.", "30 comprimidos")])] },
    dapagliflozina: { n: "Dapagliflozina", gx: "contraindicada na gestação.", nota: "Infecção genital por fungo; cetoacidose euglicêmica — suspender se vômitos, desidratação ou jejum. Benefício renal e na IC.",
      a: [A("10 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")])] },
    insulina_nph: { n: "Insulina humana NPH", ins: true, via: SC, nota: "Com peso informado, a dose é calculada por kg (0,1–0,2 UI/kg) com regra de titulação pela glicemia de jejum. Ensinar aplicação, rodízio dos locais, conservação na geladeira e sinais de hipoglicemia.",
      a: [A("100 UI/mL suspensão injetável (frasco de 10 mL)", "1 frasco", [T("Aplicar 10 unidades por via subcutânea às 22 horas. Medir a glicemia em jejum todo dia: se acima de 130 por 3 dias seguidos, aumentar 2 unidades; se abaixo de 80, diminuir 4 unidades.", "1 frasco"), T("Aplicar 10 unidades por via subcutânea antes do café da manhã e 10 unidades às 22 horas.", "2 frascos")], SC), A("100 UI/mL — refil/caneta de 3 mL", "5 canetas", [T("Aplicar 10 unidades por via subcutânea às 22 horas, com ajuste de 2 unidades a cada 3 dias conforme a glicemia de jejum (meta 80 a 130).", "5 canetas")], SC)] },
    seringa_insulina: { n: "Seringa para insulina 100 UI com agulha 6 mm (ou agulha de caneta 4 mm)", via: SC, a: [A("unidade", "30 unidades", ["Usar 1 seringa ou agulha nova por aplicação (ou conforme orientação da UBS)."], SC)] },
    glicemia_cap: { n: "Fitas e lancetas para glicemia capilar", via: EXT, a: [A("orientação", "—", [T("Medir a glicemia em jejum todos os dias (e antes do jantar se usar insulina 2 vezes ao dia), anotar e levar à consulta. Retirar fitas, lancetas e glicosímetro na UBS.", "conforme UBS")], EXT)] },
    regra15: { n: "Conduta na hipoglicemia (regra dos 15)", via: EXT, a: [A("orientação", "—", ["Se glicemia abaixo de 70 ou tremor, suor frio, confusão: tomar 15 g de açúcar (1 colher de sopa de açúcar em meio copo de água, ou 150 mL de suco ou refrigerante comum), medir de novo em 15 minutos e repetir se ainda abaixo de 70. Depois, fazer um lanche. Se desmaiar ou não conseguir engolir: ligar 192."], EXT)], p: SAME(0) },

    /* ---------- vertigem ---------- */
    meclizina: { n: "Cloridrato de meclizina", nota: "Sonolência. Usar só na crise (até 3 dias): prolongar atrasa a compensação vestibular.",
      a: [A("25 mg comprimido", "9 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas se tontura, por até 3 dias.", "9 comprimidos")]), A("50 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas se tontura, por até 3 dias.", "6 comprimidos")])] },
    cinarizina: { n: "Cinarizina", gc: "avaliar risco-benefício.", nota: "Sonolência; parkinsonismo e depressão em idosos — uso curto.",
      a: [A("25 mg comprimido", "15 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, por até 5 dias.", "15 comprimidos")]), A("75 mg comprimido", "5 comprimidos", [T("Tomar 1 comprimido à noite, por até 5 dias.", "5 comprimidos")])] },
    betaistina: { n: "Dicloridrato de betaistina", gc: "evitar.", nota: "Indicada na doença de Ménière; pouco benefício na VPPB. Cuidado em asma e úlcera.",
      a: [A("16 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, com alimento, por 30 dias.", "90 comprimidos")]), A("24 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, com alimento, por 30 dias.", "60 comprimidos")])] },
    diazepam: { n: "Diazepam", notif: BZD, gc: "evitar no 1º trimestre e perto do parto.", nota: "Sedação, queda, dependência. Não dirigir. Não associar a álcool.",
      a: [A("5 mg comprimido", "6 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas se crise de vertigem intensa, por até 3 dias.", "6 comprimidos")]), A("10 mg comprimido", "11 comprimidos", [T("Abstinência alcoólica: tomar 1 comprimido de 8 em 8 horas nos dias 1 e 2, de 12 em 12 horas nos dias 3 e 4 e 1 comprimido no dia 5; depois parar.", "11 comprimidos")])] },
    brandt_daroff: { n: "Exercícios de Brandt-Daroff / manobra de reposição", via: EXT, a: [A("orientação", "—", ["Sentado na beira da cama, deitar rápido para um lado com o rosto virado 45° para cima e ficar 30 segundos (ou até passar a tontura); sentar por 30 segundos; repetir para o outro lado. Fazer 5 vezes seguidas, 3 vezes ao dia, por 2 semanas. Levantar devagar e evitar dirigir na crise."], EXT)] },

    /* ---------- ansiedade / depressão / insônia ---------- */
    sertralina: { n: "Cloridrato de sertralina", ctrl: true, gc: "ISRS preferido na gestação; " + ISRS_G, nota: "Efeito começa em 2 a 4 semanas. Náusea e ansiedade nos primeiros dias. Não parar de repente.",
      a: [A("50 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (25 mg) pela manhã por 7 dias; depois 1 comprimido pela manhã, uso contínuo até a consulta.", "30 comprimidos"), T("Tomar 1 comprimido pela manhã, uso contínuo até a consulta.", "30 comprimidos")])] },
    escitalopram: { n: "Oxalato de escitalopram", ctrl: true, gc: ISRS_G, nota: "Efeito em 2 a 4 semanas. QT longo em doses altas. Não parar de repente.",
      a: [A("10 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (5 mg) pela manhã por 7 dias; depois 1 comprimido pela manhã, uso contínuo até a consulta.", "30 comprimidos"), T("Tomar 1 comprimido pela manhã, uso contínuo até a consulta.", "30 comprimidos")])] },
    fluoxetina: { n: "Cloridrato de fluoxetina", ctrl: true, gc: ISRS_G, nota: "Pode dar insônia e agitação no início: tomar pela manhã. Muitas interações.",
      a: [A("20 mg cápsula", "30 cápsulas", [T("Tomar 1 cápsula pela manhã, uso contínuo até a consulta.", "30 cápsulas")])] },
    paroxetina: { n: "Cloridrato de paroxetina", ctrl: true, gx: "associada a malformação cardíaca — evitar na gestação.", nota: "Síndrome de descontinuação marcante. Ganho de peso.",
      a: [A("20 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (10 mg) pela manhã por 7 dias; depois 1 comprimido pela manhã, uso contínuo até a consulta.", "30 comprimidos")])] },
    clonazepam: { n: "Clonazepam", notif: BZD, gc: "evitar no 1º trimestre e perto do parto.", nota: "Ponte de no máximo 2 a 4 semanas enquanto o antidepressivo age. Dependência; não dirigir; não associar a álcool.",
      a: [A("0,5 mg comprimido", "28 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas por até 14 dias.", "28 comprimidos"), T("Tomar 1 comprimido à noite por até 14 dias.", "14 comprimidos")]), A("2,5 mg/mL solução oral (gotas)", "1 frasco de 20 mL", [T("Tomar 5 gotas (0,5 mg) de 12 em 12 horas por até 14 dias.", "1 frasco de 20 mL")])] },
    alprazolam: { n: "Alprazolam", notif: BZD, gc: "evitar no 1º trimestre e perto do parto.", nota: "Meia-vida curta: maior risco de dependência e rebote.",
      a: [A("0,25 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido se crise, até 2 vezes ao dia, por até 14 dias.", "20 comprimidos")]), A("0,5 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido se crise, até 2 vezes ao dia, por até 14 dias.", "20 comprimidos")])] },
    hidroxizina_ans: { n: "Cloridrato de hidroxizina", gc: "evitar no 1º trimestre.", nota: "Ansiolítico não controlado; sedação; QT longo.",
      a: [A("25 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido se ansiedade, até 3 vezes ao dia, por até 7 dias.", "20 comprimidos"), T("Tomar 1 comprimido à noite por 7 dias.", "7 comprimidos")])] },
    propranolol_ans: { n: "Cloridrato de propranolol", gc: "restrição de crescimento fetal em uso prolongado.", nota: "Para tremor e palpitação. Contraindicado em asma, bradicardia e hipotensão.",
      a: [A("10 mg comprimido", "20 comprimidos", [T("Tomar 1 comprimido se palpitação ou tremor, até 3 vezes ao dia.", "20 comprimidos")]), A("40 mg comprimido", "20 comprimidos", [T("Tomar meio comprimido (20 mg) se palpitação ou tremor, até 2 vezes ao dia.", "10 comprimidos")])] },
    respiracao: { n: "Respiração e manejo da crise", via: EXT, a: [A("orientação", "—", ["Na crise: sentar, puxar o ar pelo nariz contando até 4, segurar 2 segundos e soltar pela boca contando até 6, por 5 minutos. A crise de ansiedade passa sozinha em 10 a 20 minutos. Evitar café, energético e álcool. Procurar a UBS/CAPS para acompanhamento."], EXT)] },
    trazodona: { n: "Cloridrato de trazodona", ctrl: true, gc: ISRS_G, nota: "Sonolência e tontura ao levantar. Priapismo (raro): procurar atendimento.",
      a: [A("50 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (25 mg) 30 minutos antes de deitar por 3 dias; depois 1 comprimido, uso contínuo até a consulta.", "30 comprimidos"), T("Tomar 1 comprimido 30 minutos antes de deitar, uso contínuo até a consulta.", "30 comprimidos")])] },
    mirtazapina: { n: "Mirtazapina", ctrl: true, gc: ISRS_G, nota: "Sonolência e aumento de apetite/peso.",
      a: [A("15 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido (7,5 mg) à noite, uso contínuo até a consulta.", "15 comprimidos"), T("Tomar 1 comprimido à noite, uso contínuo até a consulta.", "30 comprimidos")])] },
    zolpidem: { n: "Hemitartarato de zolpidem", notif: BZD, gc: "evitar.", nota: "Desde 2024 todas as doses exigem Notificação B (azul). Sonambulismo/amnésia; uso máximo 2 a 4 semanas; 5 mg em mulheres e idosos.",
      a: [A("5 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido ao deitar, só se necessário, por até 14 dias.", "14 comprimidos")]), A("10 mg comprimido", "14 comprimidos", [T("Tomar 1 comprimido ao deitar, só se necessário, por até 14 dias.", "14 comprimidos")])] },
    higiene_sono: { n: "Higiene do sono", via: EXT, a: [A("orientação", "—", ["Deitar e levantar sempre no mesmo horário; usar a cama só para dormir; sair da cama se não dormir em 20 minutos; evitar celular/TV 1 hora antes, café após 14 h, álcool e cochilos longos; atividade física pela manhã."], EXT)] },

    /* ---------- álcool ---------- */
    tiamina: { n: "Cloridrato de tiamina (vitamina B1)", nota: "Dar ANTES de glicose em etilista. Suspeita de Wernicke (confusão, ataxia, nistagmo) = tiamina IV e internação.",
      a: [A("300 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 30 dias.", "30 comprimidos")])] },
    acido_folico: { n: "Ácido fólico", nota: "Também indicado em usuários de anticonvulsivantes que planejam gestar.",
      a: [A("5 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia por 30 dias.", "30 comprimidos")])] },
    carbamazepina_abst: { n: "Carbamazepina", ctrl: true, gc: "teratogênica — evitar.", nota: "Alternativa sem benzodiazepínico na abstinência leve. Tontura, rash (Stevens-Johnson), hiponatremia; muitas interações.",
      a: [A("200 mg comprimido", "19 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas por 5 dias, depois 1 comprimido de 12 em 12 horas por 2 dias; depois parar.", "19 comprimidos")])] },
    naltrexona: { n: "Cloridrato de naltrexona", gc: "evitar.", nota: "Reduz a fissura. Contraindicada com opioides em uso e hepatite aguda/insuficiência hepática. Iniciar após a abstinência.",
      a: [A("50 mg comprimido", "30 comprimidos", [T("Tomar meio comprimido por 3 dias; depois 1 comprimido 1 vez ao dia, uso contínuo até a consulta no CAPS AD.", "30 comprimidos")])] },
    caps_ad: { n: "Encaminhamento CAPS AD / UBS", via: EXT, a: [A("orientação", "—", ["Procurar o CAPS AD ou a UBS em até 7 dias. Não dirigir. Não ficar sozinho nos primeiros dias. Voltar imediatamente se tremor intenso, confusão, alucinações, convulsão, febre ou vômitos que não param."], EXT)] },

    /* ---------- paralisia facial ---------- */
    prednisona_bell: { n: "Prednisona", gc: "corticoide: usar se indicado, por pouco tempo.", nota: "Iniciar em até 72 h. Tomar pela manhã, após o café. Diabéticos: monitorar glicemia.",
      a: [A("20 mg comprimido", "25 comprimidos", [T("Tomar 2 comprimidos e meio (50 mg) pela manhã por 10 dias.", "25 comprimidos"), T("Tomar 3 comprimidos (60 mg) pela manhã por 5 dias; depois 2 e meio por 1 dia, 2 por 1 dia, 1 e meio por 1 dia, 1 por 1 dia e meio comprimido por 1 dia; depois parar.", "23 comprimidos")])] },
    valaciclovir_bell: { n: "Cloridrato de valaciclovir", gc: "preferir aciclovir.", nota: "Só associado ao corticoide, em paralisia grave/completa (benefício pequeno). Ajustar em doença renal.",
      a: [A("500 mg comprimido", "42 comprimidos", [T("Tomar 2 comprimidos (1 g) de 8 em 8 horas por 7 dias.", "42 comprimidos")])] },
    aciclovir_bell: { n: "Aciclovir", nota: "Só associado ao corticoide, em paralisia grave/completa. Hidratar bem.",
      a: [A("400 mg comprimido", "50 comprimidos", [T("Tomar 1 comprimido 5 vezes ao dia (de 4 em 4 horas, pulando a madrugada) por 10 dias.", "50 comprimidos")])] },
    carbomero_gel: { n: "Carbômero (gel oftálmico lubrificante)", via: OFT, nota: "Proteção da córnea quando o olho não fecha.",
      a: [A("2 mg/g gel oftálmico", "1 tubo de 10 g", ["Aplicar 1 gota no olho do lado paralisado 4 vezes ao dia e uma porção maior antes de dormir."], OFT)], p: SAME(0) },
    oclusao_ocular: { n: "Proteção do olho", via: EXT, a: [A("orientação", "—", ["Usar óculos de sol de dia. À noite, fechar a pálpebra com cuidado e prender com esparadrapo micropore. Voltar se o olho ficar vermelho, doloroso ou a visão piorar."], EXT)], p: SAME(0) },

    /* ---------- AIT / prevenção secundária ---------- */
    aas_100: { n: "Ácido acetilsalicílico", gc: "dose baixa é compatível (ex.: profilaxia de pré-eclâmpsia).", nota: "Tomar após o almoço. Sangramento digestivo: associar IBP se > 65 anos ou úlcera prévia.",
      a: [A("100 mg comprimido", "30 comprimidos", [T("Tomar 3 comprimidos (300 mg) hoje e depois 1 comprimido por dia após o almoço, uso contínuo.", "32 comprimidos"), T("Tomar 1 comprimido por dia após o almoço, uso contínuo.", "30 comprimidos")])] },
    clopidogrel: { n: "Bissulfato de clopidogrel", gc: "avaliar risco-benefício.", nota: "AIT de alto risco/AVC menor: dupla antiagregação (com AAS) por 21 dias, depois só um. Sangramento.",
      a: [A("75 mg comprimido", "24 comprimidos", [T("Tomar 4 comprimidos (300 mg) hoje e depois 1 comprimido por dia por 21 dias, junto com o AAS.", "24 comprimidos"), T("Tomar 1 comprimido por dia, uso contínuo.", "30 comprimidos")])] },
    atorvastatina: { n: "Atorvastatina cálcica", gx: ESTAT, nota: "Dor muscular forte ou urina escura: suspender e procurar atendimento.",
      a: [A("40 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")]), A("80 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")]), A("20 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")])] },
    sinvastatina: { n: "Sinvastatina", gx: ESTAT, nota: "Tomar à noite. Interação com anlodipino (máx. 20 mg), amiodarona, claritromicina.",
      a: [A("40 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")]), A("20 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")])] },
    rosuvastatina: { n: "Rosuvastatina cálcica", gx: ESTAT, nota: "Ajustar em doença renal grave.",
      a: [A("20 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")]), A("10 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido 1 vez ao dia, uso contínuo.", "30 comprimidos")])] },

    /* ---------- epilepsia (paciente conhecido) ---------- */
    fenitoina: { n: "Fenitoína", ctrl: true, gc: "teratogênica, mas NÃO suspender em gestante epiléptica — associar ácido fólico 5 mg e encaminhar ao pré-natal de alto risco.", nota: "Nível sérico se crise com adesão referida. Hiperplasia gengival; muitas interações.",
      a: [A("100 mg comprimido", "90 comprimidos", [T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos"), T("Tomar 3 comprimidos (300 mg) à noite, uso contínuo.", "90 comprimidos")])] },
    carbamazepina: { n: "Carbamazepina", ctrl: true, gc: "teratogênica, mas NÃO suspender em gestante epiléptica — ácido fólico 5 mg e alto risco.", nota: "Hiponatremia, rash; indutor enzimático (reduz anticoncepcional).",
      a: [A("200 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos"), T("Tomar 1 comprimido de 8 em 8 horas, uso contínuo.", "90 comprimidos")]), A("400 mg comprimido de liberação controlada", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    valproato: { n: "Ácido valproico / valproato de sódio", ctrl: true, gx: "altamente teratogênico — não iniciar em gestante ou mulher em idade fértil sem contracepção (alerta Anvisa).", nota: "Hepatotoxicidade, pancreatite, plaquetopenia; ganho de peso.",
      a: [A("250 mg cápsula", "60 cápsulas", [T("Tomar 1 cápsula de 12 em 12 horas, uso contínuo.", "60 cápsulas")]), A("500 mg comprimido (divalproato)", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    levetiracetam: { n: "Levetiracetam", gc: "opção mais segura na gestação — manter.", nota: "Irritabilidade e alteração de humor. Ajustar em doença renal.",
      a: [A("500 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")]), A("750 mg comprimido", "60 comprimidos", [T("Tomar 1 comprimido de 12 em 12 horas, uso contínuo.", "60 comprimidos")])] },
    fenobarbital: { n: "Fenobarbital", notif: BZD, gc: "teratogênico — não suspender abruptamente.", nota: "Sedação; indutor enzimático.",
      a: [A("100 mg comprimido", "30 comprimidos", [T("Tomar 1 comprimido à noite, uso contínuo.", "30 comprimidos")]), A("40 mg/mL solução oral (gotas)", "1 frasco de 20 mL", [T("Tomar conforme dose habitual à noite.", "1 frasco de 20 mL")])] },
    crise_conv: { n: "Orientações para convulsão", via: EXT, a: [A("orientação", "—", ["Tomar o remédio todo dia no mesmo horário, sem pular dose; dormir bem; evitar álcool. Não dirigir, nadar sozinho ou trabalhar em altura até liberação médica. Na crise: deitar de lado, proteger a cabeça, não colocar nada na boca; ligar 192 se durar mais de 5 minutos ou não acordar entre as crises."], EXT)], p: SAME(0) }
  };
  for (var k in d) DB.drugs[k] = d[k];

  var c = {
    anti_has: { n: "Anti-hipertensivos (início/ajuste)", d: ["losartana", "enalapril", "captopril", "anlodipino", "hctz", "clortalidona", "atenolol", "carvedilol", "espironolactona", "furosemida"] },
    anti_has_gest: { n: "Anti-hipertensivos na gestação", d: ["metildopa", "nifedipino", "hidralazina"] },
    has_orient: { n: "Orientações (pressão)", d: ["mrpa"] },
    antidiab_or: { n: "Antidiabéticos orais", d: ["metformina", "gliclazida", "glibenclamida", "dapagliflozina"] },
    insulina: { n: "Insulina e insumos", d: ["insulina_nph", "seringa_insulina", "glicemia_cap"] },
    hipo: { n: "Hipoglicemia — orientação", d: ["regra15"] },
    antivert: { n: "Supressores vestibulares (só na crise)", d: ["meclizina", "dimenidrinato", "prometazina", "cinarizina", "flunarizina", "betaistina", "diazepam"] },
    vert_orient: { n: "Reabilitação vestibular", d: ["brandt_daroff"] },
    antidep: { n: "Antidepressivos ISRS (receita de controle especial)", d: ["sertralina", "escitalopram", "fluoxetina", "paroxetina"] },
    ansiol: { n: "Ansiolíticos de curto prazo", d: ["hidroxizina_ans", "propranolol_ans", "clonazepam", "alprazolam", "diazepam"] },
    ans_orient: { n: "Manejo não farmacológico", d: ["respiracao"] },
    hipnot: { n: "Insônia", d: ["trazodona", "mirtazapina", "amitriptilina", "zolpidem"] },
    sono_orient: { n: "Higiene do sono", d: ["higiene_sono"] },
    vitam_alc: { n: "Vitaminas (etilismo)", d: ["tiamina", "acido_folico"] },
    abst: { n: "Abstinência leve (CIWA-Ar < 10)", d: ["diazepam", "carbamazepina_abst"] },
    alc_manut: { n: "Manutenção e encaminhamento", d: ["naltrexona", "caps_ad"] },
    cortic_bell: { n: "Corticoide (paralisia de Bell)", d: ["prednisona_bell", "prednisolona"] },
    antiv_bell: { n: "Antiviral (só casos graves, com corticoide)", d: ["valaciclovir_bell", "aciclovir_bell"] },
    olho_bell: { n: "Proteção ocular", d: ["carbomero_gel", "carmelose", "oclusao_ocular"] },
    antiagreg: { n: "Antiagregantes", d: ["aas_100", "clopidogrel"] },
    estatina: { n: "Estatinas de alta intensidade", d: ["atorvastatina", "rosuvastatina", "sinvastatina"] },
    anticonv: { n: "Anticonvulsivantes (manter/ajustar dose habitual)", d: ["fenitoina", "carbamazepina", "valproato", "levetiracetam", "fenobarbital"] },
    conv_orient: { n: "Orientações", d: ["crise_conv", "acido_folico"] },
    ic_diur: { n: "Diuréticos (congestão)", d: ["furosemida", "espironolactona", "hctz"] },
    ic_base: { n: "Terapia de base da IC (ajuste)", d: ["enalapril", "losartana", "carvedilol", "dapagliflozina"] },
    ic_orient: { n: "Orientações (IC)", d: ["pesagem"] }
  };
  for (var k2 in c) DB.classes[k2] = c[k2];

  var P = function (id, n, cat, o) { var p = { id: id, n: n, cat: cat }; for (var k in o) p[k] = o[k]; return p; };
  var HEMO = "0202020380", PCR = "0202030202", GLI = "0202010473", HBA1C = "0202010503", CREAT = "0202010317", UREIA = "0202010694", NA = "0202010635", K = "0202010600",
      EAS = "0202050017", CT = "0202010295", HDL = "0202010279", LDL = "0202010287", TG = "0202010678", AU = "0202010120", MICRO = "0202050092", TSH = "0202060250", T4L = "0202060381",
      TROP = "0202031209", CK = "0202010325", CKMB = "0202010333", BNP = "0202010791", TGO = "0202010643", TGP = "0202010651", GGT = "0202010465", B12 = "0202010708", FOL = "0202010406",
      MG = "0202010562", CA = "0202010210", GASO = "0202010732", CETON = "0214010023", ALC = "0202070077", NVPA = "0202070050", NCBZ = "0202070158", NFNT = "0202070220", HIV = "0214010058", SIF = "0214010074",
      ECG = "0211020036", HOLTER = "0211020044", ERGO = "0211020060", ECO = "0205010032", DOPPLER = "0205010040", TCC = "0206010079", RMC = "0207010064", EEG = "0211050024", FUNDO = "0211060100",
      AUDIO = "0211070041", IMIT = "0211070203", RXT = "0204030153", CONS = "0301010072", CAPSAD = "0301080097";
  var LIP = [CT, HDL, LDL, TG];
  var novos = [
    P("urgencia-hipertensiva", "Hipertensão descompensada / urgência hipertensiva (sem lesão de órgão-alvo)", "Cardiovascular / Metabólico", { alias: "pressao alta urgencia hipertensiva has descompensada hipertensao arterial pico hipertensivo", cid: [["I10", "Hipertensão essencial (primária)"], ["I11.9", "Doença cardíaca hipertensiva sem insuficiência cardíaca"]], cls: ["anti_has", "anti_has_gest", "has_orient"], lab: [CREAT, UREIA, K, NA, GLI, EAS, AU, MICRO].concat(LIP), comp: [ECG, ECO, FUNDO, CONS], alerta: "Emergência (dor torácica, dispneia/EAP, déficit neurológico, confusão, dissecção, eclâmpsia) não é este protocolo. Na urgência: reduzir em 24–48 h com medicação oral; não usar nifedipino sublingual. Retorno na UBS em até 7 dias." }),
    P("hiperglicemia", "Hiperglicemia / diabetes descompensado (sem cetoacidose ou EHH)", "Cardiovascular / Metabólico", { alias: "glicemia alta diabetes descompensado hiperglicemia dm2 acucar alto", cid: [["E11.9", "Diabetes mellitus não-insulino-dependente sem complicações"], ["E14.9", "Diabetes mellitus não especificado sem complicações"], ["E10.9", "Diabetes mellitus insulino-dependente sem complicações"]], cls: ["antidiab_or", "insulina", "hipo"], lab: [GLI, HBA1C, CREAT, UREIA, NA, K, EAS, CETON, MICRO].concat(LIP), comp: [ECG, FUNDO, CONS], alerta: "Cetonúria ≥ 2+, pH < 7,3, bicarbonato < 18, glicemia > 600, desidratação ou rebaixamento = CAD/EHH: internar. DM1 nunca fica sem insulina." }),
    P("hipoglicemia", "Hipoglicemia corrigida (alta após observação)", "Cardiovascular / Metabólico", { alias: "hipoglicemia glicemia baixa acucar baixo", cid: [["E16.2", "Hipoglicemia não especificada"], ["E16.0", "Hipoglicemia induzida por droga, sem coma"]], cls: ["hipo", "antidiab_or", "insulina"], lab: [GLI, CREAT, UREIA, HBA1C], comp: [CONS], alerta: "Causada por sulfonilureia (glibenclamida/gliclazida): observar 24 h (recorrência tardia) e suspender/trocar. Reduzir insulina em 10–20%. Investigar doença renal e infecção." }),
    P("vertigem", "Vertigem periférica (VPPB, neurite vestibular)", "Neurologia", { alias: "tontura vertigem labirintite vppb labirinto rodando neurite vestibular meniere", cid: [["H81.1", "Vertigem paroxística benigna"], ["H81.2", "Neuronite vestibular"], ["R42", "Tontura e instabilidade"], ["H81.0", "Doença de Ménière"]], cls: ["antivert", "antiem", "vert_orient"], lab: [GLI, HEMO], comp: [AUDIO, IMIT, CONS], alerta: "HINTS central, cefaleia súbita, déficit neurológico, ataxia de marcha, diplopia/disartria ou idoso com fatores de risco = AVC de circulação posterior até prova em contrário (TC/RM e regulação). Supressor vestibular só por até 3 dias." }),
    P("ansiedade", "Crise de ansiedade / pânico", "Saúde mental", { alias: "ansiedade crise de panico ataque de panico nervosismo crise nervosa taquicardia emocional", cid: [["F41.0", "Transtorno de pânico (ansiedade paroxística episódica)"], ["F41.1", "Ansiedade generalizada"], ["F41.9", "Transtorno ansioso não especificado"]], cls: ["ans_orient", "ansiol", "antidep"], lab: [GLI, TSH, HEMO, NA, K], comp: [ECG, CONS], alerta: "Diagnóstico de exclusão: ECG e glicemia antes de rotular (SCA, arritmia, TEP, hipoglicemia, tireotoxicose, abstinência). Avaliar risco de suicídio. Benzodiazepínico só como ponte (≤ 2–4 semanas, Notificação B)." }),
    P("depressao", "Episódio depressivo leve a moderado (sem risco iminente)", "Saúde mental", { alias: "depressao tristeza desanimo episodio depressivo choro", cid: [["F32.0", "Episódio depressivo leve"], ["F32.1", "Episódio depressivo moderado"], ["F32.9", "Episódio depressivo não especificado"]], cls: ["antidep", "hipnot", "ans_orient"], lab: [TSH, HEMO, GLI, B12], comp: [CONS], alerta: "Perguntar ativamente sobre ideação suicida: plano, tentativa recente, psicose, agitação ou rede de apoio frágil = NÃO liberar (observação, psiquiatria/CAPS, CVV 188). Sintomas de mania prévia: não iniciar ISRS isolado. Reavaliar em 2–4 semanas." }),
    P("insonia", "Insônia", "Saúde mental", { alias: "insonia nao consegue dormir dificuldade para dormir sono", cid: [["G47.0", "Distúrbios do início e da manutenção do sono (insônias)"], ["F51.0", "Insônia não-orgânica"]], cls: ["sono_orient", "hipnot"], lab: [TSH, HEMO], comp: [CONS], alerta: "Primeira linha é higiene do sono/TCC-I. Investigar depressão, ansiedade, apneia, dor, álcool e cafeína. Hipnótico por no máximo 2–4 semanas." }),
    P("abstinencia-alcool", "Abstinência alcoólica leve / pós-intoxicação", "Saúde mental", { alias: "abstinencia alcoolica alcool tremor etilismo intoxicacao alcoolica bebida pinguço etilista", cid: [["F10.3", "Transtornos mentais e comportamentais devidos ao uso de álcool — síndrome de abstinência"], ["F10.0", "Transtornos mentais e comportamentais devidos ao uso de álcool — intoxicação aguda"], ["F10.2", "Transtornos mentais e comportamentais devidos ao uso de álcool — síndrome de dependência"]], cls: ["vitam_alc", "abst", "alc_manut", "antiem"], lab: [GLI, NA, K, MG, TGO, TGP, GGT, HEMO, CREAT, UREIA, ALC], comp: [ECG, CONS], alerta: "Ambulatorial só se CIWA-Ar < 10, sem convulsão/delirium prévio, sem comorbidade grave e com acompanhante. Convulsão, alucinação, confusão, febre ou CIWA ≥ 10 = internar. Tiamina antes de glicose. Diazepam exige Notificação B (azul)." }),
    P("paralisia-facial", "Paralisia facial periférica (Bell)", "Neurologia", { alias: "paralisia facial bell boca torta rosto torto paralisia periferica", cid: [["G51.0", "Paralisia de Bell"]], cls: ["cortic_bell", "antiv_bell", "olho_bell"], lab: [GLI, HIV, SIF], comp: [CONS], alerta: "Testa também paralisada = periférica. Poupa a testa, outros déficits, início súbito com fatores de risco = central (AVC): TC e regulação. Vesículas no ouvido = Ramsay Hunt (antiviral obrigatório). Encaminhar se sem melhora em 3 semanas." }),
    P("dor-toracica-baixo-risco", "Dor torácica de baixo risco (após ECG/troponina normais)", "Cardiovascular / Metabólico", { alias: "dor no peito dor toracica costocondrite tietze dor muscular no peito dor toracica atipica", cid: [["R07.4", "Dor torácica, não especificada"], ["R07.3", "Outra dor torácica"], ["M94.0", "Síndrome da junção condrocostal (Tietze)"]], cls: ["analg", "aine", "ibp", "antiacido"], lab: [TROP, CKMB, HEMO, GLI, CREAT, K].concat(LIP), comp: [ECG, ERGO, ECO, RXT, CONS], alerta: "Só liberar com ECG sem isquemia, troponina seriada negativa (0 e 3 h) e HEART ≤ 3. Dissecção, TEP, pneumotórax e pericardite precisam ser afastados clinicamente. Teste ergométrico ambulatorial em até 72 h se risco intermediário." }),
    P("ait", "AIT / AVC menor — prevenção secundária (após TC)", "Neurologia", { alias: "ait ataque isquemico transitorio avc menor derrame passageiro deficit transitorio", cid: [["G45.9", "Isquemia cerebral transitória não especificada"], ["I63.9", "Infarto cerebral não especificado"]], cls: ["antiagreg", "estatina", "anti_has"], lab: [HEMO, GLI, HBA1C, CREAT, NA, K, TSH].concat(LIP), comp: [TCC, DOPPLER, ECG, HOLTER, ECO, RMC, CONS], alerta: "TC de crânio OBRIGATÓRIA antes de antiagregar. Déficit com < 4,5 h = regulação imediata para trombólise (o HMC não tem). ABCD2 ≥ 4, déficit persistente, FA ou estenose carotídea = regular/internar. Dupla antiagregação só 21 dias." }),
    P("epilepsia", "Crise convulsiva em epiléptico conhecido (retorno ao basal)", "Neurologia", { alias: "convulsao epilepsia crise convulsiva ataque epileptico perda de remedio anticonvulsivante", cid: [["G40.9", "Epilepsia, não especificada"], ["R56.8", "Outras convulsões e as não especificadas"]], cls: ["anticonv", "conv_orient"], lab: [GLI, NA, K, CA, MG, CREAT, HEMO, NFNT, NCBZ, NVPA, ALC], comp: [EEG, TCC, CONS], alerta: "Primeira crise, crise prolongada/estado de mal, trauma, febre, déficit focal novo, gestação ou não retorno ao basal = não é este protocolo (TC, investigação/internação). Checar adesão e nível sérico. Não dirigir." }),
    P("ic-ajuste", "Insuficiência cardíaca — ajuste ambulatorial (estável após PS)", "Cardiovascular / Metabólico", { alias: "insuficiencia cardiaca ic edema falta de ar inchaco nas pernas icc", cid: [["I50.0", "Insuficiência cardíaca congestiva"], ["I50.9", "Insuficiência cardíaca não especificada"]], cls: ["ic_diur", "ic_base", "ic_orient"], lab: [BNP, CREAT, UREIA, NA, K, HEMO, TSH, GLI, TGO, TGP], comp: [ECG, ECO, RXT, CONS], alerta: "Hipoxemia, PA sistólica < 90, troponina elevada, K > 5,5, piora de função renal, arritmia ou dispneia em repouso = internar. Retorno em 7 dias com peso e creatinina/potássio." })
  ];
  novos.forEach(function (p) { p.cid = p.cid.map(function (x) { return [x[0].replace(".", ""), x[1]]; }); DB.protocols.push(p); });

  [TROP, CK, CKMB, BNP, CT, HDL, LDL, TG, AU, MICRO, TSH, T4L, B12, FOL, MG, CA, ALC, NFNT, NCBZ, NVPA, GGT, CETON].forEach(function (x) { if (DB.labPS.indexOf(x) < 0) DB.labPS.push(x); });
  [ECG, HOLTER, ERGO, ECO, DOPPLER, TCC, RMC, EEG, FUNDO, AUDIO, IMIT].forEach(function (x) { if (DB.compPS.indexOf(x) < 0) DB.compPS.push(x); });
  DB.etapa = 4;
})();
