// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas
import { z } from "npm:zod@3.23.8";

/**
 * Regras únicas de validação de medicamento — usadas no formulário,
 * na importação em lote e antes de gravar no banco.
 * As listas de opções espelham os tipos do banco.
 */
export const CATEGORIA_CLINICA = [
  "dor_febre", "nauseas_vomitos", "alergia_anafilaxia", "broncoespasmo_respiratorio",
  "antibioticos", "antivirais", "antifungicos", "gastrointestinal", "cardiovascular",
  "anti_hipertensivos", "diureticos", "corticoides", "anticoag_antiagreg",
  "neurologico_anticonvulsivante", "psiquiatria_agitacao", "sedacao_analgesia_hospitalar",
  "hidratacao_eletrolitos", "endocrino_metabolico", "diabetes_glicemia", "gineco_obstetricia",
  "pediatria_comum", "dermatologia_basica", "otorrino_oftalmo", "emergencia", "controlados",
] as const;
export const TIPO_RECEITA = ["comum", "especial_b", "especial_a", "antimicrobiano", "controlado_outros"] as const;
export const ALERTA_GEST_LACT = ["seguro", "cautela", "evitar", "contraindicado", "sem_dados"] as const;
export const PRIORIDADE_MVP = ["essencial", "alta", "media", "baixa", "futuro"] as const;
export const STATUS_REVISAO = ["rascunho", "aguardando_revisao", "revisado", "precisa_corrigir", "inativo"] as const;

const texto = z.string().trim().max(2000).nullable().optional()
  .transform((v) => (v === "" || v === undefined ? null : v));
const lista = z.array(z.string().trim().min(1).max(200)).max(200).optional();
const flag = z.boolean().optional();

export const medicamentoSchema = z.object({
  id: z.string().uuid().optional(),
  principio_ativo: z.string().trim().min(2, "Princípio ativo é obrigatório").max(200),
  principio_ativo_dcb: texto,
  nome_comercial_referencia: texto,
  nomes_comerciais: lista,
  sinonimos: lista,
  classe_terapeutica: texto,
  subclasse_terapeutica: texto,
  categoria_clinica: z.enum(CATEGORIA_CLINICA).optional(),
  forma_farmaceutica: texto,
  apresentacao: texto,
  concentracao: texto,
  via_administracao: texto,
  uso_principal: texto,
  uso_em_urgencia: flag, uso_emergencia: flag, uso_ambulatorial_rapido: flag,
  medicamento_injetavel: flag, medicamento_oral: flag, medicamento_topico: flag,
  medicamento_inalatorio: flag, medicamento_controlado: flag, antimicrobiano: flag,
  tipo_receita: z.enum(TIPO_RECEITA).optional(),
  exige_receita_especial: flag, exige_retencao_receita: flag,
  dose_adulto_padrao: texto, dose_pediatrica_padrao: texto,
  dose_maxima_adulto: texto, dose_maxima_pediatrica: texto,
  unidade_dose: texto, frequencia_padrao: texto, duracao_padrao: texto,
  observacao_posologia: texto,
  exige_peso: flag, exige_ajuste_renal: flag, exige_ajuste_hepatico: flag,
  alerta_gestacao: z.enum(ALERTA_GEST_LACT).optional(),
  alerta_lactacao: z.enum(ALERTA_GEST_LACT).optional(),
  alerta_alergia_classe: texto,
  risco_interacao_relevante: flag, risco_duplicidade: flag,
  cid_relacionados: z.array(z.string().trim().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/i, "CID inválido")).max(100).optional(),
  queixas_relacionadas: lista, protocolos_relacionados: lista, modelos_rapidos_relacionados: lista,
  termos_busca: lista, abreviacoes: lista, nomes_populares: lista,
  prioridade_mvp: z.enum(PRIORIDADE_MVP).optional(),
  prioridade_busca: z.number().int().min(0).max(1000).optional(),
  status_revisao: z.enum(STATUS_REVISAO).optional(),
  fonte_referencia: texto,
  ativo: flag,
  codigo_atc: texto, codigo_dcb: texto, na_rename: flag, alto_risco: flag,
  observacoes: texto, mecanismo_acao: texto, subclasse: texto,
  principio_ativo_en: texto, nomes_comerciais_br: texto,
}).passthrough().superRefine((m, ctx) => {
  if (m.status_revisao === "revisado" && !m.fonte_referencia) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fonte_referencia"], message: "Medicamento revisado precisa de fonte" });
  }
  if (m.tipo_receita && m.tipo_receita !== "comum" && m.tipo_receita !== "antimicrobiano" && m.medicamento_controlado === false) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["medicamento_controlado"], message: "Receita especial exige marcar como controlado" });
  }
});

export type MedicamentoInput = z.input<typeof medicamentoSchema>;

/** Converte erros em frases curtas para mostrar ao usuário. */
export function mensagensErro(err: z.ZodError): string[] {
  return err.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}

export function validarMedicamento(data: unknown) {
  const r = medicamentoSchema.safeParse(data);
  return r.success ? { ok: true as const, data: r.data } : { ok: false as const, errors: mensagensErro(r.error) };
}
