import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { diasRestantes, IA_LIMITE_DIA, IA_LIMITE_TOTAL, temAcesso, type AcessoStatus } from "../acesso";

export function useAcesso() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["acesso", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AcessoStatus> => {
      const { data, error } = await supabase.rpc("fn_acesso_status_self");
      if (error) throw error;
      return data as unknown as AcessoStatus;
    },
  });
  const { refetch } = q;
  useEffect(() => {
    const h = () => void refetch();
    window.addEventListener("psx-acesso-refresh", h);
    return () => window.removeEventListener("psx-acesso-refresh", h);
  }, [refetch]);
  return q;
}

export default function RequireAccess({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useAcesso();
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el) { root.style.removeProperty("--trial-bar-h"); return; }
    const ro = new ResizeObserver(() => root.style.setProperty("--trial-bar-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--trial-bar-h"); };
  });
  if (isLoading) return null;
  // Falha ao ler o status não deve derrubar o plantão; o servidor continua barrando.
  if (isError || !data) return <>{children}</>;

  if (!temAcesso(data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <Lock className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-foreground">Seu teste terminou</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Os 7 dias grátis acabaram. Seus documentos e dados estão guardados e voltam assim que você assinar.
          </p>
          <Button asChild className="mt-6"><Link to="/app/assinatura">Ver planos</Link></Button>
        </div>
      </div>
    );
  }

  if (data.assinante) return <>{children}</>;

  const dias = diasRestantes(data.trial_ends_at);
  const urgente = dias <= 2;
  const iaAcabou = data.ia_total >= IA_LIMITE_TOTAL;
  return (
    <>
      <div ref={barRef} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-sm ${urgente ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground"}`}>
        <span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4" aria-hidden="true" />Teste grátis: {dias === 1 ? "falta 1 dia" : `faltam ${dias} dias`}</span>
        <span className="flex items-center gap-1.5 opacity-90"><Sparkles className="h-4 w-4" aria-hidden="true" />
          {iaAcabou ? "IA do teste esgotada" : `IA: ${data.ia_total} de ${IA_LIMITE_TOTAL} · hoje ${data.ia_hoje} de ${IA_LIMITE_DIA}`}
        </span>
        <Button asChild size="sm" variant="secondary" className="ml-auto h-7">
          <Link to="/app/assinatura">{iaAcabou ? "Assinar para IA ilimitada" : "Assinar"}</Link>
        </Button>
      </div>
      {children}
    </>
  );
}
