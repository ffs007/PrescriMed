import { problemasDose, UNIDADES_POR_TIPO, type Severidade } from "@/schemas/dose.schema";

export { UNIDADES_POR_TIPO };
export type { Severidade };

export interface DoseRegistro {
  id: string;
  lote_id: string;
  linha_origem: string | null;
  principio_ativo: string | null;
  via: string | null;
  indicacao: string | null;
  populacao: string | null;
  dose_tipo: string | null;
  dose_min: string | null;
  dose_max: string | null;
  dose_unidade: string | null;
  fonte_id: string | null;
  versao?: number | null;
  status_revisao?: string | null;
}

export interface Inconsistencia {
  doseId: string;
  campo: string;
  severidade: Severidade;
  mensagem: string;
}

/** Toda regra vive em src/schemas/dose.schema.ts. */
export function validarDose(d: DoseRegistro): Inconsistencia[] {
  return problemasDose(d).map((p) => ({ doseId: d.id, ...p }));
}

export function validarLote(doses: DoseRegistro[]) {
  const todas = doses.flatMap(validarDose);
  return {
    inconsistencias: todas,
    porDose: todas.reduce<Record<string, Inconsistencia[]>>((acc, i) => {
      (acc[i.doseId] ||= []).push(i);
      return acc;
    }, {}),
    erros: todas.filter((i) => i.severidade === "erro").length,
    alertas: todas.filter((i) => i.severidade === "alerta").length,
  };
}
