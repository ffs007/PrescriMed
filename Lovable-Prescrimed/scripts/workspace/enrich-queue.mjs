#!/usr/bin/env node
/* Fila de aprofundamento (padrão WeMEDS) — lote 1 dos "matadores de plantão":
   sepse, choque séptico, dor torácica, TEP, AVC (complementos), crise convulsiva,
   crupe, bronquiolite, intoxicações. Idempotente: só adiciona o que falta. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COND = join(raiz, "content", "condicoes");
/* ler por ARQUIVO, gravar no MESMO ARQUIVO — nunca pelo id interno
   (sepse.json tem id leg_2001; gravar por id criava duplicata) */
let ARQ = null;
const ler = (id) => { ARQ = id + ".json"; return JSON.parse(readFileSync(join(COND, ARQ), "utf8")); };
const gravar = (j) => writeFileSync(join(COND, ARQ), JSON.stringify(j, null, 2) + "\n", "utf8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tem = (j, sec, re) => (j[sec]?.classes || []).some(c => re.test(c.nome));
const temNao = (j, frag) => (j.naoUsar || []).some(s => new RegExp(esc(frag), "i").test(s));
const temFlag = (j, frag) => (j.redFlags || []).some(s => new RegExp(esc(frag), "i").test(s));
function addNao(j, arr) { for (const s of arr) if (!temNao(j, s.slice(0, 24))) j.naoUsar = [...(j.naoUsar || []), s]; }
function addFlag(j, arr) { for (const s of arr) if (!temFlag(j, s.slice(0, 24))) j.redFlags = [...(j.redFlags || []), s]; }
function addClasse(j, sec, classe) {
  j[sec] = j[sec] || { classes: [] };
  if (!tem(j, sec, new RegExp(classe.nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 18), "i"))) {
    j[sec].classes.push(classe); return true;
  }
  return false;
}
const feito = [];

/* ============ SEPSE ============ */
{
  const j = ler("sepse");
  if (addClasse(j, "hospitalar", { nome: "Reanimação hemodinâmica (Surviving Sepsis 2021)", itens: [
    { linha: 1, novo: { id: "ringer_sepse", n: "Ringer lactato (cristaloide)", ap: "bolsa 500/1000 mL", via: "IV", pos: "30 mL/kg em bolus nas primeiras 3 h se hipoperfusão/lactato ≥ 2; reavaliar a cada bolus (congestão, estertores) — 1–2 L em adulto típico. Cristaloide balanceado preferível a SF 0,9%" } },
    { linha: 1, novo: { id: "noradrenalina_sepse", n: "Noradrenalina", ap: "ampola 4 mg/4 mL (2 mg/mL)", via: "IV", pos: "0,05–0,5 mcg/kg/min (titular até PAS ≥ 90/PAM ≥ 65). 1º vasopressor — iniciar precoce; diluir 4 mg em 250 mL SG 5% ou SF (16 mcg/mL). URGÊNCIA: pode iniciar em acesso periférico calibroso se central não disponível" } },
    { novo: { id: "vasopressina_sepse", n: "Vasopressina", ap: "ampola 20 UI/mL", via: "IV", pos: "0,03 UI/min fixa — 2º vasopressor quando noradrenalina ≥ 0,25–0,5 mcg/kg/min" } },
    { novo: { id: "dobutamina_sepse", n: "Dobutamina", ap: "ampola 250 mg/20 mL", via: "IV", pos: "2–20 mcg/kg/min — disfunção cardíaca (SE < 2,2) ou congestão persistente com noradrenalina" } },
  ] })) { addFlag(j, ["Lactato > 2 ou hipotensão persistente após cristaloide — choque séptico: noradrenalina AGORA, não esperar UTI", "PA após 30 mL/kg sem resposta — reavaliar foco (drenagem) e iniciar vasopressor"]); }
  j.alerta = (j.alerta || "") + (j.alerta || "").includes("Pacote da 1ª hora") ? j.alerta : (j.alerta || "") + " PACOTE DA 1ª HORA: lactato, culturas (sangue 2 + foco) ANTES do antibiótico sem atrasá-lo, antibiótico de amplo espectro em ≤ 60 min, cristaloide 30 mL/kg se hipoperfusão, noradrenalina se PA persiste, controle do foco (drenagem/desbridamento) precoce.";
  addNao(j, ["Coloide/gelatina para expansão — usar cristaloide", "Hidrocortisona sem dependência de vasopressor (200 mg/dia só se choque refratário)", "Noradrenalina adiada por falta de acesso central — iniciar em periférico calibroso"]);
  gravar(j); feito.push("sepse: reanimação (RL/noradrenalina/vasopressina/dobutamina) + pacote 1ª hora");
}

/* ============ CHOQUE SÉPTICO ============ */
{
  const j = ler("choque-septico");
  if (addClasse(j, "hospitalar", { nome: "Vasopressores e inotrópicos", itens: [
    { linha: 1, novo: { id: "noradrenalina_choque", n: "Noradrenalina", ap: "ampola 4 mg/4 mL (2 mg/mL)", via: "IV", pos: "0,05–0,5 mcg/kg/min, titular a cada 5 min (alvo PAM ≥ 65). Diluição: 4 mg em 250 mL = 16 mcg/mL. Se refratário: vasopressina 0,03 UI/min" } },
    { novo: { id: "vasopressina_choque", n: "Vasopressina", ap: "ampola 20 UI/mL", via: "IV", pos: "0,03 UI/min fixa, sem titulação — poupa noradrenalina quando dose ≥ 0,25–0,5 mcg/kg/min" } },
    { novo: { id: "dobutamina_choque", n: "Dobutamina", ap: "ampola 250 mg/20 mL", via: "IV", pos: "2–20 mcg/kg/min — débito baixo persistente (SE < 2,2) ou congestão apesar de noradrenalina + volume" } },
  ] })) { addFlag(j, ["Choque refratário a volume — noradrenalina PRECOCE (periférica calibrosa aceita), não esperar leito de UTI"]); }
  gravar(j); feito.push("choque-septico: vasopressores/inotrópicos");
}

/* ============ DOR TORÁCICA ============ */
{
  const j = ler("ws-car_01");
  if (addClasse(j, "hospitalar", { nome: "Antiagregante (após excluir dissecção)", itens: [
    { linha: 1, hosp: "aas_mast", motivo: "Se SCA é possibilidade: 160–325 mg mastigado — mas NÃO dar antes de excluir dissecção de aorta (piora o prognóstico cirúrgico)" },
  ] })) { addNao(j, ["AAS/antiagregante/anticoagulante antes de excluir dissecção de aorta (dor em rasgo, assimetria de pulsos, alargamento de mediastino)", "Anticoagulante se dor + tosse com sangue e fator de TEP sem TC — eco/TC primeiro", "AINE como conduta única em dor torácica não diagnosticada — pode mascarar pericardite em evolução e atrasar ACS real"]); }
  if (addClasse(j, "hospitalar", { nome: "Conforme etiologia (não rotular sem ECG/troponina/imagem)", itens: [
    { linha: 1, novo: { id: "esmolol_dissec", n: "Esmolol (dissecção de aorta)", ap: "ampola 100 mg/10 mL", via: "IV", pos: "Bolus 500 mcg/kg + 50–300 mcg/kg/min — controlar FC < 60 ANTES do vasodilatador; nunca antiagregante/anticoagulante na dissecção" } },
    { novo: { id: "colchicina_peric", n: "Colchicina (pericardite)", ap: "comprimido 0,5 mg", via: "VO", pos: "0,5 mg VO 12/12 h (3 dias, depois 1x/dia) + AINE (ibuprofeno 600 mg 8/8 h) — com gastrproteção" } },
  ] })) {}
  gravar(j); feito.push("dor torácica: antiagregante condicional + etiologia (dissecção/pericardite)");
}

/* ============ TEP ============ */
{
  const j = ler("tep");
  if (addClasse(j, "hospitalar", { nome: "Trombólise — TEP massiva (hipotensão/DVE)", itens: [
    { linha: 1, novo: { id: "alteplase_tep", n: "Alteplase (TEP massiva)", ap: "frasco 50 mg", via: "IV", pos: "100 mg EV em infusão contínua de 2 h (ou tenecteplase por peso). Hipotensão (PAS < 90 ou queda ≥ 40 mmHg) + DVE no eco. Após lise: continuar heparina sem bolus adicional" } },
  ] })) { addFlag(j, ["Hipotensão + dilatação de ventrículo direito no eco — TEP massiva: trombólise sistêmica, não apenas anticoagulante", "Suspeita de TEP instável — eco à beira-leito ANTES de levar à TC (paciente pode parar no tomógrafo)"]); }
  addNao(j, ["Trombólise em TEP de risco baixo/intermediário — anticoagulante basta", "Anticoagulação sem pesar sangramento maciço ativo, AVC < 3 meses ou plaquetas < 20.000"]);
  gravar(j); feito.push("tep: trombólise massiva + guardas");
}

/* ============ AVC SUSPEITO ============ */
{
  const j = ler("ws-neu_08");
  addNao(j, ["AAS/antiagregante/anticoagulante antes da TC excluir hemorragia", "Trombólise fora da janela de 4,5 h ou quando não se sabe a hora do início (última vez visto bem)", "Reduzir PA agressivamente no isquêmico sem trombólise — permitir até 220/120 (derrubar 15–25% apenas se trombólise: alvo < 185/110)", "O2 de rotina sem hipoxemia (SpO2 ≥ 94% não precisa)"]);
  gravar(j); feito.push("avc suspeito: guardas de janela/PA/antiagregação");
}

/* ============ CRISE CONVULSIVA ============ */
{
  const j = ler("crise-convulsiva");
  const seg = (j.hospitalar.classes || []).find(c => /2[ªa] linha/i.test(c.nome));
  if (seg && !seg.itens.some(i => (i.novo && /levetiracetam/i.test(i.novo.n)) || /levetiracetam/i.test(i.hosp || ""))) {
    seg.itens.push({ novo: { id: "levetiracetam_em", n: "Levetiracetam", ap: "solução injetável 500 mg/5 mL", via: "IV", pos: "60 mg/kg IV (máx 4.500 mg) em 15 min — alternativa à fenitoína, sem interações e sem risco arrítmico" }, motivo: "Alternativa à fenitoína" });
  }
  addNao(j, ["Flumazenil em convulsão por benzodiazepínico/benzo crônico — pode provocar convulsão refratária", "Fenitoína em bradicardia/BAV/instabilidade hemodinâmica — preferir levetiracetam", "Contenção física como tratamento da convulsão — tratar com droga"]);
  addFlag(j, ["Gestante > 20 semanas convulsiva — eclâmpsia: sulfato de magnésio 4–6 g IV (não é benzo primeiro)", "Convulsão que cede mas paciente não acorda (intervalo) — estado de mal não convulsivo: EEG"]);
  gravar(j); feito.push("convulsão: levetiracetam + flumazenil/eclâmpsia");
}

/* ============ CRUPE ============ */
{
  const j = ler("ws-ped_05");
  if (addClasse(j, "hospitalar", { nome: "Estridor em repouso — adrenalina nebulizada", itens: [
    { linha: 1, hosp: "adrenalina_neb", pos: "5 mL de adrenalina 1 mg/mL (1:1000) em nebulização (ou 0,5 mL/kg, máx 5 mL) — repetir 30–60 min se estridor voltar; observar ≥ 2–3 h após dose", motivo: "Estridor em repouso = crupe grave" },
    { linha: 1, hosp: "dexametasona_ev", pos: "0,6 mg/kg (máx 16 mg) dose única — EV ou VO (solução oral), mesmo efeito. CORTICOIDE É OBRIGATÓRIO EM TODO CRUPE QUE PRECISA DE ATENDIMENTO" },
  ] })) { addFlag(j, ["Estridor em repouso (não só ao chorar) — crupe grave: adrenalina nebulizada + corticoide", "Estridor que piora, salivação, posição tripé — epiglotite/obstrução: não estressar, via aérea preparada"]); }
  gravar(j); feito.push("crupe: adrenalina nebulizada + dexametasona 0,6 mg/kg");
}

/* ============ BRONQUIOLITE ============ */
{
  let j = null;
  try { j = ler("bronquiolite"); } catch (_) {}
  if (j) {
    addNao(j, ["Salbutamol/broncodilatador de rotina — não muda evolução da bronquiolite (só trial se história de sibilância prévia/atopia)", "Corticoide sistêmico de rotina", "Antibiótico de rotina — só se foco bacteriano evidente (otite, infiltrado com febre alta)", "Fisioterapia respiratória de rotina", "Suplemento de O2 sem hipoxemia (SpO2 ≥ 90–92% está ok)"]);
    addFlag(j, ["Idade < 2 meses com pausas de apneia — internar mesmo sem hipoxemia", "Recusa alimentar + tiragem/subcostal — sonda nasogástrica/internação", "SpO2 < 90% persistente ou desconforto crescente — alto fluxo (CANH) e UTI"]);
    gravar(j); feito.push("bronquiolite: o que NÃO funciona + critérios de internação");
  }
}

/* ============ INTOXICAÇÕES ============ */
{
  const j = ler("intoxicacoes");
  if (addClasse(j, "hospitalar", { nome: "Descontaminação — carvão ativado", itens: [
    { linha: 1, novo: { id: "carvao_ativado", n: "Carvão ativado", ap: "pó/frasco com 50 g", via: "VO/NG", pos: "1 g/kg (adulto 50–100 g) em 1 dose, idealmente ≤ 1–2 h da ingestão. NÃO DAR: corrosivos, hidrocarbonetos, álcoois, metais (ferro/lítio), íleo/obstrução, paciente sem proteção de via aérea" } },
  ] })) {}
  if (addClasse(j, "hospitalar", { nome: "Antídotos específicos", itens: [
    { linha: 1, novo: { id: "nac_intox", n: "N-acetilcisteína (paracetamol)", ap: "ampola 200 mg/mL", via: "IV", pos: "Protocolo de 21 ampolas (20 h): 150 mg/kg em 200 mL SG5%/SF em 1 h → 50 mg/kg em 4 h → 100 mg/kg em 16 h. Indicado se > 150 mg/kg ou > 7,5 g e 4 h depois do nível" } },
    { novo: { id: "fomepizol_intox", n: "Fomepizol (metanol/etilenoglicol)", ap: "frasco 1 g/mL", via: "IV", pos: "15 mg/kg dose inicial → 10 mg/kg 12/12 h (→ 15 mg/kg após 48 h se diluição) até nível < 20 mg/dL + hemodiálise se acidose/lesão de órgão" } },
    { novo: { id: "atropina_intox", n: "Atropina (colinérgico/organofosforado)", ap: "ampola 0,25 mg/mL ou 1 mg/mL", via: "IV", pos: "1–3 mg (0,02–0,05 mg/kg) EV, DUPLICAR a cada 5 min até atropinização (pulmão seco, FC > 80) → infusão 10–20% da dose total de resgate/h" } },
    { novo: { id: "flumazenil_intox", n: "Flumazenil (benzo — NÃO rotina)", ap: "ampola 0,1 mg/mL", via: "IV", pos: "0,2 mg EV, repetir 0,1 mg até máx 1 mg — SÓ em dependente único de benzo sem benzo crônico (risco de convulsão refratária)" } },
  ] })) {}
  addNao(j, ["Induzir vômito (ipecac) — abandonado", "Carvão ativado em corrosivos, hidrocarbonetos, álcoois ou metais", "Flumazenil de rotina em depressão de consciência de causa indeterminada"]);
  gravar(j); feito.push("intoxicações: carvão + NAC/fomepizol/atropina/flumazenil");
}

console.log(feito.join("\n"));
