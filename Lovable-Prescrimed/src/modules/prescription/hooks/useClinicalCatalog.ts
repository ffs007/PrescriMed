/**
 * Hooks de leitura do catálogo clínico (banco como fonte única).
 */
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCuratedPathologies,
  fetchExamsLibrary,
  fetchLegacyMedications,
  fetchLegacyProtocols,
  fetchMedicationOverlay,
  type LegacyProtocol,
} from "../services/clinicalCatalog";
import { setMedicationOverlay } from "../data/medicationOverlay";

const STALE = 10 * 60 * 1000;

export const legacyMedicationsQueryKey = ["catalogo", "medicamentos-legado"] as const;
export const curatedPathologiesQueryKey = ["catalogo", "patologias-legado"] as const;
export const examsLibraryQueryKey = ["catalogo", "exames"] as const;
export const legacyProtocolsQueryKey = ["catalogo", "protocolos-legado"] as const;
export const medicationOverlayQueryKey = ["catalogo", "medicamentos-overlay"] as const;

export function useLegacyMedicationsQuery() {
  return useQuery({
    queryKey: legacyMedicationsQueryKey,
    queryFn: fetchLegacyMedications,
    staleTime: STALE,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCuratedPathologiesQuery() {
  return useQuery({
    queryKey: curatedPathologiesQueryKey,
    queryFn: fetchCuratedPathologies,
    staleTime: STALE,
    gcTime: 30 * 60 * 1000,
  });
}

export function useExamsLibrary() {
  const query = useQuery({
    queryKey: examsLibraryQueryKey,
    queryFn: fetchExamsLibrary,
    staleTime: STALE,
  });
  return { exams: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useLegacyProtocolsQuery() {
  return useQuery({
    queryKey: legacyProtocolsQueryKey,
    queryFn: fetchLegacyProtocols,
    staleTime: STALE,
  });
}

/** Protocolo curado de uma condição (ou undefined quando não houver). */
export function usePathologyProtocol(pathologyId: number | null | undefined) {
  const { data, isLoading } = useLegacyProtocolsQuery();
  const protocol = useMemo<LegacyProtocol | undefined>(
    () => (pathologyId ? (data ?? []).find((p) => p.pathologyId === pathologyId) : undefined),
    [data, pathologyId],
  );
  return { protocol, isLoading, hasProtocol: Boolean(protocol) };
}

/**
 * Carrega o detalhamento farmacológico e registra no motor de regras.
 * Deve ser montado uma única vez, no topo da aplicação.
 */
export function useMedicationOverlay() {
  const query = useQuery({
    queryKey: medicationOverlayQueryKey,
    queryFn: fetchMedicationOverlay,
    staleTime: STALE,
    gcTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) setMedicationOverlay(query.data);
  }, [query.data]);

  return { isLoading: query.isLoading, count: query.data?.length ?? 0 };
}
