import { supabase } from "@/integrations/supabase/client";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";

export interface AnamnesisItem {
  id: string;
  bloco: string;
  pergunta: string;
  porQue: string | null;
  redFlag: boolean;
  fonte: string | null;
  nivelEvidencia: string | null;
}

export interface PhysicalExamItem {
  id: string;
  sistema: string;
  oQueProcurar: string;
  achadoEsperado: string | null;
  confirma: boolean;
  sugereDiferencial: string | null;
  indicaGravidade: boolean;
  mudaConduta: string | null;
}

export interface DocumentModel {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string;
  destino: string | null;
  urgencia: string | null;
  solicitacoes: string | null;
  riscos: string | null;
}

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const contextMatches = (raw: string | null, environment: ClinicalEnvironment) => {
  const ctx = normalize(raw);
  if (!ctx || ctx === "qualquer") return true;
  if (environment === "emergencia") return ["emergencia", "urgencia", "hospitalar"].includes(ctx);
  if (environment === "urgencia") return ["urgencia", "hospitalar"].includes(ctx);
  return ctx === environment;
};

/**
 * Sinônimos entre o rótulo mostrado na tela e o nome curado no banco.
 * Evita duplicar conteúdo clínico só porque o nome é escrito de outra forma.
 */
const ALIASES: Record<string, string> = {
  "amigdalite bacteriana": "faringoamigdalite bacteriana",
  "amigdalite aguda": "faringoamigdalite bacteriana",
  "amigdalite": "faringoamigdalite bacteriana",
  "faringoamigdalite": "faringoamigdalite bacteriana",
  "faringotonsilite bacteriana": "faringoamigdalite bacteriana",
  "influenza": "sindrome gripal",
  "gripe": "sindrome gripal",
  "dor toracica": "dor toracica de baixo risco",
  "dor toracica de baixo risco": "dor toracica de baixo risco",
  "toracalgia de baixo risco": "dor toracica de baixo risco",
  // Lote 2 — respiratório
  "asma": "asma bronquica",
  "crise asmatica": "asma bronquica",
  "crise asmatica leve": "asma bronquica",
  "crise asmatica moderada": "asma bronquica",
  "crise asmatica grave": "asma bronquica",
  "crise asmatica grave mal asmatico": "asma bronquica",
  "mal asmatico": "asma bronquica",
  "dpoc": "doenca pulmonar obstrutiva cronica",
  "exacerbacao de dpoc": "doenca pulmonar obstrutiva cronica",
  "exacerbacao aguda de dpoc": "doenca pulmonar obstrutiva cronica",
  "doenca pulmonar obstrutiva cronica exacerbada": "doenca pulmonar obstrutiva cronica",
  "pneumonia": "pneumonia adquirida na comunidade",
  "pac": "pneumonia adquirida na comunidade",
  "pneumonia comunitaria": "pneumonia adquirida na comunidade",
  "pneumonia adquirida na comunidade pac": "pneumonia adquirida na comunidade",
  "bronquiolite": "bronquiolite viral aguda",
  "bronquiolite aguda": "bronquiolite viral aguda",
  "crupe": "laringite estridulosa crupe",
  "laringite": "laringite estridulosa crupe",
  "laringite estridulosa": "laringite estridulosa crupe",
  "laringite viral": "laringite estridulosa crupe",
  "laringotraqueite aguda": "laringite estridulosa crupe",
};


export const canonicalConditionName = (value: string) => {
  const key = normalize(value);
  return ALIASES[key] ?? key;
};

/** Todos os nomes equivalentes a um quadro — o filtro é feito no banco. */
export const equivalentConditionNames = (value: string): string[] => {
  const target = canonicalConditionName(value);
  if (!target) return [];
  const names = new Set([value, target]);
  for (const [k, v] of Object.entries(ALIASES)) if (v === target) names.add(k);
  return [...names];
};

async function fetchRows(table: string, conditionName: string) {
  const nomes = equivalentConditionNames(conditionName);
  if (nomes.length === 0) return [] as Array<Record<string, unknown>>;
  const { data, error } = await supabase.rpc("fn_pilar_condicao" as never, { p_tabela: table, p_nomes: nomes } as never);
  if (error) throw error;
  return ((data ?? []) as unknown as Array<Record<string, unknown>>);
}

export async function listConditionAnamnesis(
  conditionName: string,
  environment: ClinicalEnvironment,
): Promise<AnamnesisItem[]> {
  const rows = await fetchRows("condicao_anamnese", conditionName);
  return rows
    .filter((row) => contextMatches(row.care_context ? String(row.care_context) : null, environment))
    .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
    .map((row) => ({
      id: String(row.id),
      bloco: String(row.bloco ?? ""),
      pergunta: String(row.pergunta ?? ""),
      porQue: row.por_que ? String(row.por_que) : null,
      redFlag: Boolean(row.red_flag),
      fonte: row.fonte ? String(row.fonte) : null,
      nivelEvidencia: row.nivel_evidencia ? String(row.nivel_evidencia) : null,
    }));
}

export async function listConditionPhysicalExam(
  conditionName: string,
  environment: ClinicalEnvironment,
): Promise<PhysicalExamItem[]> {
  const rows = await fetchRows("condicao_exame_fisico", conditionName);
  return rows
    .filter((row) => contextMatches(row.care_context ? String(row.care_context) : null, environment))
    .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
    .map((row) => ({
      id: String(row.id),
      sistema: String(row.sistema ?? ""),
      oQueProcurar: String(row.o_que_procurar ?? ""),
      achadoEsperado: row.achado_esperado ? String(row.achado_esperado) : null,
      confirma: Boolean(row.confirma_diagnostico),
      sugereDiferencial: row.sugere_diferencial ? String(row.sugere_diferencial) : null,
      indicaGravidade: Boolean(row.indica_gravidade),
      mudaConduta: row.muda_conduta_imediata ? String(row.muda_conduta_imediata) : null,
    }));
}

export async function listConditionReferrals(conditionName: string): Promise<DocumentModel[]> {
  const rows = await fetchRows("condicao_encaminhamento_modelo", conditionName);
  return rows.map((row) => ({
    id: String(row.id),
    tipo: String(row.tipo ?? ""),
    titulo: String(row.titulo ?? ""),
    corpo: String(row.corpo ?? ""),
    destino: row.especialidade_destino ? String(row.especialidade_destino) : null,
    urgencia: row.nivel_urgencia ? String(row.nivel_urgencia) : null,
    solicitacoes: row.solicitacoes_ao_servico ? String(row.solicitacoes_ao_servico) : null,
    riscos: null,
  }));
}

export async function listConditionTransfers(conditionName: string): Promise<DocumentModel[]> {
  const rows = await fetchRows("condicao_transferencia_modelo", conditionName);
  return rows.map((row) => ({
    id: String(row.id),
    tipo: String(row.tipo ?? ""),
    titulo: String(row.titulo ?? ""),
    corpo: String(row.corpo ?? ""),
    destino: row.complexidade_destino ? String(row.complexidade_destino) : null,
    urgencia: null,
    solicitacoes: row.solicitacoes_ao_servico ? String(row.solicitacoes_ao_servico) : null,
    riscos: row.riscos_transporte ? String(row.riscos_transporte) : null,
  }));
}
