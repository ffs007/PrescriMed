// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas
import { z } from "npm:zod@3.23.8";

export const GRAVIDADE_ALERTA = ["baixa", "moderada", "alta", "critica"] as const;

/** Regras únicas de alerta clínico (interações, contraindicações, IV). */
export const alertaSchema = z.object({
  tipo: z.string().trim().min(1, "Tipo do alerta"),
  gravidade: z.enum(GRAVIDADE_ALERTA),
  titulo: z.string().trim().min(3, "Título do alerta").max(200),
  mensagem: z.string().trim().min(3, "Mensagem do alerta").max(2000),
  medicamentos: z.array(z.string().trim().min(1)).max(20).optional(),
  fonte: z.string().trim().max(500).optional(),
  requer_justificativa: z.boolean().optional(),
}).passthrough().superRefine((a, ctx) => {
  if (a.gravidade === "critica" && !a.fonte)
    ctx.addIssue({ code: "custom", path: ["fonte"], message: "Alerta crítico precisa de fonte" });
});

export type AlertaInput = z.input<typeof alertaSchema>;

const tem = (v: unknown) => v != null && String(v).trim() !== "";

/** Interação medicamentosa (cadastro administrativo). */
export const interacaoSchema = z.record(z.unknown()).superRefine((f, ctx) => {
  const add = (m: string) => ctx.addIssue({ code: "custom", message: m });
  if (!tem(f.principio_ativo_a) && !tem(f.classe_a)) add("Informe princípio ativo A ou classe A");
  if (!tem(f.principio_ativo_b) && !tem(f.classe_b)) add("Informe princípio ativo B ou classe B");
  if (f.status_revisao === "revisado") {
    if (!tem(f.fonte_referencia)) add("Interação revisada exige fonte");
    if (f.gravidade === "contraindicada" && !tem(f.mensagem_medico)) add("Interação crítica exige mensagem ao médico");
    if (f.bloqueio_absoluto && !tem(f.conduta_sugerida)) add("Bloqueio absoluto exige conduta sugerida");
  }
});

/** Contraindicação (cadastro administrativo). */
export const contraindicacaoSchema = z.record(z.unknown()).superRefine((f, ctx) => {
  const add = (m: string) => ctx.addIssue({ code: "custom", message: m });
  if (!tem(f.principio_ativo) && !tem(f.classe_terapeutica)) add("Informe princípio ativo ou classe terapêutica");
  if (f.status_revisao === "revisado") {
    if (!tem(f.fonte_referencia)) add("Contraindicação revisada exige fonte");
    if (f.bloqueio_absoluto && !tem(f.conduta_sugerida)) add("Bloqueio absoluto exige conduta sugerida");
  }
});

/** Ficha de diluição IV. */
export const medicamentoIVSchema = z.object({
  principio_ativo: z.string({ required_error: "Princípio ativo é obrigatório" }).trim().min(1, "Princípio ativo é obrigatório"),
}).passthrough();

/** Primeira mensagem de erro, ou null se válido. */
export function primeiroErro(schema: z.ZodTypeAny, data: unknown): string | null {
  const r = schema.safeParse(data);
  return r.success ? null : r.error.issues[0]?.message ?? "Dados inválidos";
}
