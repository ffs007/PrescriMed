import { z } from "zod";

export const UNIDADES_POR_TIPO: Record<string, string[]> = {
  peso: ["mg/kg", "mcg/kg", "mcg/kg/min", "mg/kg/h", "mcg/kg/h", "mL/kg", "UI/kg", "g/kg"],
  fixa: ["mg", "mcg", "g", "mL", "mEq", "UI", "mcg/min", "mg/h", "mg/min", "mL/h", "gotas/min"],
};
export const TODAS_UNIDADES = [...UNIDADES_POR_TIPO.peso, ...UNIDADES_POR_TIPO.fixa];

export type Severidade = "erro" | "alerta";

const vazio = (v: unknown) => v == null || String(v).trim() === "";
const numero = (v: unknown): number | null => {
  if (vazio(v)) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const OBRIGATORIOS: Array<[string, string]> = [
  ["principio_ativo", "Princípio ativo"],
  ["via", "Via"],
  ["populacao", "População"],
  ["dose_tipo", "Tipo de dose"],
  ["dose_unidade", "Unidade"],
  ["fonte_id", "Fonte"],
];

/**
 * Regra única de dose — revisão, importação e gravação.
 * Issues com params.severidade = "alerta" são avisos; as demais bloqueiam.
 */
export const doseSchema = z.record(z.unknown()).superRefine((d, ctx) => {
  const add = (campo: string, message: string, severidade: Severidade = "erro") =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message, params: { severidade } });

  for (const [campo, rotulo] of OBRIGATORIOS) if (vazio(d[campo])) add(campo, `${rotulo} é obrigatório.`);

  const min = numero(d.dose_min);
  const max = numero(d.dose_max);
  for (const [campo, rotulo, n] of [["dose_min", "Dose mínima", min], ["dose_max", "Dose máxima", max]] as const) {
    if (vazio(d[campo])) add(campo, `${rotulo} é obrigatória.`);
    else if (n === null) add(campo, `${rotulo} não é um número válido.`);
    else if (n < 0) add(campo, `${rotulo} não pode ser negativa.`);
  }
  if (min !== null && max !== null && min > max)
    add("dose_max", `Valores invertidos: mínima (${min}) maior que máxima (${max}).`);
  if (min !== null && max !== null && max > 0 && min > 0 && max / min > 100)
    add("dose_max", "Intervalo entre mínima e máxima muito amplo (>100x) — confirmar unidade.", "alerta");

  const unidade = String(d.dose_unidade ?? "").trim();
  if (unidade) {
    if (!TODAS_UNIDADES.includes(unidade)) add("dose_unidade", `Unidade "${unidade}" fora da lista padronizada.`, "alerta");
    const porPeso = unidade.includes("/kg");
    if (d.dose_tipo === "peso" && !porPeso) add("dose_unidade", `Dose por peso deve usar unidade por kg (recebido "${unidade}").`);
    if (d.dose_tipo === "fixa" && porPeso) add("dose_unidade", `Dose fixa não deve usar unidade por kg (recebido "${unidade}").`);
  }
});

export interface DoseIssue { campo: string; severidade: Severidade; mensagem: string }

export function problemasDose(data: unknown): DoseIssue[] {
  const r = doseSchema.safeParse(data);
  if (r.success) return [];
  return r.error.issues.map((i) => ({
    campo: String(i.path[0] ?? ""),
    severidade: ((i as { params?: { severidade?: Severidade } }).params?.severidade ?? "erro"),
    mensagem: i.message,
  }));
}

/** true quando não há erros bloqueantes (avisos permitem salvar). */
export const doseGravavel = (data: unknown) => problemasDose(data).every((p) => p.severidade !== "erro");
