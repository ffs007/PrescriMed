#!/usr/bin/env node
/* Restaura as classes hospitalares perdidas da SCA (Antiagregante, Estatina, IECA)
   e o 2º item do Nitrato — idempotente. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const f = resolve(raiz, "content/condicoes/ws-car_09.json");
const j = JSON.parse(readFileSync(f, "utf8"));
const hosp = j.hospitalar.classes;
const tem = (re) => hosp.some(c => re.test(c.nome));
const log = [];

if (!tem(/antiagregante/i)) {
  hosp.unshift({
    nome: "Antiagregante plaquetário",
    itens: [
      { linha: 1, hosp: "aas_mast", motivo: "Ataque 160–325 mg mastigado (BR: 300 mg) imediato, antes da troponina; manutenção 100 mg/dia" },
      { linha: 1, hosp: "clopidogrel_vo", pos: "< 75 anos: 300 mg VO de ataque (600 mg se ICP primária) + 75 mg/dia; ≥ 75 anos: apenas 75 mg/dia, sem ataque; com fibrinólise: ataque 300 mg", motivo: "Segundo antiagregante — preferencial na fibrinólise" },
      { linha: 1, novo: { id: "ticagrelor", n: "Ticagrelor", ap: "comprimido 90 mg", via: "VO", pos: "180 mg VO de ataque; 90 mg 12/12 h por 12 meses. Só em estratégia invasiva/ICP — nunca com fibrinólise" }, motivo: "Preferencial na ICP primária" },
      { novo: { id: "prasugrel", n: "Prasugrel", ap: "comprimido 10 mg", via: "VO", pos: "60 mg VO de ataque + 10 mg/dia. Contraindicado: AVC/AIT prévio. Evitar: ≥ 75 anos ou < 60 kg. Somente estratégia invasiva" } },
    ],
  });
  log.push("Antiagregante restaurado");
}
if (!tem(/estatina/i)) {
  const i = hosp.findIndex(c => /ieca/i.test(c.nome));
  const classe = { nome: "Estatina (alta potência)", itens: [
    { linha: 1, novo: { id: "atorvastatina_sca", n: "Atorvastatina", ap: "comprimido 10/20/40/80 mg", via: "VO", pos: "80 mg VO 1x/dia, iniciada nas primeiras 24–48 h. Meta LDL < 70 mg/dL" } },
  ] };
  hosp.splice(i < 0 ? hosp.length : i, 0, classe);
  log.push("Estatina restaurada");
}
if (!tem(/ieca/i)) {
  hosp.push({ nome: "IECA", itens: [
    { linha: 1, novo: { id: "enalapril_sca", n: "Enalapril", ap: "comprimido 5/10/20 mg", via: "VO", pos: "10 mg VO 12/12 h (iniciar 2,5–5 mg se instável; titular). CONTRAINDICADO: PAS < 80, Cr ≥ 3, K ≥ 5,5, estenose renal bilateral, angioedema prévio" } },
    { hosp: "captopril_vo", pos: "6,25–25 mg VO 8/8 h (alternativa; testar tolerância oral)", motivo: "Alternativa VO" },
  ] });
  log.push("IECA restaurado");
}
const nitr = hosp.find(c => /^Nitrato/i.test(c.nome));
if (nitr && nitr.itens.length < 2 && !nitr.itens.some(i => (i.novo && /nitroglicerina/i.test(i.novo.n)) || /nitroglicerina_ev/i.test(i.hosp || ""))) {
  nitr.itens.push({ novo: { id: "nitroglicerina_ev", n: "Nitroglicerina EV", ap: "ampola 25 mg/5 mL", via: "IV", pos: "5–10 mcg/min em bomba; +10 mcg/min a cada 3–5 min conforme PA (sem PAS < 90). Diluição: 1 ampola (25 mg) em 250 mL SG 5% = 100 mcg/mL" }, motivo: "Dor persistente, HTA ou congestão pulmonar" });
  log.push("Nitroglicerina EV garantida no Nitrato");
}

writeFileSync(f, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log("restaurações:", log.length ? log.join(" · ") : "nada a fazer (arquivo íntegro)");
console.log("classes hospitalares:", hosp.map(c => c.nome).join(" | "));
