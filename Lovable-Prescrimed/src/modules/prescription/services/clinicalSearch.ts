/**
 * Busca clínica unificada.
 *
 * Indexa medicamentos, quadros clínicos, exames, procedimentos, especialidades
 * e orientações em um único índice Fuse.js, com tolerância a typos,
 * suporte a sinônimos e ranking por relevância.
 *
 * Medicamentos, quadros e exames vêm do banco (catálogo clínico); nada de
 * lista fixa no código.
 *
 * Uso:
 *   const { search } = useClinicalSearch();
 *   const results = search("amox");
 */

import Fuse from "fuse.js";
import type { Medication, Pathology } from "@/types/prescription";
import type { ExamItem } from "../types/clinical";
import { ORIENTATIONS_LIBRARY } from "../data/orientations";
import { PROCEDURES_LIBRARY } from "../data/procedures";
import { SPECIALTIES_LIBRARY } from "../data/specialties";
import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { ClinicalEnvironment } from "../types/prescription";

export type SearchKind =
  | "medication"
  | "pathology"
  | "exam"
  | "procedure"
  | "specialty"
  | "orientation";

export interface SearchEntry {
  /** Identificador composto kind:id para chave estável em UI. */
  key: string;
  kind: SearchKind;
  id: string | number;
  title: string;
  subtitle?: string;
  category?: string;
  /** Termos auxiliares (sinônimos, princípio ativo, classe). */
  aliases?: string[];
  /** Referência ao item original para lookup direto sem refetch. */
  raw: unknown;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

/* -------- Construção do índice -------- */

export const buildSearchEntries = (input: {
  medications: Medication[];
  pathologies: Pathology[];
  exams: ExamItem[];
}): SearchEntry[] => {
  const out: SearchEntry[] = [];

  for (const m of input.medications) {
    out.push({
      key: `medication:${m.id}`,
      kind: "medication",
      id: m.id,
      title: m.name,
      subtitle: m.dosage,
      category: m.category,
      aliases: [m.category, m.subCategory ?? ""].filter(Boolean),
      raw: m,
    });
  }

  for (const p of input.pathologies) {
    out.push({
      key: `pathology:${p.id}`,
      kind: "pathology",
      id: p.id,
      title: p.name,
      subtitle: p.cid ? `CID ${p.cid}` : undefined,
      category: p.category,
      raw: p,
    });
  }

  for (const e of input.exams) {
    out.push({
      key: `exam:${e.id}`,
      kind: "exam",
      id: e.id,
      title: e.name,
      category: e.category,
      aliases: e.synonyms,
      raw: e,
    });
  }

  for (const p of PROCEDURES_LIBRARY) {
    out.push({
      key: `procedure:${p.id}`,
      kind: "procedure",
      id: p.id,
      title: p.name,
      category: p.category,
      aliases: p.synonyms,
      raw: p,
    });
  }

  for (const s of SPECIALTIES_LIBRARY) {
    out.push({ key: `specialty:${s.id}`, kind: "specialty", id: s.id, title: s.name, raw: s });
  }

  for (const o of ORIENTATIONS_LIBRARY) {
    out.push({
      key: `orientation:${o.id}`,
      kind: "orientation",
      id: o.id,
      title: o.title,
      category: o.category,
      aliases: o.synonyms,
      raw: o,
    });
  }

  return out;
};

const makeFuse = (entries: SearchEntry[]) =>
  new Fuse(entries, {
    keys: [
      { name: "title", weight: 0.6 },
      { name: "category", weight: 0.15 },
      { name: "aliases", weight: 0.25 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
  });

/* -------- API pública -------- */

export interface ClinicalSearchAPI {
  search: (query: string, opts?: { limit?: number; kinds?: SearchKind[] }) => SearchResult[];
  /** Retorna todas as entradas indexadas (para listagem/governança). */
  all: () => ReadonlyArray<SearchEntry>;
  isLoading: boolean;
}

/**
 * Etapa D — a busca roda no banco: cada tipo traz no máximo `limit` itens
 * (padrão 20, teto 50) filtrados por nome/categoria. Só os itens pequenos do
 * app (procedimentos, especialidades, orientações) são buscados localmente.
 */
export const useClinicalSearchQuery = (query: string, opts: { limit?: number; kinds?: SearchKind[] } = {}) => {
  const q = query.trim();
  const limit = Math.min(opts.limit ?? 20, 50);
  const env: ClinicalEnvironment = "urgencia";
  return useQuery({
    queryKey: ["busca_clinica", q, limit, opts.kinds ?? null],
    enabled: q.length >= 2,
    staleTime: 60_000,
    queryFn: async (): Promise<SearchResult[]> => {
      const like = `%${q.replace(/[%_,()]/g, " ")}%`;
      const want = (k: SearchKind) => !opts.kinds?.length || opts.kinds.includes(k);
      const [meds, exams, quadros] = await Promise.all([
        want("medication")
          ? supabaseUntyped.from("catalogo_medicamentos_legado").select("id_legado, dados")
              .or(`nome.ilike.${like},categoria.ilike.${like}`).order("nome").limit(limit)
          : Promise.resolve({ data: [], error: null }),
        want("exam")
          ? supabaseUntyped.from("catalogo_exames_legado").select("id_legado, nome, categoria, sinonimos")
              .or(`nome.ilike.${like},categoria.ilike.${like}`).order("nome").limit(limit)
          : Promise.resolve({ data: [], error: null }),
        want("pathology")
          ? Promise.all((["ambulatorial", "urgencia", "emergencia"] as ClinicalEnvironment[]).map((a) =>
              supabaseUntyped.rpc("fn_quadros_ambiente", { p_ambiente: a, p_busca: q, p_limit: limit, p_offset: 0 })))
          : Promise.resolve([]),
      ]);
      void env;
      const medications = ((meds.data ?? []) as Array<{ id_legado: number; dados: Medication }>).map((r) => ({ ...r.dados, id: r.id_legado }));
      const examItems = ((exams.data ?? []) as Array<{ id_legado: string; nome: string; categoria: string; sinonimos: string[] | null }>)
        .map((r) => ({ id: r.id_legado, name: r.nome, category: r.categoria, synonyms: r.sinonimos ?? [] }) as unknown as ExamItem);
      const seen = new Set<string>();
      const pathologies: Pathology[] = [];
      for (const res of quadros as Array<{ data: Array<{ uid: string; nome: string; cid: string | null; categoria: string | null }> | null }>) {
        for (const r of res.data ?? []) {
          if (seen.has(r.uid)) continue;
          seen.add(r.uid);
          pathologies.push({ id: r.uid as unknown as number, name: r.nome, cid: r.cid ?? undefined, category: r.categoria ?? undefined, meds: [] });
        }
      }
      const entries = buildSearchEntries({ medications, pathologies, exams: examItems });
      const filtered = opts.kinds?.length ? entries.filter((e) => opts.kinds!.includes(e.kind)) : entries;
      return makeFuse(filtered).search(q, { limit }).map((r) => ({ ...r.item, score: r.score ?? 1 }));
    },
  });
};

/** @deprecated Use `useClinicalSearchQuery` — mantido sem carregar a base inteira. */
export const useClinicalSearch = (): ClinicalSearchAPI => ({
  isLoading: false,
  all: () => [],
  search: () => [],
});
