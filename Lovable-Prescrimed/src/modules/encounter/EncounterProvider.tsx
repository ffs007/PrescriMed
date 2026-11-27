/**
 * Contexto global do atendimento em aberto.
 *
 * Fonte única de paciente + ambiente para todas as telas de documento.
 * O id do atendimento fica guardado no aparelho para sobreviver a recargas;
 * os dados em si vêm sempre do banco (TanStack Query).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeEncounter,
  getEncounter,
  listOpenEncounters,
  openEncounter,
  updateEncounter,
  updatePatient,
  type Encounter,
  type EncounterAmbiente,
  type EncounterPatch,
  type OpenEncounterInput,
  type PatientPatch,
} from "./services/encounters";

import { ENCOUNTER_STORAGE_KEY as STORAGE_KEY } from "./currentEncounter";
import { useMedicationOverlay } from "@/modules/prescription/hooks/useClinicalCatalog";

export interface EncounterContextValue {
  encounter: Encounter | null;
  encounterId: string | null;
  isLoading: boolean;
  openEncounters: Encounter[];
  start: (input: OpenEncounterInput) => Promise<Encounter>;
  select: (id: string | null) => void;
  patch: (p: EncounterPatch) => Promise<void>;
  patchPatient: (p: PatientPatch) => Promise<void>;
  close: () => Promise<void>;
}

const EncounterContext = createContext<EncounterContextValue | null>(null);

export function EncounterProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  // Carrega o detalhamento farmacológico do banco para o motor de regras.
  useMedicationOverlay();
  const [encounterId, setEncounterId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (encounterId) localStorage.setItem(STORAGE_KEY, encounterId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* armazenamento indisponível — o contexto segue apenas em memória */
    }
  }, [encounterId]);

  const { data: encounter, isLoading } = useQuery({
    queryKey: ["atendimento", encounterId],
    queryFn: () => getEncounter(encounterId as string),
    enabled: Boolean(encounterId),
    staleTime: 30 * 1000,
  });

  const { data: openList } = useQuery({
    queryKey: ["atendimentos", "abertos"],
    queryFn: () => listOpenEncounters(20),
    staleTime: 60 * 1000,
  });

  // Atendimento encerrado ou apagado noutro aparelho: limpa a referência.
  useEffect(() => {
    if (encounterId && !isLoading && encounter === null) setEncounterId(null);
  }, [encounterId, encounter, isLoading]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["atendimento"] });
    qc.invalidateQueries({ queryKey: ["atendimentos", "abertos"] });
  }, [qc]);

  const startMutation = useMutation({
    mutationFn: openEncounter,
    onSuccess: (created) => {
      setEncounterId(created.id);
      invalidate();
    },
  });

  const start = useCallback(
    (input: OpenEncounterInput) => startMutation.mutateAsync(input),
    [startMutation],
  );

  const patch = useCallback(
    async (p: EncounterPatch) => {
      if (!encounterId) return;
      await updateEncounter(encounterId, p);
      invalidate();
    },
    [encounterId, invalidate],
  );

  const patchPatient = useCallback(
    async (p: PatientPatch) => {
      if (!encounter) return;
      await updatePatient(encounter.pacienteId, p);
      invalidate();
    },
    [encounter, invalidate],
  );

  const close = useCallback(async () => {
    if (!encounterId) return;
    await closeEncounter(encounterId);
    setEncounterId(null);
    invalidate();
  }, [encounterId, invalidate]);

  const value = useMemo<EncounterContextValue>(
    () => ({
      encounter: encounter ?? null,
      encounterId,
      isLoading,
      openEncounters: openList ?? [],
      start,
      select: setEncounterId,
      patch,
      patchPatient,
      close,
    }),
    [encounter, encounterId, isLoading, openList, start, patch, patchPatient, close],
  );

  return <EncounterContext.Provider value={value}>{children}</EncounterContext.Provider>;
}

export function useEncounterContext(): EncounterContextValue {
  const ctx = useContext(EncounterContext);
  if (!ctx) throw new Error("useEncounterContext precisa estar dentro de EncounterProvider");
  return ctx;
}

/** Idade em anos (decimal) a partir da data de nascimento do paciente. */
export function ageInYearsFrom(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const born = new Date(dataNascimento);
  if (Number.isNaN(born.getTime())) return null;
  return (Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/** Ambiente do atendimento traduzido para o ambiente clínico das telas. */
export function toClinicalEnvironment(
  ambiente: EncounterAmbiente,
): "ambulatorial" | "urgencia" | "emergencia" {
  switch (ambiente) {
    case "ambulatorial":
      return "ambulatorial";
    case "emergencia":
    case "uti":
      return "emergencia";
    default:
      return "urgencia";
  }
}
