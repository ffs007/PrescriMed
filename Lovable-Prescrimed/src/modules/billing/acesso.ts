// Regras do teste grátis (valores espelham fn_consumir_ia no banco).
export const TRIAL_DIAS = 7;
export const IA_LIMITE_TOTAL = 30;
export const IA_LIMITE_DIA = 8;

export type AcessoStatus = {
  assinante: boolean;
  em_trial: boolean;
  trial_ends_at: string | null;
  ia_total: number;
  ia_hoje: number;
};

export function diasRestantes(trialEndsAt: string | null, now = Date.now()): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - now;
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

export function temAcesso(s: AcessoStatus | null | undefined, now = Date.now()): boolean {
  if (!s) return false;
  return s.assinante || diasRestantes(s.trial_ends_at, now) > 0;
}

/** Espelho no cliente da regra do servidor, para mensagens e testes. */
export function podeUsarIA(s: AcessoStatus, now = Date.now()): "ok" | "trial-ia-limit" | "trial-ia-limit-dia" | "sem-acesso" {
  if (s.assinante) return "ok";
  if (diasRestantes(s.trial_ends_at, now) <= 0) return "sem-acesso";
  if (s.ia_total >= IA_LIMITE_TOTAL) return "trial-ia-limit";
  if (s.ia_hoje >= IA_LIMITE_DIA) return "trial-ia-limit-dia";
  return "ok";
}
