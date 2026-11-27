/**
 * Tipos e rótulos das linhas terapêuticas.
 *
 * Só contrato e apresentação — o conteúdo clínico (quais medicamentos em cada
 * linha, por condição) vive no banco, em `catalogo_protocolos_legado`.
 */

export type SuggestionLine = "primeira" | "alternativa" | "sintomatico" | "suporte";

export interface SuggestionRecipe {
  medicationId: number;
  line: SuggestionLine;
  /** Destaque visual da conduta preferencial. */
  highlight?: boolean;
  /** Observação clínica curada. */
  note?: string;
  /** Duração curada para a condição, sobrepondo a dose padrão. */
  overrideDurationDays?: number;
  /** Tipo de receita curado para a condição. */
  overridePrescriptionType?: import("./prescription").PrescriptionType;
}

export const LINE_LABELS: Record<SuggestionLine, string> = {
  primeira: "1ª linha",
  alternativa: "Alternativa",
  sintomatico: "Sintomático",
  suporte: "Suporte",
};

export const LINE_TOKENS: Record<SuggestionLine, { badge: string; ring: string }> = {
  primeira: { badge: "bg-canon-blue/10 text-canon-blue", ring: "ring-canon-blue/20" },
  alternativa: { badge: "bg-ink-soft/60 text-ink-muted", ring: "ring-ink-soft" },
  sintomatico: { badge: "bg-warning/10 text-warning", ring: "ring-warning/20" },
  suporte: { badge: "bg-paper-alt text-ink-muted", ring: "ring-ink-soft" },
};

export const LINE_ORDER: SuggestionLine[] = ["primeira", "alternativa", "sintomatico", "suporte"];
