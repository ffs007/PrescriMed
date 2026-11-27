// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas
import { z } from "npm:zod@3.23.8";
import { pacienteDocumentoSchema } from "./paciente.schema.ts";

/** Regras únicas de cada documento clínico. Mensagens = pendências mostradas ao médico. */
const preenchido = (msg: string) => z.string().trim().min(1, msg);

export const receitaSchema = z.object({
  selected: z.array(z.unknown()).min(1, "Adicione ao menos uma medicação"),
}).superRefine((data, ctx) => {
  data.selected.forEach((item, index) => {
    const text = typeof item === "object" && item !== null && "text" in item
      ? String(item.text ?? "") : "";
    if (/apresenta[cç][aã]o n[aã]o cadastrada|dose n[aã]o cadastrada|frequ[eê]ncia n[aã]o cadastrada|dura[cç][aã]o n[aã]o cadastrada/i.test(text)) {
      ctx.addIssue({ code: "custom", path: ["selected", index], message: `Complete apresentação, dose, frequência e duração da medicação ${index + 1} antes de emitir` });
    }
    if (/DOSE N[AÃ]O CALCULADA/i.test(text)) {
      ctx.addIssue({ code: "custom", path: ["selected", index], message: `Informe o peso do paciente: a dose da medicação ${index + 1} é calculada por kg` });
    }
    if (/N[AÃ]O INDICADA PARA ESTA FAIXA/i.test(text)) {
      ctx.addIssue({ code: "custom", path: ["selected", index], message: `A medicação ${index + 1} não é indicada para a faixa etária do paciente` });
    }
    if (/\{dose\}|(^|\n|\s)—\s*($|\n)/.test(text)) {
      ctx.addIssue({ code: "custom", path: ["selected", index], message: `A medicação ${index + 1} está com dose em branco` });
    }
  });
});
export const atestadoSchema = z.object({ days: preenchido("Período de afastamento (dias)") }).passthrough();
export const examesSchema = z.object({
  itens: z.array(z.unknown()).min(1, "Adicione ao menos um exame"),
}).passthrough();
export const encaminhamentoSchema = z.object({
  especialidade: preenchido("Especialidade de destino"),
  hipotese: z.string(),
  resumoClinico: z.string(),
}).passthrough().refine((d) => d.hipotese.trim() !== "" || d.resumoClinico.trim() !== "", {
  message: "Hipótese diagnóstica ou resumo clínico",
});
export const declaracaoSchema = z.object({
  data: preenchido("Data do comparecimento"),
  horaInicio: preenchido("Horário de início"),
}).passthrough();
export const relatorioSchema = z.object({ conteudo: preenchido("Escreva o relatório do atendimento") }).passthrough();
export const orientacoesSchema = z.object({
  cuidadosGerais: z.string(),
  sinaisAlarme: z.array(z.string()),
}).passthrough().refine((d) => d.cuidadosGerais.trim() !== "" || d.sinaisAlarme.length > 0, {
  message: "Cuidados gerais ou sinais de alarme",
});
export const procedimentoSchema = z.object({
  tipo: preenchido("Tipo de procedimento"),
  justificativa: preenchido("Justificativa clínica"),
  observacoes: z.string(),
  contexto: z.string(),
});

/** Avisos (não bloqueiam). */
export const avisosReceitaSchema = pacienteDocumentoSchema.refine(
  (p) => !p.isPediatric || p.weight.trim() !== "",
  { message: "Peso ausente — recomendado para cálculo pediátrico" },
);
export const avisosExamesSchema = z.object({
  justificativa: preenchido("Justificativa clínica recomendada"),
}).passthrough();

/** Converte o resultado de um schema em lista de mensagens. */
export function pendencias(schema: z.ZodTypeAny, data: unknown): string[] {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => i.message);
}

/** Documentos regulatórios (AIH, APAC, notificação): schema gerado da especificação de campos. */
export interface CampoObrigatorio { key: string; label: string; required?: boolean }
export const camposObrigatoriosSchema = (fields: CampoObrigatorio[]) =>
  z.record(z.unknown()).superRefine((d, ctx) => {
    for (const f of fields)
      if (f.required && !String(d[f.key] ?? "").trim())
        ctx.addIssue({ code: "custom", path: [f.key], message: f.label });
  });

/** Conferência antes da assinatura/emissão de um pacote de documentos. */
export const emissaoSchema = z.object({
  perfil: z.object({
    nome_profissional: z.string().nullish(),
    registro: z.string().nullish(),
  }).passthrough().nullable(),
  paciente: z.object({ nome: z.string().nullish(), documento: z.string().nullish(), endereco: z.string().nullish() }).passthrough(),
  tipo: z.string(),
  itens: z.array(z.object({ kind: z.string() }).passthrough()),
  exigirControle: z.boolean(),
}).superRefine((b, ctx) => {
  const add = (m: string) => ctx.addIssue({ code: "custom", message: m });
  if (!b.perfil) add("Perfil de assinatura não selecionado.");
  if (!b.perfil?.nome_profissional) add("Nome do profissional ausente.");
  if (!b.perfil?.registro) add("Registro profissional (CRM/UF) ausente.");
  if (!b.paciente?.nome) add("Nome do paciente ausente.");
  if (b.tipo === "receita_controle_especial" && b.exigirControle) {
    if (!b.paciente.documento) add("Documento do paciente exigido na receita de controle especial.");
    if (!b.paciente.endereco) add("Endereço do paciente exigido na receita de controle especial.");
  }
  if (b.tipo === "atestado" && !b.itens.some((i) => i.kind === "atestado")) add("Item de atestado ausente.");
  if (b.itens.length === 0) add("Documento sem itens.");
});
