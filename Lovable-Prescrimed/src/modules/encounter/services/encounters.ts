/**
 * Atendimento: registro único que amarra paciente, ambiente e documentos.
 *
 * Tudo que um documento precisa saber do paciente (nome, idade, peso, alergias)
 * e do contexto (ambiente, instituição, CID, sinais vitais) vive aqui.
 * Nenhuma tela deve recoletar esses dados.
 */
import { supabase } from "@/integrations/supabase/client";

export type EncounterAmbiente = "ambulatorial" | "ps" | "emergencia" | "hospitalar" | "uti";
export type EncounterStatus = "em_andamento" | "encerrado" | "cancelado";

export interface VitalSigns {
  pa?: string;
  fc?: string;
  fr?: string;
  temperatura?: string;
  saturacao?: string;
  glicemia?: string;
  dor?: string;
  glasgow?: string;
}

export interface Patient {
  id: string;
  nome: string;
  dataNascimento: string | null;
  sexo: string | null;
  pesoKg: number | null;
  alergias: string | null;
  funcaoRenal: string | null;
  documento: string | null;
  observacoes: string | null;
}

export interface Encounter {
  id: string;
  pacienteId: string;
  paciente: Patient;
  ambiente: EncounterAmbiente;
  instituicao: string | null;
  unidade: string | null;
  convenio: string | null;
  sinaisVitais: VitalSigns;
  hipoteseDiagnostica: string | null;
  cidPrincipal: string | null;
  cidsSecundarios: string[];
  inicio: string;
  fim: string | null;
  status: EncounterStatus;
}

const PATIENT_COLS =
  "id, nome, data_nascimento, sexo, peso_kg, alergias, funcao_renal, documento, observacoes";
const ENCOUNTER_COLS =
  `id, paciente_id, ambiente, instituicao, unidade, convenio, sinais_vitais, hipotese_diagnostica, cid_principal, cids_secundarios, data_hora_inicio, data_hora_fim, status, pacientes!inner(${PATIENT_COLS})`;

type PatientRow = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  peso_kg: number | string | null;
  alergias: string | null;
  funcao_renal: string | null;
  documento: string | null;
  observacoes: string | null;
};

type EncounterRow = {
  id: string;
  paciente_id: string;
  ambiente: EncounterAmbiente;
  instituicao: string | null;
  unidade: string | null;
  convenio: string | null;
  sinais_vitais: unknown;
  hipotese_diagnostica: string | null;
  cid_principal: string | null;
  cids_secundarios: string[] | null;
  data_hora_inicio: string;
  data_hora_fim: string | null;
  status: EncounterStatus;
  pacientes: PatientRow;
};

const toNumber = (v: number | string | null): number | null => {
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const mapPatient = (row: PatientRow): Patient => ({
  id: row.id,
  nome: row.nome,
  dataNascimento: row.data_nascimento,
  sexo: row.sexo,
  pesoKg: toNumber(row.peso_kg),
  alergias: row.alergias,
  funcaoRenal: row.funcao_renal,
  documento: row.documento,
  observacoes: row.observacoes,
});

const mapEncounter = (row: EncounterRow): Encounter => ({
  id: row.id,
  pacienteId: row.paciente_id,
  paciente: mapPatient(row.pacientes),
  ambiente: row.ambiente,
  instituicao: row.instituicao,
  unidade: row.unidade,
  convenio: row.convenio,
  sinaisVitais: (row.sinais_vitais ?? {}) as VitalSigns,
  hipoteseDiagnostica: row.hipotese_diagnostica,
  cidPrincipal: row.cid_principal,
  cidsSecundarios: row.cids_secundarios ?? [],
  inicio: row.data_hora_inicio,
  fim: row.data_hora_fim,
  status: row.status,
});

export interface OpenEncounterInput {
  nome: string;
  dataNascimento?: string | null;
  sexo?: string | null;
  pesoKg?: number | null;
  alergias?: string | null;
  funcaoRenal?: string | null;
  documento?: string | null;
  ambiente: EncounterAmbiente;
  instituicao?: string | null;
  unidade?: string | null;
  convenio?: string | null;
  sinaisVitais?: VitalSigns;
  hipoteseDiagnostica?: string | null;
  cidPrincipal?: string | null;
}

/** Abre um atendimento, criando o paciente no mesmo passo. */
export async function openEncounter(input: OpenEncounterInput): Promise<Encounter> {
  const { data: paciente, error: pErr } = await supabase
    .from("pacientes")
    .insert({
      nome: input.nome.trim(),
      data_nascimento: input.dataNascimento || null,
      sexo: input.sexo || null,
      peso_kg: input.pesoKg ?? null,
      alergias: input.alergias || null,
      funcao_renal: input.funcaoRenal || null,
      documento: input.documento || null,
    })
    .select(PATIENT_COLS)
    .single();
  if (pErr) throw pErr;

  const { data, error } = await supabase
    .from("atendimentos")
    .insert({
      paciente_id: (paciente as PatientRow).id,
      ambiente: input.ambiente,
      instituicao: input.instituicao || null,
      unidade: input.unidade || null,
      convenio: input.convenio || null,
      sinais_vitais: (input.sinaisVitais ?? {}) as never,
      hipotese_diagnostica: input.hipoteseDiagnostica || null,
      cid_principal: input.cidPrincipal || null,
    })
    .select(ENCOUNTER_COLS)
    .single();
  if (error) throw error;
  return mapEncounter(data as unknown as EncounterRow);
}

export async function getEncounter(id: string): Promise<Encounter | null> {
  const { data, error } = await supabase
    .from("atendimentos")
    .select(ENCOUNTER_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEncounter(data as unknown as EncounterRow) : null;
}

/** Atendimentos em andamento do próprio médico — filtrado no banco, com limite. */
export async function listOpenEncounters(limit = 20): Promise<Encounter[]> {
  const { data, error } = await supabase
    .from("atendimentos")
    .select(ENCOUNTER_COLS)
    .eq("status", "em_andamento")
    .order("data_hora_inicio", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as EncounterRow[]).map(mapEncounter);
}

export interface EncounterPatch {
  ambiente?: EncounterAmbiente;
  instituicao?: string | null;
  unidade?: string | null;
  convenio?: string | null;
  sinaisVitais?: VitalSigns;
  hipoteseDiagnostica?: string | null;
  cidPrincipal?: string | null;
  cidsSecundarios?: string[];
}

export async function updateEncounter(id: string, patch: EncounterPatch): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.ambiente) payload.ambiente = patch.ambiente;
  if ("instituicao" in patch) payload.instituicao = patch.instituicao;
  if ("unidade" in patch) payload.unidade = patch.unidade;
  if ("convenio" in patch) payload.convenio = patch.convenio;
  if (patch.sinaisVitais) payload.sinais_vitais = patch.sinaisVitais;
  if ("hipoteseDiagnostica" in patch) payload.hipotese_diagnostica = patch.hipoteseDiagnostica;
  if ("cidPrincipal" in patch) payload.cid_principal = patch.cidPrincipal;
  if (patch.cidsSecundarios) payload.cids_secundarios = patch.cidsSecundarios;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("atendimentos").update(payload as never).eq("id", id);
  if (error) throw error;
}

export interface PatientPatch {
  nome?: string;
  dataNascimento?: string | null;
  sexo?: string | null;
  pesoKg?: number | null;
  alergias?: string | null;
  funcaoRenal?: string | null;
}

export async function updatePatient(id: string, patch: PatientPatch): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.nome !== undefined) payload.nome = patch.nome;
  if ("dataNascimento" in patch) payload.data_nascimento = patch.dataNascimento;
  if ("sexo" in patch) payload.sexo = patch.sexo;
  if ("pesoKg" in patch) payload.peso_kg = patch.pesoKg;
  if ("alergias" in patch) payload.alergias = patch.alergias;
  if ("funcaoRenal" in patch) payload.funcao_renal = patch.funcaoRenal;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("pacientes").update(payload as never).eq("id", id);
  if (error) throw error;
}

export async function closeEncounter(id: string): Promise<void> {
  const { error } = await supabase
    .from("atendimentos")
    .update({ status: "encerrado", data_hora_fim: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export interface EncounterDocument {
  id: string;
  tipo: string;
  titulo: string | null;
  criadoEm: string;
  origem: "documento" | "receita";
}

/** Todos os documentos de um atendimento — uma consulta por origem, sem filtro no cliente. */
export async function listEncounterDocuments(atendimentoId: string): Promise<EncounterDocument[]> {
  const [docs, presc] = await Promise.all([
    supabase
      .from("documentos_gerados")
      .select("id, tipo, titulo, data_hora")
      .eq("atendimento_id", atendimentoId)
      .order("data_hora", { ascending: false })
      .limit(50),
    supabase
      .from("prescricoes_historico")
      .select("id, criado_em, diagnostico")
      .eq("atendimento_id", atendimentoId)
      .order("criado_em", { ascending: false })
      .limit(50),
  ]);
  if (docs.error) throw docs.error;
  if (presc.error) throw presc.error;

  const a: EncounterDocument[] = ((docs.data ?? []) as unknown as Array<Record<string, unknown>>).map((d) => ({
    id: String(d.id),
    tipo: String(d.tipo ?? "documento"),
    titulo: (d.titulo as string) ?? null,
    criadoEm: String(d.data_hora),
    origem: "documento" as const,
  }));
  const b: EncounterDocument[] = ((presc.data ?? []) as unknown as Array<Record<string, unknown>>).map((p) => ({
    id: String(p.id),
    tipo: "receita",
    titulo: (p.diagnostico as string) ?? null,
    criadoEm: String(p.criado_em),
    origem: "receita" as const,
  }));
  return [...a, ...b].sort((x, y) => y.criadoEm.localeCompare(x.criadoEm));
}
