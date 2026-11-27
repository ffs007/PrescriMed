/**
 * Etapa D — registro sob demanda dos medicamentos da prescrição.
 * Nada de carregar a base inteira: só busca no banco os IDs realmente usados
 * (itens selecionados ou receita de um quadro) e guarda os que chegam prontos
 * das sugestões/busca.
 */
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Medication } from "@/types/prescription";
import { fetchLegacyMedicationsByIds } from "../services/clinicalCatalog";

const key = (ids: number[]) => ["medications", "by_ids", ids] as const;

export function useMedicationRegistry(selectedIds: number[], extra: Medication[] = []) {
  const qc = useQueryClient();
  const [known, setKnown] = useState<Map<number, Medication>>(() => new Map());

  const missing = useMemo(
    () => Array.from(new Set(selectedIds.filter((id) => id > 0 && !known.has(id)))).sort((a, b) => a - b),
    [selectedIds, known],
  );

  const { data: fetched } = useQuery({
    queryKey: key(missing),
    queryFn: () => fetchLegacyMedicationsByIds(missing),
    enabled: missing.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const register = useCallback((meds: Medication[]) => {
    setKnown((prev) => {
      const next = new Map(prev);
      meds.forEach((m) => next.set(m.id, m));
      return next;
    });
  }, []);

  const ensure = useCallback(
    async (ids: number[]): Promise<Medication[]> => {
      const need = ids.filter((id) => !known.has(id));
      const got = need.length
        ? await qc.fetchQuery({ queryKey: key([...need].sort((a, b) => a - b)), queryFn: () => fetchLegacyMedicationsByIds(need) })
        : [];
      register(got);
      const map = new Map(known);
      got.forEach((m) => map.set(m.id, m));
      extra.forEach((m) => map.set(m.id, m));
      return ids.map((id) => map.get(id)).filter(Boolean) as Medication[];
    },
    [known, qc, register, extra],
  );

  const medications = useMemo(() => {
    const map = new Map(known);
    (fetched ?? []).forEach((m) => map.set(m.id, m));
    extra.forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [known, fetched, extra]);

  return { medications, register, ensure };
}
