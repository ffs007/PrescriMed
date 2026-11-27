/**
 * Catálogo clínico — fonte única no banco (Fase 1, Etapa B).
 *
 * Substitui os arquivos estáticos que existiam em `src/data/medications.ts`,
 * `data/exams.ts`, `data/pathologyProtocols.ts` e `data/extraPathologies.ts`.
 * Tudo aqui é leitura do banco; nenhum conteúdo clínico vive mais no código.
 */
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { Medication, Pathology } from "@/types/prescription";
import type { ExamItem, MedicationV2 } from "../types/clinical";
import type { SuggestionRecipe } from "../types/suggestionLines";

export interface LegacyProtocol {
  pathologyId: number;
  context?: string;
  suggestions: SuggestionRecipe[];
}

export async function fetchLegacyMedications(): Promise<Medication[]> {
  const { data, error } = await supabaseUntyped
    .from("catalogo_medicamentos_legado")
    .select("id_legado, dados")
    .order("nome");
  if (error) throw error;
  return ((data ?? []) as Array<{ id_legado: number; dados: Medication }>).map((row) => ({
    ...row.dados,
    id: row.id_legado,
  }));
}

export async function fetchCuratedPathologies(): Promise<Pathology[]> {
  const { data, error } = await supabaseUntyped
    .from("catalogo_patologias_legado")
    .select("id_legado, dados")
    .order("nome");
  if (error) throw error;
  return ((data ?? []) as Array<{ id_legado: number; dados: Pathology }>).map((row) => ({
    ...row.dados,
    id: row.id_legado,
  }));
}

export async function fetchExamsLibrary(): Promise<ExamItem[]> {
  const { data, error } = await supabaseUntyped
    .from("catalogo_exames_legado")
    .select("id_legado, nome, categoria, justificativa_padrao, sinonimos")
    .order("categoria")
    .order("nome");
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id_legado),
    name: String(row.nome ?? ""),
    category: String(row.categoria ?? ""),
    defaultJustification: row.justificativa_padrao ? String(row.justificativa_padrao) : undefined,
    synonyms: ((row.sinonimos as string[]) ?? []).filter(Boolean),
  })) as ExamItem[];
}

export async function fetchLegacyProtocols(): Promise<LegacyProtocol[]> {
  const { data, error } = await supabaseUntyped
    .from("catalogo_protocolos_legado")
    .select("patologia_id_legado, contexto, sugestoes");
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    pathologyId: Number(row.patologia_id_legado),
    context: row.contexto ? String(row.contexto) : undefined,
    suggestions: ((row.sugestoes as SuggestionRecipe[]) ?? []),
  }));
}

export async function fetchMedicationOverlay(): Promise<MedicationV2[]> {
  const { data, error } = await supabaseUntyped
    .from("catalogo_medicamentos_overlay")
    .select("id_legado, dados");
  if (error) throw error;
  return ((data ?? []) as Array<{ id_legado: number; dados: MedicationV2 }>).map((row) => ({
    ...row.dados,
    id: row.id_legado,
  }));
}

/** Busca apenas os medicamentos do catálogo pelos IDs pedidos (lotes de até 50). */
export async function fetchLegacyMedicationsByIds(ids: number[]): Promise<Medication[]> {
  const unique = Array.from(new Set(ids.filter((id) => id > 0 && id < 500000)));
  const out: Medication[] = [];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const { data, error } = await supabaseUntyped
      .from("catalogo_medicamentos_legado")
      .select("id_legado, dados")
      .in("id_legado", chunk)
      .limit(50);
    if (error) throw error;
    for (const row of (data ?? []) as Array<{ id_legado: number; dados: Medication }>) {
      out.push({ ...row.dados, id: row.id_legado });
    }
  }
  return out;
}
