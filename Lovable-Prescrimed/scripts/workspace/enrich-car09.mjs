#!/usr/bin/env node
/* Enriquecimento da SCA-âncora (ws-car_09) ao nível WeMEDS:
   mantém a estrutura da importação e adiciona as lacunas clínicas. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const f = resolve(raiz, "content/condicoes/ws-car_09.json");
const j = JSON.parse(readFileSync(f, "utf8"));

/* ---------- assinatura com CRM ---------- */
j.meta.assinatura = { nome: "Dr. Felipe", crm: "CRM-DF 34266 · CRM-GO 28469", data: "2026-11-06", escopo: "aprovação com CRM registrada em chat" };
j.meta.fontes = [...new Set([...(j.meta.fontes || []).map(s => s.replace(/^\[verificar\] /, "")), "WeMEDS — SCA com supra (web.wemeds.app/disease/394)", "Diretriz SBC de SCA"])];
j.cat = "Cardiovascular";

/* ---------- red flag: infarto de VD ---------- */
const temVD = (j.redFlags || []).some(s => /ventr[íi]culo direito|V3R/i.test(s));
if (!temVD) j.redFlags.push("Supra em V3R–V4R com hipotensão — infarto de ventrículo direito: NÃO dar nitrato/morfina/diurético/betabloqueador; repor volume com SF 0,9% (1–2 L) e dobutamina se refratário");

/* ---------- não usar: completeness ---------- */
const addNao = [
  "Morfina como rotina — apenas dor refratária (piora prognóstico; evitar no infarto de VD)",
  "Ticagrelor ou prasugrel associados à fibrinólise — nessa estratégia usar AAS + clopidogrel",
  "Prasugrel se AVC/AIT prévio; evitar se ≥ 75 anos ou peso < 60 kg",
  "Trombólise com contraindicação absoluta: AVC isquêmico < 3 meses, sangramento intracraniano prévio, trauma craniano < 3 meses, sangramento ativo, dissecção de aorta, malformação vascular intracraniana",
  "Betabloqueador na fase aguda se FC < 60, PAS < 100, choque cardiogênico, BAV avançado ou asma grave",
  "Espironolactona se K ≥ 5 mEq/L ou Cr ≥ 2–2,5 mg/dL",
];
j.naoUsar = [...new Set([...(j.naoUsar || []), ...addNao])].slice(0, 14);

/* ---------- ambulatorial: beta na alta + enalapril ---------- */
const ambClasses = j.ambulatorial.classes;
if (!ambClasses.some(c => /betabloqueador/i.test(c.nome))) {
  ambClasses.push({
    nome: "Betabloqueador (alta — manter indefinidamente)",
    itens: [
      { linha: 1, novo: { id: "metoprolol_succ_alta", n: "Succinato de metoprolol", ap: "comprimido 25/50/100 mg", q: "", pos: "50 mg VO 1x/dia, titular conforme FC/PA. Evitar pindolol (simpaticomimético). Não iniciar na fase aguda se risco de choque (FC > 110, idade > 70, PAS < 120)" }, motivo: "Reduz reinfarto e mortalidade" },
    ],
  });
}
const ieca = ambClasses.find(c => /ieca/i.test(c.nome));
if (ieca && !ieca.itens.some(i => i.base === "enalapril" || (i.novo && /enalapril/i.test(i.novo.n)))) {
  ieca.itens.push({ novo: { id: "enalapril_alta", n: "Enalapril", ap: "comprimido 5/10/20 mg", q: "", pos: "5–10 mg VO 12/12 h (titular até 40 mg/dia). Não se PAS < 80, Cr ≥ 3, K ≥ 5,5, estenose renal bilateral, angioedema prévio" }, motivo: "Alternativa IECA" });
}

/* ---------- hospitalar: classes que faltam ---------- */
const hosp = j.hospitalar.classes;
const tem = (re) => hosp.some(c => re.test(c.nome));

/* betabloqueador hospitalar com contraindicações e via EV */
if (!tem(/betabloqueador/i)) {
  hosp.push({
    nome: "Betabloqueador",
    itens: [
      { linha: 1, novo: { id: "metoprolol_sca", n: "Metoprolol", ap: "succinato 25/50/100 mg cp · tartrato 5 mg/mL amp", via: "VO", pos: "Succinato 50 mg VO 6/6 h no 1º dia, depois 12/12 h. Refratário/taquiarritmia: tartrato 5 mg EV lento 5/5 min, máx 3 doses. CONTRAINDICADO na fase aguda: FC < 60, PAS < 100, choque, BAV avançado, asma grave, infarto de VD" }, motivo: "Reduz demanda miocárdica — dose ao chegar, exceto risco de choque" },
    ],
  });
}

/* proteção gástrica + glicemia (prescrição hospitalar WeMEDS itens 10–11) */
if (!tem(/g[áa]strica/i)) {
  hosp.push({
    nome: "Proteção gástrica e glicemia",
    itens: [
      { linha: 1, hosp: "omeprazol_ev", pos: "40 mg EV 1x/dia — profilaxia de úlcera de estresse sob dupla antiagregação", motivo: "Proteção gástrica" },
      { linha: 1, hosp: "insulina_reg_sc", pos: "Esquema de correção 4–6/6 h (alvo 140–180 mg/dL): 151–200 = 2 U; 201–250 = 4 U; 251–300 = 6 U; 301–350 = 8 U; 351–400 = 10 U SC", motivo: "Controle glicêmico apertado" },
      { hosp: "glicose50", pos: "40 mL EV se glicemia < 70 mg/dL", motivo: "Reversão de hipoglicemia do esquema" },
    ],
  });
}

/* antialdosterônico */
if (!tem(/aldoster/i)) {
  hosp.push({
    nome: "Antialdosterônico (FE ≤ 40% ou DM)",
    itens: [
      { linha: 1, novo: { id: "espironolactona_sca", n: "Espironolactona", ap: "comprimido 25/50 mg", via: "VO", pos: "25 mg VO 1x/dia (até 50 mg). CONTRAINDICADO: K ≥ 5, Cr ≥ 2–2,5, ClCr < 30" }, motivo: "Reduz remodelamento com o IECA" },
    ],
  });
}

/* GpIIb/IIIa */
if (!tem(/GpIIb|glicoprote/i)) {
  hosp.push({
    nome: "GpIIb/IIIa — centro de hemodinâmica",
    itens: [
      { linha: 1, novo: { id: "tirofiban", n: "Tirofiban", ap: "solução injetável 0,25 mg/mL", via: "IV", pos: "0,4 mcg/kg/min por 30 min → 0,1 mcg/kg/min por 12 h (contexto de angioplastia)" }, motivo: "Alto risco submetido à ICP" },
      { novo: { id: "eptifibatide", n: "Eptifibatide", ap: "solução injetável 0,75 mg/mL", via: "IV", pos: "180 mcg/kg EV bolus → 2 mcg/kg/min por 18–24 h (contexto de angioplastia)" } },
    ],
  });
}

/* fibrinolítico: garantir alteplase + estreptoquinase além da tenecteplase */
const fib = hosp.find(c => /fibrinol/i.test(c.nome));
if (fib) {
  const nomes = fib.itens.map(i => (i.novo && i.novo.n) || i.hosp || "");
  if (!nomes.some(n => /alteplase|tPA/i.test(n))) {
    fib.itens.push({ novo: { id: "alteplase_sca", n: "Alteplase (tPA)", ap: "frasco 50 mg", via: "IV", pos: "15 mg EV bolus → 0,75 mg/kg (máx 50 mg) em 30 min → 0,5 mg/kg (máx 35 mg) em 60 min" }, motivo: "Alternativa de fibrinólise" });
  }
  if (!nomes.some(n => /estrepto/i.test(n))) {
    fib.itens.push({ novo: { id: "estreptoquinase", n: "Estreptoquinase (SK)", ap: "frasco 1.500.000 UI", via: "IV", pos: "1.500.000 UI em 100 mL SG 5% ou SF 0,9%, EV lenta em 30–60 min. Evitar reexposição (anafilaxia)" }, motivo: "Alternativa de fibrinólise" });
  }
}

/* nitrato IV (diluição WeMEDS) */
const nitr = hosp.find(c => /^Nitrato/i.test(c.nome));
if (nitr && !nitr.itens.some(i => (i.novo && /nitroglicerina/i.test(i.novo.n)) || /nitroglicerina_ev/i.test(i.hosp || ""))) {
  nitr.itens.push({ novo: { id: "nitroglicerina_ev", n: "Nitroglicerina EV", ap: "ampola 25 mg/5 mL", via: "IV", pos: "5–10 mcg/min em bomba; +10 mcg/min a cada 3–5 min conforme PA (sem PAS < 90). Diluição: 1 ampola (25 mg) em 250 mL SG 5% = 100 mcg/mL. Dor persistente, HTA ou congestão" }, motivo: "Via EV para dor refratária/HTA/congestão" });
}

writeFileSync(f, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log("SCA enriquecida:", { hosp: hosp.length, amb: ambClasses.length, naoUsar: j.naoUsar.length, redFlags: j.redFlags.length });
