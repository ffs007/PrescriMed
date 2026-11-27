/**
 * Cálculo de dose pediátrica por peso e montagem da linha da receita (PDF).
 * Linha 1: "Nome — Apresentação". Linha 2: instrução ao paciente.
 * Faixas de referência (máx. g/dia etc.) nunca entram no texto do PDF.
 */
import type { Medication } from "../types/prescription";

export interface WeightDoseRule {
  mgkg: number;
  per: "dose" | "dia";
  div: number;
  max?: number;
  min?: number;
  /** Unidade de administração: gota, mL, jato, mg, UI, comprimido. */
  unit: string;
  /** Quantidade de fármaco (mg/UI) em 1 unidade. */
  mgpu: number;
  /** Passo de arredondamento clinicamente utilizável. */
  step: number;
  regra: string;
}

export interface StructuredPrescription {
  presentation: string | null;
  adultInstruction: string | null;
  pediatricInstruction: string | null;
  rule: WeightDoseRule | null;
  nonPharmacological: boolean;
}

export const DOSE_NOT_CALCULATED = "DOSE NÃO CALCULADA — informe o peso do paciente";
export const NOT_FOR_AGE = "OPÇÃO NÃO INDICADA PARA ESTA FAIXA ETÁRIA";

const fmt = (n: number) =>
  (Math.round(n * 100) / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const UNIT_LABEL: Record<string, [string, string]> = {
  gota: ["gota", "gotas"],
  jato: ["jato", "jatos"],
  comprimido: ["comprimido", "comprimidos"],
};

export function parseWeight(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) && n > 0 && n < 300 ? n : null;
}

/** Retorna a dose por administração já arredondada, ou null se não calculável. */
export function calculateWeightDose(rule: WeightDoseRule, weightKg: number) {
  if (!(rule.mgkg > 0) || !(rule.mgpu > 0) || !(weightKg > 0)) return null;
  let dose = rule.mgkg * weightKg;
  if (rule.per === "dia") dose = dose / Math.max(1, rule.div || 1);
  if (rule.min && dose < rule.min) dose = rule.min;
  if (rule.max && dose > rule.max) dose = rule.max;
  const step = rule.step > 0 ? rule.step : 1;
  let units = Math.round(dose / rule.mgpu / step) * step;
  if (units <= 0) units = step;
  // Nunca ultrapassa a dose máxima depois do arredondamento.
  if (rule.max) {
    while (units * rule.mgpu > rule.max + 1e-9 && units - step > 0) units -= step;
  }
  const [sing, plur] = UNIT_LABEL[rule.unit] ?? [rule.unit, rule.unit];
  const amountText = `${fmt(units)} ${units === 1 ? sing : plur}`;
  const drug = units * rule.mgpu;
  const drugText = rule.unit === "mg" || rule.unit === "UI" || rule.unit === "jato" ? null
    : `${fmt(drug)} mg`;
  return { units, amountText, drugText };
}

/** Instrução final ao paciente para a faixa etária/peso atual. */
export function buildPatientInstruction(
  s: StructuredPrescription,
  ctx: { isPediatric: boolean; weight: string | number | null | undefined },
): string {
  if (!ctx.isPediatric) return s.adultInstruction?.trim() || NOT_FOR_AGE;
  const tmpl = s.pediatricInstruction?.trim();
  if (!tmpl) return NOT_FOR_AGE;
  if (!tmpl.includes("{dose}")) return tmpl;
  const w = parseWeight(ctx.weight);
  if (!w || !s.rule) return DOSE_NOT_CALCULATED;
  const calc = calculateWeightDose(s.rule, w);
  if (!calc) return DOSE_NOT_CALCULATED;
  const detail = [calc.drugText, `${s.rule.regra} · ${fmt(w)} kg`].filter(Boolean).join(" — ");
  return tmpl.replace("{dose}", `**${calc.amountText}** (${detail})`);
}

/** Registro das opções estruturadas escolhidas, para recalcular quando o peso muda. */
const registry = new Map<number, { med: Medication; s: StructuredPrescription }>();
export const registerStructured = (med: Medication, s: StructuredPrescription) => registry.set(med.id, { med, s });
export const getStructured = (id: number) => registry.get(id) ?? null;

export function structuredText(
  med: Medication,
  s: StructuredPrescription,
  ctx: { isPediatric: boolean; weight: string | number | null | undefined },
): string {
  const title = [med.name, s.nonPharmacological ? null : s.presentation].filter(Boolean).join(" — ");
  return `${title}\n${buildPatientInstruction(s, ctx)}`;
}
