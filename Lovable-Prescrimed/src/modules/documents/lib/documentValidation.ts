// Conferência antes da assinatura — regras em src/schemas/documento.schema.ts.
import type { DocumentBundle, DocumentosSettings, PacienteInfo, AssinaturaPerfil } from "./types";
import { emissaoSchema, pendencias } from "@/schemas/documento.schema";

export interface ValidationResult {
  ok: boolean;
  pendencias: string[];
}

export function validateBundle(
  bundle: DocumentBundle,
  paciente: PacienteInfo,
  perfil: AssinaturaPerfil | null,
  settings: DocumentosSettings | null,
): ValidationResult {
  const pend = pendencias(emissaoSchema, {
    perfil,
    paciente: paciente ?? {},
    tipo: bundle.tipo,
    itens: bundle.itens,
    exigirControle: Boolean(settings?.exigir_dados_completos_controle_especial),
  });
  return { ok: pend.length === 0, pendencias: pend };
}
