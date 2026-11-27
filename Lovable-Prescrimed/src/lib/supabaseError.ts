/**
 * Tradução de erros do backend para mensagens de UI.
 * Distingue falta de permissão (usuário sem sessão/papel) de falha genérica.
 */
export type SupabaseLikeError = { code?: string | null; message?: string | null } | null | undefined;

export function isPermissionError(error: SupabaseLikeError): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    code === "42501" ||
    code === "PGRST301" ||
    code === "401" ||
    msg.includes("permission denied") ||
    msg.includes("jwt") ||
    msg.includes("row-level security")
  );
}

export function describeSupabaseError(error: SupabaseLikeError): string {
  if (!error) return "";
  if (isPermissionError(error)) {
    return "Você não tem permissão para ver estes dados. Faça login novamente ou solicite acesso ao administrador.";
  }
  return error.message || "Não foi possível carregar os dados. Tente novamente.";
}

export function describeAuthError(error: SupabaseLikeError): string {
  if (!error) return "";
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("unregistered api key") || message.includes("invalid api key")) {
    return "O acesso está temporariamente indisponível. Atualize a página; se persistir, avise o suporte.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.";
  }
  return error.message || "Não foi possível entrar. Tente novamente.";
}
