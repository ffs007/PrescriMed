import { supabase } from "@/integrations/supabase/client";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";
import type { ExameTipo } from "../components/ExamesForm";
import { equivalentConditionNames } from "./conditionPillars";

export interface ConditionExamSuggestion {
  id: string;
  nome: string;
  tipo: ExameTipo;
  finalidade: string | null;
  obrigatoriedade: string | null;
  justificativa: string | null;
  condutaSeAlterado: string | null;
  nivelEvidencia: string | null;
  contexto: string | null;
}

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const imageTerms = /\b(rx|raio|radiografia|tomografia|ressonancia|ultrassom|ultrassonografia|ecocardiograma|ecg|eletrocardiograma|doppler|cintilografia|mamografia|densitometria|endoscopia|colonoscopia|broncoscopia)\b/i;

const matchesEnvironment = (raw: string | null, environment: ClinicalEnvironment) => {
  if (!raw) return true;
  const contexts = normalize(raw).split(/\s+/);
  if (environment === "emergencia") return contexts.some((item) => ["emergencia", "urgencia", "uti", "hospitalar"].includes(item));
  return contexts.includes(environment) || (environment === "urgencia" && contexts.includes("hospitalar"));
};

export async function listConditionExams(
  conditionName: string,
  environment: ClinicalEnvironment,
): Promise<ConditionExamSuggestion[]> {
  const nomes = equivalentConditionNames(conditionName);
  if (nomes.length === 0) return [];

  // Filtro do quadro feito no banco (índice por nome normalizado).
  const { data, error } = await supabase.rpc("fn_exames_condicao" as never, { p_nomes: nomes } as never);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<Record<string, unknown>>)
    .filter((row) => matchesEnvironment(row.contextos ? String(row.contextos) : null, environment))
    .map((row) => {
      const nome = String(row.nome_exame ?? "");
      return {
        id: String(row.id),
        nome,
        tipo: imageTerms.test(normalize(nome)) ? "imagem" : "laboratorial",
        finalidade: row.finalidade ? String(row.finalidade) : null,
        obrigatoriedade: row.obrigatoriedade ? String(row.obrigatoriedade) : null,
        justificativa: row.justificativa_padrao ? String(row.justificativa_padrao) : null,
        condutaSeAlterado: row.conduta_se_alterado ? String(row.conduta_se_alterado) : null,
        nivelEvidencia: row.nivel_evidencia ? String(row.nivel_evidencia) : null,
        contexto: row.contextos ? String(row.contextos) : null,
      };
    });
}
