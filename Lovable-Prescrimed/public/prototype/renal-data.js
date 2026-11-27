/* Ajuste renal por medicamento (origem expansao_ia — confira a dose antes de emitir).
   Faixas: l = leve (60–89), m = moderada (30–59), g = grave (15–29), d = <15 ou diálise.
   Cada faixa: ["a", texto] = ajuste sugerido (não bloqueia) | ["b", texto] = incompatível (bloqueia; exige justificativa).
   nefro = potencialmente nefrotóxico; lim = dose limítrofe. Fontes: bulas ANVISA, KDIGO, Sanford, UpToDate/Lexicomp (referência). */
(function () {
  "use strict";
  var F = "Bula ANVISA / Lexicomp — ajuste renal";
  window.PSX_RENAL = [
    { k: ["metformina"], fonte: "Bula ANVISA; FDA 2016 (eGFR)", r: { m: ["a", "ClCr 30–45: máx. 1 g/dia; não iniciar abaixo de 45."], g: ["b", "Contraindicada (risco de acidose lática)."], d: ["b", "Contraindicada."] } },
    { k: ["aine", "ibuprofeno", "diclofenaco", "cetoprofeno", "naproxeno", "nimesulida", "cetorolaco", "piroxicam", "meloxicam", "tenoxicam", "celecoxibe"], nefro: true, fonte: "KDIGO 2024 — evitar AINE na DRC", r: { m: ["a", "Evitar; se indispensável, menor dose e por ≤ 3 dias, com hidratação."], g: ["b", "Evitar (nefrotóxico; risco de lesão renal aguda)."], d: ["b", "Evitar (exceto anúrico em diálise, a critério)."] } },
    { k: ["gentamicina", "amicacina", "tobramicina"], nefro: true, lim: true, fonte: "Sanford — aminoglicosídeos", r: { l: ["a", "Dose única diária com nível sérico."], m: ["a", "Ampliar intervalo (36 h) e monitorar nível/creatinina."], g: ["a", "Intervalo 48 h; preferir alternativa."], d: ["b", "Evitar; se indispensável, dose pós-diálise guiada por nível."] } },
    { k: ["vancomicina"], nefro: true, lim: true, fonte: "ASHP/IDSA 2020 — AUC", r: { m: ["a", "Dose de ataque 20–25 mg/kg; manutenção guiada por nível/AUC."], g: ["a", "Intervalo 24–48 h guiado por nível."], d: ["a", "Dose pós-diálise guiada por nível."] } },
    { k: ["aciclovir"], nefro: true, fonte: F, r: { m: ["a", "ClCr 25–50: mesma dose a cada 12 h (EV)."], g: ["a", "ClCr 10–25: a cada 24 h."], d: ["a", "50% da dose a cada 24 h, após diálise."] } },
    { k: ["valaciclovir"], fonte: F, r: { m: ["a", "Herpes-zóster: 1 g 12/12 h (ClCr 30–49)."], g: ["a", "1 g 24/24 h (ClCr 10–29)."], d: ["a", "500 mg 24/24 h."] } },
    { k: ["amoxicilina"], fonte: F, r: { g: ["a", "ClCr 10–30: 250–500 mg 12/12 h; evitar 875 mg."], d: ["a", "250–500 mg 24/24 h, dose extra após diálise."] } },
    { k: ["clavulanato"], fonte: F, r: { g: ["a", "Não usar 875/125 mg; 500/125 mg 12/12 h."], d: ["a", "500/125 mg 24/24 h."] } },
    { k: ["cefalexina"], fonte: F, r: { g: ["a", "ClCr 15–29: 250 mg 8/8–12/12 h."], d: ["a", "250 mg 24/24 h."] } },
    { k: ["ciprofloxacino"], fonte: F, r: { m: ["a", "ClCr 30–50: 250–500 mg 12/12 h."], g: ["a", "250–500 mg 18/18–24/24 h."], d: ["a", "250–500 mg 24/24 h após diálise."] } },
    { k: ["levofloxacino"], fonte: F, r: { m: ["a", "750 mg 48/48 h (ClCr 20–49)."], g: ["a", "750 mg ataque, depois 500 mg 48/48 h."], d: ["a", "750 mg ataque, depois 500 mg 48/48 h."] } },
    { k: ["sulfametoxazol", "bactrim", "trimetoprima"], fonte: F, r: { g: ["a", "ClCr 15–30: 50% da dose."], d: ["b", "Evitar (< 15 mL/min)."] } },
    { k: ["nitrofurantoina"], fonte: "Critérios de Beers 2023", r: { g: ["b", "Evitar se ClCr < 30 (ineficaz e tóxica)."], d: ["b", "Contraindicada."] } },
    { k: ["fosfomicina"], fonte: F, r: { d: ["a", "Evitar se ClCr < 10."] } },
    { k: ["claritromicina"], fonte: F, r: { g: ["a", "ClCr < 30: 50% da dose."], d: ["a", "50% da dose."] } },
    { k: ["oseltamivir"], fonte: "CDC — oseltamivir renal", r: { m: ["a", "ClCr 30–60: 30 mg 12/12 h."], g: ["a", "ClCr 10–30: 30 mg 24/24 h."], d: ["a", "Hemodiálise: 30 mg após cada sessão."] } },
    { k: ["fluconazol"], fonte: F, r: { m: ["a", "ClCr ≤ 50: 50% da dose após ataque."], g: ["a", "50% da dose."], d: ["a", "Dose cheia após cada diálise."] } },
    { k: ["enoxaparina"], lim: true, fonte: "Bula ANVISA — enoxaparina", r: { g: ["a", "ClCr < 30: 1 mg/kg 24/24 h (tratamento) ou 20 mg/dia (profilaxia)."], d: ["b", "Evitar; preferir heparina não fracionada."] } },
    { k: ["rivaroxabana"], lim: true, fonte: "Bula ANVISA", r: { m: ["a", "FA: 15 mg/dia se ClCr 15–49."], g: ["a", "15 mg/dia com cautela."], d: ["b", "Evitar (ClCr < 15)."] } },
    { k: ["apixabana"], fonte: "Bula ANVISA", r: { g: ["a", "ClCr 15–29: 2,5 mg 12/12 h."], d: ["b", "Evitar (dados limitados)."] } },
    { k: ["dabigatrana"], lim: true, fonte: "Bula ANVISA", r: { m: ["a", "ClCr 30–50: 110 mg 12/12 h se risco de sangramento."], g: ["b", "Contraindicada (ClCr < 30)."], d: ["b", "Contraindicada."] } },
    { k: ["tramadol"], fonte: F, r: { g: ["a", "ClCr < 30: intervalo 12/12 h, máx. 200 mg/dia; sem liberação prolongada."], d: ["a", "Máx. 200 mg/dia, 12/12 h."] } },
    { k: ["morfina"], lim: true, fonte: "Beers 2023 / Lexicomp", r: { m: ["a", "Reduzir 25% e ampliar intervalo (metabólito ativo)."], g: ["a", "Reduzir 50%; preferir fentanil."], d: ["b", "Evitar (acúmulo de M6G)."] } },
    { k: ["codeina"], fonte: F, r: { g: ["a", "Reduzir 50%."], d: ["b", "Evitar."] } },
    { k: ["gabapentina"], fonte: F, r: { m: ["a", "ClCr 30–59: 400–1.400 mg/dia em 2 doses."], g: ["a", "ClCr 15–29: 200–700 mg/dia."], d: ["a", "100–300 mg/dia; dose extra após diálise."] } },
    { k: ["pregabalina"], fonte: F, r: { m: ["a", "50% da dose."], g: ["a", "25% da dose."], d: ["a", "25–75 mg/dia."] } },
    { k: ["alopurinol"], fonte: "ACR 2020", r: { m: ["a", "Iniciar 50–100 mg/dia e titular."], g: ["a", "Iniciar 50 mg/dia."], d: ["a", "50 mg após diálise."] } },
    { k: ["colchicina"], lim: true, fonte: "ACR 2020", r: { g: ["a", "Crise: 0,6 mg dose única; não repetir em 14 dias."], d: ["b", "Evitar."] } },
    { k: ["espironolactona"], fonte: "KDIGO / Beers 2023", r: { m: ["a", "Monitorar potássio; máx. 25 mg/dia."], g: ["b", "Evitar (hipercalemia)."], d: ["b", "Evitar."] } },
    { k: ["losartana", "enalapril", "captopril", "ramipril", "lisinopril", "valsartana"], fonte: "KDIGO 2024", r: { g: ["a", "Iniciar dose baixa; potássio e creatinina em 1–2 semanas."], d: ["a", "Cautela (hipercalemia); individualizar."] } },
    { k: ["digoxina"], lim: true, fonte: F, r: { m: ["a", "0,125 mg/dia; nível sérico."], g: ["a", "0,0625–0,125 mg/dia ou em dias alternados."], d: ["a", "0,0625 mg em dias alternados; nível sérico."] } },
    { k: ["glibenclamida"], fonte: "SBD 2024", r: { m: ["b", "Evitar (hipoglicemia prolongada); preferir gliclazida."], g: ["b", "Contraindicada."], d: ["b", "Contraindicada."] } },
    { k: ["sitagliptina"], fonte: F, r: { m: ["a", "ClCr 30–45: 50 mg/dia."], g: ["a", "25 mg/dia."], d: ["a", "25 mg/dia."] } },
    { k: ["empagliflozina", "dapagliflozina"], fonte: "KDIGO 2024", r: { d: ["b", "Não iniciar em diálise."] } },
    { k: ["lítio", "litio", "carbonato de litio"], nefro: true, lim: true, fonte: F, r: { m: ["a", "Reduzir 25–50%; nível sérico."], g: ["b", "Evitar."], d: ["b", "Evitar."] } },
    { k: ["metoclopramida"], fonte: F, r: { g: ["a", "50% da dose."], d: ["a", "50% da dose."] } },
    { k: ["ranitidina", "famotidina"], fonte: F, r: { m: ["a", "50% da dose."], g: ["a", "50% da dose a cada 24 h."], d: ["a", "50% da dose."] } },
    { k: ["dipirona"], fonte: F, r: { g: ["a", "Evitar doses altas repetidas."], d: ["a", "Evitar doses altas repetidas."] } },
    { k: ["contraste iodado"], nefro: true, fonte: "ACR Manual on Contrast 2024", r: { g: ["a", "Hidratação e reavaliação de indicação (ClCr < 30)."], d: ["a", "Avaliar risco–benefício."] } },
    { k: ["anfotericina"], nefro: true, fonte: F, r: { m: ["a", "Preferir formulação lipossomal."], g: ["a", "Formulação lipossomal; monitorar creatinina."], d: ["a", "Formulação lipossomal."] } },
    { k: ["polimixina", "colistina"], nefro: true, lim: true, fonte: "Consenso internacional 2019", r: { m: ["a", "Colistina: ajustar; polimixina B sem ajuste, monitorar."], g: ["a", "Monitorar creatinina diariamente."], d: ["a", "Dose suplementar após diálise."] } },
    { k: ["piperacilina", "tazobactam"], fonte: F, r: { m: ["a", "ClCr 20–40: 3,375 g 6/6 h."], g: ["a", "ClCr < 20: 2,25 g 6/6 h."], d: ["a", "2,25 g 8/8 h + dose após diálise."] } },
    { k: ["meropenem"], fonte: F, r: { m: ["a", "ClCr 26–50: 1 g 12/12 h."], g: ["a", "ClCr 10–25: 500 mg 12/12 h."], d: ["a", "500 mg 24/24 h."] } },
    { k: ["cefepima"], fonte: F, r: { m: ["a", "ClCr 30–60: 2 g 12/12 h."], g: ["a", "2 g 24/24 h (risco de neurotoxicidade)."], d: ["a", "1 g 24/24 h."] } }
  ];
})();
