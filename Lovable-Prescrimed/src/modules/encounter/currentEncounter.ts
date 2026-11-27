/**
 * Leitura do atendimento em aberto fora do React.
 *
 * Usado pelas gravações de documento para amarrar tudo ao mesmo atendimento
 * sem que cada tela precise repassar o identificador.
 */
export const ENCOUNTER_STORAGE_KEY = "prescrimed:atendimento-atual";

export function currentEncounterId(): string | null {
  try {
    return localStorage.getItem(ENCOUNTER_STORAGE_KEY);
  } catch {
    return null;
  }
}
