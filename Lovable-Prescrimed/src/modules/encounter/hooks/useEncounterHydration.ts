/**
 * Preenche o estado das telas de documento a partir do atendimento em aberto.
 *
 * Regra: os dados do paciente e o ambiente vêm do atendimento; a tela não os
 * recoleta. O médico ainda pode ajustar no formulário — o atendimento é a
 * origem, não uma trava.
 */
import { useEffect, useRef } from "react";
import type { UsePatientReturn } from "@/modules/prescription/hooks/usePatient";
import type { ClinicalEnvironment } from "@/modules/prescription/types/prescription";
import { ageInYearsFrom, toClinicalEnvironment, useEncounterContext } from "../EncounterProvider";

export function useEncounterHydration(
  patient: UsePatientReturn,
  setEnvironment: (env: ClinicalEnvironment) => void,
) {
  const { encounter } = useEncounterContext();
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!encounter) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === encounter.id) return;
    hydratedFor.current = encounter.id;

    const p = encounter.paciente;
    patient.setPatientName(p.nome);
    if (p.sexo === "feminino" || p.sexo === "masculino" || p.sexo === "outro") patient.setSex(p.sexo);
    if (p.pesoKg !== null) patient.setWeight(String(p.pesoKg));
    if (p.alergias) patient.setAllergies(p.alergias);
    if (
      p.funcaoRenal === "normal" ||
      p.funcaoRenal === "leve" ||
      p.funcaoRenal === "moderada" ||
      p.funcaoRenal === "grave"
    ) {
      patient.setRenalFunction(p.funcaoRenal);
    }

    const idade = ageInYearsFrom(p.dataNascimento);
    if (idade !== null) {
      if (idade < 2) {
        patient.setAgeUnit("meses");
        patient.setAgeValue(String(Math.round(idade * 12)));
      } else {
        patient.setAgeUnit("anos");
        patient.setAgeValue(String(Math.floor(idade)));
      }
      patient.setIsPediatric(idade < 12);
    }

    setEnvironment(toClinicalEnvironment(encounter.ambiente));
  }, [encounter, patient, setEnvironment]);

  return encounter;
}
