import { z } from "zod";

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

export const stampSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(80),
  crm: z.string().trim().regex(/^\d{1,8}$/, "CRM: apenas números"),
  uf: z.enum(UFS, { errorMap: () => ({ message: "Escolha a UF" }) }),
  especialidade: z.string().trim().max(60).optional().default(""),
  rqe: z.string().trim().max(12).optional().default(""),
  cargo: z.string().trim().max(60).optional().default(""),
  ativo: z.boolean().default(true),
});
export type StampConfig = z.infer<typeof stampSchema>;

/** Três linhas do carimbo; a terceira some quando não há especialidade/RQE/cargo. */
export function stampLines(c: Partial<StampConfig>): string[] {
  const l1 = (c.nome ?? "").trim();
  const l2 = c.crm?.trim() ? `CRM-${c.uf ?? ""} ${c.crm.trim()}` : "";
  const esp = [c.especialidade?.trim(), c.rqe?.trim() ? `RQE ${c.rqe.trim()}` : ""].filter(Boolean).join(" ");
  const l3 = [esp, c.cargo?.trim()].filter(Boolean).join(" · ");
  return [l1, l2, l3].filter(Boolean);
}
