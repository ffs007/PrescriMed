/**
 * Rótulos de apresentação da receita (risco gestacional e tipo de receita).
 * Apenas texto e estilo — nenhum dado clínico.
 */

export const PREGNANCY_RISK_INFO: Record<string, { label: string; color: string; description: string }> = {
  A: { label: "A", color: "text-success bg-success/10", description: "Seguro" },
  B: { label: "B", color: "text-canon-blue bg-canon-blue/10", description: "Provavelmente seguro" },
  C: { label: "C", color: "text-warning bg-warning/10", description: "Usar com cautela" },
  D: { label: "D", color: "text-warning bg-warning/20", description: "Evidência de risco" },
  X: { label: "X", color: "text-destructive bg-destructive/10", description: "Contraindicado" },
};

export const PRESCRIPTION_TYPE_INFO: Record<
  string,
  { label: string; color: string; description: string; printLabel: string }
> = {
  comum: {
    label: "Comum",
    color: "text-foreground bg-muted",
    description: "Receita simples",
    printLabel: "RECEITA MÉDICA",
  },
  branca2vias: {
    label: "2 Vias",
    color: "text-canon-blue bg-canon-blue/10",
    description: "Receita branca em 2 vias (antibióticos)",
    printLabel: "RECEITA MÉDICA — 2 VIAS (ANTIBIÓTICO)",
  },
  amarela: {
    label: "Amarela",
    color: "text-warning bg-warning/10",
    description: "Receita amarela — Notificação A (opioides/entorpecentes)",
    printLabel: 'NOTIFICAÇÃO DE RECEITA "A" (AMARELA)',
  },
  azul: {
    label: "Azul",
    color: "text-canon-blue bg-canon-blue/10",
    description: "Receita azul — Notificação B (psicotrópicos)",
    printLabel: 'NOTIFICAÇÃO DE RECEITA "B" (AZUL)',
  },
};
