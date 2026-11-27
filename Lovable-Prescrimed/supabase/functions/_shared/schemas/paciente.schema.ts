// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas
import { z } from "npm:zod@3.23.8";

/** Regras únicas do paciente — formulário, documentos e gravação. */
const numeroBr = (min: number, max: number, rotulo: string) =>
  z.string().trim().refine((v) => {
    if (v === "") return true;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n >= min && n <= max;
  }, `${rotulo} fora do intervalo (${min}–${max})`);

export const pacienteSchema = z.object({
  patientName: z.string().trim().min(1, "Nome do paciente").max(200),
  isPediatric: z.boolean(),
  isPregnant: z.boolean().optional(),
  ageValue: numeroBr(0, 130, "Idade").optional(),
  ageUnit: z.enum(["meses", "anos"]).optional(),
  weight: numeroBr(0.3, 400, "Peso"),
  sex: z.enum(["", "feminino", "masculino", "outro"]).optional(),
  allergies: z.string().max(1000).optional(),
  renalFunction: z.enum(["", "normal", "leve", "moderada", "grave"]).optional(),
  notes: z.string().max(2000).optional(),
});

export type PacienteInput = z.input<typeof pacienteSchema>;

/** Paciente mínimo exigido por qualquer documento. */
export const pacienteDocumentoSchema = pacienteSchema.pick({
  patientName: true, isPediatric: true, weight: true,
});
