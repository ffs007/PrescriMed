import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useHomologacao } from "./HomologacaoProvider";
import { logHomologacao } from "./state";

export default function HomologacaoBanner() {
  const { ativo } = useHomologacao();
  const { pathname } = useLocation();
  useEffect(() => {
    if (ativo) logHomologacao({ acao: "tela_aberta", tela: pathname });
  }, [ativo, pathname]);
  if (!ativo) return null;
  return (
    <div role="alert" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-destructive-foreground print:hidden">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      Ambiente de homologação — dados de teste
    </div>
  );
}
