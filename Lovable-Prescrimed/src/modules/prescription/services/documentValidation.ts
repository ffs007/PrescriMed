import type { DocumentAction } from "../components/ActionGrid";
import type { SelectedMed } from "../types/prescription";
import type { AtestadoData } from "../components/AtestadoForm";
import type { ExamesData } from "../components/ExamesForm";
import type { EncaminhamentoData } from "../components/EncaminhamentoForm";
import type { DeclaracaoData } from "../components/DeclaracaoForm";
import type { RelatorioData } from "../components/RelatorioForm";
import type { OrientacoesData } from "../components/OrientacoesForm";
import {
  missingRequired,
  AIH_FIELDS,
  APAC_FIELDS,
  NOTIFICACAO_FIELDS,
  type FieldSpec,
  type StructuredData,
} from "./regulatoryForms";
import type { ZodTypeAny } from "zod";
import { pacienteDocumentoSchema } from "@/schemas/paciente.schema";
import {
  pendencias, receitaSchema, atestadoSchema, examesSchema, encaminhamentoSchema,
  declaracaoSchema, relatorioSchema, orientacoesSchema, procedimentoSchema,
  avisosReceitaSchema, avisosExamesSchema,
} from "@/schemas/documento.schema";

export interface ProcedimentoData {
  tipo: string;
  justificativa: string;
  observacoes: string;
  contexto: string;
}

/** Resultado da validação de um documento. */
export interface ValidationResult {
  /** True quando o documento pode ser emitido. */
  canEmit: boolean;
  /** Lista de pendências bloqueantes (faltando para emitir). */
  blockers: string[];
  /** Lista de avisos não bloqueantes (recomendações). */
  warnings: string[];
}

const ok = (warnings: string[] = []): ValidationResult => ({
  canEmit: true,
  blockers: [],
  warnings,
});

const blocked = (blockers: string[], warnings: string[] = []): ValidationResult => ({
  canEmit: false,
  blockers,
  warnings,
});

export interface PatientForValidation {
  patientName: string;
  isPediatric: boolean;
  weight: string;
}

/** Toda regra vem de src/schemas — aqui só se combina paciente + documento. */
const validateBase = (patient: PatientForValidation): string[] =>
  pendencias(pacienteDocumentoSchema, patient);

const run = (
  schema: ZodTypeAny,
  data: unknown,
  patient: PatientForValidation,
  warnSchema?: ZodTypeAny,
  warnData?: unknown,
): ValidationResult => {
  const blockers = [...validateBase(patient), ...pendencias(schema, data)];
  const warnings = warnSchema ? pendencias(warnSchema, warnData) : [];
  return blockers.length ? blocked(blockers, warnings) : ok(warnings);
};

export const validateReceita = (selected: SelectedMed[], patient: PatientForValidation) =>
  run(receitaSchema, { selected }, patient, avisosReceitaSchema, patient);
export const validateAtestado = (data: AtestadoData, patient: PatientForValidation) =>
  run(atestadoSchema, data, patient);
export const validateExames = (data: ExamesData, patient: PatientForValidation) =>
  run(examesSchema, data, patient, avisosExamesSchema, data);
export const validateEncaminhamento = (data: EncaminhamentoData, patient: PatientForValidation) =>
  run(encaminhamentoSchema, data, patient);
export const validateDeclaracao = (data: DeclaracaoData, patient: PatientForValidation) =>
  run(declaracaoSchema, data, patient);
export const validateRelatorio = (data: RelatorioData, patient: PatientForValidation) =>
  run(relatorioSchema, data, patient);
export const validateOrientacoes = (data: OrientacoesData, patient: PatientForValidation) =>
  run(orientacoesSchema, data, patient);
export const validateProcedimento = (data: ProcedimentoData, patient: PatientForValidation) =>
  run(procedimentoSchema, data, patient);

/** Documentos regulatórios: validação dirigida pela especificação de campos. */
export const validateStructured = (
  fields: FieldSpec[],
  data: StructuredData,
  patient: PatientForValidation,
): ValidationResult => {
  const blockers = [...validateBase(patient), ...missingRequired(fields, data)];
  return blockers.length ? blocked(blockers) : ok();
};

/** Dispatcher: valida o documento ativo. */
export interface ValidationContext {
  action: DocumentAction;
  patient: PatientForValidation;
  selected: SelectedMed[];
  atestado: AtestadoData;
  exames: ExamesData;
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  procedimento: ProcedimentoData;
  aih: StructuredData;
  apac: StructuredData;
  notificacao: StructuredData;
}

export const validateDocument = (ctx: ValidationContext): ValidationResult => {
  switch (ctx.action) {
    case "receita":
      return validateReceita(ctx.selected, ctx.patient);
    case "atestado":
      return validateAtestado(ctx.atestado, ctx.patient);
    case "exames":
      return validateExames(ctx.exames, ctx.patient);
    case "encaminhamento":
      return validateEncaminhamento(ctx.encaminhamento, ctx.patient);
    case "declaracao":
      return validateDeclaracao(ctx.declaracao, ctx.patient);
    case "relatorio":
      return validateRelatorio(ctx.relatorio, ctx.patient);
    case "orientacoes":
      return validateOrientacoes(ctx.orientacoes, ctx.patient);
    case "procedimento":
      return validateProcedimento(ctx.procedimento, ctx.patient);
    case "aih":
      return validateStructured(AIH_FIELDS, ctx.aih, ctx.patient);
    case "apac":
      return validateStructured(APAC_FIELDS, ctx.apac, ctx.patient);
    case "notificacao":
      return validateStructured(NOTIFICACAO_FIELDS, ctx.notificacao, ctx.patient);
  }
};
