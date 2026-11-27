/**
 * Etapa D — quadros do ambiente filtrados, deduplicados e paginados no banco
 * (RPC fn_quadros_ambiente, até 50 por página). As páginas seguintes chegam em
 * segundo plano, sem travar a tela; a primeira já aparece sozinha.
 */
import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import type { ClinicalEnvironment, ClinicalSeverity, Pathology } from "../types/prescription";

const PAGE = 50;

type RpcRow = {
  total: number; uid: string; nome: string; cid: string | null; categoria: string | null;
  is_emergencia: boolean; sinonimos: string[] | null; meds: number[] | null;
  hospital_meds: string[] | null; subtypes: Pathology["subtypes"] | null;
  ambientes: ClinicalEnvironment[]; gravidade: ClinicalSeverity | null; especialidade: string | null;
  sistema: string | null; frequencia: number;
  gravidade_por_ambiente: Partial<Record<ClinicalEnvironment, ClinicalSeverity>> | null;
  frequencia_por_ambiente: Partial<Record<ClinicalEnvironment, number>> | null;
};

function stableId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return 700000 + (Math.abs(h) % 250000);
}

const toPathology = (r: RpcRow): Pathology => ({
  id: stableId(r.uid),
  uid: r.uid,
  name: r.nome,
  cid: r.cid ?? undefined,
  category: r.categoria ?? undefined,
  isEmergency: r.is_emergencia,
  synonyms: r.sinonimos ?? [],
  meds: r.meds ?? [],
  hospitalMeds: r.hospital_meds ?? undefined,
  subtypes: r.subtypes ?? undefined,
  environments: r.ambientes,
  severity: r.gravidade ?? undefined,
  specialty: r.especialidade ?? r.categoria ?? undefined,
  system: r.sistema ?? undefined,
  frequency: r.frequencia,
  severityByEnvironment: r.gravidade_por_ambiente ?? {},
  frequencyByEnvironment: r.frequencia_por_ambiente ?? {},
});

export function useEnvironmentPathologies(
  environment: ClinicalEnvironment | "todos",
  extra: Pathology[] = [],
  search = "",
  specialty = "todas",
) {
  const q = useInfiniteQuery({
    queryKey: ["quadros", "ambiente", environment, search, specialty],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabaseUntyped.rpc("fn_quadros_ambiente", {
        p_ambiente: environment, p_busca: search || null, p_limit: PAGE, p_offset: pageParam, p_especialidade: specialty === "todas" ? null : specialty,
      });
      if (error) throw error;
      return (data ?? []) as RpcRow[];
    },
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.length, 0);
      const total = last[0]?.total ?? 0;
      return last.length === PAGE && loaded < total ? loaded : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = q;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const pathologies = useMemo(() => {
    const list = (q.data?.pages ?? []).flat().map(toPathology);
    const names = new Set(list.map((p) => p.name.toLowerCase()));
    for (const p of extra) if (!names.has(p.name.toLowerCase())) list.push(p);
    return list;
  }, [q.data, extra]);

  return {
    pathologies,
    total: q.data?.pages[0]?.[0]?.total ?? 0,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
