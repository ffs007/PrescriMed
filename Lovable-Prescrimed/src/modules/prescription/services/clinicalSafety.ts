import type { Medication, SelectedMed } from "../types/prescription";
import type { DocumentAction } from "../components/ActionGrid";

/* ============================================================
 * Tipos do motor de segurança clínica
 * ============================================================ */

/**
 * Severidade de um alerta clínico — alinhada com a UX dos 4 estados
 * (OK / Informativo / Atenção / Crítico). "ok" não gera alert; é o
 * estado base usado apenas para o cálculo do status agregado.
 */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Eixo clínico que originou o alerta. Usado para agrupar e priorizar
 * a UX e para futura camada de auditoria/log.
 */
export type AlertCategory =
  | "missing-data"
  | "pediatric"
  | "pregnancy"
  | "allergy"
  | "renal"
  | "hepatic"
  | "duplicate"
  | "interaction"
  | "dose"
  | "consistency";

export interface ClinicalAlert {
  /** Identificador estável do alerta — usado como chave de override e log. */
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  /** Subcategoria opcional (ex.: geriatric, pregnancy-c, adjustment) */
  subcategory?: string;
  /** Título curto (≤ 6 palavras). */
  title: string;
  /** Motivo / impacto em 1 frase. */
  message: string;
  /** Ação esperada (verbo no imperativo). */
  action?: string;
  /** IDs de medicamentos envolvidos (quando aplicável). */
  medIds?: number[];
  /** Indica que este alerta admite override clínico (com justificativa para crítico). */
  overridable: boolean;
}

/** Status agregado do documento — dirige bloqueio/confirmação na emissão. */
export type SafetyStatus =
  | "ok"
  | "info"
  | "review-required"
  | "blocked";

export interface SafetyAssessment {
  status: SafetyStatus;
  alerts: ClinicalAlert[];
  /** True quando há ao menos um alerta crítico não-overridable. */
  hardBlocked: boolean;
  /** Alertas críticos pendentes de override. */
  pendingCritical: ClinicalAlert[];
}

/* ============================================================
 * Contexto de avaliação
 * ============================================================ */

export interface SafetyPatientContext {
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  weightKg: number | null;
  ageInYears: number | null;
  allergiesText: string;
  hasAllergies: boolean;
  renalFunction: "" | "normal" | "leve" | "moderada" | "grave";
  hasRenalImpairment: boolean;
  /** Lista de comorbidades normalizadas (texto livre — o motor faz match regex). Opcional. */
  comorbiditiesText?: string;
}

export interface SafetyContext {
  action: DocumentAction;
  patient: SafetyPatientContext;
  selected: SelectedMed[];
  allMedications: Medication[];
}

/* ============================================================
 * Helpers internos
 * ============================================================ */

const findMed = (id: number, all: Medication[]) => all.find((m) => m.id === id);

/** Tokeniza o texto de alergias do médico em termos comparáveis. */
const parseAllergyTerms = (raw: string): string[] => {
  return raw
    .toLowerCase()
    .split(/[,;/]|\bou\b|\be\b/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !["nega", "nenhuma", "nao", "não"].includes(t));
};

/**
 * Match textual conservador: o termo da alergia precisa aparecer como
 * substring no NOME do medicamento (sem normalizar princípio ativo).
 * Conservador de propósito — preferimos perder match a inventar conflito.
 */
const allergyMatches = (medName: string, terms: string[]): string | null => {
  const lower = medName.toLowerCase();
  for (const t of terms) {
    if (lower.includes(t)) return t;
  }
  return null;
};

/* ============================================================
 * Regras individuais (puras, testáveis)
 * ============================================================ */

/** R1 — Pediátrico sem peso, com prescrição em curso. */
const rulePediatricMissingWeight = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.isPediatric) return null;
  if (ctx.patient.weightKg !== null) return null;
  if (ctx.selected.length === 0) return null;
  return {
    id: "ped-missing-weight",
    severity: "critical",
    category: "missing-data",
    title: "Peso ausente em paciente pediátrico",
    message:
      "Não é possível conferir doses por kg sem o peso. Em pediatria isso é um risco frequente de erro de dose.",
    action: "Preencha o peso no Bloco A antes de emitir.",
    overridable: false,
  };
};

/** R2 — Gestante com medicamentos selecionados → 1 alerta POR MED individual severidades A/B/C/D/X.
 * C = warning / D,X = critical / A,B = sem alerta (permitido). */
const rulePregnancyAwareness = (ctx: SafetyContext): ClinicalAlert[] => {
  if (ctx.action !== "receita") return [];
  if (!ctx.patient.isPregnant) return [];
  if (ctx.selected.length === 0) return [];
  const out: ClinicalAlert[] = [];
  for (const sel of ctx.selected) {
    const med = findMed(sel.id, ctx.allMedications);
    if (!med) continue;
    const cat = (med.pregnancyRisk || "").toUpperCase();
    if (cat === "C") {
      out.push({
        id: `preg-C-${med.id}`,
        severity: "warning",
        category: "pregnancy",
        subcategory: "C",
        title: `Risco C em gestação: ${med.name}`,
        message: `Medicamento "${med.name}" é risco C na gestação. Avaliar relação risco-benefício e justificar se necessário.`,
        action: "Revisar indicação ou justificar se mantido.",
        medIds: [med.id],
        overridable: true,
      });
    } else if (cat === "D" || cat === "X") {
      out.push({
        id: `preg-DX-${med.id}`,
        severity: "critical",
        category: "pregnancy",
        subcategory: cat,
        title: `Risco ${cat} em gestação: ${med.name}`,
        message: `Medicamento "${med.name}" é risco ${cat} (contraindicado/evitar) na gestação. Substituir alternativa ou justificar clinicamente.`,
        action: "Considerar alternativa segura; se mantido → justificar obrigatoriamente.",
        medIds: [med.id],
        overridable: true,
      });
    }
  }
  return out;
};

/** R3 — Alergia declarada × medicamentos selecionados (match textual conservador). */
const ruleAllergyConflict = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.hasAllergies) return null;
  const terms = parseAllergyTerms(ctx.patient.allergiesText);
  if (terms.length === 0) return null;

  const conflicts: { med: SelectedMed; term: string }[] = [];
  for (const sel of ctx.selected) {
    const term = allergyMatches(sel.name, terms);
    if (term) conflicts.push({ med: sel, term });
  }
  if (conflicts.length === 0) return null;

  return {
    id: `allergy-${conflicts.map((c) => c.med.id).join("-")}`,
    severity: "critical",
    category: "allergy",
    title: "Alergia potencialmente incompatível",
    message: `O medicamento ${conflicts
      .map((c) => `"${c.med.name}"`)
      .join(", ")} bate com alergia informada (${conflicts
      .map((c) => c.term)
      .join(", ")}).`,
    action: "Confirme o medicamento OU remova-o da prescrição.",
    medIds: conflicts.map((c) => c.med.id),
    overridable: true,
  };
};

/** R4 — Medicamento duplicado na mesma receita. */
const ruleDuplicateMedication = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  const seen = new Set<number>();
  const dups: SelectedMed[] = [];
  for (const sel of ctx.selected) {
    if (seen.has(sel.id)) dups.push(sel);
    seen.add(sel.id);
  }
  if (dups.length === 0) return null;
  return {
    id: `dup-${dups.map((d) => d.id).join("-")}`,
    severity: "warning",
    category: "duplicate",
    title: "Medicamento duplicado",
    message: `${dups.map((d) => d.name).join(", ")} aparece mais de uma vez na receita.`,
    action: "Remova a duplicação ou confirme a intenção.",
    medIds: dups.map((d) => d.id),
    overridable: true,
  };
};

/** R5 — Função renal comprometida + qualquer prescrição → flag de revisão. */
const ruleRenalAwareness = (ctx: SafetyContext): ClinicalAlert | null => {
  if (ctx.action !== "receita") return null;
  if (!ctx.patient.hasRenalImpairment) return null;
  if (ctx.selected.length === 0) return null;
  return {
    id: "renal-review",
    severity: "warning",
    category: "renal",
    title: "Função renal comprometida",
    message: `Paciente com função renal ${ctx.patient.renalFunction}. Várias drogas exigem ajuste de dose.`,
    action: "Revise dose de cada medicamento conforme clearance.",
    overridable: true,
  };
};

/** R6 — Geriátrico ≥60: anticolinérgicos, sedativos parenterais e ajuste renal. */
const ruleGeriatricAwareness = (ctx: SafetyContext): ClinicalAlert[] => {
  if (ctx.action !== "receita") return [];
  const anos = ctx.patient.ageInYears ?? 0;
  if (anos < 60) return [];
  const out: ClinicalAlert[] = [];
  const RX_ANTI = /(biperideno?|procyclidina|amitriptilina|clorfeniramina|difenidramina|hioscina|escopolamina|oxibutinina|tolterodina|propantelina)/i;
  const RX_SED = /(midazolam?|diazepam?|lorazepam|alprazolam?|fentanil|tramadol|morfina|codeina|prometazina)/i;
  for (const sel of ctx.selected) {
    const med = findMed(sel.id, ctx.allMedications);
    const corpus = med ? `${med.name} ${med.subCategory || ""}` : sel.name;
    const via = (med?.dosage || sel.text || "").toUpperCase();
    const isParenteral = /(^|\s)(IV|EV|IM|SC)(\s|$)/.test(via) || /(^|\s)intravenos|intramuscular|subcut[aâ]neo/.test(via);
    if (RX_ANTI.test(corpus)) {
      out.push({
        id: `ger-anticolin-${med?.id ?? sel.id}`,
        severity: "warning", category: "missing-data", subcategory: "geriatric",
        title: `Anticolinérgico em geriátrico: ${med?.name ?? sel.name}`,
        message: `Risco confusão, retenção urinária e queda em geriátrico (${anos} anos). Avaliar alternativa menos anticolinérgica.`,
        action: "Considerar alternativa ou justificar uso.",
        medIds: med ? [med.id] : undefined, overridable: true,
      });
    }
    if (isParenteral && RX_SED.test(corpus)) {
      out.push({
        id: `ger-sed-${med?.id ?? sel.id}`,
        severity: "warning", category: "missing-data", subcategory: "geriatric",
        title: `Sedativo/opioide parenteral em geriátrico: ${med?.name ?? sel.name}`,
        message: `Risco hipotensão ortostática / queda / sedação excessiva em ${anos} anos. Monitorar.`,
        action: "Ajustar dose; medidas contra queda.",
        medIds: med ? [med.id] : undefined, overridable: true,
      });
    }
    if (ctx.patient.hasRenalImpairment) {
      out.push({
        id: `ger-renal-${med?.id ?? sel.id}`,
        severity: "warning", category: "missing-data", subcategory: "geriatric",
        title: `Ajuste renal obrigatório (geriátrico+renal)`,
        message: `Validar dose/frequência de ${med?.name ?? sel.name} por clearance estimado.`,
        action: "Calcular Cockcroft-Gault e calibrar.",
        medIds: med ? [med.id] : undefined, overridable: true,
      });
    }
  }
  return out;
};

/** R7 — Hepatopatia: aviso de metabolização/compromisso hepático quando comorbidades mencionam hepatopatia. */
const ruleHepaticAwareness = (ctx: SafetyContext): ClinicalAlert[] => {
  if (ctx.action !== "receita") return [];
  const cob = (ctx.patient.comorbiditiesText || (ctx.patient as any).comorbiditiesText || "")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const RX_HEP = /(hepatopatia|cirrose|child[- ]?pugh|insuficiencias? hepaticas?|hepatica cronica|esteatose|fibrose hepatica)/;
  if (!RX_HEP.test(cob)) return [];
  return ctx.selected.map((sel) => {
    const med = findMed(sel.id, ctx.allMedications);
    return {
      id: `hep-${med?.id ?? sel.id}`, severity: "warning", category: "hepatic", subcategory: "adjustment",
      title: `Hepatopatia: reavaliar ${med?.name ?? sel.name}`,
      message: "Doença hepática detectada. Reavaliar metabolização e ajuste de dose se necessário.",
      action: "Validar Child-Pugh e ajustar dose/frequência.",
      medIds: med ? [med.id] : undefined, overridable: true,
    };
  });
};

/* ============================================================
 * Pipeline + agregador (via registry)
 * ============================================================ */

import { registerRule, evaluateAll } from "./ruleRegistry";

// Registra regras core no registry (idempotente).
registerRule({ id: "core-pediatric-missing-weight", category: "missing-data", description: "Pediátrico sem peso com prescrição em curso.", evaluate: rulePediatricMissingWeight });
registerRule({ id: "core-pregnancy-awareness", category: "pregnancy", description: "Gestante com risco C (warning) ou D/X (critical) — revisão/justificação individual por med.", evaluate: rulePregnancyAwareness });
registerRule({ id: "core-allergy-conflict", category: "allergy", description: "Match textual entre alergia declarada e nome do medicamento.", evaluate: ruleAllergyConflict });
registerRule({ id: "core-duplicate-medication", category: "duplicate", description: "Medicamento duplicado na mesma receita.", evaluate: ruleDuplicateMedication });
registerRule({ id: "core-renal-awareness", category: "renal", description: "Função renal comprometida + prescrição.", evaluate: ruleRenalAwareness });
registerRule({ id: "core-geriatric-awareness", category: "missing-data", description: "Geriátrico ≥60: anticolinérgicos, sedativos parenterais, ajuste renal.", evaluate: ruleGeriatricAwareness });
registerRule({ id: "core-hepatic-awareness", category: "hepatic", description: "Hepatopatia detectada por texto de comorbidades.", evaluate: ruleHepaticAwareness });

// Side-effect: registra também as regras estruturadas do banco v2.
import "./v2Rules";

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
};

/**
 * Avalia o documento ativo contra todas as regras seguras.
 * Puro: sem efeitos colaterais. UI decide o que fazer com o resultado.
 *
 * O `acknowledgedIds` permite "neutralizar" alertas overridable que o
 * médico já confirmou conscientemente (com ou sem justificativa).
 */
export const assessSafety = (
  ctx: SafetyContext,
  acknowledgedIds: Set<string> = new Set(),
): SafetyAssessment => {
  const raw = evaluateAll(ctx);

  // Ordena por severidade desc para UX
  raw.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const pendingCritical = raw.filter(
    (a) => a.severity === "critical" && !acknowledgedIds.has(a.id),
  );
  const hardBlocked = raw.some(
    (a) => a.severity === "critical" && !a.overridable,
  );

  let status: SafetyStatus = "ok";
  if (hardBlocked) status = "blocked";
  else if (pendingCritical.length > 0) status = "blocked";
  else if (raw.some((a) => a.severity === "warning")) status = "review-required";
  else if (raw.some((a) => a.severity === "info")) status = "info";

  return { status, alerts: raw, hardBlocked, pendingCritical };
};

/** Texto humano resumido do status (para badges). */
export const statusLabel = (s: SafetyStatus): string => {
  switch (s) {
    case "ok": return "Pronto para emitir";
    case "info": return "Pronto para emitir";
    case "review-required": return "Revisão recomendada";
    case "blocked": return "Emissão bloqueada";
  }
};
