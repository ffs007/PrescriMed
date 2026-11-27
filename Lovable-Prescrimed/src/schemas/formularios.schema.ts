import { z } from "zod";


const obrig = (msg: string) => z.string({ required_error: msg }).trim().min(1, msg);

export const feedbackSchema = z.object({ descricao: obrig("Descreva o feedback antes de enviar.") });
export const nomeModeloSchema = z.object({ nome: obrig("Nome obrigatório") });

const revisadoComFonte = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).passthrough().superRefine((v: any, ctx) => {
    if (v.status_revisao === "revisado" && !String(v.fonte_referencia ?? "").trim()) {
      ctx.addIssue({ code: "custom", path: ["fonte_referencia"], message: "Item revisado exige fonte de referência." });
    }
  });

export const modeloPrescricaoSchema = revisadoComFonte({ nome_modelo: obrig("Nome obrigatório") });
export const conjuntoRapidoSchema = z.object({ nome_conjunto: obrig("Nome obrigatório") }).passthrough();
export const protocoloFormSchema = revisadoComFonte({ nome_protocolo: obrig("Nome do protocolo é obrigatório") });
export const justificativaSchema = obrig("Justificativa necessária.");

export const cidComboSchema = z
  .object({ nome: obrig("Dê um nome ao combo."), principal: z.any(), associados: z.array(z.any()) })
  .refine((v) => !!v.principal || v.associados.length > 0, { message: "Selecione ao menos um CID." });
