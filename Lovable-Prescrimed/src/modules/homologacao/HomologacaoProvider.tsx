import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { setHomologacao } from "./state";

const Ctx = createContext<{ ativo: boolean; refresh: () => void }>({ ativo: false, refresh: () => {} });

export function HomologacaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["homologacao-ativo", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_em_homologacao" as never);
      if (error) throw error;
      return Boolean(data);
    },
  });
  const ativo = !!user && !!data;
  useEffect(() => {
    setHomologacao(ativo);
    document.documentElement.classList.toggle("homologacao", ativo);
  }, [ativo]);
  return (
    <Ctx.Provider value={{ ativo, refresh: () => qc.invalidateQueries({ queryKey: ["homologacao-ativo"] }) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useHomologacao = () => useContext(Ctx);

export function useHomologacaoState() {
  const [v, setV] = useState(false);
  const { ativo } = useHomologacao();
  useEffect(() => setV(ativo), [ativo]);
  return v;
}
