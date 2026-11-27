import { useQuery } from "@tanstack/react-query";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";
import {
  listConditionAnamnesis,
  listConditionPhysicalExam,
  listConditionReferrals,
  listConditionTransfers,
} from "../services/conditionPillars";

const STALE = 5 * 60 * 1000;

export function useConditionPillars(
  conditionName: string | null | undefined,
  environment: ClinicalEnvironment,
) {
  const name = conditionName?.trim() ?? "";
  const enabled = name.length > 0;

  const anamnesis = useQuery({
    queryKey: ["condition-anamnesis", name, environment],
    queryFn: () => listConditionAnamnesis(name, environment),
    enabled,
    staleTime: STALE,
  });

  const physicalExam = useQuery({
    queryKey: ["condition-physical-exam", name, environment],
    queryFn: () => listConditionPhysicalExam(name, environment),
    enabled,
    staleTime: STALE,
  });

  const referrals = useQuery({
    queryKey: ["condition-referrals", name],
    queryFn: () => listConditionReferrals(name),
    enabled,
    staleTime: STALE,
  });

  const transfers = useQuery({
    queryKey: ["condition-transfers", name],
    queryFn: () => listConditionTransfers(name),
    enabled,
    staleTime: STALE,
  });

  return {
    anamnesis: anamnesis.data ?? [],
    physicalExam: physicalExam.data ?? [],
    referrals: referrals.data ?? [],
    transfers: transfers.data ?? [],
    isLoading:
      anamnesis.isLoading || physicalExam.isLoading || referrals.isLoading || transfers.isLoading,
    hasContent:
      (anamnesis.data?.length ?? 0) > 0 ||
      (physicalExam.data?.length ?? 0) > 0 ||
      (referrals.data?.length ?? 0) > 0 ||
      (transfers.data?.length ?? 0) > 0,
  };
}
