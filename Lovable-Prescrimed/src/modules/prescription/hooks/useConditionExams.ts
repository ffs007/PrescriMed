import { useQuery } from "@tanstack/react-query";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";
import { listConditionExams } from "../services/conditionExams";

export function useConditionExams(conditionName: string | null, environment: ClinicalEnvironment) {
  return useQuery({
    queryKey: ["condition-exams", conditionName, environment],
    queryFn: () => listConditionExams(conditionName ?? "", environment),
    enabled: Boolean(conditionName?.trim()),
    staleTime: 5 * 60 * 1000,
  });
}
