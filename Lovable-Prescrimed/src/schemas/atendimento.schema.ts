import { z } from "zod";

export const AMBIENTES = ["ambulatorial", "urgencia", "pronto_socorro", "emergencia", "sala_vermelha"] as const;

/** Regras únicas do atendimento. */
export const atendimentoSchema = z.object({
  id: z.string().uuid().optional(),
  paciente_id: z.string().uuid().nullable().optional(),
  ambiente: z.string().trim().min(1, "Ambiente do atendimento"),
  paciente_nome: z.string().trim().min(1, "Nome do paciente").max(200),
  condicao_id: z.string().uuid().nullable().optional(),
  cid: z.string().trim().regex(/^([A-Z]\d{2}(\.\d{1,2})?)?$/i, "CID inválido").optional(),
  motivo: z.string().trim().max(2000).optional(),
}).passthrough();

export type AtendimentoInput = z.input<typeof atendimentoSchema>;
