/**
 * Registro em memória do detalhamento farmacológico (overlay v2).
 *
 * O conteúdo vem do banco (`catalogo_medicamentos_overlay`) e é registrado aqui
 * uma única vez por sessão, para que as funções puras do motor de regras
 * (`suggestionEngine`, `v2Rules`) continuem sincronizadas e testáveis.
 */
import type { MedicationV2 } from "../types/clinical";

let OVERLAY: Record<number, MedicationV2> = {};

/** Substitui o overlay carregado (chamado pelo hook que lê o banco). */
export const setMedicationOverlay = (items: MedicationV2[]) => {
  OVERLAY = Object.fromEntries(items.map((m) => [m.id, m]));
};

export const getMedicationV2 = (id: number): MedicationV2 | undefined => OVERLAY[id];

export const listV2Medications = (): MedicationV2[] => Object.values(OVERLAY);

export const hasStructuredPediatricDose = (id: number): boolean => {
  const m = OVERLAY[id];
  return !!(m?.pediatricDoseStructured?.mgPerKgPerDay || m?.pediatricDoseStructured?.mgPerKgPerDose);
};

export const v2CoverageByClass = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const m of Object.values(OVERLAY)) {
    const k = m.therapeuticClass ?? "outros";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
};
